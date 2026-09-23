const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const {
  getKycApplications,
  getKycApplicationById,
  getKycApplicationDocuments,
  verifyKycApplication,
  rejectKycApplication,
  requestInfoKycApplication
} = require('./kyc-operator.controller.js');

/**
 * Middleware: Require KYC_OPERATOR, ADMIN, or SUPER_ADMIN access
 */
const requireKycOperator = (req, res, next) => {
  const role = String(req.user?.role || '').toUpperCase();
  const designation = String(req.user?.designation || '').toUpperCase();

  if (role !== 'KYC_OPERATOR' && role !== 'SUPER_ADMIN' && role !== 'ADMIN' && designation !== 'KYC OPERATOR') {
    return res.status(403).json({
      success: false,
      message: 'KYC Operator access required'
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

module.exports = router;
