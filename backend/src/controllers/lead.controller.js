const { query } = require('../config/db');
const { success, created, error, notFound, paginate } = require('../utils/response');
const { logAction } = require('../services/audit.service');
const { getPaginationParams } = require('../utils/helpers');

// Create a new lead
const createLead = async (req, res, next) => {
  try {
    const { productId, customerName, mobile, city } = req.body;
    if (!productId || !customerName || !mobile || !city) {
      return error(res, 'Product ID, Customer Name, Mobile, and City are required', 400);
    }

    // Fetch partner profile from logged-in user id
    const { rows: [partner] } = await query(
      `SELECT id FROM Partner_profiles WHERE user_id = $1`,
      [req.user.id]
    );

    if (!partner) {
      return error(res, 'Partner profile not found for this user', 404);
    }

    // Validate product exists
    const { rows: [product] } = await query(
      `SELECT id FROM products WHERE id = $1 AND is_active = true`,
      [productId]
    );
    if (!product) {
      return error(res, 'Product not found or is inactive', 404);
    }

    const { rows: [lead] } = await query(
      `INSERT INTO leads (partner_id, product_id, customer_name, mobile, city, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [partner.id, productId, customerName, mobile, city]
    );

    return created(res, lead, 'Lead created successfully');
  } catch (err) {
    next(err);
  }
};

// List leads (Partner gets their own, Admins get all)
const listLeads = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status, search } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (req.user.role === 'PARTNER') {
      // Find partner ID
      const { rows: [partner] } = await query(
        `SELECT id FROM Partner_profiles WHERE user_id = $1`,
        [req.user.id]
      );
      if (!partner) {
        return error(res, 'Partner profile not found', 404);
      }
      whereClause += ` AND l.partner_id = $${idx++}`;
      values.push(partner.id);
    }

    if (status) {
      whereClause += ` AND l.status = $${idx++}`;
      values.push(status);
    }

    if (search) {
      whereClause += ` AND (l.customer_name ILIKE $${idx} OR l.mobile ILIKE $${idx})`;
      values.push(`%${search}%`);
      idx++;
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM leads l
      ${whereClause}
    `;

    const dataQuery = `
      SELECT l.*, 
        p.name as product_name, p.commission_value as product_commission,
        ap.first_name as partner_first_name, ap.last_name as partner_last_name, ap.Partner_code
      FROM leads l
      JOIN products p ON p.id = l.product_id
      JOIN Partner_profiles ap ON ap.id = l.partner_id
      ${whereClause}
      ORDER BY l.created_at DESC
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

// Update lead status (Admin / Super Admin only)
const updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return error(res, 'Status is required', 400);
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return error(res, 'Invalid status value. Must be pending, approved, or rejected', 400);
    }

    const { rows: [existing] } = await query(
      `SELECT * FROM leads WHERE id = $1`,
      [id]
    );

    if (!existing) {
      return notFound(res, 'Lead not found');
    }

    const { rows: [updated] } = await query(
      `UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    // Audit Log
    await logAction(req, 'UPDATE_LEAD_STATUS', id, { status });

    return success(res, updated, `Lead status updated to ${status}`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createLead,
  listLeads,
  updateLeadStatus
};
