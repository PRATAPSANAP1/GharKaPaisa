const { query } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Controller: KYC Operator
 * Restricts access exclusively to authorized KYC Operators and eligible bank applications.
 */

// Helper to ensure all required KYC and operator tracking columns exist
let columnsChecked = false;
const ensureKycColumns = async () => {
  if (columnsChecked) return;
  try {
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'PENDING'`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS kyc_remarks TEXT`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS vkyc_status VARCHAR(50) DEFAULT 'PENDING'`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS bank_application_number VARCHAR(100)`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20)`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS vkyc_link TEXT`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS user_remark TEXT`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS kyc_stage VARCHAR(100) DEFAULT 'Vkyc pending'`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS vkyc_stage VARCHAR(100) DEFAULT 'Vkyc pending'`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS bio_stage VARCHAR(100) DEFAULT 'Bio pending'`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS digilocker_stage VARCHAR(100) DEFAULT 'Digilocker 1 Rupee Credit/Debit Pending'`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS ipa_stage VARCHAR(100)`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS soft_approval_status VARCHAR(100)`).catch(() => {});
    
    // Operator tracking columns
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_operator_id UUID`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_operator_name VARCHAR(255)`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_operator_code VARCHAR(100)`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_operator_role VARCHAR(100)`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_operator_designation VARCHAR(100)`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_operated_at TIMESTAMP WITH TIME ZONE`).catch(() => {});

    // Physical details columns fallback
    await query(`ALTER TABLE physical_application_details ADD COLUMN IF NOT EXISTS kyc_stage VARCHAR(100)`).catch(() => {});
    await query(`ALTER TABLE physical_application_details ADD COLUMN IF NOT EXISTS vkyc_stage VARCHAR(100)`).catch(() => {});
    await query(`ALTER TABLE physical_application_details ADD COLUMN IF NOT EXISTS bio_stage VARCHAR(100)`).catch(() => {});
    await query(`ALTER TABLE physical_application_details ADD COLUMN IF NOT EXISTS digilocker_stage VARCHAR(100)`).catch(() => {});
    await query(`ALTER TABLE physical_application_details ADD COLUMN IF NOT EXISTS vkyc_url TEXT`).catch(() => {});
    await query(`ALTER TABLE physical_application_details ADD COLUMN IF NOT EXISTS user_remark TEXT`).catch(() => {});
    await query(`ALTER TABLE physical_application_details ADD COLUMN IF NOT EXISTS kyc_remarks TEXT`).catch(() => {});

    // Immutable operator history table
    await query(`
      CREATE TABLE IF NOT EXISTS application_operator_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID NOT NULL,
        operator_id UUID,
        operator_name VARCHAR(255),
        operator_role VARCHAR(100),
        operator_designation VARCHAR(100),
        operator_code VARCHAR(100),
        action_type VARCHAR(100),
        field_changes JSONB,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    columnsChecked = true;
  } catch (err) {
    logger.warn('Failed ensuring KYC and operator history columns:', err.message);
  }
};

// Helper to format operator code
const getOperatorCode = (user) => {
  if (!user) return 'ADM-KYC-0000';
  return user.employee_code || user.admin_code || user.employee_id || user.code || `ADM-KYC-${String(user.id || '0000').slice(0, 6)}`;
};

// Helper to record operator audit log
const recordOperatorAudit = async (appId, user, actionType, changes, notes) => {
  try {
    const operatorCode = getOperatorCode(user);
    const opId = user.id || null;
    const opName = user.full_name || user.name || user.email || 'KYC Operator';
    const opRole = user.role || 'ADMIN';
    const opDesignation = user.designation || 'KYC_OPERATOR';

    await query(`
      INSERT INTO application_operator_history 
        (application_id, operator_id, operator_name, operator_role, operator_designation, operator_code, action_type, field_changes, notes, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `, [appId, opId, opName, opRole, opDesignation, operatorCode, actionType, JSON.stringify(changes || {}), notes || null]);

    await query(`
      UPDATE applications 
      SET last_operator_id = $1,
          last_operator_name = $2,
          last_operator_code = $3,
          last_operator_role = $4,
          last_operator_designation = $5,
          last_operated_at = NOW()
      WHERE id = $6
    `, [opId, opName, operatorCode, opRole, opDesignation, appId]).catch(() => {});
  } catch (err) {
    logger.error('Failed to record KYC operator audit log:', err.message);
  }
};

// Helper to check soft approval decline
const isSoftApprovalDeclined = (softApprovalStatus) => {
  const status = String(softApprovalStatus || '').trim().toLowerCase();
  return status === 'declined' || status === 'rejected';
};

/**
 * GET /api/v1/kyc-operator/applications
 * Retrieves applications eligible for KYC Operator queue based on bank-specific business rules.
 */
const getKycApplications = async (req, res) => {
  try {
    await ensureKycColumns();
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    const { search, product_id, bank_id, kyc_status, vkyc_stage, bio_stage, digilocker_stage, start_date, end_date } = req.query;

    const userId = req.user.id;
    const userRole = String(req.user.role || '').toUpperCase();
    const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'SUPERADMIN';

    let whereConditions = [
      `LOWER(TRIM(COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), ''))) NOT IN ('declined', 'rejected')`,
      `LOWER(TRIM(COALESCE(a.kyc_stage, a.vkyc_stage, pad.kyc_stage, pad.vkyc_stage, 'vkyc pending'))) NOT IN (
        'vkyc complete', 'vkyc success', 'vkyc approved', 'vkyc failed', 'vkyc_approved', 'vkyc_failed', 'vkyc expired',
        'bio complete', 'bio success', 'bio done', 'bio failed', 'bio_done', 'bio_failed',
        'id-com success', 'id-com failed', 'completed', 'success', 'approved', 'failed'
      )`,
      `LOWER(TRIM(COALESCE(a.kyc_status, a.vkyc_status, 'pending'))) NOT IN ('verified', 'rejected', 'approved')`
    ];
    let queryParams = [];
    let paramIdx = 1;

    // 1. Bank/Product Assignment Security Filter
    if (!isSuperAdmin) {
      whereConditions.push(`(
        EXISTS (
          SELECT 1 FROM admin_bank_assignments aba 
          WHERE aba.admin_id = $${paramIdx}::uuid 
          AND (aba.bank_id = a.bank_id OR aba.bank_id::text = a.bank_id::text OR aba.bank_id = b.id)
        ) OR NOT EXISTS (
          SELECT 1 FROM admin_bank_assignments WHERE admin_id = $${paramIdx}::uuid
        )
      )`);
      queryParams.push(userId);
      paramIdx++;
    }

    // 2. Bank-Specific Eligibility Rules:
    // SBI -> Soft Approval Status: Approval Income 25K, Approval Income 30K, Approval NSDP Cibil Base
    // HDFC -> IPA Status: IPA Approval CIBIL, IPA Approve Income
    whereConditions.push(`(
      (
        (LOWER(COALESCE(b.short_code, '')) LIKE '%sbi%' OR LOWER(COALESCE(b.name, '')) LIKE '%sbi%' OR LOWER(COALESCE(a.bank_name, '')) LIKE '%sbi%')
        AND LOWER(TRIM(COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), ''))) IN (
          'approval income 25k', 'approval income 30k', 'approval nsdp cibil base',
          'approval_income_25k', 'approval_income_30k', 'approval_nsdp_cibil_base',
          'income 25k', 'income 30k', 'nsdp cibil base'
        )
      )
      OR
      (
        (LOWER(COALESCE(b.short_code, '')) LIKE '%hdfc%' OR LOWER(COALESCE(b.name, '')) LIKE '%hdfc%' OR LOWER(COALESCE(a.bank_name, '')) LIKE '%hdfc%')
        AND LOWER(TRIM(COALESCE(NULLIF(a.ipa_stage, ''), NULLIF(pad.ipa_stage, ''), NULLIF(a.soft_approval_status, ''), ''))) IN (
          'ipa approval cibil', 'ipa approve income',
          'ipa_approval_cibil', 'ipa_approve_income',
          'approval cibil', 'approve income'
        )
      )
    )`);

    // 3. Optional Search Filter across App #, Bank App #, Customer Name, Mobile, PAN
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereConditions.push(`(
        a.id::text ILIKE $${paramIdx} OR 
        a.application_number ILIKE $${paramIdx} OR 
        a.customer_name ILIKE $${paramIdx} OR 
        a.customer_mobile ILIKE $${paramIdx} OR
        a.pan_number ILIKE $${paramIdx} OR
        a.bank_application_number ILIKE $${paramIdx} OR
        pad.full_name ILIKE $${paramIdx} OR
        pad.mobile ILIKE $${paramIdx} OR
        pad.pan_number ILIKE $${paramIdx} OR
        pad.bank_application_number ILIKE $${paramIdx}
      )`);
      queryParams.push(term);
      paramIdx++;
    }

    if (product_id) {
      whereConditions.push(`(a.product_id = $${paramIdx} OR a.product_id::text = $${paramIdx}::text)`);
      queryParams.push(product_id);
      paramIdx++;
    }

    if (bank_id) {
      whereConditions.push(`(a.bank_id = $${paramIdx} OR a.bank_id::text = $${paramIdx}::text OR b.id = $${paramIdx} OR b.id::text = $${paramIdx}::text)`);
      queryParams.push(bank_id);
      paramIdx++;
    }

    if (kyc_status) {
      whereConditions.push(`LOWER(COALESCE(a.kyc_status, a.vkyc_status, 'pending')) = $${paramIdx}`);
      queryParams.push(kyc_status.toLowerCase());
      paramIdx++;
    }

    if (vkyc_stage) {
      whereConditions.push(`LOWER(COALESCE(a.vkyc_stage, pad.vkyc_stage, 'vkyc pending')) ILIKE $${paramIdx}`);
      queryParams.push(`%${vkyc_stage.toLowerCase()}%`);
      paramIdx++;
    }

    if (bio_stage) {
      whereConditions.push(`LOWER(COALESCE(a.bio_stage, pad.bio_stage, 'bio pending')) ILIKE $${paramIdx}`);
      queryParams.push(`%${bio_stage.toLowerCase()}%`);
      paramIdx++;
    }

    if (digilocker_stage) {
      whereConditions.push(`LOWER(COALESCE(a.digilocker_stage, pad.digilocker_stage, 'digilocker 1 rupee credit/debit pending')) ILIKE $${paramIdx}`);
      queryParams.push(`%${digilocker_stage.toLowerCase()}%`);
      paramIdx++;
    }

    if (start_date) {
      whereConditions.push(`a.created_at >= $${paramIdx}`);
      queryParams.push(start_date);
      paramIdx++;
    }

    if (end_date) {
      whereConditions.push(`a.created_at <= $${paramIdx}`);
      queryParams.push(end_date);
      paramIdx++;
    }

    const whereClause = whereConditions.join(' AND ');

    // 1. Get Summary Stats
    const statsQuery = `
      SELECT 
        COUNT(*)::int as total_kyc,
        COUNT(CASE WHEN LOWER(COALESCE(a.kyc_status, a.vkyc_status, 'pending')) IN ('pending', 'new', 'under_review') THEN 1 END)::int as pending_kyc,
        COUNT(CASE WHEN LOWER(COALESCE(a.kyc_status, a.vkyc_status, 'pending')) IN ('verified', 'approved') THEN 1 END)::int as verified_kyc,
        COUNT(CASE WHEN LOWER(COALESCE(a.kyc_status, a.vkyc_status, 'pending')) = 'rejected' THEN 1 END)::int as rejected_kyc
      FROM applications a
      LEFT JOIN physical_application_details pad ON (pad.application_id = a.id OR pad.application_id::text = a.id::text)
      LEFT JOIN banks b ON (b.id = a.bank_id OR b.id::text = a.bank_id::text)
      WHERE ${whereClause}
    `;
    const statsRes = await query(statsQuery, queryParams).catch(() => ({ rows: [{ total_kyc: 0, pending_kyc: 0, verified_kyc: 0, rejected_kyc: 0 }] }));
    const stats = statsRes.rows[0] || { total_kyc: 0, pending_kyc: 0, verified_kyc: 0, rejected_kyc: 0 };

    // 2. Count Total Filtered Applications
    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM applications a
      LEFT JOIN physical_application_details pad ON (pad.application_id = a.id OR pad.application_id::text = a.id::text)
      LEFT JOIN banks b ON (b.id = a.bank_id OR b.id::text = a.bank_id::text)
      WHERE ${whereClause}
    `;
    const countRes = await query(countQuery, queryParams);
    const total = countRes.rows[0]?.total || 0;

    // 3. Get Application Records
    const dataQuery = `
      SELECT 
        a.id,
        a.application_number,
        COALESCE(NULLIF(a.customer_name, ''), pad.full_name, 'Customer') as customer_name,
        COALESCE(NULLIF(a.customer_mobile, ''), pad.mobile, 'N/A') as customer_mobile,
        COALESCE(NULLIF(a.pan_number, ''), NULLIF(pad.pan_number, ''), 'N/A') as pan_number,
        COALESCE(NULLIF(a.bank_application_number, ''), NULLIF(pad.bank_application_number, ''), 'N/A') as bank_application_number,
        COALESCE(NULLIF(a.vkyc_link, ''), NULLIF(pad.vkyc_url, ''), '') as vkyc_link,
        COALESCE(NULLIF(a.user_remark, ''), NULLIF(pad.user_remark, ''), NULLIF(a.notes, ''), '') as user_remark,
        COALESCE(NULLIF(a.kyc_remarks, ''), NULLIF(pad.kyc_remarks, ''), '') as kyc_remarks,
        COALESCE(NULLIF(a.kyc_stage, ''), NULLIF(pad.kyc_stage, ''), 'Vkyc pending') as kyc_stage,
        COALESCE(NULLIF(a.vkyc_stage, ''), NULLIF(pad.vkyc_stage, ''), 'Vkyc pending') as vkyc_stage,
        COALESCE(NULLIF(a.bio_stage, ''), NULLIF(pad.bio_stage, ''), 'Bio pending') as bio_stage,
        COALESCE(NULLIF(a.digilocker_stage, ''), NULLIF(pad.digilocker_stage, ''), 'Digilocker 1 Rupee Credit/Debit Pending') as digilocker_stage,
        a.product_id,
        COALESCE(p.name, 'Product') as product_name,
        a.bank_id,
        COALESCE(b.name, 'Bank') as bank_name,
        COALESCE(e.employee_id, u.employee_id, e.full_name, 'Direct') as referred_by,
        a.status as application_status,
        COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), 'PENDING') as soft_approval_status,
        COALESCE(NULLIF(a.ipa_stage, ''), NULLIF(pad.ipa_stage, ''), 'PENDING') as ipa_stage,
        COALESCE(a.kyc_status, a.vkyc_status, 'PENDING') as kyc_status,
        COALESCE(NULLIF(to_jsonb(a)->>'last_operator_name', ''), NULLIF(to_jsonb(a)->>'last_operator_code', ''), 'Not Assigned') as currently_working_by,
        (to_jsonb(a)->>'last_operator_code') as admin_code,
        NULLIF(to_jsonb(a)->>'last_operated_at', '')::timestamptz as last_operated_at,
        a.created_at,
        a.updated_at
      FROM applications a
      LEFT JOIN physical_application_details pad ON (pad.application_id = a.id OR pad.application_id::text = a.id::text)
      LEFT JOIN products p ON (p.id = a.product_id OR p.id::text = a.product_id::text)
      LEFT JOIN banks b ON (b.id = a.bank_id OR b.id::text = a.bank_id::text)
      LEFT JOIN users u ON u.id = a.partner_id
      LEFT JOIN employees e ON e.user_id = u.id
      WHERE ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    const finalParams = [...queryParams, limit, offset];
    const appsRes = await query(dataQuery, finalParams);

    return res.json({
      success: true,
      stats,
      data: appsRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    logger.error('Error fetching KYC Operator applications:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch KYC applications', error: err.message });
  }
};

/**
 * GET /api/v1/kyc-operator/applications/:id
 * Fetches details of a specific application including operator audit history.
 */
const getKycApplicationById = async (req, res) => {
  try {
    await ensureKycColumns();
    const { id } = req.params;

    const appRes = await query(`
      SELECT 
        a.*,
        COALESCE(NULLIF(a.customer_name, ''), pad.full_name, 'Customer') as customer_name,
        COALESCE(NULLIF(a.customer_mobile, ''), pad.mobile, 'N/A') as customer_mobile,
        COALESCE(NULLIF(a.pan_number, ''), NULLIF(pad.pan_number, ''), 'N/A') as pan_number,
        COALESCE(NULLIF(a.bank_application_number, ''), NULLIF(pad.bank_application_number, ''), 'N/A') as bank_application_number,
        COALESCE(NULLIF(a.vkyc_link, ''), NULLIF(pad.vkyc_url, ''), '') as vkyc_link,
        COALESCE(NULLIF(a.user_remark, ''), NULLIF(pad.user_remark, ''), NULLIF(a.notes, ''), '') as user_remark,
        COALESCE(NULLIF(a.kyc_remarks, ''), NULLIF(pad.kyc_remarks, ''), '') as kyc_remarks,
        COALESCE(NULLIF(a.kyc_stage, ''), NULLIF(pad.kyc_stage, ''), 'Vkyc pending') as kyc_stage,
        COALESCE(NULLIF(a.vkyc_stage, ''), NULLIF(pad.vkyc_stage, ''), 'Vkyc pending') as vkyc_stage,
        COALESCE(NULLIF(a.bio_stage, ''), NULLIF(pad.bio_stage, ''), 'Bio pending') as bio_stage,
        COALESCE(NULLIF(a.digilocker_stage, ''), NULLIF(pad.digilocker_stage, ''), 'Digilocker 1 Rupee Credit/Debit Pending') as digilocker_stage,
        COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), 'PENDING') as soft_approval_status,
        COALESCE(NULLIF(a.ipa_stage, ''), NULLIF(pad.ipa_stage, ''), 'PENDING') as ipa_stage,
        COALESCE(a.kyc_status, a.vkyc_status, 'PENDING') as kyc_status,
        COALESCE(NULLIF(to_jsonb(a)->>'last_operator_name', ''), NULLIF(to_jsonb(a)->>'last_operator_code', ''), 'Not Assigned') as currently_working_by,
        (to_jsonb(a)->>'last_operator_code') as admin_code,
        p.name as product_name,
        b.name as bank_name,
        COALESCE(e.employee_id, u.employee_id, e.full_name, 'Direct') as referred_by
      FROM applications a
      LEFT JOIN physical_application_details pad ON (pad.application_id = a.id OR pad.application_id::text = a.id::text)
      LEFT JOIN products p ON (p.id = a.product_id OR p.id::text = a.product_id::text)
      LEFT JOIN banks b ON (b.id = a.bank_id OR b.id::text = a.bank_id::text)
      LEFT JOIN users u ON u.id = a.partner_id
      LEFT JOIN employees e ON e.user_id = u.id
      WHERE a.id::text = $1 OR a.application_number = $1
    `, [id]);

    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = appRes.rows[0];

    // STRICT CHECK: Deny access if soft approval is declined or rejected
    if (isSoftApprovalDeclined(application.soft_approval_status)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: This application has been DECLINED at the Soft Approval stage and cannot be accessed by KYC Operator.'
      });
    }

    // Fetch associated application documents
    const docRes = await query(`
      SELECT * FROM application_documents 
      WHERE application_id = $1 OR application_id::text = $1
      ORDER BY uploaded_at DESC
    `, [application.id]).catch(() => ({ rows: [] }));

    // Fetch immutable operator audit trail
    const auditRes = await query(`
      SELECT * FROM application_operator_history
      WHERE application_id = $1 OR application_id::text = $1
      ORDER BY created_at DESC
    `, [application.id]).catch(() => ({ rows: [] }));

    return res.json({
      success: true,
      data: {
        ...application,
        documents: docRes.rows,
        operator_history: auditRes.rows
      }
    });

  } catch (err) {
    logger.error('Error fetching KYC application by ID:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch application details' });
  }
};

/**
 * GET /api/v1/kyc-operator/applications/:id/documents
 * Fetches KYC documents for an application. Enforces non-declined soft approval rule.
 */
const getKycApplicationDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    const appRes = await query(`
      SELECT a.id, COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), 'PENDING') as soft_approval_status
      FROM applications a
      LEFT JOIN physical_application_details pad ON (pad.application_id = a.id OR pad.application_id::text = a.id::text)
      WHERE a.id::text = $1 OR a.application_number = $1
    `, [id]);

    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (isSoftApprovalDeclined(appRes.rows[0].soft_approval_status)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Soft approval is declined.'
      });
    }

    const appId = appRes.rows[0].id;
    const docRes = await query(`
      SELECT * FROM application_documents 
      WHERE application_id = $1 OR application_id::text = $1
      ORDER BY uploaded_at DESC
    `, [appId]);

    return res.json({
      success: true,
      data: docRes.rows
    });

  } catch (err) {
    logger.error('Error fetching KYC application documents:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};

/**
 * POST /api/v1/kyc-operator/applications/:id/verify
 * Approves / Verifies KYC for an application and records immutable audit log.
 */
const verifyKycApplication = async (req, res) => {
  try {
    await ensureKycColumns();
    const { id } = req.params;
    const { remarks } = req.body;

    const appRes = await query(`
      SELECT a.id, a.kyc_status, COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), 'PENDING') as soft_approval_status
      FROM applications a
      LEFT JOIN physical_application_details pad ON (pad.application_id = a.id OR pad.application_id::text = a.id::text)
      WHERE a.id::text = $1 OR a.application_number = $1
    `, [id]);

    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (isSoftApprovalDeclined(appRes.rows[0].soft_approval_status)) {
      return res.status(403).json({ success: false, message: 'Access Denied: Soft approval is declined.' });
    }

    const appId = appRes.rows[0].id;
    const prevStatus = appRes.rows[0].kyc_status || 'PENDING';
    const noteText = remarks || 'KYC Verified successfully by KYC Operator';

    await query(`
      UPDATE applications 
      SET kyc_status = 'VERIFIED',
          vkyc_status = 'APPROVED',
          kyc_remarks = $1,
          updated_at = NOW()
      WHERE id = $2
    `, [noteText, appId]);

    // Record immutable audit history
    await recordOperatorAudit(appId, req.user, 'KYC_VERIFIED', {
      previous_kyc_status: prevStatus,
      new_kyc_status: 'VERIFIED'
    }, noteText);

    // Also update all pending documents to VERIFIED
    await query(`
      UPDATE application_documents 
      SET status = 'VERIFIED' 
      WHERE application_id = $1 AND (status IS NULL OR status = 'PENDING')
    `, [appId]).catch(() => {});

    return res.json({
      success: true,
      message: 'KYC status updated to VERIFIED successfully.'
    });

  } catch (err) {
    logger.error('Error verifying KYC application:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify KYC application' });
  }
};

/**
 * POST /api/v1/kyc-operator/applications/:id/reject
 * Rejects KYC for an application and records immutable audit log.
 */
const rejectKycApplication = async (req, res) => {
  try {
    await ensureKycColumns();
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason / remarks are required' });
    }

    const appRes = await query(`
      SELECT a.id, a.kyc_status, COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), 'PENDING') as soft_approval_status
      FROM applications a
      LEFT JOIN physical_application_details pad ON (pad.application_id = a.id OR pad.application_id::text = a.id::text)
      WHERE a.id::text = $1 OR a.application_number = $1
    `, [id]);

    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (isSoftApprovalDeclined(appRes.rows[0].soft_approval_status)) {
      return res.status(403).json({ success: false, message: 'Access Denied: Soft approval is declined.' });
    }

    const appId = appRes.rows[0].id;
    const prevStatus = appRes.rows[0].kyc_status || 'PENDING';

    await query(`
      UPDATE applications 
      SET kyc_status = 'REJECTED',
          vkyc_status = 'FAILED',
          kyc_remarks = $1,
          updated_at = NOW()
      WHERE id = $2
    `, [remarks, appId]);

    // Record immutable audit history
    await recordOperatorAudit(appId, req.user, 'KYC_REJECTED', {
      previous_kyc_status: prevStatus,
      new_kyc_status: 'REJECTED'
    }, remarks);

    return res.json({
      success: true,
      message: 'KYC status updated to REJECTED successfully.'
    });

  } catch (err) {
    logger.error('Error rejecting KYC application:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject KYC application' });
  }
};

/**
 * POST /api/v1/kyc-operator/applications/:id/request-information
 * Marks KYC as PENDING_MORE_INFO requesting additional details/documents.
 */
const requestInfoKycApplication = async (req, res) => {
  try {
    await ensureKycColumns();
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: 'Specific details/remarks are required' });
    }

    const appRes = await query(`
      SELECT a.id, a.kyc_status, COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), 'PENDING') as soft_approval_status
      FROM applications a
      LEFT JOIN physical_application_details pad ON (pad.application_id = a.id OR pad.application_id::text = a.id::text)
      WHERE a.id::text = $1 OR a.application_number = $1
    `, [id]);

    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (isSoftApprovalDeclined(appRes.rows[0].soft_approval_status)) {
      return res.status(403).json({ success: false, message: 'Access Denied: Soft approval is declined.' });
    }

    const appId = appRes.rows[0].id;
    const prevStatus = appRes.rows[0].kyc_status || 'PENDING';

    await query(`
      UPDATE applications 
      SET kyc_status = 'PENDING_MORE_INFO',
          kyc_remarks = $1,
          updated_at = NOW()
      WHERE id = $2
    `, [remarks, appId]);

    // Record immutable audit history
    await recordOperatorAudit(appId, req.user, 'KYC_REQUESTED_INFO', {
      previous_kyc_status: prevStatus,
      new_kyc_status: 'PENDING_MORE_INFO'
    }, remarks);

    return res.json({
      success: true,
      message: 'KYC status set to PENDING_MORE_INFO.'
    });

  } catch (err) {
    logger.error('Error requesting info for KYC application:', err);
    return res.status(500).json({ success: false, message: 'Failed to update KYC application' });
  }
};

/**
 * POST /api/v1/kyc-operator/applications/:id/update-stage
 * Updates application KYC stages (VKYC, Bio, Digilocker), remarks, VKYC link, bank app #, and records audit trail.
 */
const updateKycStageAndDetails = async (req, res) => {
  try {
    await ensureKycColumns();
    const { id } = req.params;
    const { 
      kyc_stage, 
      vkyc_stage, 
      bio_stage, 
      digilocker_stage, 
      bank_application_number, 
      vkyc_link, 
      user_remark, 
      kyc_remarks, 
      pan_number, 
      kyc_status 
    } = req.body;

    const appRes = await query(`
      SELECT 
        a.id, 
        a.kyc_stage, 
        a.vkyc_stage, 
        a.bio_stage, 
        a.digilocker_stage,
        a.kyc_remarks,
        a.user_remark,
        COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), 'PENDING') as soft_approval_status
      FROM applications a
      LEFT JOIN physical_application_details pad ON (pad.application_id = a.id OR pad.application_id::text = a.id::text)
      WHERE a.id::text = $1 OR a.application_number = $1
    `, [id]);

    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (isSoftApprovalDeclined(appRes.rows[0].soft_approval_status)) {
      return res.status(403).json({ success: false, message: 'Access Denied: Soft approval is declined.' });
    }

    const currentApp = appRes.rows[0];
    const appId = currentApp.id;

    let updates = [];
    let params = [];
    let pIdx = 1;
    let fieldChanges = {};

    if (kyc_stage !== undefined) {
      updates.push(`kyc_stage = $${pIdx}`);
      params.push(kyc_stage);
      pIdx++;
      fieldChanges.kyc_stage = { from: currentApp.kyc_stage, to: kyc_stage };

      // Also sync vkyc_stage for legacy compatibility if vkyc_stage isn't set separately
      if (vkyc_stage === undefined) {
        updates.push(`vkyc_stage = $${pIdx}`);
        params.push(kyc_stage);
        pIdx++;
      }

      const stageLower = String(kyc_stage).toLowerCase();
      if (stageLower.includes('approved') || stageLower.includes('complete') || stageLower.includes('success') || stageLower.includes('done')) {
        updates.push(`vkyc_status = 'APPROVED'`);
        updates.push(`kyc_status = 'VERIFIED'`);
      } else if (stageLower.includes('failed') || stageLower.includes('expired') || stageLower.includes('decline') || stageLower.includes('error')) {
        updates.push(`vkyc_status = 'FAILED'`);
        updates.push(`kyc_status = 'REJECTED'`);
      }
    }

    if (vkyc_stage !== undefined) {
      updates.push(`vkyc_stage = $${pIdx}`);
      params.push(vkyc_stage);
      pIdx++;
      fieldChanges.vkyc_stage = { from: currentApp.vkyc_stage, to: vkyc_stage };

      const stageLower = String(vkyc_stage).toLowerCase();
      if (stageLower.includes('approved') || stageLower.includes('complete') || stageLower.includes('success') || stageLower.includes('done')) {
        updates.push(`vkyc_status = 'APPROVED'`);
        updates.push(`kyc_status = 'VERIFIED'`);
      } else if (stageLower.includes('failed') || stageLower.includes('expired')) {
        updates.push(`vkyc_status = 'FAILED'`);
        updates.push(`kyc_status = 'REJECTED'`);
      }
    }

    if (bio_stage !== undefined) {
      updates.push(`bio_stage = $${pIdx}`);
      params.push(bio_stage);
      pIdx++;
      fieldChanges.bio_stage = { from: currentApp.bio_stage, to: bio_stage };

      const bioLower = String(bio_stage).toLowerCase();
      if (bioLower.includes('done')) {
        updates.push(`kyc_status = 'VERIFIED'`);
      } else if (bioLower.includes('failed')) {
        updates.push(`kyc_status = 'REJECTED'`);
      }
    }

    if (digilocker_stage !== undefined) {
      updates.push(`digilocker_stage = $${pIdx}`);
      params.push(digilocker_stage);
      pIdx++;
      fieldChanges.digilocker_stage = { from: currentApp.digilocker_stage, to: digilocker_stage };
    }

    if (bank_application_number !== undefined) {
      updates.push(`bank_application_number = $${pIdx}`);
      params.push(bank_application_number);
      pIdx++;
      fieldChanges.bank_application_number = bank_application_number;
    }

    if (vkyc_link !== undefined) {
      updates.push(`vkyc_link = $${pIdx}`);
      params.push(vkyc_link);
      pIdx++;
      fieldChanges.vkyc_link = vkyc_link;
    }

    if (user_remark !== undefined) {
      updates.push(`user_remark = $${pIdx}`);
      params.push(user_remark);
      pIdx++;
      fieldChanges.user_remark = user_remark;
    }

    if (kyc_remarks !== undefined) {
      updates.push(`kyc_remarks = $${pIdx}`);
      params.push(kyc_remarks);
      pIdx++;
      fieldChanges.kyc_remarks = kyc_remarks;
    }

    if (pan_number !== undefined) {
      updates.push(`pan_number = $${pIdx}`);
      params.push(pan_number);
      pIdx++;
      fieldChanges.pan_number = pan_number;
    }

    if (kyc_status !== undefined) {
      updates.push(`kyc_status = $${pIdx}`);
      params.push(kyc_status);
      pIdx++;
      fieldChanges.kyc_status = kyc_status;
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      params.push(appId);
      await query(`UPDATE applications SET ${updates.join(', ')} WHERE id = $${pIdx}`, params);

      // Record immutable audit history for this update
      let actionName = 'KYC_DETAILS_UPDATED';
      if (vkyc_stage !== undefined) actionName = 'VKYC_STAGE_UPDATED';
      if (bio_stage !== undefined) actionName = 'BIO_STAGE_UPDATED';
      if (digilocker_stage !== undefined) actionName = 'DIGILOCKER_STAGE_UPDATED';

      await recordOperatorAudit(appId, req.user, actionName, fieldChanges, kyc_remarks || user_remark || 'KYC stage updated.');
    }

    return res.json({
      success: true,
      message: 'KYC Stage & Application Details updated successfully!'
    });
  } catch (err) {
    logger.error('Error updating KYC stage:', err);
    return res.status(500).json({ success: false, message: 'Failed to update KYC stage details' });
  }
};

module.exports = {
  getKycApplications,
  getKycApplicationById,
  getKycApplicationDocuments,
  verifyKycApplication,
  rejectKycApplication,
  requestInfoKycApplication,
  updateKycStageAndDetails
};
