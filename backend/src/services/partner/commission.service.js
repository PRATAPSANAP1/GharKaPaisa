const { query, getClient } = require('../../config/db');
const { logAction } = require('../analytics/audit.service.js');
const { creditHold, releaseHold } = require('../wallet/wallet.service.js');

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
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { rows: [app] } = await client.query(`
      SELECT * FROM applications WHERE id = $1 FOR UPDATE
    `, [applicationId]);

    if (!app) throw new Error('Application not found');
    if (app.commission_status === 'rejected') throw new Error('Commission already reversed');
    if (!app.commission_amount || parseFloat(app.commission_amount) <= 0) {
      throw new Error('No commission to reverse');
    }

    const amount = parseFloat(app.commission_amount);
    const partnerId = app.Partner_id;
    const priorStatus = app.commission_status;

    const { rows: [wallet] } = await client.query(`
      SELECT id, hold_balance, available_balance, total_earned
      FROM wallets WHERE Partner_id = $1 FOR UPDATE
    `, [partnerId]);
    if (!wallet) throw new Error('Wallet not found');

    if (priorStatus === 'pending') {
      if (parseFloat(wallet.hold_balance) < amount) {
        throw new Error(`Insufficient hold balance for reversal. Hold: ₹${wallet.hold_balance}`);
      }

      await client.query(`
        UPDATE wallets SET
          hold_balance = hold_balance - $1,
          last_updated = NOW()
        WHERE Partner_id = $2
      `, [amount, partnerId]);

      await client.query(`
        UPDATE wallet_transactions SET
          status = 'rejected',
          processed_at = NOW(),
          processed_by = $1,
          description = COALESCE(description, '') || ' [Reversed]'
        WHERE application_id = $2 AND type = 'credit' AND status IN ('pending', 'approved')
      `, [adminUserId, applicationId]);
    } else if (priorStatus === 'approved' || priorStatus === 'processed') {
      if (parseFloat(wallet.available_balance) < amount) {
        throw new Error(`Insufficient available balance for reversal. Available: ₹${wallet.available_balance}`);
      }

      await client.query(`
        UPDATE wallets SET
          available_balance = available_balance - $1,
          total_earned = GREATEST(0, total_earned - $1),
          last_updated = NOW()
        WHERE Partner_id = $2
      `, [amount, partnerId]);

      await client.query(`
        INSERT INTO wallet_transactions (
          wallet_id, partner_id, application_id, type, amount, status, description,
          reference_type, reference_id, processed_by, processed_at
        ) VALUES ($1, $2, $3, 'debit', $4, 'approved', $5, 'commission_reversal', $6, $7, NOW())
      `, [
        wallet.id,
        partnerId,
        applicationId,
        amount,
        `Commission reversed for App ${app.app_number}${reason ? `: ${reason}` : ''}`,
        applicationId,
        adminUserId,
      ]);
    } else {
      throw new Error(`Cannot reverse commission in status: ${priorStatus}`);
    }

    await client.query(`
      UPDATE applications SET
        commission_status = 'rejected',
        rejection_reason = COALESCE($2, rejection_reason),
        updated_at = NOW()
      WHERE id = $1
    `, [applicationId, reason || null]);

    await logAction(adminUserId, 'REVERSE_COMMISSION', applicationId, {
      reason,
      amount,
      prior_status: priorStatus,
    });

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
