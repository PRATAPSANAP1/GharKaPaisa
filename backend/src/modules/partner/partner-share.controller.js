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
        `SELECT * FROM products WHERE id = $1`,
        [shareLinkData.product_id]
      );

      const targetRedirectUrl = product?.partner_url || product?.public_url || product?.application_url || product?.apply_url || product?.redirect_url || null;

      return success(res, {
        lead_id: updatedLead.id,
        redirect_url: targetRedirectUrl,
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
      `SELECT * FROM products WHERE id = $1`,
      [shareLinkData.product_id]
    );

    const targetRedirectUrl = product?.partner_url || product?.public_url || product?.application_url || product?.apply_url || product?.redirect_url || null;

    return created(res, {
      lead_id: lead.id,
      redirect_url: targetRedirectUrl,
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

/**
 * GET /public/apply/:token — Step 1: Get safe prefilled data for customer form
 */
const getApplyTokenDetails = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) return error(res, 'Token is required', 400);

    // Find share link or lead by token
    const { rows: [shareData] } = await query(`
      SELECT psl.product_id, psl.partner_id, l.id as lead_id, l.customer_name, l.mobile, l.status, l.pipeline_stage
      FROM partner_share_links psl
      LEFT JOIN leads l ON (l.tracking_token = psl.tracking_token OR l.id::text = psl.tracking_token)
      WHERE (psl.tracking_token = $1 OR l.tracking_token = $1)
        AND psl.expires_at > NOW()
      LIMIT 1
    `, [token]);

    if (!shareData) {
      return error(res, 'Invalid or expired application link', 404);
    }

    // Get Product info
    const { rows: [product] } = await query(`
      SELECT p.id, p.name, p.category, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
      FROM products p
      LEFT JOIN banks b ON b.id = p.bank_id
      WHERE p.id = $1
    `, [shareData.product_id]);

    // Mask customer mobile & extract first name
    const rawName = shareData.customer_name || 'Valued Customer';
    const firstName = rawName.trim().split(' ')[0];
    const rawMobile = shareData.mobile || '';
    const maskedMobile = rawMobile.length >= 10 
      ? `${rawMobile.slice(0, 2)}******${rawMobile.slice(-2)}` 
      : '98******10';

    return success(res, {
      token,
      lead_id: shareData.lead_id || null,
      pipeline_stage: shareData.pipeline_stage || 'created',
      product: {
        id: product?.id,
        name: product?.name || 'Financial Product',
        category: product?.category,
        bank_name: product?.bank_name,
        bank_logo: product?.bank_logo
      },
      customer: {
        first_name: firstName,
        mobile: maskedMobile
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /public/apply/:token — Step 1: Update customer basic KYC fields & redirect to bank
 */
const updateApplyTokenDetails = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { dob, pan, income, address, employment } = req.body;

    if (!token) return error(res, 'Token is required', 400);
    if (!dob || !pan || !income) {
      return error(res, 'DOB, PAN, and Annual Income are required fields', 400);
    }

    // Find share link & lead record
    const { rows: [shareData] } = await query(`
      SELECT psl.product_id, psl.partner_id, l.id as lead_id, l.customer_id, l.status, l.pipeline_stage
      FROM partner_share_links psl
      LEFT JOIN leads l ON (l.tracking_token = psl.tracking_token OR l.id::text = psl.tracking_token)
      WHERE (psl.tracking_token = $1 OR l.tracking_token = $1)
        AND psl.expires_at > NOW()
      LIMIT 1
    `, [token]);

    if (!shareData) {
      return error(res, 'Invalid or expired application link', 404);
    }

    // Fetch Product for target redirect URL
    const { rows: [product] } = await query(`SELECT * FROM products WHERE id = $1`, [shareData.product_id]);
    const targetRedirectUrl = product?.partner_url || product?.public_url || product?.application_url || product?.apply_url || product?.redirect_url || 'https://gharkapaisa.in';

    // Update customer record if exists
    if (shareData.customer_id) {
      await query(`
        UPDATE customers
        SET dob = $1, pan = $2, income = $3, address = $4, employment = $5, updated_at = NOW()
        WHERE id = $6
      `, [dob, pan.toUpperCase().trim(), parseFloat(income), address || null, employment || null, shareData.customer_id]);
    }

    // Update lead stage
    if (shareData.lead_id) {
      await query(`
        UPDATE leads
        SET pipeline_stage = 'details_submitted', status = 'in_progress', updated_at = NOW()
        WHERE id = $1
      `, [shareData.lead_id]);
    }

    return success(res, {
      token,
      lead_id: shareData.lead_id,
      redirect_url: targetRedirectUrl,
      message: 'Application details updated successfully. Redirecting to official bank portal.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /public/apply/:token/post-apply — Step 2: Get bank details for post-application reference entry
 */
const getPostApplyDetails = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) return error(res, 'Token is required', 400);

    const { rows: [shareData] } = await query(`
      SELECT psl.product_id, l.id as lead_id, l.customer_name, l.status
      FROM partner_share_links psl
      LEFT JOIN leads l ON (l.tracking_token = psl.tracking_token OR l.id::text = psl.tracking_token)
      WHERE (psl.tracking_token = $1 OR l.tracking_token = $1)
      LIMIT 1
    `, [token]);

    if (!shareData) return error(res, 'Invalid application token', 404);

    const { rows: [product] } = await query(`
      SELECT p.id, p.name, b.name as bank_name, b.short_code as bank_code
      FROM products p
      LEFT JOIN banks b ON b.id = p.bank_id
      WHERE p.id = $1
    `, [shareData.product_id]);

    const bankCode = (product?.bank_code || '').toUpperCase();
    const bankName = (product?.bank_name || '').toUpperCase();
    const isSbiBank = bankCode === 'SBI' || bankName.includes('SBI') || bankName.includes('STATE BANK');

    return success(res, {
      token,
      lead_id: shareData.lead_id,
      product_name: product?.name || 'Credit Card / Loan',
      bank_name: product?.bank_name || 'Bank',
      is_sbi_bank: isSbiBank,
      requirements: {
        application_number: 'Mandatory for all banks',
        vkyc_url: 'Optional/Recommended',
        salary_slip: isSbiBank ? 'Mandatory for SBI Bank' : 'Optional',
        pan_card: isSbiBank ? 'Mandatory for SBI Bank' : 'Optional'
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /public/apply/:token/post-apply — Step 2: Submit Application Number, VKYC & Document links
 */
const updatePostApplyDetails = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { bank_application_number, vkyc_url, salary_slip_url, pan_card_url } = req.body;

    if (!token) return error(res, 'Token is required', 400);
    if (!bank_application_number || !bank_application_number.trim()) {
      return error(res, 'Bank Application Number is required', 400);
    }

    const { rows: [shareData] } = await query(`
      SELECT psl.product_id, l.id as lead_id, l.customer_id
      FROM partner_share_links psl
      LEFT JOIN leads l ON (l.tracking_token = psl.tracking_token OR l.id::text = psl.tracking_token)
      WHERE (psl.tracking_token = $1 OR l.tracking_token = $1)
      LIMIT 1
    `, [token]);

    if (!shareData) return error(res, 'Invalid application token', 404);

    // Verify bank type for mandatory document rules
    const { rows: [product] } = await query(`
      SELECT p.id, b.name as bank_name, b.short_code as bank_code
      FROM products p
      LEFT JOIN banks b ON b.id = p.bank_id
      WHERE p.id = $1
    `, [shareData.product_id]);

    const bankCode = (product?.bank_code || '').toUpperCase();
    const bankName = (product?.bank_name || '').toUpperCase();
    const isSbiBank = bankCode === 'SBI' || bankName.includes('SBI') || bankName.includes('STATE BANK');

    if (isSbiBank) {
      if (!salary_slip_url || !salary_slip_url.trim()) {
        return error(res, 'Salary Slip is required for SBI Bank applications', 400);
      }
      if (!pan_card_url || !pan_card_url.trim()) {
        return error(res, 'PAN Card Document is required for SBI Bank applications', 400);
      }
    }

    // Update existing application or create/update application reference
    if (shareData.lead_id) {
      await query(`
        UPDATE leads
        SET status = 'submitted', pipeline_stage = 'submitted', updated_at = NOW()
        WHERE id = $1
      `, [shareData.lead_id]);

      await query(`
        UPDATE applications
        SET bank_application_number = $1, vkyc_url = $2, salary_slip_url = $3, pan_card_url = $4, status = 'submitted', updated_at = NOW()
        WHERE lead_id = $5
      `, [bank_application_number.trim(), vkyc_url || null, salary_slip_url || null, pan_card_url || null, shareData.lead_id]);
    }

    return success(res, {
      token,
      bank_application_number: bank_application_number.trim(),
      message: 'Bank application reference and documents recorded successfully.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateShareLink,
  getShareLinkDetails,
  submitShareLead,
  getPartnerShareTracking,
  getApplyTokenDetails,
  updateApplyTokenDetails,
  getPostApplyDetails,
  updatePostApplyDetails
};

