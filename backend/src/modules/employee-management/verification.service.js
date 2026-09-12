const { query } = require('../../config/database');
const logger = require('../../config/logger');
const { createNotification } = require('../notifications/service');
const { getSignedDownloadUrl } = require('../../services/aws/s3.service');

// Helper to convert raw S3 URLs/Keys into presigned S3 download URLs
const resolveS3Url = async (urlOrKey) => {
  if (!urlOrKey || typeof urlOrKey !== 'string') return urlOrKey;
  if (urlOrKey.includes('X-Amz-Signature') || urlOrKey.includes('X-Amz-Algorithm')) {
    return urlOrKey;
  }
  let key = urlOrKey;
  if (key.includes('.amazonaws.com/')) {
    key = key.split('.amazonaws.com/')[1];
  } else if (key.startsWith('http://') || key.startsWith('https://')) {
    const parts = key.split('/');
    key = parts.slice(3).join('/');
  }
  key = key.replace(/^\//, '');
  if (!key) return urlOrKey;

  try {
    const signedUrl = await getSignedDownloadUrl(key, 86400); // 24 hours
    return signedUrl;
  } catch (err) {
    return urlOrKey;
  }
};

const REQUIRED_DOC_TYPES = [
  { type: 'pan', label: 'PAN Card' },
  { type: 'aadhaar', label: 'Aadhaar Card' },
  { type: 'bank_proof', label: 'Bank Account Proof' },
  { type: 'photo', label: 'Photograph' },
  { type: 'address_proof', label: 'Address Proof' },
  { type: 'education_certificate', label: 'Qualification Certificate' }
];

/**
 * Calculates complete employee verification state dynamically.
 */
async function calculateEmployeeVerificationState(employeeId) {
  // 1. Fetch Employee record
  const empRes = await query(`
    SELECT e.*, u.id as user_id
    FROM employees e
    LEFT JOIN users u ON u.id = e.user_id
    WHERE e.id = $1
  `, [employeeId]);

  if (empRes.rows.length === 0) {
    throw new Error('Employee not found');
  }
  const employee = empRes.rows[0];

  // 2. Fetch Joining details for Information Verification
  const joiningRes = await query(`
    SELECT * FROM employee_joining_details WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 1
  `, [employeeId]);
  const joining = joiningRes.rows[0] || null;

  let infoStatus = 'PENDING'; // 'VERIFIED', 'REQUIRES_UPDATE', 'PENDING'
  if (joining) {
    if (joining.form_status === 'APPROVED' || joining.reviewed_by) {
      infoStatus = 'VERIFIED';
    } else if (joining.form_status === 'REJECTED') {
      infoStatus = 'REQUIRES_UPDATE';
    } else if (joining.form_status === 'SUBMITTED') {
      infoStatus = 'UNDER_REVIEW';
    }
  }

  // 3. Fetch KYC details
  const kycRes = await query(`
    SELECT * FROM employee_kyc WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 1
  `, [employeeId]);
  const kyc = kycRes.rows[0] || null;

  // 4. Fetch Employee Documents
  const docsRes = await query(`
    SELECT * FROM employee_documents WHERE employee_id = $1 ORDER BY created_at DESC
  `, [employeeId]);

  const docsMap = {};
  for (const d of docsRes.rows) {
    const t = String(d.document_type || '').toLowerCase().trim();
    if (t && !docsMap[t]) {
      docsMap[t] = d;
    }
  }

  // Map each required document type
  const documents = [];
  const missingItems = [];
  let approvedDocsCount = 0;

  for (const docDef of REQUIRED_DOC_TYPES) {
    const dType = docDef.type;
    const docRow = docsMap[dType];

    let docStatus = 'NOT_STARTED'; // 'NOT_STARTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'
    let fileUrl = null;
    let fileName = null;
    let rejectionReason = null;
    let uploadedAt = null;

    if (docRow) {
      const st = String(docRow.verification_status || '').toUpperCase();
      if (st === 'APPROVED' || st === 'VERIFIED') docStatus = 'APPROVED';
      else if (st === 'REJECTED') docStatus = 'REJECTED';
      else docStatus = 'UNDER_REVIEW';

      fileUrl = await resolveS3Url(docRow.document_url);
      fileName = docRow.document_file_name;
      rejectionReason = docRow.rejection_reason || null;
      uploadedAt = docRow.created_at;
    } else {
      // Check fallback legacy fields in employee_kyc
      if (dType === 'pan' && kyc && (kyc.pan_document_url || kyc.pan_number)) {
        fileUrl = await resolveS3Url(kyc.pan_document_url);
        rejectionReason = kyc.pan_rejection_reason || null;
        if (kyc.pan_verified || kyc.pan_status === 'VERIFIED') docStatus = 'APPROVED';
        else if (kyc.pan_status === 'REJECTED') docStatus = 'REJECTED';
        else if (kyc.pan_document_url) docStatus = 'UNDER_REVIEW';
      } else if (dType === 'aadhaar' && kyc && (kyc.aadhaar_document_url || kyc.aadhaar_number)) {
        fileUrl = await resolveS3Url(kyc.aadhaar_document_url);
        rejectionReason = kyc.aadhaar_rejection_reason || null;
        if (kyc.aadhaar_verified || kyc.aadhaar_status === 'VERIFIED') docStatus = 'APPROVED';
        else if (kyc.aadhaar_status === 'REJECTED') docStatus = 'REJECTED';
        else if (kyc.aadhaar_document_url) docStatus = 'UNDER_REVIEW';
      } else if (dType === 'bank_proof' && kyc && (kyc.bank_document_url || kyc.bank_account_number)) {
        fileUrl = await resolveS3Url(kyc.bank_document_url);
        rejectionReason = kyc.bank_rejection_reason || null;
        if (kyc.bank_verified || kyc.bank_status === 'VERIFIED') docStatus = 'APPROVED';
        else if (kyc.bank_status === 'REJECTED') docStatus = 'REJECTED';
        else if (kyc.bank_document_url) docStatus = 'UNDER_REVIEW';
      }
    }

    if (docStatus === 'APPROVED') {
      approvedDocsCount++;
    } else {
      if (docStatus === 'REJECTED') {
        missingItems.push({
          type: dType,
          label: docDef.label,
          status: 'REJECTED',
          reason: rejectionReason || 'Document rejected during review',
          text: `${docDef.label} – Rejected${rejectionReason ? ' (' + rejectionReason + ')' : ''}`
        });
      } else if (docStatus === 'UNDER_REVIEW') {
        missingItems.push({
          type: dType,
          label: docDef.label,
          status: 'UNDER_REVIEW',
          text: `${docDef.label} – Under Review`
        });
      } else {
        missingItems.push({
          type: dType,
          label: docDef.label,
          status: 'NOT_UPLOADED',
          text: `${docDef.label} – Not Uploaded`
        });
      }
    }

    documents.push({
      type: dType,
      label: docDef.label,
      status: docStatus,
      file_url: fileUrl,
      file_name: fileName,
      rejection_reason: rejectionReason,
      uploaded_at: uploadedAt
    });
  }

  // 5. Fetch Video Verification details
  const termsRes = await query(`
    SELECT * FROM employee_terms_acceptance WHERE employee_id = $1 ORDER BY accepted_at DESC LIMIT 1
  `, [employeeId]);
  const terms = termsRes.rows[0] || null;

  let videoStatus = 'NOT_COMPLETED'; // 'NOT_COMPLETED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'
  let videoUrl = null;
  let videoNotes = null;

  if (terms) {
    videoUrl = await resolveS3Url(terms.video_url);
    videoNotes = terms.verification_notes || null;
    const vSt = String(terms.verification_status || '').toUpperCase();

    if (vSt === 'VERIFIED' || vSt === 'APPROVED') {
      videoStatus = 'VERIFIED';
    } else if (vSt === 'REJECTED') {
      videoStatus = 'REJECTED';
    } else if (terms.video_url) {
      videoStatus = 'UNDER_REVIEW';
    }
  }

  if (videoStatus !== 'VERIFIED') {
    missingItems.push({
      type: 'video',
      label: 'Video Verification',
      status: videoStatus,
      reason: videoNotes || null,
      text: `Video Verification – ${videoStatus === 'UNDER_REVIEW' ? 'Under Review' : (videoStatus === 'REJECTED' ? 'Rejected' : 'Not Completed')}`
    });
  }

  if (infoStatus !== 'VERIFIED') {
    missingItems.push({
      type: 'information',
      label: 'Personal Information',
      status: infoStatus,
      text: `Personal Information – ${infoStatus === 'UNDER_REVIEW' ? 'Pending Review' : (infoStatus === 'REQUIRES_UPDATE' ? 'Requires Update' : 'Pending Verification')}`
    });
  }

  // Overall Status
  const totalRequiredDocs = REQUIRED_DOC_TYPES.length;
  const isAllDocsApproved = approvedDocsCount === totalRequiredDocs;
  const isVideoVerified = videoStatus === 'VERIFIED';
  const isInfoVerified = infoStatus === 'VERIFIED';

  const overallStatus = (isInfoVerified && isAllDocsApproved && isVideoVerified) ? 'VERIFIED' : 'PENDING';

  // Update employee record if changed
  await query(`
    UPDATE employees 
    SET activation_status = CASE WHEN $2 = 'VERIFIED' THEN 'APPROVED' ELSE activation_status END,
        employee_status = CASE WHEN $2 = 'VERIFIED' THEN 'ACTIVE' ELSE employee_status END
    WHERE id = $1
  `, [employeeId, overallStatus]).catch(() => {});

  if (kyc) {
    await query(`
      UPDATE employee_kyc 
      SET kyc_status = $2 
      WHERE id = $1
    `, [kyc.id, overallStatus === 'VERIFIED' ? 'VERIFIED' : (approvedDocsCount > 0 ? 'UNDER_REVIEW' : 'PENDING')]).catch(() => {});
  }

  return {
    employee_id: employeeId,
    employee_code: employee.employee_id,
    full_name: employee.full_name,
    overall_status: overallStatus,
    information_status: infoStatus,
    documents_summary: `${approvedDocsCount}/${totalRequiredDocs}`,
    approved_docs_count: approvedDocsCount,
    total_docs_count: totalRequiredDocs,
    video_status: videoStatus,
    video_url: videoUrl,
    video_notes: videoNotes,
    documents,
    missing_items: missingItems,
    missing_document_names: missingItems.map(m => m.text),
    joining_details: joining
  };
}

/**
 * Creates a reminder and sends notification to employee
 */
async function sendVerificationReminder(employeeId, sentByUserId = null, customNote = null) {
  const empRes = await query(`SELECT e.*, u.id as user_id FROM employees e LEFT JOIN users u ON u.id = e.user_id WHERE e.id = $1`, [employeeId]);
  if (empRes.rows.length === 0) {
    throw new Error('Employee not found');
  }
  const employee = empRes.rows[0];

  const state = await calculateEmployeeVerificationState(employeeId);
  const missingTextList = state.missing_document_names;

  if (missingTextList.length === 0) {
    return {
      success: false,
      message: 'Employee verification is already complete! No reminder sent.'
    };
  }

  const defaultMsg = customNote || `Please complete your employee verification. Missing items: ${missingTextList.join(', ')}`;

  // 1. Insert into employee_verification_reminders
  const { rows: [reminder] } = await query(`
    INSERT INTO employee_verification_reminders (employee_id, sent_by, message, missing_documents)
    VALUES ($1, $2, $3, $4::jsonb)
    RETURNING *
  `, [employeeId, sentByUserId, defaultMsg, JSON.stringify(missingTextList)]);

  // 2. Dispatch in-app notification to employee
  if (employee.user_id) {
    await createNotification(
      employee.user_id,
      '⚠ Employee Verification Required',
      `Please complete your employee verification. Missing items: ${missingTextList.slice(0, 3).join(', ')}${missingTextList.length > 3 ? '...' : ''}`,
      'warning',
      '/employee/verification',
      { category: 'kyc', priority: 'high' }
    );
  }

  return {
    success: true,
    message: `Reminder sent successfully to ${employee.full_name}`,
    reminder,
    missing_documents: missingTextList
  };
}

module.exports = {
  REQUIRED_DOC_TYPES,
  calculateEmployeeVerificationState,
  sendVerificationReminder
};
