const { query } = require('../../config/database');
const { success, error } = require('../../utils/response/response');
const logger = require('../../config/logger');
const { getBankApplyLinkBackend } = require('../crm/lead.controller');

/**
 * GET /products/landing/:id
 * Public endpoint: Fetch product details for partner-shared landing page.
 * Accepts product ID (UUID) or product slug.
 */
const getProductLanding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const partnerCode = req.query.partner || null;

    // Find product by UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let productQuery, productParams;

    if (isUUID) {
      productQuery = `
        SELECT p.*, b.name as bank_name, b.short_code as bank_code,
               b.logo_url as bank_logo_url, b.theme_color, b.secondary_color,
               b.gradient, b.button_color, b.accent_color
        FROM products p
        LEFT JOIN banks b ON b.id = p.bank_id
        WHERE p.id = $1 AND p.is_active = true
      `;
      productParams = [id];
    } else {
      productQuery = `
        SELECT p.*, b.name as bank_name, b.short_code as bank_code,
               b.logo_url as bank_logo_url, b.theme_color, b.secondary_color,
               b.gradient, b.button_color, b.accent_color
        FROM products p
        LEFT JOIN banks b ON b.id = p.bank_id
        WHERE (p.slug ILIKE $1 OR p.name ILIKE $1) AND p.is_active = true
        LIMIT 1
      `;
      productParams = [id.replace(/-/g, ' ')];
    }

    const { rows: [product] } = await query(productQuery, productParams);

    if (!product) {
      return error(res, 'Product not found or inactive', 404);
    }

    // Build bank info
    const bank = {
      name: product.bank_name,
      short_code: product.bank_code,
      logo_url: product.bank_logo_url,
      theme_color: product.theme_color,
      secondary_color: product.secondary_color,
      gradient: product.gradient,
      button_color: product.button_color,
      accent_color: product.accent_color
    };

    // Parse features if stored as JSON string
    let features = product.features;
    if (typeof features === 'string') {
      try { features = JSON.parse(features); } catch (e) { features = []; }
    }
    product.features = features || [];

    // Parse eligibility_criteria if stored as JSON string
    let eligibility = product.eligibility_criteria;
    if (typeof eligibility === 'string') {
      try { eligibility = JSON.parse(eligibility); } catch (e) { /* keep as string */ }
    }
    product.eligibility_criteria = eligibility;

    // Parse required_documents if stored as JSON string
    let docs = product.required_documents;
    if (typeof docs === 'string') {
      try { docs = JSON.parse(docs); } catch (e) { docs = []; }
    }
    product.required_documents = docs || [];

    // Partner info (optional, for display)
    let partner = null;
    if (partnerCode) {
      const { rows: [p] } = await query(
        `SELECT id, partner_code, first_name, last_name FROM partner_profiles WHERE partner_code = $1 OR id::text = $1`,
        [partnerCode]
      );
      partner = p || null;
    }

    return success(res, {
      product,
      bank,
      partner: partner ? { code: partner.partner_code, name: `${partner.first_name || ''} ${partner.last_name || ''}`.trim() } : null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /products/landing/:id/apply
 * Public endpoint: Save customer lead and return redirect URL.
 */
const applyProductLanding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customer_name, customer_mobile, pan_number, pan, partner_code } = req.body;

    if (!customer_name || !customer_mobile) {
      return error(res, 'Customer name and mobile number are required', 400);
    }

    const cleanMobile = String(customer_mobile).replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      return error(res, 'Invalid mobile number. Please enter a valid 10-digit number.', 400);
    }

    const cleanPan = (pan_number || pan || '').toString().trim().toUpperCase() || null;

    // Find product
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let productQuery, productParams;
    if (isUUID) {
      productQuery = `SELECT p.id, p.name, p.public_url, p.partner_url, p.bank_id, p.tracking_enabled, b.name as bank_name FROM products p LEFT JOIN banks b ON b.id = p.bank_id WHERE p.id = $1`;
      productParams = [id];
    } else {
      productQuery = `SELECT p.id, p.name, p.public_url, p.partner_url, p.bank_id, p.tracking_enabled, b.name as bank_name FROM products p LEFT JOIN banks b ON b.id = p.bank_id WHERE (p.slug ILIKE $1 OR p.name ILIKE $1) LIMIT 1`;
      productParams = [id.replace(/-/g, ' ')];
    }

    const { rows: [product] } = await query(productQuery, productParams);
    if (!product) {
      return error(res, 'Product not found', 404);
    }

    // Find partner
    let partner = null;
    if (partner_code) {
      const { rows: [p] } = await query(
        `SELECT id, partner_code FROM partner_profiles WHERE partner_code = $1 OR id::text = $1`,
        [partner_code]
      );
      partner = p || null;
    }

    // Upsert customer and save lead to leads table
    try {
      let customerId = null;
      try {
        const { rows: [existingCust] } = await query(
          `SELECT id FROM customers WHERE mobile = $1 LIMIT 1`,
          [cleanMobile]
        );
        if (existingCust) {
          customerId = existingCust.id;
          await query(
            `UPDATE customers SET full_name = COALESCE(NULLIF(full_name, ''), $1), pan_number = COALESCE(NULLIF($2, ''), pan_number), updated_at = NOW() WHERE id = $3`,
            [customer_name.trim(), cleanPan, customerId]
          );
        } else {
          const { rows: [newCust] } = await query(
            `INSERT INTO customers (full_name, mobile, pan_number) VALUES ($1, $2, $3) RETURNING id`,
            [customer_name.trim(), cleanMobile, cleanPan]
          );
          customerId = newCust?.id || null;
        }
      } catch (custErr) {}

      await query(`
        INSERT INTO leads (
          partner_id, product_id, customer_name, customer_mobile, mobile,
          pan_number, customer_id, source, status, created_at
        ) VALUES ($1, $2, $3, $4, $4, $5, $6, 'partner_share', 'new', NOW())
      `, [
        partner ? partner.id : null,
        product.id,
        customer_name.trim(),
        cleanMobile,
        cleanPan,
        customerId
      ]);
    } catch (leadErr) {
      // If leads table doesn't have these columns or table doesn't exist, log and continue
      logger.warn('[Landing] Lead insert failed (non-blocking):', leadErr.message);

      // Fallback: try click_tracking table
      try {
        await query(`
          INSERT INTO click_tracking (
            partner_id, product_id, bank_id, customer_mobile,
            tracking_url, original_url, conversion_status
          ) VALUES ($1, $2, $3, $4, $5, $6, 'lead_captured')
        `, [
          partner ? partner.id : null,
          product.id,
          product.bank_id,
          cleanMobile,
          `landing/${id}`,
          product.partner_url || product.public_url || ''
        ]);
      } catch (trackErr) {
        logger.warn('[Landing] Click tracking fallback also failed:', trackErr.message);
      }
    }

    // Determine redirect URL
    const redirectUrlFromBank = getBankApplyLinkBackend(product.name, product.bank_name, product);
    let redirectUrl = redirectUrlFromBank || product.public_url || product.partner_url || 'https://gharkapaisa.in';

    // Append UTM params
    try {
      const parsedUrl = new URL(redirectUrl);
      if (partner) parsedUrl.searchParams.set('utm_source', `partner_${partner.partner_code}`);
      parsedUrl.searchParams.set('utm_medium', 'partner_share');
      parsedUrl.searchParams.set('utm_campaign', 'product_landing');
      redirectUrl = parsedUrl.toString();
    } catch (e) {
      // URL formatting failed, use as-is
    }

    return success(res, {
      redirect_url: redirectUrl,
      product_name: product.name,
      bank_name: product.bank_name
    }, 'Application initiated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProductLanding,
  applyProductLanding
};
