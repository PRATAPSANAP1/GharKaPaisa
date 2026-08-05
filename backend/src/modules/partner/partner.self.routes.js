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

// Public validation routes (No jwtAuth required)
router.post('/validate-pan', partnerCtrl.validatePan);
router.post('/validate-aadhaar', partnerCtrl.validateAadhaar);
router.post('/validate-gst', partnerCtrl.validateGst);

// All routes require authenticated Firebase token
router.use(jwtAuth);

router.post('/register', registerRules, validate, authCtrl.register);
router.post('/upload-docs', requirePartner, kycUpload, partnerCtrl.uploadSelfKYC);

// Unified KYC upload is handled by POST Partners/:id/kyc 
router.post('/kyc/submit', requirePartner, partnerCtrl.submitKyc);
router.get('/kyc/status', requirePartner, partnerCtrl.getKycStatus);
router.get('/kyc/details', requirePartner, partnerCtrl.getKycDetails);
router.get('/profile', requirePartner, partnerCtrl.getSelfProfile);
router.post('/profile/photo', requirePartner, upload.single('photo'), partnerCtrl.uploadProfilePhoto);
router.post('/profile/logo', requirePartner, upload.single('logo'), partnerCtrl.uploadCompanyLogo);
// Legacy OCR/Face Match routes removed as they are unhandled by FE
router.get('/customers', requireApprovedPartner, partnerCtrl.listPartnerCustomers);
router.post('/customers', requireApprovedPartner, partnerCtrl.createPartnerCustomer);
router.get('/training', requirePartner, partnerCtrl.getTrainingModules);
router.post('/training/:moduleId/complete', requirePartner, partnerCtrl.completeTrainingModule);
router.get('/referral', requireApprovedPartner, partnerCtrl.getReferralInfo);
router.put('/referral-message', requireApprovedPartner, partnerCtrl.updateReferralMessage);
router.get('/invitations', requireApprovedPartner, partnerCtrl.getInvitationHistory);
router.post('/invitations', requireApprovedPartner, partnerCtrl.createInvitation);
router.post('/invitations/:id/resend', requireApprovedPartner, partnerCtrl.resendInvitation);
router.get('/referral-campaigns', requireApprovedPartner, partnerCtrl.getReferralCampaigns);
router.post('/referral-campaigns', requireApprovedPartner, partnerCtrl.createReferralCampaign);
router.get('/team-tree', requireApprovedPartner, partnerCtrl.getTeamTree);
router.get('/team-dashboard', requireApprovedPartner, partnerCtrl.getTeamDashboard);
router.get('/team-earnings', requireApprovedPartner, partnerCtrl.getTeamEarnings);
router.get('/team-members', requireApprovedPartner, partnerCtrl.getTeamMembers);

module.exports = router;
