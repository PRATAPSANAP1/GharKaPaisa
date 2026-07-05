const { query } = require('../../config/database');
const { logAction } = require('../admin/audit.service.js');

const getPartnerKyc = async (partnerId) => {
  const { rows: documents } = await query(`
    SELECT * FROM kyc_documents WHERE Partner_id = $1 ORDER BY uploaded_at DESC
  `, [partnerId]);
  
  const { rows: [profile] } = await query(`
    SELECT kyc_status, rejection_reason FROM partner_profiles WHERE id = $1
  `, [partnerId]);
  
  return { status: profile?.kyc_status, documents, rejection_reason: profile?.rejection_reason };
};

const uploadKycDocument = async (partnerId, docType, docNumber, fileUrl, s3Key) => {
  const { rows: [doc] } = await query(`
    INSERT INTO kyc_documents (Partner_id, doc_type, doc_number, file_url, s3_key)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (Partner_id, doc_type) DO UPDATE SET
      doc_number = EXCLUDED.doc_number,
      file_url = EXCLUDED.file_url,
      s3_key = EXCLUDED.s3_key,
      verified = FALSE,
      verified_by = NULL,
      verified_at = NULL,
      uploaded_at = NOW()
    RETURNING *
  `, [partnerId, docType, docNumber, fileUrl, s3Key]);
  
  // Also update overall status to pending if they upload new documents
  await query(`UPDATE partner_profiles SET kyc_status = 'pending' WHERE id = $1`, [partnerId]);
  
  return doc;
};

const verifyKycDocument = async (docId, partnerId, isVerified, adminUserId) => {
  const { rows: [doc] } = await query(`
    UPDATE kyc_documents SET
      verified = $1,
      verified_by = $2,
      verified_at = NOW()
    WHERE id = $3 AND Partner_id = $4
    RETURNING *
  `, [isVerified, adminUserId, docId, partnerId]);
  
  if (doc) {
    await logAction(adminUserId, 'VERIFY_KYC_DOCUMENT', docId, { doc_type: doc.doc_type, verified: isVerified });
  }
  
  return doc;
};

const updateOverallKycStatus = async (partnerId, status, rejectionReason, adminUserId) => {
  const { rows: [profile] } = await query(`
    UPDATE partner_profiles SET
      kyc_status = $1,
      approved_by = CASE WHEN $1 = 'approved' THEN $4 ELSE NULL END,
      approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END,
      rejection_reason = $2
    WHERE id = $3
    RETURNING *
  `, [status, rejectionReason, partnerId, adminUserId]);
  
  if (profile) {
    await logAction(adminUserId, 'UPDATE_KYC_STATUS', partnerId, { status, rejection_reason: rejectionReason });
  }
  
  return profile;
};

module.exports = {
  getPartnerKyc,
  uploadKycDocument,
  verifyKycDocument,
  updateOverallKycStatus
};
