const { query } = require('../../config/database');
const { logAction } = require('../admin/audit.service.js');

const getPartnerKyc = async (partnerId) => {
  const { rows: documents } = await query(`
    SELECT * FROM kyc_documents WHERE partner_id = $1 ORDER BY uploaded_at DESC
  `, [partnerId]);
  
  const { rows: [profile] } = await query(`
    SELECT kyc_status, rejection_reason FROM partner_profiles WHERE id = $1
  `, [partnerId]);
  
  return { status: profile?.kyc_status, documents, rejection_reason: profile?.rejection_reason };
};

const uploadKycDocument = async (partnerId, docType, docNumber, fileUrl, s3Key) => {
  const { rows: [doc] } = await query(`
    INSERT INTO kyc_documents (partner_id, doc_type, doc_number, file_url, s3_key, verification_status, rejection_reason)
    VALUES ($1, $2, $3, $4, $5, 'pending', NULL)
    ON CONFLICT (partner_id, doc_type) DO UPDATE SET
      doc_number = EXCLUDED.doc_number,
      file_url = EXCLUDED.file_url,
      s3_key = EXCLUDED.s3_key,
      verified = FALSE,
      verified_by = NULL,
      verified_at = NULL,
      verification_status = 'pending',
      rejection_reason = NULL,
      uploaded_at = NOW()
    RETURNING *
  `, [partnerId, docType, docNumber, fileUrl, s3Key]);
  
  // Reset overall KYC status to pending so recalculation runs fresh
  await query(`UPDATE partner_profiles SET kyc_status = 'pending', rejection_reason = NULL, kyc_rejection_reason = NULL WHERE id = $1`, [partnerId]);
  
  return doc;
};


const recalculatePartnerKycStatus = async (partnerId, adminUserId = null) => {
  const { rows: docs } = await query(`
    SELECT doc_type, verification_status FROM kyc_documents WHERE partner_id = $1
  `, [partnerId]);

  const requiredTypes = ['pan', 'aadhaar', 'cancel_cheque'];
  
  const hasRejected = docs.some(d => d.verification_status === 'rejected');
  if (hasRejected) {
    const rejectedDoc = docs.find(d => d.verification_status === 'rejected');
    const reasonMsg = `Document ${rejectedDoc.doc_type.replace('_', ' ').toUpperCase()} was marked as rejected.`;
    await query(`
      UPDATE partner_profiles 
      SET kyc_status = 'rejected', 
          rejection_reason = $1,
          kyc_rejection_reason = $1
      WHERE id = $2
    `, [reasonMsg, partnerId]);

    const { rows: [partner] } = await query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [partnerId]);
    if (partner) {
      await query(`UPDATE users SET status = 'inactive'::user_status WHERE id = $1`, [partner.user_id]);
    }
    return 'rejected';
  }

  const approvedTypes = docs.filter(d => d.verification_status === 'approved').map(d => d.doc_type);
  const allRequiredApproved = requiredTypes.every(reqType => approvedTypes.includes(reqType));

  if (allRequiredApproved) {
    await query(`
      UPDATE partner_profiles 
      SET kyc_status = 'approved',
          approved_by = $1,
          approved_at = NOW(),
          rejection_reason = NULL,
          kyc_rejection_reason = NULL
      WHERE id = $2
    `, [adminUserId, partnerId]);

    const { rows: [partner] } = await query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [partnerId]);
    if (partner) {
      await query(`UPDATE users SET status = 'active'::user_status WHERE id = $1`, [partner.user_id]);
    }
    return 'approved';
  }

  await query(`
    UPDATE partner_profiles SET kyc_status = 'pending', rejection_reason = NULL, kyc_rejection_reason = NULL WHERE id = $1
  `, [partnerId]);
  return 'pending';
};

const verifyKycDocument = async (docId, partnerId, isVerified, adminUserId) => {
  const statusVal = isVerified ? 'approved' : 'rejected';
  const { rows: [doc] } = await query(`
    UPDATE kyc_documents SET
      verified = $1,
      verification_status = $2,
      verified_by = $3,
      verified_at = NOW()
    WHERE id = $4 AND partner_id = $5
    RETURNING *
  `, [isVerified, statusVal, adminUserId, docId, partnerId]);
  
  if (doc) {
    await logAction(adminUserId, 'VERIFY_KYC_DOCUMENT', docId, { doc_type: doc.doc_type, verified: isVerified });
    await recalculatePartnerKycStatus(partnerId, adminUserId);
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
