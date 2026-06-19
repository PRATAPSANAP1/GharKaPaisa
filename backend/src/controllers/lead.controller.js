const { query, getClient } = require('../config/db');
const { success, created, error, notFound, paginate } = require('../utils/response');
const { logAction } = require('../services/audit.service');
const { getPaginationParams } = require('../utils/helpers');
const { creditHold, releaseHold } = require('../services/wallet.service');

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
  const client = await getClient();
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return error(res, 'Status is required', 400);
    }

    if (!['pending', 'approved', 'rejected', 'confirmed'].includes(status)) {
      return error(res, 'Invalid status value. Must be pending, approved, rejected, or confirmed', 400);
    }

    await client.query('BEGIN');

    // Fetch existing lead with lock
    const { rows: [lead] } = await client.query(
      `SELECT * FROM leads WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (!lead) {
      await client.query('ROLLBACK');
      return notFound(res, 'Lead not found');
    }

    const previousStatus = lead.status;
    if (previousStatus === status) {
      await client.query('COMMIT');
      return success(res, lead, `Lead status is already ${status}`);
    }

    // State transition triggers
    if (status === 'approved') {
      if (previousStatus !== 'pending') {
        await client.query('ROLLBACK');
        return error(res, 'Can only approve a pending lead', 400);
      }

      // Fetch the product commission value (including Partner custom commission structure override)
      const { rows: [commDetails] } = await client.query(`
        SELECT 
          COALESCE(cs.commission_value, p.commission_value) as commission_value,
          COALESCE(cs.commission_type, p.commission_type) as commission_type,
          p.name as product_name,
          p.category as product_category,
          b.name as bank_name
        FROM products p
        JOIN banks b ON b.id = p.bank_id
        LEFT JOIN commission_structures cs ON cs.product_id = p.id AND cs.Partner_id = $1
        WHERE p.id = $2
      `, [lead.partner_id, lead.product_id]);

      const commissionAmount = parseFloat(commDetails?.commission_value || 0);

      // Call creditHold inside the same transaction
      const meta = {
        reference_type: 'lead',
        reference_id: lead.id,
        description: `Commission credit on hold for verified lead: ${lead.customer_name}`,
        bank_name: commDetails?.bank_name || null,
        product_type: commDetails?.product_category || null,
        processed_by: req.user.id
      };

      await creditHold(lead.partner_id, commissionAmount, meta, client);

    } else if (status === 'confirmed') {
      if (previousStatus !== 'approved') {
        await client.query('ROLLBACK');
        return error(res, 'Can only confirm an approved lead', 400);
      }

      // Find the pending transaction for this lead
      const { rows: [txn] } = await client.query(`
        SELECT id, amount FROM wallet_transactions 
        WHERE reference_type = 'lead' AND reference_id = $1 AND status = 'pending'
        LIMIT 1
      `, [lead.id]);

      if (!txn) {
        await client.query('ROLLBACK');
        return error(res, 'Associated pending commission transaction not found for this lead', 404);
      }

      // Release hold inside transaction
      const meta = {
        txn_id: txn.id,
        reference_type: 'lead_release',
        reference_id: lead.id,
        processed_by: req.user.id,
        description: `Commission hold released for confirmed lead: ${lead.customer_name}`
      };

      await releaseHold(lead.partner_id, parseFloat(txn.amount), meta, client);

    } else if (status === 'rejected') {
      if (previousStatus === 'approved') {
        // Find the pending transaction for this lead
        const { rows: [txn] } = await client.query(`
          SELECT id, amount, wallet_id FROM wallet_transactions 
          WHERE reference_type = 'lead' AND reference_id = $1 AND status = 'pending'
          LIMIT 1
        `, [lead.id]);

        if (txn) {
          const amount = parseFloat(txn.amount);

          // Deduct from hold_balance in wallets
          await client.query(`
            UPDATE wallets SET
              hold_balance = GREATEST(0, hold_balance - $1),
              last_updated = NOW()
            WHERE id = $2
          `, [amount, txn.wallet_id]);

          // Update transaction to rejected
          await client.query(`
            UPDATE wallet_transactions SET
              status = 'rejected',
              processed_by = $1,
              processed_at = NOW()
            WHERE id = $2
          `, [req.user.id, txn.id]);
        }
      }
    }

    const { rows: [updated] } = await client.query(
      `UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    // Audit Log
    await logAction(req, 'UPDATE_LEAD_STATUS', id, { previousStatus, status });

    await client.query('COMMIT');
    return success(res, updated, `Lead status updated to ${status}`);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = {
  createLead,
  listLeads,
  updateLeadStatus
};
