const { query } = require('../../config/database');
const { success, error } = require('../../utils/response/response');

const getProductLinkAnalytics = async (req, res, next) => {
  try {
    // 1. Total & Unique Clicks
    const { rows: [{ total_clicks }] } = await query('SELECT COUNT(*) as total_clicks FROM click_tracking');
    const { rows: [{ unique_clicks }] } = await query(`
      SELECT COUNT(DISTINCT CONCAT(ip_address, '_', product_id, '_', COALESCE(partner_id::text, 'public'))) as unique_clicks 
      FROM click_tracking
    `);

    // 2. Application and conversion metrics
    const { rows: [{ applications_count }] } = await query('SELECT COUNT(*) as applications_count FROM applications');
    const { rows: [{ approved_count }] } = await query("SELECT COUNT(*) as approved_count FROM applications WHERE status = 'approved' OR status = 'disbursed' OR status = 'confirmed'");
    const { rows: [{ rejected_count }] } = await query("SELECT COUNT(*) as rejected_count FROM applications WHERE status = 'rejected'");

    const totalClicksNum = parseInt(total_clicks) || 0;
    const conversionRate = totalClicksNum > 0 ? ((parseInt(applications_count) / totalClicksNum) * 100).toFixed(2) : 0;

    // 3. Top Products by Click
    const { rows: topProducts } = await query(`
      SELECT p.name, p.category, COUNT(c.click_id) as click_count
      FROM click_tracking c
      JOIN products p ON c.product_id = p.id
      GROUP BY p.name, p.category
      ORDER BY click_count DESC
      LIMIT 5
    `);

    // 4. Top Banks by Click
    const { rows: topBanks } = await query(`
      SELECT b.name, COUNT(c.click_id) as click_count
      FROM click_tracking c
      JOIN banks b ON c.bank_id = b.id
      GROUP BY b.name
      ORDER BY click_count DESC
      LIMIT 5
    `);

    // 5. Top Partners by Click
    const { rows: topPartners } = await query(`
      SELECT pp."Partner_code" as partner_code, pp.first_name, pp.last_name, COUNT(c.click_id) as click_count
      FROM click_tracking c
      JOIN Partner_profiles pp ON c.partner_id = pp.id
      GROUP BY pp."Partner_code", pp.first_name, pp.last_name
      ORDER BY click_count DESC
      LIMIT 5
    `);

    // 6. Top Campaigns
    const { rows: topCampaigns } = await query(`
      SELECT campaign, COUNT(*) as click_count
      FROM click_tracking
      WHERE campaign IS NOT NULL AND campaign <> ''
      GROUP BY campaign
      ORDER BY click_count DESC
      LIMIT 5
    `);

    // 7. Daily Clicks
    const { rows: dailyClicks } = await query(`
      SELECT TO_CHAR(clicked_at, 'YYYY-MM-DD') as date, COUNT(*) as click_count
      FROM click_tracking
      GROUP BY TO_CHAR(clicked_at, 'YYYY-MM-DD')
      ORDER BY date ASC
      LIMIT 30
    `);

    // 8. Monthly Clicks
    const { rows: monthlyClicks } = await query(`
      SELECT TO_CHAR(clicked_at, 'YYYY-MM') as month, COUNT(*) as click_count
      FROM click_tracking
      GROUP BY TO_CHAR(clicked_at, 'YYYY-MM')
      ORDER BY month ASC
    `);

    return success(res, {
      totalClicks: totalClicksNum,
      uniqueClicks: parseInt(unique_clicks) || 0,
      applications: parseInt(applications_count) || 0,
      approvedApplications: parseInt(approved_count) || 0,
      rejectedApplications: parseInt(rejected_count) || 0,
      conversionRate,
      topProducts,
      topBanks,
      topPartners,
      topCampaigns,
      dailyClicks,
      monthlyClicks
    });
  } catch (err) {
    next(err);
  }
};

const listClicks = async (req, res, next) => {
  try {
    const { search, partner_id, product_id, bank_id, limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT c.*, p.name as product_name, p.category as product_category,
             b.name as bank_name, pp."Partner_code" as partner_code, pp.first_name as partner_first_name, pp.last_name as partner_last_name
      FROM click_tracking c
      JOIN products p ON c.product_id = p.id
      LEFT JOIN banks b ON c.bank_id = b.id
      LEFT JOIN Partner_profiles pp ON c.partner_id = pp.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (c.ip_address ILIKE $${paramIndex} OR c.campaign ILIKE $${paramIndex} OR pp."Partner_code" ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (partner_id) {
      sql += ` AND c.partner_id = $${paramIndex}`;
      params.push(partner_id);
      paramIndex++;
    }

    if (product_id) {
      sql += ` AND c.product_id = $${paramIndex}`;
      params.push(product_id);
      paramIndex++;
    }

    if (bank_id) {
      sql += ` AND c.bank_id = $${paramIndex}`;
      params.push(bank_id);
      paramIndex++;
    }

    const countSql = `SELECT COUNT(*) FROM (${sql}) AS temp`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ` ORDER BY c.clicked_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const { rows } = await query(sql, params);

    return success(res, {
      data: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const listConversions = async (req, res, next) => {
  try {
    const { rows: summaries } = await query(`
      SELECT conversion_status, COUNT(*) as count
      FROM click_tracking
      GROUP BY conversion_status
    `);

    const { rows: details } = await query(`
      SELECT a.id as application_id, a.app_number, a.status as application_status, a.commission_amount,
             p.name as product_name, pp."Partner_code" as partner_code, c.clicked_at, c.click_id
      FROM applications a
      JOIN products p ON a.product_id = p.id
      JOIN Partner_profiles pp ON a.Partner_id = pp.id
      LEFT JOIN click_tracking c ON c.product_id = a.product_id AND c.partner_id = a.Partner_id
      ORDER BY a.created_at DESC
      LIMIT 50
    `);

    return success(res, { summaries, details });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProductLinkAnalytics,
  listClicks,
  listConversions
};
