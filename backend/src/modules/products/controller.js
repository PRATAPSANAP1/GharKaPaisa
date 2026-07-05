const { query } = require('../../config/database');
const { getPaginationParams } = require('../../utils/helpers/helpers');
const { success, created, error, notFound, paginate, forbidden } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service.js');
const { uploadToS3, deleteFromS3 } = require('../../services/aws/s3.service.js');
const appSettingsService = require('./application-settings.service');
const logger = require('../../config/logger');

// GET /products — list with filters
const listProducts = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { category, bank_id, is_active, search, commission_enabled, featured, status } = req.query;

    let where = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (is_active !== undefined && is_active !== 'all') {
      where += ` AND p.is_active = $${idx++}`;
      values.push(is_active === 'true' || is_active === true);
    }

    if (category) { 
      where += ` AND p.category = $${idx++}`; 
      values.push(category); 
    }
    if (bank_id) { 
      where += ` AND p.bank_id = $${idx++}`; 
      values.push(bank_id); 
    }
    if (commission_enabled) {
      where += ` AND p.commission_enabled = $${idx++}`;
      values.push(commission_enabled === 'true' || commission_enabled === true);
    }
    if (featured) {
      where += ` AND p.featured = $${idx++}`;
      values.push(featured === 'true' || featured === true);
    }
    if (status) {
      where += ` AND p.status = $${idx++}`;
      values.push(status);
    }
    if (search) { 
      where += ` AND (p.name ILIKE $${idx} OR b.name ILIKE $${idx})`; 
      values.push(`%${search}%`); 
      idx++; 
    }

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
      product = rows.find(p => {
        const nameClean = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const slugClean = idOrSlug.toLowerCase().replace(/[^a-z0-9]/g, '');
        return nameClean === slugClean || nameClean.includes(slugClean) || slugClean.includes(nameClean);
      });
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
    const { 
      bank_id, name, category, description, commission_type, commission_value, 
      min_age, max_age, min_income, display_order, annual_fee, time_period,
      short_description, logo, banner, image, commission_enabled, commission_amount,
      override_percentage, featured, public_visible, partner_visible, eligibility_criteria,
      documents_required, benefits, fees_charges, apply_button_text, seo_title,
      seo_description, seo_keywords, priority, status, is_active
    } = req.body;
    let image_url = req.body.image_url;

    // Handle features and eligibility parsing
    let parsedFeatures = req.body.features;
    if (typeof parsedFeatures === 'string') {
      try { parsedFeatures = JSON.parse(parsedFeatures); } catch (e) {
        return error(res, 'Features must be a valid JSON array', 400);
      }
    }

    let parsedEligibility = req.body.eligibility;
    if (typeof parsedEligibility === 'string') {
      try { parsedEligibility = JSON.parse(parsedEligibility); } catch (e) {
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

    const isCommEnabled = commission_enabled !== undefined ? (commission_enabled === 'true' || commission_enabled === true) : true;
    const isFeatured = featured !== undefined ? (featured === 'true' || featured === true) : false;
    const isPubVisible = public_visible !== undefined ? (public_visible === 'true' || public_visible === true) : true;
    const isPartVisible = partner_visible !== undefined ? (partner_visible === 'true' || partner_visible === true) : true;
    const isActive = is_active !== undefined ? (is_active === 'true' || is_active === true) : true;

    const { rows: [p] } = await query(`
      INSERT INTO products (
        bank_id, name, category, description, features, eligibility, 
        commission_type, commission_value, min_age, max_age, min_income, 
        display_order, annual_fee, time_period, image_url,
        short_description, logo, banner, image, commission_enabled, 
        commission_amount, override_percentage, featured, public_visible, 
        partner_visible, eligibility_criteria, documents_required, benefits, 
        fees_charges, apply_button_text, seo_title, seo_description, seo_keywords,
        priority, status, is_active, created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37) RETURNING id
    `, [
      bank_id, name, category, description, JSON.stringify(parsedFeatures || []), 
      JSON.stringify(parsedEligibility || {}), commission_type || 'fixed', 
      commission_value || 0, min_age || null, max_age || null, min_income || null, display_order || 0, 
      annual_fee || null, time_period || null, image_url || null,
      short_description || null, logo || null, banner || null, image || null, isCommEnabled,
      commission_amount || 0, override_percentage || 0, isFeatured, isPubVisible,
      isPartVisible, eligibility_criteria || null, documents_required || null, benefits || null,
      fees_charges || null, apply_button_text || 'Apply Now', seo_title || null, seo_description || null, seo_keywords || null,
      priority || 0, status || 'Active', isActive, req.user?.id || null
    ]);

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
    const { 
      name, description, commission_type, commission_value, is_active, display_order, 
      annual_fee, time_period, short_description, logo, banner, image, commission_enabled,
      commission_amount, override_percentage, featured, public_visible, partner_visible,
      eligibility_criteria, documents_required, benefits, fees_charges, apply_button_text,
      seo_title, seo_description, seo_keywords, priority, status
    } = req.body;
    let image_url = req.body.image_url;

    const { rows: [existing] } = await query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (!existing) return notFound(res, 'Product not found');

    let parsedFeatures = req.body.features;
    if (typeof parsedFeatures === 'string') {
      try { parsedFeatures = JSON.parse(parsedFeatures); } catch (e) {
        return error(res, 'Features must be a valid JSON array', 400);
      }
    }

    let parsedEligibility = req.body.eligibility;
    if (typeof parsedEligibility === 'string') {
      try { parsedEligibility = JSON.parse(parsedEligibility); } catch (e) {
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

    const isCommEnabled = commission_enabled !== undefined ? (commission_enabled === 'true' || commission_enabled === true) : undefined;
    const isFeatured = featured !== undefined ? (featured === 'true' || featured === true) : undefined;
    const isPubVisible = public_visible !== undefined ? (public_visible === 'true' || public_visible === true) : undefined;
    const isPartVisible = partner_visible !== undefined ? (partner_visible === 'true' || partner_visible === true) : undefined;
    const isActive = is_active !== undefined ? (is_active === 'true' || is_active === true) : undefined;

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
        short_description = COALESCE($12, short_description),
        logo = COALESCE($13, logo),
        banner = COALESCE($14, banner),
        image = COALESCE($15, image),
        commission_enabled = COALESCE($16, commission_enabled),
        commission_amount = COALESCE($17, commission_amount),
        override_percentage = COALESCE($18, override_percentage),
        featured = COALESCE($19, featured),
        public_visible = COALESCE($20, public_visible),
        partner_visible = COALESCE($21, partner_visible),
        eligibility_criteria = COALESCE($22, eligibility_criteria),
        documents_required = COALESCE($23, documents_required),
        benefits = COALESCE($24, benefits),
        fees_charges = COALESCE($25, fees_charges),
        apply_button_text = COALESCE($26, apply_button_text),
        seo_title = COALESCE($27, seo_title),
        seo_description = COALESCE($28, seo_description),
        seo_keywords = COALESCE($29, seo_keywords),
        priority = COALESCE($30, priority),
        status = COALESCE($31, status),
        updated_by = $32,
        updated_at = NOW()
      WHERE id = $33
    `, [
      name || null,
      description || null,
      parsedFeatures ? JSON.stringify(parsedFeatures) : null,
      parsedEligibility ? JSON.stringify(parsedEligibility) : null,
      commission_type || null,
      commission_value || null,
      isActive,
      display_order || null,
      annual_fee || null,
      time_period || null,
      image_url !== undefined ? image_url : null,
      short_description || null,
      logo || null,
      banner || null,
      image || null,
      isCommEnabled,
      commission_amount || null,
      override_percentage || null,
      isFeatured,
      isPubVisible,
      isPartVisible,
      eligibility_criteria || null,
      documents_required || null,
      benefits || null,
      fees_charges || null,
      apply_button_text || null,
      seo_title || null,
      seo_description || null,
      seo_keywords || null,
      priority || null,
      status || null,
      req.user?.id || null,
      id
    ]);

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
    const { product_id, partner_id, partner_id, commission_type, commission_value, effective_from, effective_to } = req.body;

    if (effective_to && new Date(effective_from) > new Date(effective_to)) {
      return error(res, 'effective_from cannot be greater than effective_to', 400);
    }

    const finalPartnerId = partner_id || partner_id || null;

    await query(`
      INSERT INTO commission_structures (product_id, partner_id, commission_type, commission_value, effective_from, effective_to, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
    `, [product_id, finalPartnerId, commission_type, commission_value, effective_from, effective_to || null, req.user.id]);

    // Log setting of commission rule
    await logAction(req, 'SET_COMMISSION_RULE', product_id, { partner_id: finalPartnerId, commission_type, commission_value });

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
        ap.partner_code
      FROM commission_structures cs
      JOIN products p ON p.id = cs.product_id
      LEFT JOIN partner_profiles ap ON ap.id = cs.partner_id
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

    await logAction(req, 'DELETE_COMMISSION_RULE', rule.product_id, { partner_id: rule.partner_id || rule.partner_id });

    return success(res, {}, 'Commission rule deleted successfully');
  } catch (err) {
    next(err);
  }
};

const getApplicationSettings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [product] } = await query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (!product) {
      return notFound(res, 'Product not found');
    }
    const settings = await appSettingsService.getSettings(id);
    return success(res, settings);
  } catch (err) {
    next(err);
  }
};

const upsertApplicationSettings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [product] } = await query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (!product) {
      return notFound(res, 'Product not found');
    }
    const oldSettings = await appSettingsService.getSettings(id);
    const newSettings = await appSettingsService.upsertSettings(id, req.body, req.user.id);
    await logAction(req, 'UPDATE_APPLICATION_SETTINGS', id, { before: oldSettings, after: newSettings });
    return success(res, newSettings, 'Application settings updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteApplicationSettings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [product] } = await query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (!product) {
      return notFound(res, 'Product not found');
    }
    const deleted = await appSettingsService.deleteSettings(id);
    await logAction(req, 'DELETE_APPLICATION_SETTINGS', id);
    return success(res, {}, 'Application settings deleted successfully');
  } catch (err) {
    next(err);
  }
};

const resolveApplication = async (req, res, next) => {
  try {
    const idOrSlug = req.params.id;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let product;
    if (isUUID) {
      const { rows } = await query(`SELECT p.*, b.name as bank_name FROM products p JOIN banks b ON p.bank_id = b.id WHERE p.id = $1`, [idOrSlug]);
      product = rows[0];
    } else {
      const cleanSlug = idOrSlug.replace(/-/g, ' ').trim();
      const { rows } = await query(`SELECT p.*, b.name as bank_name FROM products p JOIN banks b ON p.bank_id = b.id WHERE p.name ILIKE $1 OR p.category::text = $1`, [cleanSlug]);
      product = rows[0];
    }

    if (!product) {
      return success(res, {
        application_type: 'internal_form',
        application_url: null,
        provider_name: null,
        open_type: 'same_tab'
      });
    }

    // Prioritize dynamic links from product link management system
    if (product.public_url || product.partner_url) {
      const isPartner = req.user && req.user.role && req.user.role.toUpperCase() === 'PARTNER';
      const buttonText = product.button_text || 'Apply Now';
      const openType = product.redirect_type === 'same_tab' ? 'same_tab' : 'new_tab';

      if (isPartner) {
        // Authenticated partner flow
        const partnerCode = req.partner?.partner_code || req.partner?.partner_code || '';
        const host = req.get('host');
        const trackingUrl = `${req.protocol}://${host}/redirect/${product.category}?id=${product.id}&partner=${partnerCode}`;
        
        return success(res, {
          application_type: 'external_url',
          application_url: trackingUrl,
          provider_name: product.bank_name || 'GKP Partner Link',
          open_type: openType,
          button_text: buttonText
        });
      } else {
        // Public user flow (hide partner info, no commission)
        return success(res, {
          application_type: 'external_url',
          application_url: product.public_url || product.partner_url,
          provider_name: product.bank_name || 'GKP Public Link',
          open_type: openType,
          button_text: buttonText
        });
      }
    }

    const settings = await appSettingsService.getSettings(product.id);

    if (settings.status === 'inactive') {
      return forbidden(res, 'This product application method is currently inactive');
    }

    const isPartner = req.user && req.user.role && req.user.role.toUpperCase() === 'PARTNER';
    if (isPartner) {
      if (!settings.partner_enabled) {
        return forbidden(res, 'This application method is not available to partners for this product');
      }
    } else {
      if (!settings.customer_enabled) {
        return forbidden(res, 'This application method is not available to customers for this product');
      }
    }

    if (settings.track_clicks) {
      let finalIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress;
      if (finalIp && finalIp.includes('::ffff:')) {
        finalIp = finalIp.split('::ffff:')[1];
      }
      appSettingsService.logClick({
        productId: product.id,
        partnerId: req.partner?.id || null,
        customerId: req.user?.id || null,
        applicationType: settings.application_type,
        ipAddress: finalIp,
        userAgent: req.headers['user-agent']
      }).catch(err => logger.error('resolveApplication logClick failed:', err.message));
    }

    return success(res, {
      application_type: settings.application_type,
      application_url: settings.application_url,
      provider_name: settings.provider_name,
      open_type: settings.open_type
    });
  } catch (err) {
    next(err);
  }
};

const getClickAnalytics = async (req, res, next) => {
  try {
    const { product_id } = req.query;
    const analytics = await appSettingsService.getClickAnalytics(product_id);
    return success(res, analytics);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id, is_active, status, public_visible, partner_visible } = req.body;
    if (!id) return error(res, 'Product ID is required', 400);
    
    await query(`
      UPDATE products SET
        is_active = COALESCE($1, is_active),
        status = COALESCE($2, status),
        public_visible = COALESCE($3, public_visible),
        partner_visible = COALESCE($4, partner_visible),
        updated_at = NOW()
      WHERE id = $5
    `, [is_active, status, public_visible, partner_visible, id]);
    
    await logAction(req, 'UPDATE_PRODUCT_STATUS', id, { status, public_visible, partner_visible });
    return success(res, {}, 'Product status and visibility updated successfully');
  } catch (err) {
    next(err);
  }
};

const updateFeatured = async (req, res, next) => {
  try {
    const { id, featured, priority, display_order } = req.body;
    if (!id) return error(res, 'Product ID is required', 400);

    await query(`
      UPDATE products SET
        featured = COALESCE($1, featured),
        priority = COALESCE($2, priority),
        display_order = COALESCE($3, display_order),
        updated_at = NOW()
      WHERE id = $4
    `, [featured, priority, display_order, id]);

    await logAction(req, 'UPDATE_PRODUCT_FEATURED', id, { featured, priority, display_order });
    return success(res, {}, 'Product featured settings updated successfully');
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
  deleteCommissionRule,
  getApplicationSettings,
  upsertApplicationSettings,
  deleteApplicationSettings,
  resolveApplication,
  getClickAnalytics,
  updateStatus,
  updateFeatured
};
