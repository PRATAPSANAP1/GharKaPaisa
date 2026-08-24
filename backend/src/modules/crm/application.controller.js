const crypto = require('crypto');
const { query, getClient } = require('../../config/database');
const { generateAppNumber, getPaginationParams } = require('../../utils/helpers/helpers');
const { creditCommission, releaseHold } = require('../wallet/service.js');
const { calculatePartnerCommission } = require('../partner/commission.service.js');
const { notify } = require('../notifications/service.js');
const { uploadToS3 } = require('../../services/aws/s3.service.js');
const { success, created, error, notFound, forbidden, paginate } = require('../../utils/response/response');
const logger = require('../../config/logger');
const { logAction } = require('../admin/audit.service.js');
const { processTeamOverrideCommission } = require('../team/team.service.js');
const { getBankApplyLinkBackend } = require('./lead.controller');

// Helper to parse DOB string formats (e.g. "03091994", "03-09-1994", "1994-09-03") to ISO Date YYYY-MM-DD
const parseDobToIso = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim().replace(/\D/g, '');
  if (s.length === 8) {
    const day = s.substring(0, 2);
    const month = s.substring(2, 4);
    const year = s.substring(4, 8);
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  if (raw.includes('-') || raw.includes('/')) {
    const parts = raw.split(/[-/]/).map(p => p.trim());
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }
  try {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      if (year >= 1900 && year <= 2100) {
        return `${year}-${month}-${day}`;
      }
    }
  } catch (e) {}
  return null;
};

// Helper to log timeline actions
const logTimeline = async (client, applicationId, status, activity, remarks, performedBy) => {
  await client.query(`
    INSERT INTO application_timeline (application_id, status, activity, remarks, performed_by)
    VALUES ($1, $2, $3, $4, $5)
  `, [applicationId, status, activity, remarks, performedBy]);
};

// POST /applications — Partner submits application
const submitApplication = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { product_id, customer, loan_amount, notes } = req.body;
    let PartnerId = req.partner?.id || req.body.partner_id;

    if (!PartnerId && req.user?.id) {
      const { rows: [p] } = await client.query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) {
        PartnerId = p.id;
      } else {
        const partnerCode = 'AG' + String(Math.floor(10000 + Math.random() * 90000));
        const { rows: [newP] } = await client.query(`
          INSERT INTO partner_profiles (user_id, partner_code, first_name, last_name, status, kyc_status)
          VALUES ($1, $2, $3, $4, 'active', 'pending') RETURNING id
        `, [req.user.id, partnerCode, req.user.first_name || 'Partner', req.user.last_name || '']);
        PartnerId = newP.id;
      }
    }

    if (!PartnerId) return error(res, 'Partner ID is required', 400);

    // Validate product
    const { rows: [product] } = await client.query(
      `SELECT p.*, b.name as bank_name FROM products p JOIN banks b ON b.id = p.bank_id WHERE p.id = $1 AND p.is_active = true`,
      [product_id]
    );
    if (!product) return error(res, 'Product not found or inactive', 404);

    // Fetch Partner Parent ID
    const { rows: [partnerProfile] } = await client.query(`
      SELECT parent_partner_id FROM partner_profiles WHERE id = $1
    `, [PartnerId]);
    const parentPartnerId = partnerProfile ? partnerProfile.parent_partner_id : null;

    // 30-Day Duplicate Check
    const { rows: duplicateApps } = await client.query(`
      SELECT app_number, status, created_at
      FROM applications
      WHERE product_id = $1
        AND customer_id IN (SELECT id FROM customers WHERE mobile = $2)
        AND created_at >= NOW() - INTERVAL '30 days'
        AND status::text NOT IN ('rejected', 'cancelled')
      LIMIT 1
    `, [product_id, customer.mobile]);

    if (duplicateApps.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_APPLICATION',
        message: `An active application (${duplicateApps[0].app_number}) already exists for this mobile number and product within the last 30 days.`
      });
    }

    // Upsert customer
    let customerId;
    const { rows: [existingCust] } = await client.query(
      `SELECT id FROM customers WHERE mobile = $1`, [customer.mobile]
    );
    if (existingCust) {
      customerId = existingCust.id;
      await client.query(`
        UPDATE customers SET full_name=$1, email=$2, pan_number=$3, monthly_income=$4,
          employment_type=$5, city=$6, updated_at=NOW() WHERE id=$7
      `, [customer.full_name, customer.email, customer.pan_number,
      customer.monthly_income, customer.employment_type, customer.city, customerId]);
    } else {
      const { rows: [newCust] } = await client.query(`
        INSERT INTO customers (full_name, mobile, email, dob, pan_number, monthly_income, employment_type, city, state, pincode, employer, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id
      `, [customer.full_name, customer.mobile, customer.email, customer.dob,
      customer.pan_number, customer.monthly_income, customer.employment_type,
      customer.city, customer.state || null, customer.pincode || null, customer.employer || null, req.user.id]);
      customerId = newCust.id;
    }

    // Create or link Lead record
    let leadId = req.body.lead_id;
    if (!leadId) {
      const leadNum = 'LEAD-' + Date.now().toString(36).toUpperCase();
      const { rows: [newLead] } = await client.query(`
        INSERT INTO leads (
          lead_number, partner_id, parent_partner_id, created_by, customer_id,
          product_id, customer_name, mobile, city, status, process_type,
          otp_verified, source, pipeline_stage
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'confirmed', $10, TRUE, 'partner', 'submitted')
        RETURNING id
      `, [leadNum, PartnerId, parentPartnerId, req.user.id, customerId, product_id, customer.full_name, customer.mobile, customer.city || null, req.body.process_type || 'lead_punching']);
      leadId = newLead.id;
    }

    // Calculate expected commission
    const commission = await calculatePartnerCommission(product_id, PartnerId, loan_amount);

    // Generate unique app number
    const { rows: [{ nextval }] } = await client.query(`SELECT nextval('app_number_seq')`);
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const appNumber = `APP${datePart}${nextval}`;

    // Create application with all structured metadata (lead_id, customer_id, partner_id, team_member_id, bank_id, product_id, process_type, status, application_number, vkyc_status)
    const teamMemberId = req.body.team_member_id || null;
    const vkycStatus = req.body.vkyc_status || 'pending';

    const { rows: [app] } = await client.query(`
      INSERT INTO applications
        (app_number, application_number, lead_id, customer_id, product_id, partner_id, parent_partner_id, team_member_id, bank_id, submitted_by, loan_amount, commission_amount, notes, status, process_type, vkyc_status, submitted_at,
         status_history)
      VALUES ($1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'details_submitted',$13,$14,NOW(),
        jsonb_build_array(jsonb_build_object('status','details_submitted','at',NOW(),'by',$15::text)))
      RETURNING id, app_number, application_number
    `, [appNumber, leadId, customerId, product_id, PartnerId, parentPartnerId, teamMemberId, product.bank_id, req.user.id, loan_amount, commission, notes, req.body.process_type || 'lead_punching', vkycStatus, req.user.id.toString()]);

    // Link application_id on lead record
    await client.query(`UPDATE leads SET application_id = $1 WHERE id = $2`, [app.id, leadId]);

    // Initial timeline log
    await logTimeline(client, app.id, 'submitted', 'Application Created', 'Application created inside portal.', req.user.id);
    await logTimeline(client, app.id, 'submitted', 'Redirected to Bank', `Initiated bank integration lead flow.`, req.user.id);

    // Referral clicks update omitted

    await client.query('COMMIT');

    try {
      const { recalculateTeamMetrics } = require('../partner/partner.controller.js');
      if (parentPartnerId) {
        await recalculateTeamMetrics(parentPartnerId);
      }
    } catch (syncErr) {
      logger.error('Failed to run application submission sync:', syncErr.message);
    }

    // Notify partner
    await notify.applicationSubmitted(req.user.id, appNumber);

    logger.info(`Application ${appNumber} submitted by Partner ${PartnerId}`);
    return created(res, { application_id: app.id, app_number: app.app_number, commission }, 'Application submitted successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// POST /applications/public — Customer submits application from homepage / direct product apply page
const submitPublicApplication = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const {
      product_id,
      customer = {},
      loan_amount,
      notes,
      partner_code,
      tracking_id,
      process_type,
      monthly_salary,
      monthly_income,
      company_name,
      employer,
      pincode,
      city,
      state,
      pan_number,
      pan,
      aadhaar_number,
      aadhaar,
      dob,
      occupation,
      employment_type
    } = req.body;

    const cleanName = (customer.full_name || customer.name || req.body.full_name || req.body.name || '').toString().trim();
    const cleanMobile = (customer.mobile || req.body.mobile || '').toString().replace(/\D/g, '').slice(-10);
    const cleanEmail = (customer.email || req.body.email || '').toString().trim().toLowerCase();
    const cleanCity = (customer.city || city || '').toString().trim();
    const cleanState = (customer.state || state || '').toString().trim();
    const cleanPincode = (customer.pincode || pincode || '').toString().replace(/\D/g, '').slice(0, 6);
    const cleanEmployer = (customer.company_name || customer.employer || company_name || employer || '').toString().trim();
    const cleanPan = (customer.pan_number || customer.pan || pan_number || pan || '').toString().trim().toUpperCase();
    const rawAadhaar = (customer.aadhaar_number || customer.aadhaar || aadhaar_number || aadhaar || '').toString().replace(/\D/g, '');
    const cleanAadhaar = rawAadhaar || null;
    const cleanDob = customer.dob || dob || null;
    const cleanOccupation = (customer.occupation || customer.employment_type || occupation || employment_type || 'Salaried').toString().trim();

    const rawSalary = monthly_salary || monthly_income || customer.monthly_income || loan_amount || 0;
    const salaryVal = parseFloat(rawSalary) || 0;

    // Validate product
    const { rows: [product] } = await client.query(
      `SELECT p.*, b.name as bank_name FROM products p JOIN banks b ON b.id = p.bank_id WHERE p.id = $1 AND p.is_active = true`,
      [product_id]
    );
    if (!product) return error(res, 'Product not found or inactive', 404);

    let partnerId;
    if (partner_code) {
      const { rows: [partner] } = await client.query(`SELECT id FROM partner_profiles WHERE partner_code = $1`, [partner_code]);
      if (partner) partnerId = partner.id;
    }
    if (!partnerId) {
      const { rows: [defaultPartner] } = await client.query(`SELECT id FROM partner_profiles LIMIT 1`);
      if (!defaultPartner) {
        return error(res, 'System cannot route lead as no active Partner profiles exist.', 500);
      }
      partnerId = defaultPartner.id;
    }

    const { rows: [partnerProfile] } = await client.query(`
      SELECT parent_partner_id, user_id FROM partner_profiles WHERE id = $1
    `, [partnerId]);
    const parentPartnerId = partnerProfile ? partnerProfile.parent_partner_id : null;
    const partnerUserId = partnerProfile ? partnerProfile.user_id : null;

    // System Admin User ID for fallback
    const { rows: [sysUser] } = await client.query(`SELECT id FROM users WHERE role='SUPER_ADMIN' LIMIT 1`);
    const sysUserId = sysUser?.id || partnerUserId;

    // Ensure columns exist on tables dynamically
    try {
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20)`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS occupation VARCHAR(100)`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS city VARCHAR(100)`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS state VARCHAR(100)`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(15,2)`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS dob DATE`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS pan_number VARCHAR(15)`);
      await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)`);

      await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS pan_number VARCHAR(15)`);
      await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20)`);
      await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS state VARCHAR(100)`);
      await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)`);
      await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)`);
      await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id) ON DELETE SET NULL`);

      await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS pan_number VARCHAR(15)`);
      await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20)`);
      await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS state VARCHAR(100)`);
      await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)`);
      await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)`);
      await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS city VARCHAR(100)`);
      await client.query(`ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'bank_form_submitted'`);
    } catch (_) {}

    // Upsert customer
    let customerId;
    const { rows: [existingCust] } = await client.query(
      `SELECT id FROM customers WHERE mobile = $1`, [cleanMobile]
    );

    if (existingCust) {
      customerId = existingCust.id;
      await client.query(`
        UPDATE customers SET
          full_name = COALESCE(NULLIF($1, ''), full_name),
          email = COALESCE(NULLIF($2, ''), email),
          city = COALESCE(NULLIF($3, ''), city),
          state = COALESCE(NULLIF($4, ''), state),
          pincode = COALESCE(NULLIF($5, ''), pincode),
          monthly_income = COALESCE($6, monthly_income),
          company_name = COALESCE(NULLIF($7, ''), company_name),
          pan_number = COALESCE(NULLIF($8, ''), pan_number),
          aadhaar_number = COALESCE(NULLIF($9, ''), aadhaar_number),
          dob = COALESCE($10, dob),
          occupation = COALESCE(NULLIF($11, ''), occupation),
          updated_at = NOW()
        WHERE id = $12
      `, [cleanName, cleanEmail, cleanCity, cleanState, cleanPincode, salaryVal || null, cleanEmployer, cleanPan, cleanAadhaar, cleanDob || null, cleanOccupation, customerId]);
    } else {
      const { rows: [newCust] } = await client.query(`
        INSERT INTO customers (
          full_name, mobile, email, city, state, pincode, monthly_income,
          company_name, pan_number, aadhaar_number, dob, occupation, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [cleanName, cleanMobile, cleanEmail || null, cleanCity || null, cleanState || null, cleanPincode || null, salaryVal || null, cleanEmployer || null, cleanPan || null, cleanAadhaar, cleanDob || null, cleanOccupation, sysUserId]);
      customerId = newCust.id;
    }

    // Also create or link Lead record
    const leadNum = 'LEAD-' + Date.now().toString(36).toUpperCase();
    const { rows: [newLead] } = await client.query(`
      INSERT INTO leads (
        lead_number, partner_id, parent_partner_id, created_by, customer_id,
        product_id, customer_name, mobile, city, pan_number, status, process_type,
        otp_verified, source, pipeline_stage
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'confirmed', $11, TRUE, 'public_landing', 'submitted')
      RETURNING id
    `, [leadNum, partnerId, parentPartnerId, sysUserId, customerId, product_id, cleanName, cleanMobile, cleanCity || null, cleanPan || null, process_type || 'lead_punching']);
    const leadId = newLead.id;

    const commission = await calculatePartnerCommission(product_id, partnerId, salaryVal);

    const { rows: [{ nextval }] } = await client.query(`SELECT nextval('app_number_seq')`);
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const appNumber = `APP${datePart}${nextval}`;

    const { rows: [app] } = await client.query(`
      INSERT INTO applications
        (app_number, lead_id, customer_id, product_id, partner_id, parent_partner_id, bank_id, submitted_by, loan_amount, commission_amount, notes, status, tracking_id, submitted_at,
         status_history, process_type, company_name, pincode, city, pan_number)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'details_submitted',$12,NOW(),
        jsonb_build_array(jsonb_build_object('status','details_submitted','at',NOW(),'by',$13::text)), $14, $15, $16, $17, $18)
      RETURNING id, app_number
    `, [appNumber, leadId, customerId, product_id, partnerId, parentPartnerId, product.bank_id, sysUserId, salaryVal, commission, notes, tracking_id || null, sysUserId.toString(), process_type || 'lead_punching', cleanEmployer || null, cleanPincode || null, cleanCity || null, cleanPan || null]);

    // Link application_id on lead record
    await client.query(`UPDATE leads SET application_id = $1 WHERE id = $2`, [app.id, leadId]);

    await logTimeline(client, app.id, 'submitted', 'Application Created', 'Public direct landing application logged.', sysUserId);
    await logTimeline(client, app.id, 'submitted', 'Customer Submitted Form', 'Verified lead details saved.', sysUserId);

    await client.query('COMMIT');

    const targetRedirectUrl = product.partner_url || product.application_url || product.public_url || product.apply_url || product.redirect_url || 'https://gharkapaisa.in';

    logger.info(`Public application ${appNumber} submitted routing to Partner ${partnerId}`);
    return created(res, {
      application_id: app.id,
      app_number: app.app_number,
      lead_id: leadId,
      customer_id: customerId,
      partner_id: partnerId,
      product_id: product.id,
      redirect_url: targetRedirectUrl,
      commission
    }, 'Application submitted successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// GET /applications/dashboard (Application metrics overview)
const getApplicationsDashboard = async (req, res, next) => {
  try {
    const { partner_id, partner_id: q_partner_id } = req.query;
    const targetPartnerId = q_partner_id || partner_id;

    let partnerId = null;
    let userId = req.user?.id || null;
    const userRole = (req.user?.role || '').toUpperCase();
    const isPartnerOrTeam = ['PARTNER', 'TEAM_MEMBER'].includes(userRole);

    if (isPartnerOrTeam) {
      const { rows: [partner] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      partnerId = partner ? partner.id : null;
      userId = req.user.id;
    } else if (targetPartnerId && isUuid(targetPartnerId)) {
      partnerId = targetPartnerId;
    } else if (req.query.scope === 'my' && req.user?.id) {
      const { rows: [partner] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      partnerId = partner ? partner.id : null;
      userId = req.user.id;
    }

    const validScope = req.query.scope && req.query.scope.trim() ? req.query.scope.trim() : null;

    const teamPartnerFilter = `
      SELECT $1::uuid UNION SELECT $2::uuid 
      UNION SELECT id FROM partner_profiles WHERE parent_partner_id = $1::uuid OR referred_by_id = $1::uuid OR parent_partner_id = $2::uuid OR referred_by_id = $2::uuid
      UNION SELECT child_partner_id FROM partner_team_relationships WHERE parent_partner_id = $1::uuid OR sponsor_id = $1::uuid OR parent_partner_id = $2::uuid OR sponsor_id = $2::uuid
      UNION SELECT id FROM partner_profiles WHERE user_id = $2::uuid
    `;

    const whereClause = isPartnerOrTeam
      ? `WHERE (
          combined.partner_id IN (${teamPartnerFilter})
          OR combined.submitted_by = $2::uuid
          OR combined.submitted_by IN (
            SELECT user_id FROM partner_profiles WHERE parent_partner_id = $1::uuid OR referred_by_id = $1::uuid
            UNION SELECT u.id FROM users u WHERE u.created_by = $2::uuid
          )
        )`
      : `WHERE ($1::uuid IS NULL OR combined.partner_id IN (${teamPartnerFilter}))`;

    const scopeWhere = `
      ${whereClause}
      AND (
        $3::text IS NULL OR $3::text = ''
        OR ($3::text = 'my' AND (combined.submitted_by = $2::uuid OR (combined.partner_id = $1::uuid AND (combined.submitted_by IS NULL OR combined.submitted_by = $2::uuid))))
        OR ($3::text = 'team' AND NOT (combined.submitted_by = $2::uuid OR (combined.partner_id = $1::uuid AND (combined.submitted_by IS NULL OR combined.submitted_by = $2::uuid))))
      )
    `;

    const { rows: [stats] } = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today,
        COUNT(*) FILTER (WHERE status IN ('submitted', 'pending', 'applied', 'lead_created', 'new', 'draft')) as pending,
        COUNT(*) FILTER (WHERE status IN ('approved', 'disbursed', 'confirmed', 'sanctioned')) as approved,
        COUNT(*) FILTER (WHERE status IN ('rejected', 'declined', 'cancelled')) as rejected,
        COUNT(*) FILTER (WHERE status IN ('under_review', 'under review', 'verification', 'in_progress', 'bank_verification')) as under_review,
        COUNT(*) FILTER (WHERE commission_status = 'pending') as comm_pending,
        COUNT(*) FILTER (WHERE commission_status = 'approved') as comm_approved,
        COUNT(*) FILTER (WHERE commission_status = 'processed') as comm_paid,
        COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'processed'), 0) as total_earnings
      FROM (
        SELECT a.id, a.partner_id, a.submitted_by, a.status::text, a.commission_status::text, a.commission_amount, a.created_at FROM applications a
        UNION ALL
        SELECT l.id, l.partner_id, COALESCE(l.created_by, c.created_by) as submitted_by, l.status::text, 'pending'::text as commission_status, p.commission_value as commission_amount, l.created_at
        FROM leads l
        LEFT JOIN customers c ON c.mobile = l.mobile
        LEFT JOIN products p ON p.id = l.product_id
        WHERE l.id NOT IN (SELECT lead_id FROM applications WHERE lead_id IS NOT NULL)
      ) combined
      ${scopeWhere}
    `, [partnerId, userId, validScope]);

    const totalCount = parseInt(stats?.total || 0);
    const approvedCount = parseInt(stats?.approved || 0);
    const conversionRate = totalCount > 0 ? parseFloat(((approvedCount / totalCount) * 100).toFixed(2)) : 0;

    // Recent 5 applications
    const { rows: recent } = await query(`
      SELECT combined.id, combined.app_number, combined.status, combined.commission_amount, combined.commission_status, combined.created_at,
             combined.customer_name, combined.product_name
      FROM (
        SELECT a.id, a.app_number, a.status::text, a.commission_amount, a.commission_status::text, a.created_at, a.partner_id, a.submitted_by,
               COALESCE(c.full_name, 'Customer') as customer_name, p.name as product_name
        FROM applications a
        LEFT JOIN customers c ON c.id = a.customer_id
        LEFT JOIN products p ON p.id = a.product_id
        UNION ALL
        SELECT l.id, COALESCE(NULLIF(l.lead_number, ''), CONCAT('LEAD-', UPPER(SUBSTRING(l.id::text, 1, 8)))) as app_number, l.status::text, p.commission_value as commission_amount, 'pending'::text as commission_status, l.created_at, l.partner_id, COALESCE(l.created_by, c.created_by) as submitted_by,
               COALESCE(NULLIF(l.customer_name, ''), c.full_name, 'Customer') as customer_name, p.name as product_name
        FROM leads l
        LEFT JOIN customers c ON c.mobile = l.mobile
        LEFT JOIN products p ON p.id = l.product_id
        WHERE l.id NOT IN (SELECT lead_id FROM applications WHERE lead_id IS NOT NULL)
      ) combined
      ${scopeWhere}
      ORDER BY combined.created_at DESC LIMIT 5
    `, [partnerId, userId, validScope]);

    return success(res, {
      stats: {
        total: parseInt(stats?.total || 0),
        today: parseInt(stats?.today || 0),
        pending: parseInt(stats?.pending || 0),
        approved: parseInt(stats?.approved || 0),
        rejected: parseInt(stats?.rejected || 0),
        under_review: parseInt(stats?.under_review || 0),
        comm_pending: parseInt(stats?.comm_pending || 0),
        comm_approved: parseInt(stats?.comm_approved || 0),
        comm_paid: parseInt(stats?.comm_paid || 0),
        total_earnings: parseFloat(stats?.total_earnings || 0),
        conversion_rate: conversionRate
      },
      recent
    });
  } catch (err) {
    next(err);
  }
};

// GET /applications/:id/timeline
const getTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Resolve application & linked lead ID
    const { rows: [app] } = await query(`SELECT id, lead_id FROM applications WHERE id = $1`, [id]);
    const leadId = app?.lead_id || null;

    const { rows } = await query(`
      SELECT DISTINCT ON (id, performed_at, title)
             id, application_id, event_type, title, description, status, performed_by, performed_at, created_at, performed_by_name, remarks
      FROM (
        SELECT at.id::text, at.application_id::text, at.event_type, at.title, at.description, at.status, at.performed_by, at.performed_at, at.performed_at as created_at, u.full_name as performed_by_name, at.description as remarks
        FROM application_timeline at
        LEFT JOIN users u ON u.id = at.performed_by
        WHERE at.application_id = $1

        UNION ALL

        SELECT lt.id::text, lt.lead_id::text as application_id, COALESCE(lt.title, 'Lead Event') as event_type, COALESCE(lt.title, 'Timeline Event') as title, lt.description, 'completed' as status, lt.created_by as performed_by, lt.created_at as performed_at, lt.created_at, u.full_name as performed_by_name, lt.description as remarks
        FROM lead_timeline lt
        LEFT JOIN users u ON u.id = lt.created_by
        WHERE lt.lead_id = $1 OR ($2::uuid IS NOT NULL AND lt.lead_id = $2::uuid)
      ) combined
      ORDER BY performed_at DESC
    `, [id, leadId]);

    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// GET /applications/:id/documents
const getDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { rows } = await query(`
      SELECT * FROM application_documents WHERE application_id = $1 ORDER BY uploaded_at DESC
    `, [id]);

    if (!rows || rows.length === 0) {
      const { rows: leadDocs } = await query(`
        SELECT id, lead_id as application_id, document_type as doc_type, file_url, verification_status as status, uploaded_at, uploaded_at as created_at
        FROM lead_documents WHERE lead_id = $1 ORDER BY uploaded_at DESC
      `, [id]);
      rows = leadDocs;
    }

    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// POST /applications/:id/notes (visibility filtering)
const addNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, visibility = 'public' } = req.body;
    if (!note) return error(res, 'Note content is required', 400);

    await query(`
      INSERT INTO application_notes (application_id, user_id, note, visibility)
      VALUES ($1, $2, $3, $4)
    `, [id, req.user.id, note, visibility]);

    return success(res, {}, 'Note added successfully');
  } catch (err) {
    next(err);
  }
};

// GET /applications/:id/notes (Internal helper to fetch filtered notes)
const getFilteredNotes = async (applicationId, userRole) => {
  let visibilityClause = "AND visibility = 'public'";
  if (userRole === 'ADMIN') {
    visibilityClause = "AND visibility IN ('public', 'internal')";
  } else if (userRole === 'SUPER_ADMIN') {
    visibilityClause = ""; // Super admin sees all notes
  }

  const { rows } = await query(`
    SELECT n.*, u.full_name as writer_name, u.role as writer_role
    FROM application_notes n
    JOIN users u ON u.id = n.user_id
    WHERE n.application_id = $1 ${visibilityClause}
    ORDER BY n.created_at DESC
  `, [applicationId]);

  return rows;
};

// PUT /applications/:id/status (transition logic)
const updateStatus = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { status, remarks = 'Status updated by administrative panel' } = req.body;

    const { rows: [app] } = await client.query(`SELECT * FROM applications WHERE id = $1 FOR UPDATE`, [id]);
    if (!app) return notFound(res, 'Application not found');

    const userRole = (req.user?.role || '').toUpperCase();
    const restrictedForPartner = ['operational_verified', 'super_admin_approved', 'commission_processing', 'commission_released'];
    if (['PARTNER', 'TEAM_MEMBER'].includes(userRole) && restrictedForPartner.includes(status)) {
      await client.query('ROLLBACK');
      return forbidden(res, 'Partners are not authorized to update application to operational or admin approval statuses.');
    }

    const restrictedForOpHead = ['super_admin_approved', 'commission_processing', 'commission_released'];
    if (['EMPLOYEE', 'ADMIN'].includes(userRole) && restrictedForOpHead.includes(status) && userRole !== 'SUPER_ADMIN') {
      await client.query('ROLLBACK');
      return forbidden(res, 'Super Admin authorization required for final approval and commission processing.');
    }

    let approvedAt = app.approved_at;
    if ((status === 'approved' || status === 'super_admin_approved') && !app.approved_at) {
      approvedAt = new Date();
    }

    const historyEntry = JSON.stringify({ status, at: new Date(), by: req.user.id, remarks });
    const isRejected = status === 'rejected' || status === 'cancelled';
    await client.query(`
      UPDATE applications SET
        status = $1,
        approved_at = $2,
        commission_status = CASE WHEN $5::boolean THEN 'cancelled' ELSE commission_status END,
        status_history = status_history || $3::jsonb,
        updated_at = NOW()
      WHERE id = $4
    `, [status, approvedAt, historyEntry, id, isRejected]);

    await logTimeline(client, id, status, `Transitioned to ${status.replace(/_/g, ' ').toUpperCase()}`, remarks, req.user.id);
    // Click status updates omitted

    await client.query('COMMIT');

    // Notifications
    const { rows: [partner] } = await query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [app.partner_id]);
    if (partner) {
      if (status === 'approved') {
        await notify.applicationApproved(partner.user_id, app.app_number, app.commission_amount);

        // Referral Bonus & Commission Distribution (Task 27)
        try {
          const { query: queryDB } = require('../../config/database');
          const { createNotification } = require('../notifications/service.js');
          const teamService = require('../team/team.service.js');

          // 1. Process Product Commission & Team Override
          const baseComm = parseFloat(app.commission_amount || 0);
          if (baseComm > 0) {
            await teamService.processTeamOverrideCommission(app.id, app.partner_id, baseComm);
          }

          // 2. Referral Bonus Check (Requirement 1: 3 Approved Credit Card Applications -> ₹500 Bonus)
          const { rows: [pProfile] } = await queryDB(`
            UPDATE partner_profiles
            SET approved_credit_cards = approved_credit_cards + 1
            WHERE id = $1
            RETURNING id, user_id, approved_credit_cards, referral_bonus_paid, referred_by_id, parent_partner_id
          `, [app.partner_id]);

          if (pProfile && pProfile.approved_credit_cards >= 3 && !pProfile.referral_bonus_paid) {
            const referrerId = pProfile.referred_by_id || pProfile.parent_partner_id;
            if (referrerId) {
              await queryDB(`UPDATE partner_profiles SET referral_bonus_paid = TRUE WHERE id = $1`, [app.partner_id]);

              await queryDB(`
                INSERT INTO partner_wallets (partner_id, available_balance, total_earned)
                VALUES ($1, 500, 500)
                ON CONFLICT (partner_id) DO UPDATE SET
                  available_balance = partner_wallets.available_balance + 500,
                  total_earned = partner_wallets.total_earned + 500,
                  updated_at = NOW()
              `, [referrerId]);

              await queryDB(`
                INSERT INTO wallet_ledger (
                  partner_id, application_id, type, credit, debit, balance_after, status, description
                ) VALUES (
                  $1, $2, 'referral_bonus', 500, 0,
                  (SELECT available_balance FROM partner_wallets WHERE partner_id = $1),
                  'completed', '₹500 Referral bonus credited for referred partner completing 3 approved applications'
                )
              `, [referrerId, app.id]);

              const { rows: [refUser] } = await queryDB(`SELECT user_id FROM partner_profiles WHERE id = $1`, [referrerId]);
              if (refUser && refUser.user_id) {
                await createNotification(
                  refUser.user_id,
                  '🎉 ₹500 Referral Bonus Credited!',
                  'Your referred partner completed 3 approved applications! ₹500 referral bonus has been added to your wallet.',
                  'success',
                  '/partner/wallet'
                );
              }
            }
          }

          // Parent team notifications
          const { rows: [{ count }] } = await queryDB(`
            SELECT COUNT(*)::int FROM applications 
            WHERE partner_id = $1 AND status = 'approved'
          `, [app.partner_id]);

          const { rows: [childProfile] } = await queryDB(`
            SELECT first_name, last_name, parent_partner_id FROM partner_profiles WHERE id = $1
          `, [app.partner_id]);

          if (childProfile && childProfile.parent_partner_id) {
            const { rows: [parentProfile] } = await queryDB(`
              SELECT user_id FROM partner_profiles WHERE id = $1
            `, [childProfile.parent_partner_id]);

            if (parentProfile && parentProfile.user_id) {
              if (count === 1) {
                await createNotification(
                  parentProfile.user_id,
                  '🎉 Team Member First Sale!',
                  `${childProfile.first_name} ${childProfile.last_name} completed their first sale!`,
                  'success',
                  '/partner/team-network'
                );
              } else {
                await createNotification(
                  parentProfile.user_id,
                  '💰 Team Member Earned Commission',
                  `${childProfile.first_name} ${childProfile.last_name} earned a commission on application ${app.app_number}!`,
                  'success',
                  '/partner/team-network'
                );
              }
            }
          }
        } catch (err) {
          logger.error('Failed to notify parent on child sale:', err.message);
        }
      }
      if (status === 'rejected') await notify.applicationRejected(partner.user_id, app.app_number, remarks);
    }

    // Trigger DLT SMS for application_status update
    try {
      const { sendApplicationStatusSms } = require('../../services/sms/sms.service');
      const { rows: [custData] } = await query(`
        SELECT c.mobile, c.full_name, p.name as product_name 
        FROM applications a 
        LEFT JOIN customers c ON c.id = a.customer_id 
        LEFT JOIN products p ON p.id = a.product_id 
        WHERE a.id = $1
      `, [id]);
      if (custData && custData.mobile) {
        sendApplicationStatusSms(custData.mobile, custData.full_name, custData.product_name, status).catch(smsErr => {
          logger.warn(`Failed to send application status SMS: ${smsErr.message}`);
        });
      }
    } catch (smsErr) {
      logger.warn(`Application status SMS dispatch notice: ${smsErr.message}`);
    }

    return success(res, {}, 'Application status successfully updated');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// PUT /applications/:id/commission (Lifecycle workflow)
const updateCommission = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { status, amount } = req.body;

    const { rows: [app] } = await client.query(`SELECT * FROM applications WHERE id = $1 FOR UPDATE`, [id]);
    if (!app) return notFound(res);

    let receivedAt = app.commission_received_at;
    let paidAt = app.commission_paid_at;

    if (status === 'received' && !app.commission_received_at) receivedAt = new Date();
    if (status === 'approved' && !app.commission_paid_at) paidAt = new Date();

    await client.query(`
      UPDATE applications SET
        commission_status = $1,
        commission_amount = COALESCE($2, commission_amount),
        commission_received_at = $3,
        commission_paid_at = $4,
        updated_at = NOW()
      WHERE id = $5
    `, [status, amount, receivedAt, paidAt, id]);

    // Handle Ledger Splits & Wallet Credits on Approval
    if (status === 'approved') {
      const commValue = amount || app.commission_amount || 0;
      await creditCommission(app.partner_id, id, commValue, `Approved commission for ${app.app_number}`, req.user.id, client);

      // Create Entry in commission_ledger with Idempotency Guard
      const { rows: existingComm } = await client.query(`
        SELECT id FROM commission_ledger WHERE application_id = $1 OR (lead_id IS NOT NULL AND lead_id = $2)
      `, [id, app.lead_id || id]);

      if (existingComm.length === 0) {
        await client.query(`
          INSERT INTO commission_ledger (application_id, lead_id, partner_id, parent_partner_id, commission_amount, override_amount, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'approved')
        `, [id, app.lead_id || null, app.partner_id, app.parent_partner_id, commValue, commValue * 0.15]);
      }

      // Set commission_released flag on the application itself
      await client.query(`
        UPDATE applications SET commission_released = TRUE WHERE id = $1
      `, [id]);

      // Trigger team override payouts for direct and indirect sponsor partners
      try {
        await processTeamOverrideCommission(id, app.partner_id, commValue);
      } catch (teamErr) {
        logger.error(`Failed to process team override commission for app ${id}:`, teamErr.message);
      }

      // Referral clicks status update omitted
    }

    await logTimeline(client, id, app.status, `Commission ${status.toUpperCase()}`, `Updated commission state to ${status}.`, req.user.id);
    await client.query('COMMIT');

    return success(res, {}, 'Commission details updated');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// GET /applications/analytics (Group data for chart engines)
const getAnalytics = async (req, res, next) => {
  try {
    const { rows: daily } = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_apps,
        COUNT(*) FILTER (WHERE status IN ('approved', 'disbursed')) as approved_apps,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_apps
      FROM applications
      GROUP BY DATE(created_at)
      ORDER BY date ASC LIMIT 30
    `);

    const { rows: products } = await query(`
      SELECT p.name as product_name, COUNT(*) as apps_count
      FROM applications a
      JOIN products p ON p.id = a.product_id
      GROUP BY p.name
      ORDER BY apps_count DESC LIMIT 5
    `);

    const { rows: banks } = await query(`
      SELECT b.name as bank_name, COUNT(*) as apps_count
      FROM applications a
      JOIN products p ON p.id = a.product_id
      JOIN banks b ON b.id = p.bank_id
      GROUP BY b.name
      ORDER BY apps_count DESC LIMIT 5
    `);

    return success(res, { daily, products, banks });
  } catch (err) {
    next(err);
  }
};

// Super Admin custom methods
const approveApplication = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { id, approved_amount } = req.body;
    if (!id) return error(res, 'ID is required', 400);

    const { rows: [app] } = await client.query(`SELECT * FROM applications WHERE id=$1 FOR UPDATE`, [id]);
    if (!app) return notFound(res);

    await client.query(`
      UPDATE applications SET 
        status='approved', 
        approved_amount=COALESCE($1, approved_amount, loan_amount), 
        approved_at=NOW(), 
        commission_status='approved',
        commission_received_at=NOW(),
        commission_paid_at=NOW(),
        updated_at=NOW()
      WHERE id=$2
    `, [approved_amount, id]);

    // Split payout trigger
    const commValue = app.commission_amount || 0;
    await creditCommission(app.partner_id, id, commValue, `Admin approved commission app ${app.app_number}`, req.user.id);

    await client.query(`
      INSERT INTO commission_ledger (application_id, partner_id, parent_partner_id, commission_amount, override_amount, status)
      VALUES ($1, $2, $3, $4, $5, 'approved')
    `, [id, app.partner_id, app.parent_partner_id, commValue, commValue * 0.15]);

    // Trigger team override payouts for direct and indirect sponsor partners
    try {
      await processTeamOverrideCommission(id, app.partner_id, commValue);
    } catch (teamErr) {
      logger.error(`Failed to process team override commission for app ${id}:`, teamErr.message);
    }

    await logTimeline(client, id, 'approved', 'Application Approved', 'Approved by Super Admin override.', req.user.id);
    await logAction(req, 'SUPER_ADMIN_APPROVE_APPLICATION', id, { approved_amount });

    await client.query('COMMIT');
    return success(res, {}, 'Application approved and commission split processed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const rejectApplication = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { id, reason } = req.body;
    if (!id) return error(res, 'ID is required', 400);

    const { rows: [app] } = await client.query(`SELECT * FROM applications WHERE id=$1 FOR UPDATE`, [id]);
    if (!app) return notFound(res);

    await client.query(`
      UPDATE applications SET status='rejected', commission_status='cancelled', rejection_reason=$1, updated_at=NOW() WHERE id=$2
    `, [reason || 'Rejected by super admin', id]);

    await logTimeline(client, id, 'rejected', 'Application Rejected', reason || 'Rejected by super admin', req.user.id);
    await logAction(req, 'SUPER_ADMIN_REJECT_APPLICATION', id, { reason });

    await client.query('COMMIT');
    return success(res, {}, 'Application rejected and commission cancelled.');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const reassignApplication = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const id = req.params.id || req.body.id || req.body.application_id;
    let partner_id = req.body.partner_id || req.body.partnerId;
    if (!id || !partner_id) return error(res, 'Application ID and Partner ID are required', 400);

    let targetPartnerId = partner_id;

    if (targetPartnerId === 'self') {
      const { rows: [selfPartner] } = await client.query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (selfPartner) {
        targetPartnerId = selfPartner.id;
      }
    }

    if (targetPartnerId !== 'self' && !isUuid(targetPartnerId)) {
      // Extract UUID if embedded inside string
      const uuidMatch = String(targetPartnerId).match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
      if (uuidMatch) {
        targetPartnerId = uuidMatch[0];
      } else {
        // Try searching partner by partner_code, name, or email
        const cleanStr = String(partner_id).replace(/\s*\([^)]*\)/g, '').trim();
        const codeMatch = String(partner_id).match(/\(([^)]+)\)/);
        const code = codeMatch ? codeMatch[1].trim() : cleanStr;

        const { rows: [found] } = await client.query(`
          SELECT id FROM partner_profiles 
          WHERE (partner_code IS NOT NULL AND LOWER(partner_code) = LOWER($1))
             OR (partner_code IS NOT NULL AND LOWER(partner_code) = LOWER($2))
             OR LOWER(CONCAT(first_name, ' ', last_name)) = LOWER($1) 
             OR LOWER(first_name) = LOWER($1)
          LIMIT 1
        `, [cleanStr, code]);

        if (found) {
          targetPartnerId = found.id;
        } else {
          return error(res, `Target Partner '${partner_id}' not found. Please select a valid partner.`, 400);
        }
      }
    }

    const { rows: [partner] } = await client.query(`SELECT id, first_name, last_name, partner_code FROM partner_profiles WHERE id = $1`, [targetPartnerId]);
    if (!partner) return error(res, 'Target Partner not found', 404);

    await client.query(`
      UPDATE applications SET partner_id = $1, updated_at = NOW() WHERE id = $2
    `, [partner.id, id]);

    await client.query(`
      UPDATE leads SET partner_id = $1, updated_at = NOW()
      WHERE id = $2 OR id IN (SELECT lead_id FROM applications WHERE id = $2 AND lead_id IS NOT NULL)
    `, [partner.id, id]);

    await logTimeline(client, id, 'submitted', 'Reassigned Partner', `Application reassigned to ${partner.first_name} ${partner.last_name || ''} (${partner.partner_code}).`, req.user.id);
    await logAction(req, 'REASSIGN_APPLICATION', id, { target_partner: partner.id });

    await client.query('COMMIT');
    return success(res, {}, 'Application successfully reassigned.');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const manualCommission = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { id, amount, remarks } = req.body;
    if (!id || !amount) return error(res, 'ID and amount are required', 400);

    const { rows: [app] } = await client.query(`SELECT * FROM applications WHERE id=$1 FOR UPDATE`, [id]);
    if (!app) return notFound(res);

    await client.query(`
      UPDATE applications SET commission_amount=$1, commission_status='approved', updated_at=NOW() WHERE id=$2
    `, [amount, id]);

    await creditCommission(app.partner_id, id, amount, remarks || 'Manual commission assignment', req.user.id);

    // Trigger team override payouts for direct and indirect sponsor partners
    try {
      await processTeamOverrideCommission(id, app.partner_id, amount);
    } catch (teamErr) {
      logger.error(`Failed to process team override commission for app ${id}:`, teamErr.message);
    }
    await logTimeline(client, id, app.status, 'Manual Commission Credited', remarks || 'Manual commission override applied.', req.user.id);
    await logAction(req, 'MANUAL_COMMISSION_ASSIGN', id, { amount, remarks });

    await client.query('COMMIT');
    return success(res, {}, 'Manual commission credited to partner.');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// GET /applications — Filtered list
const isUuid = (str) => typeof str === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

const listApplications = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status, partner_id, partner_id: q_partner_id, product_id, search, bank_id, process_by, operation_head_id, operation_head, member_id, category } = req.query;
    const targetPartnerId = q_partner_id || partner_id;
    const targetOpHeadId = isUuid(operation_head_id) ? operation_head_id : (isUuid(operation_head) ? operation_head : null);

    let partnerId = null;
    let userId = null;
    const userRole = (req.user?.role || '').toUpperCase();
    const isPartnerOrTeam = ['PARTNER', 'TEAM_MEMBER'].includes(userRole);

    if (isPartnerOrTeam) {
      const { rows: [partner] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      partnerId = partner ? partner.id : null;
      userId = req.user.id;
    } else if (targetPartnerId && isUuid(targetPartnerId)) {
      partnerId = targetPartnerId;
    } else if (req.query.scope === 'my' && req.user?.id) {
      const { rows: [partner] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      partnerId = partner ? partner.id : null;
      userId = req.user.id;
    }

    const validPartnerId = isUuid(partnerId) ? partnerId : null;
    const validProductId = isUuid(product_id) ? product_id : null;
    const validBankId = isUuid(bank_id) ? bank_id : null;
    const validStatus = status && status.trim() ? status.trim() : null;
    const validSearch = search && search.trim() ? `%${search.trim()}%` : null;
    const validProcessBy = process_by && process_by.trim() ? process_by.trim() : null;
    const validOpHeadId = targetOpHeadId;
    const validUserId = isUuid(userId) ? userId : null;
    const validScope = req.query.scope && req.query.scope.trim() ? req.query.scope.trim() : null;
    const validMemberId = isUuid(member_id) ? member_id : null;
    const validCategory = category && category.trim() ? category.trim() : null;
    const validCommissionStatus = req.query.commission_status && req.query.commission_status.trim() ? req.query.commission_status.trim() : null;

    let opHeadBankFilterSQL = '';
    const userDesignation = (req.user?.designation || '').toUpperCase();
    const isOpHeadUser = ['OPERATIONAL HEAD', 'OPERATIONAL_HEAD', 'BACKEND', 'BACKEND OPERATION', 'BACKEND_OPERATION', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_OPERATOR'].includes(userDesignation);
    if (!isPartnerOrTeam && req.user?.id) {
      const { rows: abRows } = await query(`SELECT bank_id FROM admin_bank_assignments WHERE admin_id = $1`, [req.user.id]);
      if (isOpHeadUser || abRows.length > 0) {
        opHeadBankFilterSQL = ` AND (combined.bank_id IN (SELECT bank_id FROM admin_bank_assignments WHERE admin_id = '${req.user.id}') OR combined.operation_head_id = '${req.user.id}')`;
      }
    }

    const partnerTeamScopeSQL = `
      WHERE (
        ($11::boolean = false AND ($1::uuid IS NULL OR combined.partner_id IN (
          SELECT $1::uuid UNION SELECT $8::uuid 
          UNION SELECT id FROM partner_profiles WHERE parent_partner_id = $1::uuid OR referred_by_id = $1::uuid OR parent_partner_id = $8::uuid OR referred_by_id = $8::uuid
          UNION SELECT child_partner_id FROM partner_team_relationships WHERE parent_partner_id = $1::uuid OR sponsor_id = $1::uuid OR parent_partner_id = $8::uuid OR sponsor_id = $8::uuid
          UNION SELECT id FROM partner_profiles WHERE user_id = $8::uuid
        )))
        OR ($11::boolean = true AND (
          combined.partner_id IN (
            SELECT $1::uuid UNION SELECT $8::uuid 
            UNION SELECT id FROM partner_profiles WHERE parent_partner_id = $1::uuid OR referred_by_id = $1::uuid OR parent_partner_id = $8::uuid OR referred_by_id = $8::uuid
            UNION SELECT child_partner_id FROM partner_team_relationships WHERE parent_partner_id = $1::uuid OR sponsor_id = $1::uuid OR parent_partner_id = $8::uuid OR sponsor_id = $8::uuid
            UNION SELECT id FROM partner_profiles WHERE user_id = $8::uuid OR user_id = $1::uuid
          )
          OR combined.submitted_by = $8::uuid
          OR combined.submitted_by IN (
            SELECT user_id FROM partner_profiles WHERE parent_partner_id = $1::uuid OR referred_by_id = $1::uuid
            UNION SELECT u.id FROM users u WHERE u.created_by = $8::uuid
          )
        ))
      )
    `;

    const queryParams = [validPartnerId, validStatus, validProductId, validBankId, validSearch, limit, offset, validUserId, validProcessBy, validOpHeadId, isPartnerOrTeam, validScope, validMemberId, validCategory, validCommissionStatus];

    const { rows } = await query(`
      SELECT * FROM (
        SELECT 
          a.id,
          a.app_number,
          a.status::text,
          a.loan_amount,
          a.approved_amount,
          a.commission_amount,
          a.commission_status::text,
          a.created_at,
          a.updated_at,
          a.bank_ref_number,
          a.submitted_at,
          a.approved_at,
          a.commission_received_at,
          a.commission_paid_at,
          a.submitted_by,
          COALESCE(NULLIF(su.full_name, ''), NULLIF(TRIM(CONCAT(ap.first_name, ' ', COALESCE(ap.last_name, ''))), ''), su.email, 'Team Member') as submitted_by_name,
          COALESCE(a.process_type, a.source, 'lead_punching') as process_by,
          a.process_type,
          COALESCE(NULLIF(l.customer_name, ''), NULLIF(c.full_name, ''), 'Customer') as customer_name,
          COALESCE(NULLIF(l.mobile, ''), NULLIF(l.customer_mobile, ''), c.mobile) as customer_mobile,
          c.email as customer_email,
          c.pan_number,
          COALESCE(l.city, c.city) as city,
          c.state,
          c.employment_type,
          c.monthly_income,
          p.name as product_name,
          p.category::text as category,
          b.name as bank_name,
          b.short_code as bank_code,
          ap.partner_code,
          ap.first_name as partner_first_name,
          ap.last_name as partner_last_name,
          a.partner_id,
          a.product_id,
          p.bank_id,
          COALESCE(p.operation_head_id, b.operation_head_id) as operation_head_id,
          oh.full_name as operation_head_name
        FROM applications a
        LEFT JOIN leads l ON l.id = a.lead_id
        LEFT JOIN customers c ON c.id = a.customer_id
        LEFT JOIN products p ON p.id = a.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        LEFT JOIN partner_profiles ap ON ap.id = a.partner_id
        LEFT JOIN users su ON su.id = a.submitted_by
        LEFT JOIN users oh ON oh.id = COALESCE(p.operation_head_id, b.operation_head_id)
      ) combined
      ${partnerTeamScopeSQL}
        AND (
          $2::text IS NULL
          OR combined.status = $2
          OR ($2 = 'pending' AND combined.status IN ('pending', 'lead_created', 'new', 'draft', 'initiated', 'link_sent', 'confirmed', 'link_pending'))
          OR ($2 = 'details_submitted' AND combined.status IN ('details_submitted', 'submitted', 'bank_form_submitted'))
          OR ($2 = 'operational_verified' AND combined.status IN ('operational_verified', 'under_review', 'under review', 'verification', 'in_process', 'in_progress', 'vkyc_pending', 'vkyc_completed'))
          OR ($2 = 'approved' AND combined.status IN ('approved', 'sanctioned', 'super_admin_approved', 'disbursed'))
          OR ($2 = 'commission_received' AND combined.status IN ('commission_received', 'commission_released', 'released', 'credited', 'paid'))
          OR ($2 = 'rejected' AND combined.status IN ('rejected', 'declined', 'decline', 'technical_error'))
          OR ($2 = 'cancelled' AND combined.status IN ('cancelled', 'cancel', 'canceled'))
        )
        AND ($3::uuid IS NULL OR combined.product_id = $3)
        AND ($4::uuid IS NULL OR combined.bank_id = $4)
        AND ($5::text IS NULL OR (combined.app_number ILIKE $5 OR combined.customer_name ILIKE $5 OR combined.customer_mobile ILIKE $5))
        AND ($9::text IS NULL OR combined.process_by = $9 OR combined.submitted_by::text = $9)
        AND ($10::uuid IS NULL OR combined.operation_head_id = $10::uuid)
        AND (
          $12::text IS NULL OR $12::text = ''
          OR ($12::text = 'my' AND (combined.submitted_by = $8::uuid OR (combined.partner_id = $1::uuid AND (combined.submitted_by IS NULL OR combined.submitted_by = $8::uuid))))
          OR ($12::text = 'team' AND NOT (combined.submitted_by = $8::uuid OR (combined.partner_id = $1::uuid AND (combined.submitted_by IS NULL OR combined.submitted_by = $8::uuid))))
        )
        AND ($13::uuid IS NULL OR combined.submitted_by = $13::uuid OR combined.partner_id IN (SELECT id FROM partner_profiles WHERE user_id = $13::uuid OR id = $13::uuid))
        AND (
          $14::text IS NULL OR $14::text = '' OR $14::text = 'all'
          OR ($14::text = 'credit_card' AND (LOWER(combined.category::text) LIKE '%credit%' OR LOWER(combined.category::text) LIKE '%card%'))
          OR ($14::text = 'personal_loan' AND (LOWER(combined.category::text) LIKE '%personal%'))
          OR ($14::text = 'business_loan' AND (LOWER(combined.category::text) LIKE '%business%'))
          OR ($14::text = 'insurance' AND (LOWER(combined.category::text) LIKE '%insurance%'))
          OR ($14::text = 'utility' AND (LOWER(combined.category::text) LIKE '%utilit%' OR LOWER(combined.category::text) LIKE '%recharge%'))
          OR (LOWER(combined.category::text) = LOWER($14::text))
        )
        AND (
          $15::text IS NULL OR $15::text = '' OR $15::text = 'all'
          OR combined.commission_status = $15::text
          OR ($15::text = 'released' AND combined.commission_status IN ('released', 'credited', 'paid', 'approved', 'commission_released'))
          OR ($15::text = 'pending' AND combined.commission_status IN ('pending', 'unpaid', 'due', 'initiated'))
        )
        ${opHeadBankFilterSQL}
      ORDER BY combined.created_at DESC
      LIMIT $6 OFFSET $7
    `, queryParams);

    // Count query with same filter
    const countQueryParams = [validPartnerId, validStatus, validProductId, validBankId, validSearch, validProcessBy, validOpHeadId, validUserId, isPartnerOrTeam, validScope, validMemberId, validCategory, validCommissionStatus];

    const countScopeSQL = `
      WHERE (
        ($9::boolean = false AND ($1::uuid IS NULL OR combined.partner_id IN (
          SELECT $1::uuid UNION SELECT $8::uuid 
          UNION SELECT id FROM partner_profiles WHERE parent_partner_id = $1::uuid OR referred_by_id = $1::uuid OR parent_partner_id = $8::uuid OR referred_by_id = $8::uuid
          UNION SELECT child_partner_id FROM partner_team_relationships WHERE parent_partner_id = $1::uuid OR sponsor_id = $1::uuid OR parent_partner_id = $8::uuid OR sponsor_id = $8::uuid
          UNION SELECT id FROM partner_profiles WHERE user_id = $8::uuid
        )))
        OR ($9::boolean = true AND (
          combined.partner_id IN (
            SELECT $1::uuid UNION SELECT $8::uuid 
            UNION SELECT id FROM partner_profiles WHERE parent_partner_id = $1::uuid OR referred_by_id = $1::uuid OR parent_partner_id = $8::uuid OR referred_by_id = $8::uuid
            UNION SELECT child_partner_id FROM partner_team_relationships WHERE parent_partner_id = $1::uuid OR sponsor_id = $1::uuid OR parent_partner_id = $8::uuid OR sponsor_id = $8::uuid
            UNION SELECT id FROM partner_profiles WHERE user_id = $8::uuid OR user_id = $1::uuid
          )
          OR combined.submitted_by = $8::uuid
          OR combined.submitted_by IN (
            SELECT user_id FROM partner_profiles WHERE parent_partner_id = $1::uuid OR referred_by_id = $1::uuid
            UNION SELECT u.id FROM users u WHERE u.created_by = $8::uuid
          )
        ))
      )
    `;

    const { rows: [{ count }] } = await query(`
      SELECT COUNT(*) FROM (
        SELECT a.id, a.partner_id, a.status::text, a.commission_status::text, a.product_id, p.bank_id, a.app_number, COALESCE(NULLIF(l.customer_name, ''), NULLIF(c.full_name, ''), 'Customer') as customer_name, COALESCE(NULLIF(l.mobile, ''), NULLIF(l.customer_mobile, ''), c.mobile) as customer_mobile, a.submitted_by, COALESCE(a.process_type, a.source, 'lead_punching') as process_by, COALESCE(p.operation_head_id, b.operation_head_id) as operation_head_id, p.category::text as category
        FROM applications a
        LEFT JOIN leads l ON l.id = a.lead_id
        LEFT JOIN customers c ON c.id = a.customer_id
        LEFT JOIN products p ON p.id = a.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
      ) combined
      ${countScopeSQL}
        AND (
          $2::text IS NULL
          OR combined.status = $2
          OR ($2 = 'pending' AND combined.status IN ('pending', 'lead_created', 'new', 'draft', 'initiated', 'link_sent', 'confirmed', 'link_pending'))
          OR ($2 = 'details_submitted' AND combined.status IN ('details_submitted', 'submitted', 'bank_form_submitted', 'under_review', 'under review', 'verification', 'in_process', 'in_progress'))
          OR ($2 = 'under_review' AND combined.status IN ('under_review', 'under review', 'verification', 'in_progress', 'bank_verification'))
          OR ($2 = 'submitted' AND combined.status IN ('submitted', 'applied', 'bank_form_submitted'))
          OR ($2 = 'super_admin_approved' AND combined.status IN ('super_admin_approved', 'approved', 'disbursed'))
          OR ($2 = 'approved' AND combined.status IN ('approved', 'sanctioned'))
          OR ($2 = 'operational_verified' AND (
            LOWER(combined.status) IN ('approved', 'operational_verified', 'app file generated (approved)', 'approved_by_ops', 'disbursed', 'sanctioned')
            OR LOWER(combined.status) LIKE '%approve%' OR LOWER(combined.status) LIKE '%generated%'
          ))
          OR ($2 = 'disbursed' AND combined.status IN ('disbursed', 'completed', 'paid'))
          OR ($2 = 'rejected' AND combined.status IN ('rejected', 'declined', 'cancelled', 'decline', 'technical_error'))
        )
        AND ($3::uuid IS NULL OR combined.product_id = $3)
        AND ($4::uuid IS NULL OR combined.bank_id = $4)
        AND ($5::text IS NULL OR (combined.app_number ILIKE $5 OR combined.customer_name ILIKE $5 OR combined.customer_mobile ILIKE $5))
        AND ($6::text IS NULL OR combined.process_by = $6 OR combined.submitted_by::text = $6)
        AND ($7::uuid IS NULL OR combined.operation_head_id = $7::uuid)
        AND (
          $10::text IS NULL OR $10::text = ''
          OR ($10::text = 'my' AND (combined.submitted_by = $8::uuid OR (combined.partner_id = $1::uuid AND (combined.submitted_by IS NULL OR combined.submitted_by = $8::uuid))))
          OR ($10::text = 'team' AND NOT (combined.submitted_by = $8::uuid OR (combined.partner_id = $1::uuid AND (combined.submitted_by IS NULL OR combined.submitted_by = $8::uuid))))
        )
        AND ($11::uuid IS NULL OR combined.submitted_by = $11::uuid OR combined.partner_id IN (SELECT id FROM partner_profiles WHERE user_id = $11::uuid OR id = $11::uuid))
        AND (
          $12::text IS NULL OR $12::text = '' OR $12::text = 'all'
          OR ($12::text = 'credit_card' AND (LOWER(combined.category::text) LIKE '%credit%' OR LOWER(combined.category::text) LIKE '%card%'))
          OR ($12::text = 'personal_loan' AND (LOWER(combined.category::text) LIKE '%personal%'))
          OR ($12::text = 'business_loan' AND (LOWER(combined.category::text) LIKE '%business%'))
          OR ($12::text = 'insurance' AND (LOWER(combined.category::text) LIKE '%insurance%'))
          OR ($12::text = 'utility' AND (LOWER(combined.category::text) LIKE '%utilit%' OR LOWER(combined.category::text) LIKE '%recharge%'))
          OR (LOWER(combined.category::text) = LOWER($12::text))
        )
        AND (
          $13::text IS NULL OR $13::text = '' OR $13::text = 'all'
          OR combined.commission_status = $13::text
          OR ($13::text = 'released' AND combined.commission_status IN ('released', 'credited', 'paid', 'approved', 'commission_released'))
          OR ($13::text = 'pending' AND combined.commission_status IN ('pending', 'unpaid', 'due', 'initiated'))
        )
        ${opHeadBankFilterSQL}
    `, countQueryParams);

    // Compute real-time canonical status counts directly from applications table
    const { rows: statusCountsRows } = await query(`
      SELECT status, COUNT(*)::int as count 
      FROM applications 
      GROUP BY status
    `);
    const statusCountsObj = {
      pending: 0,
      details_submitted: 0,
      operational_verified: 0,
      approved: 0,
      commission_received: 0,
      rejected: 0,
      cancelled: 0
    };

    for (const r of statusCountsRows) {
      const s = String(r.status || '').toLowerCase();
      const cnt = parseInt(r.count) || 0;

      if (['pending', 'lead_created', 'new', 'draft', 'initiated', 'link_sent', 'confirmed', 'link_pending'].includes(s)) {
        statusCountsObj.pending += cnt;
      } else if (['details_submitted', 'submitted', 'bank_form_submitted'].includes(s)) {
        statusCountsObj.details_submitted += cnt;
      } else if (['operational_verified', 'under_review', 'under review', 'verification', 'in_process', 'in_progress', 'vkyc_pending', 'vkyc_completed'].includes(s)) {
        statusCountsObj.operational_verified += cnt;
      } else if (['approved', 'sanctioned', 'super_admin_approved', 'disbursed'].includes(s)) {
        statusCountsObj.approved += cnt;
      } else if (['commission_received', 'commission_released', 'released', 'credited', 'paid'].includes(s)) {
        statusCountsObj.commission_received += cnt;
      } else if (['rejected', 'declined', 'decline', 'technical_error'].includes(s)) {
        statusCountsObj.rejected += cnt;
      } else if (['cancelled', 'cancel', 'canceled'].includes(s)) {
        statusCountsObj.cancelled += cnt;
      } else {
        statusCountsObj[s] = (statusCountsObj[s] || 0) + cnt;
      }
    }

    statusCountsObj.all = (statusCountsObj.pending || 0) +
      (statusCountsObj.details_submitted || 0) +
      (statusCountsObj.operational_verified || 0) +
      (statusCountsObj.approved || 0) +
      (statusCountsObj.commission_received || 0) +
      (statusCountsObj.rejected || 0) +
      (statusCountsObj.cancelled || 0);

    return res.status(200).json({
      success: true,
      message: 'Success',
      data: rows,
      pagination: {
        total: parseInt(count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(count) / limit),
      },
      status_counts: statusCountsObj,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

// GET /applications/:id — Single application detail
const getApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Safety check for dynamic columns on customers & applications
    try {
      await query(`
        ALTER TABLE customers 
          ADD COLUMN IF NOT EXISTS address TEXT,
          ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS father_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS marital_status VARCHAR(100),
          ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
          ADD COLUMN IF NOT EXISTS designation VARCHAR(255),
          ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20),
          ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(15,2);
        ALTER TABLE applications
          ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(50),
          ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
          ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20),
          ADD COLUMN IF NOT EXISTS dob DATE,
          ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(15,2),
          ADD COLUMN IF NOT EXISTS monthly_salary DECIMAL(15,2),
          ADD COLUMN IF NOT EXISTS employment_type VARCHAR(100),
          ADD COLUMN IF NOT EXISTS occupation VARCHAR(100),
          ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS city VARCHAR(100),
          ADD COLUMN IF NOT EXISTS state VARCHAR(100),
          ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
          ADD COLUMN IF NOT EXISTS address TEXT,
          ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS father_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS marital_status VARCHAR(100),
          ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
          ADD COLUMN IF NOT EXISTS designation VARCHAR(255),
          ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20);
        ALTER TABLE leads
          ADD COLUMN IF NOT EXISTS employment_type VARCHAR(100),
          ADD COLUMN IF NOT EXISTS occupation VARCHAR(100),
          ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
      `);
    } catch (_) {}

    const { rows: [app] } = await query(`
      SELECT a.*, 
        COALESCE(NULLIF(a.customer_name, ''), NULLIF(l.customer_name, ''), NULLIF(c.full_name, ''), 'Customer') as customer_name,
        COALESCE(NULLIF(a.customer_mobile, ''), NULLIF(l.mobile, ''), NULLIF(l.customer_mobile, ''), c.mobile) as customer_mobile,
        COALESCE(NULLIF(a.customer_email, ''), NULLIF(c.email, ''), NULLIF(l.email, '')) as customer_email,
        COALESCE(NULLIF(a.pan_number, ''), NULLIF(c.pan_number, ''), NULLIF(l.pan_number, '')) as pan_number,
        COALESCE(NULLIF(a.dob::text, ''), NULLIF(c.dob::text, '')) as dob,
        COALESCE(a.monthly_income, a.monthly_salary, c.monthly_income, l.monthly_income, a.loan_amount) as monthly_income,
        COALESCE(NULLIF(a.employment_type, ''), NULLIF(c.employment_type, ''), NULLIF(l.employment_type, ''), NULLIF(a.occupation, ''), NULLIF(c.occupation, '')) as employment_type,
        COALESCE(NULLIF(a.company_name, ''), NULLIF(c.employer, ''), NULLIF(c.company_name, ''), NULLIF(l.company_name, '')) as company_name,
        COALESCE(NULLIF(a.city, ''), NULLIF(l.city, ''), NULLIF(c.city, '')) as city,
        COALESCE(NULLIF(a.state, ''), NULLIF(c.state, ''), NULLIF(l.state, '')) as state,
        COALESCE(NULLIF(a.pincode, ''), NULLIF(c.pincode, ''), NULLIF(l.pincode, '')) as pincode,
        COALESCE(a.address, c.address) as address,
        COALESCE(a.mother_name, c.mother_name) as mother_name,
        COALESCE(a.father_name, c.father_name) as father_name,
        COALESCE(c.marital_status, a.marital_status) as marital_status,
        COALESCE(c.gender, a.gender) as gender,
        COALESCE(c.aadhaar_number, a.aadhaar_number) as aadhaar_number,
        COALESCE(a.designation, c.designation) as designation,
        p.name as product_name, p.category, p.features, p.commission_type, p.commission_value,
        b.name as bank_name, b.short_code as bank_code,
        ap.partner_code, ap.first_name as Partner_first_name, ap.last_name as Partner_last_name
      FROM applications a
      LEFT JOIN leads l ON l.id = a.lead_id
      LEFT JOIN customers c ON c.id = a.customer_id
      LEFT JOIN products p ON p.id = a.product_id
      LEFT JOIN banks b ON b.id = p.bank_id
      LEFT JOIN partner_profiles ap ON ap.id = a.partner_id
      WHERE a.id::text = $1 OR a.app_number = $1 OR a.tracking_token = $1
    `, [id]);
    if (!app) return notFound(res);

    if (req.user.role === 'PARTNER') {
      const { rows: [partner] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (!partner || app.partner_id !== partner.id) {
        return forbidden(res, 'Access denied. You do not own this application.');
      }
    }

    const notes = await getFilteredNotes(app.id, req.user.role);
    app.notes_list = notes;

    const { rows: [pd] } = await query(`SELECT * FROM physical_application_details WHERE application_id = $1 OR application_id::text = $2`, [app.id, id]);
    app.physical_details = pd || {};
    if (pd) {
      if (!app.appcode_status && pd.appcode_status) app.appcode_status = pd.appcode_status;
      if (!app.soft_approval_status && pd.soft_approval_status) app.soft_approval_status = pd.soft_approval_status;
      if (!app.vkyc_stage && pd.vkyc_stage) app.vkyc_stage = pd.vkyc_stage;
      if (!app.iqa_stage && pd.iqa_stage) app.iqa_stage = pd.iqa_stage;
      if (!app.dispatch_status && pd.dispatch_status) app.dispatch_status = pd.dispatch_status;
      if (!app.final_status && pd.final_status) app.final_status = pd.final_status;
      if (!app.final_status && app.status) app.final_status = app.status;
      if (!app.bank_ref_number && pd.bank_application_number) app.bank_ref_number = pd.bank_application_number;
      if (!app.bank_application_number && pd.bank_application_number) app.bank_application_number = pd.bank_application_number;
      if (!app.dob && pd.dob) app.dob = pd.dob;
      if (!app.employment_type && pd.employment_type) app.employment_type = pd.employment_type;
      if (!app.monthly_income && pd.monthly_income) app.monthly_income = pd.monthly_income;
      if (!app.company_name && pd.company_name) app.company_name = pd.company_name;
      if (!app.city && pd.city) app.city = pd.city;
      if (!app.state && pd.state) app.state = pd.state;
      if (!app.pincode && pd.pincode) app.pincode = pd.pincode;
      if (!app.pan_number && pd.pan_number) app.pan_number = pd.pan_number;
      if (!app.customer_name && pd.full_name) app.customer_name = pd.full_name;
      if (!app.customer_mobile && pd.mobile) app.customer_mobile = pd.mobile;
      if (!app.customer_email && pd.email) app.customer_email = pd.email;
    }

    return success(res, app);
  } catch (err) {
    next(err);
  }
};

// POST /applications/:id/documents — Upload docs
const uploadApplicationDoc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { doc_type } = req.body;
    const file = req.file;
    if (!file) return error(res, 'No file uploaded');

    const isS3Configured = !!process.env.AWS_S3_BUCKET;
    if (!isS3Configured) {
      return error(res, 'S3 bucket is not configured.', 503);
    }

    const { rows: [app] } = await query(`SELECT partner_id FROM applications WHERE id = $1`, [id]);
    if (!app) return notFound(res);

    if (req.user.role === 'PARTNER') {
      const { rows: [partner] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (!partner || app.partner_id !== partner.id) {
        return forbidden(res, 'Access denied. You do not own this application.');
      }
    }

    const { url } = await uploadToS3(file.buffer, file.originalname, `applications/${id}`);

    // Insert into application_documents
    await query(`
      INSERT INTO application_documents (application_id, document_type, file_url, status)
      VALUES ($1, $2, $3, 'pending')
    `, [id, doc_type, url]);

    await logTimeline(query, id, 'submitted', 'Document Uploaded', `Uploaded ${doc_type} copy.`, req.user.id);

    return success(res, { url }, 'Document uploaded successfully');
  } catch (err) {
    next(err);
  }
};

// POST /applications/:id/send-link — Send secure upload link to customer
const sendUploadLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { v4: uuidv4 } = require('uuid');
    const { sendUploadReminderSms, sendSms } = require('../../services/sms/sms.service');
    const { sendEmail } = require('../../services/email/email.service');

    let appRes = await query(`
      SELECT a.*, c.full_name as customer_name, c.mobile as customer_mobile, c.email as customer_email,
             p.name as product_name, b.name as bank_name
      FROM applications a
      JOIN customers c ON a.customer_id = c.id
      LEFT JOIN products p ON a.product_id = p.id
      LEFT JOIN banks b ON p.bank_id = b.id
      WHERE a.id = $1
    `, [id]);

    if (appRes.rows.length === 0) {
      appRes = await query(`
        SELECT bca.*, bca.full_name as customer_name, bca.mobile as customer_mobile, bca.email as customer_email,
               bca.app_number, bca.bank_name, bca.card_name as product_name, bca.id as customer_id
        FROM bank_card_applications bca
        WHERE bca.id = $1
      `, [id]);
    }

    if (appRes.rows.length === 0) return notFound(res, 'Application not found');
    const app = appRes.rows[0];

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    await query(`
      INSERT INTO customer_access_tokens (application_id, customer_id, token, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [id, app.customer_id, token, expiresAt]);

    const baseUrl = process.env.FRONTEND_URL || 'https://gharkapaisa.in';
    const uploadUrl = `${baseUrl}/customer/upload/${token}`;

    await query(`
      UPDATE applications SET status = 'link_sent', updated_at = NOW() WHERE id = $1
    `, [id]);

    const smsText = `Dear ${app.customer_name}, please complete your application #${app.app_number} by uploading required documents: ${uploadUrl} - Thanks, GharKaPaisa`;
    await sendUploadReminderSms(app.customer_mobile, app.customer_name, app.app_number, uploadUrl).catch(() => sendSms(app.customer_mobile, smsText));

    if (app.customer_email) {
      await sendEmail({
        to: app.customer_email,
        subject: `Action Required: Complete Document Upload for Application #${app.app_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2>Complete Your Application - GharKaPaisa</h2>
            <p>Dear <strong>${app.customer_name}</strong>,</p>
            <p>Please upload your required documents for your <strong>${app.product_name || 'Loan'}</strong> application with <strong>${app.bank_name || 'Bank'}</strong>.</p>
            <p style="margin: 24px 0;">
              <a href="${uploadUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Upload Documents Now</a>
            </p>
            <p><small>This secure link will expire in 72 hours.</small></p>
          </div>
        `
      }).catch(err => logger.warn('Email send failed:', err.message));
    }

    await query(`
      INSERT INTO application_timeline (application_id, event_type, title, description, actor_type, actor_id)
      VALUES ($1, 'link_sent', 'Link Sent', $2, 'admin', $3)
    `, [id, `Document upload link sent to customer (${app.customer_mobile})`, req.user ? req.user.id : null]);

    return success(res, { token, uploadUrl, expiresAt }, 'Upload link sent to customer successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /applications/:id/documents/:docId/verify — Admin approve or reject document
const verifyDocument = async (req, res, next) => {
  try {
    const { id, docId } = req.params;
    const { status, rejection_reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return error(res, 'Invalid verification status. Must be approved or rejected', 400);
    }

    const docRes = await query(`
      SELECT * FROM application_documents WHERE id = $1 AND application_id = $2
    `, [docId, id]);
    if (docRes.rows.length === 0) return notFound(res, 'Document not found');

    const doc = docRes.rows[0];

    await query(`
      UPDATE application_documents 
      SET status = $1, rejection_reason = $2, verified_by = $3, verified_at = NOW()
      WHERE id = $4
    `, [status, status === 'rejected' ? (rejection_reason || 'Document verification rejected') : null, req.user ? req.user.id : null, docId]);

    const docLabel = doc.document_type.replace(/_/g, ' ').toUpperCase();

    const eventType = status === 'approved' ? 'document_approved' : 'document_rejected';
    const title = `${docLabel} ${status.toUpperCase()}`;
    const desc = status === 'approved'
      ? `${docLabel} verified and approved by admin`
      : `${docLabel} rejected. Reason: ${rejection_reason || 'Image blurred / Invalid document'}`;

    await query(`
      INSERT INTO application_timeline (application_id, event_type, title, description, actor_type, actor_id)
      VALUES ($1, $2, $3, $4, 'admin', $5)
    `, [id, eventType, title, desc, req.user ? req.user.id : null]);

    if (status === 'rejected') {
      const { sendSms } = require('../../services/sms/sms.service');
      const appRes = await query(`
        SELECT a.app_number, c.mobile, c.full_name 
        FROM applications a JOIN customers c ON a.customer_id = c.id WHERE a.id = $1
      `, [id]);
      if (appRes.rows.length > 0) {
        const cust = appRes.rows[0];
        const smsMsg = `Dear ${cust.full_name}, your ${docLabel} for App #${cust.app_number} was rejected (${rejection_reason || 'Blurred/Invalid'}). Please re-upload via your secure link. Thanks, GharKaPaisa`;
        await sendSms(cust.mobile, smsMsg);
      }
    }

    return success(res, null, `Document ${status} successfully`);
  } catch (err) {
    next(err);
  }
};

// PUT /applications/:id/verification-complete — Admin complete verification
const markVerificationComplete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const unapprovedRes = await query(`
      SELECT id, document_type FROM application_documents 
      WHERE application_id = $1 AND is_latest = TRUE AND status != 'approved'
    `, [id]);

    if (unapprovedRes.rows.length > 0) {
      const pendingTypes = unapprovedRes.rows.map(d => d.document_type.replace(/_/g, ' ').toUpperCase()).join(', ');
      return error(res, `Cannot complete verification. Unapproved documents remaining: ${pendingTypes}`, 400);
    }

    await query(`
      UPDATE applications SET status = 'verification_completed', updated_at = NOW() WHERE id = $1
    `, [id]);

    await query(`
      INSERT INTO application_timeline (application_id, event_type, title, description, actor_type, actor_id)
      VALUES ($1, 'verification_completed', 'Verification Completed', 'All customer documents verified and approved. Sent to Bank for processing.', 'admin', $2)
    `, [id, req.user ? req.user.id : null]);

    return success(res, null, 'Application verification completed successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /applications/:id/bank-status — Update bank review / approval status & SBI Physical Form fields
const updateBankProcessingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      status, bank_ref_number, rejection_reason, approved_amount,
      appcode_status, soft_approval_status, vkyc_stage, iqa_stage, dispatch_status,
      bank_remark, final_status, decline_reason, eligible_reqd,
      // Form 1 Customer Application Details
      customer_mobile, customer_name, dob, customer_email, pan_number,
      company_name, designation, address, company_address, mother_name, vkyc_url
    } = req.body;

    const validStatuses = ['under_review', 'approved', 'rejected', 'disbursed', 'in_process', 'app_file_generated', 'decline', 'technical_error'];
    const currentStatus = (status && validStatuses.includes(status)) ? status : 'under_review';

    const parsedAmount = (approved_amount !== undefined && approved_amount !== '' && approved_amount !== null && !isNaN(approved_amount))
      ? parseFloat(approved_amount)
      : null;

    const userRole = (req.user?.role || '').toUpperCase();
    
    // Backend RBAC enforcement: Final Status & Approval updates restricted to OPERATIONS_HEAD, ADMIN, SUPER_ADMIN, ADMINISTRATIVE_OPERATOR
    if (final_status && !['OPERATIONS_HEAD', 'ADMIN', 'SUPER_ADMIN', 'ADMINISTRATIVE_OPERATOR'].includes(userRole)) {
      return forbidden(res, 'Access denied. Only Operation Head, Admin, Super Admin, or Administrative Operator can update Final Status.');
    }

    let appRes = await query(`
      SELECT a.*, p.category as product_category 
      FROM applications a
      LEFT JOIN products p ON p.id = a.product_id
      WHERE a.id = $1
    `, [id]);

    if (appRes.rows.length === 0) {
      const bankCardRes = await query(`SELECT * FROM bank_card_applications WHERE id = $1`, [id]);
      if (bankCardRes.rows.length > 0) {
        await query(`
          UPDATE bank_card_applications 
          SET status = $1, 
              bank_ref_number = COALESCE($2, bank_ref_number), 
              rejection_reason = COALESCE($3, rejection_reason), 
              approved_amount = COALESCE($4, approved_amount),
              appcode_status = COALESCE($5, appcode_status),
              soft_approval_status = COALESCE($6, soft_approval_status),
              vkyc_stage = COALESCE($7, vkyc_stage),
              iqa_stage = COALESCE($8, iqa_stage),
              dispatch_status = COALESCE($9, dispatch_status),
              bank_remark = COALESCE($10, bank_remark),
              final_status = COALESCE($11, final_status),
              decline_reason = COALESCE($12, decline_reason),
              eligible_reqd = COALESCE($13, eligible_reqd),
              customer_mobile = COALESCE($14, customer_mobile, mobile),
              customer_name = COALESCE($15, customer_name, full_name),
              dob = COALESCE($16, dob),
              customer_email = COALESCE($17, customer_email, email),
              pan_number = COALESCE($18, pan_number),
              company_name = COALESCE($19, company_name),
              designation = COALESCE($20, designation),
              address = COALESCE($21, address),
              company_address = COALESCE($22, company_address),
              mother_name = COALESCE($23, mother_name),
              vkyc_url = COALESCE($24, vkyc_url),
              updated_at = NOW()
          WHERE id = $25
        `, [
          currentStatus, bank_ref_number || null, rejection_reason || decline_reason || null, parsedAmount,
          appcode_status || null, soft_approval_status || null, vkyc_stage || null, iqa_stage || null,
          dispatch_status || null, bank_remark || null, final_status || null, decline_reason || null,
          eligible_reqd || null, customer_mobile || null, customer_name || null, dob || null,
          customer_email || null, pan_number || null, company_name || null, designation || null,
          address || null, company_address || null, mother_name || null, vkyc_url || null, id
        ]);

        await query(`
          INSERT INTO application_timeline (application_id, event_type, title, description, actor_type, actor_id)
          VALUES ($1, $2, $3, $4, 'admin', $5)
        `, [id, currentStatus, `Bank Processing Update (${finalStatus || currentStatus.toUpperCase()})`, `Status & Form details updated. Remark: ${bank_remark || 'N/A'}`, req.user ? req.user.id : null]).catch(() => {});

        return success(res, null, `Application status & Form details updated successfully`);
      }
      return notFound(res, 'Application not found');
    }

    const app = appRes.rows[0];

    await query(`
      UPDATE applications 
      SET status = $1, 
          bank_ref_number = COALESCE($2, bank_ref_number), 
          rejection_reason = COALESCE($3, rejection_reason), 
          approved_amount = COALESCE($4, approved_amount),
          appcode_status = COALESCE($5, appcode_status),
          soft_approval_status = COALESCE($6, soft_approval_status),
          vkyc_stage = COALESCE($7, vkyc_stage),
          iqa_stage = COALESCE($8, iqa_stage),
          dispatch_status = COALESCE($9, dispatch_status),
          bank_remark = COALESCE($10, bank_remark),
          final_status = COALESCE($11, final_status),
          decline_reason = COALESCE($12, decline_reason),
          eligible_reqd = COALESCE($13, eligible_reqd),
          dob = COALESCE($14, dob),
          designation = COALESCE($15, designation),
          company_address = COALESCE($16, company_address),
          mother_name = COALESCE($17, mother_name),
          vkyc_url = COALESCE($18, vkyc_url),
          updated_at = NOW()
      WHERE id = $19
    `, [
      currentStatus, bank_ref_number || null, rejection_reason || decline_reason || null, parsedAmount,
      appcode_status || null, soft_approval_status || null, vkyc_stage || null, iqa_stage || null,
      dispatch_status || null, bank_remark || null, final_status || null, decline_reason || null,
      eligible_reqd || null, dob || null, designation || null, company_address || null,
      mother_name || null, vkyc_url || null, id
    ]);

    const titleMap = {
      under_review: 'Bank Reviewing Application',
      approved: 'Application Approved by Bank',
      rejected: 'Application Rejected by Bank',
      disbursed: 'Loan Disbursed',
      app_file_generated: 'App File Generated (Approved)',
      decline: 'Application Declined by Bank',
      in_process: 'Application In Process',
      technical_error: 'Technical Error'
    };

    await query(`
      INSERT INTO application_timeline (application_id, event_type, title, description, actor_type, actor_id)
      VALUES ($1, $2, $3, $4, 'admin', $5)
    `, [id, currentStatus, titleMap[currentStatus] || currentStatus, `Status updated to ${currentStatus}. ${bank_remark ? 'Remark: ' + bank_remark : ''}`, req.user ? req.user.id : null]);

    const category = app.product_category || 'loan';
    const isDisbursed = currentStatus === 'disbursed';
    const isApprovedForNonLoan = (currentStatus === 'approved' || currentStatus === 'app_file_generated') && ['credit_card', 'insurance'].includes(category);

    if ((isDisbursed || isApprovedForNonLoan) && app.commission_amount > 0 && app.partner_id) {
      try {
        await creditCommission(
          app.partner_id,
          app.id,
          app.commission_amount,
          `Approved commission for application ${app.app_number || app.id}`,
          req.user ? req.user.id : null
        );
        await processTeamOverrideCommission(app.id, app.partner_id, app.commission_amount);
        await query(`UPDATE applications SET commission_status = 'approved' WHERE id = $1`, [id]);
      } catch (commErr) {
        logger.error('Failed to credit commission on status change:', commErr);
      }
    }

    return success(res, null, `Application status updated to ${currentStatus}`);
  } catch (err) {
    next(err);
  }
};

// POST /applications/partner-apply — Submit or save draft application from Partner Panel
const submitPartnerApplication = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const {
      product_id,
      full_name,
      country_code = '+91',
      mobile,
      email,
      monthly_salary,
      company_name,
      pincode,
      city,
      state,
      business_type,
      gst_number,
      trade_license_number,
      process_type = 'partner_cell',
      agree_terms = true,
      is_draft = false
    } = req.body;

    if (!product_id) {
      await client.query('ROLLBACK');
      return error(res, 'Product ID is required', 400);
    }

    let partnerId;
    if (req.partner?.id) {
      partnerId = req.partner.id;
    } else if (req.user?.id) {
      const { rows: [p] } = await client.query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) {
        partnerId = p.id;
      } else {
        const partnerCode = 'AG' + String(Math.floor(10000 + Math.random() * 90000));
        const { rows: [newP] } = await client.query(`
          INSERT INTO partner_profiles (user_id, partner_code, first_name, last_name, status, kyc_status)
          VALUES ($1, $2, $3, $4, 'active', 'pending') RETURNING id
        `, [req.user.id, partnerCode, req.user.first_name || 'Partner', req.user.last_name || '']);
        partnerId = newP.id;
      }
    }

    if (!partnerId) {
      await client.query('ROLLBACK');
      return error(res, 'Partner profile not found', 400);
    }

    const { rows: [product] } = await client.query(
      `SELECT p.*, b.name as bank_name FROM products p LEFT JOIN banks b ON b.id = p.bank_id WHERE p.id = $1`,
      [product_id]
    );
    if (!product) {
      await client.query('ROLLBACK');
      return error(res, 'Product not found', 404);
    }

    if (!is_draft) {
      if (!full_name || full_name.trim().length < 2) {
        await client.query('ROLLBACK');
        return error(res, 'Full Name must be at least 2 characters', 400);
      }

      if (!mobile || !/^[6-9]\d{9}$/.test(String(mobile).trim())) {
        await client.query('ROLLBACK');
        return error(res, 'Please provide a valid 10-digit Indian mobile number', 400);
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
        await client.query('ROLLBACK');
        return error(res, 'Please provide a valid email address', 400);
      }

      if (monthly_salary !== undefined && monthly_salary !== null && monthly_salary !== '') {
        const salaryNum = parseFloat(monthly_salary);
        if (isNaN(salaryNum) || salaryNum < 0) {
          await client.query('ROLLBACK');
          return error(res, 'Monthly salary must be a valid non-negative number', 400);
        }

        if (product.min_income && salaryNum > 0 && salaryNum < parseFloat(product.min_income)) {
          await client.query('ROLLBACK');
          return error(res, `Applicant monthly salary ₹${salaryNum.toLocaleString('en-IN')} is below product minimum required ₹${parseFloat(product.min_income).toLocaleString('en-IN')}`, 400);
        }
      }

      if (pincode && !/^\d{6}$/.test(String(pincode).trim())) {
        await client.query('ROLLBACK');
        return error(res, 'Please enter a valid 6-digit postal pincode', 400);
      }

      const validProcesses = ['lead_punching', 'linked_share', 'direct_bank', 'physical_process'];
      if (!validProcesses.includes(process_type)) {
        await client.query('ROLLBACK');
        return error(res, 'Invalid Process Assignment selection. Must be one of: lead_punching, linked_share, direct_bank, physical_process', 400);
      }

      if (!agree_terms) {
        await client.query('ROLLBACK');
        return error(res, 'You must agree to the Terms & Conditions to submit', 400);
      }
    }

    const trimmedMobile = mobile ? String(mobile).trim() : null;
    const trimmedName = full_name ? String(full_name).trim() : 'Draft Customer';
    const trimmedEmail = email ? String(email).trim() : null;

    // Resolve canonical process_by and source metadata
    let processByVal = 'partner';
    let sourceVal = 'partner_portal';
    if (process_type === 'linked_share') {
      processByVal = 'partner';
      sourceVal = 'share_link';
    } else if (process_type === 'direct_bank') {
      processByVal = 'customer';
      sourceVal = 'bank_redirect';
    } else if (process_type === 'physical_process') {
      processByVal = 'partner';
      sourceVal = 'physical';
    } else {
      processByVal = 'partner';
      sourceVal = 'partner_portal';
    }

    // Check duplicate active lead / application (within 30 days)
    if (!is_draft && trimmedMobile && process_type !== 'linked_share') {
      const { rows: [dupApp] } = await client.query(`
        SELECT a.id, a.app_number, a.status
        FROM applications a
        JOIN customers c ON c.id = a.customer_id
        WHERE c.mobile = $1 AND a.product_id = $2
          AND a.created_at >= NOW() - INTERVAL '30 days'
          AND a.status::text NOT IN ('rejected', 'cancelled')
        LIMIT 1
      `, [trimmedMobile, product_id]);

      if (dupApp) {
        await client.query('ROLLBACK');
        return error(res, `A lead or application for mobile ${trimmedMobile} and this product already exists (#${dupApp.app_number}, Status: ${dupApp.status.toUpperCase()}).`, 409);
      }
    }

    let customerId;
    if (trimmedMobile) {
      const { rows: [existingCust] } = await client.query(
        `SELECT id FROM customers WHERE mobile = $1`, [trimmedMobile]
      );

      if (existingCust) {
        customerId = existingCust.id;
        await client.query(`
          UPDATE customers SET 
            full_name = CASE WHEN full_name IS NULL OR full_name = '' OR full_name = 'Draft Customer' THEN COALESCE($1, full_name) ELSE full_name END, 
            email = COALESCE($2, email), 
            monthly_income = COALESCE($3, monthly_income),
            company_name = COALESCE($4, company_name),
            business_type = COALESCE($5, business_type),
            gst_number = COALESCE($6, gst_number),
            trade_license_number = COALESCE($7, trade_license_number),
            city = COALESCE($8, city),
            state = COALESCE($9, state),
            pincode = COALESCE($10, pincode),
            updated_at = NOW() 
          WHERE id = $11
        `, [
          trimmedName, trimmedEmail, monthly_salary || null, company_name || null,
          business_type || null, gst_number || null, trade_license_number || null,
          city || null, state || null, pincode || null, customerId
        ]);
      } else {
        const { rows: [newCust] } = await client.query(`
          INSERT INTO customers 
            (full_name, mobile, email, monthly_income, company_name, business_type, gst_number, trade_license_number, city, state, pincode, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
          RETURNING id
        `, [
          trimmedName, trimmedMobile, trimmedEmail, monthly_salary || null, company_name || null,
          business_type || null, gst_number || null, trade_license_number || null,
          city || null, state || null, pincode || null, req.user.id
        ]);
        customerId = newCust.id;
      }
    } else {
      const { rows: [newCust] } = await client.query(`
        INSERT INTO customers (full_name, email, created_by)
        VALUES ($1, $2, $3) RETURNING id
      `, [trimmedName, trimmedEmail, req.user.id]);
      customerId = newCust.id;
    }

    // Sync into leads table so it appears in CRM leads queue
    let syncedLeadId = null;
    if (trimmedMobile) {
      try {
        await client.query('SAVEPOINT lead_sync_sp');
        const leadNum = 'LEAD-' + Date.now().toString(36).toUpperCase();
        const { rows: [newLead] } = await client.query(`
          INSERT INTO leads (
            lead_number, partner_id, product_id, customer_name, customer_mobile, mobile,
            customer_email, source, status, process_type, process_by, pipeline_stage, customer_id, created_by, otp_verified
          )
          VALUES ($1, $2, $3, $4, $5, $5, $6, $7, 'confirmed', $8, $9, 'submitted', $10, $11, TRUE)
          RETURNING id
        `, [
          leadNum, partnerId, product_id, trimmedName, trimmedMobile,
          trimmedEmail, sourceVal, process_type, processByVal, customerId, req.user.id
        ]);
        syncedLeadId = newLead?.id || null;
        await client.query('RELEASE SAVEPOINT lead_sync_sp');
      } catch (leadErr) {
        await client.query('ROLLBACK TO SAVEPOINT lead_sync_sp').catch(() => {});
        logger.warn('Lead table sync warning:', leadErr.message);
      }
    }

    const commission = await calculatePartnerCommission(product_id, partnerId, monthly_salary || 0);

    const { rows: [{ nextval }] } = await client.query(`SELECT nextval('app_number_seq')`);
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const appNumber = `APP${datePart}${nextval}`;

    const appStatus = process_type === 'direct_bank' ? 'pending' : 'details_submitted';

    const { rows: [app] } = await client.query(`
      INSERT INTO applications
        (app_number, lead_id, customer_id, product_id, partner_id, bank_id, submitted_by, loan_amount, commission_amount,
         status, process_type, process_by, source, business_type, gst_number, trade_license_number, company_name, pincode, city, state, country_code, agree_terms, submitted_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW())
      RETURNING *
    `, [
      appNumber, syncedLeadId, customerId, product_id, partnerId, product.bank_id, req.user.id,
      monthly_salary || 0, commission, appStatus, process_type, processByVal, sourceVal, business_type || null,
      gst_number || null, trade_license_number || null, company_name || null,
      pincode || null, city || null, state || null, country_code, agree_terms,
    ]);

    if (syncedLeadId && app?.id) {
      await client.query(`UPDATE leads SET application_id = $1 WHERE id = $2`, [app.id, syncedLeadId]);
    }

    try {
      await client.query('SAVEPOINT timeline_sp');
      await client.query(`
        INSERT INTO application_timeline (application_id, status, activity, event_type, title, description, actor_type, actor_id)
        VALUES ($1, $2, $3, $4, $5, $6, 'partner', $7)
      `, [
        app.id,
        appStatus,
        'Application Submitted',
        'applied',
        'Application Initiated',
        `Application logged via ${process_type.replace(/_/g, ' ').toUpperCase()}`,
        req.user.id
      ]);
      await client.query('RELEASE SAVEPOINT timeline_sp');
    } catch (timelineErr) {
      await client.query('ROLLBACK TO SAVEPOINT timeline_sp').catch(() => {});
      logger.warn('Timeline insert non-fatal warn:', timelineErr.message);
    }

    // Process specific metadata generation - Priority: products.partner_url is Single Source of Truth
    let shareUrl = null;
    let whatsappUrl = null;
    let bankUrl = null;

    const baseUrl = process.env.FRONTEND_URL || 'https://gharkapaisa.in';

    if (process_type === 'linked_share') {
      const partnerUrl = product.partner_url?.trim() || getBankApplyLinkBackend(product.name, product.bank_name, product);
      if (!partnerUrl) {
        await client.query('ROLLBACK');
        return error(res, `Partner URL (Bank Apply Link) is missing for ${product.name}`, 400);
      }
      shareUrl = partnerUrl;
      const msg = encodeURIComponent(`Hello ${trimmedName},\n\nYou can apply for ${product.name} with ${product.bank_name || 'Bank'} using official partner application link below:\n\n${shareUrl}\n\nThank you,\nGharKaPaisa Team`);
      whatsappUrl = `https://wa.me/91${trimmedMobile}?text=${msg}`;

      const trackingToken = 'SH_' + Math.random().toString(36).substring(2, 12).toUpperCase();
      try {
        await client.query('SAVEPOINT share_link_sp');
        await client.query(`
          INSERT INTO partner_share_links (partner_id, product_id, tracking_token, application_id, lead_id, expires_at)
          VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days')
        `, [partnerId, product_id, trackingToken, app?.id || null, syncedLeadId || null]);
        await client.query('RELEASE SAVEPOINT share_link_sp');
      } catch (shareLinkErr) {
        await client.query('ROLLBACK TO SAVEPOINT share_link_sp').catch(() => {});
        logger.warn('Share link insert non-fatal warn:', shareLinkErr.message);
      }
    } else if (process_type === 'physical_process') {
      const trackingToken = Math.random().toString(36).substring(2, 12);
      shareUrl = `${baseUrl}/physical-application/${trackingToken}`;
      const msg = encodeURIComponent(`Hello ${trimmedName},\n\nPlease fill your required customer details using this link:\n\n${shareUrl}\n\nThank you,\nGharKaPaisa Team`);
      whatsappUrl = `https://wa.me/91${trimmedMobile}?text=${msg}`;

      try {
        await client.query('SAVEPOINT share_link_sp');
        await client.query(`
          INSERT INTO partner_share_links (partner_id, product_id, tracking_token, application_id, lead_id, expires_at)
          VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days')
        `, [partnerId, product_id, trackingToken, app?.id || null, syncedLeadId || null]);
        await client.query('RELEASE SAVEPOINT share_link_sp');
      } catch (shareLinkErr) {
        await client.query('ROLLBACK TO SAVEPOINT share_link_sp').catch(() => {});
        logger.warn('Share link insert non-fatal warn:', shareLinkErr.message);
      }
    } else if (process_type === 'direct_bank') {
      bankUrl = product.partner_url?.trim() || getBankApplyLinkBackend(product.name, product.bank_name, product) || 'https://gharkapaisa.in';
    }

    await client.query('COMMIT');

    if (process_type === 'linked_share' && trimmedMobile && shareUrl) {
      const { sendLinkedShareSms } = require('../../services/sms/sms.service');
      sendLinkedShareSms(trimmedMobile, trimmedName, product.name, shareUrl).catch(err => {
        logger.warn('[SMS] Failed to send linked share SMS:', err.message);
      });
    }

    const { sendEmail } = require('../../services/email/email.service');

    if (trimmedEmail) {
      sendEmail({
        to: trimmedEmail,
        subject: `Application Confirmation - #${appNumber} (${product.name})`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a;">
            <h2 style="color: #f97316;">Application Received - GharKaPaisa</h2>
            <p>Dear <strong>${trimmedName}</strong>,</p>
            <p>Your application for <strong>${product.name}</strong> with <strong>${product.bank_name || 'Bank'}</strong> has been logged by your Partner.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border: 1px solid #e2e8f0;">
              <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Application Number</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">#${appNumber}</td></tr>
              <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Product</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${product.name}</td></tr>
              <tr><td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Process Assignment</td><td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${process_type.replace(/_/g, ' ').toUpperCase()}</td></tr>
            </table>
            <p>Regards,<br><strong>GharKaPaisa Team</strong></p>
          </div>
        `
      }).catch(err => logger.warn('Applicant email trigger failed:', err.message));
    }

    const partnerEmail = req.user.email;
    if (partnerEmail) {
      sendEmail({
        to: partnerEmail,
        subject: `New Lead Logged - #${appNumber} (${trimmedName})`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a;">
            <h2 style="color: #10b981;">New Lead Application Created</h2>
            <p>Hello Partner,</p>
            <p>You have successfully logged a new application for <strong>${trimmedName}</strong>.</p>
            <ul>
              <li><strong>App Number:</strong> #${appNumber}</li>
              <li><strong>Product:</strong> ${product.name}</li>
              <li><strong>Mobile:</strong> ${country_code} ${trimmedMobile}</li>
              <li><strong>Process Assignment:</strong> ${process_type.replace(/_/g, ' ').toUpperCase()}</li>
              <li><strong>Expected Payout:</strong> ₹${parseFloat(commission).toLocaleString('en-IN')}</li>
            </ul>
          </div>
        `
      }).catch(err => logger.warn('Partner email trigger failed:', err.message));
    }

    return success(res, {
      ...app,
      process_type,
      process_by: processByVal,
      source: sourceVal,
      partner_url: shareUrl || product.partner_url || bankUrl || '',
      share_url: shareUrl,
      whatsapp_url: whatsappUrl,
      bank_url: bankUrl
    }, 'Application submitted successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  }
};

// ── PUT /applications/bulk-status — Bulk update status ────────────────
const bulkUpdateStatus = async (req, res, next) => {
  const userRole = (req.user?.role || '').toUpperCase();
  if (['PARTNER', 'TEAM_MEMBER'].includes(userRole)) {
    return error(res, 'Application status changes are reserved for Super Admin and Admin.', 403);
  }
  const client = await getClient();
  try {
    const { ids, status, remarks } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return error(res, 'Application IDs array is required', 400);
    }
    if (!status) return error(res, 'Status is required', 400);

    await client.query('BEGIN');

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    await client.query(
      `UPDATE applications SET status = '${status}', updated_at = NOW() WHERE id IN (${placeholders})`,
      ids
    );

    // Log timeline for each
    const performedBy = req.user?.id;
    for (const id of ids) {
      await logTimeline(client, id, status, 'Bulk status update', remarks || `Status changed to ${status}`, performedBy);
    }

    await client.query('COMMIT');
    await logAction(req, 'BULK_UPDATE_APPLICATION_STATUS', null, { ids, status });

    return success(res, { updated: ids.length, status }, `${ids.length} applications updated to ${status}`);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  }
};

// ── POST /applications/import — CSV bulk import ────────────────────
const importApplications = async (req, res, next) => {
  const client = await getClient();
  try {
    if (!req.file) return error(res, 'CSV file is required', 400);

    const csvData = req.file.buffer.toString('utf-8');
    const lines = csvData.split('\n').filter(l => l.trim());
    if (lines.length < 2) return error(res, 'CSV must have a header row and at least one data row', 400);

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = headers.indexOf('customer_name');
    const mobileIdx = headers.indexOf('mobile');
    const productIdx = headers.indexOf('product_name');

    if (nameIdx === -1 || mobileIdx === -1) {
      return error(res, 'CSV must include columns: customer_name, mobile', 400);
    }

    const PartnerId = req.partner?.id;
    let imported = 0;

    await client.query('BEGIN');

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const customerName = cols[nameIdx] || '';
      const mobile = cols[mobileIdx] || '';
      const productName = productIdx !== -1 ? (cols[productIdx] || '') : '';

      if (!customerName || !mobile) continue;

      const appNumber = generateAppNumber();
      await client.query(
        `INSERT INTO applications (app_number, partner_id, customer_name, customer_mobile, product_name, status, source, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'submitted', 'csv_import', NOW(), NOW())`,
        [appNumber, PartnerId, customerName, mobile, productName]
      );
      imported++;
    }

    await client.query('COMMIT');
    await logAction(req, 'IMPORT_APPLICATIONS_CSV', null, { imported, total_rows: lines.length - 1 });

    return success(res, { imported, total_rows: lines.length - 1 }, `${imported} applications imported successfully`);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  }
};

// ── GET /applications/export/csv — Export applications as CSV ──────
// ── GET /applications/export/csv — Export applications as CSV ──────
const exportApplicationsCSV = async (req, res, next) => {
  try {
    const userRole = (req.user?.role || req.user?.user_role || '').toUpperCase();
    const userId = req.user?.id;
    
    let partnerId = req.partner?.id;
    if (['PARTNER', 'TEAM_MEMBER'].includes(userRole) && !partnerId && userId) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [userId]);
      partnerId = p?.id;
    }

    const isPartnerOrTeam = ['PARTNER', 'TEAM_MEMBER'].includes(userRole);
    const validPartnerId = isUuid(partnerId) ? partnerId : null;
    const validUserId = isUuid(userId) ? userId : null;

    let whereClause = '';
    const params = [validPartnerId, validUserId];

    if (isPartnerOrTeam) {
      whereClause = `
        WHERE (
          combined.partner_id IN (
            SELECT $1::uuid UNION SELECT $2::uuid 
            UNION SELECT id FROM partner_profiles WHERE parent_partner_id = $1::uuid OR referred_by_id = $1::uuid OR parent_partner_id = $2::uuid OR referred_by_id = $2::uuid
            UNION SELECT child_partner_id FROM partner_team_relationships WHERE parent_partner_id = $1::uuid OR sponsor_id = $1::uuid OR parent_partner_id = $2::uuid OR sponsor_id = $2::uuid
            UNION SELECT id FROM partner_profiles WHERE user_id = $2::uuid OR user_id = $1::uuid
          )
          OR combined.submitted_by = $2::uuid
          OR combined.submitted_by IN (
            SELECT user_id FROM partner_profiles WHERE parent_partner_id = $1::uuid OR referred_by_id = $1::uuid
            UNION SELECT u.id FROM users u WHERE u.created_by = $2::uuid
          )
        )
      `;
    }

    const { rows } = await query(`
      SELECT * FROM (
        SELECT 
          a.app_number,
          COALESCE(NULLIF(l.customer_name, ''), NULLIF(c.full_name, ''), 'Customer') as customer_name,
          COALESCE(NULLIF(l.mobile, ''), NULLIF(l.customer_mobile, ''), c.mobile) as customer_mobile,
          COALESCE(NULLIF(su.full_name, ''), NULLIF(TRIM(CONCAT(ap.first_name, ' ', COALESCE(ap.last_name, ''))), ''), su.email, 'Team Member') as submitted_by_name,
          p.name as product_name,
          p.category,
          b.name as bank_name,
          a.status::text,
          a.commission_status::text,
          a.commission_amount,
          COALESCE(a.source, 'partner_punch') as process_by,
          a.created_at,
          a.partner_id,
          a.submitted_by
        FROM applications a
        LEFT JOIN leads l ON l.id = a.lead_id
        LEFT JOIN customers c ON c.id = a.customer_id
        LEFT JOIN products p ON p.id = a.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        LEFT JOIN partner_profiles ap ON ap.id = a.partner_id
        LEFT JOIN users su ON su.id = a.submitted_by

        UNION ALL

        SELECT 
          COALESCE(NULLIF(l.lead_number, ''), CONCAT('LEAD-', UPPER(SUBSTRING(l.id::text, 1, 8)))) as app_number,
          COALESCE(NULLIF(l.customer_name, ''), NULLIF(c.full_name, ''), 'Customer') as customer_name,
          COALESCE(NULLIF(l.mobile, ''), NULLIF(l.customer_mobile, ''), c.mobile) as customer_mobile,
          COALESCE(NULLIF(su.full_name, ''), NULLIF(TRIM(CONCAT(ap.first_name, ' ', COALESCE(ap.last_name, ''))), ''), su.email, 'Team Member') as submitted_by_name,
          p.name as product_name,
          p.category,
          COALESCE(b.name, 'Bank Partner') as bank_name,
          l.status::text,
          'pending'::text as commission_status,
          p.commission_value as commission_amount,
          COALESCE(l.source, 'partner_share') as process_by,
          l.created_at,
          l.partner_id,
          COALESCE(l.created_by, c.created_by) as submitted_by
        FROM leads l
        LEFT JOIN customers c ON c.id = l.customer_id OR (l.customer_id IS NULL AND c.mobile = l.mobile)
        LEFT JOIN products p ON p.id = l.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        LEFT JOIN partner_profiles ap ON ap.id = l.partner_id
        LEFT JOIN users su ON su.id = COALESCE(l.created_by, c.created_by)
        WHERE l.id NOT IN (SELECT lead_id FROM applications WHERE lead_id IS NOT NULL)
      ) combined
      ${whereClause}
      ORDER BY combined.created_at DESC
      LIMIT 10000
    `, params);

    const csvHeaders = ['App / Lead Number', 'Customer Name', 'Mobile', 'Submitted By / Member', 'Product', 'Category', 'Bank', 'Status', 'Commission Status', 'Commission Amount', 'Source', 'Date'];
    const csvLines = [csvHeaders.join(',')];

    for (const row of rows) {
      csvLines.push([
        row.app_number || '',
        `"${(row.customer_name || '').replace(/"/g, '""')}"`,
        row.customer_mobile || '',
        `"${(row.submitted_by_name || '').replace(/"/g, '""')}"`,
        `"${(row.product_name || '').replace(/"/g, '""')}"`,
        `"${(row.category || '').replace(/"/g, '""')}"`,
        `"${(row.bank_name || '').replace(/"/g, '""')}"`,
        row.status || '',
        row.commission_status || '',
        `"₹${row.commission_amount || 0}"`,
        row.process_by || '',
        row.created_at ? new Date(row.created_at).toISOString() : ''
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=applications_export_${Date.now()}.csv`);
    return res.send(csvLines.join('\n'));
  } catch (err) {
    next(err);
  }
};

// PUT /applications/:id — Edit & Update Lead/Application details (Admin, Operation Head, Partner)
const updateApplicationDetails = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const {
      bank_application_number,
      bank_ref_number,
      vkyc_status,
      vkyc_url,
      salary_slip_url,
      pan_card_url,
      monthly_salary,
      pan_number,
      status,
      remarks,
      metadata,
      full_name,
      customer_name,
      mobile,
      customer_mobile,
      email,
      customer_email,
      pincode,
      city,
      state,
      bank_id,
      product_id,
      loan_amount,
      dob,
      employment_type,
      employer,
      company_name,
      designation,
      mother_name,
      address1,
      address2,
      landmark,
      address
    } = req.body;

    // Ensure verification & tracking columns exist on applications, leads, customers, physical_application_details tables
    try {
      await client.query(`
        ALTER TABLE applications 
        ADD COLUMN IF NOT EXISTS address1 TEXT,
        ADD COLUMN IF NOT EXISTS address2 TEXT,
        ADD COLUMN IF NOT EXISTS landmark TEXT,
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS state VARCHAR(100),
        ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
        ADD COLUMN IF NOT EXISTS mother_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(20),
        ADD COLUMN IF NOT EXISTS customer_email VARCHAR(150),
        ADD COLUMN IF NOT EXISTS company_name VARCHAR(200),
        ADD COLUMN IF NOT EXISTS designation VARCHAR(150),
        ADD COLUMN IF NOT EXISTS vkyc_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS vkyc_url TEXT,
        ADD COLUMN IF NOT EXISTS salary_slip_url TEXT,
        ADD COLUMN IF NOT EXISTS pan_card_url TEXT,
        ADD COLUMN IF NOT EXISTS soft_approval_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS vkyc_stage VARCHAR(50),
        ADD COLUMN IF NOT EXISTS iqa_stage VARCHAR(50),
        ADD COLUMN IF NOT EXISTS dispatch_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS bank_remark TEXT,
        ADD COLUMN IF NOT EXISTS final_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS decline_reason TEXT,
        ADD COLUMN IF NOT EXISTS eligible_reqd VARCHAR(50),
        ADD COLUMN IF NOT EXISTS approved_amount DECIMAL(15,2)
      `);
      await client.query(`
        ALTER TABLE leads 
        ADD COLUMN IF NOT EXISTS address1 TEXT,
        ADD COLUMN IF NOT EXISTS address2 TEXT,
        ADD COLUMN IF NOT EXISTS landmark TEXT,
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS state VARCHAR(100),
        ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
        ADD COLUMN IF NOT EXISTS vkyc_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS vkyc_url TEXT
      `);
      await client.query(`
        ALTER TABLE customers
        ADD COLUMN IF NOT EXISTS address1 TEXT,
        ADD COLUMN IF NOT EXISTS address2 TEXT,
        ADD COLUMN IF NOT EXISTS landmark TEXT,
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS state VARCHAR(100),
        ADD COLUMN IF NOT EXISTS pincode VARCHAR(20)
      `);
      await client.query(`
        ALTER TABLE physical_application_details
        ADD COLUMN IF NOT EXISTS address1 TEXT,
        ADD COLUMN IF NOT EXISTS address2 TEXT,
        ADD COLUMN IF NOT EXISTS landmark TEXT,
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS state VARCHAR(100),
        ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
        ADD COLUMN IF NOT EXISTS mother_name VARCHAR(150)
      `);
    } catch (_) {}

    let { rows: [app] } = await client.query(`SELECT * FROM applications WHERE id = $1`, [id]);
    let isLeadOnly = false;
    if (!app) {
      const { rows: [leadRec] } = await client.query(`SELECT * FROM leads WHERE id = $1`, [id]);
      if (leadRec) {
        app = leadRec;
        isLeadOnly = true;
      }
    }

    if (!app) {
      await client.query('ROLLBACK');
      return notFound(res, 'Application or Lead record not found');
    }

    const userRole = (req.user?.role || '').toUpperCase();
    const isRestrictedAdminStatus = ['approved', 'rejected', 'disbursed', 'commission_released', 'super_admin_approved'].includes((status || '').toLowerCase());
    if (['PARTNER', 'TEAM_MEMBER'].includes(userRole) && status && status !== app.status && isRestrictedAdminStatus) {
      await client.query('ROLLBACK');
      return error(res, 'Marking application status as Approved or Rejected is reserved for Super Admin and Operations Head.', 403);
    }

    const appNumToSave = (bank_application_number || bank_ref_number || '').trim();
    const employerToSave = employer || company_name || null;
    const parsedDob = parseDobToIso(dob);

    if (isLeadOnly) {
      const { rows: [updatedLead] } = await client.query(`
        UPDATE leads SET
          vkyc_status = COALESCE(NULLIF($1, ''), vkyc_status),
          vkyc_url = COALESCE(NULLIF($2, ''), vkyc_url),
          status = COALESCE(NULLIF($3, ''), status::text),
          product_id = COALESCE($4, product_id),
          customer_name = COALESCE(NULLIF($5, ''), customer_name),
          city = COALESCE(NULLIF($6, ''), city),
          updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `, [vkyc_status || null, vkyc_url || null, status || null, product_id || null, full_name || null, city || null, id]);

      if (app.mobile || app.customer_id) {
        await client.query(`
          UPDATE customers SET
            full_name = COALESCE(NULLIF($1, ''), full_name),
            mobile = COALESCE(NULLIF($2, ''), mobile),
            email = COALESCE(NULLIF($3, ''), email),
            dob = COALESCE(NULLIF($4, '')::date, dob),
            pan_number = COALESCE(NULLIF($5, ''), pan_number),
            monthly_income = COALESCE($6, monthly_income),
            city = COALESCE(NULLIF($7, ''), city),
            state = COALESCE(NULLIF($8, ''), state),
            pincode = COALESCE(NULLIF($9, ''), pincode),
            employment_type = COALESCE(NULLIF($10, ''), employment_type),
            employer = COALESCE(NULLIF($11, ''), employer),
            updated_at = NOW()
          WHERE id = $12 OR mobile = $13
        `, [
          full_name || null,
          mobile || null,
          email || null,
          parsedDob || null,
          pan_number || null,
          monthly_salary ? parseFloat(monthly_salary) : null,
          city || null,
          state || null,
          pincode || null,
          employment_type || null,
          employerToSave,
          app.customer_id,
          app.mobile
        ]);
      }

      await client.query('COMMIT');
      return success(res, updatedLead, 'Lead details updated successfully');
    }

    // 1. Update applications table
    let targetStatus = status;
    if (targetStatus === 'bank_form_submitted' || targetStatus === 'under_review') {
      targetStatus = 'operational_verified';
    } else if (targetStatus === 'submitted') {
      targetStatus = 'details_submitted';
    }
    if (!targetStatus && (req.body.bank_remark || req.body.final_status || req.body.bank_ref_number)) {
      const fs = String(req.body.final_status || '').toLowerCase();
      targetStatus = (fs.includes('decline') || fs.includes('reject')) ? 'rejected' : 'operational_verified';
    }
    const { rows: [updatedApp] } = await client.query(`
      UPDATE applications SET
        bank_application_number = COALESCE(NULLIF($1, ''), bank_application_number),
        bank_ref_number = COALESCE(NULLIF($1, ''), bank_ref_number),
        vkyc_status = COALESCE(NULLIF($2, ''), vkyc_status),
        vkyc_url = COALESCE(NULLIF($3, ''), vkyc_url),
        salary_slip_url = COALESCE(NULLIF($4, ''), salary_slip_url),
        pan_card_url = COALESCE(NULLIF($5, ''), pan_card_url),
        status = CASE WHEN $6::text IS NOT NULL AND $6::text != '' AND EXISTS (SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'application_status' AND enumlabel = $6::text) THEN $6::text::application_status ELSE status END,
        remarks = COALESCE(NULLIF($7, ''), remarks),
        bank_id = COALESCE($8, bank_id),
        product_id = COALESCE($9, product_id),
        loan_amount = COALESCE($10, loan_amount),
        metadata = COALESCE($11::jsonb, metadata),
        soft_approval_status = COALESCE(NULLIF($12, ''), soft_approval_status),
        vkyc_stage = COALESCE(NULLIF($13, ''), vkyc_stage),
        iqa_stage = COALESCE(NULLIF($14, ''), iqa_stage),
        dispatch_status = COALESCE(NULLIF($15, ''), dispatch_status),
        bank_remark = COALESCE(NULLIF($16, ''), bank_remark),
        final_status = COALESCE(NULLIF($17, ''), final_status),
        decline_reason = COALESCE(NULLIF($18, ''), decline_reason),
        eligible_reqd = COALESCE(NULLIF($19, ''), eligible_reqd),
        approved_amount = COALESCE($20, approved_amount),
        city = COALESCE(NULLIF($21, ''), city),
        state = COALESCE(NULLIF($22, ''), state),
        pincode = COALESCE(NULLIF($23, ''), pincode),
        mother_name = COALESCE(NULLIF($24, ''), mother_name),
        customer_name = COALESCE(NULLIF($25, ''), customer_name),
        customer_mobile = COALESCE(NULLIF($26, ''), customer_mobile),
        customer_email = COALESCE(NULLIF($27, ''), customer_email),
        company_name = COALESCE(NULLIF($28, ''), company_name),
        designation = COALESCE(NULLIF($29, ''), designation),
        address1 = COALESCE(NULLIF($30, ''), address1),
        address2 = COALESCE(NULLIF($31, ''), address2),
        landmark = COALESCE(NULLIF($32, ''), landmark),
        address = COALESCE(NULLIF($33, ''), address),
        updated_at = NOW()
      WHERE id = $34
      RETURNING *
    `, [
      appNumToSave || req.body.bank_application_number || null,
      vkyc_status || req.body.vkyc_status || null,
      vkyc_url || req.body.vkyc_url || null,
      salary_slip_url || null,
      pan_card_url || null,
      targetStatus,
      remarks || req.body.bank_remark || null,
      bank_id || null,
      product_id || null,
      loan_amount ? parseFloat(loan_amount) : null,
      metadata ? JSON.stringify(metadata) : null,
      req.body.soft_approval_status || null,
      req.body.vkyc_stage || null,
      req.body.iqa_stage || null,
      req.body.dispatch_status || null,
      req.body.bank_remark || null,
      req.body.final_status || null,
      req.body.decline_reason || null,
      req.body.eligible_reqd || null,
      req.body.approved_amount ? parseFloat(req.body.approved_amount) : null,
      city || null,
      state || null,
      pincode || null,
      mother_name || req.body.mother_name || null,
      full_name || customer_name || null,
      mobile || customer_mobile || null,
      email || customer_email || null,
      company_name || null,
      designation || null,
      address1 || null,
      address2 || null,
      landmark || null,
      address || null,
      id
    ]);

    // 2. Update customer details if customer_id exists
    if (app.customer_id) {
      await client.query(`
        UPDATE customers SET
          full_name = COALESCE(NULLIF($1, ''), full_name),
          mobile = COALESCE(NULLIF($2, ''), mobile),
          email = COALESCE(NULLIF($3, ''), email),
          dob = COALESCE(NULLIF($4, '')::date, dob),
          pincode = COALESCE(NULLIF($5, ''), pincode),
          city = COALESCE(NULLIF($6, ''), city),
          state = COALESCE(NULLIF($7, ''), state),
          pan_number = COALESCE(NULLIF($8, ''), pan_number),
          monthly_income = COALESCE($9, monthly_income),
          employment_type = COALESCE(NULLIF($10, ''), employment_type),
          employer = COALESCE(NULLIF($11, ''), employer),
          address1 = COALESCE(NULLIF($12, ''), address1),
          address2 = COALESCE(NULLIF($13, ''), address2),
          landmark = COALESCE(NULLIF($14, ''), landmark),
          address = COALESCE(NULLIF($15, ''), address),
          updated_at = NOW()
        WHERE id = $16
      `, [
        full_name || customer_name || null,
        mobile || customer_mobile || null,
        email || customer_email || null,
        parsedDob || null,
        pincode || null,
        city || null,
        state || null,
        pan_number || null,
        monthly_salary ? parseFloat(monthly_salary) : null,
        employment_type || null,
        employerToSave,
        address1 || null,
        address2 || null,
        landmark || null,
        address || null,
        app.customer_id
      ]);
    }

    // Update physical_application_details if record exists or parameters are provided
    try {
      await client.query(`
        UPDATE physical_application_details SET
          aadhaar_linked_mobile = COALESCE(NULLIF($1, ''), aadhaar_linked_mobile),
          pan_name = COALESCE(NULLIF($2, ''), pan_name),
          dob = COALESCE(NULLIF($3, '')::date, dob),
          pan_number = COALESCE(NULLIF($4, ''), pan_number),
          personal_email = COALESCE(NULLIF($5, ''), personal_email),
          company_name = COALESCE(NULLIF($6, ''), company_name),
          designation = COALESCE(NULLIF($7, ''), designation),
          city = COALESCE(NULLIF($8, ''), city),
          state = COALESCE(NULLIF($9, ''), state),
          pincode = COALESCE(NULLIF($10, ''), pincode),
          mother_name = COALESCE(NULLIF($11, ''), mother_name),
          bank_ref_number = COALESCE(NULLIF($12, ''), bank_ref_number),
          address1 = COALESCE(NULLIF($13, ''), address1),
          address2 = COALESCE(NULLIF($14, ''), address2),
          landmark = COALESCE(NULLIF($15, ''), landmark),
          flat_no = COALESCE(NULLIF($13, ''), flat_no),
          sub_area = COALESCE(NULLIF($14, ''), sub_area),
          updated_at = NOW()
        WHERE application_id = $16
      `, [
        mobile || customer_mobile || null,
        full_name || customer_name || null,
        parsedDob || null,
        pan_number || null,
        email || customer_email || null,
        company_name || null,
        designation || null,
        city || null,
        state || null,
        pincode || null,
        mother_name || req.body.mother_name || null,
        appNumToSave || null,
        address1 || null,
        address2 || null,
        landmark || null,
        id
      ]);
    } catch (_) {}

    // 3. Log to timeline
    await client.query(`
      INSERT INTO application_timeline (application_id, status, activity, event_type, title, description, actor_type, actor_id)
      VALUES ($1, $2, 'Application Details Updated', 'application_updated', 'Application Edit & Updated', $3, $4, $5)
    `, [
      id,
      status || app.status,
      `Application updated. App No: ${appNumToSave || 'N/A'}, VKYC: ${vkyc_status || 'N/A'}, Status: ${status || app.status}`,
      ['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role) ? 'admin' : 'partner',
      req.user ? req.user.id : null
    ]).catch(() => {});

    await client.query('COMMIT');
    return success(res, updatedApp, 'Application details updated successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const logApplicationAudit = async (req, applicationId, leadId, action, oldValue, newValue, remarks = '') => {
  try {
    const userId = req?.user?.id || null;
    const role = req?.user?.role || 'SYSTEM';
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || null;

    await query(`
      INSERT INTO application_audit_logs (
        user_id, role, action, entity, entity_id, lead_id, old_value, new_value, remarks, ip_address, created_at
      ) VALUES ($1, $2, $3, 'application', $4, $5, $6::jsonb, $7::jsonb, $8, $9, NOW())
    `, [
      userId,
      role,
      action,
      applicationId,
      leadId || null,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      remarks,
      ipAddress
    ]);
  } catch (err) {
    logger.error('Audit logging failed:', err.message);
  }
};

// PATCH /applications/:id/process-type
const updateProcessType = async (req, res, next) => {
  const client = await getClient();
  try {
    const { id } = req.params;
    const { process_type, reason } = req.body;

    if (!process_type || !reason) {
      return error(res, 'New process_type and a valid reason for change are required', 400);
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only authorized administrators can request a change of process type.'
      });
    }

    await client.query('BEGIN');

    const { rows: [app] } = await client.query(`SELECT * FROM applications WHERE id = $1 FOR UPDATE`, [id]);
    if (!app) {
      await client.query('ROLLBACK');
      return notFound(res, 'Application not found');
    }

    const oldProcessType = app.process_type;

    // Operational Head bank check
    if (req.user.role === 'ADMIN') {
      const { rows: assignedBanks } = await client.query(
        `SELECT bank_id as id FROM admin_bank_assignments WHERE admin_id = $1 UNION SELECT id FROM banks WHERE operation_head_id = $1`,
        [req.user.id]
      );
      if (assignedBanks.length > 0) {
        const allowedIds = assignedBanks.map(b => b.id);
        if (app.bank_id && !allowedIds.includes(app.bank_id)) {
          await client.query('ROLLBACK');
          return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized for this bank.' });
        }
      }
    }

    const { rows: [updatedApp] } = await client.query(`
      UPDATE applications
      SET process_type = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [process_type.trim(), id]);

    if (app.lead_id) {
      await client.query(`UPDATE leads SET process_type = $1, updated_at = NOW() WHERE id = $2`, [process_type.trim(), app.lead_id]);
    }

    await logTimeline(client, id, app.status, `Process Type Changed to ${process_type}`, `Reason: ${reason}. Previous: ${oldProcessType}`, req.user.id);
    await client.query('COMMIT');

    await logApplicationAudit(req, id, app.lead_id, 'PROCESS_TYPE_CHANGED', { process_type: oldProcessType }, { process_type: process_type.trim() }, reason);

    return success(res, updatedApp, `Process type updated to ${process_type} successfully.`);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// PATCH /applications/:id/vkyc
const updateVkyc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vkyc_status, vkyc_url, vkyc_link, remarks } = req.body;

    const targetUrl = vkyc_url || vkyc_link;

    const { rows: [app] } = await query(`
      UPDATE applications
      SET vkyc_status = COALESCE(NULLIF($1, ''), vkyc_status),
          vkyc_url = COALESCE(NULLIF($2, ''), vkyc_url),
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [vkyc_status ? vkyc_status.trim() : null, targetUrl ? targetUrl.trim() : null, id]);

    if (!app) return notFound(res, 'Application not found');

    await logApplicationAudit(req, id, app.lead_id, 'VKYC_UPDATED', { vkyc_status: app.vkyc_status }, { vkyc_status, vkyc_url: targetUrl }, remarks);

    return success(res, app, 'VKYC details updated successfully');
  } catch (err) {
    next(err);
  }
};

// Configurable Bank Requirements & Share Link Handlers
const getBankRequirements = async (req, res, next) => {
  try {
    const { bank_id, product_id } = req.query;

    await query(`
      CREATE TABLE IF NOT EXISTS bank_requirements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        bank_id UUID REFERENCES banks(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        fields JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    let sql = `
      SELECT br.*, b.name as bank_name, p.name as product_name
      FROM bank_requirements br
      LEFT JOIN banks b ON b.id = br.bank_id
      LEFT JOIN products p ON p.id = br.product_id
      WHERE 1=1
    `;
    const params = [];
    if (bank_id) {
      params.push(bank_id);
      sql += ` AND br.bank_id = $${params.length}`;
    }
    if (product_id) {
      params.push(product_id);
      sql += ` AND br.product_id = $${params.length}`;
    }

    const { rows } = await query(sql, params);

    if (rows.length === 0) {
      const defaultReqs = [
        {
          bank: "SBI",
          product: "Credit Card",
          fields: [
            { name: "bank_application_number", label: "Application Number", type: "text", required: true },
            { name: "vkyc_url", label: "VKYC Link", type: "url", required: true },
            { name: "salary_slip_url", label: "Salary Slip Document", type: "file", required: true },
            { name: "pan_card_url", label: "PAN Card Document", type: "file", required: true }
          ]
        },
        {
          bank: "HDFC",
          product: "Credit Card",
          fields: [
            { name: "bank_application_number", label: "Application Number", type: "text", required: true },
            { name: "vkyc_url", label: "VKYC Link", type: "url", required: true }
          ]
        }
      ];
      return success(res, defaultReqs, 'Default bank requirements loaded');
    }

    return success(res, rows, 'Bank requirements retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const saveBankRequirements = async (req, res, next) => {
  try {
    const { bank_id, product_id, fields } = req.body;
    if (!bank_id || !Array.isArray(fields)) {
      return error(res, 'Bank ID and array of fields are required', 400);
    }

    await query(`
      CREATE TABLE IF NOT EXISTS bank_requirements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        bank_id UUID REFERENCES banks(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        fields JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const { rows: [reqRow] } = await query(`
      INSERT INTO bank_requirements (bank_id, product_id, fields, updated_at)
      VALUES ($1, $2, $3::jsonb, NOW())
      RETURNING *
    `, [bank_id, product_id || null, JSON.stringify(fields)]);

    return success(res, reqRow, 'Bank requirements configured successfully');
  } catch (err) {
    next(err);
  }
};

// Alias to Partner Share Controller apply token & link handlers
const partnerShareCtrl = require('../partner/partner-share.controller.js');
const getPublicApplyToken = (req, res, next) => partnerShareCtrl.getApplyTokenDetails(req, res, next);
const submitPublicApplyToken = (req, res, next) => partnerShareCtrl.updateApplyTokenDetails(req, res, next);
const generateShareLink = (req, res, next) => partnerShareCtrl.generateShareLink(req, res, next);

const deleteApplication = async (req, res, next) => {
  const client = await getClient();
  try {
    const { id } = req.params;
    if (!id) return error(res, 'Application ID is required', 400);

    let { rows: [app] } = await client.query(
      `SELECT id, partner_id, customer_id, lead_id, app_number, status FROM applications WHERE id = $1 OR lead_id = $1 LIMIT 1`, 
      [id]
    );

    let isLeadOnly = false;
    let targetAppId = null;
    let targetLeadId = null;
    let targetCustomerId = null;

    if (app) {
      targetAppId = app.id;
      targetLeadId = app.lead_id || id;
      targetCustomerId = app.customer_id;
    } else {
      const { rows: [leadRec] } = await client.query(
        `SELECT id, partner_id, customer_id, id as lead_id, COALESCE(NULLIF(lead_number, ''), CONCAT('LEAD-', UPPER(SUBSTRING(id::text, 1, 8)))) as app_number, status FROM leads WHERE id = $1 OR application_id = $1 LIMIT 1`,
        [id]
      );
      if (leadRec) {
        app = leadRec;
        isLeadOnly = true;
        targetLeadId = leadRec.id || id;
        targetCustomerId = leadRec.customer_id;
      }
    }

    if (!app) {
      return error(res, 'Application or Lead record not found', 404);
    }

    // Check authorization: ONLY SUPER_ADMIN and ADMIN are authorized to delete application records
    const userRole = req.user?.role;
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return error(res, 'Access denied: Only Super Admin is authorized to delete application records', 403);
    }

    await client.query('BEGIN');

    // Helper for safe sub-queries inside PostgreSQL transaction block
    const safeSubDelete = async (sql, params) => {
      try {
        await client.query('SAVEPOINT del_sp');
        await client.query(sql, params);
        await client.query('RELEASE SAVEPOINT del_sp');
      } catch (_) {
        await client.query('ROLLBACK TO SAVEPOINT del_sp').catch(() => {});
      }
    };

    const appIdsToDelete = [id, targetAppId].filter(Boolean);
    const leadIdsToDelete = [id, targetLeadId].filter(Boolean);

    // 1. Delete physical_application_details
    for (const aId of appIdsToDelete) {
      await safeSubDelete(`DELETE FROM physical_application_details WHERE application_id = $1`, [aId]);
    }

    // 2. Delete customer_access_tokens
    for (const aId of appIdsToDelete) {
      await safeSubDelete(`DELETE FROM customer_access_tokens WHERE application_id = $1 OR customer_id = $2`, [aId, targetCustomerId]);
    }

    // 3. Delete partner_share_links
    await safeSubDelete(`DELETE FROM partner_share_links WHERE application_id = $1 OR application_id = $2 OR lead_id = $1 OR lead_id = $2`, [targetAppId, targetLeadId]);

    // 4. Delete application_notes
    for (const aId of appIdsToDelete) {
      await safeSubDelete(`DELETE FROM application_notes WHERE application_id = $1`, [aId]);
    }

    // 5. Delete application_timeline / application_timelines
    for (const aId of appIdsToDelete) {
      await safeSubDelete(`DELETE FROM application_timeline WHERE application_id = $1`, [aId]);
      await safeSubDelete(`DELETE FROM application_timelines WHERE application_id = $1`, [aId]);
    }

    // 6. Delete application_documents
    for (const aId of appIdsToDelete) {
      await safeSubDelete(`DELETE FROM application_documents WHERE application_id = $1`, [aId]);
    }

    // 7. Delete application_history
    for (const aId of appIdsToDelete) {
      await safeSubDelete(`DELETE FROM application_history WHERE application_id = $1`, [aId]);
    }

    // 8. Delete wallet_transactions / wallet_ledger / commission_ledger linked to application or lead
    await safeSubDelete(`DELETE FROM wallet_transactions WHERE application_id = $1 OR application_id = $2`, [targetAppId, targetLeadId]);
    await safeSubDelete(`DELETE FROM wallet_ledger WHERE application_id = $1 OR application_id = $2 OR lead_id = $1 OR lead_id = $2`, [targetAppId, targetLeadId]);
    await safeSubDelete(`DELETE FROM commission_ledger WHERE application_id = $1 OR application_id = $2 OR lead_id = $1 OR lead_id = $2`, [targetAppId, targetLeadId]);

    // 9. Cascade delete lead related records
    for (const lId of leadIdsToDelete) {
      await safeSubDelete(`DELETE FROM lead_documents WHERE lead_id = $1`, [lId]);
      await safeSubDelete(`DELETE FROM lead_timeline WHERE lead_id = $1`, [lId]);
      await safeSubDelete(`DELETE FROM lead_notes WHERE lead_id = $1`, [lId]);
      await safeSubDelete(`DELETE FROM lead_status_history WHERE lead_id = $1`, [lId]);
      await safeSubDelete(`DELETE FROM lead_checklist WHERE lead_id = $1`, [lId]);
      await safeSubDelete(`DELETE FROM lead_sla WHERE lead_id = $1`, [lId]);
      await safeSubDelete(`DELETE FROM bank_assignments WHERE lead_id = $1`, [lId]);
      await safeSubDelete(`DELETE FROM lead_assignments WHERE lead_id = $1`, [lId]);
    }

    // 10. Explicitly delete lead records from leads table (specifically for punching processes and linked leads)
    await safeSubDelete(
      `DELETE FROM leads WHERE id = $1 OR id = $2 OR application_id = $1 OR application_id = $2 OR (app_number IS NOT NULL AND app_number = $3) OR (lead_number IS NOT NULL AND lead_number = $3)`,
      [targetAppId, targetLeadId, app.app_number]
    );

    // 11. Explicitly delete main application records from applications table
    await safeSubDelete(
      `DELETE FROM applications WHERE id = $1 OR id = $2 OR lead_id = $1 OR lead_id = $2 OR (app_number IS NOT NULL AND app_number = $3)`,
      [targetAppId, targetLeadId, app.app_number]
    );

    // 12. Delete Customer Details from database if no other apps/leads remain
    if (targetCustomerId) {
      const { rows: otherApps } = await client.query(
        `SELECT id FROM applications WHERE customer_id = $1 AND id != $2 AND id != $3 LIMIT 1`,
        [targetCustomerId, targetAppId || id, targetLeadId || id]
      );
      const { rows: otherLeads } = await client.query(
        `SELECT id FROM leads WHERE customer_id = $1 AND id != $2 AND id != $3 LIMIT 1`,
        [targetCustomerId, targetAppId || id, targetLeadId || id]
      );

      if (otherApps.length === 0 && otherLeads.length === 0) {
        await safeSubDelete(`DELETE FROM customers WHERE id = $1`, [targetCustomerId]);
      }
    }

    await logAction(req, isLeadOnly ? 'DELETE_LEAD' : 'DELETE_APPLICATION', id, { app_number: app.app_number, customer_id: targetCustomerId });

    await client.query('COMMIT');
    return success(res, {}, 'Application, lead, and customer details deleted successfully from database');
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23503') {
      return error(res, 'Cannot delete this application because it has financial wallet or ledger transactions linked to it.', 400);
    }
    next(err);
  } finally {
    client.release();
  }
};

// POST /applications/generate-physical-link
const generatePhysicalLink = async (req, res, next) => {
  try {
    const { application_id, lead_id } = req.body;
    const appId = application_id || req.body.id || req.params.id;
    if (!appId) return error(res, 'Application ID is required', 400);

    const { rows: [app] } = await query(
      `SELECT a.id, a.customer_id, a.process_type, a.bank_id, b.name as bank_name
       FROM applications a
       LEFT JOIN banks b ON b.id = a.bank_id
       WHERE a.id = $1`,
      [appId]
    );

    if (!app) return notFound(res, 'Application not found');

    const { rows: [existingToken] } = await query(
      `SELECT token, expires_at FROM customer_access_tokens
       WHERE application_id = $1 AND token_type = 'physical_process' AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [appId]
    );

    let tokenStr;
    if (existingToken) {
      tokenStr = existingToken.token;
    } else {
      tokenStr = crypto.randomBytes(24).toString('hex');
      await query(
        `INSERT INTO customer_access_tokens (application_id, customer_id, token, token_type, expires_at)
         VALUES ($1, $2, $3, 'physical_process', NOW() + INTERVAL '72 hours')`,
        [appId, app.customer_id || null, tokenStr]
      );
    }

    const host = req.get('origin') || process.env.FRONTEND_URL || 'https://gharkapaisa.in';
    const physicalUrl = `${host}/physical-application/${tokenStr}`;

    return success(res, {
      token: tokenStr,
      url: physicalUrl,
      share_url: physicalUrl,
      process_type: app.process_type
    }, 'Physical application link generated successfully');
  } catch (err) {
    next(err);
  }
};

// GET /applications/physical-application/:token
const getPhysicalApplicationByToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) return error(res, 'Token is required', 400);

    let { rows: [tokenRec] } = await query(
      `SELECT cat.*, a.id as application_id, a.app_number, a.process_type, a.status, a.bank_id, a.product_id,
              b.name as bank_name, b.short_code as bank_code,
              p.name as product_name,
              c.full_name as customer_name, c.mobile as customer_mobile, c.email as customer_email, c.pan_number as customer_pan, c.dob as customer_dob
       FROM customer_access_tokens cat
       JOIN applications a ON a.id = cat.application_id
       LEFT JOIN banks b ON b.id = a.bank_id
       LEFT JOIN products p ON p.id = a.product_id
       LEFT JOIN customers c ON c.id = a.customer_id
       WHERE cat.token = $1`,
      [token]
    );

    if (!tokenRec) {
      const { rows: [appRec] } = await query(
        `SELECT a.id as application_id, a.app_number, a.process_type, a.status, a.bank_id, a.product_id,
                b.name as bank_name, b.short_code as bank_code,
                p.name as product_name,
                c.full_name as customer_name, c.mobile as customer_mobile, c.email as customer_email, c.pan_number as customer_pan, c.dob as customer_dob
         FROM applications a
         LEFT JOIN banks b ON b.id = a.bank_id
         LEFT JOIN products p ON p.id = a.product_id
         LEFT JOIN customers c ON c.id = a.customer_id
         WHERE a.tracking_token = $1 OR a.id::text = $1 OR a.app_number = $1`,
        [token]
      );
      tokenRec = appRec;
    }

    if (!tokenRec) {
      const { rows: [pslRec] } = await query(
        `SELECT psl.application_id, a.app_number, a.process_type, a.status, a.bank_id, a.product_id,
                b.name as bank_name, b.short_code as bank_code,
                p.name as product_name,
                c.full_name as customer_name, c.mobile as customer_mobile, c.email as customer_email, c.pan_number as customer_pan, c.dob as customer_dob
         FROM partner_share_links psl
         JOIN applications a ON a.id = psl.application_id
         LEFT JOIN banks b ON b.id = a.bank_id
         LEFT JOIN products p ON p.id = a.product_id
         LEFT JOIN customers c ON c.id = a.customer_id
         WHERE psl.tracking_token = $1`,
        [token]
      );
      tokenRec = pslRec;
    }

    if (!tokenRec) {
      return res.status(404).json({ success: false, message: 'Invalid or expired physical application link.' });
    }

    const { rows: [pad] } = await query(
      `SELECT * FROM physical_application_details WHERE application_id = $1`,
      [tokenRec.application_id]
    );

    const isSbi = (tokenRec.bank_id === 'e7c2c604-139d-4fcf-a87c-695633535a02') ||
                  (String(tokenRec.bank_name || tokenRec.bank_code || '').toLowerCase().includes('sbi'));

    return success(res, {
      application_id: tokenRec.application_id,
      app_number: tokenRec.app_number,
      process_type: tokenRec.process_type,
      status: tokenRec.status,
      bank_id: tokenRec.bank_id,
      bank_name: tokenRec.bank_name,
      bank_code: tokenRec.bank_code,
      is_sbi: isSbi,
      product_name: tokenRec.product_name,
      customer: {
        full_name: tokenRec.customer_name,
        mobile: tokenRec.customer_mobile,
        email: tokenRec.customer_email,
        pan_number: tokenRec.customer_pan,
        dob: tokenRec.customer_dob
      },
      physical_details: pad || null
    });
  } catch (err) {
    next(err);
  }
};

// POST /applications/physical-application/:token/submit
const submitPhysicalApplicationByToken = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { token } = req.params;
    if (!token) return error(res, 'Token is required', 400);

    let { rows: [tokenRec] } = await client.query(
      `SELECT cat.*, a.id as application_id, a.app_number, a.submitted_by
       FROM customer_access_tokens cat
       JOIN applications a ON a.id = cat.application_id
       WHERE cat.token = $1`,
      [token]
    );

    if (!tokenRec) {
      const { rows: [appRec] } = await client.query(
        `SELECT a.id as application_id, a.app_number, a.submitted_by
         FROM applications a
         WHERE a.tracking_token = $1 OR a.id::text = $1 OR a.app_number = $1`,
        [token]
      );
      tokenRec = appRec;
    }

    if (!tokenRec) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Invalid or expired link.' });
    }

    const {
      aadhaar_linked_mobile,
      pan_name,
      dob,
      pan_number,
      mother_name,
      personal_email,
      company_name,
      designation,
      flat_no,
      sub_area,
      landmark,
      pincode,
      company_address,
      // Form 2 Status & Remark Fields
      bank_ref_number,
      vkyc_url,
      appcode_status,
      soft_approval_status,
      vkyc_stage,
      iqa_stage,
      dispatch_status,
      bank_remark,
      final_status,
      decline_reason,
      eligible_reqd
    } = req.body;

    const parsedDob = parseDobToIso(dob);
    const appId = tokenRec.application_id;

    await client.query(
      `INSERT INTO physical_application_details (
        application_id, aadhaar_linked_mobile, pan_name, dob, pan_number,
        mother_name, personal_email, company_name, designation, flat_no,
        sub_area, landmark, pincode, company_address, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      ON CONFLICT (application_id) DO UPDATE SET
        aadhaar_linked_mobile = EXCLUDED.aadhaar_linked_mobile,
        pan_name = EXCLUDED.pan_name,
        dob = EXCLUDED.dob,
        pan_number = EXCLUDED.pan_number,
        mother_name = EXCLUDED.mother_name,
        personal_email = EXCLUDED.personal_email,
        company_name = EXCLUDED.company_name,
        designation = EXCLUDED.designation,
        flat_no = EXCLUDED.flat_no,
        sub_area = EXCLUDED.sub_area,
        landmark = EXCLUDED.landmark,
        pincode = EXCLUDED.pincode,
        company_address = EXCLUDED.company_address,
        updated_at = NOW()`,
      [
        appId, aadhaar_linked_mobile || null, pan_name || null, parsedDob || null, pan_number || null,
        mother_name || null, personal_email || null, company_name || null, designation || null, flat_no || null,
        sub_area || null, landmark || null, pincode || null, company_address || null
      ]
    );

    const isOpsOrAdminUser = req.user && ['ADMIN', 'SUPER_ADMIN', 'OPERATIONS', 'OPERATIONS_HEAD', 'ADMINISTRATIVE_OPERATOR', 'ADMIN_OPERATOR', 'OPERATOR'].includes((req.user.role || '').toUpperCase());

    let mainStatus = 'operational_verified';
    if (isOpsOrAdminUser && final_status) {
      const lowerFs = final_status.toLowerCase();
      if (lowerFs.includes('decline') || lowerFs.includes('rejected')) mainStatus = 'rejected';
      else mainStatus = 'operational_verified';
    } else {
      mainStatus = null;
    }

    // Sync to applications table (Part 3 fields editable only by Operations Head, Super Admin, or Administrative Operator)
    await client.query(
      `UPDATE applications 
       SET status = COALESCE($1, status),
           bank_ref_number = COALESCE(NULLIF($2, ''), bank_ref_number),
           vkyc_url = COALESCE(NULLIF($3, ''), vkyc_url),
           appcode_status = COALESCE(NULLIF($4, ''), appcode_status),
           soft_approval_status = COALESCE(NULLIF($5, ''), soft_approval_status),
           vkyc_stage = COALESCE(NULLIF($6, ''), vkyc_stage),
           iqa_stage = COALESCE(NULLIF($7, ''), iqa_stage),
           dispatch_status = COALESCE(NULLIF($8, ''), dispatch_status),
           bank_remark = COALESCE(NULLIF($9, ''), bank_remark),
           final_status = COALESCE(NULLIF($10, ''), final_status),
           decline_reason = COALESCE(NULLIF($11, ''), decline_reason),
           eligible_reqd = COALESCE(NULLIF($12, ''), eligible_reqd),
           updated_at = NOW()
       WHERE id = $13`,
      [
        mainStatus,
        isOpsOrAdminUser ? (bank_ref_number || null) : null,
        isOpsOrAdminUser ? (vkyc_url || null) : null,
        appcode_status || null,
        soft_approval_status || null,
        vkyc_stage || null,
        iqa_stage || null,
        dispatch_status || null,
        isOpsOrAdminUser ? (bank_remark || null) : null,
        isOpsOrAdminUser ? (final_status || null) : null,
        isOpsOrAdminUser ? (decline_reason || null) : null,
        isOpsOrAdminUser ? (eligible_reqd || null) : null,
        appId
      ]
    );

    if (tokenRec.customer_id) {
      await client.query(
        `UPDATE customers
         SET mobile = COALESCE(NULLIF($1, ''), mobile),
             full_name = COALESCE(NULLIF($2, ''), full_name),
             dob = COALESCE($3::date, dob),
             email = COALESCE(NULLIF($4, ''), email),
             pan_number = COALESCE(NULLIF($5, ''), pan_number),
             updated_at = NOW()
         WHERE id = $6`,
        [
          aadhaar_linked_mobile || null,
          pan_name || null,
          parsedDob || null,
          personal_email || null,
          pan_number || null,
          tokenRec.customer_id
        ]
      );
    }

    await logTimeline(
      client,
      appId,
      'physical_form_submitted',
      'Physical Form Submitted',
      'Customer/Partner submitted Form 1 & Form 2 physical application & status details.',
      tokenRec.submitted_by || null
    );

    await client.query('COMMIT');
    return success(res, {}, 'Physical application details submitted successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// POST /applications/:id/release-commission — Super Admin releases commission & credits wallet
const releaseCommission = async (req, res, next) => {
  const client = await getClient();
  try {
    const { id } = req.params;

    const { rows: [app] } = await client.query(
      `SELECT a.id, a.app_number, a.partner_id, a.commission_amount, a.commission_status, a.status
       FROM applications a
       WHERE a.id = $1`,
      [id]
    );

    if (!app) return notFound(res, 'Application not found');

    if (app.commission_status === 'released') {
      return error(res, 'Commission has already been released for this application', 400);
    }

    const commissionAmount = parseFloat(app.commission_amount || 0);
    if (commissionAmount <= 0) {
      return error(res, 'No commission amount set for this application. Please update commission first.', 400);
    }

    await client.query('BEGIN');

    // 1. Update application commission status & set status to approved
    await client.query(
      `UPDATE applications SET status = 'approved', final_status = 'approved', approved_at = COALESCE(approved_at, NOW()), commission_status = 'released', commission_released = TRUE, updated_at = NOW() WHERE id = $1`,
      [id]
    );

    // 2. Call creditCommission to process partner & team split into partner_wallets & wallet_ledger (pass client to prevent deadlock)
    const childTxn = await creditCommission(
      app.partner_id,
      id,
      commissionAmount,
      `Commission released for application ${app.app_number}`,
      req.user.id,
      client
    );

    // 3. Call releaseHold to transition funds to Available Balance
    await releaseHold(
      app.partner_id,
      commissionAmount,
      {
        txn_id: childTxn?.id || null,
        application_id: id,
        reference_type: 'commission_release',
        reference_id: id,
        description: `Commission released for application ${app.app_number}`,
        processed_by: req.user.id
      },
      client
    );

    // 4. Log timeline
    try {
      await logTimeline(client, id, 'commission_released', 'Commission Released',
        `₹${commissionAmount} commission released and credited to partner wallet by Super Admin.`,
        req.user.id
      );
    } catch (_) {}

    await client.query('COMMIT');

    // Send SMS notification to partner
    try {
      const { rows: [partnerUser] } = await client.query(
        `SELECT u.mobile, COALESCE(p.first_name, u.full_name, 'Partner') as first_name 
         FROM partner_profiles p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
        [app.partner_id]
      );
      if (partnerUser?.mobile) {
        const { sendCommissionCreditedSms } = require('../../services/sms/sms.service');
        sendCommissionCreditedSms(partnerUser.mobile, partnerUser.first_name, commissionAmount).catch(() => {});
      }
    } catch (_) {}

    // Fetch updated balance from partner_wallets
    const { rows: [w] } = await query(
      `SELECT available_balance FROM partner_wallets WHERE partner_id = $1`,
      [app.partner_id]
    );

    return success(res, {
      application_id: id,
      app_number: app.app_number,
      commission_amount: commissionAmount,
      commission_status: 'released',
      partner_id: app.partner_id,
      new_wallet_balance: parseFloat(w?.available_balance || 0)
    }, 'Commission released and partner wallet credited successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// POST /applications/:id/hold-commission — Super Admin holds commission
const holdCommission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const { rows: [app] } = await query(
      `SELECT id, app_number, commission_status FROM applications WHERE id = $1`,
      [id]
    );

    if (!app) return notFound(res, 'Application not found');

    if (app.commission_status === 'released') {
      return error(res, 'Cannot hold commission that has already been released', 400);
    }

    await query(
      `UPDATE applications SET commission_status = 'on_hold', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    return success(res, {
      application_id: id,
      app_number: app.app_number,
      commission_status: 'on_hold'
    }, 'Commission has been put on hold.');
  } catch (err) {
    next(err);
  }
};

// GET /applications/:id/trace — Complete 360-Degree Traceability Data
const get360ApplicationTrace = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: [appTrace] } = await query(`
      SELECT
        a.id AS application_id,
        a.app_number,
        a.process_type AS application_process_type,
        a.status AS application_status,
        a.created_at AS application_created_at,
        a.updated_at AS application_updated_at,
        a.bank_ref_number,
        a.soft_approval_status,
        a.vkyc_stage,
        a.vkyc_url,
        a.iqa_stage,
        a.dispatch_status,
        a.remarks AS bank_remark,
        a.decline_reason,
        a.commission_amount,
        
        c.id AS customer_id,
        COALESCE(NULLIF(a.customer_name, ''), NULLIF(l.customer_name, ''), NULLIF(c.full_name, ''), 'Customer') AS customer_name,
        COALESCE(NULLIF(a.customer_mobile, ''), NULLIF(l.mobile, ''), NULLIF(l.customer_mobile, ''), c.mobile) AS customer_mobile,
        COALESCE(NULLIF(a.customer_email, ''), NULLIF(c.email, ''), NULLIF(l.email, '')) AS customer_email,
        
        l.id AS lead_id,
        l.status AS lead_status,
        l.process_type AS lead_process_type,
        l.share_token,
        
        p.id AS partner_id,
        p.partner_code,
        CONCAT(p.first_name, ' ', p.last_name) AS partner_name,
        
        prod.id AS product_id,
        prod.name AS product_name,
        prod.partner_url,
        b.id AS bank_id,
        b.name AS bank_name,
        b.short_code AS bank_short_code
      FROM applications a
      LEFT JOIN customers c ON c.id = a.customer_id
      LEFT JOIN leads l ON l.id = a.lead_id
      LEFT JOIN partner_profiles p ON p.id = a.partner_id
      LEFT JOIN products prod ON prod.id = a.product_id
      LEFT JOIN banks b ON b.id = prod.bank_id
      WHERE a.id::text = $1 OR a.app_number = $1 OR a.tracking_token = $1
    `, [id]);

    if (!appTrace) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const [timelineRes, docsRes, physRes, walletRes, smsRes] = await Promise.all([
      query(`SELECT at.*, u.full_name as performed_by_name, u.role as performed_by_role FROM application_timeline at LEFT JOIN users u ON u.id = at.performed_by WHERE at.application_id = $1 ORDER BY at.created_at DESC`, [id]),
      query(`SELECT * FROM application_documents WHERE application_id = $1 ORDER BY created_at DESC`, [id]),
      query(`SELECT * FROM physical_application_details WHERE application_id = $1`, [id]),
      query(`SELECT * FROM wallet_ledger WHERE application_id = $1 ORDER BY created_at DESC`, [id]),
      query(`SELECT * FROM sms_logs WHERE application_id = $1 ORDER BY created_at DESC`, [id]).catch(() => ({ rows: [] }))
    ]);

    return success(res, {
      application: appTrace,
      timeline: timelineRes.rows,
      documents: docsRes.rows,
      physical_details: physRes.rows[0] || null,
      wallet_ledger: walletRes.rows,
      sms_logs: smsRes.rows
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitApplication,
  submitPublicApplication,
  updateStatus,
  listApplications,
  getApplication,
  uploadApplicationDoc,
  getApplicationsDashboard,
  getTimeline,
  getDocuments,
  addNote,
  getAnalytics,
  approveApplication,
  rejectApplication,
  reassignApplication,
  manualCommission,
  updateCommission,
  sendUploadLink,
  verifyDocument,
  markVerificationComplete,
  updateBankProcessingStatus,
  submitPartnerApplication,
  bulkUpdateStatus,
  importApplications,
  exportApplicationsCSV,
  updateApplicationDetails,
  logApplicationAudit,
  updateProcessType,
  updateVkyc,
  getPublicApplyToken,
  submitPublicApplyToken,
  getBankRequirements,
  saveBankRequirements,
  generateShareLink,
  generatePhysicalLink,
  getPhysicalApplicationByToken,
  submitPhysicalApplicationByToken,
  deleteApplication,
  releaseCommission,
  holdCommission,
  get360ApplicationTrace
};


