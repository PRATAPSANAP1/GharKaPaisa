const { query } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Helper to parse device type and browser name from a user agent string.
 */
function parseUserAgent(userAgent) {
  let deviceType = 'desktop';
  let browser = 'unknown';

  if (!userAgent) return { deviceType, browser };

  const ua = userAgent.toLowerCase();

  // Device type detection
  if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad') || ua.includes('playbook') || ua.includes('silk')) {
    deviceType = 'tablet';
  }

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
    browser = 'Internet Explorer';
  }

  return { deviceType, browser };
}

/**
 * Get product application settings by product ID.
 * Returns default configuration if none exists.
 */
async function getSettings(productId) {
  const result = await query(
    `SELECT * FROM product_application_settings WHERE product_id = $1`,
    [productId]
  );
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  // Default fallback
  return {
    product_id: productId,
    application_type: 'internal_form',
    application_url: null,
    provider_name: null,
    open_type: 'same_tab',
    partner_enabled: true,
    customer_enabled: true,
    track_clicks: true,
    status: 'active'
  };
}

/**
 * Create or update product application settings.
 */
async function upsertSettings(productId, payload, userId) {
  const {
    application_type = 'internal_form',
    application_url = null,
    provider_name = null,
    open_type = 'same_tab',
    partner_enabled = true,
    customer_enabled = true,
    track_clicks = true,
    status = 'active'
  } = payload;

  const result = await query(
    `INSERT INTO product_application_settings (
      product_id, application_type, application_url, provider_name, open_type,
      partner_enabled, customer_enabled, track_clicks, status, created_by, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
    ON CONFLICT (product_id) DO UPDATE SET
      application_type = EXCLUDED.application_type,
      application_url = EXCLUDED.application_url,
      provider_name = EXCLUDED.provider_name,
      open_type = EXCLUDED.open_type,
      partner_enabled = EXCLUDED.partner_enabled,
      customer_enabled = EXCLUDED.customer_enabled,
      track_clicks = EXCLUDED.track_clicks,
      status = EXCLUDED.status,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW()
    RETURNING *`,
    [
      productId, application_type, application_url, provider_name, open_type,
      partner_enabled, customer_enabled, track_clicks, status, userId
    ]
  );

  return result.rows[0];
}

/**
 * Revert a product's application settings to default (by removing settings row).
 */
async function deleteSettings(productId) {
  const result = await query(
    `DELETE FROM product_application_settings WHERE product_id = $1 RETURNING *`,
    [productId]
  );
  return result.rows[0];
}

/**
 * Log an application click event (non-blocking).
 */
async function logClick({ productId, partnerId = null, customerId = null, applicationType = 'internal_form', ipAddress, userAgent }) {
  try {
    const { deviceType, browser } = parseUserAgent(userAgent);
    await query(
      `INSERT INTO application_click_logs (
        product_id, partner_id, customer_id, application_type, ip_address, user_agent, device_type, browser
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [productId, partnerId, customerId, applicationType, ipAddress, userAgent, deviceType, browser]
    );
  } catch (err) {
    logger.error('Failed to log application click event:', err.message);
  }
}

/**
 * Get aggregated application click analytics.
 */
async function getClickAnalytics(productId = null) {
  let sql = `
    SELECT 
      c.product_id,
      p.name as product_name,
      p.category,
      c.application_type,
      COUNT(*) as total_clicks,
      COUNT(CASE WHEN c.partner_id IS NOT NULL THEN 1 END) as partner_clicks,
      COUNT(CASE WHEN c.partner_id IS NULL THEN 1 END) as customer_clicks
    FROM application_click_logs c
    JOIN products p ON c.product_id = p.id
  `;
  const params = [];

  if (productId) {
    sql += ` WHERE c.product_id = $1`;
    params.push(productId);
  }

  sql += `
    GROUP BY c.product_id, p.name, p.category, c.application_type
    ORDER BY total_clicks DESC
  `;

  const result = await query(sql, params);
  return result.rows;
}

module.exports = {
  getSettings,
  upsertSettings,
  deleteSettings,
  logClick,
  getClickAnalytics
};
