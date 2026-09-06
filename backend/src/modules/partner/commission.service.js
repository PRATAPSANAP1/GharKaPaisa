const { query, getClient } = require('../../config/database');
const { logAction } = require('../admin/audit.service.js');
const { creditHold, releaseHold } = require('../wallet/service.js');

const calculatePartnerCommission = async (productId, partnerId, loanAmount, client = null) => {
  const queryFn = (client && typeof client.query === 'function')
    ? (text, params) => client.query(text, params)
    : query;

  // Check if there is a global commission rule for this product
  let { rows: [rule] } = await queryFn(`
    SELECT id, partner_percentage, parent_percentage
    FROM commission_rules
    WHERE product_id = $1 AND status = 'active'
    AND (effective_to IS NULL OR effective_to >= NOW())
    ORDER BY created_at DESC LIMIT 1
  `, [productId]);

  // Fallback to legacy structure if no rule found
  if (!rule) {
    let { rows: [structure] } = await queryFn(`
      SELECT commission_type, commission_value 
      FROM commission_structures 
      WHERE product_id = $1 AND partner_id = $2 AND effective_to IS NULL
    `, [productId, partnerId]);

    if (!structure) {
      const { rows: [product] } = await queryFn(`
        SELECT commission_type, commission_value FROM products WHERE id = $1
      `, [productId]);
      structure = product;
    }

    if (!structure) return 0;

    const value = structure.commission_value || 0;
    if (structure.commission_type === 'percentage') {
      const { rows: [calc] } = await queryFn(`
        SELECT ROUND(($1::numeric * $2::numeric / 100.0), 2)::numeric(15,2) as val
      `, [loanAmount, value]);
      return calc ? calc.val : '0.00';
    }
    return value; // flat
  }

  // If using commission_rules, we calculate the TOTAL commission pool based on the product's base commission structure.
  const { rows: [product] } = await queryFn(`
    SELECT commission_type, commission_value FROM products WHERE id = $1
  `, [productId]);
  
  if (!product) return '0.00';

  const value = product.commission_value || 0;
  let totalPool = value;
  if (product.commission_type === 'percentage') {
    const { rows: [calc] } = await queryFn(`
      SELECT ROUND(($1::numeric * $2::numeric / 100.0), 2)::numeric(15,2) as val
    `, [loanAmount, value]);
    totalPool = calc ? calc.val : '0.00';
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
    
    // Release the hold from the wallet with idempotency check
    const relRes = await releaseHold(app.partner_id, app.commission_amount, {
      reference_type: 'commission',
      reference_id: app.id,
      description: `Commission released for App ${app.app_number}`
    }, client);

    if (relRes && relRes.alreadyReleased) {
      await client.query('COMMIT');
      return { alreadyReleased: true };
    }
    
    // Update application status
    await client.query(`
      UPDATE applications SET commission_status = 'processed', updated_at = NOW() WHERE id = $1
    `, [app.id]);
    
    await logAction(adminUserId, 'RELEASE_COMMISSION', app.id, { amount: app.commission_amount }, null, null, client);
    
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
      if (txn.status === 'Pending Approval') {
        await client.query(`
          INSERT INTO wallet_ledger (
            wallet_id, partner_id, application_id, transaction_type, credit, debit, description, status, created_by
          ) VALUES ($1, $2, $3, 'COMMISSION_REJECTED'::ledger_transaction_type, 0, 0, $4, 'Released', $5)
        `, [
          wallet.id, txn.partner_id, applicationId,
          `Pending commission rejected for App ${app.app_number}${reason ? `: ${reason}` : ''}`,
          adminUserId
        ]);
      } else if (txn.status === 'Released') {
        // Insert REVERSAL
        await client.query(`
          INSERT INTO wallet_ledger (
            wallet_id, partner_id, application_id, transaction_type, credit, debit, description, status, created_by
          ) VALUES ($1, $2, $3, 'REVERSAL', 0, $4, $5, 'Released', $6)
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
    }, null, null, client);

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
