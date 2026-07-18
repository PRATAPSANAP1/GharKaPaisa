const express = require('express');
const router = express.Router();
const customerPortalCtrl = require('./customer_portal.controller');
const { upload } = require('../../services/aws/s3.service');

// Public secure portal routes (Token-authenticated)
router.get('/:token', customerPortalCtrl.getPortalData);
router.post('/:token/upload', upload.single('document'), customerPortalCtrl.uploadCustomerDocument);
router.post('/:token/submit', customerPortalCtrl.submitDocuments);

module.exports = router;
