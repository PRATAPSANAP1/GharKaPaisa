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
    let productId = req.body.productId || req.body.product_id;
    let applicationId = req.body.application_id || req.body.applicationId || null;
    let leadId = req.body.lead_id || req.body.leadId || null;
    let partnerId = null;
    let partnerCode = null;

    if (!productId && applicationId) {
      const { rows: [app] } = await query(`SELECT product_id, partner_id FROM applications WHERE id = $1`, [applicationId]);
      if (app) {
        productId = app.product_id;
        partnerId = app.partner_id;
      } else {
        const { rows: [lead] } = await query(`SELECT product_id, partner_id FROM leads WHERE id = $1`, [applicationId]);
        if (lead) {
          productId = lead.product_id;
          if (!partnerId) partnerId = lead.partner_id;
          leadId = lead.id;
          applicationId = null;
        }
      }
    }

    if (!productId && leadId) {
      const { rows: [lead] } = await query(`SELECT product_id, partner_id FROM leads WHERE id = $1`, [leadId]);
      if (lead) {
        productId = lead.product_id;
        if (!partnerId) partnerId = lead.partner_id;
      }
    }

    if (!productId) {
      return error(res, 'Product ID is required', 400);
    }

    // Get partner profile if not resolved
    if (!partnerId && req.user) {
      const { rows: [partner] } = await query(
        `SELECT id, partner_code FROM partner_profiles WHERE user_id = $1`,
        [req.user.id]
      );
      if (partner) {
        partnerId = partner.id;
        partnerCode = partner.partner_code;
      }
    }

    if (!partnerId) {
      const { rows: [p] } = await query(`SELECT id, partner_code FROM partner_profiles LIMIT 1`);
      if (p) {
        partnerId = p.id;
        partnerCode = p.partner_code;
      }
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
      INSERT INTO partner_share_links (partner_id, product_id, tracking_token, application_id, lead_id, expires_at)
      VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days')
    `, [partnerId, productId, trackingToken, applicationId, leadId]);

    // Generate share link URL
    const appUrl = process.env.FRONTEND_URL || 'https://gharkapaisa.in';
    const shareLink = `${appUrl}/share/${trackingToken}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Apply for ${product.name} directly using your official application link:\n${shareLink}`)}`;

    return success(res, {
      tracking_token: trackingToken,
      share_link: shareLink,
      share_url: shareLink,
      whatsapp_url: whatsappUrl,
      product_id: product.id,
      product_name: product.name,
      application_id: applicationId,
      lead_id: leadId,
      partner_code: partnerCode || 'PARTNER'
    }, 'Share link generated successfully');
  } catch (err) {
    next(err);
  }
};

// GET /public/share/:trackingToken - Public endpoint to get product details for landing page
const getShareLinkDetails = async (req, res, next) => {
  try {
    const { trackingToken } = req.params;

    const { rows: [shareLinkData] } = await query(
      `SELECT product_id, partner_id, application_id, lead_id, created_at FROM partner_share_links WHERE tracking_token = $1 AND expires_at > NOW()`,
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

    let existingApplication = null;
    if (shareLinkData.application_id) {
      const { rows: [app] } = await query(`
        SELECT a.id, a.app_number, a.bank_application_number, a.vkyc_status, a.vkyc_url, a.monthly_salary, a.pan_number, a.notes,
               c.full_name as customer_name, c.mobile as customer_mobile, c.email as customer_email
        FROM applications a
        JOIN customers c ON c.id = a.customer_id
        WHERE a.id = $1
      `, [shareLinkData.application_id]);
      if (app) existingApplication = app;
    } else if (shareLinkData.lead_id) {
      const { rows: [lead] } = await query(`
        SELECT l.id, l.lead_number as app_number, l.customer_name, l.mobile as customer_mobile,
               c.monthly_income as monthly_salary, c.pan_number
        FROM leads l
        LEFT JOIN customers c ON (c.id = l.customer_id OR c.mobile = l.mobile)
        WHERE l.id = $1
      `, [shareLinkData.lead_id]);
      if (lead) existingApplication = lead;
    }

    return success(res, {
      product,
      partner: partner || null,
      tracking_token: trackingToken,
      has_application: !!(shareLinkData.application_id || shareLinkData.lead_id),
      application_id: shareLinkData.application_id || null,
      lead_id: shareLinkData.lead_id || null,
      existing_application: existingApplication
    });
  } catch (err) {
    next(err);
  }
};

// POST /public/share/submit - Public endpoint to submit customer info from landing page
const submitShareLead = async (req, res, next) => {
  try {
    const {
      trackingToken, customerName, customerMobile,
      panNumber, monthlyIncome, bankAppNumber, vkycStatus, vkycUrl, remarks
    } = req.body;

    if (!trackingToken || !customerName || !customerMobile) {
      return error(res, 'Tracking token, customer name, and mobile are required', 400);
    }

    // Get share link details
    const { rows: [shareLinkData] } = await query(
      `SELECT product_id, partner_id, application_id, lead_id FROM partner_share_links WHERE tracking_token = $1 AND expires_at > NOW()`,
      [trackingToken]
    );

    if (!shareLinkData) {
      return error(res, 'Invalid or expired share link', 404);
    }

    // Get partner user_id for customer record creation
    const { rows: [partnerUser] } = await query(
      `SELECT user_id FROM partner_profiles WHERE id = $1`,
      [shareLinkData.partner_id]
    );
    const partnerUserId = partnerUser?.user_id || null;

    const cleanMobile = customerMobile.replace(/\D/g, '').slice(-10);
    const numIncome = monthlyIncome ? Number(monthlyIncome) : null;
    const cleanPan = panNumber ? panNumber.trim().toUpperCase() : null;

    // Upsert customer in customers table so they appear under Partner CRM / Customers panel
    let customerId = null;
    try {
      const { rows: [existingCust] } = await query(
        `SELECT id FROM customers WHERE mobile = $1 LIMIT 1`,
        [cleanMobile]
      );

      if (existingCust) {
        customerId = existingCust.id;
        await query(
          `UPDATE customers
           SET full_name = COALESCE(NULLIF(full_name, ''), $1),
               pan_number = COALESCE(NULLIF($2, ''), pan_number),
               monthly_income = COALESCE($3, monthly_income),
               updated_at = NOW()
           WHERE id = $4`,
          [customerName.trim(), cleanPan, numIncome, customerId]
        );
      } else {
        const { rows: [newCust] } = await query(
          `INSERT INTO customers (full_name, mobile, pan_number, monthly_income, created_by)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [customerName.trim(), cleanMobile, cleanPan, numIncome, partnerUserId]
        );
        customerId = newCust?.id || null;
      }
    } catch (custErr) {
      console.warn('Customer record creation fallback:', custErr.message);
    }

    // If an application_id was attached to this share link, update that specific application record!
    if (shareLinkData.application_id) {
      await query(`
        UPDATE applications
        SET 
          bank_application_number = COALESCE(NULLIF($1, ''), bank_application_number),
          bank_ref_number = COALESCE(NULLIF($1, ''), bank_ref_number),
          vkyc_status = COALESCE(NULLIF($2, ''), vkyc_status),
          monthly_salary = COALESCE($3, monthly_salary),
          vkyc_url = COALESCE(NULLIF($4, ''), vkyc_url),
          pan_number = COALESCE(NULLIF($5, ''), pan_number),
          notes = COALESCE(NULLIF($6, ''), notes),
          updated_at = NOW()
        WHERE id = $7
      `, [
        bankAppNumber?.trim() || null,
        vkycStatus?.trim() || null,
        numIncome,
        vkycUrl?.trim() || null,
        cleanPan,
        remarks?.trim() || null,
        shareLinkData.application_id
      ]);
    }

    // Check if lead already exists for this tracking token OR active (product_id, mobile) pair
    const { rows: [existingLead] } = await query(
      `SELECT id FROM leads 
       WHERE (tracking_token = $1 OR id = $4 OR (product_id = $2 AND (mobile = $3 OR customer_mobile = $3)))
         AND status NOT IN ('rejected', 'cancelled')
       ORDER BY created_at DESC LIMIT 1`,
      [trackingToken, shareLinkData.product_id, cleanMobile, shareLinkData.lead_id || null]
    );

    if (existingLead) {
      // Update existing lead
      const { rows: [updatedLead] } = await query(`
        UPDATE leads 
        SET customer_name = $1, customer_mobile = $2, mobile = $2, tracking_token = $3,
            customer_id = COALESCE($5, customer_id),
            updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [customerName.trim(), cleanMobile, trackingToken, existingLead.id, customerId]);

      // Get product bank link
      const { rows: [product] } = await query(
        `SELECT * FROM products WHERE id = $1`,
        [shareLinkData.product_id]
      );

      const targetRedirectUrl = product?.partner_url || product?.public_url || product?.application_url || product?.apply_url || product?.redirect_url || null;

      return success(res, {
        lead_id: updatedLead.id,
        application_id: shareLinkData.application_id || null,
        redirect_url: targetRedirectUrl,
        message: 'Application details submitted and saved successfully'
      });
    }

    // Create new lead with fallback if race condition triggers 23505
    let lead;
    try {
      const { rows } = await query(`
        INSERT INTO leads (
          partner_id, product_id, customer_name, customer_mobile, mobile,
          tracking_token, source, status, pipeline_stage, customer_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'partner_share', 'under_review', 'created', $7)
        RETURNING *
      `, [
        shareLinkData.partner_id,
        shareLinkData.product_id,
        customerName.trim(),
        cleanMobile,
        cleanMobile,
        trackingToken,
        customerId
      ]);
      lead = rows[0];
    } catch (insertErr) {
      if (insertErr.code === '23505') {
        const { rows: [fallbackLead] } = await query(`
          UPDATE leads
          SET customer_name = $1, tracking_token = $2, customer_id = COALESCE($5, customer_id),
              updated_at = NOW()
          WHERE product_id = $3 AND (mobile = $4 OR customer_mobile = $4) AND status NOT IN ('rejected', 'cancelled')
          RETURNING *
        `, [customerName.trim(), trackingToken, shareLinkData.product_id, cleanMobile, customerId]);

        if (fallbackLead) {
          lead = fallbackLead;
        } else {
          throw insertErr;
        }
      } else {
        throw insertErr;
      }
    }

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

    // Update customer record if exists or resolved via lead
    let targetCustomerId = shareData.customer_id;
    if (!targetCustomerId && shareData.lead_id) {
      const { rows: [leadRec] } = await query(`SELECT customer_id, mobile FROM leads WHERE id = $1`, [shareData.lead_id]);
      if (leadRec?.customer_id) {
        targetCustomerId = leadRec.customer_id;
      } else if (leadRec?.mobile) {
        const { rows: [custRec] } = await query(`SELECT id FROM customers WHERE mobile = $1 LIMIT 1`, [leadRec.mobile]);
        targetCustomerId = custRec?.id || null;
      }
    }

    if (targetCustomerId) {
      await query(`
        UPDATE customers
        SET dob = $1, pan_number = $2, monthly_income = $3, address = $4, employment_type = $5, updated_at = NOW()
        WHERE id = $6
      `, [dob, pan.toUpperCase().trim(), parseFloat(income), address || null, employment || null, targetCustomerId]);
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

