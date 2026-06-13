const { query } = require('../config/db');
const { success } = require('../utils/response');

// GET /reports/overview — top-level numbers
const getOverview = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;
    const dateFilter = from_date && to_date
      ? `AND created_at BETWEEN '${from_date}' AND '${to_date} 23:59:59'`
      : '';

    const [apps, Partners, wallet] = await Promise.all([
      query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status IN ('approved','disbursed')) as approved,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
          COUNT(*) FILTER (WHERE status IN ('submitted','under_review')) as pending,
          COALESCE(SUM(commission_amount) FILTER (WHERE status IN ('approved','disbursed')), 0) as total_commission
        FROM applications WHERE 1=1 ${dateFilter}
      `),
      query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE u.status = 'active' AND ap.kyc_status = 'approved') as active,
          COUNT(*) FILTER (WHERE ap.kyc_status = 'pending' OR ap.kyc_status = 'under_review') as pending_kyc
        FROM Partner_profiles ap JOIN users u ON u.id = ap.user_id
      `),
      query(`
        SELECT
          COALESCE(SUM(total_earned), 0) as total_earned,
          COALESCE(SUM(total_withdrawn), 0) as total_withdrawn,
          COALESCE(SUM(pending_amount), 0) as total_pending,
          COALESCE(SUM(available_balance), 0) as total_available
        FROM wallets
      `),
    ]);

    return success(res, {
      applications: apps.rows[0],
      Partners: Partners.rows[0],
      wallet: wallet.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// GET /reports/applications-by-product
const applicationsByProduct = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT p.name as product_name, b.short_code as bank_code, p.category,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE a.status IN ('approved','disbursed')) as approved,
        COALESCE(SUM(a.commission_amount) FILTER (WHERE a.status IN ('approved','disbursed')), 0) as commission
      FROM applications a
      JOIN products p ON p.id = a.product_id
      JOIN banks b ON b.id = p.bank_id
      GROUP BY p.id, p.name, b.short_code, p.category
      ORDER BY total DESC
    `);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// GET /reports/top-partners
const topPartners = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const { rows } = await query(`
      SELECT ap.Partner_code, ap.first_name, ap.last_name,
        COUNT(a.id) as total_apps,
        COUNT(a.id) FILTER (WHERE a.status IN ('approved','disbursed')) as approved,
        COALESCE(SUM(a.commission_amount) FILTER (WHERE a.status IN ('approved','disbursed')), 0) as commission_earned
      FROM Partner_profiles ap
      LEFT JOIN applications a ON a.Partner_id = ap.id
      WHERE ap.kyc_status = 'approved'
      GROUP BY ap.id, ap.Partner_code, ap.first_name, ap.last_name
      ORDER BY commission_earned DESC
      LIMIT $1
    `, [parseInt(limit)]);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// GET /reports/monthly-trend — last 12 months
const monthlyTrend = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        DATE_TRUNC('month', created_at) as month_date,
        COUNT(*) as applications,
        COUNT(*) FILTER (WHERE status IN ('approved','disbursed')) as approved,
        COALESCE(SUM(commission_amount) FILTER (WHERE status IN ('approved','disbursed')), 0) as commission
      FROM applications
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month_date ASC
    `);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { getOverview, applicationsByProduct, topPartners, monthlyTrend };
