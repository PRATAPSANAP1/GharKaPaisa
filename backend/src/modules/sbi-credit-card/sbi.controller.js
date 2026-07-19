const { query, getClient } = require('../../config/database');
const { success, created, error, paginate } = require('../../utils/response/response');
const { getPaginationParams } = require('../../utils/helpers/helpers');

// Helper to log timeline actions for SBI
const logSbiTimeline = async (client, applicationId, stage, activity, note, performedBy) => {
  await client.query(`
    INSERT INTO sbi_cc_application_timeline (application_id, stage, activity, note, changed_by)
    VALUES ($1, $2, $3, $4, $5)
  `, [applicationId, stage, activity, note, performedBy]);
};

// 1. Create Application (Step 1)
const createApplication = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const {
      credit_card_category,
      customer_name,
      customer_mobile,
      pan_number,
      resident_pincode,
      process_by,
      pan_check_comments,
      qd_executive_name,
      resident_pin_comments,
      next_qd_date
    } = req.body;

    if (!customer_name || !customer_mobile || !pan_number) {
      return error(res, 'Customer Name, Customer Mobile, and PAN Number are required', 400);
    }

    // Basic mobile validation
    if (!/^[6-9]\d{9}$/.test(customer_mobile.trim())) {
      return error(res, 'Please provide a valid 10-digit mobile number', 400);
    }

    // Basic PAN validation
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan_number.trim().toUpperCase())) {
      return error(res, 'Please provide a valid PAN number format (e.g. ABCDE1234F)', 400);
    }

    // Upsert Customer
    let customerId = null;
    const { rows: [existingCust] } = await client.query(
      `SELECT id FROM customers WHERE mobile = $1`, [customer_mobile.trim()]
    );

    if (existingCust) {
      customerId = existingCust.id;
      await client.query(`
        UPDATE customers 
        SET full_name = $1, pan_number = $2, pincode = $3, updated_at = NOW() 
        WHERE id = $4
      `, [customer_name.trim(), pan_number.trim().toUpperCase(), resident_pincode || null, customerId]);
    } else {
      const { rows: [newCust] } = await client.query(`
        INSERT INTO customers (full_name, mobile, pan_number, pincode, created_by)
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING id
      `, [customer_name.trim(), customer_mobile.trim(), pan_number.trim().toUpperCase(), resident_pincode || null, req.user.id]);
      customerId = newCust.id;
    }

    // Generate SBI Application Number (SBI001245 style)
    const { rows: [{ nextval }] } = await client.query(`SELECT nextval('sbi_app_number_seq')`);
    const applicationNo = `SBI${String(nextval).padStart(6, '0')}`;

    // Create Application
    const { rows: [app] } = await client.query(`
      INSERT INTO sbi_credit_card_applications (
        application_no, customer_id, partner_id, credit_card_category, customer_name, customer_mobile, 
        pan_number, resident_pincode, process_by, pan_check_comments, qd_executive_name, 
        resident_pin_comments, next_qd_date, final_stage, created_by, updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Customer Details', $14, $14)
      RETURNING *
    `, [
      applicationNo,
      customerId,
      req.partner?.id || null,
      credit_card_category,
      customer_name.trim(),
      customer_mobile.trim(),
      pan_number.trim().toUpperCase(),
      resident_pincode || null,
      process_by || null,
      pan_check_comments || null,
      qd_executive_name || null,
      resident_pin_comments || null,
      next_qd_date || null,
      req.user.id
    ]);

    // Initial timeline entry
    await logSbiTimeline(client, app.id, 'Customer Details', 'Application Created', 'Step 1 Application logged in admin panel', req.user.id);

    await client.query('COMMIT');
    return created(res, app, 'SBI Credit Card Application created successfully (Step 1)');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// 2. Update Application (Step 2 + general edits)
const updateApplication = async (req, res, next) => {
  const { id } = req.params;
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Fetch existing application
    const { rows: [existing] } = await client.query(
      `SELECT * FROM sbi_credit_card_applications WHERE id = $1`, [id]
    );
    if (!existing) {
      return error(res, 'SBI Application not found', 404);
    }

    const {
      dob,
      mother_name,
      residence_address,
      company_name,
      designation,
      email,
      official_email,
      gross_monthly_income,
      resident_pin_comment,
      pan_check_executive,
      app_code_status,
      qd_status,
      surrogate,
      income_status,
      blaze_status,
      telco_stage,
      official_mail_status,
      vkyc_status,
      dispatch_stage,
      final_stage,
      decline_description,
      decline_code,
      curable_solved,
      curable_executive,
      other_comments,
      not_interested_comment,
      kyc_pending_comment,
      process_by,
      pan_check_comments,
      qd_executive_name,
      resident_pin_comments,
      next_qd_date,
      customer_name,
      customer_mobile,
      pan_number,
      resident_pincode,
      credit_card_category
    } = req.body;

    // Update Customer details if updated
    const updatedMobile = customer_mobile || existing.customer_mobile;
    const updatedName = customer_name || existing.customer_name;
    const updatedPan = pan_number || existing.pan_number;
    const updatedPincode = resident_pincode || existing.resident_pincode;

    if (existing.customer_id) {
      await client.query(`
        UPDATE customers 
        SET full_name = $1, pan_number = $2, dob = $3, email = $4, pincode = $5, updated_at = NOW()
        WHERE id = $6
      `, [
        updatedName.trim(),
        updatedPan.trim().toUpperCase(),
        dob || null,
        email || null,
        updatedPincode || null,
        existing.customer_id
      ]);
    }

    // Perform Update on application
    const { rows: [updated] } = await client.query(`
      UPDATE sbi_credit_card_applications
      SET 
        credit_card_category = $1,
        customer_name = $2,
        customer_mobile = $3,
        pan_number = $4,
        resident_pincode = $5,
        process_by = $6,
        pan_check_comments = $7,
        qd_executive_name = $8,
        resident_pin_comments = $9,
        next_qd_date = $10,
        dob = $11,
        mother_name = $12,
        residence_address = $13,
        company_name = $14,
        designation = $15,
        email = $16,
        official_email = $17,
        gross_monthly_income = $18,
        resident_pin_comment = $19,
        pan_check_executive = $20,
        application_code_status = $21,
        qd_status = $22,
        surrogate = $23,
        income_status = $24,
        blaze_status = $25,
        telco_stage = $26,
        official_mail_status = $27,
        vkyc_status = $28,
        dispatch_stage = $29,
        final_stage = $30,
        decline_description = $31,
        decline_code = $32,
        curable_solved = $33,
        curable_executive = $34,
        other_comments = $35,
        not_interested_comment = $36,
        kyc_pending_comment = $37,
        updated_by = $38,
        updated_at = NOW()
      WHERE id = $39
      RETURNING *
    `, [
      credit_card_category !== undefined ? credit_card_category : existing.credit_card_category,
      updatedName,
      updatedMobile,
      updatedPan.toUpperCase(),
      updatedPincode,
      process_by !== undefined ? process_by : existing.process_by,
      pan_check_comments !== undefined ? pan_check_comments : existing.pan_check_comments,
      qd_executive_name !== undefined ? qd_executive_name : existing.qd_executive_name,
      resident_pin_comments !== undefined ? resident_pin_comments : existing.resident_pin_comments,
      next_qd_date !== undefined ? next_qd_date : existing.next_qd_date,
      dob !== undefined ? dob : existing.dob,
      mother_name !== undefined ? mother_name : existing.mother_name,
      residence_address !== undefined ? residence_address : existing.residence_address,
      company_name !== undefined ? company_name : existing.company_name,
      designation !== undefined ? designation : existing.designation,
      email !== undefined ? email : existing.email,
      official_email !== undefined ? official_email : existing.official_email,
      gross_monthly_income !== undefined ? gross_monthly_income : existing.gross_monthly_income,
      resident_pin_comment !== undefined ? resident_pin_comment : existing.resident_pin_comment,
      pan_check_executive !== undefined ? pan_check_executive : existing.pan_check_executive,
      app_code_status !== undefined ? app_code_status : existing.application_code_status,
      qd_status !== undefined ? qd_status : existing.qd_status,
      surrogate !== undefined ? surrogate : existing.surrogate,
      income_status !== undefined ? income_status : existing.income_status,
      blaze_status !== undefined ? blaze_status : existing.blaze_status,
      telco_stage !== undefined ? telco_stage : existing.telco_stage,
      official_mail_status !== undefined ? official_mail_status : existing.official_mail_status,
      vkyc_status !== undefined ? vkyc_status : existing.vkyc_status,
      dispatch_stage !== undefined ? dispatch_stage : existing.dispatch_stage,
      final_stage !== undefined ? final_stage : existing.final_stage,
      decline_description !== undefined ? decline_description : existing.decline_description,
      decline_code !== undefined ? decline_code : existing.decline_code,
      curable_solved !== undefined ? curable_solved : existing.curable_solved,
      curable_executive !== undefined ? curable_executive : existing.curable_executive,
      other_comments !== undefined ? other_comments : existing.other_comments,
      not_interested_comment !== undefined ? not_interested_comment : existing.not_interested_comment,
      kyc_pending_comment !== undefined ? kyc_pending_comment : existing.kyc_pending_comment,
      req.user.id,
      id
    ]);

    // Check if stage has changed, log timeline event
    if (final_stage && final_stage !== existing.final_stage) {
      await logSbiTimeline(client, id, final_stage, 'Stage Updated', `Application moved to stage: ${final_stage}`, req.user.id);
    }

    await client.query('COMMIT');
    return success(res, updated, 'SBI Credit Card Application updated successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// 3. List Applications with filters & search
const listApplications = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const {
      search,
      cardCategory,
      finalStage,
      qdStatus,
      incomeStatus,
      dispatchStatus,
      partnerId,
      customerId,
      panNumber,
      mobileNumber,
      executiveId,
      fromDate,
      toDate
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (search) {
      whereClause += ` AND (
        s.customer_name ILIKE $${idx} OR 
        s.customer_mobile ILIKE $${idx} OR 
        s.application_no ILIKE $${idx} OR 
        s.pan_number ILIKE $${idx}
      )`;
      values.push(`%${search.trim()}%`);
      idx++;
    }

    if (cardCategory) {
      whereClause += ` AND s.credit_card_category = $${idx}`;
      values.push(cardCategory);
      idx++;
    }

    if (finalStage) {
      whereClause += ` AND s.final_stage = $${idx}`;
      values.push(finalStage);
      idx++;
    }

    if (qdStatus) {
      whereClause += ` AND s.qd_status = $${idx}`;
      values.push(qdStatus);
      idx++;
    }

    if (incomeStatus) {
      whereClause += ` AND s.income_status = $${idx}`;
      values.push(incomeStatus);
      idx++;
    }

    if (dispatchStatus) {
      whereClause += ` AND s.dispatch_stage = $${idx}`;
      values.push(dispatchStatus);
      idx++;
    }

    if (partnerId) {
      whereClause += ` AND s.partner_id = $${idx}`;
      values.push(partnerId);
      idx++;
    }

    if (customerId) {
      whereClause += ` AND s.customer_id = $${idx}`;
      values.push(customerId);
      idx++;
    }

    if (panNumber) {
      whereClause += ` AND s.pan_number ILIKE $${idx}`;
      values.push(`%${panNumber.trim()}%`);
      idx++;
    }

    if (mobileNumber) {
      whereClause += ` AND s.customer_mobile ILIKE $${idx}`;
      values.push(`%${mobileNumber.trim()}%`);
      idx++;
    }

    if (executiveId) {
      whereClause += ` AND s.process_by = $${idx}`;
      values.push(executiveId);
      idx++;
    }

    if (fromDate) {
      whereClause += ` AND s.created_at >= $${idx}`;
      values.push(fromDate);
      idx++;
    }

    if (toDate) {
      whereClause += ` AND s.created_at <= $${idx}`;
      values.push(toDate);
      idx++;
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM sbi_credit_card_applications s
      ${whereClause}
    `;

    const dataQuery = `
      SELECT 
        s.*, 
        p.partner_code, 
        p.first_name as partner_first_name, 
        p.last_name as partner_last_name,
        u.full_name as executive_name
      FROM sbi_credit_card_applications s
      LEFT JOIN partner_profiles p ON p.id = s.partner_id
      LEFT JOIN users u ON u.id = s.process_by
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const [countResult, dataResult] = await Promise.all([
      query(countQuery, values),
      query(dataQuery, [...values, limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].count);
    return paginate(res, dataResult.rows, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// 4. Get Single Application by ID
const getApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [app] } = await query(`
      SELECT 
        s.*, 
        p.partner_code, 
        p.first_name as partner_first_name, 
        p.last_name as partner_last_name,
        u.full_name as executive_name
      FROM sbi_credit_card_applications s
      LEFT JOIN partner_profiles p ON p.id = s.partner_id
      LEFT JOIN users u ON u.id = s.process_by
      WHERE s.id = $1
    `, [id]);

    if (!app) {
      return error(res, 'SBI Application not found', 404);
    }
    return success(res, app, 'SBI Application fetched successfully');
  } catch (err) {
    next(err);
  }
};

// 5. Get Application Timeline
const getTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(`
      SELECT t.*, u.full_name as performed_by_name
      FROM sbi_cc_application_timeline t
      LEFT JOIN users u ON u.id = t.changed_by
      WHERE t.application_id = $1
      ORDER BY t.created_at DESC
    `, [id]);

    return success(res, rows, 'Timeline logs fetched successfully');
  } catch (err) {
    next(err);
  }
};

// 6. Add Timeline Event / Progress Stage Manually
const addTimelineEvent = async (req, res, next) => {
  const { id } = req.params;
  const { stage, activity, note } = req.body;

  if (!stage || !activity) {
    return error(res, 'Stage and Activity description are required', 400);
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Verify application exists
    const { rows: [app] } = await client.query(`SELECT id FROM sbi_credit_card_applications WHERE id = $1`, [id]);
    if (!app) {
      return error(res, 'Application not found', 404);
    }

    // Insert timeline record
    await logSbiTimeline(client, id, stage, activity, note || null, req.user.id);

    // Update final_stage in main table if a stage transition is intended
    await client.query(`
      UPDATE sbi_credit_card_applications 
      SET final_stage = $1, updated_at = NOW(), updated_by = $2 
      WHERE id = $3
    `, [stage, req.user.id, id]);

    await client.query('COMMIT');
    return success(res, null, 'Timeline activity logged successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// 7. Get Reports Aggregates
const getReports = async (req, res, next) => {
  try {
    // 1. Total metric cards counts
    const totalCountQuery = `SELECT COUNT(*) as total FROM sbi_credit_card_applications`;
    const pendingPanQuery = `SELECT COUNT(*) as count FROM sbi_credit_card_applications WHERE final_stage = 'PAN Check'`;
    const pendingQdQuery = `SELECT COUNT(*) as count FROM sbi_credit_card_applications WHERE final_stage = 'QD Verification'`;
    const pendingIncomeQuery = `SELECT COUNT(*) as count FROM sbi_credit_card_applications WHERE final_stage = 'Income Verification'`;
    const pendingVkycQuery = `SELECT COUNT(*) as count FROM sbi_credit_card_applications WHERE final_stage = 'V-KYC'`;
    const pendingDispatchQuery = `SELECT COUNT(*) as count FROM sbi_credit_card_applications WHERE final_stage = 'Dispatch'`;
    const approvedQuery = `SELECT COUNT(*) as count FROM sbi_credit_card_applications WHERE final_stage = 'Approved' OR final_stage = 'Delivered'`;
    const declinedQuery = `SELECT COUNT(*) as count FROM sbi_credit_card_applications WHERE final_stage = 'Declined'`;

    const [
      totalRes, pendingPanRes, pendingQdRes, pendingIncomeRes, pendingVkycRes, pendingDispatchRes, approvedRes, declinedRes
    ] = await Promise.all([
      query(totalCountQuery),
      query(pendingPanQuery),
      query(pendingQdQuery),
      query(pendingIncomeQuery),
      query(pendingVkycQuery),
      query(pendingDispatchQuery),
      query(approvedQuery),
      query(declinedQuery)
    ]);

    const stats = {
      totalApplications: parseInt(totalRes.rows[0].total || 0),
      pendingPAN: parseInt(pendingPanRes.rows[0].count || 0),
      pendingQD: parseInt(pendingQdRes.rows[0].count || 0),
      pendingIncome: parseInt(pendingIncomeRes.rows[0].count || 0),
      pendingVKYC: parseInt(pendingVkycRes.rows[0].count || 0),
      pendingDispatch: parseInt(pendingDispatchRes.rows[0].count || 0),
      approved: parseInt(approvedRes.rows[0].count || 0),
      declined: parseInt(declinedRes.rows[0].count || 0),
    };

    // 2. Executive performance stats (Count by executive)
    const execPerformanceQuery = `
      SELECT u.full_name as executive_name, COUNT(s.id) as count
      FROM sbi_credit_card_applications s
      JOIN users u ON u.id = s.process_by
      GROUP BY u.full_name
      ORDER BY count DESC
      LIMIT 10
    `;
    const execPerformance = await query(execPerformanceQuery);

    // 3. Daily applications volume (last 15 days)
    const dailyVolumeQuery = `
      SELECT TO_CHAR(created_at, 'DD Mon') as date_label, COUNT(id) as count
      FROM sbi_credit_card_applications
      WHERE created_at >= NOW() - INTERVAL '15 days'
      GROUP BY TO_CHAR(created_at, 'DD Mon'), DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at) ASC
    `;
    const dailyVolume = await query(dailyVolumeQuery);

    // 4. Monthly applications volume (last 6 months)
    const monthlyVolumeQuery = `
      SELECT TO_CHAR(created_at, 'YYYY-MM') as month_key, TO_CHAR(created_at, 'Mon YYYY') as month_label, COUNT(id) as count
      FROM sbi_credit_card_applications
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM'), TO_CHAR(created_at, 'Mon YYYY')
      ORDER BY TO_CHAR(created_at, 'YYYY-MM') ASC
    `;
    const monthlyVolume = await query(monthlyVolumeQuery);

    return success(res, {
      stats,
      executivePerformance: execPerformance.rows,
      dailyVolume: dailyVolume.rows,
      monthlyVolume: monthlyVolume.rows
    }, 'SBI CC dashboard statistics loaded');
  } catch (err) {
    next(err);
  }
};

// 8. Get list of all admin/employee users to assign
const getExecutives = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT id, full_name, role 
      FROM users 
      WHERE role IN ('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE') AND is_active = true
      ORDER BY full_name ASC
    `);
    return success(res, rows, 'Executives list fetched successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createApplication,
  updateApplication,
  listApplications,
  getApplication,
  getTimeline,
  addTimelineEvent,
  getReports,
  getExecutives
};
