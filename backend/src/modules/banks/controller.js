const { query } = require('../../config/database');
const { logAction } = require('../admin/audit.service.js');
const { uploadToS3, deleteFromS3 } = require('../../services/aws/s3.service.js');
const { getPaginationParams } = require('../../utils/helpers/helpers');
const { success, created, error, notFound, paginate } = require('../../utils/response/response');

// GET /api/v1/banks (Admin/Super Admin/Public — list all banks)
const listAllBanks = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { search, status } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (search) {
      whereClause += ` AND (b.name ILIKE $${idx} OR b.short_code ILIKE $${idx})`;
      values.push(`%${search}%`);
      idx++;
    }

    if (status && status !== 'all') {
      if (status === 'Active') {
        whereClause += ` AND (b.status = 'Active' OR b.is_active = true)`;
      } else if (status === 'Inactive') {
        whereClause += ` AND (b.status = 'Inactive' OR b.is_active = false)`;
      } else {
        whereClause += ` AND b.status = $${idx++}`;
        values.push(status);
      }
    }

    const countQuery = `SELECT COUNT(*) FROM banks b ${whereClause}`;
    const dataQuery = `
      SELECT 
        b.*,
        COUNT(p.id)::int as products_count
      FROM banks b
      LEFT JOIN products p ON p.bank_id = b.id
      ${whereClause}
      GROUP BY b.id
      ORDER BY b.display_order ASC, b.name ASC
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

// GET /api/v1/banks/:id
const getBankById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: [bank] } = await query(`
      SELECT b.*, COUNT(p.id)::int as products_count
      FROM banks b
      LEFT JOIN products p ON p.bank_id = b.id
      WHERE b.id = $1
      GROUP BY b.id
    `, [id]);

    if (!bank) return notFound(res, 'Bank partner not found');
    return success(res, bank);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/banks (Admin/Super Admin — create new bank)
const createBank = async (req, res, next) => {
  try {
    const { name, short_code, is_active, status, display_order } = req.body;
    let logo_url = req.body.logo_url;

    if (!name || !short_code) {
      return error(res, 'Bank Name and Short Code are required', 400);
    }

    if (req.file) {
      const isS3Configured = !!process.env.AWS_S3_BUCKET;
      if (!isS3Configured) {
        return error(res, 'S3 bucket is not configured.', 503);
      }
      const { url } = await uploadToS3(req.file.buffer, req.file.originalname, 'banks');
      logo_url = url;
    }

    // Check if short_code already exists
    const { rows: [existingShort] } = await query('SELECT id FROM banks WHERE short_code = $1', [short_code]);
    if (existingShort) {
      return error(res, 'A bank with this Short Code already exists', 400);
    }

    // Check if name already exists
    const { rows: [existingName] } = await query('SELECT id FROM banks WHERE name = $1', [name]);
    if (existingName) {
      return error(res, 'A bank with this Name already exists', 400);
    }

    const finalStatus = status || (is_active === false || is_active === 'false' ? 'Inactive' : 'Active');
    const finalIsActive = finalStatus === 'Active';

    const { rows: [bank] } = await query(`
      INSERT INTO banks (name, short_code, logo_url, is_active, status, display_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, short_code, logo_url || null, finalIsActive, finalStatus, display_order || 0]);

    // Log action to audit logs
    await logAction(req, 'CREATE_BANK', bank.id, { name, short_code });

    return created(res, bank, 'Bank partner created successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/banks/:id (Admin/Super Admin — update bank)
const updateBank = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, short_code, is_active, status, display_order } = req.body;
    let logo_url = req.body.logo_url;

    const { rows: [existing] } = await query('SELECT * FROM banks WHERE id = $1', [id]);
    if (!existing) {
      return notFound(res, 'Bank partner not found');
    }

    if (req.file) {
      const isS3Configured = !!process.env.AWS_S3_BUCKET;
      if (!isS3Configured) {
        return error(res, 'S3 bucket is not configured.', 503);
      }
      const { url } = await uploadToS3(req.file.buffer, req.file.originalname, 'banks');
      logo_url = url;

      if (existing.logo_url && existing.logo_url.includes(process.env.AWS_S3_BUCKET)) {
        try {
          const parts = existing.logo_url.split('.com/');
          if (parts[1]) await deleteFromS3(parts[1]);
        } catch (s3Err) {
          console.error('Failed to delete old bank logo from S3', s3Err);
        }
      }
    }

    if (name && name !== existing.name) {
      const { rows: [dupName] } = await query('SELECT id FROM banks WHERE name = $1', [name]);
      if (dupName) return error(res, 'A bank with this Name already exists', 400);
    }

    if (short_code && short_code !== existing.short_code) {
      const { rows: [dupShort] } = await query('SELECT id FROM banks WHERE short_code = $1', [short_code]);
      if (dupShort) return error(res, 'A bank with this Short Code already exists', 400);
    }

    const finalStatus = status || (is_active !== undefined ? (is_active ? 'Active' : 'Inactive') : existing.status);
    const finalIsActive = finalStatus === 'Active';

    const { rows: [bank] } = await query(`
      UPDATE banks SET
        name = COALESCE($1, name),
        short_code = COALESCE($2, short_code),
        logo_url = COALESCE($3, logo_url),
        is_active = $4,
        status = $5,
        display_order = COALESCE($6, display_order),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [
      name || null,
      short_code || null,
      logo_url !== undefined ? logo_url : null,
      finalIsActive,
      finalStatus,
      display_order !== undefined ? parseInt(display_order) : null,
      id
    ]);

    await logAction(req, 'UPDATE_BANK', bank.id, { name: bank.name, status: bank.status, is_active: bank.is_active });

    return success(res, bank, 'Bank partner updated successfully');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/banks/:id/status
const updateBankStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { rows: [existing] } = await query('SELECT * FROM banks WHERE id = $1', [id]);
    if (!existing) return notFound(res, 'Bank partner not found');

    const newStatus = status || (existing.status === 'Active' ? 'Inactive' : 'Active');
    const newIsActive = newStatus === 'Active';

    const { rows: [updated] } = await query(`
      UPDATE banks SET status = $1, is_active = $2, updated_at = NOW()
      WHERE id = $3 RETURNING *
    `, [newStatus, newIsActive, id]);

    await logAction(req, 'UPDATE_BANK_STATUS', id, { status: newStatus });
    return success(res, updated, 'Bank status updated successfully');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/banks/:id (Admin/Super Admin — delete bank)
const deleteBank = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: [existing] } = await query('SELECT * FROM banks WHERE id = $1', [id]);
    if (!existing) {
      return notFound(res, 'Bank partner not found');
    }

    await query('ALTER TABLE products ALTER COLUMN bank_id DROP NOT NULL').catch(() => {});
    await query('UPDATE products SET bank_id = NULL WHERE bank_id = $1', [id]).catch(() => {});

    await query('ALTER TABLE applications ALTER COLUMN bank_id DROP NOT NULL').catch(() => {});
    await query('UPDATE applications SET bank_id = NULL WHERE bank_id = $1', [id]).catch(() => {});

    await query('UPDATE leads SET bank_id = NULL WHERE bank_id = $1', [id]).catch(() => {});
    await query('UPDATE card_applications SET bank_id = NULL WHERE bank_id = $1', [id]).catch(() => {});
    await query('UPDATE bank_card_applications SET bank_id = NULL WHERE bank_id = $1', [id]).catch(() => {});

    await query('DELETE FROM banks WHERE id = $1', [id]);

    await logAction(req, 'DELETE_BANK', id, { name: existing.name });

    return success(res, {}, 'Bank partner deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listAllBanks,
  getBankById,
  createBank,
  updateBank,
  updateBankStatus,
  deleteBank
};
