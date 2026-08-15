const express = require('express');
const router = express.Router();
const customerPortalCtrl = require('./customer_portal.controller');
const { upload } = require('../../services/aws/s3.service');

// Public secure portal routes (Application Token-authenticated)
router.get('/:token', customerPortalCtrl.getPortalData);
router.post('/:token/upload', upload.single('document'), customerPortalCtrl.uploadCustomerDocument);
router.post('/:token/submit', customerPortalCtrl.submitDocuments);

// Public Customer Document & Detail Upload Link Routes
router.get('/link/:token', customerPortalCtrl.getCustomerPortalLinkData);
router.post('/link/:token/update-details', customerPortalCtrl.updateCustomerPortalDetails);
router.post('/link/:token/upload-document', upload.single('file'), customerPortalCtrl.uploadCustomerPortalDocument);

module.exports = router;
