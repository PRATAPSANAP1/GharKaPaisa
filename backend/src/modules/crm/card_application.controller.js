const { query } = require('../../config/database');
const { success, created, error, paginate } = require('../../utils/response/response');
const { getPaginationParams } = require('../../utils/helpers/helpers');

// Public route to submit verified card application lead
const submitApplication = async (req, res, next) => {
  try {
    const { customerName, mobile, bankName, cardName } = req.body;

    if (!customerName || !mobile || !bankName || !cardName) {
      return error(res, 'Customer Name, Mobile Number, Bank Name, and Card Name are required', 400);
    }

    // Basic mobile validation
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      return error(res, 'Please provide a valid 10-digit mobile number', 400);
    }

    const { rows: [application] } = await query(
      `INSERT INTO direct_card_applications (customer_name, mobile, bank_name, card_name, status)
       VALUES ($1, $2, $3, $4, 'verified') RETURNING *`,
      [customerName.trim(), mobile.trim(), bankName.trim(), cardName.trim()]
    );

    return created(res, application, 'Card application recorded successfully');
  } catch (err) {
    next(err);
  }
};

// Super Admin route to list direct card applications
const listApplications = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { search } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (search) {
      whereClause += ` AND (customer_name ILIKE $${idx} OR mobile ILIKE $${idx} OR bank_name ILIKE $${idx} OR card_name ILIKE $${idx})`;
      values.push(`%${search.trim()}%`);
      idx++;
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM direct_card_applications
      ${whereClause}
    `;

    const dataQuery = `
      SELECT * 
      FROM direct_card_applications
      ${whereClause}
      ORDER BY created_at DESC
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

module.exports = {
  submitApplication,
  listApplications
};
