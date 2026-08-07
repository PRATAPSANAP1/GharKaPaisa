const kycService = require('./kyc.service.js');
const { uploadToS3 } = require('../../services/aws/s3.service.js');
const { success, error, notFound } = require('../../utils/response/response');
const { query } = require('../../config/database');
const { getSignedDownloadUrl } = require('../../services/aws/s3.service.js');

const getKyc = async (req, res, next) => {
  try {
    const partnerId = req.params.partnerId || req.user.partner_id || req.partner?.id;
    if (!partnerId) return error(res, 'Partner ID required');
    const data = await kycService.getPartnerKyc(partnerId);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    const partnerId = req.params.partnerId || req.user.partner_id || req.partner?.id;
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

const viewDocument = async (req, res, next) => {
  try {
    const { docId } = req.params;

    // Get JWT token from query parameter or header
    let token = req.headers.authorization?.split(' ')[1] || req.query.token;
    if (!token) {
      return error(res, 'Authentication required. No token provided.', 401);
    }

    // Verify the token
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../../config/jwt.js');
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return error(res, 'Invalid or expired token.', 401);
    }

    // Fetch user and profile details from database
    const { rows: [user] } = await query(
      `SELECT id, role, status FROM users WHERE id = $1`,
      [decodedToken.id]
    );
    if (!user || user.status === 'suspended' || user.status === 'blocked') {
      return error(res, 'User account is inactive or suspended.', 403);
    }

    // Fetch document details from kyc_documents or partner_videos
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId);
    let doc;
    if (isUuid) {
      const { rows: [result] } = await query(
        `SELECT s3_key, partner_id FROM kyc_documents WHERE id = $1`,
        [docId]
      );
      doc = result;
      if (!doc) {
        // Fallback: check partner_videos (by id or partner_id)
        const { rows: [videoResult] } = await query(
          `SELECT storage_key AS s3_key, partner_id FROM partner_videos WHERE id = $1 OR partner_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
          [docId]
        );
        doc = videoResult;
      }
    } else {
      // Resolve target partner profile ID (from query param if admin, or logged-in user profile)
      let targetPartnerId = req.query.partnerId || req.query.partner_id;
      if (!targetPartnerId) {
        const { rows: [partner] } = await query(
          `SELECT id FROM partner_profiles WHERE user_id = $1`,
          [user.id]
        );
        if (partner) targetPartnerId = partner.id;
      }

      if (targetPartnerId) {
        if (docId === 'video') {
          const { rows: [videoResult] } = await query(
            `SELECT storage_key AS s3_key, partner_id FROM partner_videos WHERE partner_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
            [targetPartnerId]
          );
          doc = videoResult;
          if (!doc) {
            const { rows: [kycVideo] } = await query(
              `SELECT s3_key, partner_id FROM kyc_documents WHERE partner_id = $1 AND doc_type = 'video' ORDER BY uploaded_at DESC LIMIT 1`,
              [targetPartnerId]
            );
            doc = kycVideo;
          }
        } else {
          const { rows: [result] } = await query(
            `SELECT s3_key, partner_id FROM kyc_documents WHERE partner_id = $1 AND doc_type = $2 ORDER BY uploaded_at DESC LIMIT 1`,
            [targetPartnerId, docId]
          );
          doc = result;
        }
      }
    }

    if (!doc) {
      return notFound(res, 'Document or Video not found.');
    }

    const rawKey = doc.s3_key || doc.file_url;
    if (!rawKey) {
      return error(res, 'File key is missing or not yet uploaded.', 400);
    }

    let key = rawKey;
    if (key.includes('.amazonaws.com/')) {
      key = key.split('.amazonaws.com/')[1];
    } else if (key.startsWith('http://') || key.startsWith('https://')) {
      const parts = key.split('/');
      key = parts.slice(3).join('/');
    }
    key = key.replace(/^\//, '');

    // Authorization check: Admin/Superadmin or document owner
    const userRole = (user.role || '').toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    let isOwner = false;
    if (userRole === 'PARTNER') {
      const { rows: [partner] } = await query(
        `SELECT id FROM partner_profiles WHERE user_id = $1`,
        [user.id]
      );
      if (partner && partner.id === doc.partner_id) {
        isOwner = true;
      }
    }

    if (!isAdmin && !isOwner) {
      return error(res, 'Access denied. You do not have permission to view this document.', 403);
    }

    // Generate S3 signed URL using parsed key
    const signedUrl = await getSignedDownloadUrl(key);

    // Support both redirect and JSON output depending on query parameter
    if (req.query.redirect === 'true') {
      return res.redirect(signedUrl);
    }

    return success(res, { url: signedUrl });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getKyc,
  uploadDocument,
  verifyDocument,
  updateStatus,
  viewDocument
};
