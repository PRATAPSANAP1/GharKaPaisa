const { query, getClient } = require('../../config/database');
const { notify } = require('../notifications/service.js');
const logger = require('../../config/logger');

// Ensure wallet exists for partner (called on partner approval)
const ensureWallet = async (partnerId) => {
  await query(`
    INSERT INTO wallets (Partner_id) VALUES ($1)
    ON CONFLICT (Partner_id) DO NOTHING
  `, [partnerId]);
};

// Credit money to Hold Balance (e.g. commission credit pending verification)
// ── NEW HELPER: Sync Balance from Ledger ──
const syncWalletBalance = async (partnerId, client) => {
  // Calculates wallet balance dynamically from wallet_ledger
  // And updates the wallets table cache.
  
  // 1. Available Balance = Completed Credits - Completed Debits
  const availableQuery = await client.query(`
    SELECT 
      COALESCE(SUM(credit), 0) - COALESCE(SUM(debit), 0) as available_bal,
      COALESCE(SUM(CASE WHEN transaction_type = 'TEAM_COMMISSION' THEN credit ELSE 0 END), 0) as team_earn,
      COALESCE(SUM(CASE WHEN transaction_type = 'PERSONAL_COMMISSION' THEN credit ELSE 0 END), 0) as personal_earn,
      COALESCE(SUM(CASE WHEN transaction_type = 'REFERRAL_BONUS' THEN credit ELSE 0 END), 0) as ref_bonus,
      COALESCE(SUM(CASE WHEN transaction_type = 'WITHDRAWAL' THEN debit ELSE 0 END), 0) as withdrawn
    FROM wallet_ledger 
    WHERE partner_id = $1 AND status = 'completed'
  `, [partnerId]);
  
  // 2. Hold Balance = Pending Credits
  const holdQuery = await client.query(`
    SELECT 
      COALESCE(SUM(credit), 0) as hold_bal,
      COALESCE(SUM(CASE WHEN transaction_type = 'TEAM_COMMISSION' THEN credit ELSE 0 END), 0) as team_pending
    FROM wallet_ledger 
    WHERE partner_id = $1 AND status = 'pending'
  `, [partnerId]);

  const av = availableQuery.rows[0];
  const hd = holdQuery.rows[0];

  const availableBalance = parseFloat(av.available_bal);
  const holdBalance = parseFloat(hd.hold_bal);
  const totalEarned = parseFloat(av.team_earn) + parseFloat(av.personal_earn) + parseFloat(av.ref_bonus);
  
  await client.query(`
    UPDATE wallets SET
      available_balance = $1,
      hold_balance = $2,
      total_earned = $3,
      total_withdrawn = $4,
      personal_earnings = $5,
      team_earnings = $6,
      referral_bonus = $7,
      pending_team_commission = $8,
      last_updated = NOW()
    WHERE "Partner_id" = $9
  `, [
    availableBalance, 
    holdBalance, 
    totalEarned, 
    parseFloat(av.withdrawn), 
    parseFloat(av.personal_earn), 
    parseFloat(av.team_earn), 
    parseFloat(av.ref_bonus), 
    parseFloat(hd.team_pending), 
    partnerId
  ]);

  return { availableBalance, holdBalance, totalEarned };
};

const creditHold = async (partnerId, amount, meta = {}, existingClient = null) => {
  const client = existingClient || await getClient();
  const isInternalTxn = !existingClient;
  try {
    if (isInternalTxn) await client.query('BEGIN');

    // Get/ensure wallet
    let { rows: [wallet] } = await client.query(
      `SELECT id FROM wallets WHERE "Partner_id" = $1 FOR UPDATE`,
      [partnerId]
    );
    if (!wallet) {
      await client.query(`INSERT INTO wallets ("Partner_id") VALUES ($1) ON CONFLICT ("Partner_id") DO NOTHING`, [partnerId]);
      const result = await client.query(`SELECT id FROM wallets WHERE "Partner_id" = $1 FOR UPDATE`, [partnerId]);
      wallet = result.rows[0];
    }

    // Insert into wallet_ledger
    let txnType = 'PERSONAL_COMMISSION';
    if (meta.reference_type === 'team_commission') txnType = 'TEAM_COMMISSION';
    if (meta.reference_type === 'referral_bonus') txnType = 'REFERRAL_BONUS';

    const { rows: [txn] } = await client.query(`
      INSERT INTO wallet_ledger (
        wallet_id, partner_id, application_id, transaction_type, credit, debit, description, reference_number, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, 'pending', $8)
      RETURNING id
    `, [
      wallet.id, partnerId, meta.application_id || null, txnType, amount, 
      meta.description || 'Commission credit on hold', 
      meta.reference_id || meta.application_id || null,
      meta.processed_by || null
    ]);

    await syncWalletBalance(partnerId, client);

    if (isInternalTxn) await client.query('COMMIT');
    logger.info(`creditHold ₹${amount} (hold) for partner ${partnerId}, txn: ${txn.id}`);
    return txn;
  } catch (err) {
    if (isInternalTxn) await client.query('ROLLBACK');
    logger.error('creditHold failed', err.message);
    throw err;
  } finally {
    if (isInternalTxn) client.release();
  }
};

// Release money from Hold Balance to Available Balance (after hold period ends)
const releaseHold = async (partnerId, amount, meta = {}, existingClient = null) => {
  const client = existingClient || await getClient();
  const isInternalTxn = !existingClient;
  try {
    if (isInternalTxn) await client.query('BEGIN');

    // Get wallet
    const { rows: [wallet] } = await client.query(
      `SELECT id FROM wallets WHERE "Partner_id" = $1 FOR UPDATE`,
      [partnerId]
    );
    if (!wallet) throw new Error('Wallet not found');

    if (meta.txn_id) {
      // It's a release of an existing ledger entry (pending -> completed)
      await client.query(`
        UPDATE wallet_ledger SET status = 'completed', description = COALESCE(description, '') || ' [Released]'
        WHERE id = $1
      `, [meta.txn_id]);
    } else {
      // New direct release
      let txnType = 'PERSONAL_COMMISSION';
      if (meta.reference_type === 'team_commission') txnType = 'TEAM_COMMISSION';
      if (meta.reference_type === 'referral_bonus') txnType = 'REFERRAL_BONUS';

      await client.query(`
        INSERT INTO wallet_ledger (
          wallet_id, partner_id, application_id, transaction_type, credit, debit, description, reference_number, status, created_by
        ) VALUES ($1, $2, null, $3, $4, 0, $5, $6, 'completed', $7)
      `, [
        wallet.id, partnerId, txnType, amount, 
        meta.description || 'Hold released', 
        meta.reference_id || null,
        meta.processed_by || null
      ]);
    }

    await syncWalletBalance(partnerId, client);

    if (isInternalTxn) await client.query('COMMIT');
    logger.info(`releaseHold: Released ₹${amount} to available for partner ${partnerId}`);

    // Notify Partner
    const { rows: [partner] } = await client.query(`SELECT user_id FROM "Partner_profiles" WHERE id = $1`, [partnerId]);
    if (partner) {
      try {
        await notify.commissionCredited(partner.user_id, amount);
      } catch (notifyErr) {
        logger.error('Release notify failed', { error: notifyErr.message });
      }
    }
  } catch (err) {
    if (isInternalTxn) await client.query('ROLLBACK');
    logger.error('releaseHold failed', err.message);
    throw err;
  } finally {
    if (isInternalTxn) client.release();
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
      `SELECT id, available_balance FROM wallets WHERE "Partner_id" = $1 FOR UPDATE`,
      [partnerId]
    );
    if (!wallet) throw new Error('Wallet not found');
    if (parseFloat(wallet.available_balance) < amount) {
      throw new Error(`Insufficient available balance. Available: ₹${wallet.available_balance}`);
    }

    let txnType = 'WITHDRAWAL';
    if (meta.reference_type === 'adjustment') txnType = 'ADJUSTMENT';

    // Log txn as pending or completed debit
    const status = meta.status || 'pending';
    const { rows: [txn] } = await client.query(`
      INSERT INTO wallet_ledger (
        wallet_id, partner_id, transaction_type, credit, debit, description, reference_number, status, created_by
      ) VALUES ($1, $2, $3, 0, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      wallet.id, partnerId, txnType, amount,
      meta.description || 'Withdrawal request debit',
      meta.reference_id || null, status,
      meta.processed_by || null
    ]);

    await syncWalletBalance(partnerId, client);

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

  const { rows: [partner] } = await query(`
    SELECT parent_partner_id, first_name, last_name, "Partner_code" FROM "Partner_profiles" WHERE id = $1
  `, [partnerId]);

  const meta = {
    application_id: applicationId,
    reference_type: 'commission',
    reference_id: applicationId,
    bank_name: app ? app.bank_name : null,
    product_type: app ? app.product_category : null,
    description: description,
    processed_by: userId
  };

  if (partner && partner.parent_partner_id && app) {
    // 1. Fetch commission rule for this product to determine the split
    const { rows: [rule] } = await query(`
      SELECT partner_percentage, parent_percentage
      FROM commission_rules
      WHERE product_id = $1 AND status = 'active'
      AND (effective_to IS NULL OR effective_to >= NOW())
      ORDER BY created_at DESC LIMIT 1
    `, [app.product_id]);

    let childPct = 90;
    let parentPct = 10;
    
    if (rule) {
      childPct = parseFloat(rule.partner_percentage);
      parentPct = parseFloat(rule.parent_percentage);
    } else {
      // Fallback to system settings
      const { rows: settingsRows } = await query(`
        SELECT key, value FROM system_settings WHERE key IN ('team_commission_child_pct', 'team_commission_parent_pct')
      `);
      settingsRows.forEach(row => {
        if (row.key === 'team_commission_child_pct') childPct = parseFloat(row.value);
        if (row.key === 'team_commission_parent_pct') parentPct = parseFloat(row.value);
      });
    }

    const childAmount = parseFloat((amount * (childPct / 100)).toFixed(2));
    const parentAmount = parseFloat((amount * (parentPct / 100)).toFixed(2));

    const childMeta = {
      ...meta,
      description: `${description} (Child ${childPct}%)`
    };
    const childTxn = await creditHold(partnerId, childAmount, childMeta);

    const parentMeta = {
      ...meta,
      reference_type: 'team_commission',
      description: `Team Commission from ${partner.first_name} ${partner.last_name || ''} (${partner.Partner_code}) - Parent ${parentPct}%`
    };
    await creditHold(partner.parent_partner_id, parentAmount, parentMeta);

    // Notify Parent
    try {
      const { rows: [parentUser] } = await query(`SELECT user_id FROM "Partner_profiles" WHERE id = $1`, [partner.parent_partner_id]);
      if (parentUser) {
        const { createNotification } = require('../notifications/service.js');
        await createNotification(
          parentUser.user_id,
          'Team Member Earned Commission',
          `Your team member ${partner.first_name} earned commission. Your team split of ₹${parentAmount} has been credited (on hold).`,
          'success'
        );
      }
    } catch (notifyErr) {
      logger.error('Failed to notify parent of team commission split:', notifyErr.message);
    }

    return childTxn;
  } else {
    return creditHold(partnerId, amount, meta);
  }
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
    WHERE id = (SELECT application_id FROM wallet_ledger WHERE id = $1)
  `, [txnId]);
};

// Process withdrawal request
const processWithdrawal = async (withdrawalId, approved, processedBy, utrNumber = null, rejectionReason = null, adminNote = null) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // NOTE: Withdrawal logic supports both old withdrawal_requests and new wallet_withdrawals
    // but the system is using withdrawal_requests currently. Let's use wallet_withdrawals if it exists, or stick to withdrawal_requests to not break APIs.
    // Actually, the new plan states we use wallet_withdrawals but to avoid breaking APIs we will stick to withdrawal_requests.
    // Let's check withdrawal_requests for the ID.
    const { rows: [wr] } = await client.query(
      `SELECT wr.*, w.id as wallet_id FROM withdrawal_requests wr
       JOIN wallets w ON w."Partner_id" = wr.partner_id WHERE wr.id = $1 FOR UPDATE`,
      [withdrawalId]
    );
    if (!wr) throw new Error('Withdrawal request not found');
    if (wr.status !== 'pending') throw new Error('Withdrawal already processed');

    if (approved) {
      // Update matching debit transaction to processed (completed)
      await client.query(`
        UPDATE wallet_ledger SET
          status = 'completed',
          created_by = $1,
          reference_number = COALESCE($2, reference_number)
        WHERE transaction_type = 'WITHDRAWAL' AND (reference_number = $3 OR reference_number IS NULL) AND status = 'pending' AND partner_id = $4
      `, [processedBy, utrNumber, withdrawalId.toString(), wr.partner_id]);

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
      // Rejection: refund to available_balance (by marking the pending debit as rejected, which syncWalletBalance ignores)
      await client.query(`
        UPDATE wallet_ledger SET
          status = 'rejected',
          created_by = $1,
          description = COALESCE(description, '') || ' [Rejected]'
        WHERE transaction_type = 'WITHDRAWAL' AND (reference_number = $2 OR reference_number IS NULL) AND status = 'pending' AND partner_id = $3
      `, [processedBy, withdrawalId.toString(), wr.partner_id]);

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

    await syncWalletBalance(wr.partner_id, client);
    await client.query('COMMIT');

    // Notify Partner
    const { rows: [partner] } = await client.query(`SELECT user_id FROM "Partner_profiles" WHERE id = $1`, [wr.partner_id]);
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
      SELECT id, wallet_id, credit as amount, partner_id
      FROM wallet_ledger
      WHERE status = 'pending' AND (transaction_type = 'PERSONAL_COMMISSION' OR transaction_type = 'TEAM_COMMISSION') 
      AND created_at <= NOW() - INTERVAL '48 hours'
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
      `SELECT id, available_balance FROM wallets WHERE "Partner_id" = $1 FOR UPDATE`,
      [partnerId]
    );
    if (!wallet) {
      await client.query(`INSERT INTO wallets ("Partner_id") VALUES ($1) ON CONFLICT ("Partner_id") DO NOTHING`, [partnerId]);
      const result = await client.query(
        `SELECT id, available_balance FROM wallets WHERE "Partner_id" = $1 FOR UPDATE`,
        [partnerId]
      );
      wallet = result.rows[0];
    }

    if (txnType === 'debit') {
      if (parseFloat(wallet.available_balance) < amount) {
        throw new Error(`Insufficient available balance for debit adjustment. Available: ₹${wallet.available_balance}`);
      }
    } else if (txnType !== 'credit') {
      throw new Error(`Invalid transaction type: ${txnType}`);
    }

    // Log transaction
    const { rows: [txn] } = await client.query(`
      INSERT INTO wallet_ledger (
        wallet_id, partner_id, transaction_type, credit, debit, description, status, created_by
      ) VALUES ($1, $2, 'ADJUSTMENT', $3, $4, $5, 'completed', $6)
      RETURNING id
    `, [
      wallet.id, partnerId, 
      txnType === 'credit' ? amount : 0, 
      txnType === 'debit' ? amount : 0, 
      description || 'Manual Adjustment', 
      processedBy
    ]);

    await syncWalletBalance(partnerId, client);

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
