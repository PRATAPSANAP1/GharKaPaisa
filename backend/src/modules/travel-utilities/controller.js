const { query } = require('../../config/database');
const { success, created, error } = require('../../utils/response/response');
const logger = require('../../config/logger');

/**
 * Travel & Utilities margin module.
 * Partners resell utility bill payments / recharges and travel bookings and
 * earn a service margin on each fulfilled transaction.
 */

// Static service catalog with the margin rate applied per service.
const CATALOG = [
  { id: 'recharge', category: 'utility', label: 'Mobile Recharge', margin_percent: 1.5 },
  { id: 'electricity', category: 'utility', label: 'Electricity Bill', margin_percent: 1.0 },
  { id: 'fastag', category: 'utility', label: 'FASTag Recharge', margin_percent: 1.5 },
  { id: 'dth', category: 'utility', label: 'DTH Recharge', margin_percent: 2.0 },
  { id: 'flights', category: 'travel', label: 'Flight Booking', margin_percent: 1.5 },
  { id: 'hotels', category: 'travel', label: 'Hotel Booking', margin_percent: 3.0 },
  { id: 'bus', category: 'travel', label: 'Bus Booking', margin_percent: 2.0 },
  { id: 'train', category: 'travel', label: 'Train Booking', margin_percent: 1.0 },
];

let tableEnsured = false;
const ensureTable = async () => {
  if (tableEnsured) return;
  await query(`
    CREATE TABLE IF NOT EXISTS travel_utility_transactions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      partner_id UUID NOT NULL,
      service_id VARCHAR(50) NOT NULL,
      category VARCHAR(20) NOT NULL DEFAULT 'utility',
      identifier VARCHAR(150),
      provider VARCHAR(150),
      amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      margin_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
      margin_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
      reference_number VARCHAR(80),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  tableEnsured = true;
};

const resolvePartnerId = async (req) => {
  if (req.partner?.id) return req.partner.id;
  if (req.user?.PartnerId || req.user?.partner_id) return req.user.PartnerId || req.user.partner_id;
  if (req.user?.id) {
    const { rows: [p] } = await query(
      `SELECT id FROM partner_profiles WHERE user_id = $1 LIMIT 1`,
      [req.user.id]
    );
    if (p) return p.id;
  }
  return null;
};

// GET /travel-utilities/services
const listServices = async (req, res, next) => {
  try {
    const category = req.query.category;
    const services = category ? CATALOG.filter((s) => s.category === category) : CATALOG;
    return success(res, services);
  } catch (err) {
    next(err);
  }
};

// GET /travel-utilities/transactions
const listTransactions = async (req, res, next) => {
  try {
    await ensureTable();
    const partnerId = await resolvePartnerId(req);
    if (!partnerId) return error(res, 'Partner profile required', 403);

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const { rows } = await query(
      `SELECT id, service_id, category, identifier, provider, amount,
              margin_percent, margin_amount, status, reference_number, created_at
         FROM travel_utility_transactions
        WHERE partner_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`,
      [partnerId, limit, offset]
    );

    const { rows: [{ count }] } = await query(
      `SELECT COUNT(*)::int AS count FROM travel_utility_transactions WHERE partner_id = $1`,
      [partnerId]
    );

    return success(res, { transactions: rows, page, limit, total: count });
  } catch (err) {
    next(err);
  }
};

// POST /travel-utilities/transactions
const createTransaction = async (req, res, next) => {
  try {
    await ensureTable();
    const partnerId = await resolvePartnerId(req);
    if (!partnerId) return error(res, 'Partner profile required', 403);

    const {
      service_id,
      identifier,
      provider,
      amount,
      customer_name,
    } = req.body;

    const service = CATALOG.find((s) => s.id === service_id);
    if (!service) return error(res, 'Invalid service_id', 400);
    if (!identifier || !String(identifier).trim()) {
      return error(res, 'Customer identifier / number is required', 400);
    }

    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return error(res, 'A valid amount greater than zero is required', 400);
    }

    const marginAmount = Number(((amt * service.margin_percent) / 100).toFixed(2));
    const referenceNumber = `UTL-${Date.now().toString().slice(-8)}`;

    const { rows: [txn] } = await query(
      `INSERT INTO travel_utility_transactions
         (partner_id, service_id, category, identifier, provider, amount,
          margin_percent, margin_amount, status, reference_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'SUCCESS',$9)
       RETURNING *`,
      [
        partnerId,
        service.id,
        service.category,
        String(identifier).trim(),
        provider ? String(provider).trim() : null,
        amt,
        service.margin_percent,
        marginAmount,
        referenceNumber,
      ]
    );

    logger.info(`Travel/Utility txn ${referenceNumber} recorded for partner ${partnerId} (margin ₹${marginAmount})`);

    return created(
      res,
      {
        ...txn,
        service_label: service.label,
        customer_name: customer_name || null,
      },
      'Transaction recorded successfully'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listServices,
  listTransactions,
  createTransaction,
};
