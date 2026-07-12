const { query, getClient } = require('../../config/database');
const { processWithdrawal, getWalletSummary, debitAvailable, adminAdjustWallet } = require('./service.js');
const { getPaginationParams } = require('../../utils/helpers/helpers');
const { success, error, notFound, paginate } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service.js');
const { encrypt, decrypt } = require('../../utils/helpers/crypto');

// GET /wallet / GET /wallet/:PartnerId
const getWallet = async (req, res, next) => {
  try {
    const PartnerId = req.params.PartnerId || (req.partner ? req.partner.id : null);
    if (!PartnerId) return error(res, 'Partner ID is required');

    const wallet = await getWalletSummary(PartnerId);
    if (!wallet) return notFound(res, 'Wallet not found');

    const mappedWallet = {
      ...wallet,
      pending_amount: wallet.hold_balance
    };
    return success(res, mappedWallet);
  } catch (err) {
    next(err);
  }
};

// GET /wallet/transactions / GET /wallet/:PartnerId/transactions
const getTransactions = async (req, res, next) => {
  try {
    const PartnerId = req.params.PartnerId || (req.partner ? req.partner.id : null);
    if (!PartnerId) return error(res, 'Partner ID is required');
    const { page, limit, offset } = getPaginationParams(req.query);
    const { type, status, from_date, to_date, search } = req.query;

    const { rows: [wallet] } = await query(`SELECT id FROM wallets WHERE partner_id = $1`, [PartnerId]);
    if (!wallet) return notFound(res, 'Wallet not found');

    let where = `WHERE wl.partner_id = $1`;
    const values = [PartnerId];
    let idx = 2;

    if (type) { 
      where += ` AND wl.transaction_type = $${idx++}`; 
      values.push(type); 
    }
    if (status) { 
      where += ` AND wl.status = $${idx++}`; 
      values.push(status); 
    }
    if (from_date) { 
      where += ` AND wl.created_at >= $${idx++}`; 
      values.push(from_date); 
    }
    if (to_date) { 
      where += ` AND wl.created_at <= $${idx++}`; 
      values.push(to_date + ' 23:59:59'); 
    }
    if (search) {
      where += ` AND (wl.description ILIKE $${idx} OR wl.reference_number ILIKE $${idx})`;
      idx++;
      values.push(`%${search}%`);
    }

    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM wallet_ledger wl ${where}`, values),
      query(`
        SELECT wl.*, a.app_number, c.full_name as customer_name, p.name as product_name, b.short_code as bank_code
        FROM wallet_ledger wl
        LEFT JOIN applications a ON a.id = wl.application_id
        LEFT JOIN customers c ON c.id = a.customer_id
        LEFT JOIN products p ON p.id = a.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        ${where}
        ORDER BY wl.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...values, limit, offset]),
    ]);

    return paginate(res, data.rows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /wallet/dashboard (Partner Wallet Analytics Summary)
const getWalletDashboard = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id;
    if (!partnerId) return error(res, 'Partner profile not found');

    const wallet = await getWalletSummary(partnerId);
    if (!wallet) return notFound(res, 'Wallet not found');

    // Past 6 months chart data aggregation from completed credits
    const { rows: history } = await query(`
      SELECT 
        TO_CHAR(created_at, 'Mon YYYY') as month_label,
        TO_CHAR(created_at, 'YYYY-MM') as month_val,
        SUM(credit) as total_credited
      FROM wallet_ledger
      WHERE partner_id = $1 AND status = 'completed' AND credit > 0
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month_val ASC
    `, [partnerId]);

    // Top Product commission categories
    const { rows: categories } = await query(`
      SELECT 
        p.category,
        COALESCE(SUM(wl.credit), 0) as total_earned
      FROM wallet_ledger wl
      JOIN applications a ON a.id = wl.application_id
      JOIN products p ON p.id = a.product_id
      WHERE wl.partner_id = $1 AND wl.status = 'completed' AND wl.credit > 0
      GROUP BY p.category
      ORDER BY total_earned DESC
    `, [partnerId]);

    return success(res, {
      wallet,
      history,
      categories
    });
  } catch (err) {
    next(err);
  }
};

// GET /wallet/commission-summary (Partner Case Commission aggregation)
const getCommissionSummary = async (req, res, next) => {
  try {
    const PartnerId = req.partner?.id;
    if (!PartnerId) return error(res, 'Partner profile not found');

    const { rows } = await query(`
      SELECT
        p.name as product_name, b.short_code as bank_code,
        COUNT(a.id) as total_cases,
        COUNT(a.id) FILTER (WHERE a.status IN ('approved','disbursed')) as approved_cases,
        COUNT(a.id) FILTER (WHERE a.status = 'rejected') as rejected_cases,
        COALESCE(SUM(wl.credit) FILTER (WHERE wl.status = 'completed'), 0) as commission_earned
      FROM wallet_ledger wl
      JOIN applications a ON a.id = wl.application_id
      JOIN products p ON p.id = a.product_id
      JOIN banks b ON b.id = p.bank_id
      WHERE wl.partner_id = $1
      GROUP BY p.id, p.name, b.short_code
      ORDER BY commission_earned DESC
    `, [PartnerId]);

    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// GET /wallet/bank-details (Secure bank details retriever)
const getBankDetails = async (req, res, next) => {
  try {
    const PartnerId = req.partner?.id;
    if (!PartnerId) return error(res, 'Partner profile not found');

    const { rows: [bank] } = await query(`
      SELECT id, bank_name, account_number, ifsc_code, account_holder_name, upi_id, is_verified 
      FROM partner_bank_details 
      WHERE partner_id = $1
    `, [PartnerId]);

    if (!bank) {
      return success(res, null, 'No bank details registered yet');
    }

    // Decrypt if encrypted
    if (bank.account_number && bank.account_number.includes(':')) {
      try {
        bank.account_number = decrypt(bank.account_number);
      } catch (decErr) {
        logger.warn('Failed to decrypt account number:', decErr.message);
      }
    }

    return success(res, bank);
  } catch (err) {
    next(err);
  }
};

// POST /wallet/bank-details (Register bank details for approved KYC partners)
const saveBankDetails = async (req, res, next) => {
  try {
    const PartnerId = req.partner?.id;
    if (!PartnerId) return error(res, 'Partner profile not found');

    const { bank_name, account_number, ifsc_code, account_holder_name, upi_id } = req.body;
    if (!bank_name && !upi_id) {
      return error(res, 'Bank Name or UPI ID is required');
    }

    // Verify KYC status
    const { rows: [partner] } = await query(`
      SELECT kyc_status FROM partner_profiles WHERE id = $1
    `, [PartnerId]);

    if (!partner || partner.kyc_status !== 'approved') {
      return error(res, 'Bank details can only be registered for partners with fully approved KYC status', 403);
    }

    const encryptedAccountNumber = account_number ? encrypt(account_number) : null;

    // Check existing
    const { rows: [existing] } = await query(`
      SELECT id FROM partner_bank_details WHERE partner_id = $1
    `, [PartnerId]);

    if (existing) {
      await query(`
        UPDATE partner_bank_details SET
          bank_name = COALESCE($1, bank_name),
          account_number = COALESCE($2, account_number),
          ifsc_code = COALESCE($3, ifsc_code),
          account_holder_name = COALESCE($4, account_holder_name),
          upi_id = COALESCE($5, upi_id),
          updated_at = NOW()
        WHERE id = $6
      `, [bank_name, encryptedAccountNumber, ifsc_code, account_holder_name, upi_id, existing.id]);
    } else {
      await query(`
        INSERT INTO partner_bank_details (partner_id, bank_name, account_number, ifsc_code, account_holder_name, upi_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [PartnerId, bank_name, encryptedAccountNumber, ifsc_code, account_holder_name, upi_id]);
    }

    await logAction(req, 'UPDATE_BANK_DETAILS', PartnerId, { bank_name, upi_id });
    return success(res, {}, 'Bank details successfully updated.');
  } catch (err) {
    next(err);
  }
};

// GET /wallet/reports (Get daily/weekly/monthly ledger statistics)
const getWalletReports = async (req, res, next) => {
  try {
    const PartnerId = req.partner?.id;
    if (!PartnerId) return error(res, 'Partner profile not found');

    const { rows: daily } = await query(`
      SELECT 
        DATE(created_at) as day,
        SUM(credit) as earned,
        SUM(debit) as debited
      FROM wallet_ledger
      WHERE partner_id = $1 AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY day DESC LIMIT 30
    `, [PartnerId]);

    return success(res, { daily });
  } catch (err) {
    next(err);
  }
};

// POST /wallet/withdraw / POST /wallet/:PartnerId/withdraw
const requestWithdrawal = async (req, res, next) => {
  const client = await getClient();
  try {
    const PartnerId = req.params.PartnerId || (req.partner ? req.partner.id : null);
    if (!PartnerId) return error(res, 'Partner ID is required');
    const { amount } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 100) {
      return error(res, 'Minimum withdrawal amount is ₹100');
    }

    await client.query('BEGIN');

    const { rows: [wallet] } = await client.query(
      `SELECT id, available_balance FROM partner_wallets WHERE partner_id = $1 FOR UPDATE`, [PartnerId]
    );
    if (!wallet) {
      await client.query('ROLLBACK');
      return notFound(res, 'Wallet not found');
    }

    if (parseFloat(wallet.available_balance) < parsedAmount) {
      await client.query('ROLLBACK');
      return error(res, `Insufficient balance. Available: ₹${wallet.available_balance}`);
    }

    const { rows: pending } = await client.query(
      `SELECT id FROM wallet_withdrawals WHERE partner_id = $1 AND status = 'pending'`, [PartnerId]
    );
    if (pending.length) {
      await client.query('ROLLBACK');
      return error(res, 'A withdrawal request is already pending');
    }

    // Get bank/upi details
    const { rows: [bank] } = await client.query(
      `SELECT id, bank_name, account_number, ifsc_code, upi_id FROM partner_bank_details WHERE partner_id = $1`, [PartnerId]
    );

    // Insert pending withdrawal request
    const { rows: [wr] } = await client.query(`
      INSERT INTO wallet_withdrawals (wallet_id, partner_id, amount, bank_name, account_number, ifsc_code, status, bank_account_id)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7) RETURNING id
    `, [wallet.id, PartnerId, parsedAmount, bank?.bank_name || 'UPI Settlement', bank?.account_number || null, bank?.ifsc_code || null, bank?.id || null]);

    await debitAvailable(PartnerId, parsedAmount, {
      reference_type: 'withdrawal',
      reference_id: wr.id,
      bank_name: bank?.bank_name || 'UPI Settlement',
      description: `Withdrawal request for ₹${parsedAmount}`
    }, client);

    await client.query('COMMIT');
    return success(res, { withdrawal_id: wr.id }, 'Withdrawal request submitted. Will be processed in 1-2 business days.');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    next(err);
  } finally {
    try { client.release(); } catch (_) {}
  }
};

// GET /wallet/withdrawals (Admin — list all pending)
const listWithdrawals = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status = 'pending' } = req.query;

    let countQuery = '';
    let dataQuery = '';
    let params = [];

    if (status === 'pending') {
      countQuery = `SELECT COUNT(*) FROM wallet_withdrawals WHERE status IN ('pending', 'approved', 'processing', 'failed')`;
      dataQuery = `
        SELECT wr.*, ap.partner_code, ap.first_name, ap.last_name, u.mobile, pbd.upi_id
        FROM wallet_withdrawals wr
        JOIN partner_profiles ap ON ap.id = wr.partner_id
        JOIN users u ON u.id = ap.user_id
        LEFT JOIN partner_bank_details pbd ON pbd.partner_id = ap.id
        WHERE wr.status IN ('pending', 'approved', 'processing', 'failed')
        ORDER BY wr.created_at ASC
        LIMIT $1 OFFSET $2
      `;
      params = [limit, offset];
    } else if (status === 'processed') {
      countQuery = `SELECT COUNT(*) FROM wallet_withdrawals WHERE status IN ('processed', 'transferred')`;
      dataQuery = `
        SELECT wr.*, ap.partner_code, ap.first_name, ap.last_name, u.mobile, pbd.upi_id
        FROM wallet_withdrawals wr
        JOIN partner_profiles ap ON ap.id = wr.partner_id
        JOIN users u ON u.id = ap.user_id
        LEFT JOIN partner_bank_details pbd ON pbd.partner_id = ap.id
        WHERE wr.status IN ('processed', 'transferred')
        ORDER BY wr.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      params = [limit, offset];
    } else {
      countQuery = `SELECT COUNT(*) FROM wallet_withdrawals WHERE status = $1`;
      dataQuery = `
        SELECT wr.*, ap.partner_code, ap.first_name, ap.last_name, u.mobile, pbd.upi_id
        FROM wallet_withdrawals wr
        JOIN partner_profiles ap ON ap.id = wr.partner_id
        JOIN users u ON u.id = ap.user_id
        LEFT JOIN partner_bank_details pbd ON pbd.partner_id = ap.id
        WHERE wr.status = $1
        ORDER BY wr.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      params = [status, limit, offset];
    }

    const [count, data] = await Promise.all([
      query(countQuery, params.length === 3 ? [params[0]] : []),
      query(dataQuery, params),
    ]);

    const { rows: [privacySetting] } = await query("SELECT value FROM system_settings WHERE key = 'admin_privacy_mode'");
    const isPrivacyOn = privacySetting && privacySetting.value === 'on';
    const shouldMask = isPrivacyOn && req.user && req.user.role === 'ADMIN';

    const processedRows = data.rows.map(row => {
      if (shouldMask) {
        return {
          ...row,
          first_name: 'Partner',
          last_name: row.partner_code,
          mobile: '**********',
          account_number: 'HIDDEN',
          ifsc_code: 'HIDDEN',
          upi_id: 'HIDDEN'
        };
      }
      if (row.account_number && row.account_number.includes(':')) {
        try {
          row.account_number = decrypt(row.account_number);
        } catch (_) {}
      }
      return row;
    });

    return paginate(res, processedRows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// PATCH /wallet/withdrawals/:id/process (Super Admin / Admin approval)
const processWithdrawalRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved, utr_number, rejection_reason, admin_note, action } = req.body;

    let determinedAction = action;
    if (!determinedAction) {
      determinedAction = approved ? (utr_number ? 'transfer' : 'approve') : 'reject';
    }

    await processWithdrawal(id, determinedAction, req.user.id, utr_number, rejection_reason, admin_note);

    const actionName = determinedAction === 'transfer' ? 'TRANSFER_WITHDRAWAL' : (determinedAction === 'approve' ? 'APPROVE_WITHDRAWAL' : 'REJECT_WITHDRAWAL');
    await logAction(req, actionName, id, { utr_number, rejection_reason, admin_note });

    return success(res, {}, `Withdrawal successfully processed: ${determinedAction}`);
  } catch (err) {
    next(err);
  }
};

// GET /wallet/:PartnerId/case-summary — commission per product
const getCaseSummary = async (req, res, next) => {
  try {
    const PartnerId = req.params.PartnerId || (req.partner ? req.partner.id : null);
    if (!PartnerId) return error(res, 'Partner ID is required');
    return getCommissionSummary(req, res, next);
  } catch (err) {
    next(err);
  }
};

// POST /wallet/adjust (Admin balance adjustments)
const adminAdjustWalletController = async (req, res, next) => {
  try {
    const { partner_id, amount, txn_type, description } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return error(res, 'Valid adjustment amount is required');
    }
    if (!['credit', 'debit'].includes(txn_type)) {
      return error(res, 'Transaction type must be either credit or debit');
    }
    if (!partner_id) {
      return error(res, 'Partner ID is required');
    }

    const txn = await adminAdjustWallet(partner_id, parsedAmount, txn_type, description || 'Manual admin adjustment', req.user.id);
    await logAction(req, 'MANUAL_WALLET_ADJUSTMENT', partner_id, { amount: parsedAmount, txn_type, description });

    return success(res, { transaction_id: txn.id }, `Wallet successfully adjusted by ₹${parsedAmount} (${txn_type})`);
  } catch (err) {
    next(err);
  }
};

const walletManualCredit = async (req, res, next) => {
  req.body.txn_type = 'credit';
  return adminAdjustWalletController(req, res, next);
};

const walletManualDebit = async (req, res, next) => {
  req.body.txn_type = 'debit';
  return adminAdjustWalletController(req, res, next);
};
const approveWithdrawalController = async (req, res, next) => {
  try {
    const { id, utr_number, admin_note, action } = req.body;
    if (!id) return error(res, 'Withdrawal request ID is required');

    let determinedAction = action;
    if (!determinedAction) {
      determinedAction = utr_number ? 'transfer' : 'approve';
    }

    await processWithdrawal(id, determinedAction, req.user.id, utr_number, null, admin_note);

    const actionName = determinedAction === 'transfer' ? 'TRANSFER_WITHDRAWAL' : 'APPROVE_WITHDRAWAL';
    await logAction(req, actionName, id, { utr_number, admin_note });

    return success(res, {}, `Withdrawal request successfully processed: ${determinedAction}`);
  } catch (err) {
    next(err);
  }
};

// POST /withdrawal/reject (Admin)
const rejectWithdrawalController = async (req, res, next) => {
  try {
    const { id, rejection_reason, admin_note } = req.body;
    if (!id) return error(res, 'Withdrawal request ID is required');
    if (!rejection_reason) return error(res, 'Rejection reason is required to reject withdrawal');

    await processWithdrawal(id, 'reject', req.user.id, null, rejection_reason, admin_note);
    await logAction(req, 'REJECT_WITHDRAWAL', id, { rejection_reason, admin_note });

    return success(res, {}, 'Withdrawal request successfully rejected');
  } catch (err) {
    next(err);
  }
};

// Super Admin wallet overview (wallets summary of all partners)
const getWalletOverview = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { search } = req.query;

    let where = '';
    const values = [];
    if (search) {
      where = 'WHERE ap.first_name ILIKE $1 OR ap.last_name ILIKE $1 OR ap.partner_code ILIKE $1';
      values.push(`%${search}%`);
    }

    const [count, data] = await Promise.all([
      query(`
        SELECT COUNT(*) 
        FROM partner_wallets w
        JOIN partner_profiles ap ON ap.id = w.partner_id
        ${where}
      `, values),
      query(`
        SELECT w.*, ap.partner_code, ap.first_name, ap.last_name, u.email
        FROM partner_wallets w
        JOIN partner_profiles ap ON ap.id = w.partner_id
        JOIN users u ON u.id = ap.user_id
        ${where}
        ORDER BY w.available_balance DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `, [...values, limit, offset])
    ]);

    return paginate(res, data.rows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// Super Admin comprehensive Ledger (all ledger lines)
const getWalletLedger = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { partner_id, transaction_type, status, search } = req.query;

    let where = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (partner_id) {
      where += ` AND wl.partner_id = $${idx++}`;
      values.push(partner_id);
    }
    if (transaction_type) {
      where += ` AND wl.transaction_type = $${idx++}`;
      values.push(transaction_type);
    }
    if (status) {
      where += ` AND wl.status = $${idx++}`;
      values.push(status);
    }
    if (search) {
      where += ` AND (wl.description ILIKE $${idx} OR ap.partner_code ILIKE $${idx} OR ap.first_name ILIKE $${idx})`;
      idx++;
      values.push(`%${search}%`);
    }

    const [count, data] = await Promise.all([
      query(`
        SELECT COUNT(*) 
        FROM wallet_ledger wl
        JOIN partner_profiles ap ON ap.id = wl.partner_id
        ${where}
      `, values),
      query(`
        SELECT wl.*, ap.partner_code, ap.first_name, ap.last_name,
               a.app_number, p.name as product_name
        FROM wallet_ledger wl
        JOIN partner_profiles ap ON ap.id = wl.partner_id
        LEFT JOIN applications a ON a.id = wl.application_id
        LEFT JOIN products p ON p.id = a.product_id
        ${where}
        ORDER BY wl.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...values, limit, offset])
    ]);

    return paginate(res, data.rows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

const listPartnerWithdrawals = async (req, res, next) => {
  try {
    const partnerId = req.partner?.id;
    if (!partnerId) return error(res, 'Partner profile not found');
    const { page, limit, offset } = getPaginationParams(req.query);

    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM wallet_withdrawals WHERE partner_id = $1`, [partnerId]),
      query(`
        SELECT * FROM wallet_withdrawals 
        WHERE partner_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `, [partnerId, limit, offset])
    ]);

    // Decrypt account number
    const { decrypt } = require('../../utils/helpers/crypto');
    const rows = data.rows.map(row => {
      if (row.account_number) {
        try { row.account_number = decrypt(row.account_number); } catch (_) {}
      }
      return row;
    });

    return paginate(res, rows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

const getSelfWallet = async (req, res, next) => getWallet(req, res, next);
const getSelfTransactions = async (req, res, next) => getTransactions(req, res, next);
const requestSelfWithdrawal = async (req, res, next) => requestWithdrawal(req, res, next);

// POST /api/v1/razorpay/webhook (Unauthenticated)
const handleRazorpayWebhook = async (req, res, next) => {
  const client = await getClient();
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify signature in production
    if (process.env.NODE_ENV === 'production' && secret) {
      const crypto = require('crypto');
      const shasum = crypto.createHmac('sha256', secret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');
      if (digest !== signature) {
        return error(res, 'Signature mismatch', 400);
      }
    }

    const { event, payload } = req.body;
    if (!payload || !payload.payout || !payload.payout.entity) {
      return success(res, {}, 'Ignored non-payout event');
    }

    const payout = payload.payout.entity;
    const withdrawalId = payout.reference_id; // WD reference ID
    if (!withdrawalId) {
      return success(res, {}, 'No reference ID found in payout');
    }

    await client.query('BEGIN');

    // Lock withdrawal row
    const { rows: [wr] } = await client.query(
      `SELECT * FROM wallet_withdrawals WHERE id = $1 FOR UPDATE`,
      [withdrawalId]
    );

    if (!wr) {
      await client.query('ROLLBACK');
      return success(res, {}, 'Withdrawal request not found in database');
    }

    const utr = payout.utr || wr.utr;
    const payoutId = payout.id;
    const failureReason = payout.failure_reason || null;

    if (event === 'payout.processed') {
      if (wr.status === 'transferred') {
        await client.query('ROLLBACK');
        return success(res, {}, 'Payout already marked transferred');
      }

      // Update status to transferred
      await client.query(`
        UPDATE wallet_withdrawals SET
          status = 'transferred',
          utr = $1,
          razorpay_payout_id = $2,
          updated_at = NOW()
        WHERE id = $3
      `, [utr, payoutId, withdrawalId]);

      // Complete the ledger transaction
      await client.query(`
        UPDATE wallet_ledger SET
          status = 'completed',
          reference_number = COALESCE($1, reference_number)
        WHERE transaction_type = 'WITHDRAWAL' AND (reference_number = $2 OR reference_number IS NULL) AND status = 'pending' AND partner_id = $3
      `, [utr || payoutId, withdrawalId.toString(), wr.partner_id]);

      const { rows: ledgerRows } = await client.query(
        `SELECT id, wallet_id, credit, debit FROM wallet_ledger 
         WHERE transaction_type = 'WITHDRAWAL' AND reference_number = $1 AND partner_id = $2`,
        [withdrawalId.toString(), wr.partner_id]
      );
      for (const row of ledgerRows) {
        await syncTransactionTable(client, row.id, row.wallet_id, wr.partner_id, null, null, parseFloat(row.debit), null, null, 'completed', `Withdrawal transferred (Webhook) - UTR: ${utr}`, null, null, null);
      }

      // Record in partner settlements
      await client.query(`
        INSERT INTO partner_settlements (withdrawal_id, partner_id, payment_mode, utr_number, settled_at, status)
        VALUES ($1, $2, 'Bank Transfer', $3, NOW(), 'completed')
        ON CONFLICT (withdrawal_id) DO NOTHING
      `, [withdrawalId, wr.partner_id, utr || payoutId]);

      await syncWalletBalance(wr.partner_id, client);
      await client.query('COMMIT');

      // Notify
      const { rows: [partner] } = await client.query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [wr.partner_id]);
      if (partner) {
        try {
          await notify.withdrawalApproved(partner.user_id, wr.amount);
        } catch (_) {}
      }

    } else if (event === 'payout.failed' || event === 'payout.reversed') {
      if (wr.status === 'failed' || wr.status === 'rejected') {
        await client.query('ROLLBACK');
        return success(res, {}, 'Payout already marked failed/rejected');
      }

      // Update status to failed
      await client.query(`
        UPDATE wallet_withdrawals SET
          status = 'failed',
          failure_reason = $1,
          razorpay_payout_id = $2,
          updated_at = NOW()
        WHERE id = $3
      `, [failureReason, payoutId, withdrawalId]);

      // Reject ledger transaction (unlock available balance)
      await client.query(`
        UPDATE wallet_ledger SET
          status = 'rejected',
          description = COALESCE(description, '') || ' [Failed via Webhook]'
        WHERE transaction_type = 'WITHDRAWAL' AND (reference_number = $1 OR reference_number IS NULL) AND status = 'pending' AND partner_id = $2
      `, [withdrawalId.toString(), wr.partner_id]);

      const { rows: ledgerRows } = await client.query(
        `SELECT id, wallet_id, credit, debit FROM wallet_ledger 
         WHERE transaction_type = 'WITHDRAWAL' AND reference_number = $1 AND partner_id = $2`,
        [withdrawalId.toString(), wr.partner_id]
      );
      for (const row of ledgerRows) {
        await syncTransactionTable(client, row.id, row.wallet_id, wr.partner_id, null, null, parseFloat(row.debit), null, null, 'rejected', `Withdrawal failed (Webhook) - Reason: ${failureReason}`, null, null, null);
      }

      await syncWalletBalance(wr.partner_id, client);
      await client.query('COMMIT');

      // Notify partner of failure
      const { rows: [partner] } = await client.query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [wr.partner_id]);
      if (partner) {
        try {
          await notify.withdrawalRejected(partner.user_id, wr.amount, failureReason || 'Razorpay payout failed');
        } catch (_) {}
      }
    } else {
      await client.query('ROLLBACK');
    }

    return success(res, {}, 'Webhook handled successfully');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    next(err);
  } finally {
    try { client.release(); } catch (_) {}
  }
};

module.exports = {
  getWallet,
  getTransactions,
  requestWithdrawal,
  listWithdrawals,
  processWithdrawalRequest,
  getCaseSummary,
  getSelfWallet,
  getSelfTransactions,
  requestSelfWithdrawal,
  adminAdjustWalletController,
  approveWithdrawalController,
  rejectWithdrawalController,
  getWalletDashboard,
  getCommissionSummary,
  getBankDetails,
  saveBankDetails,
  getWalletReports,
  getWalletOverview,
  getWalletLedger,
  listPartnerWithdrawals,
  walletManualCredit,
  walletManualDebit,
  handleRazorpayWebhook
};
