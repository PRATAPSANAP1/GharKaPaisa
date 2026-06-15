const { query, getClient } = require('../config/db');
const { notify } = require('./notification.service');
const logger = require('../utils/logger');

// Ensure wallet exists for partner (called on partner approval)
const ensureWallet = async (partnerId) => {
  await query(`
    INSERT INTO wallets (Partner_id) VALUES ($1)
    ON CONFLICT (Partner_id) DO NOTHING
  `, [partnerId]);
};

// Credit money to Hold Balance (e.g. commission credit pending verification)
const creditHold = async (partnerId, amount, meta = {}) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Get/ensure wallet
    let { rows: [wallet] } = await client.query(
      `SELECT id, hold_balance, available_balance, total_earned FROM wallets WHERE Partner_id = $1 FOR UPDATE`,
      [partnerId]
    );
    if (!wallet) {
      await client.query(`INSERT INTO wallets (Partner_id) VALUES ($1) ON CONFLICT (Partner_id) DO NOTHING`, [partnerId]);
      const result = await client.query(
        `SELECT id, hold_balance, available_balance, total_earned FROM wallets WHERE Partner_id = $1 FOR UPDATE`,
        [partnerId]
      );
      wallet = result.rows[0];
    }

    // Add to hold_balance
    await client.query(`
      UPDATE wallets SET
        hold_balance = hold_balance + $1,
        last_updated = NOW()
      WHERE Partner_id = $2
    `, [amount, partnerId]);

    // Log txn with release_at timestamp
    const holdHours = parseInt(process.env.COMMISSION_CREDIT_HOLD_HOURS || 48);
    const { rows: [txn] } = await client.query(`
      INSERT INTO wallet_transactions (
        wallet_id, partner_id, application_id, type, amount, balance_before, balance_after, status, description, 
        reference_type, reference_id, bank_name, product_type, processed_by, release_at
      )
      VALUES ($1, $2, $3, 'credit', $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12, NOW() + INTERVAL '${holdHours} hours')
      RETURNING id
    `, [
      wallet.id, partnerId, meta.application_id || null, amount, wallet.hold_balance, parseFloat(wallet.hold_balance) + parseFloat(amount),
      meta.description || 'Commission credit on hold',
      meta.reference_type || 'commission', meta.reference_id || meta.application_id || null,
      meta.bank_name || null, meta.product_type || null, meta.processed_by || null
    ]);

    await client.query('COMMIT');
    logger.info(`creditHold ₹${amount} (hold) for partner ${partnerId}, txn: ${txn.id}`);
    return txn;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('creditHold failed', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// Release money from Hold Balance to Available Balance (after hold period ends)
const releaseHold = async (partnerId, amount, meta = {}) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Get wallet
    const { rows: [wallet] } = await client.query(
      `SELECT id FROM wallets WHERE Partner_id = $1 FOR UPDATE`,
      [partnerId]
    );
    if (!wallet) throw new Error('Wallet not found');

    // Deduct hold_balance, add to available_balance and total_earned
    await client.query(`
      UPDATE wallets SET
        hold_balance = GREATEST(0, hold_balance - $1),
        available_balance = available_balance + $1,
        total_earned = total_earned + $1,
        last_updated = NOW()
      WHERE Partner_id = $2
    `, [amount, partnerId]);

    // Update existing transaction status to approved or insert new log
    if (meta.txn_id) {
      await client.query(`
        UPDATE wallet_transactions SET
          status = 'approved',
          processed_at = NOW(),
          processed_by = COALESCE($2, processed_by)
        WHERE id = $1
      `, [meta.txn_id, meta.processed_by || null]);
    } else {
      await client.query(`
        INSERT INTO wallet_transactions (
          wallet_id, partner_id, type, amount, balance_before, balance_after, status, description, 
          reference_type, reference_id, processed_by, processed_at
        )
        VALUES ($1, $2, 'credit', $3, $4, $5, 'approved', $6, $7, $8, $9, NOW())
      `, [
        wallet.id, partnerId, amount, wallet.available_balance, parseFloat(wallet.available_balance) + parseFloat(amount),
        meta.description || 'Hold released',
        meta.reference_type || 'hold_release', meta.reference_id || null, meta.processed_by || null
      ]);
    }

    await client.query('COMMIT');
    logger.info(`releaseHold: Released ₹${amount} to available for partner ${partnerId}`);

    // Notify Partner
    const { rows: [partner] } = await query(`SELECT user_id FROM Partner_profiles WHERE id = $1`, [partnerId]);
    if (partner) {
      try {
        await notify.commissionCredited(partner.user_id, amount);
      } catch (notifyErr) {
        logger.error('Release notify failed', { error: notifyErr.message });
      }
    }
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('releaseHold failed', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// Deduct money from Available Balance (e.g. withdrawal request)
const debitAvailable = async (partnerId, amount, meta = {}, existingClient = null) => {
  const client = existingClient || await getClient();
  const isInternalTxn = !existingClient;
  try {
    if (isInternalTxn) await client.query('BEGIN');

    // Get wallet
    const { rows: [wallet] } = await client.query(
      `SELECT id, available_balance FROM wallets WHERE Partner_id = $1 FOR UPDATE`,
      [partnerId]
    );
    if (!wallet) throw new Error('Wallet not found');
    if (parseFloat(wallet.available_balance) < amount) {
      throw new Error(`Insufficient available balance. Available: ₹${wallet.available_balance}`);
    }

    // Deduct available
    await client.query(`
      UPDATE wallets SET
        available_balance = available_balance - $1,
        last_updated = NOW()
      WHERE Partner_id = $2
    `, [amount, partnerId]);

    // Log txn as pending debit
    const status = meta.status || 'pending';
    const { rows: [txn] } = await client.query(`
      INSERT INTO wallet_transactions (
        wallet_id, partner_id, type, amount, balance_before, balance_after, status, description, 
        reference_type, reference_id, bank_name, processed_by, processed_at, created_at
      )
      VALUES ($1, $2, 'debit', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id
    `, [
      wallet.id, partnerId, amount, wallet.available_balance, parseFloat(wallet.available_balance) - parseFloat(amount),
      status, meta.description || 'Withdrawal request debit',
      meta.reference_type || 'withdrawal', meta.reference_id || null, meta.bank_name || null,
      meta.processed_by || null, status === 'processed' ? new Date() : null
    ]);

    if (isInternalTxn) await client.query('COMMIT');
    logger.info(`debitAvailable: Debited ₹${amount} from partner ${partnerId}, status: ${status}`);
    return txn;
  } catch (err) {
    if (isInternalTxn) await client.query('ROLLBACK');
    logger.error('debitAvailable failed', err.message);
    throw err;
  } finally {
    if (isInternalTxn) client.release();
  }
};

// Credit commission helper wrapper for application approval flow
const creditCommission = async (partnerId, applicationId, amount, description, userId) => {
  const { rows: [app] } = await query(`
    SELECT a.*, p.name as product_name, p.category as product_category, b.name as bank_name
    FROM applications a
    JOIN products p ON p.id = a.product_id
    JOIN banks b ON b.id = p.bank_id
    WHERE a.id = $1
  `, [applicationId]);

  const meta = {
    application_id: applicationId,
    reference_type: 'commission',
    reference_id: applicationId,
    bank_name: app ? app.bank_name : null,
    product_type: app ? app.product_category : null,
    description: description,
    processed_by: userId
  };
  return creditHold(partnerId, amount, meta);
};

// Release commission helper wrapper for matured releases scheduler
const releaseCommission = async (partnerId, walletId, txnId, amount) => {
  const meta = {
    txn_id: txnId,
    reference_type: 'commission_release',
    reference_id: txnId
  };

  await releaseHold(partnerId, amount, meta);

  // Update application commission_status to approved
  await query(`
    UPDATE applications SET commission_status = 'approved' 
    WHERE id = (SELECT application_id FROM wallet_transactions WHERE id = $1)
  `, [txnId]);
};

// Process withdrawal request
const processWithdrawal = async (withdrawalId, approved, processedBy, utrNumber = null, rejectionReason = null, adminNote = null) => {
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
      // Increment total_withdrawn only
      await client.query(`
        UPDATE wallets SET
          total_withdrawn = total_withdrawn + $1,
          last_updated = NOW()
        WHERE id = $2
      `, [wr.amount, wr.wallet_id]);

      // Update matching debit transaction to processed
      await client.query(`
        UPDATE wallet_transactions SET
          status = 'processed',
          processed_by = $1,
          processed_at = NOW()
        WHERE reference_type = 'withdrawal' AND reference_id = $2
      `, [processedBy, withdrawalId.toString()]);

      // Update withdrawal request
      await client.query(`
        UPDATE withdrawal_requests SET
          status = 'processed',
          utr_number = $1,
          processed_by = $2,
          processed_at = NOW(),
          admin_note = $3,
          updated_at = NOW()
        WHERE id = $4
      `, [utrNumber, processedBy, adminNote, withdrawalId]);
    } else {
      // Rejection: refund to available_balance
      await client.query(`
        UPDATE wallets SET
          available_balance = available_balance + $1,
          last_updated = NOW()
        WHERE id = $2
      `, [wr.amount, wr.wallet_id]);

      // Update transaction to rejected
      await client.query(`
        UPDATE wallet_transactions SET
          status = 'rejected',
          processed_by = $1,
          processed_at = NOW()
        WHERE reference_type = 'withdrawal' AND reference_id = $2
      `, [processedBy, withdrawalId.toString()]);

      // Update withdrawal request
      await client.query(`
        UPDATE withdrawal_requests SET
          status = 'rejected',
          rejection_reason = $1,
          processed_by = $2,
          processed_at = NOW(),
          admin_note = $3,
          updated_at = NOW()
        WHERE id = $4
      `, [rejectionReason, processedBy, adminNote, withdrawalId]);
    }

    await client.query('COMMIT');

    // Notify Partner
    const { rows: [partner] } = await query(`SELECT user_id FROM Partner_profiles WHERE id = $1`, [wr.Partner_id]);
    if (partner) {
      try {
        approved
          ? await notify.withdrawalApproved(partner.user_id, wr.amount)
          : await notify.withdrawalRejected(partner.user_id, wr.amount, rejectionReason);
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
const getWalletSummary = async (partnerId) => {
  const { rows: [wallet] } = await query(`
    SELECT id, Partner_id, total_earned, total_withdrawn, hold_balance, available_balance, last_updated
    FROM wallets WHERE Partner_id = $1
  `, [partnerId]);
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

// Admin override to adjust a partner's wallet
const adminAdjustWallet = async (partnerId, amount, txnType, description, processedBy) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Get/ensure wallet
    let { rows: [wallet] } = await client.query(
      `SELECT id, available_balance, total_earned FROM wallets WHERE Partner_id = $1 FOR UPDATE`,
      [partnerId]
    );
    if (!wallet) {
      await client.query(`INSERT INTO wallets (Partner_id) VALUES ($1) ON CONFLICT (Partner_id) DO NOTHING`, [partnerId]);
      const result = await client.query(
        `SELECT id, available_balance, total_earned FROM wallets WHERE Partner_id = $1 FOR UPDATE`,
        [partnerId]
      );
      wallet = result.rows[0];
    }

    let queryStr = '';
    if (txnType === 'credit') {
      queryStr = `
        UPDATE wallets SET
          available_balance = available_balance + $1,
          total_earned = total_earned + $1,
          last_updated = NOW()
        WHERE Partner_id = $2
      `;
    } else if (txnType === 'debit') {
      if (parseFloat(wallet.available_balance) < amount) {
        throw new Error(`Insufficient available balance for debit adjustment. Available: ₹${wallet.available_balance}`);
      }
      queryStr = `
        UPDATE wallets SET
          available_balance = available_balance - $1,
          last_updated = NOW()
        WHERE Partner_id = $2
      `;
    } else {
      throw new Error(`Invalid transaction type: ${txnType}`);
    }

    await client.query(queryStr, [amount, partnerId]);

    // Log transaction
    const { rows: [txn] } = await client.query(`
      INSERT INTO wallet_transactions (
        wallet_id, partner_id, txn_type, amount, status, description, 
        reference_type, processed_by, processed_at
      )
      VALUES ($1, $2, $3, $4, 'approved', $5, 'manual_adjustment', $6, NOW())
      RETURNING id
    `, [wallet.id, partnerId, txnType, amount, description, processedBy]);

    await client.query('COMMIT');
    logger.info(`adminAdjustWallet: Manually adjusted partner ${partnerId} wallet (type: ${txnType}, amount: ₹${amount})`);
    return txn;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('adminAdjustWallet failed', err.message);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  ensureWallet,
  creditHold,
  releaseHold,
  debitAvailable,
  creditCommission,
  releaseCommission,
  processWithdrawal,
  getWalletSummary,
  releaseMaturedCommissions,
  adminAdjustWallet
};
