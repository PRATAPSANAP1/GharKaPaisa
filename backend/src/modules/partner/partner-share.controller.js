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
    const shareLink = `${appUrl}/apply/${trackingToken}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Apply for ${product.name} directly using your official application link:\n${shareLink}`)}`;

    const targetMobile = req.body.customer_mobile || req.body.mobile;
    const targetName = req.body.customer_name || req.body.full_name || 'Customer';
    if (targetMobile) {
      const { sendApplyStep1Sms } = require('../../services/sms/sms.service');
      sendApplyStep1Sms(targetMobile, targetName, product.name, shareLink).catch(() => {});
    }

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

/**
 * Helper to resolve share token across partner_share_links, leads, applications, click_tracking, and products tables
 */
const resolveShareToken = async (token) => {
  if (!token) return null;

  const cleanToken = String(token).trim();

  // 1. Check partner_share_links (exact match or prefix match)
  const { rows: [linkRes] } = await query(
    `SELECT product_id, partner_id, application_id, lead_id, created_at 
     FROM partner_share_links 
     WHERE tracking_token = $1 OR tracking_token ILIKE $2
     ORDER BY created_at DESC LIMIT 1`,
    [cleanToken, `${cleanToken}%`]
  );
  if (linkRes) return linkRes;

  // 2. Check leads table by tracking_token, lead_number, or ID
  const { rows: [leadRes] } = await query(
    `SELECT product_id, partner_id, customer_id, id as lead_id, created_at 
     FROM leads 
     WHERE tracking_token = $1 OR tracking_token ILIKE $2 OR lead_number = $1 OR id::text = $1 
     ORDER BY created_at DESC LIMIT 1`,
    [cleanToken, `${cleanToken}%`]
  );
  if (leadRes) {
    return {
      product_id: leadRes.product_id,
      partner_id: leadRes.partner_id,
      application_id: null,
      lead_id: leadRes.lead_id,
      created_at: leadRes.created_at
    };
  }

  // 3. Check applications table by app_number or ID
  const { rows: [appRes] } = await query(
    `SELECT product_id, partner_id, id as application_id, lead_id, created_at 
     FROM applications 
     WHERE app_number = $1 OR id::text = $1 
     ORDER BY created_at DESC LIMIT 1`,
    [cleanToken]
  );
  if (appRes) {
    return {
      product_id: appRes.product_id,
      partner_id: appRes.partner_id,
      application_id: appRes.application_id,
      lead_id: appRes.lead_id,
      created_at: appRes.created_at
    };
  }

  // 4. Check click_tracking table safely
  try {
    const { rows: [clickRes] } = await query(
      `SELECT product_id, partner_id 
       FROM click_tracking 
       WHERE tracking_url ILIKE $1 OR original_url ILIKE $1 
       LIMIT 1`,
      [`%${cleanToken}%`]
    );
    if (clickRes && clickRes.product_id) {
      return {
        product_id: clickRes.product_id,
        partner_id: clickRes.partner_id,
        application_id: null,
        lead_id: null,
        created_at: new Date()
      };
    }
  } catch (clickErr) {
    // Non-blocking fallback if click_tracking has different columns
  }

  // 5. Check products table by ID, slug, or name
  const { rows: [prodRes] } = await query(
    `SELECT id as product_id FROM products 
     WHERE id::text = $1 OR slug ILIKE $2 OR name ILIKE $2 
     ORDER BY is_active DESC, created_at DESC LIMIT 1`,
    [cleanToken, `%${cleanToken.replace(/-/g, ' ')}%`]
  );
  if (prodRes) {
    const { rows: [pProfile] } = await query(`SELECT id FROM partner_profiles LIMIT 1`);
    return {
      product_id: prodRes.product_id,
      partner_id: pProfile?.id || null,
      application_id: null,
      lead_id: null,
      created_at: new Date()
    };
  }

  // 6. Fallback: Default to latest active product so user never hits an expired dead end
  const { rows: [fallbackProd] } = await query(
    `SELECT id as product_id FROM products WHERE is_active = true ORDER BY created_at DESC LIMIT 1`
  );
  if (fallbackProd) {
    const { rows: [pProfile] } = await query(`SELECT id FROM partner_profiles LIMIT 1`);
    return {
      product_id: fallbackProd.product_id,
      partner_id: pProfile?.id || null,
      application_id: null,
      lead_id: null,
      created_at: new Date()
    };
  }

  return null;
};

// GET /public/share/:trackingToken - Public endpoint to get product details for landing page
const getShareLinkDetails = async (req, res, next) => {
  try {
    const { trackingToken } = req.params;

    const shareLinkData = await resolveShareToken(trackingToken);

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
    let partner = null;
    if (shareLinkData.partner_id) {
      const { rows: [p] } = await query(
        `SELECT partner_code, first_name, last_name FROM partner_profiles WHERE id = $1`,
        [shareLinkData.partner_id]
      );
      partner = p || null;
    }

    let existingApplication = null;
    if (shareLinkData.application_id) {
      const { rows: [app] } = await query(`
        SELECT a.id, a.app_number, a.bank_application_number, a.vkyc_status, a.vkyc_url, a.monthly_salary, a.pan_number,
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
    const shareLinkData = await resolveShareToken(trackingToken);

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
 * GET /public/apply/:token — Step 1: Get product details and prefilled customer data
 */
const getApplyTokenDetails = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) return error(res, 'Token is required', 400);

    // Find share link or lead by token
    const shareData = await resolveShareToken(token);

    if (!shareData) {
      return error(res, 'Invalid or expired application link', 404);
    }

    // Get Product info with all details for Product Details tab
    const { rows: [product] } = await query(`
      SELECT p.*, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
      FROM products p
      LEFT JOIN banks b ON b.id = p.bank_id
      WHERE p.id = $1
    `, [shareData.product_id]);

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    // Resolve prefilled customer data
    let custRecord = null;
    let leadRec = null;

    if (shareData.lead_id) {
      const { rows: [l] } = await query(`SELECT * FROM leads WHERE id = $1`, [shareData.lead_id]);
      leadRec = l || null;
    }

    if (shareData.application_id && !leadRec) {
      const { rows: [a] } = await query(`SELECT * FROM applications WHERE id = $1`, [shareData.application_id]);
      if (a && a.customer_id) {
        const { rows: [c] } = await query(`SELECT * FROM customers WHERE id = $1`, [a.customer_id]);
        custRecord = c || null;
      }
    }

    if (!custRecord && leadRec) {
      if (leadRec.customer_id) {
        const { rows: [c] } = await query(`SELECT * FROM customers WHERE id = $1`, [leadRec.customer_id]);
        custRecord = c || null;
      } else if (leadRec.mobile) {
        const { rows: [c] } = await query(`SELECT * FROM customers WHERE mobile = $1 LIMIT 1`, [leadRec.mobile]);
        custRecord = c || null;
      }
    }

    const fullName = custRecord?.full_name || leadRec?.customer_name || shareData.customer_name || 'Valued Customer';
    const mobile = custRecord?.mobile || leadRec?.mobile || leadRec?.customer_mobile || shareData.mobile || '';
    const firstName = fullName.trim().split(' ')[0];

    return success(res, {
      token,
      lead_id: shareData.lead_id || null,
      application_id: shareData.application_id || null,
      product_id: product.id,
      pipeline_stage: leadRec?.pipeline_stage || shareData.pipeline_stage || 'created',
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
        sub_category: product.sub_category,
        bank_name: product.bank_name,
        bank_code: product.bank_code,
        bank_logo: product.bank_logo,
        annual_fee: product.annual_fee,
        description: product.description,
        short_description: product.short_description,
        features: Array.isArray(product.features) ? product.features : (typeof product.features === 'string' ? JSON.parse(product.features || '[]') : []),
        eligibility: typeof product.eligibility === 'string' ? JSON.parse(product.eligibility || '{}') : (product.eligibility || {}),
        eligibility_criteria: product.eligibility_criteria,
        benefits: product.benefits,
        fees_charges: product.fees_charges,
        rewards: product.rewards,
        cashback: product.cashback,
        card_variant: product.card_variant,
        card_network: product.card_network,
        welcome_benefits: product.welcome_benefits,
        is_lifetime_free: product.is_lifetime_free,
        image_url: product.image_url,
        apply_button_text: product.apply_button_text || 'Apply Now',
        partner_url: product.partner_url || product.application_url || product.public_url || product.apply_url || product.redirect_url || '',
        application_url: product.application_url || product.partner_url || product.public_url || product.apply_url || product.redirect_url || '',
        public_url: product.public_url || product.partner_url || product.application_url || product.apply_url || product.redirect_url || '',
        apply_url: product.apply_url || product.partner_url || product.application_url || product.public_url || product.redirect_url || '',
        redirect_url: product.redirect_url || product.partner_url || product.application_url || product.public_url || product.apply_url || ''
      },
      customer: {
        full_name: fullName,
        first_name: firstName,
        mobile: mobile,
        email: custRecord?.email || '',
        dob: custRecord?.dob ? new Date(custRecord.dob).toISOString().split('T')[0] : '',
        pan_number: custRecord?.pan_number || '',
        aadhaar_number: custRecord?.aadhaar_number || custRecord?.aadhaar_last4 || '',
        occupation: custRecord?.occupation || custRecord?.employment_type || 'Salaried',
        employment_type: custRecord?.employment_type || 'Salaried',
        monthly_income: custRecord?.monthly_income || '',
        employer: custRecord?.employer || '',
        city: custRecord?.city || leadRec?.city || '',
        state: custRecord?.state || '',
        pincode: custRecord?.pincode || ''
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /public/apply/:token — Step 1: Submit Customer Form & update customer details in DB
 */
const updateApplyTokenDetails = async (req, res, next) => {
  try {
    const { token } = req.params;
    const {
      full_name, customer_name, name,
      mobile, customer_mobile,
      email, dob, occupation, employment, employment_type, income, monthly_income,
      employer, company_name, pan, pan_number, aadhaar_number, aadhaar,
      city, state, pincode, address
    } = req.body;

    if (!token) return error(res, 'Token is required', 400);

    const shareData = await resolveShareToken(token);
    if (!shareData) {
      return error(res, 'Invalid or expired application link', 404);
    }

    const cleanName = (full_name || customer_name || name || '').toString().trim();
    const cleanMobile = (mobile || customer_mobile || '').toString().replace(/\D/g, '').slice(-10);
    const cleanPan = (pan_number || pan || '').toString().trim().toUpperCase();
    const cleanEmail = (email || '').toString().trim().toLowerCase();
    const rawAadhaar = (aadhaar_number || aadhaar || '').toString().replace(/\D/g, '');
    const cleanAadhaar = rawAadhaar || null;
    const cleanAadhaarLast4 = rawAadhaar.length >= 4 ? rawAadhaar.slice(-4) : null;
    const cleanOccupation = (occupation || employment || employment_type || 'Salaried').toString().trim();
    const cleanEmployer = (employer || company_name || '').toString().trim();

    const rawInc = (monthly_income !== undefined && monthly_income !== null && monthly_income !== '')
      ? monthly_income
      : (income !== undefined && income !== null && income !== '' ? income : null);
    let numIncome = null;
    if (rawInc !== null && rawInc !== undefined) {
      const cleanedInc = rawInc.toString().replace(/[^0-9.]/g, '');
      if (cleanedInc) {
        const parsed = parseFloat(cleanedInc);
        if (!isNaN(parsed)) numIncome = parsed;
      }
    }

    const cleanCity = (city || '').toString().trim();
    const cleanState = (state || '').toString().trim();
    const cleanPincode = (pincode || '').toString().replace(/\D/g, '').slice(0, 6);

    // Ensure columns exist on customers table dynamically
    try {
      await query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20)`);
      await query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS occupation VARCHAR(100)`);
      await query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS city VARCHAR(100)`);
      await query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS state VARCHAR(100)`);
      await query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)`);
      await query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(15,2)`);
    } catch (_) {}

    // Fetch Product for target redirect URL
    const { rows: [product] } = await query(`SELECT * FROM products WHERE id = $1`, [shareData.product_id]);
    const targetRedirectUrl = product?.partner_url || product?.public_url || product?.application_url || product?.apply_url || product?.redirect_url || 'https://gharkapaisa.in';

    // Find customer ID to update
    let targetCustomerId = shareData.customer_id;
    let targetLeadId = shareData.lead_id;

    if (!targetCustomerId && targetLeadId) {
      const { rows: [leadRec] } = await query(`SELECT customer_id, mobile, customer_name FROM leads WHERE id = $1`, [targetLeadId]);
      if (leadRec?.customer_id) {
        targetCustomerId = leadRec.customer_id;
      } else if (leadRec?.mobile || cleanMobile) {
        const checkMobile = cleanMobile || leadRec?.mobile;
        const { rows: [custRec] } = await query(`SELECT id FROM customers WHERE mobile = $1 LIMIT 1`, [checkMobile]);
        if (custRec) {
          targetCustomerId = custRec.id;
        }
      }
    }

    if (!targetCustomerId && cleanMobile) {
      const { rows: [custRec] } = await query(`SELECT id FROM customers WHERE mobile = $1 LIMIT 1`, [cleanMobile]);
      if (custRec) {
        targetCustomerId = custRec.id;
      }
    }

    // Resolve Partner User ID for created_by attribution
    let partnerUserId = null;
    if (shareData.partner_id) {
      const { rows: [pUser] } = await query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [shareData.partner_id]);
      partnerUserId = pUser?.user_id || null;
    }
    if (!partnerUserId) {
      const { rows: [adminUser] } = await query(`SELECT id FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN') ORDER BY created_at ASC LIMIT 1`);
      partnerUserId = adminUser?.id || null;
    }

    // Create or Update customer record in customers table with exact 1-to-1 parameter alignment ($1..$14)
    if (targetCustomerId) {
      await query(`
        UPDATE customers
        SET 
          full_name = COALESCE(NULLIF($1, ''), full_name),
          email = COALESCE(NULLIF($2, ''), email),
          dob = COALESCE(NULLIF($3, '')::date, dob),
          pan_number = COALESCE(NULLIF($4, ''), pan_number),
          aadhaar_number = COALESCE(NULLIF($5, ''), aadhaar_number),
          aadhaar_last4 = COALESCE(NULLIF($6, ''), aadhaar_last4),
          employment_type = COALESCE(NULLIF($7, ''), employment_type),
          occupation = COALESCE(NULLIF($8, ''), occupation),
          monthly_income = COALESCE($9, monthly_income),
          employer = COALESCE(NULLIF($10, ''), employer),
          city = COALESCE(NULLIF($11, ''), city),
          state = COALESCE(NULLIF($12, ''), state),
          pincode = COALESCE(NULLIF($13, ''), pincode),
          updated_at = NOW()
        WHERE id = $14
      `, [
        cleanName,
        cleanEmail,
        dob || null,
        cleanPan,
        cleanAadhaar,
        cleanAadhaarLast4,
        cleanOccupation,
        cleanOccupation,
        numIncome,
        cleanEmployer,
        cleanCity,
        cleanState,
        cleanPincode,
        targetCustomerId
      ]);
    } else if (cleanMobile) {
      const finalName = cleanName || 'Customer';
      const { rows: [newCust] } = await query(`
        INSERT INTO customers (
          full_name, mobile, email, dob, pan_number, aadhaar_number, aadhaar_last4,
          employment_type, occupation, monthly_income, employer, city, state, pincode, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `, [
        finalName, cleanMobile, cleanEmail || null, dob || null, cleanPan || null,
        cleanAadhaar, cleanAadhaarLast4, cleanOccupation, cleanOccupation,
        numIncome, cleanEmployer || null, cleanCity || null, cleanState || null, cleanPincode || null,
        partnerUserId
      ]);
      targetCustomerId = newCust?.id || null;
    }

    // Update lead record stage
    if (targetLeadId) {
      await query(`
        UPDATE leads
        SET pipeline_stage = 'details_submitted', status = 'in_progress',
            customer_id = COALESCE($2, customer_id),
            customer_name = COALESCE(NULLIF($3, ''), customer_name),
            city = COALESCE(NULLIF($4, ''), city),
            pan_number = COALESCE(NULLIF($5, ''), pan_number),
            updated_at = NOW()
        WHERE id = $1
      `, [targetLeadId, targetCustomerId, cleanName, cleanCity, cleanPan]);
    }

    // Update application record if exists
    if (shareData.application_id) {
      await query(`
        UPDATE applications
        SET status = 'details_submitted',
            customer_id = COALESCE($1, customer_id),
            pan_number = COALESCE(NULLIF($2, ''), pan_number),
            monthly_salary = COALESCE($3, monthly_salary),
            updated_at = NOW()
        WHERE id = $4
      `, [targetCustomerId, cleanPan, numIncome, shareData.application_id]);
    }

    const host = req.get('host') || 'gharkapaisa.in';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;
    const qdFormUrl = `${baseUrl.replace(/\/$/, '')}/apply/${token}/post-apply`;

    // Automatically schedule QD Form link SMS dispatch after 10 minutes for linked_share process
    if (targetLeadId) {
      setTimeout(async () => {
        try {
          const { rows: [targetLead] } = await query(`
            SELECT l.customer_name, l.mobile, p.name as product_name
            FROM leads l
            LEFT JOIN products p ON p.id = l.product_id
            WHERE l.id = $1
          `, [targetLeadId]);

          if (targetLead && targetLead.mobile) {
            const { sendPostApplyStep2Sms } = require('../../services/sms/sms.service');
            await sendPostApplyStep2Sms(targetLead.mobile, targetLead.customer_name, targetLead.product_name, token);
            console.log(`[QD-FORM-SMS] Automatically dispatched QD Form SMS link after 10 mins to ${targetLead.mobile}`);
          }
        } catch (timerErr) {
          console.warn('[QD-FORM-SMS] Delayed SMS timer error:', timerErr.message);
        }
      }, 10 * 60 * 1000); // 10 minutes delay
    }

    return success(res, {
      token,
      lead_id: targetLeadId,
      customer_id: targetCustomerId,
      redirect_url: targetRedirectUrl,
      qd_form_url: qdFormUrl,
      message: 'Application details saved. QD Form link scheduled for SMS dispatch in 10 minutes.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /public/apply/:token/post-apply — Step 2: Get bank details & customer metadata for QD Form
 */
const getPostApplyDetails = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) return error(res, 'Token is required', 400);

    const { rows: [shareData] } = await query(`
      SELECT 
        COALESCE(psl.product_id, a.product_id, l.product_id) as product_id,
        COALESCE(psl.partner_id, a.partner_id, l.partner_id) as partner_id,
        COALESCE(a.customer_id, l.customer_id) as customer_id,
        COALESCE(l.id, a.lead_id) as lead_id,
        a.id as application_id,
        COALESCE(l.customer_name, c.full_name) as customer_name,
        COALESCE(l.mobile, c.mobile) as mobile,
        a.dob, a.customer_email, a.pan_number, a.company_name, a.designation, a.address, a.mother_name,
        a.soft_approval_status, a.vkyc_stage, a.iqa_stage, a.dispatch_status,
        a.bank_application_number, a.vkyc_url, a.final_status, a.decline_reason, a.eligible_reqd,
        l.status
      FROM (SELECT $1::text as tok) t
      LEFT JOIN partner_share_links psl ON (psl.tracking_token = t.tok)
      LEFT JOIN applications a ON (a.tracking_token = t.tok OR a.id::text = t.tok OR a.app_number = t.tok)
      LEFT JOIN leads l ON (l.tracking_token = t.tok OR l.id::text = t.tok OR l.lead_number = t.tok OR l.id = a.lead_id OR l.id = psl.lead_id)
      LEFT JOIN customers c ON (c.id = COALESCE(a.customer_id, l.customer_id))
      WHERE psl.id IS NOT NULL OR a.id IS NOT NULL OR l.id IS NOT NULL
      LIMIT 1
    `, [token]);

    if (!shareData || !shareData.product_id) return error(res, 'Invalid application token', 404);

    const { rows: [product] } = await query(`
      SELECT p.id, p.name, p.category, b.name as bank_name, b.short_code as bank_code, b.logo_url as bank_logo
      FROM products p
      LEFT JOIN banks b ON b.id = p.bank_id
      WHERE p.id = $1
    `, [shareData.product_id]);

    let custRecord = null;
    if (shareData.customer_id) {
      const { rows: [c] } = await query(`SELECT full_name, mobile, email, pan_number FROM customers WHERE id = $1`, [shareData.customer_id]);
      custRecord = c || null;
    } else if (shareData.mobile) {
      const { rows: [c] } = await query(`SELECT full_name, mobile, email, pan_number FROM customers WHERE mobile = $1 LIMIT 1`, [shareData.mobile]);
      custRecord = c || null;
    }

    const bankCode = (product?.bank_code || '').toUpperCase();
    const bankName = (product?.bank_name || '').toUpperCase();
    const isSbiBank = bankCode === 'SBI' || bankName.includes('SBI') || bankName.includes('STATE BANK');

    return success(res, {
      token,
      lead_id: shareData.lead_id || null,
      application_id: shareData.application_id || null,
      product_id: product?.id,
      product_name: product?.name || 'Credit Card / Loan',
      bank_name: product?.bank_name || 'Bank',
      bank_logo: product?.bank_logo || null,
      is_sbi_bank: isSbiBank,
      customer: {
        full_name: custRecord?.full_name || shareData.customer_name || 'Customer',
        mobile: custRecord?.mobile || shareData.mobile || '',
        email: custRecord?.email || '',
        pan_number: custRecord?.pan_number || ''
      },
      application_details: {
        customer_mobile: shareData?.mobile || custRecord?.mobile || '',
        customer_name: shareData?.customer_name || custRecord?.full_name || '',
        dob: shareData?.dob || '',
        customer_email: shareData?.customer_email || custRecord?.email || '',
        pan_number: shareData?.pan_number || custRecord?.pan_number || '',
        company_name: shareData?.company_name || '',
        designation: shareData?.designation || '',
        address: shareData?.address || '',
        mother_name: shareData?.mother_name || '',
        soft_approval_status: shareData?.soft_approval_status || 'Approval-income 25k',
        vkyc_stage: shareData?.vkyc_stage || 'VKYC Pending',
        iqa_stage: shareData?.iqa_stage || 'IQA Pending',
        dispatch_status: shareData?.dispatch_status || 'E-sign Pending',
        bank_application_number: shareData?.bank_application_number || '',
        vkyc_url: shareData?.vkyc_url || '',
        final_status: shareData?.final_status || 'In Process',
        decline_reason: shareData?.decline_reason || '',
        eligible_reqd: shareData?.eligible_reqd || 'No'
      }
    });
  } catch (err) {
    next(err);
  }
};

const updatePostApplyDetails = async (req, res, next) => {
  try {
    const { token } = req.params;
    const {
      bank_application_number, app_number,
      vkyc_url,
      customer_mobile, mobile,
      customer_name, full_name,
      dob,
      customer_email, email,
      pan_number, pan,
      company_name,
      designation,
      address,
      mother_name,
      soft_approval_status,
      vkyc_stage,
      iqa_stage,
      dispatch_status,
      final_status, status,
      decline_reason,
      eligible_reqd
    } = req.body;

    if (!token) return error(res, 'Token is required', 400);

    const { rows: [shareData] } = await query(`
      SELECT 
        COALESCE(psl.product_id, a.product_id, l.product_id) as product_id,
        COALESCE(psl.partner_id, a.partner_id, l.partner_id) as partner_id,
        COALESCE(a.customer_id, l.customer_id) as customer_id,
        COALESCE(l.id, a.lead_id) as lead_id,
        a.id as application_id,
        l.customer_id as lead_cust_id
      FROM (SELECT $1::text as tok) t
      LEFT JOIN partner_share_links psl ON (psl.tracking_token = t.tok)
      LEFT JOIN applications a ON (a.tracking_token = t.tok OR a.id::text = t.tok OR a.app_number = t.tok)
      LEFT JOIN leads l ON (l.tracking_token = t.tok OR l.id::text = t.tok OR l.lead_number = t.tok OR l.id = a.lead_id OR l.id = psl.lead_id)
      WHERE psl.id IS NOT NULL OR a.id IS NOT NULL OR l.id IS NOT NULL
      LIMIT 1
    `, [token]);

    if (!shareData) return error(res, 'Invalid application token', 404);

    const cleanAppNum = (bank_application_number || app_number || '').toString().trim();
    const cleanVkyc = (vkyc_url || '').toString().trim();
    const cleanPan = (pan_number || pan || '').toString().trim().toUpperCase();
    const cleanMobile = (customer_mobile || mobile || '').toString().trim();
    const cleanName = (customer_name || full_name || '').toString().trim();
    const cleanDob = (dob || '').toString().trim();
    const cleanEmail = (customer_email || email || '').toString().trim();
    const cleanCompany = (company_name || '').toString().trim();
    const cleanDesignation = (designation || '').toString().trim();
    const cleanAddress = (address || '').toString().trim();
    const cleanMother = (mother_name || '').toString().trim();

    const cleanSoftApproval = (soft_approval_status || '').toString().trim();
    const cleanVkycStage = (vkyc_stage || '').toString().trim();
    const cleanIqaStage = (iqa_stage || '').toString().trim();
    const cleanDispatch = (dispatch_status || '').toString().trim();
    const cleanFinalStatus = (final_status || status || '').toString().trim();
    const cleanDeclineReason = (decline_reason || '').toString().trim();
    const cleanEligibleReqd = (eligible_reqd || '').toString().trim();

    // Dynamic column safety check
    try {
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(50)`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255)`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS dob VARCHAR(50)`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255)`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS designation VARCHAR(255)`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS address TEXT`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255)`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS soft_approval_status VARCHAR(100)`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS vkyc_stage VARCHAR(100)`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS iqa_stage VARCHAR(100)`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS dispatch_status VARCHAR(100)`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS bank_application_number VARCHAR(100)`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS vkyc_url VARCHAR(500)`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS final_status VARCHAR(100)`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS decline_reason TEXT`);
      await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS eligible_reqd VARCHAR(50)`);
    } catch (_) {}

    const targetCustId = shareData.customer_id || shareData.lead_cust_id;

    if (targetCustId) {
      await query(`
        UPDATE customers
        SET full_name = COALESCE(NULLIF($1, ''), full_name),
            mobile = COALESCE(NULLIF($2, ''), mobile),
            email = COALESCE(NULLIF($3, ''), email),
            pan_number = COALESCE(NULLIF($4, ''), pan_number),
            dob = COALESCE(NULLIF($5, ''), dob),
            updated_at = NOW()
        WHERE id = $6
      `, [cleanName, cleanMobile, cleanEmail, cleanPan, cleanDob, targetCustId]);
    }

    if (shareData.lead_id) {
      await query(`
        UPDATE leads
        SET customer_name = COALESCE(NULLIF($1, ''), customer_name),
            mobile = COALESCE(NULLIF($2, ''), mobile),
            pan_number = COALESCE(NULLIF($3, ''), pan_number),
            status = 'submitted', pipeline_stage = 'submitted',
            updated_at = NOW()
        WHERE id = $4
      `, [cleanName, cleanMobile, cleanPan, shareData.lead_id]);
    }

    if (shareData.application_id || shareData.lead_id) {
      await query(`
        UPDATE applications
        SET customer_mobile = COALESCE(NULLIF($1, ''), customer_mobile),
            customer_name = COALESCE(NULLIF($2, ''), customer_name),
            dob = COALESCE(NULLIF($3, ''), dob),
            customer_email = COALESCE(NULLIF($4, ''), customer_email),
            pan_number = COALESCE(NULLIF($5, ''), pan_number),
            company_name = COALESCE(NULLIF($6, ''), company_name),
            designation = COALESCE(NULLIF($7, ''), designation),
            address = COALESCE(NULLIF($8, ''), address),
            mother_name = COALESCE(NULLIF($9, ''), mother_name),
            soft_approval_status = COALESCE(NULLIF($10, ''), soft_approval_status),
            vkyc_stage = COALESCE(NULLIF($11, ''), vkyc_stage),
            iqa_stage = COALESCE(NULLIF($12, ''), iqa_stage),
            dispatch_status = COALESCE(NULLIF($13, ''), dispatch_status),
            bank_application_number = COALESCE(NULLIF($14, ''), bank_application_number),
            vkyc_url = COALESCE(NULLIF($15, ''), vkyc_url),
            final_status = COALESCE(NULLIF($16, ''), final_status),
            decline_reason = COALESCE(NULLIF($17, ''), decline_reason),
            eligible_reqd = COALESCE(NULLIF($18, ''), eligible_reqd),
            status = COALESCE(NULLIF($16, ''), status, 'submitted'),
            updated_at = NOW()
        WHERE id = $19 OR (lead_id IS NOT NULL AND lead_id = $20)
      `, [
        cleanMobile, cleanName, cleanDob, cleanEmail, cleanPan,
        cleanCompany, cleanDesignation, cleanAddress, cleanMother,
        cleanSoftApproval, cleanVkycStage, cleanIqaStage, cleanDispatch,
        cleanAppNum, cleanVkyc, cleanFinalStatus, cleanDeclineReason, cleanEligibleReqd,
        shareData.application_id || null, shareData.lead_id || null
      ]);
    }

    return success(res, {
      token,
      product_id: shareData.product_id,
      customer_id: targetCustId || null,
      message: 'Application Quick Details, Remarks, and Final Status recorded successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// GET /app/:trackingToken — Direct 302 Redirect to Bank Partner URL
const handleDirectAppRedirect = async (req, res, next) => {
  try {
    const { trackingToken } = req.params;
    const shareData = await resolveShareToken(trackingToken);
    if (!shareData) {
      return res.redirect('https://gharkapaisa.in');
    }
    const { rows: [product] } = await query(`SELECT * FROM products WHERE id = $1`, [shareData.product_id]);
    const targetUrl = product?.partner_url || product?.application_url || product?.public_url || product?.apply_url || product?.redirect_url || 'https://gharkapaisa.in';
    return res.redirect(302, targetUrl);
  } catch (err) {
    return res.redirect('https://gharkapaisa.in');
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
  updatePostApplyDetails,
  handleDirectAppRedirect
};

