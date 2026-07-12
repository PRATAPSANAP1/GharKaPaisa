const { query, getClient } = require('../../config/database');
const { logAction } = require('../admin/audit.service.js');
const { creditHold, releaseHold } = require('../wallet/service.js');

const calculatePartnerCommission = async (productId, partnerId, loanAmount) => {
  // Check if there is a global commission rule for this product
  let { rows: [rule] } = await query(`
    SELECT id, partner_percentage, parent_percentage
    FROM commission_rules
    WHERE product_id = $1 AND status = 'active'
    AND (effective_to IS NULL OR effective_to >= NOW())
    ORDER BY created_at DESC LIMIT 1
  `, [productId]);

  // Fallback to legacy structure if no rule found
  if (!rule) {
    let { rows: [structure] } = await query(`
      SELECT commission_type, commission_value 
      FROM commission_structures 
      WHERE product_id = $1 AND partner_id = $2 AND effective_to IS NULL
    `, [productId, partnerId]);

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
  }

  // If using commission_rules, we calculate the TOTAL commission pool based on the product's base commission structure.
  // Wait, the user didn't specify base commission in commission_rules, just the split!
  // So we still need the product's base commission value!
  const { rows: [product] } = await query(`
    SELECT commission_type, commission_value FROM products WHERE id = $1
  `, [productId]);
  
  if (!product) return 0;

  const value = parseFloat(product.commission_value);
  let totalPool = value;
  if (product.commission_type === 'percentage') {
    totalPool = parseFloat(((loanAmount * value) / 100).toFixed(2));
  }

  // The actual split is done during creditCommission, so calculatePartnerCommission returns the totalPool.
  return totalPool;
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
    await releaseHold(app.partner_id, app.commission_amount, {
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

    const partnerId = app.partner_id;

    const { rows: [wallet] } = await client.query(`
      SELECT id FROM partner_wallets WHERE partner_id = $1 FOR UPDATE
    `, [partnerId]);
    if (!wallet) throw new Error('Wallet not found');

    // Reject pending transactions, or insert REVERSAL for completed ones.
    const { rows: txns } = await client.query(`
      SELECT id, status, credit, transaction_type, partner_id 
      FROM wallet_ledger 
      WHERE application_id = $1 AND transaction_type IN ('PERSONAL_COMMISSION', 'TEAM_COMMISSION')
    `, [applicationId]);

    for (const txn of txns) {
      if (txn.status === 'pending') {
        await client.query(`
          UPDATE wallet_ledger SET
            status = 'rejected',
            created_by = $1,
            description = COALESCE(description, '') || ' [Reversed]'
          WHERE id = $2
        `, [adminUserId, txn.id]);
      } else if (txn.status === 'completed') {
        // Insert REVERSAL
        await client.query(`
          INSERT INTO wallet_ledger (
            wallet_id, partner_id, application_id, transaction_type, credit, debit, description, status, created_by
          ) VALUES ($1, $2, $3, 'REVERSAL', 0, $4, $5, 'completed', $6)
        `, [
          wallet.id, txn.partner_id, applicationId, txn.credit, 
          `Commission reversed for App ${app.app_number}${reason ? `: ${reason}` : ''}`,
          adminUserId
        ]);
      }
    }

    // Sync balance for main partner
    const { syncWalletBalance } = require('../wallet/service.js');
    await syncWalletBalance(partnerId, client);

    // Sync balance for parent partner if they got team commission
    const parentTxn = txns.find(t => t.transaction_type === 'TEAM_COMMISSION');
    if (parentTxn) {
      await syncWalletBalance(parentTxn.partner_id, client);
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
      amount: app.commission_amount,
      prior_status: app.commission_status,
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
