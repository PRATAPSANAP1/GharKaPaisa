const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const partnerCtrl = require('./partner.controller.js');
const authCtrl = require('../auth/controller.js');
const { upload } = require('../../services/aws/s3.service.js');
const { validate, registerRules } = require('../../middleware/validation/validation.middleware.js');

const kycUpload = upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'gst_cert', maxCount: 1 },
  { name: 'cancelled_cheque', maxCount: 1 },
]);

const { requireApprovedPartner } = require('../../middleware/authentication/auth.middleware.js');

// All routes require authenticated Firebase token
router.use(jwtAuth);

router.post('/register', registerRules, validate, authCtrl.register);
router.post('/upload-docs', kycUpload, partnerCtrl.uploadSelfKYC);
router.get('/profile', partnerCtrl.getSelfProfile);
router.get('/customers', requireApprovedPartner, partnerCtrl.listPartnerCustomers);
router.get('/training', partnerCtrl.getTrainingModules);
router.get('/referral', requireApprovedPartner, partnerCtrl.getReferralInfo);
router.get('/team-tree', requireApprovedPartner, partnerCtrl.getTeamTree);
router.get('/team-dashboard', requireApprovedPartner, partnerCtrl.getTeamDashboard);
router.get('/team-earnings', requireApprovedPartner, partnerCtrl.getTeamEarnings);

module.exports = router;
