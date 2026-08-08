const { query } = require('../../config/database');
const { success, created, error, notFound } = require('../../utils/response/response');
const crypto = require('crypto');

/**
 * Partner Share Link Tracking Controller
 * Handles partner referral link generation and customer lead tracking
 */

// Generate a unique tracking token
const generateTrackingToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// POST /partner/share-link - Generate share link for a product
const generateShareLink = async (req, res, next) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return error(res, 'Product ID is required', 400);
    }

    // Get partner profile
    const { rows: [partner] } = await query(
      `SELECT id, partner_code FROM partner_profiles WHERE user_id = $1`,
      [req.user.id]
    );

    if (!partner) {
      return error(res, 'Partner profile not found', 404);
    }

    // Verify product exists
    const { rows: [product] } = await query(
      `SELECT id, name, public_url, partner_url, category FROM products WHERE id = $1`,
      [productId]
    );

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    // Generate tracking token
    const trackingToken = generateTrackingToken();

    // Store in partner_share_links table
    await query(`
      INSERT INTO partner_share_links (partner_id, product_id, tracking_token, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')
    `, [partner.id, productId, trackingToken]);

    // Generate share link URL
    const appUrl = process.env.FRONTEND_URL || 'https://gharkapaisa.in';
    const shareLink = `${appUrl}/share/${trackingToken}`;

    return success(res, {
      tracking_token: trackingToken,
      share_link: shareLink,
      product_id: product.id,
      product_name: product.name,
      partner_code: partner.partner_code
    }, 'Share link generated successfully');
  } catch (err) {
    next(err);
  }
};

// GET /public/share/:trackingToken - Public endpoint to get product details for landing page
const getShareLinkDetails = async (req, res, next) => {
  try {
    const { trackingToken } = req.params;

    // Find lead by tracking token (if already submitted) or get product info from token
    // For now, we'll decode the token to get product and partner info
    // In production, you might want to store this in a separate table
    
    // For this implementation, we'll store the mapping in a temporary table or use the token itself
    // Let's create a simple approach: the token is stored when the link is generated
    
    const { rows: [shareLinkData] } = await query(
      `SELECT product_id, partner_id, created_at FROM partner_share_links WHERE tracking_token = $1 AND expires_at > NOW()`,
      [trackingToken]
    );

    if (!shareLinkData) {
      return error(res, 'Invalid or expired share link', 404);
    }

    // Get product details
    const { rows: [product] } = await query(`
      SELECT p.*, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
      FROM products p
      LEFT JOIN banks b ON b.id = p.bank_id
      WHERE p.id = $1
    `, [shareLinkData.product_id]);

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    // Get partner info (optional - for attribution display)
    const { rows: [partner] } = await query(
      `SELECT partner_code, first_name, last_name FROM partner_profiles WHERE id = $1`,
      [shareLinkData.partner_id]
    );

    return success(res, {
      product,
      partner: partner || null,
      tracking_token: trackingToken
    });
  } catch (err) {
    next(err);
  }
};

// POST /public/share/submit - Public endpoint to submit customer info from landing page
const submitShareLead = async (req, res, next) => {
  try {
    const { trackingToken, customerName, customerMobile } = req.body;

    if (!trackingToken || !customerName || !customerMobile) {
      return error(res, 'Tracking token, customer name, and mobile are required', 400);
    }

    // Get share link details
    const { rows: [shareLinkData] } = await query(
      `SELECT product_id, partner_id FROM partner_share_links WHERE tracking_token = $1 AND expires_at > NOW()`,
      [trackingToken]
    );

    if (!shareLinkData) {
      return error(res, 'Invalid or expired share link', 404);
    }

    // Check if lead already exists for this tracking token
    const { rows: [existingLead] } = await query(
      `SELECT id FROM leads WHERE tracking_token = $1`,
      [trackingToken]
    );

    if (existingLead) {
      // Update existing lead
      const { rows: [updatedLead] } = await query(`
        UPDATE leads 
        SET customer_name = $1, customer_mobile = $2, mobile = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [customerName, customerMobile, existingLead.id]);

      // Get product bank link
      const { rows: [product] } = await query(
        `SELECT public_url, partner_url FROM products WHERE id = $1`,
        [shareLinkData.product_id]
      );

      return success(res, {
        lead_id: updatedLead.id,
        redirect_url: product?.partner_url || product?.public_url || null,
        message: 'Lead updated successfully'
      });
    }

    // Create new lead
    const { rows: [lead] } = await query(`
      INSERT INTO leads (
        partner_id, product_id, customer_name, customer_mobile, mobile,
        tracking_token, source, status, pipeline_stage
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'partner_share', 'pending', 'created')
      RETURNING *
    `, [
      shareLinkData.partner_id,
      shareLinkData.product_id,
      customerName,
      customerMobile,
      customerMobile,
      trackingToken
    ]);

    // Get product bank link for redirect
    const { rows: [product] } = await query(
      `SELECT public_url, partner_url, name FROM products WHERE id = $1`,
      [shareLinkData.product_id]
    );

    return created(res, {
      lead_id: lead.id,
      redirect_url: product?.partner_url || product?.public_url || null,
      product_name: product?.name,
      message: 'Lead created successfully'
    });
  } catch (err) {
    next(err);
  }
};

// GET /partner/share-tracking - Get all tracking leads for the logged-in partner
const getPartnerShareTracking = async (req, res, next) => {
  try {
    const { page, limit, offset } = require('../../utils/helpers/helpers').getPaginationParams(req.query);
    const { status, from_date, to_date } = req.query;

    // Get partner profile
    const { rows: [partner] } = await query(
      `SELECT id FROM partner_profiles WHERE user_id = $1`,
      [req.user.id]
    );

    if (!partner) {
      return error(res, 'Partner profile not found', 404);
    }

    let where = `WHERE l.partner_id = $1 AND l.source = 'partner_share'`;
    const values = [partner.id];
    let idx = 2;

    if (status) {
      where += ` AND l.status = $${idx++}`;
      values.push(status);
    }
    if (from_date) {
      where += ` AND l.created_at >= $${idx++}`;
      values.push(from_date);
    }
    if (to_date) {
      where += ` AND l.created_at <= $${idx++}`;
      values.push(to_date + ' 23:59:59');
    }

    const [countRes, dataRes] = await Promise.all([
      query(`SELECT COUNT(*) FROM leads l ${where}`, values),
      query(`
        SELECT l.*,
               p.name as product_name, p.category,
               b.name as bank_name, b.short_code as bank_code,
               l.tracking_token
        FROM leads l
        LEFT JOIN products p ON p.id = l.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        ${where}
        ORDER BY l.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...values, limit, offset])
    ]);

    const total = parseInt(countRes.rows[0].count);
    return require('../../utils/response/response').paginate(res, dataRes.rows, total, page, limit);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateShareLink,
  getShareLinkDetails,
  submitShareLead,
  getPartnerShareTracking
};
