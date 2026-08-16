const express = require('express');
const router = express.Router();
const appCtrl = require('./application.controller.js');
const { authenticate, syncUser, authorize, requireApprovedPartner, requireApprovedPartnerOrAdmin } = require('../../middleware/authentication/auth.middleware.js');
const { upload } = require('../../services/aws/s3.service.js');
const { applicationRules, validate } = require('../../middleware/validation/validation.middleware.js');

// Public routes for homepage lead generation & public customer token completion
router.post('/public', applicationRules, validate, appCtrl.submitPublicApplication);
router.get('/apply-token/:token', appCtrl.getPublicApplyToken);
router.patch('/apply-token/:token', appCtrl.submitPublicApplyToken);
router.post('/apply-token/:token', appCtrl.submitPublicApplyToken);
router.get('/apply/:token', appCtrl.getPublicApplyToken);
router.patch('/apply/:token', appCtrl.submitPublicApplyToken);
router.post('/apply/:token', appCtrl.submitPublicApplyToken);

// Dedicated Physical Application Form Public Routes
router.get('/physical-application/:token', appCtrl.getPhysicalApplicationByToken);
router.post('/physical-application/:token/submit', appCtrl.submitPhysicalApplicationByToken);

router.use(authenticate, syncUser);

// Configurable Bank Requirements & Customer Share Link
router.get('/bank-requirements', requireApprovedPartnerOrAdmin, appCtrl.getBankRequirements);
router.post('/bank-requirements', authorize('ADMIN', 'SUPER_ADMIN'), appCtrl.saveBankRequirements);
router.post('/generate-share-link', requireApprovedPartnerOrAdmin, appCtrl.generateShareLink);
router.post('/generate-physical-link', requireApprovedPartnerOrAdmin, appCtrl.generatePhysicalLink);
router.post('/:id/physical-link', requireApprovedPartnerOrAdmin, appCtrl.generatePhysicalLink);

// Dashboards, Search, and Analytics
router.get('/dashboard', requireApprovedPartnerOrAdmin, appCtrl.getApplicationsDashboard);
router.get('/analytics', requireApprovedPartnerOrAdmin, appCtrl.getAnalytics);
router.get('/search', requireApprovedPartnerOrAdmin, appCtrl.listApplications);
router.get('/admin/applications', authorize('ADMIN', 'SUPER_ADMIN'), appCtrl.listApplications);
router.get('/super-admin/applications', authorize('SUPER_ADMIN'), appCtrl.listApplications);

// Bulk Operations & Export (must be before /:id routes)
router.put('/bulk-status', requireApprovedPartnerOrAdmin, appCtrl.bulkUpdateStatus);
router.patch('/bulk-status', requireApprovedPartnerOrAdmin, appCtrl.bulkUpdateStatus);
router.post('/import', requireApprovedPartnerOrAdmin, upload.single('file'), appCtrl.importApplications);
router.get('/export/csv', requireApprovedPartnerOrAdmin, appCtrl.exportApplicationsCSV);

// Sub-resource & lifecycle endpoints (MUST be defined before generic /:id)
router.put('/:id/bank-status', requireApprovedPartnerOrAdmin, appCtrl.updateBankProcessingStatus);
router.patch('/:id/bank-status', requireApprovedPartnerOrAdmin, appCtrl.updateBankProcessingStatus);
router.post('/:id/bank-status', requireApprovedPartnerOrAdmin, appCtrl.updateBankProcessingStatus);

router.put('/:id/status', requireApprovedPartnerOrAdmin, appCtrl.updateStatus);
router.patch('/:id/status', requireApprovedPartnerOrAdmin, appCtrl.updateStatus);
router.patch('/:id/process-type', authorize('ADMIN', 'SUPER_ADMIN'), appCtrl.updateProcessType);
router.put('/:id/commission', authorize('ADMIN', 'SUPER_ADMIN'), appCtrl.updateCommission);
router.patch('/:id/vkyc', requireApprovedPartnerOrAdmin, appCtrl.updateVkyc);

// Super Admin Commission Management
router.post('/:id/release-commission', authorize('SUPER_ADMIN'), appCtrl.releaseCommission);
router.post('/:id/hold-commission', authorize('SUPER_ADMIN'), appCtrl.holdCommission);

// Timeline & logs
router.get('/:id/timeline', requireApprovedPartnerOrAdmin, appCtrl.getTimeline);

// Notes & Comments
router.post('/:id/notes', requireApprovedPartnerOrAdmin, appCtrl.addNote);

// Documents Verification
router.get('/:id/documents', requireApprovedPartnerOrAdmin, appCtrl.getDocuments);
router.post('/:id/documents', requireApprovedPartnerOrAdmin, upload.single('document'), appCtrl.uploadApplicationDoc);

// Customer Document Workflow
router.post('/partner-apply', requireApprovedPartnerOrAdmin, appCtrl.submitPartnerApplication);
router.post('/:id/send-link', requireApprovedPartnerOrAdmin, appCtrl.sendUploadLink);
router.all('/:id/send-link', requireApprovedPartnerOrAdmin, appCtrl.sendUploadLink);
router.post('/:id/assign', requireApprovedPartnerOrAdmin, appCtrl.reassignApplication);
router.post('/:id/reassign', requireApprovedPartnerOrAdmin, appCtrl.reassignApplication);
router.put('/:id/documents/:docId/verify', authorize('ADMIN', 'SUPER_ADMIN'), appCtrl.verifyDocument);
router.put('/:id/verification-complete', authorize('ADMIN', 'SUPER_ADMIN'), appCtrl.markVerificationComplete);

// Basic CRUD (generic /:id defined after all sub-resources)
router.get('/', requireApprovedPartnerOrAdmin, appCtrl.listApplications);
router.get('/:id', requireApprovedPartnerOrAdmin, appCtrl.getApplication);
router.post('/', requireApprovedPartner, applicationRules, validate, appCtrl.submitApplication);
router.put('/:id', requireApprovedPartnerOrAdmin, appCtrl.updateApplicationDetails);
router.patch('/:id', requireApprovedPartnerOrAdmin, appCtrl.updateApplicationDetails);
router.delete('/:id', requireApprovedPartnerOrAdmin, appCtrl.deleteApplication);

module.exports = router;
