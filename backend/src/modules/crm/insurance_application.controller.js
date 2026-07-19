const { query } = require('../../config/database');
const { success, created, error, paginate } = require('../../utils/response/response');
const { getPaginationParams } = require('../../utils/helpers/helpers');

// POST /api/v1/crm/insurance-applications — Submit insurance application
const submitInsuranceApplication = async (req, res, next) => {
  try {
    const {
      insurance_type_slug,
      customer_name,
      mobile,
      email,
      policy_type,
      sum_insured,
      premium_amount,
      pincode,
      city,
      state,
      nominee_name,
      remarks
    } = req.body;

    if (!insurance_type_slug || !customer_name || !mobile) {
      return error(res, 'Insurance Type, Customer Name, and Mobile Number are required', 400);
    }

    if (!/^[6-9]\d{9}$/.test(String(mobile).trim())) {
      return error(res, 'Please provide a valid 10-digit Indian mobile number', 400);
    }

    let partnerId = null;
    if (req.partner?.id) {
      partnerId = req.partner.id;
    } else if (req.user?.id) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) partnerId = p.id;
    }

    const { rows: [application] } = await query(
      `INSERT INTO insurance_applications (
        insurance_type_slug, customer_name, mobile, email, policy_type, sum_insured,
        premium_amount, pincode, city, state, nominee_name, partner_id, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        insurance_type_slug.trim().toLowerCase(),
        customer_name.trim(),
        mobile.trim(),
        email ? email.trim() : null,
        policy_type || null,
        sum_insured || 0,
        premium_amount || 0,
        pincode || null,
        city || null,
        state || null,
        nominee_name || null,
        partnerId,
        remarks || null
      ]
    );

    return created(res, application, 'Insurance application recorded successfully');
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/crm/insurance-applications — List insurance applications
const listInsuranceApplications = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { insurance_type_slug, status, search } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (insurance_type_slug && insurance_type_slug !== 'all') {
      whereClause += ` AND LOWER(insurance_type_slug) = $${idx}`;
      values.push(insurance_type_slug.trim().toLowerCase());
      idx++;
    }

    if (status && status !== 'all') {
      whereClause += ` AND status = $${idx}`;
      values.push(status.trim());
      idx++;
    }

    if (search) {
      whereClause += ` AND (customer_name ILIKE $${idx} OR mobile ILIKE $${idx} OR city ILIKE $${idx})`;
      values.push(`%${search.trim()}%`);
      idx++;
    }

    const countQuery = `SELECT COUNT(*) FROM insurance_applications ${whereClause}`;
    const dataQuery = `
      SELECT ia.*, pp.first_name as partner_first_name, pp.last_name as partner_last_name
      FROM insurance_applications ia
      LEFT JOIN partner_profiles pp ON ia.partner_id = pp.id
      ${whereClause}
      ORDER BY ia.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const [countResult, dataResult] = await Promise.all([
      query(countQuery, values),
      query(dataQuery, [...values, limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].count);
    return paginate(res, dataResult.rows, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/crm/insurance-applications/:id/status — Update insurance status
const updateInsuranceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status) return error(res, 'Status is required', 400);

    const { rows: [application] } = await query(
      `UPDATE insurance_applications SET status = $1, remarks = COALESCE($2, remarks), updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status.trim(), remarks || null, id]
    );

    if (!application) return error(res, 'Insurance application not found', 404);

    return success(res, application, 'Insurance application status updated successfully');
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/crm/insurance-applications/reports — Insurance reports summary
const getInsuranceReports = async (req, res, next) => {
  try {
    const { insurance_type_slug } = req.query;
    let filter = '';
    const params = [];
    if (insurance_type_slug && insurance_type_slug !== 'all') {
      filter = 'WHERE LOWER(insurance_type_slug) = $1';
      params.push(insurance_type_slug.trim().toLowerCase());
    }

    const { rows: stats } = await query(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN status = 'submitted' OR status = 'pending' THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN premium_amount ELSE 0 END), 0) as total_premium_amount
      FROM insurance_applications
      ${filter}
    `, params);

    return success(res, stats[0] || {});
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitInsuranceApplication,
  listInsuranceApplications,
  updateInsuranceStatus,
  getInsuranceReports
};
