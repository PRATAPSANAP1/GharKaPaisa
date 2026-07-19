const { query, getClient } = require('../../config/database');
const { notify } = require('../notifications/service.js');
const logger = require('../../config/logger');

// Ensure wallet exists for partner (called on partner approval)
const ensureWallet = async (partnerId, client = null) => {
  const db = client || { query };
  await db.query(`
    INSERT INTO partner_wallets (partner_id) VALUES ($1)
    ON CONFLICT (partner_id) DO NOTHING
  `, [partnerId]);
};

// Sync transactions table helper to ensure wallet_transactions replicates wallet_ledger
const syncTransactionTable = async (client, ledgerTxnId, walletId, partnerId, applicationId, type, amount, balanceBefore, balanceAfter, status, description, referenceType, referenceId, processedBy, meta = {}) => {
  const { rows } = await client.query(`SELECT id FROM wallet_transactions WHERE id = $1`, [ledgerTxnId]);
  
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
      walletId,
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
  const { rows: [p] } = await client.query(`SELECT id, user_id FROM partner_profiles WHERE id = $1 OR user_id = $1`, [partnerId]);
  const pId = p ? p.id : partnerId;
  const uId = p ? p.user_id : partnerId;

  // 1. Completed Credits (excluding debits)
  const creditQuery = await client.query(`
    SELECT 
      COALESCE(SUM(credit), 0) as completed_credits,
      COALESCE(SUM(CASE WHEN transaction_type = 'TEAM_COMMISSION' THEN credit ELSE 0 END), 0) as team_earn,
      COALESCE(SUM(CASE WHEN transaction_type = 'PERSONAL_COMMISSION' THEN credit ELSE 0 END), 0) as personal_earn,
      COALESCE(SUM(CASE WHEN transaction_type = 'REFERRAL_BONUS' THEN credit ELSE 0 END), 0) as ref_bonus,
      COALESCE(SUM(CASE WHEN transaction_type = 'OVERRIDE_COMMISSION' THEN credit ELSE 0 END), 0) as override_earn
    FROM wallet_ledger 
    WHERE (partner_id = $1 OR partner_id = $2::uuid) AND status = 'Released'
  `, [pId, uId]);
  
  // 2. Completed Debits (e.g. withdrawal payouts settled)
  const debitQuery = await client.query(`
    SELECT 
      COALESCE(SUM(debit), 0) as completed_debits
    FROM wallet_ledger 
    WHERE (partner_id = $1 OR partner_id = $2::uuid) AND status = 'Released'
  `, [pId, uId]);

  // 3. Hold Balance = Pending Credits
  const holdQuery = await client.query(`
    SELECT 
      COALESCE(SUM(credit), 0) as hold_bal,
      COALESCE(SUM(CASE WHEN transaction_type = 'TEAM_COMMISSION' THEN credit ELSE 0 END), 0) as team_pending
    FROM wallet_ledger 
    WHERE (partner_id = $1 OR partner_id = $2::uuid) AND status = 'Pending Approval'
  `, [pId, uId]);

  // 4. Locked Balance = Pending/Approved Withdrawal Requests
  const lockedQuery = await client.query(`
    SELECT 
      COALESCE(SUM(amount), 0) as locked_bal
    FROM wallet_withdrawals
    WHERE (partner_id = $1 OR partner_id = $2::uuid) AND status IN ('pending', 'approved', 'processing')
  `, [pId, uId]);

  const cr = creditQuery.rows[0];
  const db = debitQuery.rows[0];
  const hd = holdQuery.rows[0];
  const lk = lockedQuery.rows[0];

  const completedCredits = parseFloat(cr.completed_credits);
  const completedDebits = parseFloat(db.completed_debits);
  const holdBalance = parseFloat(hd.hold_bal);
  const lockedBalance = parseFloat(lk.locked_bal);

  const availableBalance = completedCredits - completedDebits - lockedBalance;
  const totalEarned = parseFloat(cr.team_earn) + parseFloat(cr.personal_earn) + parseFloat(cr.ref_bonus) + parseFloat(cr.override_earn || 0);
  const totalWithdrawn = completedDebits;

  await client.query(`
    UPDATE partner_wallets SET
      available_balance = $1,
      hold_balance = $2,
      total_earned = $3,
      total_withdrawn = $4,
      personal_earnings = $5,
      team_earnings = $6,
      referral_bonus = $7,
      pending_team_commission = $8,
      pending_balance = $9,
      withdrawn_balance = $10,
      override_balance = $11,
      locked_balance = $12,
      last_updated = NOW()
    WHERE partner_id = $13
  `, [
    availableBalance, 
    holdBalance, 
    totalEarned, 
    totalWithdrawn, 
    parseFloat(cr.personal_earn), 
    parseFloat(cr.team_earn), 
    parseFloat(cr.ref_bonus), 
    parseFloat(hd.team_pending),
    holdBalance, 
    totalWithdrawn, 
    parseFloat(cr.override_earn || 0), 
    lockedBalance,
    partnerId
  ]);

  return { availableBalance, holdBalance, totalEarned };
};

// Credit money to Hold Balance (e.g. commission credit pending verification)
const creditHold = async (partnerId, amount, meta = {}, existingClient = null) => {
  const client = existingClient || await getClient();
  const isInternalTxn = !existingClient;
  try {
    if (isInternalTxn) await client.query('BEGIN');

    // Resolve partner profile ID in case user_id was passed
    let resolvedPartnerId = partnerId;
    const { rows: [p] } = await client.query(
      `SELECT id FROM partner_profiles WHERE id = $1 OR user_id = $1`,
      [partnerId]
    );
    if (p) {
      resolvedPartnerId = p.id;
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
      const { rows: [app] } = await client.query(
        `SELECT product_id, bank_id FROM applications WHERE id = $1`,
        [appId]
      );
      if (app) {
        productId = app.product_id || productId;
        bankId = app.bank_id || bankId;
      }
    }

    const { rows: [txn] } = await client.query(`
      INSERT INTO wallet_ledger (
        wallet_id, partner_id, application_id, transaction_type, credit, debit, description, reference_number, status, created_by, product_id, bank_id
      ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, 'Pending Approval', $8, $9, $10)
      RETURNING id
    `, [
      wallet.id, resolvedPartnerId, appId, txnType, amount, 
      meta.description || 'Commission credit pending approval', 
      meta.reference_id || appId || null,
      meta.processed_by || null,
      productId,
      bankId
    ]);

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

    // Get wallet
    const { rows: [wallet] } = await client.query(
      `SELECT id, available_balance FROM partner_wallets WHERE partner_id = $1 FOR UPDATE`,
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
      description: `Team Commission from ${partner.first_name} ${partner.last_name || ''} (${partner.partner_code}) - Parent ${parentPct}%`
    };
    await creditHold(partner.parent_partner_id, parentAmount, parentMeta);

    try {
      const { rows: [parentUser] } = await query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [partner.parent_partner_id]);
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

// Release money from Hold Balance to Available Balance (Approved commission)
const releaseHold = async (partnerId, amount, meta = {}, existingClient = null) => {
  const client = existingClient || await getClient();
  const isInternalTxn = !existingClient;
  try {
    if (isInternalTxn) await client.query('BEGIN');

    // Resolve partner profile ID
    let resolvedPartnerId = partnerId;
    const { rows: [p] } = await client.query(
      `SELECT id FROM partner_profiles WHERE id::text = $1::text OR user_id::text = $1::text`,
      [String(partnerId)]
    );
    if (p) {
      resolvedPartnerId = p.id;
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
    const status = 'Approved';
    const balanceBefore = parseFloat(wallet.available_balance || 0);
    const balanceAfter = balanceBefore + parseFloat(amount);

    // Update wallet_ledger status if txn_id provided
    if (meta.txn_id) {
      await client.query(`
        UPDATE wallet_ledger 
        SET status = 'Approved', updated_at = NOW() 
        WHERE id::text = $1::text
      `, [String(meta.txn_id)]);
    }

    // Insert release transaction in wallet_ledger
    const { rows: [txn] } = await client.query(`
      INSERT INTO wallet_ledger (
        wallet_id, partner_id, transaction_type, credit, debit, description, reference_number, status, created_by
      ) VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8)
      RETURNING id
    `, [
      wallet.id, resolvedPartnerId, txnType, amount,
      meta.description || 'Commission release to available balance',
      meta.reference_id || meta.txn_id || null,
      status,
      meta.processed_by || null
    ]);

    await syncTransactionTable(client, txn.id, wallet.id, resolvedPartnerId, meta.application_id || null, txnType, amount, balanceBefore, balanceAfter, status, meta.description || 'Commission release to available balance', meta.reference_type || 'hold_release', meta.reference_id || meta.txn_id || null, meta.processed_by || null, {
      remarks: meta.remarks || null
    });

    await syncWalletBalance(resolvedPartnerId, client);

    if (isInternalTxn) await client.query('COMMIT');
    logger.info(`releaseHold: Released ₹${amount} to available balance for partner ${resolvedPartnerId}`);
    return txn;
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
const processWithdrawal = async (withdrawalId, action, processedBy, utrNumber = null, rejectionReason = null, adminNote = null) => {
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
          processed_by = $1,
          processed_at = NOW(),
          admin_note = $2,
          updated_at = NOW()
        WHERE id = $3
      `, [processedBy, adminNote, withdrawalId]);

    } else if (action === 'reject') {
      if (!['pending', 'approved', 'failed'].includes(wr.status)) {
        throw new Error(`Cannot reject withdrawal in status: ${wr.status}`);
      }

      await client.query(`
        UPDATE wallet_ledger SET
          status = 'rejected',
          created_by = $1,
          description = COALESCE(description, '') || ' [Rejected]'
        WHERE transaction_type = 'WITHDRAWAL' AND (reference_number = $2 OR reference_number IS NULL) AND status = 'pending' AND partner_id = $3
      `, [processedBy, withdrawalId.toString(), wr.partner_id]);

      const { rows: ledgerRows } = await client.query(
        `SELECT id, wallet_id, credit, debit FROM wallet_ledger 
         WHERE transaction_type = 'WITHDRAWAL' AND reference_number = $1 AND partner_id = $2`,
        [withdrawalId.toString(), wr.partner_id]
      );
      for (const row of ledgerRows) {
        await syncTransactionTable(client, row.id, row.wallet_id, wr.partner_id, null, null, parseFloat(row.debit), null, null, 'rejected', `Withdrawal rejected - Reason: ${rejectionReason}`, null, null, processedBy);
      }

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

    } else if (action === 'transfer' || utrNumber) {
      if (utrNumber) {
        // Manual Transfer recording
        await client.query(`
          UPDATE wallet_ledger SET
            status = 'completed',
            created_by = $1,
            reference_number = COALESCE($2, reference_number)
          WHERE transaction_type = 'WITHDRAWAL' AND (reference_number = $3 OR reference_number IS NULL) AND status = 'pending' AND partner_id = $4
        `, [processedBy, utrNumber, withdrawalId.toString(), wr.partner_id]);

        const { rows: ledgerRows } = await client.query(
          `SELECT id, wallet_id, credit, debit FROM wallet_ledger 
           WHERE transaction_type = 'WITHDRAWAL' AND reference_number = $1 AND partner_id = $2`,
          [withdrawalId.toString(), wr.partner_id]
        );
        for (const row of ledgerRows) {
          await syncTransactionTable(client, row.id, row.wallet_id, wr.partner_id, null, null, parseFloat(row.debit), null, null, 'completed', `Withdrawal approved (Manual) - UTR: ${utrNumber}`, null, null, processedBy);
        }

        await client.query(`
          UPDATE wallet_withdrawals SET
            status = 'transferred',
            utr = $1,
            transferred_by = $2,
            transferred_at = NOW(),
            admin_note = $3,
            updated_at = NOW()
          WHERE id = $4
        `, [utrNumber, processedBy, adminNote, withdrawalId]);

        // Record in partner settlements
        await client.query(`
          INSERT INTO partner_settlements (withdrawal_id, partner_id, payment_mode, utr_number, settled_at, status)
          VALUES ($1, $2, 'Bank Transfer', $3, NOW(), 'completed')
          ON CONFLICT (withdrawal_id) DO NOTHING
        `, [withdrawalId, wr.partner_id, utrNumber]);

      } else {
        // Razorpay Transfer API call
        const { rows: [partner] } = await client.query(
          `SELECT first_name, last_name, mobile, email, id, user_id FROM partner_profiles WHERE id = $1`,
          [wr.partner_id]
        );
        const { rows: [bank] } = await client.query(
          `SELECT id, bank_name, account_number, ifsc_code, account_holder_name FROM partner_bank_details WHERE partner_id = $1`,
          [wr.partner_id]
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
        }

        let fundAccountId = wr.razorpay_fund_account_id;
        if (!fundAccountId) {
          const fundAcc = await createRazorpayFundAccount(contactId, decryptedBank, wr.id);
          fundAccountId = fundAcc.id;
        }

        const payout = await createRazorpayPayout(fundAccountId, parseFloat(wr.amount), wr.id);

        const payoutId = payout.id;
        const utr = payout.utr || null;
        const bankRef = payout.bank_reference || null;
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
          await client.query(`
            UPDATE wallet_ledger SET
              status = 'completed',
              created_by = $1,
              reference_number = COALESCE($2, reference_number)
            WHERE transaction_type = 'WITHDRAWAL' AND (reference_number = $3 OR reference_number IS NULL) AND status = 'pending' AND partner_id = $4
          `, [processedBy, utr || payoutId, wr.id.toString(), wr.partner_id]);

          const { rows: ledgerRows } = await client.query(
            `SELECT id, wallet_id, credit, debit FROM wallet_ledger 
             WHERE transaction_type = 'WITHDRAWAL' AND reference_number = $1 AND partner_id = $2`,
            [wr.id.toString(), wr.partner_id]
          );
          for (const row of ledgerRows) {
            await syncTransactionTable(client, row.id, row.wallet_id, wr.partner_id, null, null, parseFloat(row.debit), null, null, 'completed', `Withdrawal transferred - UTR: ${utr}`, null, null, processedBy);
          }

          // Record in partner settlements
          await client.query(`
            INSERT INTO partner_settlements (withdrawal_id, partner_id, payment_mode, utr_number, settled_at, status)
            VALUES ($1, $2, 'Bank Transfer', $3, NOW(), 'completed')
            ON CONFLICT (withdrawal_id) DO NOTHING
          `, [withdrawalId, wr.partner_id, utr || payoutId]);
        }
      }
    }

    await syncWalletBalance(wr.partner_id, client);
    await client.query('COMMIT');

    // Notify Partner
    const { rows: [partner] } = await client.query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [wr.partner_id]);
    if (partner) {
      try {
        if (action === 'approve') {
          await notify.withdrawalApproved(partner.user_id, wr.amount);
        } else if (action === 'reject') {
          await notify.withdrawalRejected(partner.user_id, wr.amount, rejectionReason);
        } else if (action === 'transfer' && utrNumber) {
          // Success manual transfer
          await notify.withdrawalApproved(partner.user_id, wr.amount);
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
  // Resolve actual partner profile ID if user_id was passed
  const { rows: [partner] } = await query(
    `SELECT id FROM partner_profiles WHERE id = $1 OR user_id = $1`,
    [partnerId]
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

  await query(`
    INSERT INTO wallet_withdrawals (partner_id, amount, status, otp_code, otp_expires_at)
    VALUES ($1, $2, 'otp_pending', $3, $4)
  `, [partnerId, amount, otpCode, expiresAt]);

  logger.info(`Withdrawal OTP for partner ${partnerId}: ${otpCode}`);

  // Auto notification
  await notify.partner(
    partnerId,
    '🔐 Withdrawal Security OTP',
    `Your OTP for ₹${amount.toLocaleString()} payout request is: ${otpCode}. Valid for 10 minutes.`,
    { type: 'WITHDRAWAL_OTP', otp: otpCode }
  ).catch(() => null);

  return { otp_sent: true, expires_in_seconds: 600, mock_otp: otpCode };
};

/**
 * Verify Withdrawal OTP
 */
const verifyWithdrawalOTP = async (partnerId, otpCode) => {
  const { rows: [reqRow] } = await query(`
    SELECT * FROM wallet_withdrawals
    WHERE partner_id = $1 AND status = 'otp_pending' AND otp_code = $2 AND otp_expires_at >= NOW()
    ORDER BY created_at DESC LIMIT 1
  `, [partnerId, otpCode]);

  if (!reqRow) {
    throw new Error('Invalid or expired OTP code');
  }

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
    const { rows: [w] } = await query(`SELECT available_balance, hold_balance FROM partner_wallets WHERE partner_id = $1`, [p.id]);
    const { rows: [l] } = await query(`
      SELECT 
        COALESCE(SUM(credit), 0) - COALESCE(SUM(debit), 0) as ledger_tot
      FROM wallet_ledger 
      WHERE partner_id = $1 AND status = 'completed'
    `, [p.id]);

    const walletBal = parseFloat(w?.available_balance || 0) + parseFloat(w?.hold_balance || 0);
    const ledgerBal = parseFloat(l?.ledger_tot || 0);
    const diff = Math.abs(walletBal - ledgerBal);

    const isMatch = diff < 0.01;
    await query(`
      INSERT INTO wallet_reconciliation (partner_id, wallet_balance, ledger_balance, discrepancy, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [p.id, walletBal, ledgerBal, diff, isMatch ? 'matched' : 'mismatch', isMatch ? 'Daily audit verified' : 'Discrepancy detected']);

    totalReconciled++;
    if (!isMatch) discrepanciesCount++;
  }

  return { total_reconciled: totalReconciled, discrepancies: discrepanciesCount };
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
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // 1. Get the ledger transaction
    const { rows: [ledgerTxn] } = await client.query(
      `SELECT id, partner_id, credit, transaction_type, description, status FROM wallet_ledger WHERE id = $1 FOR UPDATE`,
      [transactionId]
    );
    if (!ledgerTxn) throw new Error('Transaction not found in ledger');
    if (ledgerTxn.status === 'Released') throw new Error('Commission already released');
    if (ledgerTxn.status === 'Rejected') throw new Error('Commission already rejected');

    const amount = parseFloat(ledgerTxn.credit || 0);

    // 2. Update wallet_ledger
    await client.query(`
      UPDATE wallet_ledger 
      SET status = 'Released', 
          description = COALESCE(description, '') || ' [Released by Admin]'
      WHERE id = $1
    `, [transactionId]);

    // 3. Update wallet_transactions
    await syncTransactionTable(
      client, 
      transactionId, 
      null, 
      ledgerTxn.partner_id, 
      null, 
      ledgerTxn.transaction_type, 
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

    // 4. Sync Wallet Balance
    await syncWalletBalance(ledgerTxn.partner_id, client);

    await client.query('COMMIT');
    logger.info(`Commission transaction ${transactionId} manually released by admin ${processedBy}`);

    // 5. Notify Partner
    const { rows: [partner] } = await client.query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [ledgerTxn.partner_id]);
    if (partner) {
      try {
        await notify.commissionCredited(partner.user_id, amount);
        const { createNotification } = require('../notifications/service.js');
        await createNotification(
          partner.user_id,
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
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('manualReleaseCommission failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

const manualRejectCommission = async (transactionId, processedBy, remarks = null) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // 1. Get the ledger transaction
    const { rows: [ledgerTxn] } = await client.query(
      `SELECT id, partner_id, credit, transaction_type, description, status FROM wallet_ledger WHERE id = $1 FOR UPDATE`,
      [transactionId]
    );
    if (!ledgerTxn) throw new Error('Transaction not found in ledger');
    if (ledgerTxn.status === 'Released') throw new Error('Commission already released');
    if (ledgerTxn.status === 'Rejected') throw new Error('Commission already rejected');

    const amount = parseFloat(ledgerTxn.credit || 0);

    // 2. Update wallet_ledger
    await client.query(`
      UPDATE wallet_ledger 
      SET status = 'Rejected', 
          description = COALESCE(description, '') || ' [Rejected by Admin]'
      WHERE id = $1
    `, [transactionId]);

    // 3. Update wallet_transactions
    await syncTransactionTable(
      client, 
      transactionId, 
      null, 
      ledgerTxn.partner_id, 
      null, 
      ledgerTxn.transaction_type, 
      amount, 
      null, 
      null, 
      'Rejected', 
      ledgerTxn.description || 'Commission rejected by Admin', 
      null, 
      null, 
      processedBy, 
      { remarks }
    );

    // 4. Sync Wallet Balance
    await syncWalletBalance(ledgerTxn.partner_id, client);

    await client.query('COMMIT');
    logger.info(`Commission transaction ${transactionId} manually rejected by admin ${processedBy}`);

    // 5. Notify Partner
    const { rows: [partner] } = await client.query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [ledgerTxn.partner_id]);
    if (partner) {
      try {
        const { createNotification } = require('../notifications/service.js');
        await createNotification(
          partner.user_id,
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
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('manualRejectCommission failed:', err.message);
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
  adminAdjustWallet,
  syncWalletBalance,
  createImmutableLedgerEntry,
  sendWithdrawalOTP,
  verifyWithdrawalOTP,
  processWalletReconciliationDailyJob,
  generateWalletStatementData,
  manualReleaseCommission,
  manualRejectCommission
};
