const { query, getClient } = require('../../config/database');
const { success, created, error, notFound, paginate } = require('../../utils/response/response');
const { getPaginationParams } = require('../../utils/helpers/helpers');
const logger = require('../../config/logger');

const {
  logLeadTimeline,
  logLeadActivity,
  initializeLeadPipeline,
  triggerAutomaticCommissionPayout
} = require('./lead.service.js');

/**
 * Enterprise Lead Orchestration Controller
 */

// GET /leads — List leads with search, filters, and priority/SLA badges
const listLeads = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status, priority, source, bank_id, search, from_date, to_date } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (['PARTNER', 'TEAM_MEMBER'].includes(req.user?.role)) {
      const { rows: [partner] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      const partnerId = partner ? partner.id : null;
      whereClause += ` AND (
        l.partner_id IN (
          SELECT $${idx}::uuid
          UNION SELECT $${idx + 1}::uuid
          UNION SELECT id FROM partner_profiles WHERE parent_partner_id = $${idx}::uuid OR referred_by_id = $${idx}::uuid OR parent_partner_id = $${idx + 1}::uuid OR referred_by_id = $${idx + 1}::uuid
          UNION SELECT child_partner_id FROM partner_team_relationships WHERE parent_partner_id = $${idx}::uuid OR sponsor_id = $${idx}::uuid OR parent_partner_id = $${idx + 1}::uuid OR sponsor_id = $${idx + 1}::uuid
          UNION SELECT id FROM partner_profiles WHERE user_id = $${idx + 1}::uuid
        )
        OR l.created_by = $${idx + 1}::uuid
        OR l.created_by IN (
          SELECT user_id FROM partner_profiles WHERE parent_partner_id = $${idx}::uuid OR referred_by_id = $${idx}::uuid
          UNION SELECT u.id FROM users u WHERE u.created_by = $${idx + 1}::uuid
        )
      )`;
      values.push(partnerId, req.user.id);
      idx += 2;
    }

    const isSuperAdminLeads = req.query.is_super_admin_leads === 'true' || req.query.is_super_admin_leads === true || (req.user?.role === 'SUPER_ADMIN' && req.headers.referer?.includes('/super-admin/leads'));

    if (isSuperAdminLeads) {
      if (status && status !== 'approved' && status !== 'operational_verified') {
        whereClause += ` AND l.status = $${idx++}`;
        values.push(status);
      } else {
        whereClause += ` AND (
          LOWER(l.status) IN ('approved', 'operational_verified', 'app file generated (approved)', 'approved_by_ops', 'disbursed', 'dispatched')
          OR LOWER(l.pipeline_stage) IN ('approved', 'operational_verified', 'disbursed')
          OR EXISTS (
            SELECT 1 FROM applications a 
            WHERE a.lead_id = l.id 
              AND (LOWER(a.status) IN ('approved', 'operational_verified', 'app file generated (approved)', 'disbursed')
                   OR LOWER(a.final_status) LIKE '%approve%' OR LOWER(a.final_status) LIKE '%generated%')
          )
        )`;
      }
    } else if (status) {
      whereClause += ` AND l.status = $${idx++}`;
      values.push(status);
    }
    if (priority) {
      whereClause += ` AND l.priority = $${idx++}`;
      values.push(priority);
    }
    if (source) {
      whereClause += ` AND l.source = $${idx++}`;
      values.push(source);
    }
    if (req.user?.assigned_banks && Array.isArray(req.user.assigned_banks) && req.user.assigned_banks.length > 0) {
      whereClause += ` AND p.bank_id = ANY($${idx++}::uuid[])`;
      values.push(req.user.assigned_banks);
    }

    if (bank_id && bank_id !== 'all') {
      whereClause += ` AND p.bank_id = $${idx++}::uuid`;
      values.push(bank_id);
    }

    if (search) {
      whereClause += ` AND (
        l.customer_name ILIKE $${idx} OR 
        l.mobile ILIKE $${idx} OR 
        l.city ILIKE $${idx} OR
        l.id::text ILIKE $${idx} OR
        c.pan_number ILIKE $${idx} OR
        p.name ILIKE $${idx} OR
        b.name ILIKE $${idx}
      )`;
      values.push(`%${search}%`);
      idx++;
    }

    if (from_date) {
      whereClause += ` AND l.created_at >= $${idx++}`;
      values.push(from_date);
    }
    if (to_date) {
      whereClause += ` AND l.created_at <= $${idx++}`;
      values.push(to_date + ' 23:59:59');
    }

    const [countRes, dataRes] = await Promise.all([
      query(`
        SELECT COUNT(DISTINCT l.id) 
        FROM leads l
        LEFT JOIN products p ON p.id = l.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        LEFT JOIN customers c ON c.mobile = l.mobile
        ${whereClause}
      `, values),
      query(`
        SELECT l.*, 
               p.name as product_name, p.category as product_category, p.commission_value,
               b.name as bank_name, b.short_code as bank_code,
               pp.partner_code, pp.first_name as partner_first_name, pp.last_name as partner_last_name,
               (SELECT executive_name FROM bank_assignments WHERE lead_id = l.id ORDER BY assigned_at DESC LIMIT 1) as bank_executive_name,
               (SELECT COUNT(*)::int FROM lead_documents WHERE lead_id = l.id) as documents_count,
               (SELECT COUNT(*)::int FROM lead_checklist WHERE lead_id = l.id AND status = 'verified') as checklist_verified_count
        FROM leads l
        LEFT JOIN products p ON p.id = l.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        LEFT JOIN partner_profiles pp ON pp.id = l.partner_id
        LEFT JOIN customers c ON c.mobile = l.mobile
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...values, limit, offset])
    ]);

    const total = parseInt(countRes.rows[0].count);
    return paginate(res, dataRes.rows, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /leads/:id — Full 360 Degree Lead Orchestration Details
const get360LeadDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: [lead] } = await query(`
      SELECT l.*,
             p.name as product_name, p.category as product_category, p.commission_type, p.commission_value,
             b.name as bank_name, b.short_code as bank_code,
             pp.partner_code, pp.first_name as partner_first_name, pp.last_name as partner_last_name,
             c.id as customer_id, c.email as customer_email, c.pan_number, c.dob, c.employment_type, c.monthly_income
      FROM leads l
      LEFT JOIN products p ON p.id = l.product_id
      LEFT JOIN banks b ON b.id = p.bank_id
      LEFT JOIN partner_profiles pp ON pp.id = l.partner_id
      LEFT JOIN customers c ON c.mobile = l.mobile
      WHERE l.id = $1
    `, [id]);

    if (!lead) return notFound(res, 'Lead not found');

    // Parallel fetch for 360 details
    const [docsRes, timelineRes, historyRes, notesRes, assignRes, bankAssignRes, checkRes, slaRes, walletRes, customerCardsRes] = await Promise.all([
      query(`SELECT ld.*, u.full_name as uploader_name FROM lead_documents ld LEFT JOIN users u ON u.id = ld.uploaded_by WHERE ld.lead_id = $1 ORDER BY ld.uploaded_at DESC`, [id]),
      query(`SELECT lt.*, u.full_name as author_name FROM lead_timeline lt LEFT JOIN users u ON u.id = lt.created_by WHERE lt.lead_id = $1 ORDER BY lt.created_at DESC`, [id]),
      query(`SELECT sh.*, u.full_name as author_name FROM lead_status_history sh LEFT JOIN users u ON u.id = sh.changed_by WHERE sh.lead_id = $1 ORDER BY sh.created_at DESC`, [id]),
      query(`
        SELECT ln.*, u.full_name as author_name 
        FROM lead_notes ln 
        LEFT JOIN users u ON u.id = ln.user_id 
        WHERE ln.lead_id = $1 ${req.user.role === 'PARTNER' ? "AND ln.visibility = 'partner'" : ""}
        ORDER BY ln.created_at DESC
      `, [id]),
      query(`SELECT la.*, u.full_name as staff_name FROM lead_assignments la LEFT JOIN users u ON u.id = la.assigned_to WHERE la.lead_id = $1 ORDER BY la.assigned_at DESC`, [id]),
      query(`SELECT * FROM bank_assignments WHERE lead_id = $1 ORDER BY assigned_at DESC`, [id]),
      query(`SELECT lc.*, u.full_name as verifier_name FROM lead_checklist lc LEFT JOIN users u ON u.id = lc.verified_by WHERE lc.lead_id = $1 ORDER BY lc.item ASC`, [id]),
      query(`SELECT * FROM lead_sla WHERE lead_id = $1 ORDER BY started_at DESC`, [id]),
      query(`SELECT * FROM commission_ledger WHERE lead_id = $1 OR application_id = $1`, [id]).catch(() => ({ rows: [] })),
      query(`
        SELECT a.id::text, a.app_number::text, a.status::text, a.commission_amount, COALESCE(a.process_type::text, 'lead_punching') as process_type, a.created_at,
               p.name as product_name, p.category as product_category, b.name as bank_name
        FROM applications a
        LEFT JOIN products p ON p.id = a.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        WHERE a.customer_id IN (SELECT id FROM customers WHERE mobile = $1)
           OR a.lead_id IN (SELECT id FROM leads WHERE mobile = $1)
        UNION
        SELECT l.id::text, COALESCE(l.lead_number::text, 'LEAD') as app_number, l.status::text, 0 as commission_amount, COALESCE(l.process_type::text, 'lead_punching') as process_type, l.created_at,
               p.name as product_name, p.category as product_category, b.name as bank_name
        FROM leads l
        LEFT JOIN products p ON p.id = l.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        WHERE l.mobile = $1
        ORDER BY created_at DESC
      `, [lead.mobile]).catch(() => ({ rows: [] }))
    ]);

    await logLeadActivity(null, id, 'view_360_lead', req.user.id, 'lead', id, req);

    return success(res, {
      overview: lead,
      documents: docsRes.rows,
      timeline: timelineRes.rows,
      status_history: historyRes.rows,
      notes: notesRes.rows,
      assignments: assignRes.rows,
      bank_assignment: bankAssignRes.rows[0] || null,
      checklist: checkRes.rows,
      sla_tracker: slaRes.rows,
      commission_ledger: walletRes.rows[0] || null,
      customer_cards: customerCardsRes.rows || []
    }, 'Lead 360 overview loaded');
  } catch (err) {
    next(err);
  }
};

function getBankApplyLinkBackend(productName, bankName, productObj = null) {
  const product = productObj || (typeof productName === 'object' ? productName : null);
  if (!product && !productObj) return "";

  const url = (
    productObj?.partner_url ||
    productObj?.application_url ||
    productObj?.apply_url ||
    productObj?.redirect_url ||
    productObj?.public_url ||
    product?.partner_url ||
    product?.application_url ||
    product?.apply_url ||
    product?.redirect_url ||
    product?.public_url ||
    ""
  );

  if (!url || !String(url).trim()) return "";

  const cleanUrl = String(url).trim();
  const nameLower = String(productName || productObj?.name || '').toLowerCase();
  const bankLower = String(bankName || productObj?.bank_name || '').toLowerCase();

  const isSbiUrl = cleanUrl.toLowerCase().includes('sbicard.com') || cleanUrl.toLowerCase().includes('sbi.co.in');
  const isSbiBankOrProduct = bankLower.includes('sbi') || bankLower.includes('state bank') || nameLower.includes('sbi') || nameLower.includes('state bank');
  
  if (isSbiUrl && !isSbiBankOrProduct) {
    console.warn(`[URL_RESOLVER_GUARD] Rejected cross-bank SBI link on non-SBI product '${productName || productObj?.name}'`);
    return "";
  }

  return cleanUrl;
}

// POST /leads — Create Lead with 30-Day Duplicate Check & OTP Generation
const createLead = async (req, res, next) => {
  try {
    const {
      product_id, productId,
      customer_name, customerName, full_name,
      mobile, email,
      monthly_salary, monthly_income,
      company_name, pincode, city, state,
      business_type, process_type, source, priority
    } = req.body;

    const targetProductId = product_id || productId;
    const targetName = customer_name || customerName || full_name;
    const trimmedMobile = mobile ? String(mobile).trim() : '';
    const trimmedEmail = email ? String(email).trim() : '';
    const targetCity = city || '';
    const targetProcess = process_type || 'lead_punching';

    if (!targetProductId || !targetName || !trimmedMobile) {
      return error(res, 'Product ID, Customer Name, and Mobile Number are required', 400);
    }

    // 1. Fetch Partner & Hierarchy Profile (Enforce ownership for normal partners)
    let targetPartnerId = null;
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
      targetPartnerId = req.body.partner_id || req.body.partnerId;
    }

    let partner = null;
    if (targetPartnerId) {
      const { rows: [p] } = await query(`
        SELECT p.id, p.parent_partner_id, p.kyc_status, u.role
        FROM partner_profiles p
        JOIN users u ON u.id = p.user_id
        WHERE p.id = $1 OR p.user_id = $1
      `, [targetPartnerId]);
      partner = p;
    }

    if (!partner) {
      const { rows: [p] } = await query(`
        SELECT p.id, p.parent_partner_id, p.kyc_status, u.role
        FROM partner_profiles p
        JOIN users u ON u.id = p.user_id
        WHERE p.user_id = $1
      `, [req.user.id]);
      partner = p;
    }

    if (!partner) {
      const partnerCode = 'AG' + String(Math.floor(10000 + Math.random() * 90000));
      const { rows: [newP] } = await query(`
        INSERT INTO partner_profiles (user_id, partner_code, first_name, last_name, status, kyc_status)
        VALUES ($1, $2, $3, $4, 'active', 'draft') RETURNING id, parent_partner_id, kyc_status
      `, [req.user.id, partnerCode, req.user.first_name || 'Partner', req.user.last_name || '']);
      partner = newP;
    }

    // 2. Validate Product
    const { rows: [product] } = await query(`
      SELECT
        p.id, p.name, p.is_active, p.bank_id,
        p.partner_url, p.public_url, p.application_url, p.apply_url, p.redirect_url,
        b.name AS bank_name, b.short_code AS bank_code
      FROM products p
      LEFT JOIN banks b ON b.id = p.bank_id
      WHERE p.id = $1
    `, [targetProductId]);
    if (!product || !product.is_active) {
      return error(res, 'Selected product is inactive or unavailable', 400);
    }

    // 3. 30-Day Duplicate Check (Applications & Confirmed Leads)
    const { rows: duplicateApps } = await query(`
      SELECT app_number, status, created_at
      FROM applications
      WHERE product_id = $1
        AND customer_id IN (SELECT id FROM customers WHERE mobile = $2)
        AND created_at >= NOW() - INTERVAL '30 days'
        AND status NOT IN ('rejected', 'cancelled')
      LIMIT 1
    `, [targetProductId, trimmedMobile]);

    if (duplicateApps.length > 0) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_APPLICATION',
        message: `An active application (${duplicateApps[0].app_number}) already exists for this mobile number and product within the last 30 days.`
      });
    }

    const { rows: duplicateLeads } = await query(`
      SELECT lead_number, status, created_at
      FROM leads
      WHERE product_id = $1
        AND mobile = $2
        AND created_at >= NOW() - INTERVAL '30 days'
        AND status NOT IN ('rejected', 'cancelled')
      LIMIT 1
    `, [targetProductId, trimmedMobile]);

    if (duplicateLeads.length > 0) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_LEAD',
        message: `An active lead (${duplicateLeads[0].lead_number || 'Lead'}) already exists for this mobile number and product within the last 30 days.`
      });
    }

    // 4. Customer Upsert
    const incomeVal = monthly_salary || monthly_income ? parseFloat(monthly_salary || monthly_income) : null;
    const { rows: [customer] } = await query(`
      INSERT INTO customers (
        full_name, mobile, email, monthly_income, employer, pincode, city, state, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (mobile) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          email = COALESCE(EXCLUDED.email, customers.email),
          monthly_income = COALESCE(EXCLUDED.monthly_income, customers.monthly_income),
          employer = COALESCE(EXCLUDED.employer, customers.employer),
          pincode = COALESCE(EXCLUDED.pincode, customers.pincode),
          city = COALESCE(EXCLUDED.city, customers.city),
          state = COALESCE(EXCLUDED.state, customers.state),
          updated_at = NOW()
      RETURNING id
    `, [targetName.trim(), trimmedMobile, trimmedEmail || null, incomeVal, company_name || null, pincode || null, targetCity || null, state || null, req.user.id]);

    // 5. Handle Process-Specific Workflow
    const leadNum = 'LEAD-' + Date.now().toString(36).toUpperCase();
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const appNum = 'APP' + datePart + Math.floor(1000 + Math.random() * 9000);

    if (targetProcess === 'linked_share') {
      const trackingToken = 'SH_' + Math.random().toString(36).substring(2, 12).toUpperCase();
      const host = req.get('host') || 'gharkapaisa.in';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;
      const defaultShareUrl = `${baseUrl.replace(/\/$/, '')}/apply/${trackingToken}`;
      const directBankUrl = product?.partner_url?.trim() || getBankApplyLinkBackend(product?.name, product?.bank_name || product?.bank_code, product) || defaultShareUrl;
      const shareUrl = directBankUrl;

      const partnerName = `${partner.first_name || ''} ${partner.last_name || ''}`.trim() || 'Partner';
      const cleanMobile = trimmedMobile.replace(/\D/g, '');
      const waText = encodeURIComponent(`Hello ${targetName.trim()},\n\nApply for ${product?.name || 'Financial Product'} directly on official bank portal:\n${shareUrl}`);
      const whatsappUrl = `https://wa.me/91${cleanMobile}?text=${waText}`;

      const { rows: [lead] } = await query(`
        INSERT INTO leads (
          lead_number, partner_id, parent_partner_id, created_by, customer_id,
          product_id, customer_name, mobile, city, status, process_type, process_by,
          otp_verified, source, priority, pipeline_stage
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'linked_share', 'partner', TRUE, 'share_link', $10, 'created')
        RETURNING *
      `, [
        leadNum, partner.id, partner.parent_partner_id || null, req.user.id, customer.id,
        targetProductId, targetName.trim(), trimmedMobile, targetCity, priority || 'medium'
      ]);

      await query(`
        INSERT INTO partner_share_links (partner_id, product_id, tracking_token, expires_at)
        VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')
      `, [partner.id, targetProductId, trackingToken]);

      const { rows: [app] } = await query(`
        INSERT INTO applications (app_number, lead_id, customer_id, product_id, partner_id, bank_id, submitted_by, loan_amount, status, process_type, process_by, source, tracking_token, agree_terms, submitted_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 'linked_share', 'partner', 'share_link', $9, TRUE, NOW())
        RETURNING *
      `, [appNum, lead.id, customer.id, targetProductId, partner.id, product.bank_id || null, req.user.id, incomeVal || 0, trackingToken]);

      await initializeLeadPipeline(lead.id, req.user.id, 'share_link', priority || 'medium');

      // Automatically send link via SMS to partner and customer (Template: Linked_share 6a8b36fe9b6fc4bd54035592)
      try {
        const { sendLinkedShareSms } = require('../../services/sms/sms.service');
        const { rows: [pUser] } = await query(`
          SELECT u.mobile, u.phone, pp.mobile as partner_mobile 
          FROM partner_profiles pp 
          LEFT JOIN users u ON u.id = pp.user_id 
          WHERE pp.id = $1
        `, [partner.id]);
        const partnerMobile = pUser?.mobile || pUser?.phone || pUser?.partner_mobile;

        if (partnerMobile) {
          sendLinkedShareSms(partnerMobile, targetName.trim(), product?.name || 'Financial Product', shareUrl).catch(err => {
            console.warn('Auto SMS dispatch to partner failed for linked_share:', err.message);
          });
        }
        if (trimmedMobile && trimmedMobile !== partnerMobile) {
          sendLinkedShareSms(trimmedMobile, targetName.trim(), product?.name || 'Financial Product', shareUrl).catch(err => {
            console.warn('Auto SMS dispatch failed for linked_share:', err.message);
          });
        }
      } catch (smsErr) {
        console.warn('SMS service invocation error:', smsErr.message);
      }

      return created(res, {
        lead_id: lead.id,
        app_id: app.id,
        app_number: app.app_number,
        customer_id: customer.id,
        mobile: lead.mobile,
        process_type: 'linked_share',
        process_by: 'partner',
        source: 'share_link',
        otp_required: false,
        share_url: shareUrl,
        whatsapp_url: whatsappUrl
      }, 'Linked share link generated successfully.');
    }

    if (targetProcess === 'direct_bank') {
      const bankUrl = getBankApplyLinkBackend(product?.name, product?.bank_name || product?.bank_code, product);

      const { rows: [lead] } = await query(`
        INSERT INTO leads (
          lead_number, partner_id, parent_partner_id, created_by, customer_id,
          product_id, customer_name, mobile, city, status, process_type, process_by,
          otp_verified, source, priority, pipeline_stage
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'direct_bank', 'partner_self', TRUE, $10, $11, 'bank_redirected')
        RETURNING *
      `, [
        leadNum, partner.id, partner.parent_partner_id || null, req.user.id, customer.id,
        targetProductId, targetName.trim(), trimmedMobile, targetCity, source || 'partner', priority || 'medium'
      ]);

      const { rows: [app] } = await query(`
        INSERT INTO applications (app_number, lead_id, customer_id, product_id, partner_id, bank_id, submitted_by, loan_amount, status, process_type, bank_url, agree_terms, submitted_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 'direct_bank', $9, TRUE, NOW())
        RETURNING *
      `, [appNum, lead.id, customer.id, targetProductId, partner.id, product.bank_id || null, req.user.id, incomeVal || 0, bankUrl]);

      await initializeLeadPipeline(lead.id, req.user.id, source || 'partner', priority || 'medium');

      return created(res, {
        lead_id: lead.id,
        app_id: app.id,
        app_number: app.app_number,
        customer_id: customer.id,
        mobile: lead.mobile,
        process_type: 'direct_bank',
        process_by: 'partner_self',
        otp_required: false,
        bank_url: bankUrl
      }, 'Direct bank application initialized successfully.');
    }

    if (targetProcess === 'physical_process') {
      const { rows: [bankRec] } = await query(`SELECT id, name, short_code FROM banks WHERE id = $1`, [product.bank_id]).catch(() => ({ rows: [] }));
      const bankName = (bankRec?.name || bankRec?.short_code || product.name || '').toLowerCase();
      const isSbi = product.bank_id === 'e7c2c604-139d-4fcf-a87c-695633535a02' || bankRec?.id === 'e7c2c604-139d-4fcf-a87c-695633535a02' || bankName.includes('sbi');

      const { rows: [lead] } = await query(`
        INSERT INTO leads (
          lead_number, partner_id, parent_partner_id, created_by, customer_id,
          product_id, customer_name, mobile, city, status, process_type, process_by,
          otp_verified, source, priority, pipeline_stage
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'physical_process', 'physical', TRUE, $10, $11, 'physical_details')
        RETURNING *
      `, [
        leadNum, partner.id, partner.parent_partner_id || null, req.user.id, customer.id,
        targetProductId, targetName.trim(), trimmedMobile, targetCity, source || 'partner', priority || 'medium'
      ]);

      const { rows: [app] } = await query(`
        INSERT INTO applications (app_number, lead_id, customer_id, product_id, partner_id, bank_id, submitted_by, loan_amount, status, process_type, agree_terms, submitted_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 'physical_process', TRUE, NOW())
        RETURNING *
      `, [appNum, lead.id, customer.id, targetProductId, partner.id, product.bank_id || null, req.user.id, incomeVal || 0]);

      await initializeLeadPipeline(lead.id, req.user.id, source || 'partner', priority || 'medium');

      const host = req.get('host') || 'gharkapaisa.in';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;

      // Access token creation for physical link
      const { v4: uuidv4 } = require('uuid');
      const physToken = `phys_${uuidv4().replace(/-/g, '')}`;
      await query(`
        INSERT INTO customer_access_tokens (customer_id, application_id, token, token_type, expires_at)
        VALUES ($1, $2, $3, 'physical_process', NOW() + INTERVAL '72 hours')
      `, [customer.id, app.id, physToken]).catch(() => {});

      const physicalFormUrl = `${baseUrl.replace(/\/$/, '')}/physical-application/${physToken}`;

      return created(res, {
        lead_id: lead.id,
        app_id: app.id,
        app_number: app.app_number,
        customer_id: customer.id,
        mobile: lead.mobile,
        process_type: 'physical_process',
        process_by: 'physical',
        otp_required: false,
        share_url: physicalFormUrl
      }, 'Physical process application created successfully.');
    }

    // Default: Lead Punching Process (No OTP requirement for internal punching)
    const { rows: [lead] } = await query(`
      INSERT INTO leads (
        lead_number, partner_id, parent_partner_id, created_by, customer_id,
        product_id, customer_name, mobile, city, status, process_type, process_by,
        otp_verified, source, priority, pipeline_stage
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'lead_punching', 'punching', TRUE, $10, $11, 'pan_check')
      RETURNING *
    `, [
      leadNum, partner.id, partner.parent_partner_id || null, req.user.id, customer.id,
      targetProductId, targetName.trim(), trimmedMobile, targetCity, source || 'partner', priority || 'medium'
    ]);

    const { rows: [app] } = await query(`
      INSERT INTO applications (app_number, lead_id, customer_id, product_id, partner_id, bank_id, submitted_by, loan_amount, status, process_type, agree_terms, submitted_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 'lead_punching', TRUE, NOW())
      RETURNING *
    `, [appNum, lead.id, customer.id, targetProductId, partner.id, product.bank_id || null, req.user.id, incomeVal || 0]);

    await initializeLeadPipeline(lead.id, req.user.id, source || 'partner', priority || 'medium');

    return created(res, {
      lead_id: lead.id,
      app_id: app.id,
      app_number: app.app_number,
      customer_id: customer.id,
      mobile: lead.mobile,
      process_type: 'lead_punching',
      otp_required: false
    }, 'Lead Punching application logged successfully.');
  } catch (err) {
    next(err);
  }
};

// POST /leads/:id/send-otp — Resend Customer OTP
const sendLeadOtp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [lead] } = await query(`SELECT * FROM leads WHERE id = $1`, [id]);
    if (!lead) return notFound(res, 'Lead record not found');

    // Strict Partner Ownership Verification
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      const { rows: [userPartner] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (!userPartner || userPartner.id !== lead.partner_id) {
        return error(res, 'Access denied: Lead does not belong to your partner account', 403);
      }
    }

    // Rate Limiting: 60-second cooldown check
    if (lead.last_otp_sent_at) {
      const timeSinceLast = (new Date() - new Date(lead.last_otp_sent_at)) / 1000;
      if (timeSinceLast < 60) {
        return error(res, `Please wait ${Math.ceil(60 - timeSinceLast)} seconds before requesting another OTP`, 429);
      }
    }

    // Maximum 5 OTP resends allowed per lead
    if ((lead.otp_sent_count || 1) >= 5) {
      return error(res, 'Maximum OTP resend attempts exceeded. Please try creating a new lead or contact support.', 429);
    }

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    await query(`
      UPDATE leads 
      SET otp_code = $1, 
          otp_expires_at = $2, 
          otp_sent_count = COALESCE(otp_sent_count, 1) + 1,
          last_otp_sent_at = NOW(),
          updated_at = NOW() 
      WHERE id = $3
    `, [otpCode, otpExpires, id]);

    // Send SMS Notification
    if (lead.mobile) {
      try {
        const { sendSms } = require('../../services/sms/sms.service');
        await sendSms(lead.mobile, `Your GharKaPaisa verification OTP for lead ${lead.lead_number} is ${otpCode}. Valid for 15 minutes.`).catch(e => logger.warn(`OTP SMS send failed: ${e.message}`));
      } catch (err) {
        logger.warn('SMS service not configured for OTP notification');
      }
    }

    return success(res, { lead_id: id, expires_at: otpExpires }, 'Verification OTP resent to customer via SMS.');
  } catch (err) {
    next(err);
  }
};

// POST /leads/:id/verify-otp — Verify OTP & Convert Lead to Application
const verifyLeadOtp = async (req, res, next) => {
  const client = await getClient();
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) return error(res, 'OTP is required for verification', 400);

    const { rows: [lead] } = await client.query(`SELECT * FROM leads WHERE id = $1`, [id]);
    if (!lead) return notFound(res, 'Lead record not found');

    // Strict Partner Ownership Verification
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      const { rows: [userPartner] } = await client.query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (!userPartner || userPartner.id !== lead.partner_id) {
        return error(res, 'Access denied: Lead does not belong to your partner account', 403);
      }
    }

    if (lead.otp_verified && lead.status === 'confirmed') {
      // Find existing converted application
      const { rows: [existingApp] } = await client.query(`SELECT * FROM applications WHERE lead_id = $1`, [id]);
      if (existingApp) {
        return success(res, existingApp, 'Lead was already verified and converted to application.');
      }
    }

    // Maximum 5 invalid attempts limit
    if ((lead.otp_attempts || 0) >= 5) {
      return error(res, 'Maximum verification attempts exceeded. Please request a new OTP.', 429);
    }

    if (lead.otp_code !== String(otp).trim()) {
      await client.query(`UPDATE leads SET otp_attempts = COALESCE(otp_attempts, 0) + 1 WHERE id = $1`, [id]);
      return error(res, 'Invalid verification OTP. Please check and try again.', 400);
    }

    if (new Date(lead.otp_expires_at) < new Date()) {
      return error(res, 'Verification OTP has expired. Please request a new OTP.', 400);
    }

    await client.query('BEGIN');

    // 1. Update Lead Status to Confirmed
    await client.query(`
      UPDATE leads 
      SET status = 'confirmed', otp_verified = TRUE, otp_verified_at = NOW(), confirmed_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [id]);

    // 2. Generate Unique Application Number
    const appSeq = Date.now().toString().slice(-8);
    const appNumber = `APP${appSeq}`;

    // 3. Resolve Product details & Commission
    const { rows: [product] } = await client.query(`
      SELECT id, name, bank_id, category, commission_value, public_url, partner_url
      FROM products WHERE id = $1
    `, [lead.product_id]);

    const initialStatus = lead.process_type === 'direct_bank' ? 'pending' : 'details_submitted';

    // 4. Resolve customer_id and Insert into Applications
    let targetCustomerId = lead.customer_id;
    if (!targetCustomerId && lead.mobile) {
      const { rows: [c] } = await client.query(`SELECT id FROM customers WHERE mobile = $1`, [lead.mobile]);
      if (c) {
        targetCustomerId = c.id;
      } else {
        const { rows: [newC] } = await client.query(`
          INSERT INTO customers (full_name, mobile, city, created_by)
          VALUES ($1, $2, $3, $4) RETURNING id
        `, [lead.customer_name || 'Customer', lead.mobile, lead.city || null, lead.created_by]);
        targetCustomerId = newC.id;
      }
      await client.query(`UPDATE leads SET customer_id = $1 WHERE id = $2`, [targetCustomerId, id]);
    }

    const processByRoute = lead.process_by || (lead.process_type === 'linked_share' ? 'customer_self' : (lead.process_type === 'direct_bank' ? 'partner_self' : 'punching'));

    const { rows: [app] } = await client.query(`
      INSERT INTO applications (
        app_number, lead_id, customer_id, product_id, partner_id, parent_partner_id,
        submitted_by, status, process_type, process_by, commission_amount, commission_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
      RETURNING *
    `, [
      appNumber, lead.id, targetCustomerId, lead.product_id, lead.partner_id, lead.parent_partner_id,
      lead.created_by, initialStatus, lead.process_type || 'lead_punching', processByRoute, product?.commission_value || 0
    ]);

    // 5. Generate Process-Specific Metadata Response
    let shareUrl = null;
    let whatsappUrl = null;
    let bankUrl = null;

    if (lead.process_type === 'linked_share') {
      const trackingToken = 'SH_' + Math.random().toString(36).substring(2, 12).toUpperCase();
      const baseUrl = process.env.PUBLIC_APP_URL || 'https://gharkapaisa.in';
      shareUrl = product?.partner_url?.trim() || getBankApplyLinkBackend(product?.name, product?.bank_name, product) || `${baseUrl}/apply/${trackingToken}`;

      const { rows: [partnerProfile] } = await client.query(`
        SELECT first_name, last_name, partner_code FROM partner_profiles WHERE id = $1
      `, [lead.partner_id]);

      const partnerName = `${partnerProfile?.first_name || ''} ${partnerProfile?.last_name || ''}`.trim() || 'Your Financial Partner';
      const cleanMobile = lead.mobile.replace(/\D/g, '');
      const waText = encodeURIComponent(`Hello ${lead.customer_name},\n\nApply for ${product?.name || 'Financial Product'} using your official bank link:\n${shareUrl}\n\nShared by ${partnerName} via GharKaPaisa.`);
      whatsappUrl = `https://wa.me/91${cleanMobile}?text=${waText}`;

      await client.query(`
        INSERT INTO partner_share_links (partner_id, product_id, tracking_token, expires_at)
        VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')
      `, [lead.partner_id, lead.product_id, trackingToken]);

      await client.query(`
        UPDATE applications SET tracking_token = $1 WHERE id = $2
      `, [trackingToken, app.id]);
    } else if (lead.process_type === 'direct_bank') {
      bankUrl = product?.partner_url || product?.public_url || 'https://gharkapaisa.in/partner/products';
      await client.query(`
        UPDATE applications SET bank_url = $1 WHERE id = $2
      `, [bankUrl, app.id]);
    }

    await client.query('COMMIT');

    await logLeadTimeline(null, id, 'Lead Confirmed', `Lead OTP verified and converted to Application ${appNumber}`, 'applications', app.id, req.user.id);

    return success(res, {
      ...app,
      share_url: shareUrl,
      whatsapp_url: whatsappUrl,
      bank_url: bankUrl
    }, 'Lead verified successfully and converted to application.');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};


// PATCH /leads/:id/status — Status & Stage Pipeline Transition
const updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, pipeline_stage, remarks, rejection_reason, approved_amount } = req.body;

    const { rows: [existing] } = await query(`SELECT * FROM leads WHERE id = $1`, [id]);
    if (!existing) return notFound(res, 'Lead not found');

    const newStatus = status || existing.status;
    const newStage = pipeline_stage || (newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : existing.pipeline_stage);

    const { rows: [updated] } = await query(`
      UPDATE leads 
      SET status = $1, pipeline_stage = $2, rejection_reason = COALESCE($3, rejection_reason), updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [newStatus, newStage, rejection_reason || null, id]);

    // Record Status History
    await query(`
      INSERT INTO lead_status_history (lead_id, old_status, new_status, changed_by, remarks)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, existing.status, newStatus, req.user.id, remarks || `Status transitioned to ${newStatus}`]);

    // Record Timeline
    await logLeadTimeline(null, id, `Status: ${newStatus.toUpperCase()}`, remarks || `Lead stage changed to ${newStage}`, 'lead', id, req.user.id);
    await logLeadActivity(null, id, 'status_update', req.user.id, 'lead', id, req);

    // IF APPROVED -> Trigger Automatic Commission Calculation & Partner Wallet Credit!
    if (newStatus === 'approved' && existing.status !== 'approved') {
      try {
        await triggerAutomaticCommissionPayout(id, approved_amount, req.user.id);
      } catch (commErr) {
        logger.error(`Automatic commission calculation failed for lead ${id}:`, commErr);
      }
    }

    // Send DLT SMS to customer for application_status
    try {
      const { sendApplicationStatusSms } = require('../../services/sms/sms.service');
      const { rows: [leadProd] } = await query(`
        SELECT l.mobile, l.customer_name, p.name as product_name 
        FROM leads l 
        LEFT JOIN products p ON p.id = l.product_id 
        WHERE l.id = $1
      `, [id]);
      if (leadProd && leadProd.mobile) {
        sendApplicationStatusSms(leadProd.mobile, leadProd.customer_name, leadProd.product_name, newStatus).catch(smsErr => {
          logger.warn(`Failed to send lead status SMS: ${smsErr.message}`);
        });
      }
    } catch (smsErr) {
      logger.warn(`Lead status SMS dispatch notice: ${smsErr.message}`);
    }

    return success(res, updated, `Lead status updated to ${newStatus}`);
  } catch (err) {
    next(err);
  }
};

// POST /leads/:id/document — Document Upload
const addLeadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { document_type, file_url, verification_status } = req.body;
    if (!document_type || !file_url) return error(res, 'Document type and file URL are required', 400);

    const { rows: [doc] } = await query(`
      INSERT INTO lead_documents (lead_id, document_type, file_url, verification_status, uploaded_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, document_type, file_url, verification_status || 'pending', req.user.id]);

    await logLeadTimeline(null, id, 'Document Uploaded', `${document_type.replace('_', ' ').toUpperCase()} uploaded`, 'lead_documents', doc.id, req.user.id);
    return created(res, doc, 'Document attached to lead successfully');
  } catch (err) {
    next(err);
  }
};

// POST /leads/:id/note — Public or Internal Note
const addLeadNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, visibility } = req.body;
    if (!note) return error(res, 'Note content is required', 400);

    const { rows: [n] } = await query(`
      INSERT INTO lead_notes (lead_id, user_id, role, note, visibility)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, req.user.id, req.user.role, note, visibility || 'partner']);

    await logLeadTimeline(null, id, 'Note Added', note.substring(0, 100), 'lead_notes', n.id, req.user.id);
    return created(res, n, 'Note recorded successfully');
  } catch (err) {
    next(err);
  }
};

// POST /leads/:id/assign — Assign to Operations Team
const assignLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assigned_to, team } = req.body;
    if (!assigned_to) return error(res, 'Target staff user ID is required', 400);

    const { rows: [assign] } = await query(`
      INSERT INTO lead_assignments (lead_id, assigned_to, team, assigned_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, assigned_to, team || 'operations', req.user.id]);

    await logLeadTimeline(null, id, 'Lead Assigned', `Lead assigned to staff member (${team || 'operations'})`, 'lead_assignments', assign.id, req.user.id);
    return created(res, assign, 'Lead assigned successfully');
  } catch (err) {
    next(err);
  }
};

// POST /leads/:id/bank-assign — Assign Bank Executive
const assignBankExecutive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bank_id, executive_name, mobile, email } = req.body;
    if (!executive_name) return error(res, 'Bank Executive Name is required', 400);

    const { rows: [bankAss] } = await query(`
      INSERT INTO bank_assignments (lead_id, bank_id, executive_name, mobile, email)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, bank_id || null, executive_name, mobile || null, email || null]);

    await logLeadTimeline(null, id, 'Bank Executive Assigned', `Assigned to ${executive_name} (${mobile || 'No phone'})`, 'bank_assignments', bankAss.id, req.user.id);
    return created(res, bankAss, 'Bank executive assigned successfully');
  } catch (err) {
    next(err);
  }
};

// POST /leads/:id/checklist — Verification Checklist Update
const updateLeadChecklist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { item, status } = req.body;
    if (!item || !status) return error(res, 'Item and status are required', 400);

    const { rows: [check] } = await query(`
      INSERT INTO lead_checklist (lead_id, item, status, verified_by, verified_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (lead_id, item) DO UPDATE
      SET status = EXCLUDED.status, verified_by = EXCLUDED.verified_by, verified_at = NOW()
      RETURNING *
    `, [id, item, status, req.user.id]);

    await logLeadTimeline(null, id, 'Checklist Verified', `${item}: ${status.toUpperCase()}`, 'lead_checklist', check.id, req.user.id);
    return success(res, check, 'Checklist status updated');
  } catch (err) {
    next(err);
  }
};

// Bulk Assign Leads
const bulkAssignLeads = async (req, res, next) => {
  try {
    const { lead_ids, assigned_partner_id } = req.body;
    if (!Array.isArray(lead_ids) || !assigned_partner_id) {
      return error(res, 'Lead IDs array and Assigned Partner ID are required', 400);
    }

    await query(`
      UPDATE leads 
      SET partner_id = $1, updated_at = NOW()
      WHERE id = ANY($2::uuid[])
    `, [assigned_partner_id, lead_ids]);

    return success(res, {}, `Successfully reassigned ${lead_ids.length} leads`);
  } catch (err) {
    next(err);
  }
};

// Follow-up handler legacy compatibility
const addLeadFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { follow_up_at, note } = req.body;
    if (!follow_up_at) return error(res, 'Follow-up date/time is required', 400);

    const { rows: [f] } = await query(`
      INSERT INTO lead_followups (lead_id, scheduled_by, follow_up_at, note)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, req.user.id, follow_up_at, note || '']);

    await logLeadTimeline(null, id, 'Followup Scheduled', note || 'Followup scheduled', 'lead_followups', f.id, req.user.id);
    return created(res, f, 'Follow-up reminder set');
  } catch (err) {
    next(err);
  }
};

// GET /leads/partner-share-tracking — Super Admin: all leads from partner share landing page
const listPartnerShareLeads = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { search, partner_code, product_id, from_date, to_date } = req.query;

    let where = `WHERE l.source = 'partner_share'`;
    const values = [];
    let idx = 1;

    if (search) {
      where += ` AND (l.customer_name ILIKE $${idx} OR l.customer_mobile ILIKE $${idx} OR l.mobile ILIKE $${idx})`;
      values.push(`%${search}%`); idx++;
    }
    if (partner_code) {
      where += ` AND pp.partner_code ILIKE $${idx++}`;
      values.push(`%${partner_code}%`);
    }
    if (product_id) {
      where += ` AND l.product_id = $${idx++}`;
      values.push(product_id);
    }
    if (from_date) { where += ` AND l.created_at >= $${idx++}`; values.push(from_date); }
    if (to_date) { where += ` AND l.created_at <= $${idx++}`; values.push(to_date + ' 23:59:59'); }

    const mobileCol = `COALESCE(l.customer_mobile, l.mobile)`;

    const [countRes, dataRes] = await Promise.all([
      query(`SELECT COUNT(*) FROM leads l LEFT JOIN partner_profiles pp ON pp.id = l.partner_id ${where}`, values),
      query(`
        SELECT l.id, l.customer_name, ${mobileCol} as customer_mobile,
               l.status, l.source, l.created_at,
               p.name as product_name, p.category,
               b.name as bank_name, b.short_code as bank_code,
               pp.partner_code, pp.first_name as partner_first_name, pp.last_name as partner_last_name
        FROM leads l
        LEFT JOIN products p ON p.id = l.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        LEFT JOIN partner_profiles pp ON pp.id = l.partner_id
        ${where}
        ORDER BY l.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...values, limit, offset])
    ]);

    return paginate(res, dataRes.rows, parseInt(countRes.rows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// PATCH /leads/:id
const updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customer_name, mobile, city, priority } = req.body;

    const { rows: [existing] } = await query(`SELECT * FROM leads WHERE id = $1`, [id]);
    if (!existing) return notFound(res, 'Lead not found');

    const { rows: [updated] } = await query(`
      UPDATE leads SET
        customer_name = COALESCE(NULLIF($1, ''), customer_name),
        mobile = COALESCE(NULLIF($2, ''), mobile),
        customer_mobile = COALESCE(NULLIF($2, ''), customer_mobile),
        city = COALESCE(NULLIF($3, ''), city),
        priority = COALESCE(NULLIF($4, ''), priority),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [customer_name, mobile, city, priority, id]);

    await logLeadTimeline(null, id, 'Lead Updated', 'Lead profile details modified', 'lead', id, req.user.id);
    return success(res, updated, 'Lead updated successfully');
  } catch (err) {
    next(err);
  }
};

// PATCH /leads/:id/process-type
const updateLeadProcessType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { process_type, reason } = req.body;

    if (!process_type || !reason) {
      return error(res, 'New process_type and reason are required', 400);
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return error(res, 'Only authorized administrators can request a change of lead process type', 403);
    }

    const { rows: [existing] } = await query(`SELECT * FROM leads WHERE id = $1`, [id]);
    if (!existing) return notFound(res, 'Lead not found');

    const oldType = existing.process_type;

    const { rows: [updated] } = await query(`
      UPDATE leads SET process_type = $1, updated_at = NOW() WHERE id = $2 RETURNING *
    `, [process_type.trim(), id]);

    await logLeadTimeline(null, id, 'Process Type Changed', `Process type updated from ${oldType} to ${process_type}. Reason: ${reason}`, 'lead', id, req.user.id);
    await logLeadActivity(null, id, 'process_type_changed', req.user.id, 'lead', id, req);

    return success(res, updated, `Lead process type updated to ${process_type}`);
  } catch (err) {
    next(err);
  }
};

// POST /leads/:id/application — Lead to Application Conversion Alias
const convertLeadToApplication = async (req, res, next) => {
  req.body.otp = req.body.otp || 'AUTO';
  return verifyLeadOtp(req, res, next);
};

module.exports = {
  listLeads,
  get360LeadDetails,
  createLead,
  sendLeadOtp,
  verifyLeadOtp,
  updateLeadStatus,
  addLeadDocument,
  addLeadNote,
  assignLead,
  assignBankExecutive,
  updateLeadChecklist,
  bulkAssignLeads,
  addLeadFollowUp,
  listPartnerShareLeads,
  updateLead,
  updateLeadProcessType,
  convertLeadToApplication,
  getBankApplyLinkBackend
};

