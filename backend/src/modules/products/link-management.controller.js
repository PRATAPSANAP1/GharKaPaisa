const { query } = require('../../config/database');
const { success, error } = require('../../utils/response/response');
const logger = require('../../config/logger');

/**
 * Helper to parse device type, OS, and browser name from a user agent string.
 */
function parseUA(userAgent) {
  let device = 'Desktop';
  let browser = 'Unknown';
  let os = 'Unknown';

  if (!userAgent) return { device, browser, os };

  const ua = userAgent.toLowerCase();

  // Device type detection
  if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipod')) {
    device = 'Mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad') || ua.includes('playbook') || ua.includes('silk')) {
    device = 'Tablet';
  }

  // OS detection
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';

  // Browser detection
  if (ua.includes('opr') || ua.includes('opera')) {
    browser = 'Opera';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('chrome') || ua.includes('chromium')) {
    browser = 'Chrome';
  } else if (ua.includes('safari')) {
    browser = 'Safari';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('msie') || ua.includes('trident')) {
    browser = 'IE';
  }

  return { device, browser, os };
}

/**
 * GET /products/links
 * List all products and their dynamic link configs
 */
const listProductLinks = async (req, res, next) => {
  try {
    const { search, category, bank_id, limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT p.id, p.name, p.category, p.is_active,
             p.public_url, p.partner_url, p.tracking_enabled, p.button_text, p.redirect_type,
             p.utm_source, p.utm_medium, p.utm_campaign, p.priority,
             p.last_updated_at, b.name as bank_name, u.full_name as updated_by
      FROM products p
      JOIN banks b ON p.bank_id = b.id
      LEFT JOIN users u ON p.last_updated_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (p.name ILIKE $${paramIndex} OR b.name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      sql += ` AND p.category::text = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (bank_id) {
      sql += ` AND p.bank_id = $${paramIndex}`;
      params.push(bank_id);
      paramIndex++;
    }

    const countSql = `SELECT COUNT(*) FROM (${sql}) AS temp`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ` ORDER BY p.priority DESC, p.name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const { rows } = await query(sql, params);

    return success(res, {
      data: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /products/link/:id
 * Get details for a single product link config
 */
const getProductLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [link] } = await query(
      `SELECT p.id, p.name, p.category, p.public_url, p.partner_url, p.tracking_enabled,
              p.button_text, p.redirect_type, p.utm_source, p.utm_medium, p.utm_campaign, p.priority,
              p.last_updated_at, b.name as bank_name
       FROM products p
       JOIN banks b ON p.bank_id = b.id
       WHERE p.id = $1`,
      [id]
    );
    if (!link) {
      return error(res, 'Product link configuration not found', 404);
    }
    // Fetch History / Audit Logs for this product link
    const { rows: history } = await query(
      `SELECT a.*, u.full_name as updated_by_name
       FROM product_link_audits a
       LEFT JOIN users u ON a.updated_by = u.id
       WHERE a.product_id = $1
       ORDER BY a.updated_at DESC`,
      [id]
    );
    link.history = history;

    return success(res, link);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /superadmin/products/link or PUT /superadmin/products/link/:id
 * Save link configurations
 */
const saveProductLink = async (req, res, next) => {
  try {
    const id = req.params.id || req.body.product_id;
    if (!id) {
      return error(res, 'Product ID is required', 400);
    }

    const {
      public_url,
      partner_url,
      tracking_enabled = true,
      button_text = 'Apply Now',
      redirect_type = 'new_tab',
      utm_source,
      utm_medium,
      utm_campaign,
      priority = 0,
      reason = 'Configuration updated'
    } = req.body;

    // URL validations
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
    if (public_url && !urlRegex.test(public_url)) {
      return error(res, 'Invalid Public URL format', 400);
    }
    if (partner_url && !urlRegex.test(partner_url)) {
      return error(res, 'Invalid Partner URL format', 400);
    }

    // Prevent duplicate URLs (only if configured and not matching this product)
    if (public_url) {
      const { rows: [dupPublic] } = await query(
        `SELECT id, name FROM products WHERE public_url = $1 AND id <> $2`,
        [public_url, id]
      );
      if (dupPublic) {
        return error(res, `Public URL is already assigned to product: ${dupPublic.name}`, 400);
      }
    }
    if (partner_url) {
      const { rows: [dupPartner] } = await query(
        `SELECT id, name FROM products WHERE partner_url = $1 AND id <> $2`,
        [partner_url, id]
      );
      if (dupPartner) {
        return error(res, `Partner URL is already assigned to product: ${dupPartner.name}`, 400);
      }
    }

    // 1. Get original values for audit trail
    const { rows: [oldProduct] } = await query(
      `SELECT public_url, partner_url FROM products WHERE id = $1`,
      [id]
    );

    if (!oldProduct) {
      return error(res, 'Product not found', 404);
    }

    // 2. Perform updates
    const { rows: [updated] } = await query(
      `UPDATE products
       SET public_url = $1,
           partner_url = $2,
           tracking_enabled = $3,
           button_text = $4,
           redirect_type = $5,
           utm_source = $6,
           utm_medium = $7,
           utm_campaign = $8,
           priority = $9,
           last_updated_by = $10,
           last_updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        public_url || null,
        partner_url || null,
        tracking_enabled,
        button_text,
        redirect_type,
        utm_source || null,
        utm_medium || null,
        utm_campaign || null,
        parseInt(priority) || 0,
        req.user.id,
        id
      ]
    );

    // 3. Insert audit log
    let clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
    if (clientIp && clientIp.includes('::ffff:')) {
      clientIp = clientIp.split('::ffff:')[1];
    }

    await query(
      `INSERT INTO product_link_audits (
         product_id, old_url, new_url, updated_by, reason, ip_address
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        oldProduct.public_url || '',
        public_url || '',
        req.user.id,
        reason,
        clientIp
      ]
    );

    return success(res, updated, 'Product link settings saved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /superadmin/products/link/:id
 * Reset product links to null/defaults
 */
const deleteProductLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [oldProduct] } = await query(
      `SELECT public_url, partner_url FROM products WHERE id = $1`,
      [id]
    );

    if (!oldProduct) {
      return error(res, 'Product not found', 404);
    }

    const { rows: [updated] } = await query(
      `UPDATE products
       SET public_url = NULL,
           partner_url = NULL,
           last_updated_by = $1,
           last_updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [req.user.id, id]
    );

    let clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
    if (clientIp && clientIp.includes('::ffff:')) {
      clientIp = clientIp.split('::ffff:')[1];
    }

    await query(
      `INSERT INTO product_link_audits (
         product_id, old_url, new_url, updated_by, reason, ip_address
       ) VALUES ($1, $2, NULL, $3, $4, $5)`,
      [
        id,
        oldProduct.public_url || '',
        req.user.id,
        'Reset/Deleted link configuration',
        clientIp
      ]
    );

    return success(res, updated, 'Product link configurations reset successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /redirect/:productId
 * GET /r/:partnerCode/:productId
 * Perform logging and HTTP redirection
 */
const handleRedirect = async (req, res, next) => {
  try {
    const { productId, partnerCode } = req.params;
    const queryId = req.query.id;
    const queryPartner = req.query.partner;

    const actualProductId = queryId || productId;
    const actualPartnerCode = partnerCode || queryPartner;

    if (!actualProductId) {
      return res.status(400).send('Product ID or identifier is required');
    }

    // 1. Find the product
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actualProductId);
    let productQuery;
    let productParams = [actualProductId];
    if (isUUID) {
      productQuery = `SELECT p.*, b.name as bank_name FROM products p JOIN banks b ON b.id = p.bank_id WHERE p.id = $1`;
    } else {
      const cleanName = actualProductId.replace(/-/g, ' ').trim();
      productQuery = `SELECT p.*, b.name as bank_name FROM products p JOIN banks b ON b.id = p.bank_id WHERE p.name ILIKE $1 OR p.category::text = $1`;
      productParams = [cleanName];
    }

    const { rows: [product] } = await query(productQuery, productParams);
    if (!product) {
      return res.status(404).send('Product not found');
    }

    // 2. Find the partner (if any)
    let partner = null;
    if (actualPartnerCode) {
      const { rows: [p] } = await query(
        `SELECT id, partner_code FROM partner_profiles WHERE partner_code = $1 OR id::text = $1`,
        [actualPartnerCode]
      );
      partner = p;
    }

    // 3. Determine redirect URL
    let targetUrl = (partner && product.partner_url) ? product.partner_url : (product.public_url || product.partner_url);
    if (!targetUrl) {
      // Fallback
      targetUrl = 'https://gharkapaisa.in';
    }

    // 4. Click tracking
    if (product.tracking_enabled) {
      let finalIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress;
      if (finalIp && finalIp.includes('::ffff:')) {
        finalIp = finalIp.split('::ffff:')[1];
      }

      const uaString = req.headers['user-agent'];
      const { device, browser, os } = parseUA(uaString);

      const trackingUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const campaign = req.query.utm_campaign || product.utm_campaign || null;
      const referralSource = req.headers.referer || req.query.referral_source || null;
      const customerMobile = req.query.mobile || null;
      const customerId = req.query.customerId || null; // customer context if provided

      await query(
        `INSERT INTO click_tracking (
          partner_id, product_id, bank_id, customer_id, customer_mobile,
          tracking_url, original_url, ip_address, browser, device,
          operating_system, campaign, referral_source, conversion_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending')`,
        [
          partner ? partner.id : null,
          product.id,
          product.bank_id,
          customerId,
          customerMobile,
          trackingUrl,
          targetUrl,
          finalIp,
          browser,
          device,
          os,
          campaign,
          referralSource
        ]
      ).catch(err => logger.error('Redirect click tracking log failed:', err.message));
    }

    // 5. Append UTM parameters
    const utmSource = req.query.utm_source || product.utm_source || (partner ? `partner_${partner.partner_code || partner.partner_code}` : null);
    const utmMedium = req.query.utm_medium || product.utm_medium || 'affiliate';
    const utmCampaign = req.query.utm_campaign || product.utm_campaign || null;

    try {
      const parsedUrl = new URL(targetUrl);
      if (utmSource) parsedUrl.searchParams.set('utm_source', utmSource);
      if (utmMedium) parsedUrl.searchParams.set('utm_medium', utmMedium);
      if (utmCampaign) parsedUrl.searchParams.set('utm_campaign', utmCampaign);
      if (partner) parsedUrl.searchParams.set('partner_code', partner.partner_code || partner.partner_code);
      targetUrl = parsedUrl.toString();
    } catch (e) {
      // url formatting failed
    }

    return res.redirect(targetUrl);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /products/click
 * Log click manually (non-blocking programmatically)
 */
const logClick = async (req, res, next) => {
  try {
    const {
      product_id,
      partner_id,
      partner_code,
      customer_id,
      customer_mobile,
      campaign,
      referral_source,
      ip_address,
      browser,
      device,
      operating_system,
      location,
      tracking_url,
      original_url
    } = req.body;

    if (!product_id) {
      return error(res, 'product_id is required', 400);
    }

    let finalPartnerId = partner_id;
    if (!finalPartnerId && partner_code) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE partner_code = $1`, [partner_code]);
      if (p) finalPartnerId = p.id;
    }

    const { rows: [product] } = await query(`SELECT bank_id, public_url, partner_url FROM products WHERE id = $1`, [product_id]);
    if (!product) {
      return error(res, 'Product not found', 404);
    }

    const targetUrl = original_url || (finalPartnerId ? product.partner_url : product.public_url);
    const finalIp = ip_address || req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;

    const { rows: [click] } = await query(
      `INSERT INTO click_tracking (
        partner_id, product_id, bank_id, customer_id, customer_mobile,
        tracking_url, original_url, ip_address, browser, device,
        operating_system, campaign, referral_source, location, conversion_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending')
      RETURNING *`,
      [
        finalPartnerId || null,
        product_id,
        product.bank_id,
        customer_id || null,
        customer_mobile || null,
        tracking_url || null,
        targetUrl || null,
        finalIp,
        browser || 'Unknown',
        device || 'Desktop',
        operating_system || 'Unknown',
        campaign || null,
        referral_source || null,
        location || null
      ]
    );

    return success(res, click, 'Click event tracked successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listProductLinks,
  getProductLink,
  saveProductLink,
  deleteProductLink,
  handleRedirect,
  logClick
};
