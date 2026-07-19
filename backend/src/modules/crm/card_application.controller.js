const { query } = require('../../config/database');
const { success, created, error, paginate } = require('../../utils/response/response');
const { getPaginationParams } = require('../../utils/helpers/helpers');

// Public & Admin route to submit verified card / loan / insurance application lead
const submitApplication = async (req, res, next) => {
  try {
    const { customerName, mobile, bankName, cardName, category } = req.body;

    if (!customerName || !mobile || !bankName || !cardName) {
      return error(res, 'Customer Name, Mobile Number, Bank/Provider Name, and Product/Card Name are required', 400);
    }

    // Basic mobile validation
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      return error(res, 'Please provide a valid 10-digit mobile number', 400);
    }

    const leadCategory = category ? category.trim().toLowerCase() : 'credit_card';

    const { rows: [application] } = await query(
      `INSERT INTO direct_card_applications (customer_name, mobile, bank_name, card_name, category, status)
       VALUES ($1, $2, $3, $4, $5, 'verified') RETURNING *`,
      [customerName.trim(), mobile.trim(), bankName.trim(), cardName.trim(), leadCategory]
    );

    return created(res, application, 'Direct lead recorded successfully');
  } catch (err) {
    next(err);
  }
};

// Admin & Super Admin route to list direct applications with category filter
const listApplications = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { search, category } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (category && category !== 'all') {
      whereClause += ` AND (LOWER(category) = $${idx} OR ($${idx} = 'credit_card' AND (category IS NULL OR category = '')))`;
      values.push(category.trim().toLowerCase());
      idx++;
    }

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

// Admin route to update direct lead status
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return error(res, 'Status is required', 400);

    const { rows: [application] } = await query(
      `UPDATE direct_card_applications SET status = $1 WHERE id = $2 RETURNING *`,
      [status.trim(), id]
    );

    if (!application) return error(res, 'Direct lead not found', 404);

    return success(res, application, 'Direct lead status updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitApplication,
  listApplications,
  updateApplicationStatus
};
