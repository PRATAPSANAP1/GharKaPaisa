const { query } = require('../../config/database');
const { getPaginationParams } = require('../../utils/helpers/helpers');
const { success, created, error, notFound, paginate } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service.js');
const { uploadToS3, deleteFromS3 } = require('../../services/aws/s3.service.js');

// GET /products — list with filters
const listProducts = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { category, bank_id, is_active = 'true', search } = req.query;

    let where = '';
    const values = [];
    let idx = 1;

    if (is_active === 'all') {
      where = `WHERE 1=1`;
    } else {
      where = `WHERE p.is_active = $${idx++} AND b.is_active = true AND b.status = 'Active'`;
      values.push(is_active === 'true');
    }

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
    const idOrSlug = req.params.id;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let product;
    if (isUUID) {
      const { rows } = await query(`
        SELECT p.*, b.name as bank_name, b.short_code as bank_code
        FROM products p JOIN banks b ON b.id = p.bank_id WHERE p.id = $1
      `, [idOrSlug]);
      product = rows[0];
    } else {
      const { rows } = await query(`
        SELECT p.*, b.name as bank_name, b.short_code as bank_code
        FROM products p JOIN banks b ON b.id = p.bank_id WHERE p.is_active = true
      `);
      product = rows.find(p => p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === idOrSlug.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }

    if (!product) return notFound(res);
    return success(res, product);
  } catch (err) {
    next(err);
  }
};

// POST /products (Admin/Super Admin)
const createProduct = async (req, res, next) => {
  try {
    const { bank_id, name, category, description, commission_type, commission_value, min_age, max_age, min_income, display_order, annual_fee, time_period } = req.body;
    let image_url = req.body.image_url;

    // Handle features and eligibility parsing since they might be sent as stringified JSON in FormData
    let parsedFeatures = req.body.features;
    if (typeof parsedFeatures === 'string') {
      try {
        parsedFeatures = JSON.parse(parsedFeatures);
      } catch (e) {
        return error(res, 'Features must be a valid JSON array', 400);
      }
    }

    let parsedEligibility = req.body.eligibility;
    if (typeof parsedEligibility === 'string') {
      try {
        parsedEligibility = JSON.parse(parsedEligibility);
      } catch (e) {
        return error(res, 'Eligibility must be a valid JSON object', 400);
      }
    }

    if (req.file) {
      const isS3Configured = !!process.env.AWS_S3_BUCKET;
      if (isS3Configured) {
        const { url } = await uploadToS3(req.file.buffer, req.file.originalname, 'products');
        image_url = url;
      }
    }

    // Bank existence check
    const { rows: [bank] } = await query(`SELECT id FROM banks WHERE id = $1`, [bank_id]);
    if (!bank) return error(res, 'Bank not found', 400);

    const { rows: [p] } = await query(`
      INSERT INTO products (
        bank_id, name, category, description, features, eligibility, 
        commission_type, commission_value, min_age, max_age, min_income, 
        display_order, annual_fee, time_period, image_url
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id
    `, [
      bank_id, name, category, description, JSON.stringify(parsedFeatures || []), 
      JSON.stringify(parsedEligibility || {}), commission_type || 'fixed', 
      commission_value, min_age, max_age, min_income, display_order || 0, 
      annual_fee, time_period, image_url || null
    ]);

    // Log the product creation
    await logAction(req, 'CREATE_PRODUCT', p.id, { name, category, commission_value });

    return created(res, { product_id: p.id }, 'Product created');
  } catch (err) {
    next(err);
  }
};

// PUT /products/:id (Admin)
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, commission_type, commission_value, is_active, display_order, annual_fee, time_period } = req.body;
    let image_url = req.body.image_url;

    // Get existing product for S3 cleanup
    const { rows: [existing] } = await query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (!existing) return notFound(res, 'Product not found');

    // Handle features and eligibility parsing
    let parsedFeatures = req.body.features;
    if (typeof parsedFeatures === 'string') {
      try {
        parsedFeatures = JSON.parse(parsedFeatures);
      } catch (e) {
        return error(res, 'Features must be a valid JSON array', 400);
      }
    }

    let parsedEligibility = req.body.eligibility;
    if (typeof parsedEligibility === 'string') {
      try {
        parsedEligibility = JSON.parse(parsedEligibility);
      } catch (e) {
        return error(res, 'Eligibility must be a valid JSON object', 400);
      }
    }

    if (parsedFeatures !== undefined) {
      if (!Array.isArray(parsedFeatures)) {
        return error(res, 'Features must be an array', 400);
      }
      if (parsedFeatures.length === 0) {
        return error(res, 'Features cannot be empty', 400);
      }
    }

    if (parsedEligibility !== undefined) {
      if (typeof parsedEligibility !== 'object' || parsedEligibility === null || Array.isArray(parsedEligibility)) {
        return error(res, 'Eligibility must be an object', 400);
      }
      if (Object.keys(parsedEligibility).length === 0) {
        return error(res, 'Eligibility cannot be empty', 400);
      }
    }

    if (req.file) {
      const isS3Configured = !!process.env.AWS_S3_BUCKET;
      if (isS3Configured) {
        const { url } = await uploadToS3(req.file.buffer, req.file.originalname, 'products');
        image_url = url;

        // Delete old S3 image
        if (existing.image_url && existing.image_url.includes(process.env.AWS_S3_BUCKET)) {
          try {
            const parts = existing.image_url.split('.com/');
            if (parts[1]) await deleteFromS3(parts[1]);
          } catch (s3Err) {
            console.error('Failed to delete old product image from S3', s3Err);
          }
        }
      }
    }

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
        annual_fee = COALESCE($9, annual_fee),
        time_period = COALESCE($10, time_period),
        image_url = COALESCE($11, image_url),
        updated_at = NOW()
      WHERE id = $12
    `, [
      name || null,
      description || null,
      parsedFeatures ? JSON.stringify(parsedFeatures) : null,
      parsedEligibility ? JSON.stringify(parsedEligibility) : null,
      commission_type || null,
      commission_value || null,
      is_active !== undefined ? (is_active === 'true' || is_active === true) : null,
      display_order || null,
      annual_fee || null,
      time_period || null,
      image_url !== undefined ? image_url : null,
      id
    ]);

    // Log product update
    await logAction(req, 'UPDATE_PRODUCT', id, { name, commission_value, is_active });

    return success(res, {}, 'Product updated');
  } catch (err) {
    next(err);
  }
};

// GET /products/categories — grouped by category for home page
const getProductsByCategory = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM products p JOIN banks b ON b.id = p.bank_id WHERE p.is_active = true AND b.is_active = true AND b.status = 'Active'`),
      query(`
        SELECT p.id, p.name, p.category, p.commission_type, p.commission_value, p.features, p.eligibility, p.annual_fee, p.time_period,
          b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
        FROM products p JOIN banks b ON b.id = p.bank_id
        WHERE p.is_active = true AND b.is_active = true AND b.status = 'Active'
        ORDER BY p.category, p.display_order, p.commission_value DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset])
    ]);

    // Group by category
    const grouped = data.rows.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      message: 'Success',
      data: grouped,
      pagination: {
        total: parseInt(count.rows[0].count),
        page,
        limit,
        totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

// POST /products/:id/commission (Super Admin — set commission)
const setCommission = async (req, res, next) => {
  try {
    const { product_id, Partner_id, commission_type, commission_value, effective_from, effective_to } = req.body;

    if (effective_to && new Date(effective_from) > new Date(effective_to)) {
      return error(res, 'effective_from cannot be greater than effective_to', 400);
    }

    await query(`
      INSERT INTO commission_structures (product_id, Partner_id, commission_type, commission_value, effective_from, effective_to, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
    `, [product_id, Partner_id || null, commission_type, commission_value, effective_from, effective_to || null, req.user.id]);

    // Log setting of commission rule
    await logAction(req, 'SET_COMMISSION_RULE', product_id, { Partner_id, commission_type, commission_value });

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

// GET /products/cards
const getCards = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM products p JOIN banks b ON b.id = p.bank_id WHERE p.is_active = true AND b.is_active = true AND b.status = 'Active' AND p.category IN ('credit_card', 'co_branded_card', 'fd_card')`),
      query(`
        SELECT p.*, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
        FROM products p JOIN banks b ON b.id = p.bank_id
        WHERE p.is_active = true AND b.is_active = true AND b.status = 'Active' AND p.category IN ('credit_card', 'co_branded_card', 'fd_card')
        ORDER BY p.display_order ASC, p.commission_value DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset])
    ]);
    return paginate(res, data.rows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /products/loans
const getLoans = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM products p JOIN banks b ON b.id = p.bank_id WHERE p.is_active = true AND b.is_active = true AND b.status = 'Active' AND p.category IN ('personal_loan', 'business_loan', 'home_loan', 'instant_loan', 'used_car_loan', 'education_loan')`),
      query(`
        SELECT p.*, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
        FROM products p JOIN banks b ON b.id = p.bank_id
        WHERE p.is_active = true AND b.is_active = true AND b.status = 'Active' AND p.category IN ('personal_loan', 'business_loan', 'home_loan', 'instant_loan', 'used_car_loan', 'education_loan')
        ORDER BY p.display_order ASC, p.commission_value DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset])
    ]);
    return paginate(res, data.rows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /products/insurance
const getInsurance = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM products p JOIN banks b ON b.id = p.bank_id WHERE p.is_active = true AND b.is_active = true AND b.status = 'Active' AND p.category IN ('health_insurance', 'life_insurance', 'general_insurance')`),
      query(`
        SELECT p.*, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
        FROM products p JOIN banks b ON b.id = p.bank_id
        WHERE p.is_active = true AND b.is_active = true AND b.status = 'Active' AND p.category IN ('health_insurance', 'life_insurance', 'general_insurance')
        ORDER BY p.display_order ASC, p.commission_value DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset])
    ]);
    return paginate(res, data.rows, parseInt(count.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// DELETE /products/:id (Admin / Super Admin)
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: [existing] } = await query(
      `SELECT * FROM products WHERE id = $1`,
      [id]
    );

    if (!existing) {
      return notFound(res, 'Product not found');
    }

    // First delete referencing commission structures and leads to avoid foreign key violations
    await query(`DELETE FROM commission_structures WHERE product_id = $1`, [id]);
    await query(`DELETE FROM leads WHERE product_id = $1`, [id]);
    
    // Now delete the product
    await query(`DELETE FROM products WHERE id = $1`, [id]);

    // Log action
    await logAction(req, 'DELETE_PRODUCT', id, { name: existing.name });

    return success(res, {}, 'Product deleted successfully');
  } catch (err) {
    if (err.message.includes('violates foreign key constraint')) {
      return error(res, 'Cannot delete product because it has active customer applications associated with it. Please deactivate it instead.', 400);
    }
    next(err);
  }
};

const listCommissionRules = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT 
        cs.*, 
        p.name as product_name,
        p.category as product_category,
        ap.first_name, 
        ap.last_name, 
        ap.Partner_code
      FROM commission_structures cs
      JOIN products p ON p.id = cs.product_id
      LEFT JOIN Partner_profiles ap ON ap.id = cs.Partner_id
      ORDER BY cs.created_at DESC
    `);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

const deleteCommissionRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [rule] } = await query(`SELECT * FROM commission_structures WHERE id = $1`, [id]);
    if (!rule) {
      return notFound(res, 'Commission rule not found');
    }

    await query(`DELETE FROM commission_structures WHERE id = $1`, [id]);

    await logAction(req, 'DELETE_COMMISSION_RULE', rule.product_id, { Partner_id: rule.Partner_id });

    return success(res, {}, 'Commission rule deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  getProductsByCategory,
  setCommission,
  listBanks,
  getCards,
  getLoans,
  getInsurance,
  deleteProduct,
  listCommissionRules,
  deleteCommissionRule
};
