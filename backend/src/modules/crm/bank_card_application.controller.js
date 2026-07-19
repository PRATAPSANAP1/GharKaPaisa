const { query } = require('../../config/database');
const { success, created, error, paginate } = require('../../utils/response/response');
const { getPaginationParams } = require('../../utils/helpers/helpers');

// Helper to generate atomic Application Number per bank short code
const generateAppNo = async (bankId) => {
  const { rows: [bank] } = await query(`SELECT short_code FROM banks WHERE id = $1`, [bankId]);
  const prefix = bank && bank.short_code ? bank.short_code.toUpperCase().replace(/[^A-Z]/g, '') : 'CARD';
  
  const { rows: [{ count }] } = await query(`SELECT COUNT(*) FROM bank_card_applications WHERE bank_id = $1`, [bankId]);
  const seqNum = String(parseInt(count) + 1).padStart(6, '0');
  return `${prefix}${seqNum}`;
};

// POST /api/v1/admin/bank-cards — Step 1: Create Credit Card Application
const createBankCardApplication = async (req, res, next) => {
  try {
    const {
      bank_id,
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

    if (!bank_id || !customer_name || !customer_mobile || !pan_number) {
      return error(res, 'Bank, Customer Name, Mobile Number, and PAN Number are required', 400);
    }

    if (!/^[6-9]\d{9}$/.test(String(customer_mobile).trim())) {
      return error(res, 'Please enter a valid 10-digit mobile number', 400);
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(pan_number).trim().toUpperCase())) {
      return error(res, 'Please enter a valid 10-character PAN number (e.g. ABCDE1234F)', 400);
    }

    const applicationNo = await generateAppNo(bank_id);

    const { rows: [application] } = await query(
      `INSERT INTO bank_card_applications (
        application_no, bank_id, credit_card_category, customer_name, customer_mobile, pan_number,
        resident_pincode, process_by, pan_check_comments, qd_executive_name, resident_pin_comments,
        next_qd_date, created_by, final_stage
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Customer Details')
      RETURNING *`,
      [
        applicationNo,
        bank_id,
        credit_card_category || 'Standard',
        customer_name.trim(),
        customer_mobile.trim(),
        pan_number.trim().toUpperCase(),
        resident_pincode || null,
        process_by || null,
        pan_check_comments || null,
        qd_executive_name || null,
        resident_pin_comments || null,
        next_qd_date || null,
        req.user?.id || null
      ]
    );

    // Initial timeline record
    await query(
      `INSERT INTO bank_card_application_timeline (application_id, stage, note, changed_by)
       VALUES ($1, 'Customer Details', 'Application initiated (Step 1)', $2)`,
      [application.id, req.user?.id || null]
    );

    return created(res, application, 'Credit card application created successfully');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/admin/bank-cards/:id/assist — Step 2: Save Credit Card Assist Fields
const updateAssistFields = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      dob,
      mother_name,
      residence_address,
      company_name,
      designation,
      email,
      official_email,
      gross_monthly_income,
      pan_check_executive_name
    } = req.body;

    const { rows: [existing] } = await query(`SELECT id FROM bank_card_applications WHERE id = $1`, [id]);
    if (!existing) return error(res, 'Bank card application not found', 404);

    const { rows: [updated] } = await query(
      `UPDATE bank_card_applications SET
        dob = COALESCE($1, dob),
        mother_name = COALESCE($2, mother_name),
        residence_address = COALESCE($3, residence_address),
        company_name = COALESCE($4, company_name),
        designation = COALESCE($5, designation),
        email = COALESCE($6, email),
        official_email = COALESCE($7, official_email),
        gross_monthly_income = COALESCE($8, gross_monthly_income),
        pan_check_executive_name = COALESCE($9, pan_check_executive_name),
        updated_by = $10,
        updated_at = NOW()
       WHERE id = $11 RETURNING *`,
      [
        dob || null,
        mother_name || null,
        residence_address || null,
        company_name || null,
        designation || null,
        email || null,
        official_email || null,
        gross_monthly_income || null,
        pan_check_executive_name || null,
        req.user?.id || null,
        id
      ]
    );

    return success(res, updated, 'Credit card assist details updated successfully');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/admin/bank-cards/:id/status — Update Status Information & Stage
const updateStatusFields = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
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
      not_interested_comment,
      kyc_pending_comment,
      timeline_note
    } = req.body;

    const { rows: [existing] } = await query(`SELECT * FROM bank_card_applications WHERE id = $1`, [id]);
    if (!existing) return error(res, 'Bank card application not found', 404);

    const { rows: [updated] } = await query(
      `UPDATE bank_card_applications SET
        app_code_status = COALESCE($1, app_code_status),
        qd_status = COALESCE($2, qd_status),
        surrogate = COALESCE($3, surrogate),
        income_status = COALESCE($4, income_status),
        blaze_status = COALESCE($5, blaze_status),
        telco_stage = COALESCE($6, telco_stage),
        official_mail_status = COALESCE($7, official_mail_status),
        vkyc_status = COALESCE($8, vkyc_status),
        dispatch_stage = COALESCE($9, dispatch_stage),
        final_stage = COALESCE($10, final_stage),
        not_interested_comment = COALESCE($11, not_interested_comment),
        kyc_pending_comment = COALESCE($12, kyc_pending_comment),
        updated_by = $13,
        updated_at = NOW()
       WHERE id = $14 RETURNING *`,
      [
        app_code_status || null,
        qd_status || null,
        surrogate || null,
        income_status || null,
        blaze_status || null,
        telco_stage || null,
        official_mail_status || null,
        vkyc_status || null,
        dispatch_stage || null,
        final_stage || null,
        not_interested_comment || null,
        kyc_pending_comment || null,
        req.user?.id || null,
        id
      ]
    );

    // Write timeline entry if final_stage changed or note provided
    if (final_stage || timeline_note) {
      const stageName = final_stage || existing.final_stage;
      await query(
        `INSERT INTO bank_card_application_timeline (application_id, stage, note, changed_by)
         VALUES ($1, $2, $3, $4)`,
        [id, stageName, timeline_note || `Stage updated to ${stageName}`, req.user?.id || null]
      );
    }

    return success(res, updated, 'Application status information updated successfully');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/admin/bank-cards/:id/decline — Update Rejection Fields (Conditional)
const updateDeclineFields = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      decline_description,
      decline_code,
      curable_solved,
      curable_executive,
      other_comments
    } = req.body;

    const { rows: [existing] } = await query(`SELECT final_stage FROM bank_card_applications WHERE id = $1`, [id]);
    if (!existing) return error(res, 'Bank card application not found', 404);

    if (existing.final_stage !== 'Declined') {
      return error(res, 'Decline details can only be saved when Final Stage is Declined', 400);
    }

    const { rows: [updated] } = await query(
      `UPDATE bank_card_applications SET
        decline_description = $1,
        decline_code = $2,
        curable_solved = $3,
        curable_executive = $4,
        other_comments = $5,
        updated_by = $6,
        updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [
        decline_description || null,
        decline_code || null,
        curable_solved || null,
        curable_executive || null,
        other_comments || null,
        req.user?.id || null,
        id
      ]
    );

    await query(
      `INSERT INTO bank_card_application_timeline (application_id, stage, note, changed_by)
       VALUES ($1, 'Declined', $2, $3)`,
      [id, `Decline info recorded: ${decline_code || 'No code'}`, req.user?.id || null]
    );

    return success(res, updated, 'Decline details recorded successfully');
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/bank-cards — List Applications with Filters
const listBankCardApplications = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { bank_id, bank_slug, final_stage, qd_status, income_status, dispatch_stage, category, executive, search } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (bank_id && bank_id !== 'all') {
      whereClause += ` AND bca.bank_id = $${idx}`;
      values.push(bank_id);
      idx++;
    } else if (bank_slug && bank_slug !== 'all') {
      whereClause += ` AND (LOWER(b.short_code) = $${idx} OR LOWER(b.name) ILIKE $${idx})`;
      values.push(`%${bank_slug.trim().toLowerCase()}%`);
      idx++;
    }

    if (final_stage && final_stage !== 'all') {
      whereClause += ` AND bca.final_stage = $${idx}`;
      values.push(final_stage);
      idx++;
    }

    if (qd_status && qd_status !== 'all') {
      whereClause += ` AND bca.qd_status = $${idx}`;
      values.push(qd_status);
      idx++;
    }

    if (income_status && income_status !== 'all') {
      whereClause += ` AND bca.income_status = $${idx}`;
      values.push(income_status);
      idx++;
    }

    if (dispatch_stage && dispatch_stage !== 'all') {
      whereClause += ` AND bca.dispatch_stage = $${idx}`;
      values.push(dispatch_stage);
      idx++;
    }

    if (category && category !== 'all') {
      whereClause += ` AND LOWER(bca.credit_card_category) = $${idx}`;
      values.push(category.trim().toLowerCase());
      idx++;
    }

    if (executive && executive !== 'all') {
      whereClause += ` AND (bca.process_by = $${idx} OR bca.qd_executive_name = $${idx} OR bca.pan_check_executive_name = $${idx})`;
      values.push(executive);
      idx++;
    }

    if (search) {
      whereClause += ` AND (bca.application_no ILIKE $${idx} OR bca.customer_name ILIKE $${idx} OR bca.customer_mobile ILIKE $${idx} OR bca.pan_number ILIKE $${idx})`;
      values.push(`%${search.trim()}%`);
      idx++;
    }

    const countQuery = `
      SELECT COUNT(*)
      FROM bank_card_applications bca
      JOIN banks b ON bca.bank_id = b.id
      ${whereClause}
    `;

    const dataQuery = `
      SELECT 
        bca.*,
        b.name as bank_name,
        b.short_code as bank_short_code,
        b.logo_url as bank_logo,
        u.name as process_by_user_name
      FROM bank_card_applications bca
      JOIN banks b ON bca.bank_id = b.id
      LEFT JOIN users u ON bca.process_by = u.id
      ${whereClause}
      ORDER BY bca.created_at DESC
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

// GET /api/v1/admin/bank-cards/:id — Application Detail + Timeline
const getBankCardApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows: [application] } = await query(
      `SELECT 
        bca.*,
        b.name as bank_name,
        b.short_code as bank_short_code,
        b.logo_url as bank_logo
       FROM bank_card_applications bca
       JOIN banks b ON bca.bank_id = b.id
       WHERE bca.id = $1`,
      [id]
    );

    if (!application) return error(res, 'Bank card application not found', 404);

    const { rows: timeline } = await query(
      `SELECT bcat.*, u.name as changed_by_user
       FROM bank_card_application_timeline bcat
       LEFT JOIN users u ON bcat.changed_by = u.id
       WHERE bcat.application_id = $1
       ORDER BY bcat.created_at ASC`,
      [id]
    );

    return success(res, { ...application, timeline });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/admin/bank-cards/reports — Aggregated Report Metrics
const getBankCardReports = async (req, res, next) => {
  try {
    const { bank_id, bank_slug } = req.query;
    let filter = '';
    const params = [];

    if (bank_id && bank_id !== 'all') {
      filter = 'WHERE bca.bank_id = $1';
      params.push(bank_id);
    } else if (bank_slug && bank_slug !== 'all') {
      filter = 'WHERE (LOWER(b.short_code) = $1 OR LOWER(b.name) ILIKE $1)';
      params.push(`%${bank_slug.trim().toLowerCase()}%`);
    }

    const { rows: [metrics] } = await query(
      `SELECT
        COUNT(*) as total_applications,
        COUNT(CASE WHEN final_stage = 'PAN Check' THEN 1 END) as pending_pan,
        COUNT(CASE WHEN final_stage = 'QD Verification' THEN 1 END) as pending_qd,
        COUNT(CASE WHEN final_stage = 'Income Verification' THEN 1 END) as pending_income,
        COUNT(CASE WHEN final_stage = 'V-KYC' THEN 1 END) as pending_vkyc,
        COUNT(CASE WHEN final_stage = 'Dispatch' THEN 1 END) as pending_dispatch,
        COUNT(CASE WHEN final_stage = 'Approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN final_stage = 'Declined' THEN 1 END) as declined_count
       FROM bank_card_applications bca
       JOIN banks b ON bca.bank_id = b.id
       ${filter}`,
      params
    );

    return success(res, metrics || {});
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBankCardApplication,
  updateAssistFields,
  updateStatusFields,
  updateDeclineFields,
  listBankCardApplications,
  getBankCardApplicationById,
  getBankCardReports
};
