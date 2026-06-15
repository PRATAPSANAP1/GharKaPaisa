const kycService = require('../services/kyc.service');
const { uploadToS3 } = require('../services/s3.service');
const { success, error, notFound } = require('../utils/response');

const getKyc = async (req, res, next) => {
  try {
    const partnerId = req.params.partnerId || req.user.partner_id;
    if (!partnerId) return error(res, 'Partner ID required');
    const data = await kycService.getPartnerKyc(partnerId);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    const partnerId = req.params.partnerId || req.user.partner_id;
    const { doc_type, doc_number } = req.body;
    
    if (!partnerId) return error(res, 'Partner ID required');
    if (!req.file) return error(res, 'File is required');
    if (!doc_type) return error(res, 'Document type is required');

    const { url, key } = await uploadToS3(req.file.buffer, req.file.originalname, 'kyc');
    
    const doc = await kycService.uploadKycDocument(partnerId, doc_type, doc_number, url, key);
    return success(res, doc, 'Document uploaded successfully');
  } catch (err) {
    next(err);
  }
};

const verifyDocument = async (req, res, next) => {
  try {
    const { partnerId, docId } = req.params;
    const { verified } = req.body;
    
    const doc = await kycService.verifyKycDocument(docId, partnerId, verified, req.user.id);
    if (!doc) return notFound(res, 'Document not found');
    
    return success(res, doc, `Document marked as ${verified ? 'verified' : 'unverified'}`);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { partnerId } = req.params;
    const { status, rejection_reason } = req.body;
    
    if (status === 'rejected' && !rejection_reason) {
      return error(res, 'Rejection reason is required');
    }
    
    const profile = await kycService.updateOverallKycStatus(partnerId, status, rejection_reason, req.user.id);
    if (!profile) return notFound(res, 'Partner profile not found');
    
    return success(res, { status: profile.kyc_status }, 'KYC status updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getKyc,
  uploadDocument,
  verifyDocument,
  updateStatus
};
