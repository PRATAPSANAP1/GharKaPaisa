const { query } = require('../config/db');
const { getPaginationParams } = require('../utils/helpers');
const { success, created, notFound, paginate } = require('../utils/response');

// GET /products — list with filters
const listProducts = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { category, bank_id, is_active = 'true', search } = req.query;

    let where = `WHERE p.is_active = $1`;
    const values = [is_active === 'true'];
    let idx = 2;

    if (category) { where += ` AND p.category = $${idx++}`; values.push(category); }
    if (bank_id) { where += ` AND p.bank_id = $${idx++}`; values.push(bank_id); }
    if (search) { where += ` AND (p.name ILIKE $${idx} OR b.name ILIKE $${idx})`; values.push(`%${search}%`); idx++; }

    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM products p JOIN banks b ON b.id = p.bank_id ${where}`, values),
      query(`
        SELECT p.*, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
        FROM products p JOIN banks b ON b.id = p.bank_id
        ${where}
        ORDER BY p.display_order ASC, p.commission_value DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...values, limit, offset]),
    ]);

    return paginate(res, data.rows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /products/:id
const getProduct = async (req, res, next) => {
  try {
    const { rows: [product] } = await query(`
      SELECT p.*, b.name as bank_name, b.short_code as bank_code
      FROM products p JOIN banks b ON b.id = p.bank_id WHERE p.id = $1
    `, [req.params.id]);
    if (!product) return notFound(res);
    return success(res, product);
  } catch (err) {
    next(err);
  }
};

// POST /products (Admin/Super Admin)
const createProduct = async (req, res, next) => {
  try {
    const { bank_id, name, category, description, features, eligibility, commission_type, commission_value, min_age, max_age, min_income, display_order } = req.body;
    const { rows: [p] } = await query(`
      INSERT INTO products (bank_id, name, category, description, features, eligibility, commission_type, commission_value, min_age, max_age, min_income, display_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id
    `, [bank_id, name, category, description, JSON.stringify(features || []), JSON.stringify(eligibility || {}), commission_type || 'fixed', commission_value, min_age, max_age, min_income, display_order || 0]);
    return created(res, { product_id: p.id }, 'Product created');
  } catch (err) {
    next(err);
  }
};

// PUT /products/:id (Admin)
const updateProduct = async (req, res, next) => {
  try {
    const { name, description, features, eligibility, commission_type, commission_value, is_active, display_order } = req.body;
    await query(`
      UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        features = COALESCE($3, features),
        eligibility = COALESCE($4, eligibility),
        commission_type = COALESCE($5, commission_type),
        commission_value = COALESCE($6, commission_value),
        is_active = COALESCE($7, is_active),
        display_order = COALESCE($8, display_order),
        updated_at = NOW()
      WHERE id = $9
    `, [name, description, features ? JSON.stringify(features) : null, eligibility ? JSON.stringify(eligibility) : null, commission_type, commission_value, is_active, display_order, req.params.id]);
    return success(res, {}, 'Product updated');
  } catch (err) {
    next(err);
  }
};

// GET /products/categories — grouped by category for home page
const getProductsByCategory = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT p.id, p.name, p.category, p.commission_type, p.commission_value, p.features, p.eligibility,
        b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
      FROM products p JOIN banks b ON b.id = p.bank_id
      WHERE p.is_active = true
      ORDER BY p.category, p.display_order, p.commission_value DESC
    `);

    // Group by category
    const grouped = rows.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    }, {});

    return success(res, grouped);
  } catch (err) {
    next(err);
  }
};

// POST /products/:id/commission (Super Admin — set commission)
const setCommission = async (req, res, next) => {
  try {
    const { product_id, Partner_id, commission_type, commission_value, effective_from, effective_to } = req.body;
    await query(`
      INSERT INTO commission_structures (product_id, Partner_id, commission_type, commission_value, effective_from, effective_to, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
    `, [product_id, Partner_id || null, commission_type, commission_value, effective_from, effective_to || null, req.user.id]);
    return created(res, {}, 'Commission structure set');
  } catch (err) {
    next(err);
  }
};

// GET /banks
const listBanks = async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM banks WHERE is_active = true ORDER BY name`);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { listProducts, getProduct, createProduct, updateProduct, getProductsByCategory, setCommission, listBanks };
