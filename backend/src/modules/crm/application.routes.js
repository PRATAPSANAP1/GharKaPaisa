const express = require('express');
const router = express.Router();
const appCtrl = require('./application.controller.js');
const { authenticate, syncUser, authorize, requireApprovedPartner, requireApprovedPartnerOrAdmin } = require('../../middleware/authentication/auth.middleware.js');
const { upload } = require('../../services/aws/s3.service.js');
const { applicationRules, validate } = require('../../middleware/validation/validation.middleware.js');

// Public route for homepage lead generation
router.post('/public', applicationRules, validate, appCtrl.submitPublicApplication);

router.use(authenticate, syncUser);

router.get('/', requireApprovedPartnerOrAdmin, appCtrl.listApplications);
router.get('/:id', requireApprovedPartnerOrAdmin, appCtrl.getApplication);
router.post('/', requireApprovedPartner, applicationRules, validate, appCtrl.submitApplication);
router.patch('/:id/status', authorize('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'), appCtrl.updateStatus);
router.post('/:id/documents', requireApprovedPartnerOrAdmin, upload.single('document'), appCtrl.uploadApplicationDoc);

module.exports = router;
