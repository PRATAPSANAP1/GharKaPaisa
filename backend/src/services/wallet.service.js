const { query, getClient } = require('../config/db');
const { notify } = require('./notification.service');
const logger = require('../utils/logger');

// Ensure wallet exists for partner (called on partner approval)
const ensureWallet = async (PartnerId) => {
  await query(`
    INSERT INTO wallets (Partner_id) VALUES ($1)
    ON CONFLICT (Partner_id) DO NOTHING
  `, [PartnerId]);
};

// Credit commission to partner wallet (with transaction)
const creditCommission = async (PartnerId, applicationId, amount, description, userId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Guard against duplicate commission credits
    const { rows: [app] } = await client.query(
      `SELECT commission_status FROM applications WHERE id = $1`, [applicationId]
    );
    if (app && (app.commission_status === 'pending' || app.commission_status === 'approved' || app.commission_status === 'processed')) {
      throw new Error(`Commission already credited for application ${applicationId}`);
    }

    // Get wallet
    const { rows: [wallet] } = await client.query(
      `SELECT id, pending_amount, available_balance, total_earned FROM wallets WHERE Partner_id = $1 FOR UPDATE`,
      [PartnerId]
    );
    if (!wallet) throw new Error('Wallet not found for partner');

    // Add to pending first (commission hold for 48hrs)
    await client.query(`
      UPDATE wallets SET
        pending_amount = pending_amount + $1,
        total_earned = total_earned + $1,
        last_updated = NOW()
      WHERE Partner_id = $2
    `, [amount, PartnerId]);

    // Log txn with release_at timestamp
    const holdHours = parseInt(process.env.COMMISSION_CREDIT_HOLD_HOURS || 48);
    const { rows: [txn] } = await client.query(`
      INSERT INTO wallet_transactions (wallet_id, application_id, txn_type, amount, status, description, processed_by, release_at)
      VALUES ($1, $2, 'credit', $3, 'pending', $4, $5, NOW() + INTERVAL '${holdHours} hours')
      RETURNING id
    `, [wallet.id, applicationId, amount, description, userId]);

    // Update application commission status
    await client.query(`
      UPDATE applications SET commission_amount = $1, commission_status = 'pending' WHERE id = $2
    `, [amount, applicationId]);

    await client.query('COMMIT');

    logger.info(`Commission ₹${amount} credited (pending) to partner ${PartnerId}`);
    return txn;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('creditCommission failed', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// Move from pending → available (after hold period)
const releaseCommission = async (PartnerId, walletId, txnId, amount) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query(`
      UPDATE wallets SET
        pending_amount = GREATEST(0, pending_amount - $1),
        available_balance = available_balance + $1,
        last_updated = NOW()
      WHERE Partner_id = $2
    `, [amount, PartnerId]);
    await client.query(`UPDATE wallet_transactions SET status = 'approved', processed_at = NOW() WHERE id = $1`, [txnId]);
    // Update application commission_status to approved
    await client.query(`
      UPDATE applications SET commission_status = 'approved' 
      WHERE id = (SELECT application_id FROM wallet_transactions WHERE id = $1)
    `, [txnId]);
    await client.query('COMMIT');

    // Get user_id for notification
    const { rows: [Partner] } = await query(`SELECT user_id FROM Partner_profiles WHERE id = $1`, [PartnerId]);
    try {
      if (Partner) await notify.commissionCredited(Partner.user_id, amount);
    } catch (notifyErr) {
      logger.error('Commission notify failed', { error: notifyErr.message });
    }
    logger.info(`Commission ₹${amount} released to available for partner ${PartnerId}`);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('releaseCommission failed', err.message);
  } finally {
    client.release();
  }
};

// Process withdrawal request
const processWithdrawal = async (withdrawalId, approved, processedBy, utrNumber = null, rejectionReason = null) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { rows: [wr] } = await client.query(
      `SELECT wr.*, w.id as wallet_id FROM withdrawal_requests wr
       JOIN wallets w ON w.Partner_id = wr.Partner_id WHERE wr.id = $1 FOR UPDATE`,
      [withdrawalId]
    );
    if (!wr) throw new Error('Withdrawal request not found');
    if (wr.status !== 'pending') throw new Error('Withdrawal already processed');

    if (approved) {
      // Increment total_withdrawn only (available balance is already deducted at request time)
      await client.query(`
        UPDATE wallets SET
          total_withdrawn = total_withdrawn + $1,
          last_updated = NOW()
        WHERE id = $2
      `, [wr.amount, wr.wallet_id]);

      // Log debit txn
      await client.query(`
        INSERT INTO wallet_transactions (wallet_id, txn_type, amount, status, description, processed_by, processed_at)
        VALUES ($1, 'debit', $2, 'processed', 'Withdrawal processed', $3, NOW())
      `, [wr.wallet_id, wr.amount, processedBy]);

      await client.query(`
        UPDATE withdrawal_requests SET status = 'processed', utr_number = $1, processed_by = $2, processed_at = NOW(), updated_at = NOW()
        WHERE id = $3
      `, [utrNumber, processedBy, withdrawalId]);
    } else {
      // Reject — refund to available
      await client.query(`
        UPDATE wallets SET available_balance = available_balance + $1, last_updated = NOW() WHERE id = $2
      `, [wr.amount, wr.wallet_id]);
      await client.query(`
        UPDATE withdrawal_requests SET status = 'rejected', rejection_reason = $1, processed_by = $2, processed_at = NOW(), updated_at = NOW()
        WHERE id = $3
      `, [rejectionReason, processedBy, withdrawalId]);
    }

    await client.query('COMMIT');

    // Notify Partner
    const { rows: [Partner] } = await query(`SELECT user_id FROM Partner_profiles WHERE id = $1`, [wr.Partner_id]);
    if (Partner) {
      try {
        approved
          ? await notify.withdrawalApproved(Partner.user_id, wr.amount)
          : await notify.withdrawalRejected(Partner.user_id, wr.amount, rejectionReason);
      } catch (notifyErr) {
        logger.error('Withdrawal notify failed', { error: notifyErr.message });
      }
    }

    logger.info(`Withdrawal ${withdrawalId} ${approved ? 'approved' : 'rejected'}`);
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('processWithdrawal failed', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// Get full wallet summary for a Partner
const getWalletSummary = async (PartnerId) => {
  const { rows: [wallet] } = await query(`
    SELECT id, Partner_id, total_earned, total_withdrawn, pending_amount, available_balance, last_updated
    FROM wallets WHERE Partner_id = $1
  `, [PartnerId]);
  return wallet;
};

// Release matured commissions scheduler check
const releaseMaturedCommissions = async () => {
  try {
    const { rows } = await query(`
      SELECT wt.id, wt.wallet_id, wt.amount, w.Partner_id as partner_id
      FROM wallet_transactions wt
      JOIN wallets w ON w.id = wt.wallet_id
      WHERE wt.status = 'pending' AND wt.txn_type = 'credit' AND wt.release_at <= NOW()
    `);
    if (rows.length > 0) {
      logger.info(`Releasing ${rows.length} matured commission transaction(s)...`);
      for (const txn of rows) {
        await releaseCommission(txn.partner_id, txn.wallet_id, txn.id, txn.amount);
      }
    }
  } catch (err) {
    logger.error('releaseMaturedCommissions failed', { error: err.message });
  }
};

module.exports = { ensureWallet, creditCommission, releaseCommission, processWithdrawal, getWalletSummary, releaseMaturedCommissions };
