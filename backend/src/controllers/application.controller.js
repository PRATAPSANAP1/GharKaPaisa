const { query, getClient } = require('../config/db');
const { generateAppNumber, calculateCommission, getPaginationParams } = require('../utils/helpers');
const { creditCommission } = require('../services/wallet.service');
const { notify } = require('../services/notification.service');
const { uploadToS3 } = require('../services/s3.service');
const { success, created, error, notFound } = require('../utils/response');
const { paginate } = require('../utils/response');
const logger = require('../utils/logger');

// POST /applications — Agent submits application
const submitApplication = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { product_id, customer, loan_amount, notes } = req.body;
    const agentId = req.agent.id;

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
    const commission = calculateCommission(product, loan_amount);
    const appNumber = generateAppNumber();

    // Create application
    const { rows: [app] } = await client.query(`
      INSERT INTO applications
        (app_number, customer_id, product_id, agent_id, submitted_by, loan_amount, commission_amount, notes,
         status_history)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
        jsonb_build_array(jsonb_build_object('status','submitted','at',NOW(),'by',$5::text)))
      RETURNING id, app_number
    `, [appNumber, customerId, product_id, agentId, req.user.id, loan_amount, commission, notes]);

    await client.query('COMMIT');

    // Notify
    await notify.applicationSubmitted(req.user.id, appNumber);

    logger.info(`Application ${appNumber} submitted by agent ${agentId}`);
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

    // Credit commission on approval
    if (status === 'approved' || status === 'disbursed') {
      const commission = app.commission_amount || 0;
      if (commission > 0) {
        await creditCommission(app.agent_id, app.id, commission, `Commission for ${app.app_number}`, req.user.id);
      }
      // Get agent user_id for notification
      const { rows: [agent] } = await query(`SELECT user_id FROM agent_profiles WHERE id = $1`, [app.agent_id]);
      if (agent) await notify.applicationApproved(agent.user_id, app.app_number, commission);
    }

    if (status === 'rejected') {
      const { rows: [agent] } = await query(`SELECT user_id FROM agent_profiles WHERE id = $1`, [app.agent_id]);
      if (agent) await notify.applicationRejected(agent.user_id, app.app_number, rejection_reason);
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
    const { status, agent_id, product_id, from_date, to_date, search } = req.query;

    let where = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    // Agents can only see their own applications
    if (req.user.role === 'agent') {
      const { rows: [agent] } = await query(`SELECT id FROM agent_profiles WHERE user_id = $1`, [req.user.id]);
      if (!agent) return error(res, 'Agent profile not found', 404);
      where += ` AND a.agent_id = $${idx++}`;
      values.push(agent.id);
    } else if (agent_id) {
      where += ` AND a.agent_id = $${idx++}`;
      values.push(agent_id);
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
      JOIN agent_profiles ap ON ap.id = a.agent_id
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
          ap.agent_code, ap.first_name as agent_first_name, ap.last_name as agent_last_name
        ${baseQuery}
        ORDER BY a.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...values, limit, offset]),
    ]);

    return paginate(res, data.rows, parseInt(count.rows[0].count), page, limit);
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
        ap.agent_code, ap.first_name as agent_first_name, ap.last_name as agent_last_name
      FROM applications a
      JOIN customers c ON c.id = a.customer_id
      JOIN products p ON p.id = a.product_id
      JOIN banks b ON b.id = p.bank_id
      JOIN agent_profiles ap ON ap.id = a.agent_id
      WHERE a.id = $1
    `, [id]);
    if (!app) return notFound(res);
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

    const { url, key } = await uploadToS3(file.buffer, file.originalname, `applications/${id}`);

    const { rows: [app] } = await query(`SELECT documents FROM applications WHERE id = $1`, [id]);
    if (!app) return notFound(res);

    const docs = app.documents || [];
    docs.push({ doc_type, url, key, uploaded_at: new Date(), uploaded_by: req.user.id });

    await query(`UPDATE applications SET documents = $1 WHERE id = $2`, [JSON.stringify(docs), id]);

    return success(res, { url }, 'Document uploaded');
  } catch (err) {
    next(err);
  }
};

module.exports = { submitApplication, updateStatus, listApplications, getApplication, uploadApplicationDoc };
