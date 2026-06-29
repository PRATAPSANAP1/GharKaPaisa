const { query, getClient } = require('../../config/database');
const { processWithdrawal, getWalletSummary, debitAvailable, adminAdjustWallet } = require('./service.js');
const { getPaginationParams } = require('../../utils/helpers/helpers');
const { success, error, notFound, paginate } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service.js');

// GET /wallet / GET /wallet/:PartnerId
const getWallet = async (req, res, next) => {
  try {
    const PartnerId = req.params.PartnerId || (req.partner ? req.partner.id : null);
    if (!PartnerId) return error(res, 'Partner ID is required');

    const wallet = await getWalletSummary(PartnerId);
    if (!wallet) return notFound(res, 'Wallet not found');

    // Map hold_balance to pending_amount for backward compatibility
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
    const { type, status, from_date, to_date } = req.query;

    // Check if wallet exists
    const { rows: [wallet] } = await query(`SELECT id FROM wallets WHERE Partner_id = $1`, [PartnerId]);
    if (!wallet) return notFound(res, 'Wallet not found');

    let where = `WHERE w.Partner_id = $1`;
    const values = [PartnerId];
    let idx = 2;

    if (type) { where += ` AND wt.type = $${idx++}`; values.push(type); }
    if (status) { where += ` AND wt.status = $${idx++}`; values.push(status); }
    if (from_date) { where += ` AND wt.created_at >= $${idx++}`; values.push(from_date); }
    if (to_date) { where += ` AND wt.created_at <= $${idx++}`; values.push(to_date + ' 23:59:59'); }

    const [count, data] = await Promise.all([
      query(`
        SELECT COUNT(*) 
        FROM wallet_transactions wt 
        JOIN wallets w ON w.id = wt.wallet_id
        ${where}
      `, values),
      query(`
        SELECT wt.*, a.app_number, c.full_name as customer_name, p.name as product_name, b.short_code as bank_code
        FROM wallet_transactions wt
        JOIN wallets w ON w.id = wt.wallet_id
        LEFT JOIN applications a ON a.id = wt.application_id
        LEFT JOIN customers c ON c.id = a.customer_id
        LEFT JOIN products p ON p.id = a.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        ${where}
        ORDER BY wt.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...values, limit, offset]),
    ]);

    return paginate(res, data.rows, parseInt(count.rows[0].count), page, limit);
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

    // Get wallet summary and lock the wallet row inside transaction
    const { rows: [wallet] } = await client.query(
      `SELECT id, available_balance FROM wallets WHERE Partner_id = $1 FOR UPDATE`, [PartnerId]
    );
    if (!wallet) {
      await client.query('ROLLBACK');
      return notFound(res, 'Wallet not found');
    }

    if (parseFloat(wallet.available_balance) < parsedAmount) {
      await client.query('ROLLBACK');
      return error(res, `Insufficient balance. Available: ₹${wallet.available_balance}`);
    }

    // Check no pending withdrawal
    const { rows: pending } = await client.query(
      `SELECT id FROM withdrawal_requests WHERE Partner_id = $1 AND status = 'pending'`, [PartnerId]
    );
    if (pending.length) {
      await client.query('ROLLBACK');
      return error(res, 'A withdrawal request is already pending');
    }

    // Get bank details
    const { rows: [bank] } = await client.query(
      `SELECT bank_name, account_number, ifsc_code FROM Partner_bank_details WHERE Partner_id = $1`, [PartnerId]
    );

    // Insert pending withdrawal request
    const { rows: [wr] } = await client.query(`
      INSERT INTO withdrawal_requests (wallet_id, Partner_id, amount, bank_name, account_number, ifsc_code, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id
    `, [wallet.id, PartnerId, parsedAmount, bank?.bank_name, bank?.account_number, bank?.ifsc_code]);

    // Deduct available balance and record pending debit transaction using debitAvailable service
    // PASS THE CLIENT explicitly so it runs in the same transaction
    await debitAvailable(PartnerId, parsedAmount, {
      reference_type: 'withdrawal',
      reference_id: wr.id,
      bank_name: bank?.bank_name,
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

    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM withdrawal_requests WHERE status = $1`, [status]),
      query(`
        SELECT wr.*, ap.Partner_code, ap.first_name, ap.last_name, u.mobile
        FROM withdrawal_requests wr
        JOIN Partner_profiles ap ON ap.id = wr.Partner_id
        JOIN users u ON u.id = ap.user_id
        WHERE wr.status = $1
        ORDER BY wr.created_at ASC
        LIMIT $2 OFFSET $3
      `, [status, limit, offset]),
    ]);

    const { rows: [privacySetting] } = await query("SELECT value FROM system_settings WHERE key = 'admin_privacy_mode'");
    const isPrivacyOn = privacySetting && privacySetting.value === 'on';
    const shouldMask = isPrivacyOn && req.user && req.user.role === 'ADMIN';

    const processedRows = data.rows.map(row => {
      if (shouldMask) {
        return {
          ...row,
          first_name: 'Partner',
          last_name: row.Partner_code,
          mobile: '**********',
          account_number: 'HIDDEN',
          ifsc_code: 'HIDDEN'
        };
      }
      if (row.account_number) {
        const { decrypt } = require('../../utils/helpers/crypto');
        row.account_number = decrypt(row.account_number);
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
    const { approved, utr_number, rejection_reason, admin_note } = req.body;
    await processWithdrawal(id, approved, req.user.id, utr_number, rejection_reason, admin_note);

    // Log the withdrawal processing action
    const actionName = approved ? 'APPROVE_WITHDRAWAL' : 'REJECT_WITHDRAWAL';
    await logAction(req, actionName, id, { utr_number, rejection_reason, admin_note });

    return success(res, {}, `Withdrawal ${approved ? 'approved' : 'rejected'}`);
  } catch (err) {
    next(err);
  }
};

// GET /wallet/:PartnerId/case-summary — commission per product
const getCaseSummary = async (req, res, next) => {
  try {
    const PartnerId = req.params.PartnerId || (req.partner ? req.partner.id : null);
    if (!PartnerId) return error(res, 'Partner ID is required');
    const { rows } = await query(`
      SELECT
        p.name as product_name, b.short_code as bank_code,
        COUNT(*) as total_cases,
        COUNT(*) FILTER (WHERE a.status IN ('approved','disbursed')) as approved_cases,
        COUNT(*) FILTER (WHERE a.status = 'rejected') as rejected_cases,
        COALESCE(SUM(a.commission_amount) FILTER (WHERE a.commission_status IN ('approved','processed')), 0) as commission_earned
      FROM applications a
      JOIN products p ON p.id = a.product_id
      JOIN banks b ON b.id = p.bank_id
      WHERE a.Partner_id = $1
      GROUP BY p.id, p.name, b.short_code
      ORDER BY commission_earned DESC
    `, [PartnerId]);
    return success(res, rows);
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
    
    // Log manual adjustment to audit logs
    await logAction(req, 'MANUAL_WALLET_ADJUSTMENT', partner_id, { amount: parsedAmount, txn_type, description });

    return success(res, { transaction_id: txn.id }, `Wallet successfully adjusted by ₹${parsedAmount} (${txn_type})`);
  } catch (err) {
    next(err);
  }
};

// POST /withdrawal/approve (Admin)
const approveWithdrawalController = async (req, res, next) => {
  try {
    const { id, utr_number, admin_note } = req.body;
    if (!id) return error(res, 'Withdrawal request ID is required');
    if (!utr_number) return error(res, 'UTR number is required to approve withdrawal');

    await processWithdrawal(id, true, req.user.id, utr_number, null, admin_note);
    await logAction(req, 'APPROVE_WITHDRAWAL', id, { utr_number, admin_note });

    return success(res, {}, 'Withdrawal request successfully approved and processed');
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

    await processWithdrawal(id, false, req.user.id, null, rejection_reason, admin_note);
    await logAction(req, 'REJECT_WITHDRAWAL', id, { rejection_reason, admin_note });

    return success(res, {}, 'Withdrawal request successfully rejected');
  } catch (err) {
    next(err);
  }
};

// Deprecated self-access wrappers (now main controllers handle parameterless requests natively)
const getSelfWallet = async (req, res, next) => getWallet(req, res, next);
const getSelfTransactions = async (req, res, next) => getTransactions(req, res, next);
const requestSelfWithdrawal = async (req, res, next) => requestWithdrawal(req, res, next);

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
  rejectWithdrawalController
};
