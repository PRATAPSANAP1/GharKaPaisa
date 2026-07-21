const { query } = require('../../config/database');
const { getPaginationParams } = require('../../utils/helpers/helpers');
const { success, created, error, notFound, paginate, forbidden } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service.js');
const { uploadToS3, deleteFromS3, getCloudFrontUrl } = require('../../services/aws/s3.service.js');
const appSettingsService = require('./application-settings.service');
const logger = require('../../config/logger');

// GET /products — list with filters
const listProducts = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { 
      category, bank_id, is_active, search, commission_enabled, featured, status,
      trending, min_salary, max_salary, min_age, max_age, min_cibil,
      occupation, employment_type, city, joining_fee_type, sort_by,
      sub_category, is_popular
    } = req.query;

    let where = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (is_active !== undefined && is_active !== 'all') {
      where += ` AND p.is_active = $${idx++}`;
      values.push(is_active === 'true' || is_active === true);
    }

    if (category) { 
      if (category.includes('%')) {
        where += ` AND p.category::text ILIKE $${idx++}`; 
      } else {
        where += ` AND p.category = $${idx++}`; 
      }
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
    if (trending) {
      where += ` AND p.trending = $${idx++}`;
      values.push(trending === 'true' || trending === true);
    }
    if (status) {
      where += ` AND p.status = $${idx++}`;
      values.push(status);
    }
    if (sub_category) {
      where += ` AND p.sub_category = $${idx++}`;
      values.push(sub_category);
    }
    if (is_popular === 'true' || is_popular === true) {
      where += ` AND (p.visibility->>'is_popular')::boolean = true`;
    }
    if (search) { 
      where += ` AND (p.name ILIKE $${idx} OR b.name ILIKE $${idx} OR p.rewards ILIKE $${idx} OR p.cashback ILIKE $${idx})`; 
      values.push(`%${search}%`); 
      idx++; 
    }

    // Advanced eligibility filters
    if (min_salary) {
      where += ` AND (p.min_income IS NULL OR p.min_income <= $${idx++})`;
      values.push(parseFloat(min_salary));
    }
    if (min_age) {
      where += ` AND (p.min_age IS NULL OR p.min_age <= $${idx++})`;
      values.push(parseInt(min_age));
    }
    if (max_age) {
      where += ` AND (p.max_age IS NULL OR p.max_age >= $${idx++})`;
      values.push(parseInt(max_age));
    }
    if (joining_fee_type === 'free') {
      where += ` AND (p.joining_fee IS NULL OR LOWER(p.joining_fee) IN ('0', 'free', 'nil', 'waived'))`;
    }

    // Sort options
    let orderBy = 'ORDER BY p.display_order ASC, p.commission_value DESC';
    if (sort_by === 'commission_high') orderBy = 'ORDER BY p.commission_value DESC';
    if (sort_by === 'commission_low') orderBy = 'ORDER BY p.commission_value ASC';
    if (sort_by === 'newest') orderBy = 'ORDER BY p.created_at DESC';
    if (sort_by === 'popular') orderBy = 'ORDER BY p.approval_rate DESC, p.commission_value DESC';

    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM products p JOIN banks b ON b.id = p.bank_id ${where}`, values),
      query(`
        SELECT p.*, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
        FROM products p JOIN banks b ON b.id = p.bank_id
        ${where}
        ${orderBy}
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...values, limit, offset]),
    ]);

    const isPartnerOrAdmin = req.user && ['PARTNER', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    const sanitizedRows = data.rows.map(prod => {
      const { ...prodData } = prod;
      
      // Default metadata
      prodData.hold_days = prodData.hold_days || 7;
      prodData.approval_rate = prodData.approval_rate || 82;
      if (prodData.image_url) prodData.image_url = getCloudFrontUrl(prodData.image_url);
      if (prodData.bank_logo) prodData.bank_logo = getCloudFrontUrl(prodData.bank_logo);

      if (!isPartnerOrAdmin) {
        // Public Visitor View - Strip out commission and margin metrics
        delete prodData.commission_value;
        delete prodData.commission_type;
        delete prodData.commission_enabled;
        delete prodData.company_margin;
        delete prodData.internal_notes;
      }
      return prodData;
    });

    return paginate(res, sanitizedRows, parseInt(count.rows[0].count), page, limit);
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
        SELECT p.*, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
        FROM products p JOIN banks b ON b.id = p.bank_id WHERE p.id = $1
      `, [idOrSlug]);
      product = rows[0];
    } else {
      // Direct lookup by slug first
      const { rows } = await query(`
        SELECT p.*, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
        FROM products p JOIN banks b ON b.id = p.bank_id 
        WHERE LOWER(p.slug) = LOWER($1) AND p.is_active = true
        LIMIT 1
      `, [idOrSlug]);
      product = rows[0];

      // Fallback to name-similarity matching
      if (!product) {
        const { rows: allActive } = await query(`
          SELECT p.*, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
          FROM products p JOIN banks b ON b.id = p.bank_id WHERE p.is_active = true
        `);
        product = allActive.find(p => {
          const nameClean = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const slugClean = idOrSlug.toLowerCase().replace(/[^a-z0-9]/g, '');
          return nameClean === slugClean || nameClean.includes(slugClean) || slugClean.includes(nameClean);
        });
      }
    }

    if (!product) return notFound(res);

    // Fetch sub-entities in parallel
    const [faqsRes, videosRes, docsRes, offersRes, ratingsRes, featuresRes] = await Promise.all([
      query(`SELECT id, question, answer, display_order FROM product_faq WHERE product_id = $1 AND is_active = true ORDER BY display_order`, [product.id]),
      query(`SELECT id, title, youtube_url, video_url, thumbnail_url, duration, display_order FROM product_videos WHERE product_id = $1 AND is_active = true ORDER BY display_order`, [product.id]),
      query(`SELECT id, title, document_type, file_url, file_size, display_order FROM product_documents WHERE product_id = $1 AND is_active = true ORDER BY display_order`, [product.id]),
      query(`SELECT id, title, description, offer_type, discount_value, badge_text, banner_url, start_date, end_date FROM product_offers WHERE product_id = $1 AND is_active = true AND NOW() BETWEEN start_date AND end_date ORDER BY start_date DESC`, [product.id]),
      query(`SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as total_reviews FROM product_ratings WHERE product_id = $1`, [product.id]),
      query(`SELECT id, title, description, icon, display_order FROM product_features WHERE product_id = $1 ORDER BY display_order`, [product.id])
    ]);

    // Structure normalized sub-keys matching API spec
    product.bank = {
      id: product.bank_id,
      name: product.bank_name,
      short_code: product.bank_code,
      logo_url: product.bank_logo
    };

    product.fees = product.fees_structure || {};
    product.eligibility = product.eligibility_criteria || {};
    product.features = (product.features_list && product.features_list.length > 0) 
      ? product.features_list 
      : (featuresRes.rows.length > 0 ? featuresRes.rows.map(f => ({ title: f.title, description: f.description, icon: f.icon })) : (Array.isArray(product.features) ? product.features : []));
    
    product.benefits = Array.isArray(product.benefits_list) ? product.benefits_list : [];
    product.documents = Array.isArray(product.required_documents) ? product.required_documents : (docsRes.rows.map(d => d.title || d.document_type));
    product.compare = product.compare_specs || {};
    product.faqs = faqsRes.rows;
    product.gallery = [
      ...(product.banner_url ? [{ id: 'banner', image_url: product.banner_url, image_type: 'Banner' }] : []),
      ...(product.image_url ? [{ id: 'card', image_url: product.image_url, image_type: 'Card' }] : []),
      ...offersRes.rows.map(o => ({ id: o.id, image_url: o.banner_url, image_type: 'Offer', title: o.title }))
    ];

    product.videos = videosRes.rows;
    product.active_offers = offersRes.rows;
    product.avg_rating = parseFloat(ratingsRes.rows[0].avg_rating).toFixed(1);
    product.total_reviews = parseInt(ratingsRes.rows[0].total_reviews);
    product.structured_features = featuresRes.rows;

    // Check if partner has bookmarked this product
    if (req.partner?.id) {
      const { rows: [bm] } = await query(
        `SELECT id FROM partner_saved_products WHERE partner_id = $1 AND product_id = $2`,
        [req.partner.id, product.id]
      );
      product.is_bookmarked = !!bm;
    }

    // Auto-track product view (fire and forget)
    const viewIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
    const viewUa = req.headers['user-agent'];
    const { trackProductView } = require('./engagement.controller.js');
    trackProductView(product.id, req.partner?.id || null, viewIp, viewUa).catch(() => {});

    return success(res, product);
  } catch (err) {
    next(err);
  }
};

// POST /products (Admin/Super Admin)
const createProduct = async (req, res, next) => {
  try {
    const { 
      bank_id, name, category, sub_category, description, commission_type, commission_value, 
      min_age, max_age, min_income, display_order, annual_fee, time_period,
      short_description, logo, banner, image, commission_enabled, commission_amount,
      override_percentage, featured, public_visible, partner_visible, eligibility_criteria,
      documents_required, benefits, fees_charges, apply_button_text, seo_title,
      seo_description, seo_keywords, priority, status, is_active,
      card_network, card_variant, best_for, welcome_benefits, is_lifetime_free, badge, is_recommended, is_trending,
      public_url, partner_url
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
    const isLtf = is_lifetime_free !== undefined ? (is_lifetime_free === 'true' || is_lifetime_free === true) : false;
    const isRec = is_recommended !== undefined ? (is_recommended === 'true' || is_recommended === true) : false;
    const isTrend = is_trending !== undefined ? (is_trending === 'true' || is_trending === true) : false;

    // Generate unique slug
    let productSlug = req.body.slug;
    if (!productSlug || !productSlug.trim()) {
      productSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const { rows: existingSlug } = await query(`SELECT id FROM products WHERE slug = $1`, [productSlug]);
    if (existingSlug.length > 0) {
      productSlug = `${productSlug}-${Date.now().toString().slice(-4)}`;
    }

    const { rows: [p] } = await query(`
      INSERT INTO products (
        bank_id, name, category, sub_category, description, features, eligibility, 
        commission_type, commission_value, min_age, max_age, min_income, 
        display_order, annual_fee, time_period, image_url,
        short_description, logo, banner, image, commission_enabled, 
        commission_amount, override_percentage, featured, public_visible, 
        partner_visible, eligibility_criteria, documents_required, benefits, 
        fees_charges, apply_button_text, seo_title, seo_description, seo_keywords,
        priority, status, is_active, created_by, slug,
        card_network, card_variant, best_for, welcome_benefits, is_lifetime_free, badge, is_recommended, is_trending,
        public_url, partner_url
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,
        $40,$41,$42,$43,$44,$45,$46,$47,$48,$49
      ) RETURNING id
    `, [
      bank_id, name, category, sub_category || null, description, JSON.stringify(parsedFeatures || []), 
      JSON.stringify(parsedEligibility || {}), commission_type || 'fixed', 
      commission_value || 0, min_age || null, max_age || null, min_income || null, display_order || 0, 
      annual_fee || null, time_period || null, image_url || null,
      short_description || null, logo || null, banner || null, image || null, isCommEnabled,
      commission_amount || 0, override_percentage || 0, isFeatured, isPubVisible,
      isPartVisible, eligibility_criteria || null, documents_required || null, benefits || null,
      fees_charges || null, apply_button_text || 'Apply Now', seo_title || null, seo_description || null, seo_keywords || null,
      priority || 0, status || 'Active', isActive, req.user?.id || null, productSlug,
      card_network || null, card_variant || null, best_for || null, welcome_benefits || null, isLtf, badge || null, isRec, isTrend,
      public_url || null, partner_url || null
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
      seo_title, seo_description, seo_keywords, priority, status,
      public_url, partner_url, sub_category
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

    // Generate/update unique slug
    let productSlug = req.body.slug;
    if (name && (!productSlug || !productSlug.trim())) {
      productSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (productSlug) {
      const { rows: existingSlug } = await query(`SELECT id FROM products WHERE slug = $1 AND id <> $2`, [productSlug, id]);
      if (existingSlug.length > 0) {
        productSlug = `${productSlug}-${Date.now().toString().slice(-4)}`;
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
        slug = COALESCE($34, slug),
        sub_category = COALESCE($35, sub_category),
        card_network = COALESCE($36, card_network),
        card_variant = COALESCE($37, card_variant),
        best_for = COALESCE($38, best_for),
        welcome_benefits = COALESCE($39, welcome_benefits),
        is_lifetime_free = COALESCE($40, is_lifetime_free),
        badge = COALESCE($41, badge),
        is_recommended = COALESCE($42, is_recommended),
        is_trending = COALESCE($43, is_trending),
        public_url = COALESCE($44, public_url),
        partner_url = COALESCE($45, partner_url),
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
      id,
      productSlug || null,
      sub_category || null,
      card_network || null,
      card_variant || null,
      best_for || null,
      welcome_benefits || null,
      req.body.is_lifetime_free !== undefined ? (req.body.is_lifetime_free === 'true' || req.body.is_lifetime_free === true) : null,
      badge || null,
      req.body.is_recommended !== undefined ? (req.body.is_recommended === 'true' || req.body.is_recommended === true) : null,
      req.body.is_trending !== undefined ? (req.body.is_trending === 'true' || req.body.is_trending === true) : null,
      public_url !== undefined ? public_url : null,
      partner_url !== undefined ? partner_url : null
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
    const { product_id, partner_id, commission_type, commission_value, effective_from, effective_to } = req.body;

    if (effective_to && new Date(effective_from) > new Date(effective_to)) {
      return error(res, 'effective_from cannot be greater than effective_to', 400);
    }

    const finalPartnerId = partner_id || null;

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

const duplicateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [original] } = await query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (!original) return error(res, 'Product not found', 404);

    const newName = `${original.name} (Copy)`;
    const newSlug = `${original.slug || 'product'}-copy-${Date.now().toString().slice(-4)}`;

    const { rows: [duplicated] } = await query(`
      INSERT INTO products (
        bank_id, name, category, sub_category, description, image_url, thumbnail_url, banner_url,
        fees_structure, eligibility_criteria, commissions_json, features_list, benefits_list,
        required_documents, compare_specs, visibility, seo_metadata, is_active, status, slug
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `, [
      original.bank_id,
      newName,
      original.category,
      original.sub_category,
      original.description,
      original.image_url,
      original.thumbnail_url,
      original.banner_url,
      original.fees_structure || {},
      original.eligibility_criteria || {},
      original.commissions_json || {},
      original.features_list || [],
      original.benefits_list || [],
      original.required_documents || [],
      original.compare_specs || {},
      original.visibility || {},
      original.seo_metadata || {},
      original.is_active,
      original.status,
      newSlug
    ]);

    await logAction(req, 'DUPLICATE_PRODUCT', duplicated.id, { original_id: id, name: newName });
    return created(res, duplicated, 'Product duplicated successfully');
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
  updateFeatured,
  duplicateProduct
};

