const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const partnerCtrl = require('./partner.controller.js');
const authCtrl = require('../auth/controller.js');
const { upload, uploadVideo } = require('../../services/aws/s3.service.js');
const { validate, registerRules } = require('../../middleware/validation/validation.middleware.js');

const kycUpload = upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'gst_cert', maxCount: 1 },
  { name: 'cancelled_cheque', maxCount: 1 },
]);

const { requirePartner, requireApprovedPartner } = require('../../middleware/authentication/auth.middleware.js');

// All routes require authenticated Firebase token
router.use(jwtAuth);

router.post('/register', registerRules, validate, authCtrl.register);
router.post('/upload-docs', requirePartner, kycUpload, partnerCtrl.uploadSelfKYC);

// Video KYC endpoints
router.post('/kyc/upload-pan', requirePartner, upload.single('document'), partnerCtrl.uploadPan);
router.post('/kyc/upload-cheque', requirePartner, upload.single('document'), partnerCtrl.uploadCheque);
router.post('/kyc/upload-video', requirePartner, uploadVideo.single('video'), partnerCtrl.uploadVideo);
router.post('/kyc/submit', requirePartner, partnerCtrl.submitKyc);
router.get('/kyc/status', requirePartner, partnerCtrl.getKycStatus);
router.get('/kyc/details', requirePartner, partnerCtrl.getKycDetails);
router.get('/profile', requirePartner, partnerCtrl.getSelfProfile);
router.get('/customers', requireApprovedPartner, partnerCtrl.listPartnerCustomers);
router.post('/customers', requireApprovedPartner, partnerCtrl.createPartnerCustomer);
router.get('/training', requirePartner, partnerCtrl.getTrainingModules);
router.post('/training/:moduleId/complete', requirePartner, partnerCtrl.completeTrainingModule);
router.get('/referral', requireApprovedPartner, partnerCtrl.getReferralInfo);
router.get('/team-tree', requireApprovedPartner, partnerCtrl.getTeamTree);
router.get('/team-dashboard', requireApprovedPartner, partnerCtrl.getTeamDashboard);
router.get('/team-earnings', requireApprovedPartner, partnerCtrl.getTeamEarnings);

module.exports = router;
