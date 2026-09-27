const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const {
  getKycApplications,
  getKycApplicationById,
  getKycApplicationDocuments,
  verifyKycApplication,
  rejectKycApplication,
  requestInfoKycApplication,
  updateKycStageAndDetails
} = require('./kyc-operator.controller.js');

/**
 * Middleware: Require KYC_OPERATOR designation or SUPER_ADMIN access
 * Enforces strict server-side RBAC for ADMIN + KYC_OPERATOR
 */
const requireKycOperator = (req, res, next) => {
  const role = String(req.user?.role || '').toUpperCase();
  const designation = String(req.user?.designation || '').toUpperCase();

  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'SUPERADMIN';
  const isKycOperator = role === 'KYC_OPERATOR' || 
                        designation === 'KYC_OPERATOR' || 
                        designation === 'KYC OPERATOR' ||
                        (role === 'ADMIN' && (designation === 'KYC_OPERATOR' || designation === 'KYC OPERATOR'));

  if (!isSuperAdmin && !isKycOperator) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only users with KYC Operator designation can access the KYC Operator queue.'
    });
  }

  next();
};

// All endpoints require authentication and KYC Operator access
router.use(jwtAuth);
router.use(requireKycOperator);

// Applications endpoints
router.get('/applications', getKycApplications);
router.get('/applications/:id', getKycApplicationById);
router.get('/applications/:id/documents', getKycApplicationDocuments);

// KYC Action endpoints
router.post('/applications/:id/verify', verifyKycApplication);
router.post('/applications/:id/reject', rejectKycApplication);
router.post('/applications/:id/request-information', requestInfoKycApplication);
router.post('/applications/:id/update-stage', updateKycStageAndDetails);
router.put('/applications/:id/update-stage', updateKycStageAndDetails);

module.exports = router;
