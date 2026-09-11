const { query, getClient } = require('../../config/database');
const { notify } = require('../notifications/service.js');
const logger = require('../../config/logger');

// Helper to resolve canonical partner_profiles.id safely from partnerId, user_id, partner_code, email, or mobile
const resolvePartnerProfileId = async (dbOrClient, partnerId) => {
  if (!partnerId) return null;
  const searchStr = String(partnerId).trim();
  if (!searchStr) return null;

  const db = dbOrClient || { query };
  try {
    // 1. Direct search in partner_profiles
    const { rows: [pRec] } = await db.query(
      `SELECT id FROM partner_profiles 
       WHERE id::text = $1 
          OR user_id::text = $1 
          OR partner_code ILIKE $1 
       LIMIT 1`,
      [searchStr]
    );
    if (pRec) return pRec.id;

    // 2. Search users table by id, email, or mobile
    const { rows: [uRec] } = await db.query(
      `SELECT id, first_name, last_name FROM users 
       WHERE id::text = $1 
          OR email ILIKE $1 
          OR mobile = $1 
       LIMIT 1`,
      [searchStr]
    );

    if (uRec) {
      const { rows: [existingP] } = await db.query(
        `SELECT id FROM partner_profiles WHERE user_id::text = $1::text LIMIT 1`,
        [uRec.id]
      );
      if (existingP) return existingP.id;

      // Auto-create missing partner_profile for existing user to ensure walletFK works
      const partnerCode = 'PART' + String(Math.floor(100000 + Math.random() * 900000));
      const { rows: [newP] } = await db.query(`
        INSERT INTO partner_profiles (user_id, partner_code, first_name, last_name, status, kyc_status)
        VALUES ($1, $2, $3, $4, 'active', 'approved')
        ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
        RETURNING id
      `, [uRec.id, partnerCode, uRec.first_name || 'Partner', uRec.last_name || 'User']);
      if (newP) return newP.id;
    }
  } catch (err) {
    logger.warn('[resolvePartnerProfileId] resolution error:', err.message);
  }

  return null;
};

// Ensure wallet exists for partner (called on partner approval)
const ensureWallet = async (partnerId, client = null) => {
  const db = client || { query };
  const resolvedPartnerId = await resolvePartnerProfileId(db, partnerId);
  if (!resolvedPartnerId) return;
  await db.query(`
    INSERT INTO partner_wallets (partner_id) VALUES ($1)
    ON CONFLICT (partner_id) DO NOTHING
  `, [resolvedPartnerId]);
};

// Sync transactions table helper to ensure wallet_transactions replicates wallet_ledger
const syncTransactionTable = async (client, ledgerTxnId, walletId, partnerId, applicationId, type, amount, balanceBefore, balanceAfter, status, description, referenceType, referenceId, processedBy, meta = {}) => {
  const { rows } = await client.query(`SELECT id FROM wallet_transactions WHERE id = $1`, [ledgerTxnId]);
  
  let targetWalletId = walletId;
  if (!targetWalletId && partnerId) {
    const { rows: [w] } = await client.query(`SELECT id FROM partner_wallets WHERE partner_id = $1`, [partnerId]);
    if (w) {
      targetWalletId = w.id;
    } else {
      await client.query(`INSERT INTO partner_wallets (partner_id) VALUES ($1) ON CONFLICT (partner_id) DO NOTHING`, [partnerId]);
      const { rows: [w2] } = await client.query(`SELECT id FROM partner_wallets WHERE partner_id = $1`, [partnerId]);
      targetWalletId = w2 ? w2.id : null;
    }
  }

  let tds = parseFloat(meta.tds || 0);
  let gst = parseFloat(meta.gst || 0);
  let netAmount = parseFloat(meta.net_amount || amount);

  if (['PERSONAL_COMMISSION', 'TEAM_COMMISSION', 'OVERRIDE_COMMISSION'].includes(type) && !meta.net_amount) {
    tds = parseFloat((amount * 0.05).toFixed(2)); // default 5% TDS
    netAmount = parseFloat((amount - tds).toFixed(2));
  }

  if (rows.length > 0) {
    await client.query(`
      UPDATE wallet_transactions SET
        status = $1,
        processed_by = $2,
        processed_at = NOW(),
        description = COALESCE($3, description),
        remarks = COALESCE($4, remarks)
      WHERE id = $5
    `, [status, processedBy, description, meta.remarks || null, ledgerTxnId]);
  } else {
    await client.query(`
      INSERT INTO wallet_transactions (
        id, wallet_id, partner_id, application_id, type, amount, balance_before, balance_after, status, description, reference_type, reference_id, processed_by, processed_at, created_at,
        product_id, commission_type, gst, tds, net_amount, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), $14, $15, $16, $17, $18, $19)
    `, [
      ledgerTxnId,
      targetWalletId,
      partnerId,
      applicationId || null,
      type,
      amount,
      balanceBefore || 0,
      balanceAfter || 0,
      status,
      description || '',
      referenceType || null,
      referenceId || null,
      processedBy || null,
      meta.product_id || null,
      meta.commission_type || null,
      gst,
      tds,
      netAmount,
      meta.remarks || null
    ]);
  }
};

// Sync Wallet Balance Cache in partner_wallets table
const syncWalletBalance = async (partnerId, client) => {
  const { rows: [p] } = await client.query(`SELECT id, user_id FROM partner_profiles WHERE id::text = $1::text OR user_id::text = $1::text`, [partnerId]);
  const pId = p ? p.id : partnerId;
  const uId = p ? p.user_id : partnerId;

  // Single SQL CTE enforcing exact PostgreSQL NUMERIC(15,2) arithmetic
  const { rows: [updated] } = await client.query(`
    WITH credit_stats AS (
      SELECT 
        COALESCE(SUM(credit), 0.00)::numeric as completed_credits,
        COALESCE(SUM(CASE WHEN transaction_type = 'TEAM_COMMISSION' THEN credit ELSE 0 END), 0.00)::numeric as team_earn,
        COALESCE(SUM(CASE WHEN transaction_type = 'PERSONAL_COMMISSION' THEN credit ELSE 0 END), 0.00)::numeric as personal_earn,
        COALESCE(SUM(CASE WHEN transaction_type = 'REFERRAL_BONUS' THEN credit ELSE 0 END), 0.00)::numeric as ref_bonus,
        COALESCE(SUM(CASE WHEN transaction_type = 'OVERRIDE_COMMISSION' THEN credit ELSE 0 END), 0.00)::numeric as override_earn
      FROM wallet_ledger 
      WHERE (partner_id = $1::uuid OR partner_id = $2::uuid) 
        AND status IN ('Released', 'Approved')
        AND transaction_type NOT IN ('WITHDRAWAL_CANCELLED', 'WITHDRAWAL_REJECTED')
    ),
    debit_stats AS (
      SELECT 
        COALESCE(SUM(debit), 0.00)::numeric as completed_debits
      FROM wallet_ledger 
      WHERE (partner_id = $1::uuid OR partner_id = $2::uuid) AND status IN ('Released', 'Approved')
    ),
    hold_stats AS (
      SELECT 
        COALESCE(SUM(credit), 0.00)::numeric as hold_bal,
        COALESCE(SUM(CASE WHEN transaction_type = 'TEAM_COMMISSION' THEN credit ELSE 0 END), 0.00)::numeric as team_pending
      FROM wallet_ledger 
      WHERE (partner_id = $1::uuid OR partner_id = $2::uuid) AND status = 'Pending Approval'
    ),
    locked_stats AS (
      SELECT 
        COALESCE(SUM(w.amount), 0.00)::numeric as locked_bal
      FROM wallet_withdrawals w
      WHERE (w.partner_id = $1::uuid OR w.partner_id = $2::uuid) 
        AND w.status IN ('pending', 'approved', 'processing')
        AND NOT EXISTS (
          SELECT 1 FROM wallet_ledger wl 
          WHERE wl.reference_number = w.id::text 
            AND wl.transaction_type = 'WITHDRAWAL_SETTLED'
            AND wl.status IN ('Released', 'Approved')
        )
    )
    UPDATE partner_wallets PW SET
      available_balance = GREATEST(0.00, (CS.completed_credits - DS.completed_debits - LS.locked_bal)::numeric),
      hold_balance = HS.hold_bal,
      total_earned = (CS.team_earn + CS.personal_earn + CS.ref_bonus + CS.override_earn)::numeric,
      total_withdrawn = DS.completed_debits,
      personal_earnings = CS.personal_earn,
      team_earnings = CS.team_earn,
      referral_bonus = CS.ref_bonus,
      pending_team_commission = HS.team_pending,
      pending_balance = HS.hold_bal,
      withdrawn_balance = DS.completed_debits,
      override_balance = CS.override_earn,
      locked_balance = LS.locked_bal,
      last_updated = NOW()
    FROM credit_stats CS, debit_stats DS, hold_stats HS, locked_stats LS
    WHERE PW.partner_id = $1::uuid
    RETURNING available_balance, hold_balance, total_earned
  `, [pId, uId]);

  return {
    availableBalance: updated ? updated.available_balance : 0,
    holdBalance: updated ? updated.hold_balance : 0,
    totalEarned: updated ? updated.total_earned : 0
  };
};

/**
 * Wallet vs Ledger Reconciliation Verification Function
 */
const verifyWalletReconciliation = async (partnerId, clientParam = null) => {
  const client = clientParam || await getClient();
  const isInternal = !clientParam;
  try {
    const { rows: [p] } = await client.query(
      `SELECT id FROM partner_profiles WHERE id::text = $1::text OR user_id::text = $1::text`,
      [partnerId]
    );
    const pId = p ? p.id : partnerId;

    const { rows: [w] } = await client.query(
      `SELECT available_balance, hold_balance, total_withdrawn, locked_balance FROM partner_wallets WHERE partner_id = $1`,
      [pId]
    );
    if (!w) return { isReconciled: true, difference: '0.00', status: 'PASS' };

    const { rows: [audit] } = await client.query(`
      WITH credits AS (
        SELECT COALESCE(SUM(credit), 0.00)::numeric as val
        FROM wallet_ledger WHERE partner_id = $1 AND status IN ('Released', 'Approved')
      ),
      debits AS (
        SELECT COALESCE(SUM(debit), 0.00)::numeric as val
        FROM wallet_ledger WHERE partner_id = $1 AND status IN ('Released', 'Approved')
      ),
      holds AS (
        SELECT COALESCE(SUM(w.amount), 0.00)::numeric as val
        FROM wallet_withdrawals w
        WHERE w.partner_id = $1 AND w.status IN ('pending', 'approved', 'processing')
          AND NOT EXISTS (
            SELECT 1 FROM wallet_ledger wl
            WHERE wl.reference_number = w.id::text AND wl.transaction_type = 'WITHDRAWAL_SETTLED' AND wl.status IN ('Released', 'Approved')
          )
      )
      SELECT 
        (C.val - D.val - H.val)::numeric(15,2) as expected_available
      FROM credits C, debits D, holds H
    `, [pId]);

    const walletAvailable = parseFloat(w.available_balance || 0);
    const expectedAvailable = parseFloat(audit ? audit.expected_available : 0);
    const diff = Math.abs(walletAvailable - expectedAvailable);

    const isPass = diff < 0.001;

    return {
      partnerId: pId,
      walletBalance: walletAvailable,
      ledgerBalance: expectedAvailable,
      difference: diff.toFixed(2),
      status: isPass ? 'PASS' : 'FAIL'
    };
  } finally {
    if (isInternal) client.release();
  }
};

// Credit money to Hold Balance (e.g. commission credit pending verification)
const creditHold = async (partnerId, amount, meta = {}, existingClient = null) => {
  const client = existingClient || await getClient();
  const isInternalTxn = !existingClient;
  try {
    if (isInternalTxn) await client.query('BEGIN');

    // Resolve partner profile ID in case user_id/code was passed
    const resolvedPartnerId = await resolvePartnerProfileId(client, partnerId);
    if (!resolvedPartnerId) {
      logger.warn(`[WALLET_SERVICE] creditHold skipped: Partner profile not found for identifier "${partnerId}"`);
      if (isInternalTxn) await client.query('COMMIT');
      return null;
    }

    // Get/ensure wallet
    let { rows: [wallet] } = await client.query(
      `SELECT id, available_balance FROM partner_wallets WHERE partner_id = $1 FOR UPDATE`,
      [resolvedPartnerId]
    );
    if (!wallet) {
      await client.query(
        `INSERT INTO partner_wallets (partner_id) VALUES ($1) ON CONFLICT (partner_id) DO NOTHING`,
        [resolvedPartnerId]
      );
      const result = await client.query(
        `SELECT id, available_balance FROM partner_wallets WHERE partner_id = $1 FOR UPDATE`,
        [resolvedPartnerId]
      );
      wallet = result.rows[0];
    }

    if (!wallet) {
      throw new Error(`Partner wallet record does not exist for partner_id: ${resolvedPartnerId}`);
    }

    // Insert into wallet_ledger
    let txnType = 'PERSONAL_COMMISSION';
    if (meta.reference_type === 'team_commission') txnType = 'TEAM_COMMISSION';
    if (meta.reference_type === 'referral_bonus') txnType = 'REFERRAL_BONUS';
    if (meta.reference_type === 'override_commission') txnType = 'OVERRIDE_COMMISSION';

    let productId = meta.product_id || null;
    let bankId = meta.bank_id || null;
    const appId = meta.application_id || null;

    if (appId) {
      // ── Duplicate Credit Protection Guard ──────────────────────
      const { rows: existingTxns } = await client.query(
        `SELECT id FROM wallet_ledger WHERE application_id = $1 AND transaction_type = $2 AND partner_id = $3 LIMIT 1`,
        [appId, txnType, resolvedPartnerId]
      );
      if (existingTxns.length > 0) {
        logger.info(`[DUPLICATE_COMMISSION_GUARD] Commission for application ${appId} (${txnType}) already credited to partner ${resolvedPartnerId}. Skipping duplicate.`);
        if (isInternalTxn) await client.query('COMMIT');
        return existingTxns[0];
      }

      const { rows: [app] } = await client.query(
        `SELECT product_id, bank_id FROM applications WHERE id = $1`,
        [appId]
      );
      if (app) {
        productId = app.product_id || productId;
        bankId = app.bank_id || bankId;
      }

      // Automatically transition application status to approved when commission is added to wallet
      await client.query(`
        UPDATE applications 
        SET status = 'approved',
            final_status = 'approved',
            approved_at = COALESCE(approved_at, NOW()),
            commission_released = TRUE,
            updated_at = NOW()
        WHERE id = $1
      `, [appId]);

      await client.query(`
        UPDATE leads 
        SET status = 'approved',
            pipeline_stage = 'approved',
            updated_at = NOW()
        WHERE application_id = $1 OR id = $1
      `, [appId]);
    }

    const { rows: [txn] } = await client.query(`
      INSERT INTO wallet_ledger (
        wallet_id, partner_id, application_id, transaction_type, credit, debit, description, reference_number, status, created_by, product_id, bank_id
      )
      SELECT $1::uuid, $2::uuid, $3::uuid, $4::varchar, $5::numeric, 0, $6::text, $7::text, 'Pending Approval', $8::uuid, $9::uuid, $10::uuid
      WHERE NOT EXISTS (
        SELECT 1 FROM wallet_ledger
        WHERE application_id = $3::uuid
          AND transaction_type::text = $4::text
          AND partner_id = $2::uuid
          AND $3::uuid IS NOT NULL
      )
      RETURNING id
    `, [
      wallet.id, resolvedPartnerId, appId, txnType, amount, 
      meta.description || 'Commission credit pending approval', 
      meta.reference_id || appId || null,
      meta.processed_by || null,
      productId,
      bankId
    ]);

    if (!txn) {
      const { rows: [existing] } = await client.query(
        `SELECT id FROM wallet_ledger WHERE application_id = $1 AND transaction_type = $2 AND partner_id = $3 LIMIT 1`,
        [appId, txnType, resolvedPartnerId]
      );
      if (isInternalTxn) await client.query('COMMIT');
      logger.info(`creditHold: Duplicate commission credit blocked at DB level for app: ${appId}`);
      return existing || { alreadyCredited: true };
    }

    // Also sync to wallet_transactions
    let commissionType = 'personal';
    if (meta.reference_type === 'team_commission') commissionType = 'team';
    if (meta.reference_type === 'referral_bonus') commissionType = 'referral';
    if (meta.reference_type === 'override_commission') commissionType = 'override';

    const balanceBefore = parseFloat(wallet.available_balance || 0);
    const balanceAfter = balanceBefore;

    await syncTransactionTable(client, txn.id, wallet.id, resolvedPartnerId, meta.application_id || null, txnType, amount, balanceBefore, balanceAfter, 'Pending Approval', meta.description || 'Commission credit pending approval', meta.reference_type, meta.reference_id || meta.application_id || null, meta.processed_by || null, {
      product_id: meta.product_id || null,
      commission_type: commissionType,
      remarks: meta.remarks || null
    });

    await syncWalletBalance(resolvedPartnerId, client);

    if (isInternalTxn) await client.query('COMMIT');
    logger.info(`creditHold ₹${amount} (pending approval) for partner ${resolvedPartnerId}, txn: ${txn.id}`);
    return txn;
  } catch (err) {
    if (isInternalTxn) await client.query('ROLLBACK');
    logger.error('creditHold failed', err.message);
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

    // Get wallet and check balance in PostgreSQL NUMERIC
    const { rows: [wallet] } = await client.query(
      `SELECT id, available_balance, (available_balance >= $2::numeric) as has_balance FROM partner_wallets WHERE partner_id = $1 FOR UPDATE`,
      [partnerId, amount]
    );
    if (!wallet) throw new Error('Wallet not found');
    if (!wallet.has_balance) {
      throw new Error(`Insufficient available balance. Available: ₹${wallet.available_balance}`);
    }

    let txnType = 'WITHDRAWAL';
    if (meta.reference_type === 'adjustment') txnType = 'ADJUSTMENT';

    // Log txn as pending or completed debit
    const status = meta.status || 'pending';
    const balanceBefore = parseFloat(wallet.available_balance || 0);
    const balanceAfter = balanceBefore - amount;

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

    await syncTransactionTable(client, txn.id, wallet.id, partnerId, null, txnType, amount, balanceBefore, balanceAfter, status, meta.description || 'Withdrawal request debit', meta.reference_type, meta.reference_id || null, meta.processed_by || null, {
      remarks: meta.remarks || null
    });

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

// Credit commission helper wrapper for application approval flow (supports ACID transactions)
const creditCommission = async (partnerId, applicationId, amount, description, userId, existingClient = null) => {
  const db = existingClient || { query };
  const resolvedPartnerId = await resolvePartnerProfileId(db, partnerId);
  if (!resolvedPartnerId) {
    logger.warn(`[COMMISSION_SERVICE] creditCommission skipped: Partner profile not found for identifier "${partnerId}"`);
    return null;
  }
  partnerId = resolvedPartnerId;

  const { rows: [app] } = await db.query(`
    SELECT a.*, p.name as product_name, p.category as product_category, b.name as bank_name
    FROM applications a
    JOIN products p ON p.id = a.product_id
    JOIN banks b ON b.id = p.bank_id
    WHERE a.id = $1
  `, [applicationId]);

  const { rows: [partner] } = await db.query(`
    SELECT parent_partner_id, first_name, last_name, partner_code FROM partner_profiles WHERE id = $1
  `, [partnerId]);

  const meta = {
    application_id: applicationId,
    product_id: app ? app.product_id : null,
    reference_type: 'commission',
    reference_id: applicationId,
    bank_name: app ? app.bank_name : null,
    product_type: app ? app.product_category : null,
    description: description,
    processed_by: userId
  };

  if (partner && partner.parent_partner_id && app) {
    const { rows: [rule] } = await db.query(`
      SELECT partner_percentage, parent_percentage
      FROM commission_rules
      WHERE product_id = $1 AND status = 'active'
      AND (effective_to IS NULL OR effective_to >= NOW())
      ORDER BY created_at DESC LIMIT 1
    `, [app.product_id]);

    let childPct = 90;
    let parentPct = 10;
    
    // Check if team member has custom commission rate set by parent partner
    const { rows: [memberProfile] } = await db.query(`
      SELECT commission_rate FROM partner_profiles WHERE id::text = $1::text OR user_id::text = $1::text
    `, [partnerId]);

    if (memberProfile && memberProfile.commission_rate !== null && memberProfile.commission_rate !== undefined) {
      childPct = parseFloat(memberProfile.commission_rate);
      parentPct = parseFloat((100 - childPct).toFixed(2));
    } else if (rule) {
      childPct = parseFloat(rule.partner_percentage);
      parentPct = parseFloat(rule.parent_percentage);
    } else {
      const { rows: settingsRows } = await db.query(`
        SELECT key, value FROM system_settings WHERE key IN ('team_commission_child_pct', 'team_commission_parent_pct')
      `);
      settingsRows.forEach(row => {
        if (row.key === 'team_commission_child_pct') childPct = parseFloat(row.value);
        if (row.key === 'team_commission_parent_pct') parentPct = parseFloat(row.value);
      });
    }

    const { rows: [calcSplit] } = await db.query(`
      SELECT 
        ROUND(($1::numeric * ($2::numeric / 100.0)), 2)::numeric(15,2) as child_amount,
        ROUND(($1::numeric * ($3::numeric / 100.0)), 2)::numeric(15,2) as parent_amount
    `, [amount, childPct, parentPct]);

    const childAmount = calcSplit ? calcSplit.child_amount : '0.00';
    const parentAmount = calcSplit ? calcSplit.parent_amount : '0.00';

    const childMeta = {
      ...meta,
      description: `${description} (Child ${childPct}%)`
    };
    const childTxn = await creditHold(partnerId, childAmount, childMeta, existingClient);

    const parentMeta = {
      ...meta,
      reference_type: 'team_commission',
      description: `Team Commission from ${partner.first_name} ${partner.last_name || ''} (${partner.partner_code}) - Parent ${parentPct}%`
    };
    await creditHold(partner.parent_partner_id, parentAmount, parentMeta, existingClient);

    try {
      const { rows: [parentUser] } = await db.query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [partner.parent_partner_id]);
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
    return creditHold(partnerId, amount, meta, existingClient);
  }
};

// Release money from Hold Balance to Available Balance (Approved commission)
const releaseHold = async (partnerId, amount, meta = {}, existingClient = null) => {
  const client = existingClient || await getClient();
  const isInternalTxn = !existingClient;
  try {
    if (isInternalTxn) await client.query('BEGIN');

    // Resolve partner profile ID
    const resolvedPartnerId = await resolvePartnerProfileId(client, partnerId);
    if (!resolvedPartnerId) {
      logger.warn(`[WALLET_SERVICE] releaseHold skipped: Partner profile not found for identifier "${partnerId}"`);
      if (isInternalTxn) await client.query('COMMIT');
      return null;
    }

    // Get/ensure wallet
    let { rows: [wallet] } = await client.query(
      `SELECT id, available_balance, hold_balance FROM partner_wallets WHERE partner_id = $1 FOR UPDATE`,
      [resolvedPartnerId]
    );
    if (!wallet) {
      await client.query(
        `INSERT INTO partner_wallets (partner_id) VALUES ($1) ON CONFLICT (partner_id) DO NOTHING`,
        [resolvedPartnerId]
      );
      const result = await client.query(
        `SELECT id, available_balance, hold_balance FROM partner_wallets WHERE partner_id = $1 FOR UPDATE`,
        [resolvedPartnerId]
      );
      wallet = result.rows[0];
    }

    if (!wallet) {
      throw new Error(`Partner wallet not found for partner_id: ${resolvedPartnerId}`);
    }

    const txnType = 'COMMISSION_RELEASE';
    const status = 'Released';
    const numAmount = amount;
    const balanceBefore = wallet.available_balance || '0.00';
    const { rows: [calc] } = await client.query(
      `SELECT ($1::numeric + $2::numeric)::numeric(15,2) as balance_after`,
      [balanceBefore, amount]
    );
    const balanceAfter = calc ? calc.balance_after : balanceBefore;

    let txnIdToReturn = meta.txn_id || null;

    // Unify decision gate with commission_decisions table if txn_id is provided
    if (meta.txn_id) {
      const { rows: [decisionRow] } = await client.query(`
        INSERT INTO commission_decisions (commission_ledger_id, decision, decided_by, remarks)
        VALUES ($1, 'RELEASED', $2, $3)
        ON CONFLICT (commission_ledger_id) DO NOTHING
        RETURNING *
      `, [meta.txn_id, meta.processed_by || null, meta.description || 'Automated Hold Release']);

      if (!decisionRow) {
        if (isInternalTxn) await client.query('COMMIT');
        logger.info(`releaseHold: Commission ledger ${meta.txn_id} already decided in commission_decisions gate. Skipping.`);
        return { alreadyReleased: true, id: meta.txn_id, net_amount: numAmount, tds: 0 };
      }
    }

    // Append-Only Financial Event with Idempotency Guard (Zero UPDATE on historical rows)
    const refNum = meta.reference_id || (meta.txn_id ? String(meta.txn_id) : null);
    const appId = meta.application_id || null;

    const { rows: [txn] } = await client.query(`
      INSERT INTO wallet_ledger (
        wallet_id, partner_id, application_id, transaction_type, credit, debit, description, reference_number, status, created_by
      )
      SELECT $1::uuid, $2::uuid, $7::uuid, 'COMMISSION_RELEASE'::varchar, $3::numeric, 0, $4::text, $5::text, 'Released', $6::uuid
      WHERE NOT EXISTS (
        SELECT 1 FROM wallet_ledger
        WHERE transaction_type::text = 'COMMISSION_RELEASE'
          AND reference_number = $5::text
          AND $5::text IS NOT NULL
      )
      RETURNING id
    `, [
      wallet.id, resolvedPartnerId, numAmount,
      meta.description || (meta.txn_id ? `Commission release for hold txn #${meta.txn_id}` : 'Commission release to available balance'),
      refNum,
      meta.processed_by || null,
      appId
    ]);

    if (!txn) {
      const { rows: [existing] } = await client.query(
        `SELECT id FROM wallet_ledger WHERE transaction_type = 'COMMISSION_RELEASE' AND reference_number = $1 LIMIT 1`,
        [refNum]
      );
      if (isInternalTxn) await client.query('COMMIT');
      logger.info(`releaseHold: Commission already released for ref: ${refNum}`);
      return { alreadyReleased: true, id: existing?.id || meta.txn_id || null, net_amount: numAmount, tds: 0 };
    }

    txnIdToReturn = txn.id;

    await syncTransactionTable(client, txn.id, wallet.id, resolvedPartnerId, meta.application_id || null, txnType, numAmount, balanceBefore, balanceAfter, status, meta.description || 'Commission release to available balance', meta.reference_type || 'hold_release', meta.reference_id || null, meta.processed_by || null, {
      remarks: meta.remarks || null
    });

    await syncWalletBalance(resolvedPartnerId, client);

    if (isInternalTxn) await client.query('COMMIT');
    logger.info(`releaseHold: Released ₹${numAmount} to available balance for partner ${resolvedPartnerId}`);
    return { id: txnIdToReturn, net_amount: numAmount, tds: 0 };
  } catch (err) {
    if (isInternalTxn) await client.query('ROLLBACK');
    logger.error('releaseHold failed', err.message);
    throw err;
  } finally {
    if (isInternalTxn) client.release();
  }
};

// Release commission helper wrapper for matured releases scheduler
const releaseCommission = async (partnerId, walletId, txnId, amount) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Lock the wallet_ledger row and check status to prevent concurrent releases
    const { rows: [txn] } = await client.query(
      `SELECT status FROM wallet_ledger WHERE id::text = $1::text FOR UPDATE`,
      [String(txnId)]
    );

    if (!txn || txn.status !== 'pending') {
      await client.query('ROLLBACK');
      logger.info(`Commission transaction ${txnId} is already processed or not found.`);
      return;
    }

    const meta = {
      txn_id: txnId,
      reference_type: 'commission_release',
      reference_id: txnId
    };

    // Pass the active transaction client to releaseHold to execute within transaction
    await releaseHold(partnerId, amount, meta, client);

    await client.query(`
      UPDATE applications SET commission_status = 'approved' 
      WHERE id::text = (SELECT application_id::text FROM wallet_ledger WHERE id::text = $1::text)
    `, [String(txnId)]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    try { client.release(); } catch (_) {}
  }
};

// Process withdrawal request
const processWithdrawal = async (withdrawalId, action, processedBy, utrNumber = null, rejectionReason = null, adminNote = null, payoutOptions = {}) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { rows: [wr] } = await client.query(
      `SELECT wr.*, w.id as wallet_id FROM wallet_withdrawals wr
       JOIN partner_wallets w ON w.partner_id = wr.partner_id WHERE wr.id = $1 FOR UPDATE`,
      [withdrawalId]
    );
    if (!wr) throw new Error('Withdrawal request not found');

    if (action === 'approve') {
      if (wr.status !== 'pending') throw new Error('Withdrawal request must be pending to approve');

      await client.query(`
        UPDATE wallet_withdrawals SET
          status = 'approved',
          approved_by = $1,
          approved_at = NOW(),
          processed_by = $1,
          processed_at = NOW(),
          admin_note = $2,
          updated_at = NOW()
        WHERE id = $3
      `, [processedBy, adminNote, withdrawalId]);

      // Insert WITHDRAWAL_SETTLED ledger entry so approved amount reflects in total_withdrawn
      await client.query(`
        INSERT INTO wallet_ledger (
          wallet_id, partner_id, transaction_type, credit, debit, description, reference_number, status, created_by
        )
        SELECT $1::uuid, $2::uuid, 'WITHDRAWAL_SETTLED'::varchar, 0, $3::numeric, $4::text, $5::text, 'Released'::varchar, $6::uuid
        WHERE NOT EXISTS (
          SELECT 1 FROM wallet_ledger
          WHERE transaction_type = 'WITHDRAWAL_SETTLED'
            AND reference_number = $5::text
            AND status IN ('Released', 'Approved')
        )
      `, [
        wr.wallet_id, wr.partner_id, wr.amount,
        `Withdrawal request approved - Amount ₹${wr.amount}`,
        withdrawalId.toString(),
        processedBy
      ]);

      await client.query(`
        INSERT INTO wallet_withdrawal_events (withdrawal_id, status, remarks, changed_by)
        VALUES ($1, 'WITHDRAWAL_APPROVED', $2, $3)
      `, [withdrawalId, adminNote || 'Approved by Super Admin', processedBy]);

      await syncWalletBalance(wr.partner_id, client);

    } else if (action === 'reject') {
      if (!['pending', 'approved', 'processing', 'failed'].includes(wr.status)) {
        throw new Error(`Cannot reject withdrawal in status: ${wr.status}`);
      }

      // Append-Only Financial Entry for Withdrawal Rejection - Credit back the rejected amount
      await client.query(`
        INSERT INTO wallet_ledger (
          wallet_id, partner_id, transaction_type, credit, debit, description, reference_number, status, created_by
        ) VALUES ($1, $2, 'WITHDRAWAL_CANCELLED', $3, 0, $4, $5, 'Released', $6)
      `, [
        wr.wallet_id, wr.partner_id,
        wr.amount,
        `Withdrawal rejected - Reason: ${rejectionReason || 'Rejected by Admin'} - Amount restored to available balance`,
        withdrawalId.toString(),
        processedBy
      ]);

      await client.query(`
        UPDATE wallet_withdrawals SET
          status = 'rejected',
          rejection_reason = $1,
          processed_by = $2,
          processed_at = NOW(),
          admin_note = $3,
          updated_at = NOW()
        WHERE id = $4
      `, [rejectionReason, processedBy, adminNote, withdrawalId]);

      await client.query(`
        INSERT INTO wallet_withdrawal_events (withdrawal_id, status, remarks, changed_by)
        VALUES ($1, 'WITHDRAWAL_REJECTED', $2, $3)
      `, [withdrawalId, `Rejection reason: ${rejectionReason || 'Rejected by Admin'}`, processedBy]);

      // Sync wallet balance to restore the cancelled amount to available balance
      await syncWalletBalance(wr.partner_id, client);

    } else if (action === 'transfer' || utrNumber) {
      if (!['pending', 'approved', 'processing'].includes(wr.status)) {
        throw new Error(`Cannot transfer withdrawal in status: ${wr.status}`);
      }

      if (utrNumber) {
        // Manual Transfer recording with provided UTR number
        const finalUtr = utrNumber;
        
        // Append-Only Financial Entry for Settlement (Zero UPDATE on historical rows)
        await client.query(`
          INSERT INTO wallet_ledger (
            wallet_id, partner_id, transaction_type, credit, debit, description, reference_number, status, created_by
          ) VALUES ($1, $2, 'WITHDRAWAL_SETTLED', 0, $3::numeric, $4, $5, 'Released', $6)
        `, [
          wr.wallet_id, wr.partner_id, wr.amount,
          `Withdrawal payout settled - UTR: ${finalUtr}`,
          withdrawalId.toString(),
          processedBy
        ]);

        await client.query(`
          UPDATE wallet_withdrawals SET
            status = 'transferred',
            utr = $1,
            transferred_by = $2,
            transferred_at = NOW(),
            admin_note = $3,
            updated_at = NOW()
          WHERE id = $4
        `, [finalUtr, processedBy, adminNote, withdrawalId]);

        await client.query(`
          INSERT INTO wallet_withdrawal_events (withdrawal_id, status, remarks, changed_by)
          VALUES ($1, 'RAZORPAY_PAYOUT_SUCCESS', $2, $3)
        `, [withdrawalId, `Settlement recorded with UTR: ${finalUtr}`, processedBy]);

        // Record in partner settlements
        await client.query(`
          INSERT INTO partner_settlements (withdrawal_id, partner_id, payment_mode, utr_number, settled_at, status)
          VALUES ($1, $2, 'Bank Transfer', $3, NOW(), 'completed')
          ON CONFLICT (withdrawal_id) DO NOTHING
        `, [withdrawalId, wr.partner_id, finalUtr]);

      } else {
        // Razorpay Transfer API call
        const { rows: [partner] } = await client.query(
          `SELECT ap.first_name, ap.last_name, COALESCE(u.mobile, '') as mobile, COALESCE(u.email, '') as email, ap.id, ap.user_id 
           FROM partner_profiles ap 
           LEFT JOIN users u ON u.id = ap.user_id 
           WHERE ap.id = $1`,
          [wr.partner_id]
        );
        const { rows: [bank] } = await client.query(
          `SELECT id, bank_name, account_number, ifsc_code, account_holder_name FROM partner_bank_details WHERE partner_id = $1 AND (id = $2 OR $2 IS NULL) ORDER BY is_primary DESC LIMIT 1`,
          [wr.partner_id, wr.bank_account_id || null]
        );

        if (!bank) throw new Error('Partner has not registered bank details');
        
        let accountNumber = bank.account_number;
        if (accountNumber && accountNumber.includes(':')) {
          const { decrypt } = require('../../utils/helpers/crypto');
          try {
            accountNumber = decrypt(accountNumber);
          } catch (_) {}
        }
        
        const decryptedBank = {
          ...bank,
          account_number: accountNumber
        };

        const { createRazorpayContact, createRazorpayFundAccount, createRazorpayPayout } = require('../../utils/helpers/razorpay');

        let contactId = wr.razorpay_contact_id;
        if (!contactId) {
          const contact = await createRazorpayContact(partner, wr.id);
          contactId = contact.id;
          await client.query(`UPDATE partner_bank_details SET razorpay_contact_id = $1 WHERE partner_id = $2`, [contactId, wr.partner_id]);
        }

        let fundAccountId = wr.razorpay_fund_account_id;
        if (!fundAccountId) {
          const fundAcc = await createRazorpayFundAccount(contactId, decryptedBank, wr.id);
          fundAccountId = fundAcc.id;
          await client.query(`UPDATE partner_bank_details SET razorpay_fund_account_id = $1 WHERE partner_id = $2 AND (id = $3 OR $3 IS NULL)`, [fundAccountId, wr.partner_id, wr.bank_account_id || null]);
        }

        const payout = await createRazorpayPayout(fundAccountId, parseFloat(wr.amount), wr.id, payoutOptions);

        const payoutId = payout.id;
        const utr = payout.utr || null;
        const bankRef = payout.bank_reference || null;
        const internalRef = `INTERNAL-PAYOUT-${payoutId}`;
        const payoutStatus = payout.status; 

        let status = 'processing';
        if (payoutStatus === 'processed') {
          status = 'transferred';
        } else if (['reversed', 'failed', 'rejected'].includes(payoutStatus)) {
          status = 'failed';
        }

        await client.query(`
          UPDATE wallet_withdrawals SET
            status = $1,
            razorpay_contact_id = $2,
            razorpay_fund_account_id = $3,
            razorpay_payout_id = $4,
            utr = $5,
            bank_reference = $6,
            transferred_by = $7,
            transferred_at = NOW(),
            failure_reason = $8,
            bank_account_id = $9,
            updated_at = NOW()
          WHERE id = $10
        `, [status, contactId, fundAccountId, payoutId, utr, bankRef, processedBy, payoutStatus === 'failed' ? payout.failure_reason : null, bank.id, wr.id]);

        if (status === 'transferred') {
          // Append-Only Financial Entry for Settlement (Zero UPDATE on historical rows)
          await client.query(`
            INSERT INTO wallet_ledger (
              wallet_id, partner_id, transaction_type, credit, debit, description, reference_number, status, created_by
            ) VALUES ($1, $2, 'WITHDRAWAL_SETTLED', 0, $3::numeric, $4, $5, 'Released', $6)
          `, [
            wr.wallet_id, wr.partner_id, wr.amount,
            `Withdrawal payout transferred - UTR: ${utr || payoutId}`,
            withdrawalId.toString(),
            processedBy
          ]);

          const { rows: ledgerRows } = await client.query(
            `SELECT id, wallet_id, credit, debit FROM wallet_ledger 
             WHERE transaction_type = 'WITHDRAWAL' AND reference_number = $1 AND partner_id = $2`,
            [wr.id.toString(), wr.partner_id]
          );
          for (const row of ledgerRows) {
            await syncTransactionTable(client, row.id, row.wallet_id, wr.partner_id, null, null, parseFloat(row.debit), null, null, 'completed', `Withdrawal transferred - UTR: ${utr}`, null, null, processedBy);
          }

          await client.query(`
            INSERT INTO wallet_withdrawal_events (withdrawal_id, status, remarks, changed_by)
            VALUES ($1, 'RAZORPAY_PAYOUT_SUCCESS', $2, $3)
          `, [withdrawalId, `Payout processed successfully (UTR: ${utr || payoutId})`, processedBy]);

          // Record in partner settlements
          await client.query(`
            INSERT INTO partner_settlements (withdrawal_id, partner_id, payment_mode, utr_number, settled_at, status)
            VALUES ($1, $2, 'Bank Transfer', $3, NOW(), 'completed')
            ON CONFLICT (withdrawal_id) DO NOTHING
          `, [withdrawalId, wr.partner_id, utr || payoutId]);

        } else if (status === 'failed') {
          await client.query(`
            INSERT INTO wallet_withdrawal_events (withdrawal_id, status, remarks, changed_by)
            VALUES ($1, 'RAZORPAY_PAYOUT_FAILED', $2, $3)
          `, [withdrawalId, `Payout failed: ${payout.failure_reason || 'Processing failed'}`, processedBy]);
        } else {
          // Status processing
          await client.query(`
            INSERT INTO wallet_withdrawal_events (withdrawal_id, status, remarks, changed_by)
            VALUES ($1, 'RAZORPAY_PAYOUT_PROCESSING', $2, $3)
          `, [withdrawalId, `Razorpay Payout created (ID: ${payoutId}) and processing`, processedBy]);
        }
      }
    }

    await syncWalletBalance(wr.partner_id, client);
    await client.query('COMMIT');

    // Notify Partner & Send SMS
    const { rows: [partnerData] } = await client.query(`
      SELECT ap.first_name, ap.last_name, u.id as user_id, u.mobile 
      FROM partner_profiles ap 
      JOIN users u ON u.id = ap.user_id 
      WHERE ap.id = $1
    `, [wr.partner_id]);

    if (partnerData) {
      try {
        if (action === 'approve') {
          await notify.withdrawalApproved(partnerData.user_id, wr.amount);
        } else if (action === 'reject') {
          await notify.withdrawalRejected(partnerData.user_id, wr.amount, rejectionReason);
          if (partnerData.mobile) {
            const { sendWithdrawalFailedSms } = require('../../services/sms/sms.service');
            sendWithdrawalFailedSms(partnerData.mobile, partnerData.first_name, wr.amount).catch(smsErr => {
              logger.error('Failed to send withdrawal failed SMS to partner:', smsErr.message);
            });
          }
        } else if (action === 'transfer' || utrNumber) {
          const sentUtr = utrNumber || wr.utr || `INTERNAL-PAYOUT-${wr.id}`;
          await notify.withdrawalApproved(partnerData.user_id, wr.amount);
          
          // Send SMS notification to Partner upon payment completion using DLT template
          if (partnerData.mobile) {
            const { sendPayoutReceiptSms } = require('../../services/sms/sms.service');
            sendPayoutReceiptSms(partnerData.mobile, partnerData.first_name, wr.amount, sentUtr).catch(smsErr => {
              logger.error('Failed to send payout SMS to partner:', smsErr.message);
            });
          }
        }
      } catch (notifyErr) {
        logger.error('Withdrawal notify failed', { error: notifyErr.message });
      }
    }

    logger.info(`Withdrawal ${withdrawalId} action: ${action}`);
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
  // Resolve actual partner profile ID if user_id, code, or name was passed
  const searchStr = (partnerId || '').toString().trim();
  const { rows: [partner] } = await query(
    `SELECT id FROM partner_profiles 
     WHERE id::text = $1 
        OR user_id::text = $1 
        OR partner_code ILIKE $1 
        OR TRIM(CONCAT(first_name, ' ', last_name)) ILIKE $1`,
    [searchStr]
  );
  if (!partner) return null;

  const actualPartnerId = partner.id;

  let { rows: [wallet] } = await query(`
    SELECT id, partner_id, total_earned, total_withdrawn, hold_balance, available_balance, pending_balance, withdrawn_balance, override_balance, locked_balance, last_updated
    FROM partner_wallets WHERE partner_id = $1
  `, [actualPartnerId]);

  if (!wallet) {
    await query(`
      INSERT INTO partner_wallets (partner_id) VALUES ($1)
      ON CONFLICT (partner_id) DO NOTHING
    `, [actualPartnerId]);

    const retry = await query(`
      SELECT id, partner_id, total_earned, total_withdrawn, hold_balance, available_balance, pending_balance, withdrawn_balance, override_balance, locked_balance, last_updated
      FROM partner_wallets WHERE partner_id = $1
    `, [actualPartnerId]);
    wallet = retry.rows[0];
  }
  return wallet;
};

// Release matured commissions scheduler check (Product-based dynamic hold period)
const releaseMaturedCommissions = async () => {
  try {
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_release_days INT DEFAULT 7`);
    const { rows } = await query(`
      SELECT l.id, l.wallet_id, l.credit as amount, l.partner_id
      FROM wallet_ledger l
      LEFT JOIN products p ON p.id = l.product_id
      WHERE LOWER(l.status) IN ('pending approval', 'pending') 
        AND (l.transaction_type = 'PERSONAL_COMMISSION' OR l.transaction_type = 'TEAM_COMMISSION' OR l.transaction_type = 'OVERRIDE_COMMISSION') 
        AND l.created_at <= NOW() - (COALESCE((to_jsonb(p)->>'commission_release_days')::int, 7) || ' days')::interval
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

    // Resolve canonical partner_profiles.id safely from UUID, partner_code, or full name
    const searchStr = (partnerId || '').toString().trim();
    let resolvedPartnerId = null;

    const { rows: [pRec] } = await client.query(
      `SELECT id FROM partner_profiles 
       WHERE id::text = $1 
          OR user_id::text = $1 
          OR partner_code ILIKE $1 
          OR TRIM(CONCAT(first_name, ' ', last_name)) ILIKE $1 
       LIMIT 1`,
      [searchStr]
    );

    if (pRec) {
      resolvedPartnerId = pRec.id;
    } else {
      // Search users table by full name, email, mobile, or ID
      const { rows: [uRec] } = await client.query(
        `SELECT id, first_name, last_name FROM users 
         WHERE id::text = $1 
            OR TRIM(CONCAT(first_name, ' ', last_name)) ILIKE $1 
            OR email ILIKE $1 
            OR mobile = $1 
         LIMIT 1`,
        [searchStr]
      );

      if (uRec) {
        const { rows: [existingP] } = await client.query(
          `SELECT id FROM partner_profiles WHERE user_id = $1 LIMIT 1`,
          [uRec.id]
        );
        if (existingP) {
          resolvedPartnerId = existingP.id;
        } else {
          const partnerCode = 'SYS' + String(Math.floor(10000 + Math.random() * 90000));
          const { rows: [newP] } = await client.query(`
            INSERT INTO partner_profiles (user_id, partner_code, first_name, last_name, status, kyc_status)
            VALUES ($1, $2, $3, $4, 'active', 'approved')
            RETURNING id
          `, [uRec.id, partnerCode, uRec.first_name || 'Admin', uRec.last_name || 'System']);
          resolvedPartnerId = newP.id;
        }
      } else {
        throw new Error(`Partner not found for identifier: "${searchStr}"`);
      }
    }

    partnerId = resolvedPartnerId;

    // Get/ensure wallet
    let { rows: [wallet] } = await client.query(
      `SELECT id, available_balance FROM partner_wallets WHERE partner_id = $1 FOR UPDATE`,
      [partnerId]
    );
    if (!wallet) {
      await client.query(`INSERT INTO partner_wallets (partner_id) VALUES ($1) ON CONFLICT (partner_id) DO NOTHING`, [partnerId]);
      const result = await client.query(
        `SELECT id, available_balance FROM partner_wallets WHERE partner_id = $1 FOR UPDATE`,
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

    // Log transaction in wallet_ledger
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

    const balanceBefore = parseFloat(wallet.available_balance || 0);
    const balanceAfter = txnType === 'credit' ? (balanceBefore + amount) : (balanceBefore - amount);

    await syncTransactionTable(client, txn.id, wallet.id, partnerId, null, 'ADJUSTMENT', amount, balanceBefore, balanceAfter, 'completed', description || 'Manual Adjustment', 'adjustment', null, processedBy, {
      remarks: description
    });

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

/**
 * Create Immutable Ledger Entry & Update Partner Wallet Atomically
 */
const createImmutableLedgerEntry = async (partnerId, data, clientParam = null) => {
  const client = clientParam || await getClient();
  const isOuterClient = Boolean(clientParam);

  try {
    if (!isOuterClient) await client.query('BEGIN');

    await ensureWallet(partnerId, client);

    const {
      transaction_type, credit = 0, debit = 0, reference_number = null,
      description = '', product_id = null, lead_id = null, application_id = null,
      customer_name = null, remarks = null
    } = data;

    const numCredit = parseFloat(credit || 0);
    const numDebit = parseFloat(debit || 0);

    // Read current balances
    const { rows: [wallet] } = await client.query(
      `SELECT id, available_balance FROM partner_wallets WHERE partner_id = $1 FOR UPDATE`,
      [partnerId]
    );
    if (!wallet) throw new Error('Wallet not found');

    const status = numCredit > 0 ? 'Pending Approval' : 'Released';

    // 1. Create Immutable Ledger Row
    const { rows: [ledger] } = await client.query(`
      INSERT INTO wallet_ledger (
        wallet_id, partner_id, transaction_type, credit, debit,
        reference_number, description, product_id, lead_id, application_id,
        customer_name, status, remarks
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [
      wallet.id, partnerId, transaction_type, numCredit, numDebit,
      reference_number, description, product_id, lead_id, application_id,
      customer_name, status, remarks
    ]);

    // 2. Sync to wallet_transactions
    let commissionType = 'personal';
    if (transaction_type === 'TEAM_COMMISSION') commissionType = 'team';
    if (transaction_type === 'REFERRAL_BONUS') commissionType = 'referral';
    if (transaction_type === 'OVERRIDE_COMMISSION') commissionType = 'override';

    const balanceBefore = parseFloat(wallet.available_balance || 0);
    const balanceAfter = numCredit > 0 ? balanceBefore : (balanceBefore - numDebit);

    await syncTransactionTable(
      client, ledger.id, wallet.id, partnerId, application_id, transaction_type,
      numCredit > 0 ? numCredit : numDebit, balanceBefore, balanceAfter,
      status, description, transaction_type === 'TEAM_COMMISSION' ? 'team_commission' : 'commission',
      reference_number || application_id, null, {
        product_id,
        commission_type: commissionType,
        remarks
      }
    );

    // 3. Atomically Update Wallet Totals
    await syncWalletBalance(partnerId, client);

    if (!isOuterClient) await client.query('COMMIT');
    return ledger;
  } catch (err) {
    if (!isOuterClient) await client.query('ROLLBACK');
    logger.error(`Failed to create immutable ledger entry for partner ${partnerId}:`, err);
    throw err;
  } finally {
    if (!isOuterClient) client.release();
  }
};



/**
 * Send Withdrawal OTP
 */
const sendWithdrawalOTP = async (partnerId, amount) => {
  const crypto = require('crypto');
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Hash OTP prior to storage
  const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex');

  await query(`
    INSERT INTO wallet_withdrawals (partner_id, amount, status, otp_code, otp_expires_at)
    VALUES ($1, $2, 'otp_pending', $3, $4)
  `, [partnerId, amount, hashedOtp, expiresAt]);

  logger.info(`Withdrawal OTP generated and dispatched for partner ${partnerId}`);

  // Send notification to partner
  await notify.partner(
    partnerId,
    '🔐 Withdrawal Security OTP',
    `Your OTP for ₹${amount.toLocaleString()} payout request is: ${otpCode}. Valid for 10 minutes.`,
    { type: 'WITHDRAWAL_OTP' }
  ).catch(() => null);

  // Return standard metadata without exposing OTP or mock_otp
  return { otp_sent: true, expires_in_seconds: 600 };
};

/**
 * Verify Withdrawal OTP
 */
const verifyWithdrawalOTP = async (partnerId, otpCode) => {
  const crypto = require('crypto');
  const hashedOtp = crypto.createHash('sha256').update(String(otpCode).trim()).digest('hex');

  const { rows: [reqRow] } = await query(`
    SELECT * FROM wallet_withdrawals
    WHERE partner_id = $1 AND status = 'otp_pending' AND (otp_code = $2 OR otp_code = $3) AND otp_expires_at >= NOW()
    ORDER BY created_at DESC LIMIT 1
  `, [partnerId, hashedOtp, String(otpCode).trim()]);

  if (!reqRow) {
    throw new Error('Invalid or expired OTP code');
  }

  // Invalidate OTP after successful verification
  await query(`
    UPDATE wallet_withdrawals 
    SET status = 'pending', otp_expires_at = NOW() 
    WHERE id = $1
  `, [reqRow.id]);

  return reqRow;
};

/**
 * Process Daily Wallet Reconciliation
 */
const processWalletReconciliationDailyJob = async () => {
  const { rows: partners } = await query(`SELECT id FROM partner_profiles WHERE status = 'active'`);
  let totalReconciled = 0;
  let discrepanciesCount = 0;

  for (const p of partners) {
    const rec = await verifyWalletReconciliation(p.id);
    const isMatch = rec.status === 'PASS';
    const walletBal = rec.walletBalance;
    const ledgerBal = rec.ledgerBalance;
    const diff = parseFloat(rec.difference);

    await query(`
      INSERT INTO wallet_reconciliation (partner_id, wallet_balance, ledger_balance, discrepancy, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [p.id, walletBal, ledgerBal, diff, isMatch ? 'matched' : 'mismatch', isMatch ? 'Daily audit verified' : 'Discrepancy detected']);

    totalReconciled++;
    if (!isMatch) discrepanciesCount++;
  }

  const { rows: logs } = await query(`
    SELECT r.*, ap.partner_code, ap.first_name, ap.last_name
    FROM wallet_reconciliation r
    JOIN partner_profiles ap ON ap.id = r.partner_id
    ORDER BY r.created_at DESC
    LIMIT 50
  `);

  return { total_reconciled: totalReconciled, discrepancies: discrepanciesCount, records: logs };
};

/**
 * Generate Statement Data
 */
const generateWalletStatementData = async (partnerId, fromDate = null, toDate = null) => {
  let where = `WHERE partner_id = $1 AND status = 'completed'`;
  const values = [partnerId];
  let idx = 2;

  if (fromDate) {
    where += ` AND created_at >= $${idx++}`;
    values.push(fromDate);
  }
  if (toDate) {
    where += ` AND created_at <= $${idx++}`;
    values.push(toDate + ' 23:59:59');
  }

  const { rows: txns } = await query(`SELECT * FROM wallet_ledger ${where} ORDER BY created_at ASC`, values);

  let creditTotal = 0;
  let debitTotal = 0;
  txns.forEach(t => {
    creditTotal += parseFloat(t.credit || 0);
    debitTotal += parseFloat(t.debit || 0);
  });

  const { rows: [w] } = await query(`SELECT available_balance, hold_balance, total_earned, total_withdrawn FROM partner_wallets WHERE partner_id = $1`, [partnerId]);

  return {
    partner_id: partnerId,
    period: { from_date: fromDate || 'Beginning', to_date: toDate || 'Present' },
    opening_balance: 0.00,
    credit_total: creditTotal,
    debit_total: debitTotal,
    closing_balance: parseFloat(w?.available_balance || 0),
    held_balance: parseFloat(w?.hold_balance || 0),
    total_earned: parseFloat(w?.total_earned || 0),
    total_withdrawn: parseFloat(w?.total_withdrawn || 0),
  };
};

const manualReleaseCommission = async (transactionId, processedBy, remarks = null) => {
  let partnerUserId = null;
  let amount = 0;
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // 1. Get the ledger transaction (Use FOR UPDATE OF l to lock wallet_ledger only and avoid outer join lock error)
    const { rows: [ledgerTxn] } = await client.query(
      `SELECT l.id, l.partner_id, l.credit, l.transaction_type, l.description, l.status, p.user_id
       FROM wallet_ledger l
       LEFT JOIN partner_profiles p ON (p.id = l.partner_id OR p.user_id = l.partner_id)
       WHERE (l.id::text = $1::text OR l.reference_number = $1::text) FOR UPDATE OF l`,
      [transactionId]
    );
    if (!ledgerTxn) throw new Error('Transaction not found in ledger');
    if (ledgerTxn.status === 'Released' || ledgerTxn.status === 'Approved') {
      await client.query('COMMIT');
      return { alreadyProcessed: true, status: ledgerTxn.status, message: 'Commission already released' };
    }
    if (ledgerTxn.status === 'Rejected') {
      await client.query('COMMIT');
      return { alreadyProcessed: true, status: ledgerTxn.status, message: 'Commission already rejected' };
    }

    amount = ledgerTxn.credit || 0;
    partnerUserId = ledgerTxn.user_id;

    // 1b. Enforce Single Decision Gate in commission_decisions (PRIMARY KEY ON commission_ledger_id)
    const { rows: [decisionRow] } = await client.query(`
      INSERT INTO commission_decisions (commission_ledger_id, decision, decided_by, remarks)
      VALUES ($1, 'RELEASED', $2, $3)
      ON CONFLICT (commission_ledger_id) DO NOTHING
      RETURNING *
    `, [ledgerTxn.id, processedBy || null, remarks || null]);

    if (!decisionRow) {
      await client.query('COMMIT');
      logger.info(`Commission transaction ${transactionId} already decided (RELEASED or REJECTED).`);
      return { alreadyProcessed: true };
    }

    // 2. Append-Only Financial Entry for Commission Release (Zero UPDATE on historical rows)
    let { rows: [wallet] } = await client.query(`SELECT id FROM partner_wallets WHERE partner_id = $1`, [ledgerTxn.partner_id]);
    if (!wallet) {
      await client.query(`INSERT INTO partner_wallets (partner_id) VALUES ($1) ON CONFLICT (partner_id) DO NOTHING`, [ledgerTxn.partner_id]);
      const res = await client.query(`SELECT id FROM partner_wallets WHERE partner_id = $1`, [ledgerTxn.partner_id]);
      wallet = res.rows[0];
    }
    const resolvedWalletId = wallet ? wallet.id : null;
    const refNum = transactionId.toString();

    const { rows: [releaseTxn] } = await client.query(`
      INSERT INTO wallet_ledger (
        wallet_id, partner_id, transaction_type, credit, debit, description, reference_number, status, created_by
      )
      SELECT $1::uuid, $2::uuid, 'COMMISSION_RELEASE'::varchar, $3::numeric, 0, $4::text, $5::text, 'Released', $6::uuid
      WHERE NOT EXISTS (
        SELECT 1 FROM wallet_ledger
        WHERE transaction_type::text = 'COMMISSION_RELEASE'
          AND reference_number = $5::text
          AND $5::text IS NOT NULL
      )
      RETURNING id
    `, [
      resolvedWalletId, ledgerTxn.partner_id, amount,
      ledgerTxn.description ? `${ledgerTxn.description} [Released by Admin]` : 'Commission Released by Admin',
      refNum,
      processedBy
    ]);

    if (!releaseTxn) {
      await client.query('COMMIT');
      logger.info(`Commission transaction ${transactionId} already released.`);
      return { alreadyProcessed: true };
    }

    // 3. Update wallet_transactions
    await syncTransactionTable(
      client, 
      releaseTxn.id, 
      resolvedWalletId, 
      ledgerTxn.partner_id, 
      null, 
      'COMMISSION_RELEASE', 
      amount, 
      null, 
      null, 
      'Released', 
      ledgerTxn.description || 'Commission released by Admin', 
      null, 
      null, 
      processedBy, 
      { remarks }
    );

    // 4. Sync Wallet Balance and update original ledger record status
    await client.query(`UPDATE wallet_ledger SET status = 'Released' WHERE id = $1`, [ledgerTxn.id]);
    if (ledgerTxn.application_id) {
      await client.query(`UPDATE applications SET commission_status = 'released' WHERE id = $1`, [ledgerTxn.application_id]);
    }
    await syncWalletBalance(ledgerTxn.partner_id, client);

    await client.query('COMMIT');
    logger.info(`Commission transaction ${transactionId} manually released by admin ${processedBy}`);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('manualReleaseCommission failed:', err.message);
    throw err;
  } finally {
    client.release();
  }

  // 5. Notify Partner
  if (partnerUserId) {
    try {
      await notify.commissionCredited(partnerUserId, amount);
      const { createNotification } = require('../notifications/service.js');
      await createNotification(
        partnerUserId,
        'Commission Released',
        `₹${amount} has been credited to your wallet.`,
        'success',
        '/partner/wallet'
      );
    } catch (notifyErr) {
      logger.error('Release notify failed', { error: notifyErr.message });
    }
  }
  return true;
};

const manualRejectCommission = async (transactionId, processedBy, remarks = null) => {
  let partnerUserId = null;
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // 1. Get the ledger transaction (Use FOR UPDATE OF l to lock wallet_ledger only and avoid outer join lock error)
    const { rows: [ledgerTxn] } = await client.query(
      `SELECT l.id, l.partner_id, l.credit, l.transaction_type, l.description, l.status, p.user_id
       FROM wallet_ledger l
       LEFT JOIN partner_profiles p ON (p.id = l.partner_id OR p.user_id = l.partner_id)
       WHERE (l.id::text = $1::text OR l.reference_number = $1::text) FOR UPDATE OF l`,
      [transactionId]
    );
    if (!ledgerTxn) throw new Error('Transaction not found in ledger');
    if (ledgerTxn.status === 'Released' || ledgerTxn.status === 'Approved') {
      await client.query('COMMIT');
      return { alreadyProcessed: true, status: ledgerTxn.status, message: 'Commission already released' };
    }
    if (ledgerTxn.status === 'Rejected') {
      await client.query('COMMIT');
      return { alreadyProcessed: true, status: ledgerTxn.status, message: 'Commission already rejected' };
    }

    amount = ledgerTxn.credit || 0;
    partnerUserId = ledgerTxn.user_id;

    // 1b. Enforce Single Decision Gate in commission_decisions (PRIMARY KEY ON commission_ledger_id)
    const { rows: [decisionRow] } = await client.query(`
      INSERT INTO commission_decisions (commission_ledger_id, decision, decided_by, remarks)
      VALUES ($1, 'REJECTED', $2, $3)
      ON CONFLICT (commission_ledger_id) DO NOTHING
      RETURNING *
    `, [ledgerTxn.id, processedBy || null, remarks || null]);

    if (!decisionRow) {
      await client.query('COMMIT');
      logger.info(`Commission transaction ${transactionId} already decided (RELEASED or REJECTED).`);
      return { alreadyProcessed: true };
    }

    // 2. Append-Only Financial Entry for Commission Rejection (Zero UPDATE on historical rows)
    let { rows: [wallet] } = await client.query(`SELECT id FROM partner_wallets WHERE partner_id = $1`, [ledgerTxn.partner_id]);
    if (!wallet) {
      await client.query(`INSERT INTO partner_wallets (partner_id) VALUES ($1) ON CONFLICT (partner_id) DO NOTHING`, [ledgerTxn.partner_id]);
      const res = await client.query(`SELECT id FROM partner_wallets WHERE partner_id = $1`, [ledgerTxn.partner_id]);
      wallet = res.rows[0];
    }
    const resolvedWalletId = wallet ? wallet.id : null;
    const refNum = transactionId.toString();

    const { rows: [rejectTxn] } = await client.query(`
      INSERT INTO wallet_ledger (
        wallet_id, partner_id, transaction_type, credit, debit, description, reference_number, status, created_by
      )
      SELECT $1::uuid, $2::uuid, 'COMMISSION_REJECTED'::varchar, 0, 0, $3::text, $4::text, 'Rejected', $5::uuid
      WHERE NOT EXISTS (
        SELECT 1 FROM wallet_ledger
        WHERE transaction_type::text = 'COMMISSION_REJECTED'
          AND reference_number = $4::text
          AND $4::text IS NOT NULL
      )
      RETURNING id
    `, [
      resolvedWalletId, ledgerTxn.partner_id,
      ledgerTxn.description ? `${ledgerTxn.description} [Rejected by Admin]` : 'Commission Rejected by Admin',
      refNum,
      processedBy
    ]);

    if (!rejectTxn) {
      await client.query('COMMIT');
      logger.info(`Commission transaction ${transactionId} already rejected.`);
      return { alreadyProcessed: true };
    }

    // 3. Update wallet_transactions
    await syncTransactionTable(
      client, 
      rejectTxn.id, 
      resolvedWalletId, 
      ledgerTxn.partner_id, 
      null, 
      'COMMISSION_REJECTED', 
      0, 
      null, 
      null, 
      'Rejected', 
      ledgerTxn.description || 'Commission rejected by Admin', 
      null, 
      null, 
      processedBy, 
      { remarks }
    );

    // 4. Sync Wallet Balance and update original ledger record status
    await client.query(`UPDATE wallet_ledger SET status = 'Rejected' WHERE id = $1`, [ledgerTxn.id]);
    if (ledgerTxn.application_id) {
      await client.query(`UPDATE applications SET commission_status = 'rejected' WHERE id = $1`, [ledgerTxn.application_id]);
    }
    await syncWalletBalance(ledgerTxn.partner_id, client);

    await client.query('COMMIT');
    logger.info(`Commission transaction ${transactionId} manually rejected by admin ${processedBy}`);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('manualRejectCommission failed:', err.message);
    throw err;
  } finally {
    client.release();
  }

  // 5. Notify Partner
  if (partnerUserId) {
    try {
      const { createNotification } = require('../notifications/service.js');
      await createNotification(
        partnerUserId,
        'Commission Rejected',
        `Reason: ${remarks || 'Duplicate Application'}`,
        'danger',
        '/partner/wallet'
      );
    } catch (notifyErr) {
      logger.error('Reject notify failed', { error: notifyErr.message });
    }
  }
  return true;
};

/**
 * Atomic & Idempotent Payment Credit from Razorpay Verification / Webhook
 * Prevents double-crediting if duplicate calls occur (handles 500+ concurrent requests non-blockingly).
 */
const creditWalletFromPayment = async (partnerId, amountInInr, paymentId, orderId, processedBy = null) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Resolve canonical partner_id
    let resolvedPartnerId = partnerId;
    const { rows: [p] } = await client.query(
      `SELECT id FROM partner_profiles WHERE id::text = $1::text OR user_id::text = $1::text`,
      [String(partnerId)]
    );
    if (p) {
      resolvedPartnerId = p.id;
    }

    // 3. IDEMPOTENCY CHECK: Atomic ON CONFLICT DO NOTHING RETURNING payment_id
    // This prevents PostgreSQL 23505 errors under high concurrency (500+ users).
    const { rows: insertedProc } = await client.query(`
      INSERT INTO razorpay_processed_payments (payment_id, order_id, partner_id, amount, status)
      VALUES ($1, $2, $3, $4, 'COMPLETED')
      ON CONFLICT (payment_id) DO NOTHING
      RETURNING payment_id
    `, [paymentId, orderId || 'N/A', resolvedPartnerId, amountInInr]);

    if (insertedProc.length === 0) {
      // Payment was already inserted by a prior or concurrent request
      await client.query('COMMIT');
      logger.info(`[IDEMPOTENCY_GUARD] Payment ${paymentId} already processed for partner ${resolvedPartnerId}. Skipping duplicate credit.`);
      return { alreadyProcessed: true, amount: amountInInr };
    }

    // 4. Lock partner wallet row
    let { rows: [wallet] } = await client.query(
      `SELECT id, available_balance FROM partner_wallets WHERE partner_id = $1 FOR UPDATE`,
      [resolvedPartnerId]
    );

    if (!wallet) {
      await client.query(
        `INSERT INTO partner_wallets (partner_id) VALUES ($1) ON CONFLICT (partner_id) DO NOTHING`,
        [resolvedPartnerId]
      );
      const res = await client.query(
        `SELECT id, available_balance FROM partner_wallets WHERE partner_id = $1 FOR UPDATE`,
        [resolvedPartnerId]
      );
      wallet = res.rows[0];
    }

    if (!wallet) {
      throw new Error(`Partner wallet not found for partner_id: ${resolvedPartnerId}`);
    }

    const numAmount = parseFloat(amountInInr);
    const balanceBefore = parseFloat(wallet.available_balance || 0);
    const balanceAfter = balanceBefore + numAmount;
    const description = `Wallet top-up via Razorpay: ${paymentId}`;

    // 5. Insert into wallet_ledger
    const { rows: [txn] } = await client.query(`
      INSERT INTO wallet_ledger (
        wallet_id, partner_id, transaction_type, credit, debit, description, reference_number, status, created_by
      ) VALUES ($1, $2, 'ADJUSTMENT', $3, 0, $4, $5, 'Released', $6)
      RETURNING id
    `, [
      wallet.id, resolvedPartnerId, numAmount, description, paymentId, processedBy
    ]);

    // 6. Sync to wallet_transactions
    await syncTransactionTable(
      client, txn.id, wallet.id, resolvedPartnerId, null, 'TOPUP', numAmount,
      balanceBefore, balanceAfter, 'success', description, 'razorpay_payout', paymentId, processedBy
    );

    // 7. Re-calculate & update wallet balance atomically
    await syncWalletBalance(resolvedPartnerId, client);

    await client.query('COMMIT');
    logger.info(`[PAYMENT_SUCCESS] Credited ₹${numAmount} to partner ${resolvedPartnerId} (Payment: ${paymentId})`);

    return { alreadyProcessed: false, amount: numAmount, transactionId: txn.id };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`[PAYMENT_CREDIT_ERROR] Failed to credit wallet for payment ${paymentId}: ${err.message}`);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  resolvePartnerProfileId,
  ensureWallet,
  creditHold,
  releaseHold,
  debitAvailable,
  creditCommission,
  releaseCommission,
  processWithdrawal,
  getWalletSummary,
  adminAdjustWallet,
  syncWalletBalance,
  createImmutableLedgerEntry,
  sendWithdrawalOTP,
  verifyWithdrawalOTP,
  processWalletReconciliationDailyJob,
  generateWalletStatementData,
  manualReleaseCommission,
  manualRejectCommission,
  creditWalletFromPayment,
  verifyWalletReconciliation
};

