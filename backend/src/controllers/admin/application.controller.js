const { query, getClient } = require('../../config/db');
const { generateAppNumber, calculateCommission, getPaginationParams } = require('../../utils/helpers');
const { creditCommission, releaseHold } = require('../../services/wallet/wallet.service.js');
const { calculatePartnerCommission } = require('../../services/partner/commission.service.js');
const { notify } = require('../../services/notification/notification.service.js');
const { uploadToS3 } = require('../../services/partner/s3.service.js');
const { success, created, error, notFound, forbidden, paginate } = require('../../utils/response');
const logger = require('../../utils/logger');
const { logAction } = require('../../services/analytics/audit.service.js');

// POST /applications — Partner submits application
const submitApplication = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { product_id, customer, loan_amount, notes } = req.body;
    const PartnerId = req.Partner.id;

    // Validate product
    const { rows: [product] } = await client.query(
      `SELECT p.*, b.name as bank_name FROM products p JOIN banks b ON b.id = p.bank_id WHERE p.id = $1 AND p.is_active = true`,
      [product_id]
    );
    if (!product) return error(res, 'Product not found or inactive', 404);

    // Upsert customer
    let customerId;
    const { rows: [existingCust] } = await client.query(
      `SELECT id FROM customers WHERE mobile = $1`, [customer.mobile]
    );
    if (existingCust) {
      customerId = existingCust.id;
      // Update customer info
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
      customer.city, customer.state, customer.pincode, customer.employer, req.user.id]);
      customerId = newCust.id;
    }

    // Calculate commission
    const commission = await calculatePartnerCommission(product_id, PartnerId, loan_amount);
    
    // Generate unique collision-safe application number
    const { rows: [{ nextval }] } = await client.query(`SELECT nextval('app_number_seq')`);
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const appNumber = `APP${datePart}${nextval}`;

    // Create application
    const { rows: [app] } = await client.query(`
      INSERT INTO applications
        (app_number, customer_id, product_id, Partner_id, submitted_by, loan_amount, commission_amount, notes,
         status_history)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
        jsonb_build_array(jsonb_build_object('status','submitted','at',NOW(),'by',$9::text)))
      RETURNING id, app_number
    `, [appNumber, customerId, product_id, PartnerId, req.user.id, loan_amount, commission, notes, req.user.id.toString()]);

    await client.query('COMMIT');

    // Notify
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

    const { product_id, customer, loan_amount, notes, partner_code } = req.body;

    // Validate product
    const { rows: [product] } = await client.query(
      `SELECT p.*, b.name as bank_name FROM products p JOIN banks b ON b.id = p.bank_id WHERE p.id = $1 AND p.is_active = true`,
      [product_id]
    );
    if (!product) return error(res, 'Product not found or inactive', 404);

    // Get Partner ID (either from partner_code or default first partner for direct leads)
    let partnerId;
    if (partner_code) {
      const { rows: [partner] } = await client.query(`SELECT id FROM Partner_profiles WHERE Partner_code = $1`, [partner_code]);
      if (partner) partnerId = partner.id;
    }
    if (!partnerId) {
      const { rows: [defaultPartner] } = await client.query(`SELECT id FROM Partner_profiles LIMIT 1`);
      if (!defaultPartner) {
        return error(res, 'System cannot accept public leads yet as no Partner profiles exist to route to.', 500);
      }
      partnerId = defaultPartner.id;
    }

    // System Admin User ID for created_by
    const { rows: [sysUser] } = await client.query(`SELECT id FROM users WHERE role='SUPER_ADMIN' LIMIT 1`);
    const sysUserId = sysUser.id;

    // Upsert customer
    let customerId;
    const { rows: [existingCust] } = await client.query(
      `SELECT id FROM customers WHERE mobile = $1`, [customer.mobile]
    );
    
    if (existingCust) {
      customerId = existingCust.id;
      // Update customer info
      await client.query(`
        UPDATE customers SET full_name=$1, email=$2, city=$3, updated_at=NOW() WHERE id=$4
      `, [customer.full_name, customer.email, customer.city, customerId]);
    } else {
      const { rows: [newCust] } = await client.query(`
        INSERT INTO customers (full_name, mobile, email, city, created_by)
        VALUES ($1,$2,$3,$4,$5) RETURNING id
      `, [customer.full_name, customer.mobile, customer.email, customer.city, sysUserId]);
      customerId = newCust.id;
    }

    // Calculate commission
    const commission = await calculatePartnerCommission(product_id, partnerId, loan_amount);
    
    // Generate unique collision-safe application number
    const { rows: [{ nextval }] } = await client.query(`SELECT nextval('app_number_seq')`);
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const appNumber = `APP${datePart}${nextval}`;

    // Create application
    const { rows: [app] } = await client.query(`
      INSERT INTO applications
        (app_number, customer_id, product_id, Partner_id, submitted_by, loan_amount, commission_amount, notes,
         status_history)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
        jsonb_build_array(jsonb_build_object('status','submitted','at',NOW(),'by',$9::text)))
      RETURNING id, app_number
    `, [appNumber, customerId, product_id, partnerId, sysUserId, loan_amount, commission, notes, sysUserId.toString()]);

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

// PATCH /applications/:id/status (Admin/Employee updates status)
const updateStatus = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status, bank_ref_number, approved_amount, rejection_reason, notes } = req.body;

    const { rows: [app] } = await client.query(`SELECT * FROM applications WHERE id = $1 FOR UPDATE`, [id]);
    if (!app) return notFound(res, 'Application not found');

    // Append to status history
    const historyEntry = JSON.stringify({ status, at: new Date(), by: req.user.id, notes });
    await client.query(`
      UPDATE applications SET
        status = $1,
        bank_ref_number = COALESCE($2, bank_ref_number),
        approved_amount = COALESCE($3, approved_amount),
        rejection_reason = COALESCE($4, rejection_reason),
        status_history = status_history || $5::jsonb,
        updated_at = NOW()
      WHERE id = $6
    `, [status, bank_ref_number, approved_amount, rejection_reason, historyEntry, id]);

    await client.query('COMMIT');

    // Log application status update to audit logs
    await logAction(req, 'UPDATE_APPLICATION_STATUS', id, { status, bank_ref_number, approved_amount });

    // Credit commission on approval or disbursal, but only once
    if (status === 'approved' || status === 'disbursed') {
      const { rows: [existingTx] } = await query(
        `SELECT id FROM wallet_transactions WHERE application_id = $1 AND type = 'credit'`, [app.id]
      );
      if (!existingTx) {
        const commission = app.commission_amount || 0;
        if (commission > 0) {
          await creditCommission(app.Partner_id, app.id, commission, `Commission for ${app.app_number}`, req.user.id);
        }
        // Get Partner user_id for notification
        const { rows: [Partner] } = await query(`SELECT user_id FROM Partner_profiles WHERE id = $1`, [app.Partner_id]);
        if (Partner) await notify.applicationApproved(Partner.user_id, app.app_number, commission);
      }
    }

    // Release commission on confirmed status, converting pending earnings to withdrawable balance
    if (status === 'confirmed') {
      const { rows: [pendingTx] } = await query(
        `SELECT id, amount FROM wallet_transactions WHERE application_id = $1 AND type = 'credit' AND status = 'pending'`, [app.id]
      );
      if (pendingTx) {
        await releaseHold(app.Partner_id, pendingTx.amount, {
          txn_id: pendingTx.id,
          processed_by: req.user.id,
          reference_type: 'commission',
          reference_id: app.id,
          description: `Commission released for App ${app.app_number}`
        });
        // Update applications commission_status to approved
        await query(`UPDATE applications SET commission_status = 'approved', updated_at = NOW() WHERE id = $1`, [app.id]);
        
        // Notify Partner
        const { rows: [Partner] } = await query(`SELECT user_id FROM Partner_profiles WHERE id = $1`, [app.Partner_id]);
        if (Partner) await notify.commissionCredited(Partner.user_id, pendingTx.amount);
      }
    }

    if (status === 'rejected') {
      const { rows: [Partner] } = await query(`SELECT user_id FROM Partner_profiles WHERE id = $1`, [app.Partner_id]);
      if (Partner) await notify.applicationRejected(Partner.user_id, app.app_number, rejection_reason);
    }

    return success(res, {}, 'Application status updated');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// GET /applications — Filtered list
const listApplications = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status, Partner_id, product_id, from_date, to_date, search } = req.query;

    let where = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    // Partners can only see their own applications
    if (req.user.role === 'PARTNER') {
      const { rows: [Partner] } = await query(`SELECT id FROM Partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (!Partner) return error(res, 'Partner profile not found', 404);
      where += ` AND a.Partner_id = $${idx++}`;
      values.push(Partner.id);
    } else if (Partner_id) {
      where += ` AND a.Partner_id = $${idx++}`;
      values.push(Partner_id);
    }

    if (status) { where += ` AND a.status = $${idx++}`; values.push(status); }
    if (product_id) { where += ` AND a.product_id = $${idx++}`; values.push(product_id); }
    if (from_date) { where += ` AND a.created_at >= $${idx++}`; values.push(from_date); }
    if (to_date) { where += ` AND a.created_at <= $${idx++}`; values.push(to_date + ' 23:59:59'); }
    if (search) {
      where += ` AND (a.app_number ILIKE $${idx} OR c.full_name ILIKE $${idx} OR c.mobile ILIKE $${idx})`;
      values.push(`%${search}%`); idx++;
    }

    const baseQuery = `
      FROM applications a
      JOIN customers c ON c.id = a.customer_id
      JOIN products p ON p.id = a.product_id
      JOIN banks b ON b.id = p.bank_id
      JOIN Partner_profiles ap ON ap.id = a.Partner_id
      ${where}
    `;

    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) ${baseQuery}`, values),
      query(`
        SELECT a.id, a.app_number, a.status, a.loan_amount, a.approved_amount, a.commission_amount,
          a.commission_status, a.created_at, a.updated_at, a.bank_ref_number,
          c.full_name as customer_name, c.mobile as customer_mobile,
          p.name as product_name, p.category,
          b.name as bank_name, b.short_code as bank_code,
          ap.Partner_code, ap.first_name as Partner_first_name, ap.last_name as Partner_last_name
        ${baseQuery}
        ORDER BY a.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...values, limit, offset]),
    ]);

    const { rows: [privacySetting] } = await query("SELECT value FROM system_settings WHERE key = 'admin_privacy_mode'");
    const isPrivacyOn = privacySetting && privacySetting.value === 'on';
    const shouldMask = isPrivacyOn && req.user && req.user.role === 'ADMIN';

    const processedRows = data.rows.map(row => {
      if (shouldMask) {
        return {
          ...row,
          Partner_first_name: 'Partner',
          Partner_last_name: row.Partner_code
        };
      }
      return row;
    });

    return paginate(res, processedRows, parseInt(count.rows[0].count), page, limit);
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
        ap.Partner_code, ap.first_name as Partner_first_name, ap.last_name as Partner_last_name
      FROM applications a
      JOIN customers c ON c.id = a.customer_id
      JOIN products p ON p.id = a.product_id
      JOIN banks b ON b.id = p.bank_id
      JOIN Partner_profiles ap ON ap.id = a.Partner_id
      WHERE a.id = $1
    `, [id]);
    if (!app) return notFound(res);

    // Ownership check: Partner can only view their own applications
    if (req.user.role === 'PARTNER') {
      const { rows: [Partner] } = await query(`SELECT id FROM Partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (!Partner || app.Partner_id !== Partner.id) {
        return forbidden(res, 'Access denied. You do not own this application.');
      }
    }

    const { rows: [privacySetting] } = await query("SELECT value FROM system_settings WHERE key = 'admin_privacy_mode'");
    const isPrivacyOn = privacySetting && privacySetting.value === 'on';
    const shouldMask = isPrivacyOn && req.user && req.user.role === 'ADMIN';

    if (shouldMask) {
      app.Partner_first_name = 'Partner';
      app.Partner_last_name = app.Partner_code;
    }

    return success(res, app);
  } catch (err) {
    next(err);
  }
};

// POST /applications/:id/documents — Upload application docs
const uploadApplicationDoc = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { doc_type } = req.body;
    const file = req.file;
    if (!file) return error(res, 'No file uploaded');

    // S3 configuration check
    const isS3Configured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET;
    if (!isS3Configured) {
      return error(res, 'S3 storage service is not configured. Upload failed.', 503);
    }

    const { rows: [app] } = await query(`SELECT documents, Partner_id FROM applications WHERE id = $1`, [id]);
    if (!app) return notFound(res);

    // Ownership check: Partner can only upload docs for their own applications
    if (req.user.role === 'PARTNER') {
      const { rows: [Partner] } = await query(`SELECT id FROM Partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (!Partner || app.Partner_id !== Partner.id) {
        return forbidden(res, 'Access denied. You do not own this application.');
      }
    }

    const { url, key } = await uploadToS3(file.buffer, file.originalname, `applications/${id}`);

    const docs = app.documents || [];
    docs.push({ doc_type, url, key, uploaded_at: new Date(), uploaded_by: req.user.id });

    await query(`UPDATE applications SET documents = $1 WHERE id = $2`, [JSON.stringify(docs), id]);

    return success(res, { url }, 'Document uploaded');
  } catch (err) {
    next(err);
  }
};

module.exports = { submitApplication, submitPublicApplication, updateStatus, listApplications, getApplication, uploadApplicationDoc };
