const express = require('express');
const router = express.Router();
const customerPortalCtrl = require('./customer_portal.controller');
const { upload } = require('../../services/aws/s3.service');
const { customerTrackingLimiter, uploadLimiter } = require('../../middleware/rate-limit/rateLimit.middleware');

// Public secure portal routes (Application Token-authenticated)
router.get('/:token', customerPortalCtrl.getPortalData);
router.post('/:token/upload', uploadLimiter, upload.single('document'), customerPortalCtrl.uploadCustomerDocument);
router.post('/:token/submit', customerPortalCtrl.submitDocuments);

// Public Customer Document & Detail Upload Link Routes
router.get('/link/:token', customerPortalCtrl.getCustomerPortalLinkData);
router.post('/link/:token/update-details', customerPortalCtrl.updateCustomerPortalDetails);
router.post('/link/:token/upload-document', uploadLimiter, upload.single('file'), customerPortalCtrl.uploadCustomerPortalDocument);

// Public Customer Application Tracking Route
router.all('/public/track-application', customerTrackingLimiter, customerPortalCtrl.trackCustomerApplication);
router.all('/track', customerTrackingLimiter, customerPortalCtrl.trackCustomerApplication);

module.exports = router;
