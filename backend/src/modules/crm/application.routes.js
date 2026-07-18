const express = require('express');
const router = express.Router();
const appCtrl = require('./application.controller.js');
const { authenticate, syncUser, authorize, requireApprovedPartner, requireApprovedPartnerOrAdmin } = require('../../middleware/authentication/auth.middleware.js');
const { upload } = require('../../services/aws/s3.service.js');
const { applicationRules, validate } = require('../../middleware/validation/validation.middleware.js');

// Public route for homepage lead generation
router.post('/public', applicationRules, validate, appCtrl.submitPublicApplication);

router.use(authenticate, syncUser);

// Dashboards and Analytics
router.get('/dashboard', requireApprovedPartnerOrAdmin, appCtrl.getApplicationsDashboard);
router.get('/analytics', requireApprovedPartnerOrAdmin, appCtrl.getAnalytics);

// Basic CRUD
router.get('/', requireApprovedPartnerOrAdmin, appCtrl.listApplications);
router.get('/:id', requireApprovedPartnerOrAdmin, appCtrl.getApplication);
router.post('/', requireApprovedPartner, applicationRules, validate, appCtrl.submitApplication);

// Lifecycle states
router.put('/:id/status', requireApprovedPartnerOrAdmin, appCtrl.updateStatus);
router.put('/:id/commission', authorize('ADMIN', 'SUPER_ADMIN'), appCtrl.updateCommission);

// Timeline & logs
router.get('/:id/timeline', requireApprovedPartnerOrAdmin, appCtrl.getTimeline);

// Notes & Comments
router.post('/:id/notes', requireApprovedPartnerOrAdmin, appCtrl.addNote);

// Documents Verification
router.get('/:id/documents', requireApprovedPartnerOrAdmin, appCtrl.getDocuments);
router.post('/:id/documents', requireApprovedPartnerOrAdmin, upload.single('document'), appCtrl.uploadApplicationDoc);

// Customer Document Workflow
router.post('/:id/send-link', requireApprovedPartnerOrAdmin, appCtrl.sendUploadLink);
router.put('/:id/documents/:docId/verify', authorize('ADMIN', 'SUPER_ADMIN'), appCtrl.verifyDocument);
router.put('/:id/verification-complete', authorize('ADMIN', 'SUPER_ADMIN'), appCtrl.markVerificationComplete);
router.put('/:id/bank-status', authorize('ADMIN', 'SUPER_ADMIN'), appCtrl.updateBankProcessingStatus);

module.exports = router;
