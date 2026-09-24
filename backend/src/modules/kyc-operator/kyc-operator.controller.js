const { query } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Controller: KYC Operator
 * Restricts access exclusively to non-declined soft approval applications.
 */

// Helper to ensure kyc_status and kyc_remarks columns exist on applications table
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
    columnsChecked = true;
  } catch (err) {
    logger.warn('Failed ensuring kyc columns on applications table:', err.message);
  }
};

// Helper to check if application is soft approval declined
const isSoftApprovalDeclined = (softApprovalStatus) => {
  const status = String(softApprovalStatus || '').trim().toLowerCase();
  return status === 'declined' || status === 'rejected';
};

/**
 * GET /api/v1/kyc-operator/applications
 * Retrieves applications eligible for KYC verification (soft approval NOT declined).
 */
const getKycApplications = async (req, res) => {
  try {
    await ensureKycColumns();
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    const { search, product_id, bank_id, kyc_status, start_date, end_date } = req.query;

    let whereConditions = [
      `LOWER(TRIM(COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), ''))) NOT IN ('declined', 'rejected')`
    ];
    let queryParams = [];
    let paramIdx = 1;

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
        pad.pan_number ILIKE $${paramIdx}
      )`);
      queryParams.push(term);
      paramIdx++;
    }

    if (product_id) {
      whereConditions.push(`a.product_id = $${paramIdx}`);
      queryParams.push(product_id);
      paramIdx++;
    }

    if (bank_id) {
      whereConditions.push(`a.bank_id = $${paramIdx}`);
      queryParams.push(bank_id);
      paramIdx++;
    }

    if (kyc_status) {
      whereConditions.push(`LOWER(COALESCE(a.kyc_status, a.vkyc_status, 'pending')) = $${paramIdx}`);
      queryParams.push(kyc_status.toLowerCase());
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
      WHERE ${whereConditions[0]}
    `;
    const statsRes = await query(statsQuery).catch(() => ({ rows: [{ total_kyc: 0, pending_kyc: 0, verified_kyc: 0, rejected_kyc: 0 }] }));
    const stats = statsRes.rows[0] || { total_kyc: 0, pending_kyc: 0, verified_kyc: 0, rejected_kyc: 0 };

    // 2. Count Total Filtered Applications
    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM applications a
      LEFT JOIN physical_application_details pad ON (pad.application_id = a.id OR pad.application_id::text = a.id::text)
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
        COALESCE(NULLIF(a.user_remark, ''), NULLIF(a.notes, ''), '') as user_remark,
        COALESCE(NULLIF(a.kyc_remarks, ''), '') as kyc_remarks,
        COALESCE(NULLIF(a.kyc_stage, ''), NULLIF(pad.vkyc_stage, ''), NULLIF(a.vkyc_status, ''), 'Vkyc pending') as kyc_stage,
        a.product_id,
        COALESCE(p.name, 'Product') as product_name,
        a.bank_id,
        COALESCE(b.name, 'Bank') as bank_name,
        COALESCE(e.employee_id, u.employee_id, e.full_name, 'Direct') as referred_by,
        a.status as application_status,
        COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), 'PENDING') as soft_approval_status,
        COALESCE(a.kyc_status, a.vkyc_status, 'PENDING') as kyc_status,
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
    queryParams.push(limit, offset);

    const appsRes = await query(dataQuery, queryParams);

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
 * Fetches details of a specific application. Enforces non-declined soft approval rule.
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
        COALESCE(NULLIF(a.user_remark, ''), NULLIF(a.notes, ''), '') as user_remark,
        COALESCE(NULLIF(a.kyc_remarks, ''), '') as kyc_remarks,
        COALESCE(NULLIF(a.kyc_stage, ''), NULLIF(pad.vkyc_stage, ''), NULLIF(a.vkyc_status, ''), 'Vkyc pending') as kyc_stage,
        COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), 'PENDING') as soft_approval_status,
        COALESCE(a.kyc_status, a.vkyc_status, 'PENDING') as kyc_status,
        p.name as product_name,
        b.name as bank_name,
        COALESCE(e.employee_id, u.employee_id, e.full_name, 'Direct') as referred_by
      FROM applications a
      LEFT JOIN physical_application_details pad ON (pad.application_id = a.id OR pad.application_id::text = a.id::text)
      LEFT JOIN products p ON (p.id = a.product_id OR p.id::text = a.product_id::text)
      LEFT JOIN banks b ON (b.id = a.bank_id OR b.id::text = a.bank_id::text)
      LEFT JOIN users u ON u.id = a.partner_id
      LEFT JOIN employees e ON e.user_id = u.id
      WHERE a.id = $1 OR a.application_number = $1
    `, [id]);

    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = appRes.rows[0];

    // STRICT BACKEND CHECK: Deny access if soft approval is declined or rejected
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

    return res.json({
      success: true,
      data: {
        ...application,
        documents: docRes.rows
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
      WHERE a.id = $1 OR a.application_number = $1
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
 * Approves / Verifies KYC for an application.
 */
const verifyKycApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const appRes = await query(`
      SELECT a.id, COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), 'PENDING') as soft_approval_status
      FROM applications a
      LEFT JOIN physical_application_details pad ON (pad.application_id = a.id OR pad.application_id::text = a.id::text)
      WHERE a.id = $1 OR a.application_number = $1
    `, [id]);

    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (isSoftApprovalDeclined(appRes.rows[0].soft_approval_status)) {
      return res.status(403).json({ success: false, message: 'Access Denied: Soft approval is declined.' });
    }

    const appId = appRes.rows[0].id;

    // Ensure columns exist safely
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'PENDING'`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS kyc_remarks TEXT`).catch(() => {});

    await query(`
      UPDATE applications 
      SET kyc_status = 'VERIFIED',
          kyc_remarks = $1,
          updated_at = NOW()
      WHERE id = $2
    `, [remarks || 'KYC Verified successfully by KYC Operator', appId]);

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
 * Rejects KYC for an application.
 */
const rejectKycApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason / remarks are required' });
    }

    const appRes = await query(`
      SELECT a.id, COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), 'PENDING') as soft_approval_status
      FROM applications a
      LEFT JOIN physical_application_details pad ON (pad.application_id = a.id OR pad.application_id::text = a.id::text)
      WHERE a.id = $1 OR a.application_number = $1
    `, [id]);

    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (isSoftApprovalDeclined(appRes.rows[0].soft_approval_status)) {
      return res.status(403).json({ success: false, message: 'Access Denied: Soft approval is declined.' });
    }

    const appId = appRes.rows[0].id;

    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'PENDING'`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS kyc_remarks TEXT`).catch(() => {});

    await query(`
      UPDATE applications 
      SET kyc_status = 'REJECTED',
          kyc_remarks = $1,
          updated_at = NOW()
      WHERE id = $2
    `, [remarks, appId]);

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
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: 'Specific details/remarks are required' });
    }

    const appRes = await query(`
      SELECT a.id, COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), 'PENDING') as soft_approval_status
      FROM applications a
      LEFT JOIN physical_application_details pad ON (pad.application_id = a.id OR pad.application_id::text = a.id::text)
      WHERE a.id = $1 OR a.application_number = $1
    `, [id]);

    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (isSoftApprovalDeclined(appRes.rows[0].soft_approval_status)) {
      return res.status(403).json({ success: false, message: 'Access Denied: Soft approval is declined.' });
    }

    const appId = appRes.rows[0].id;

    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'PENDING'`).catch(() => {});
    await query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS kyc_remarks TEXT`).catch(() => {});

    await query(`
      UPDATE applications 
      SET kyc_status = 'PENDING_MORE_INFO',
          kyc_remarks = $1,
          updated_at = NOW()
      WHERE id = $2
    `, [remarks, appId]);

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
 * Updates application KYC stage, VKYC link, bank application number, user remark, kyc remarks, and PAN.
 */
const updateKycStageAndDetails = async (req, res) => {
  try {
    await ensureKycColumns();
    const { id } = req.params;
    const { kyc_stage, bank_application_number, vkyc_link, user_remark, kyc_remarks, pan_number, kyc_status } = req.body;

    const appRes = await query(`
      SELECT a.id, COALESCE(NULLIF(a.soft_approval_status, ''), NULLIF(pad.soft_approval_status, ''), 'PENDING') as soft_approval_status
      FROM applications a
      LEFT JOIN physical_application_details pad ON (pad.application_id = a.id OR pad.application_id::text = a.id::text)
      WHERE a.id = $1 OR a.application_number = $1
    `, [id]);

    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (isSoftApprovalDeclined(appRes.rows[0].soft_approval_status)) {
      return res.status(403).json({ success: false, message: 'Access Denied: Soft approval is declined.' });
    }

    const appId = appRes.rows[0].id;

    let updates = [];
    let params = [];
    let pIdx = 1;

    if (kyc_stage !== undefined) {
      updates.push(`kyc_stage = $${pIdx}`);
      params.push(kyc_stage);
      pIdx++;

      const stageLower = String(kyc_stage).toLowerCase();
      if (stageLower.includes('vkyc approved') || stageLower.includes('bio done') || stageLower.includes('digilocker 1 rup credit/debit done')) {
        updates.push(`vkyc_status = 'APPROVED'`);
      } else if (stageLower.includes('vkyc failed')) {
        updates.push(`vkyc_status = 'FAILED'`);
      }
    }

    if (bank_application_number !== undefined) {
      updates.push(`bank_application_number = $${pIdx}`);
      params.push(bank_application_number);
      pIdx++;
    }

    if (vkyc_link !== undefined) {
      updates.push(`vkyc_link = $${pIdx}`);
      params.push(vkyc_link);
      pIdx++;
    }

    if (user_remark !== undefined) {
      updates.push(`user_remark = $${pIdx}`);
      params.push(user_remark);
      pIdx++;
    }

    if (kyc_remarks !== undefined) {
      updates.push(`kyc_remarks = $${pIdx}`);
      params.push(kyc_remarks);
      pIdx++;
    }

    if (pan_number !== undefined) {
      updates.push(`pan_number = $${pIdx}`);
      params.push(pan_number);
      pIdx++;
    }

    if (kyc_status !== undefined) {
      updates.push(`kyc_status = $${pIdx}`);
      params.push(kyc_status);
      pIdx++;
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      params.push(appId);
      await query(`UPDATE applications SET ${updates.join(', ')} WHERE id = $${pIdx}`, params);
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
