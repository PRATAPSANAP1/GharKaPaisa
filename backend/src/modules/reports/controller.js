const { query } = require('../../config/database');
const { success } = require('../../utils/response/response');
const appSettingsService = require('../products/application-settings.service');

// GET /reports/overview — top-level numbers
const getOverview = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;
    const isPartner = req.user.role === 'PARTNER';
    const partnerId = isPartner ? req.partner.id : null;
    const partnerScopeApps = isPartner ? ` AND "Partner_id" = '${partnerId}'` : '';
    const partnerScopeLeads = isPartner ? ` AND "partner_id" = '${partnerId}'` : '';
    const partnerScopeWallet = isPartner ? ` WHERE "Partner_id" = '${partnerId}'` : '';

    let sql = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('approved','disbursed')) as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status IN ('submitted','under_review')) as pending,
        COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as todays_apps,
        COALESCE(SUM(commission_amount) FILTER (WHERE status IN ('approved','disbursed')), 0) as total_commission
      FROM applications WHERE 1=1 ${partnerScopeApps}
    `;
    const values = [];
    if (from_date && to_date) {
      sql += ` AND created_at BETWEEN $1 AND $2`;
      values.push(from_date, to_date + ' 23:59:59');
    }

    const [apps, Partners, wallet, leads, withdrawal, banks, products, recentPartners] = await Promise.all([
      query(sql, values),
      isPartner ? Promise.resolve({rows:[{}]}) : query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE u.status = 'active') as active,
          COUNT(*) FILTER (WHERE ap.kyc_status = 'pending' OR ap.kyc_status = 'under_review') as pending_kyc
        FROM Partner_profiles ap JOIN users u ON u.id = ap.user_id
      `),
      query(`
        SELECT
          COALESCE(SUM(total_earned), 0) as total_earned,
          COALESCE(SUM(total_withdrawn), 0) as total_withdrawn,
          COALESCE(SUM(hold_balance), 0) as total_pending,
          COALESCE(SUM(available_balance), 0) as total_available
        FROM wallets
        ${partnerScopeWallet}
      `),
      query(`
        SELECT
          COUNT(*) as total_leads,
          COUNT(*) FILTER (WHERE status = 'approved') as approved_leads,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected_leads,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_leads,
          COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as todays_leads
        FROM leads WHERE 1=1 ${partnerScopeLeads}
      `),
      isPartner ? Promise.resolve({rows:[{}]}) : query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending') as pending_withdrawals,
          COALESCE(SUM(amount) FILTER (WHERE status = 'processed'), 0) as total_commission_paid
        FROM withdrawal_requests
      `),
      query(`SELECT COUNT(*) as total_banks FROM banks`),
      query(`SELECT COUNT(*) as total_products FROM products`),
      isPartner ? Promise.resolve({rows:[]}) : query(`
        SELECT p.id, p.first_name, p.last_name, p.Partner_code, p.created_at, u.email, u.mobile, u.status
        FROM Partner_profiles p
        JOIN users u ON u.id = p.user_id
        ORDER BY p.created_at DESC
        LIMIT 5
      `),
    ]);

    // calculate conversion rate
    const appsData = apps.rows[0];
    const conversion_rate = appsData.total > 0 ? ((appsData.approved / appsData.total) * 100).toFixed(2) : 0;

    return success(res, {
      applications: { ...appsData, conversion_rate },
      Partners: Partners.rows[0],
      wallet: wallet.rows[0],
      leads: leads.rows[0],
      withdrawal: withdrawal.rows[0],
      banks: banks.rows[0],
      products: products.rows[0],
      recent_partners: recentPartners.rows,
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
    const isPartner = req.user.role === 'PARTNER';
    const partnerId = isPartner ? req.partner.id : null;
    const partnerScopeApps = isPartner ? ` AND "Partner_id" = '${partnerId}'` : '';

    const { rows } = await query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        DATE_TRUNC('month', created_at) as month_date,
        COUNT(*) as applications,
        COUNT(*) FILTER (WHERE status IN ('approved','disbursed')) as approved,
        COALESCE(SUM(commission_amount) FILTER (WHERE status IN ('approved','disbursed')), 0) as commission
      FROM applications
      WHERE created_at >= NOW() - INTERVAL '12 months' ${partnerScopeApps}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month_date ASC
    `);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

const exportPayoutsReport = async (req, res, next) => {
  try {
    const { from_date, to_date, status = 'approved' } = req.query;

    let sql = `
      SELECT 
        a.app_number,
        a.status,
        a.created_at as application_date,
        a.loan_amount as applied_amount,
        a.approved_amount,
        a.commission_amount,
        c.full_name as customer_name,
        p.name as product_name,
        b.name as bank_name,
        ap.Partner_code,
        ap.first_name || ' ' || ap.last_name as partner_name
      FROM applications a
      JOIN customers c ON c.id = a.customer_id
      JOIN products p ON p.id = a.product_id
      JOIN banks b ON b.id = p.bank_id
      JOIN Partner_profiles ap ON ap.id = a.Partner_id
      WHERE 1=1
    `;
    const values = [];
    let idx = 1;

    if (status === 'approved') {
      sql += ` AND a.status IN ('approved', 'disbursed')`;
    } else if (status !== 'all') {
      sql += ` AND a.status = $${idx++}`;
      values.push(status);
    }

    if (from_date) {
      sql += ` AND a.created_at >= $${idx++}`;
      values.push(from_date);
    }
    if (to_date) {
      sql += ` AND a.created_at <= $${idx++}`;
      values.push(to_date + ' 23:59:59');
    }

    sql += ` ORDER BY a.created_at DESC`;

    const { rows } = await query(sql, values);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

const exportPartnersReport = async (req, res, next) => {
  try {
    const { rows: partners } = await query(`
      SELECT 
        ap.Partner_code,
        ap.first_name,
        ap.last_name,
        ap.kyc_status,
        ap.company_name,
        u.email,
        u.mobile,
        u.status as account_status,
        u.created_at as registration_date,
        COALESCE(w.available_balance, 0) as available_balance,
        COALESCE(w.hold_balance, 0) as hold_balance,
        COALESCE(w.total_earned, 0) as total_earned,
        COALESCE(w.total_withdrawn, 0) as total_withdrawn
      FROM Partner_profiles ap
      JOIN users u ON u.id = ap.user_id
      LEFT JOIN wallets w ON w.Partner_id = ap.id
      ORDER BY u.created_at DESC
    `);

    let totalActive = 0;
    let totalBlocked = 0;
    partners.forEach(p => {
      const stat = (p.account_status || '').toLowerCase();
      if (stat === 'active') totalActive++;
      else if (stat === 'blocked') totalBlocked++;
    });

    return success(res, {
      partners,
      summary: {
        total_partners: partners.length,
        total_active_partners: totalActive,
        total_blocked_partners: totalBlocked
      }
    });
  } catch (err) {
    next(err);
  }
};

const getApplicationClickReport = async (req, res, next) => {
  try {
    const { product_id } = req.query;
    const clicks = await appSettingsService.getClickAnalytics(product_id);
    
    const { rows: [overall] } = await query(`
      SELECT 
        COUNT(*)::int as total_clicks,
        COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '30 days')::int as last_30_days,
        COUNT(CASE WHEN partner_id IS NOT NULL THEN 1 END)::int as partner_clicks,
        COUNT(CASE WHEN partner_id IS NULL THEN 1 END)::int as customer_clicks
      FROM application_click_logs
    `);

    return success(res, {
      clicks,
      summary: {
        total_clicks: overall?.total_clicks || 0,
        last_30_days: overall?.last_30_days || 0,
        partner_clicks: overall?.partner_clicks || 0,
        customer_clicks: overall?.customer_clicks || 0
      }
    });
  } catch (err) {
    next(err);
  }
};


const getApplicationsReport = async (req, res, next) => {
  try {
    const isPartner = req.user.role === 'PARTNER';
    const partnerId = isPartner ? req.partner.id : null;
    const { from_date, to_date, search } = req.query;

    let sql = `
      SELECT 
        a.id, a.app_number, a.status, a.created_at as application_date,
        a.approved_amount, a.commission_amount,
        c.full_name as customer_name,
        p.name as product_name,
        b.name as bank_name
      FROM applications a
      JOIN customers c ON c.id = a.customer_id
      JOIN products p ON p.id = a.product_id
      JOIN banks b ON b.id = p.bank_id
      WHERE 1=1
    `;
    const values = [];
    let idx = 1;

    if (isPartner) {
      sql += ` AND a."Partner_id" = $1`;
      values.push(partnerId);
      idx++;
    }

    if (from_date && to_date) {
      sql += ` AND a.created_at BETWEEN ${idx} AND ${idx+1}`;
      values.push(from_date, to_date + ' 23:59:59');
      idx += 2;
    }

    if (search) {
      sql += ` AND (a.app_number ILIKE ${idx} OR c.full_name ILIKE ${idx})`;
      values.push(`%${search}%`);
      idx++;
    }

    sql += ' ORDER BY a.created_at DESC';

    const { rows } = await query(sql, values);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

const getCustomersReport = async (req, res, next) => {
  try {
    const isPartner = req.user.role === 'PARTNER';
    const partnerId = isPartner ? req.partner.id : null;
    
    let sql = `
      SELECT 
        c.id, c.full_name as customer_name, c.mobile, c.email,
        COUNT(a.id) as total_applications,
        COUNT(a.id) FILTER (WHERE a.status IN ('approved','disbursed')) as approved_cards,
        COUNT(a.id) FILTER (WHERE a.status = 'rejected') as rejected_cards,
        COALESCE(SUM(a.commission_amount) FILTER (WHERE a.status IN ('approved','disbursed')), 0) as total_commission
      FROM customers c
      LEFT JOIN applications a ON a.customer_id = c.id
      WHERE 1=1
    `;
    const values = [];

    if (isPartner) {
      // For partners, only show customers they have generated leads/applications for
      sql += ` AND c.id IN (SELECT customer_id FROM applications WHERE "Partner_id" = $1)`;
      values.push(partnerId);
    }

    sql += ` GROUP BY c.id, c.full_name, c.mobile, c.email ORDER BY total_commission DESC, total_applications DESC`;

    const { rows } = await query(sql, values);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  getApplicationsReport,
  getCustomersReport, 
  getOverview, 
  applicationsByProduct, 
  topPartners, 
  monthlyTrend, 
  exportPayoutsReport, 
  exportPartnersReport,
  getApplicationClickReport
};
