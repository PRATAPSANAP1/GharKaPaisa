const express = require('express');
const router = express.Router();
const appCtrl = require('./application.controller.js');
const { authenticate, syncUser, authorize, requireApprovedPartner } = require('../../middleware/authentication/auth.middleware.js');
const { upload } = require('../../services/aws/s3.service.js');
const { applicationRules, validate } = require('../../middleware/validation/validation.middleware.js');

// Public route for homepage lead generation
router.post('/public', applicationRules, validate, appCtrl.submitPublicApplication);

router.use(authenticate, syncUser);

router.get('/', appCtrl.listApplications);
router.get('/:id', appCtrl.getApplication);
router.post('/', authorize('PARTNER'), requireApprovedPartner, applicationRules, validate, appCtrl.submitApplication);
router.patch('/:id/status', authorize('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'), appCtrl.updateStatus);
router.post('/:id/documents', authorize('PARTNER', 'ADMIN', 'SUPER_ADMIN'), upload.single('document'), appCtrl.uploadApplicationDoc);

module.exports = router;
