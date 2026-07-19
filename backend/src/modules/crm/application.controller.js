const { query, getClient } = require('../../config/database');
const { generateAppNumber, getPaginationParams } = require('../../utils/helpers/helpers');
const { creditCommission, releaseHold } = require('../wallet/service.js');
const { calculatePartnerCommission } = require('../partner/commission.service.js');
const { notify } = require('../notifications/service.js');
const { uploadToS3 } = require('../../services/aws/s3.service.js');
const { success, created, error, notFound, forbidden, paginate } = require('../../utils/response/response');
const logger = require('../../config/logger');
const { logAction } = require('../admin/audit.service.js');

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

    // Calculate expected commission
    const commission = await calculatePartnerCommission(product_id, PartnerId, loan_amount);
    
    // Generate unique app number
    const { rows: [{ nextval }] } = await client.query(`SELECT nextval('app_number_seq')`);
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const appNumber = `APP${datePart}${nextval}`;

    // Create application
    const { rows: [app] } = await client.query(`
      INSERT INTO applications
        (app_number, customer_id, product_id, partner_id, parent_partner_id, bank_id, submitted_by, loan_amount, commission_amount, notes, status, submitted_at,
         status_history)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'submitted',NOW(),
        jsonb_build_array(jsonb_build_object('status','submitted','at',NOW(),'by',$11::text)))
      RETURNING id, app_number
    `, [appNumber, customerId, product_id, PartnerId, parentPartnerId, product.bank_id, req.user.id, loan_amount, commission, notes, req.user.id.toString()]);

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

// POST /applications/public — Customer submits application from homepage
const submitPublicApplication = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { product_id, customer, loan_amount, notes, partner_code, tracking_id, process_type, monthly_salary, company_name, pincode } = req.body;

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

    // Upsert customer
    let customerId;
    const { rows: [existingCust] } = await client.query(
      `SELECT id FROM customers WHERE mobile = $1`, [customer.mobile]
    );
    
    const salaryVal = parseFloat(monthly_salary || loan_amount || 0);

    if (existingCust) {
      customerId = existingCust.id;
      await client.query(`
        UPDATE customers SET full_name=$1, email=$2, city=$3, monthly_income=$4, company_name=$5, pincode=$6, updated_at=NOW() WHERE id=$7
      `, [customer.full_name, customer.email, customer.city, monthly_salary ? parseFloat(monthly_salary) : null, company_name || null, pincode || null, customerId]);
    } else {
      const { rows: [newCust] } = await client.query(`
        INSERT INTO customers (full_name, mobile, email, city, monthly_income, company_name, pincode, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id
      `, [customer.full_name, customer.mobile, customer.email, customer.city, monthly_salary ? parseFloat(monthly_salary) : null, company_name || null, pincode || null, sysUserId]);
      customerId = newCust.id;
    }

    const commission = await calculatePartnerCommission(product_id, partnerId, salaryVal);
    
    const { rows: [{ nextval }] } = await client.query(`SELECT nextval('app_number_seq')`);
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const appNumber = `APP${datePart}${nextval}`;

    const { rows: [app] } = await client.query(`
      INSERT INTO applications
        (app_number, customer_id, product_id, partner_id, parent_partner_id, bank_id, submitted_by, loan_amount, commission_amount, notes, status, tracking_id, submitted_at,
         status_history, process_type, company_name, pincode, city)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'submitted',$11,NOW(),
        jsonb_build_array(jsonb_build_object('status','submitted','at',NOW(),'by',$12::text)), $13, $14, $15, $16)
      RETURNING id, app_number
    `, [appNumber, customerId, product_id, partnerId, parentPartnerId, product.bank_id, sysUserId, salaryVal, commission, notes, tracking_id || null, sysUserId.toString(), process_type || 'lead_punching', company_name || null, pincode || null, customer.city || null]);

    await logTimeline(client, app.id, 'submitted', 'Application Created', 'Public direct landing application logged.', sysUserId);
    await logTimeline(client, app.id, 'submitted', 'Customer Submitted Form', 'Verified lead details saved.', sysUserId);

    // Public referral clicks updates omitted

    await client.query('COMMIT');
    
    logger.info(`Public application ${appNumber} submitted routing to Partner ${partnerId}`);
    return created(res, { application_id: app.id, app_number: app.app_number, commission }, 'Application submitted successfully');
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
    let partnerId = null;
    let userId = req.user?.id || null;
    if (req.user.role === 'PARTNER') {
      const { rows: [partner] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      partnerId = partner ? partner.id : req.user.id;
    }

    const { rows: [stats] } = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today,
        COUNT(*) FILTER (WHERE status = 'submitted' OR status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status IN ('approved', 'disbursed', 'confirmed')) as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'under_review') as under_review,
        COUNT(*) FILTER (WHERE commission_status = 'pending') as comm_pending,
        COUNT(*) FILTER (WHERE commission_status = 'approved') as comm_approved,
        COUNT(*) FILTER (WHERE commission_status = 'processed') as comm_paid,
        COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'processed'), 0) as total_earnings
      FROM (
        SELECT a.id, a.partner_id, a.status::text, a.commission_status::text, a.commission_amount, a.created_at FROM applications a
        UNION ALL
        SELECT l.id, l.partner_id, l.status::text, 'pending'::text as commission_status, p.commission_value as commission_amount, l.created_at
        FROM leads l
        LEFT JOIN products p ON p.id = l.product_id
      ) combined
      WHERE ($1::uuid IS NULL OR combined.partner_id = $1 OR combined.partner_id = $2::uuid OR combined.partner_id IN (SELECT id FROM partner_profiles WHERE user_id = $2::uuid))
    `, [partnerId, userId]);

    const totalCount = parseInt(stats?.total || 0);
    const approvedCount = parseInt(stats?.approved || 0);
    const conversionRate = totalCount > 0 ? parseFloat(((approvedCount / totalCount) * 100).toFixed(2)) : 0;

    // Recent 5 applications
    const { rows: recent } = await query(`
      SELECT combined.id, combined.app_number, combined.status, combined.commission_amount, combined.commission_status, combined.created_at,
             combined.customer_name, combined.product_name
      FROM (
        SELECT a.id, a.app_number, a.status::text, a.commission_amount, a.commission_status::text, a.created_at, a.partner_id,
               COALESCE(c.full_name, 'Customer') as customer_name, p.name as product_name
        FROM applications a
        LEFT JOIN customers c ON c.id = a.customer_id
        LEFT JOIN products p ON p.id = a.product_id
        UNION ALL
        SELECT l.id, CONCAT('LEAD-', UPPER(SUBSTRING(l.id::text, 1, 8))) as app_number, l.status::text, p.commission_value as commission_amount, 'pending'::text as commission_status, l.created_at, l.partner_id,
               COALESCE(c.full_name, l.customer_name) as customer_name, p.name as product_name
        FROM leads l
        LEFT JOIN customers c ON c.mobile = l.mobile
        LEFT JOIN products p ON p.id = l.product_id
      ) combined
      WHERE ($1::uuid IS NULL OR combined.partner_id = $1 OR combined.partner_id = $2::uuid)
      ORDER BY combined.created_at DESC LIMIT 5
    `, [partnerId, userId]);

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
    const { rows } = await query(`
      SELECT at.*, u.full_name as performed_by_name
      FROM application_timeline at
      LEFT JOIN users u ON u.id = at.performed_by
      WHERE at.application_id = $1
      ORDER BY at.performed_at ASC
    `, [id]);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

// GET /applications/:id/documents
const getDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(`
      SELECT * FROM application_documents WHERE application_id = $1 ORDER BY uploaded_at DESC
    `, [id]);
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

    let approvedAt = app.approved_at;
    if (status === 'approved' && !app.approved_at) {
      approvedAt = new Date();
    }

    const historyEntry = JSON.stringify({ status, at: new Date(), by: req.user.id, remarks });
    await client.query(`
      UPDATE applications SET
        status = $1,
        approved_at = $2,
        status_history = status_history || $3::jsonb,
        updated_at = NOW()
      WHERE id = $4
    `, [status, approvedAt, historyEntry, id]);

    await logTimeline(client, id, status, `Transitioned to ${status.replace(/_/g, ' ').toUpperCase()}`, remarks, req.user.id);
    // Click status updates omitted

    await client.query('COMMIT');

    // Notifications
    const { rows: [partner] } = await query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [app.partner_id]);
    if (partner) {
      if (status === 'approved') {
        await notify.applicationApproved(partner.user_id, app.app_number, app.commission_amount);
        
        // Parent team notifications
        try {
          const { query: queryDB } = require('../../config/database');
          const { createNotification } = require('../notifications/service.js');
          
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
      await creditCommission(app.partner_id, id, commValue, `Approved commission for ${app.app_number}`, req.user.id);

      // Create Entry in commission_ledger
      await client.query(`
        INSERT INTO commission_ledger (application_id, partner_id, parent_partner_id, commission_amount, override_amount, status)
        VALUES ($1, $2, $3, $4, $5, 'approved')
      `, [id, app.partner_id, app.parent_partner_id, commValue * 0.9, commValue * 0.1]);

      // Set commission_released flag on the application itself
      await client.query(`
        UPDATE applications SET commission_released = TRUE WHERE id = $1
      `, [id]);

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
    `, [id, app.partner_id, app.parent_partner_id, commValue * 0.9, commValue * 0.1]);

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
    const { id, partner_id } = req.body;
    if (!id || !partner_id) return error(res, 'ID and Partner ID are required', 400);

    const { rows: [partner] } = await client.query(`SELECT first_name, last_name, partner_code FROM partner_profiles WHERE id=$1`, [partner_id]);
    if (!partner) return error(res, 'Target Partner not found', 404);

    await client.query(`
      UPDATE applications SET partner_id=$1, updated_at=NOW() WHERE id=$2
    `, [partner_id, id]);

    await logTimeline(client, id, 'submitted', 'Reassigned Partner', `Application reassigned to ${partner.first_name} ${partner.last_name || ''} (${partner.partner_code}).`, req.user.id);
    await logAction(req, 'REASSIGN_APPLICATION', id, { target_partner: partner_id });

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
    const { status, partner_id, partner_id: q_partner_id, product_id, search, bank_id } = req.query;
    const targetPartnerId = q_partner_id || partner_id;

    let partnerId = null;
    if (req.user.role === 'PARTNER') {
      const { rows: [partner] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      partnerId = partner ? partner.id : req.user.id;
    } else if (targetPartnerId) {
      partnerId = targetPartnerId;
    }

    const validPartnerId = isUuid(partnerId) ? partnerId : null;
    const validProductId = isUuid(product_id) ? product_id : null;
    const validBankId = isUuid(bank_id) ? bank_id : null;
    const validStatus = status && status.trim() ? status.trim() : null;
    const validSearch = search && search.trim() ? `%${search.trim()}%` : null;

    const userId = req.user?.id || null;
    const validUserId = isUuid(userId) ? userId : null;

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
          COALESCE(c.full_name, 'Customer') as customer_name,
          c.mobile as customer_mobile,
          c.email as customer_email,
          c.pan_number,
          c.city,
          c.state,
          c.employment_type,
          c.monthly_income,
          p.name as product_name,
          p.category,
          b.name as bank_name,
          b.short_code as bank_code,
          ap.partner_code,
          ap.first_name as partner_first_name,
          ap.last_name as partner_last_name,
          a.partner_id,
          a.product_id,
          p.bank_id
        FROM applications a
        LEFT JOIN customers c ON c.id = a.customer_id
        LEFT JOIN products p ON p.id = a.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        LEFT JOIN partner_profiles ap ON ap.id = a.partner_id

        UNION ALL

        SELECT 
          l.id,
          CONCAT('LEAD-', UPPER(SUBSTRING(l.id::text, 1, 8))) as app_number,
          l.status::text,
          NULL::numeric as loan_amount,
          NULL::numeric as approved_amount,
          p.commission_value as commission_amount,
          'pending'::text as commission_status,
          l.created_at,
          l.updated_at,
          NULL as bank_ref_number,
          l.created_at as submitted_at,
          NULL as approved_at,
          NULL as commission_received_at,
          NULL as commission_paid_at,
          COALESCE(c.full_name, l.customer_name) as customer_name,
          COALESCE(c.mobile, l.mobile) as customer_mobile,
          c.email as customer_email,
          c.pan_number,
          COALESCE(c.city, l.city) as city,
          c.state,
          c.employment_type,
          c.monthly_income,
          p.name as product_name,
          p.category,
          COALESCE(b.name, 'Bank Partner') as bank_name,
          COALESCE(b.short_code, 'LEAD') as bank_code,
          ap.partner_code,
          ap.first_name as partner_first_name,
          ap.last_name as partner_last_name,
          l.partner_id,
          l.product_id,
          p.bank_id
        FROM leads l
        LEFT JOIN customers c ON c.mobile = l.mobile
        LEFT JOIN products p ON p.id = l.product_id
        LEFT JOIN banks b ON b.id = p.bank_id
        LEFT JOIN partner_profiles ap ON ap.id = l.partner_id
      ) combined
      WHERE ($1::uuid IS NULL OR combined.partner_id = $1 OR combined.partner_id = $8::uuid)
        AND ($2::text IS NULL OR combined.status = $2)
        AND ($3::uuid IS NULL OR combined.product_id = $3)
        AND ($4::uuid IS NULL OR combined.bank_id = $4)
        AND ($5::text IS NULL OR (combined.app_number ILIKE $5 OR combined.customer_name ILIKE $5 OR combined.customer_mobile ILIKE $5))
      ORDER BY combined.created_at DESC
      LIMIT $6 OFFSET $7
    `, [validPartnerId, validStatus, validProductId, validBankId, validSearch, limit, offset, validUserId]);

    const { rows: [{ count }] } = await query(`
      SELECT COUNT(*) FROM (
        SELECT a.id, a.partner_id, a.status::text, a.product_id, p.bank_id, a.app_number, c.full_name as customer_name, c.mobile as customer_mobile
        FROM applications a
        LEFT JOIN customers c ON c.id = a.customer_id
        LEFT JOIN products p ON p.id = a.product_id
        UNION ALL
        SELECT l.id, l.partner_id, l.status::text, l.product_id, p.bank_id, CONCAT('LEAD-', UPPER(SUBSTRING(l.id::text, 1, 8))) as app_number, COALESCE(c.full_name, l.customer_name) as customer_name, COALESCE(c.mobile, l.mobile) as customer_mobile
        FROM leads l
        LEFT JOIN customers c ON c.mobile = l.mobile
        LEFT JOIN products p ON p.id = l.product_id
      ) combined
      WHERE ($1::uuid IS NULL OR combined.partner_id = $1 OR combined.partner_id = $6::uuid)
        AND ($2::text IS NULL OR combined.status = $2)
        AND ($3::uuid IS NULL OR combined.product_id = $3)
        AND ($4::uuid IS NULL OR combined.bank_id = $4)
        AND ($5::text IS NULL OR (combined.app_number ILIKE $5 OR combined.customer_name ILIKE $5 OR combined.customer_mobile ILIKE $5))
    `, [validPartnerId, validStatus, validProductId, validBankId, validSearch, validUserId]);

    return paginate(res, rows, parseInt(count), page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /applications/:id — Single application detail
const getApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [app] } = await query(`
      SELECT a.*, 
        c.full_name as customer_name, c.mobile as customer_mobile, c.email as customer_email,
        c.pan_number, c.monthly_income, c.employment_type, c.city, c.state,
        p.name as product_name, p.category, p.features, p.commission_type, p.commission_value,
        b.name as bank_name, b.short_code as bank_code,
        ap.partner_code, ap.first_name as Partner_first_name, ap.last_name as Partner_last_name
      FROM applications a
      JOIN customers c ON c.id = a.customer_id
      JOIN products p ON p.id = a.product_id
      JOIN banks b ON b.id = p.bank_id
      JOIN partner_profiles ap ON ap.id = a.partner_id
      WHERE a.id = $1
    `, [id]);
    if (!app) return notFound(res);

    if (req.user.role === 'PARTNER') {
      const { rows: [partner] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (!partner || app.partner_id !== partner.id) {
        return forbidden(res, 'Access denied. You do not own this application.');
      }
    }

    const notes = await getFilteredNotes(id, req.user.role);
    app.notes_list = notes;

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
    const { sendSms } = require('../../services/sms/sms.service');
    const { sendEmail } = require('../../services/email/email.service');

    const appRes = await query(`
      SELECT a.*, c.full_name as customer_name, c.mobile as customer_mobile, c.email as customer_email,
             p.name as product_name, b.name as bank_name
      FROM applications a
      JOIN customers c ON a.customer_id = c.id
      LEFT JOIN products p ON a.product_id = p.id
      LEFT JOIN banks b ON p.bank_id = b.id
      WHERE a.id = $1
    `, [id]);

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
    await sendSms(app.customer_mobile, smsText);

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

// PUT /applications/:id/bank-status — Update bank review / approval status
const updateBankProcessingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, bank_ref_number, rejection_reason, approved_amount } = req.body;

    const validStatuses = ['under_review', 'approved', 'rejected', 'disbursed'];
    if (!validStatuses.includes(status)) {
      return error(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const appRes = await query(`SELECT * FROM applications WHERE id = $1`, [id]);
    if (appRes.rows.length === 0) return notFound(res, 'Application not found');
    const app = appRes.rows[0];

    await query(`
      UPDATE applications 
      SET status = $1, bank_ref_number = COALESCE($2, bank_ref_number), 
          rejection_reason = COALESCE($3, rejection_reason), 
          approved_amount = COALESCE($4, approved_amount),
          updated_at = NOW()
      WHERE id = $5
    `, [status, bank_ref_number, rejection_reason, approved_amount, id]);

    const titleMap = {
      under_review: 'Bank Reviewing Application',
      approved: 'Application Approved by Bank',
      rejected: 'Application Rejected by Bank',
      disbursed: 'Loan Disbursed'
    };

    await query(`
      INSERT INTO application_timeline (application_id, event_type, title, description, actor_type, actor_id)
      VALUES ($1, $2, $3, $4, 'admin', $5)
    `, [id, status, titleMap[status] || status, `Status updated to ${status}. ${rejection_reason ? 'Reason: ' + rejection_reason : ''}`, req.user ? req.user.id : null]);

    if (status === 'disbursed' && app.commission_amount > 0 && app.partner_id) {
      try {
        await creditCommission(app.partner_id, app.commission_amount, app.id);
        await query(`UPDATE applications SET commission_status = 'approved' WHERE id = $1`, [id]);
      } catch (commErr) {
        logger.error('Failed to credit commission on disbursal:', commErr);
      }
    }

    return success(res, null, `Application status updated to ${status}`);
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

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
        await client.query('ROLLBACK');
        return error(res, 'Please provide a valid email address', 400);
      }

      const salaryNum = parseFloat(monthly_salary || 0);
      if (isNaN(salaryNum) || salaryNum <= 0) {
        await client.query('ROLLBACK');
        return error(res, 'Monthly salary must be a positive number', 400);
      }

      if (product.min_income && salaryNum < parseFloat(product.min_income)) {
        await client.query('ROLLBACK');
        return error(res, `Applicant monthly salary ₹${salaryNum.toLocaleString('en-IN')} is below product minimum required ₹${parseFloat(product.min_income).toLocaleString('en-IN')}`, 400);
      }

      if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
        await client.query('ROLLBACK');
        return error(res, 'Please enter a valid 6-digit postal pincode', 400);
      }

      const validProcesses = ['partner_cell', 'customer_sell', 'punching_process'];
      if (!validProcesses.includes(process_type)) {
        await client.query('ROLLBACK');
        return error(res, 'Invalid Process Assignment selection', 400);
      }

      if (!agree_terms) {
        await client.query('ROLLBACK');
        return error(res, 'You must agree to the Terms & Conditions to submit', 400);
      }
    }

    const trimmedMobile = mobile ? String(mobile).trim() : null;
    const trimmedName = full_name ? String(full_name).trim() : 'Draft Customer';
    const trimmedEmail = email ? String(email).trim() : null;

    let customerId;
    if (trimmedMobile) {
      const { rows: [existingCust] } = await client.query(
        `SELECT id FROM customers WHERE mobile = $1`, [trimmedMobile]
      );

      if (existingCust) {
        customerId = existingCust.id;
        await client.query(`
          UPDATE customers SET 
            full_name = COALESCE($1, full_name), 
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

    const commission = await calculatePartnerCommission(product_id, partnerId, monthly_salary || 0);

    const { rows: [{ nextval }] } = await client.query(`SELECT nextval('app_number_seq')`);
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const appNumber = `APP${datePart}${nextval}`;

    const appStatus = is_draft ? 'draft' : 'submitted';

    const { rows: [app] } = await client.query(`
      INSERT INTO applications
        (app_number, customer_id, product_id, partner_id, bank_id, submitted_by, loan_amount, commission_amount,
         status, process_type, business_type, gst_number, trade_license_number, company_name, pincode, city, state, country_code, agree_terms, submitted_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
      RETURNING *
    `, [
      appNumber, customerId, product_id, partnerId, product.bank_id, req.user.id,
      monthly_salary || 0, commission, appStatus, process_type, business_type || null,
      gst_number || null, trade_license_number || null, company_name || null,
      pincode || null, city || null, state || null, country_code, agree_terms,
    ]);

    await client.query(`
      INSERT INTO application_timeline (application_id, event_type, title, description, actor_type, actor_id)
      VALUES ($1, $2, $3, $4, 'partner', $5)
    `, [
      app.id,
      is_draft ? 'draft_saved' : 'applied',
      is_draft ? 'Draft Application Saved' : 'Application Submitted',
      is_draft ? 'Partner saved application draft' : `Application submitted via ${process_type.replace(/_/g, ' ')}`,
      req.user.id
    ]);

    await client.query('COMMIT');

    if (!is_draft) {
      const { sendEmail } = require('../../services/email/email.service');
      
      if (trimmedEmail) {
        sendEmail({
          to: trimmedEmail,
          subject: `Application Confirmation - #${appNumber} (${product.name})`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a;">
              <h2 style="color: #f97316;">Application Received - GharKaPaisa</h2>
              <p>Dear <strong>${trimmedName}</strong>,</p>
              <p>Your application for <strong>${product.name}</strong> with <strong>${product.bank_name || 'Bank'}</strong> has been successfully submitted by your Partner.</p>
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
    }

    return success(res, app, is_draft ? 'Draft saved successfully' : 'Application submitted successfully');
  } catch (err) {
    await client.query('ROLLBACK');
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
  submitPartnerApplication
};

