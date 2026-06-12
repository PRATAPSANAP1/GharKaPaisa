const { query } = require('../config/db');
const { processWithdrawal, getWalletSummary } = require('../services/wallet.service');
const { getPaginationParams } = require('../utils/helpers');
const { success, error, notFound, paginate } = require('../utils/response');

// GET /wallet/:agentId
const getWallet = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const wallet = await getWalletSummary(agentId);
    if (!wallet) return notFound(res, 'Wallet not found');
    return success(res, wallet);
  } catch (err) {
    next(err);
  }
};

// GET /wallet/:agentId/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { page, limit, offset } = getPaginationParams(req.query);
    const { type, status, from_date, to_date } = req.query;

    const { rows: [wallet] } = await query(`SELECT id FROM wallets WHERE agent_id = $1`, [agentId]);
    if (!wallet) return notFound(res, 'Wallet not found');

    let where = `WHERE wt.wallet_id = $1`;
    const values = [wallet.id];
    let idx = 2;

    if (type) { where += ` AND wt.txn_type = $${idx++}`; values.push(type); }
    if (status) { where += ` AND wt.status = $${idx++}`; values.push(status); }
    if (from_date) { where += ` AND wt.created_at >= $${idx++}`; values.push(from_date); }
    if (to_date) { where += ` AND wt.created_at <= $${idx++}`; values.push(to_date + ' 23:59:59'); }

    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM wallet_transactions wt ${where}`, values),
      query(`
        SELECT wt.*, a.app_number, c.full_name as customer_name, p.name as product_name, b.short_code as bank_code
        FROM wallet_transactions wt
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

// POST /wallet/:agentId/withdraw
const requestWithdrawal = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { amount } = req.body;

    const wallet = await getWalletSummary(agentId);
    if (!wallet) return notFound(res, 'Wallet not found');
    if (parseFloat(wallet.available_balance) < parseFloat(amount)) {
      return error(res, `Insufficient balance. Available: ₹${wallet.available_balance}`);
    }

    // Check no pending withdrawal
    const { rows: pending } = await query(
      `SELECT id FROM withdrawal_requests WHERE agent_id = $1 AND status = 'pending'`, [agentId]
    );
    if (pending.length) return error(res, 'A withdrawal request is already pending');

    // Get bank details
    const { rows: [bank] } = await query(
      `SELECT bank_name, account_number, ifsc_code FROM agent_bank_details WHERE agent_id = $1`, [agentId]
    );

    // Deduct from available (hold until processed)
    await query(`UPDATE wallets SET available_balance = available_balance - $1 WHERE agent_id = $2`, [amount, agentId]);

    const { rows: [wr] } = await query(`
      INSERT INTO withdrawal_requests (wallet_id, agent_id, amount, bank_name, account_number, ifsc_code)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [wallet.id, agentId, amount, bank?.bank_name, bank?.account_number, bank?.ifsc_code]);

    return success(res, { withdrawal_id: wr.id }, 'Withdrawal request submitted. Will be processed in 1-2 business days.');
  } catch (err) {
    next(err);
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
        SELECT wr.*, ap.agent_code, ap.first_name, ap.last_name, u.mobile
        FROM withdrawal_requests wr
        JOIN agent_profiles ap ON ap.id = wr.agent_id
        JOIN users u ON u.id = ap.user_id
        WHERE wr.status = $1
        ORDER BY wr.created_at ASC
        LIMIT $2 OFFSET $3
      `, [status, limit, offset]),
    ]);

    return paginate(res, data.rows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// PATCH /wallet/withdrawals/:id/process (Super Admin)
const processWithdrawalRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved, utr_number, rejection_reason } = req.body;
    await processWithdrawal(id, approved, req.user.id, utr_number, rejection_reason);
    return success(res, {}, `Withdrawal ${approved ? 'approved' : 'rejected'}`);
  } catch (err) {
    next(err);
  }
};

// GET /wallet/:agentId/case-summary — commission per product
const getCaseSummary = async (req, res, next) => {
  try {
    const { agentId } = req.params;
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
      WHERE a.agent_id = $1
      GROUP BY p.id, p.name, b.short_code
      ORDER BY commission_earned DESC
    `, [agentId]);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { getWallet, getTransactions, requestWithdrawal, listWithdrawals, processWithdrawalRequest, getCaseSummary };
