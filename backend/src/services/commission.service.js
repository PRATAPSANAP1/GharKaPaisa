const { query, getClient } = require('../config/db');
const { logAction } = require('./audit.service');
const { creditHold, releaseHold } = require('./wallet.service');

const calculatePartnerCommission = async (productId, partnerId, loanAmount) => {
  // First check if there is a custom commission structure for this partner + product
  let { rows: [structure] } = await query(`
    SELECT commission_type, commission_value 
    FROM commission_structures 
    WHERE product_id = $1 AND Partner_id = $2 AND effective_to IS NULL
  `, [productId, partnerId]);

  // Fallback to global product commission
  if (!structure) {
    const { rows: [product] } = await query(`
      SELECT commission_type, commission_value FROM products WHERE id = $1
    `, [productId]);
    structure = product;
  }

  if (!structure) return 0;

  const value = parseFloat(structure.commission_value);
  if (structure.commission_type === 'percentage') {
    return parseFloat(((loanAmount * value) / 100).toFixed(2));
  }
  return value; // flat
};

const releaseCommission = async (applicationId, adminUserId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    const { rows: [app] } = await client.query(`
      SELECT * FROM applications WHERE id = $1 FOR UPDATE
    `, [applicationId]);
    
    if (!app) throw new Error('Application not found');
    if (app.commission_status === 'processed') throw new Error('Commission already processed');
    if (!app.commission_amount || app.commission_amount <= 0) throw new Error('No commission to release');
    
    // Release the hold from the wallet
    await releaseHold(app.Partner_id, app.commission_amount, {
      reference_type: 'commission',
      reference_id: app.id,
      description: `Commission released for App ${app.app_number}`
    });
    
    // Update application status
    await client.query(`
      UPDATE applications SET commission_status = 'processed', updated_at = NOW() WHERE id = $1
    `, [app.id]);
    
    await logAction(adminUserId, 'RELEASE_COMMISSION', app.id, { amount: app.commission_amount });
    
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const reverseCommission = async (applicationId, adminUserId, reason) => {
  // In case of a chargeback or rejection after approval
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    const { rows: [app] } = await client.query(`
      SELECT * FROM applications WHERE id = $1 FOR UPDATE
    `, [applicationId]);
    
    if (!app) throw new Error('Application not found');
    
    // TODO: Depending on if it was in 'hold' or 'processed', we deduct from available or hold.
    // Assuming for now it's a simple rejection before release:
    if (app.commission_status === 'pending') {
      await client.query(`
        UPDATE wallets SET hold_balance = GREATEST(0, hold_balance - $1) WHERE Partner_id = $2
      `, [app.commission_amount, app.Partner_id]);
      
      await client.query(`
        UPDATE applications SET commission_status = 'rejected', updated_at = NOW() WHERE id = $1
      `, [app.id]);
    }
    
    await logAction(adminUserId, 'REVERSE_COMMISSION', app.id, { reason, amount: app.commission_amount });
    
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  calculatePartnerCommission,
  releaseCommission,
  reverseCommission
};
