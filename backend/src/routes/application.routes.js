const express = require('express');
const router = express.Router();
const appCtrl = require('../controllers/application.controller');
const { authenticate, syncUser, authorize, requireApprovedPartner } = require('../middleware/auth.middleware');
const { upload } = require('../services/s3.service');
const { applicationRules, validate } = require('../middleware/validation.middleware');

// Public route for homepage lead generation
router.post('/public', applicationRules, validate, appCtrl.submitPublicApplication);

router.use(authenticate, syncUser);

router.get('/', appCtrl.listApplications);
router.get('/:id', appCtrl.getApplication);
router.post('/', authorize('PARTNER'), requireApprovedPartner, applicationRules, validate, appCtrl.submitApplication);
router.patch('/:id/status', authorize('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'), appCtrl.updateStatus);
router.post('/:id/documents', authorize('PARTNER', 'ADMIN', 'SUPER_ADMIN'), upload.single('document'), appCtrl.uploadApplicationDoc);

module.exports = router;
