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
router.post('/', authorize('Partner'), requireApprovedPartner, applicationRules, validate, appCtrl.submitApplication);
router.patch('/:id/status', authorize('admin', 'super_admin', 'employee'), appCtrl.updateStatus);
router.post('/:id/documents', authorize('Partner', 'admin', 'super_admin'), upload.single('document'), appCtrl.uploadApplicationDoc);

module.exports = router;
