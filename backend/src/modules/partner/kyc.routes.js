const express = require('express');
const router = express.Router();
const kycController = require('./kyc.controller.js');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const { authenticate, authorize } = require('../../middleware/authentication/auth.middleware.js');
const { upload } = require('../../services/aws/s3.service.js');

// Partner self-service routes (jwtAuth attaches partner_id via syncUser)
router.get('/me', jwtAuth, kycController.getKyc);
router.post('/me/documents', jwtAuth, upload.single('document'), kycController.uploadDocument);
router.get('/documents/:docId/view', kycController.viewDocument);

// Admin/Superadmin routes
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));
router.get('/:partnerId', kycController.getKyc);
router.post('/:partnerId/documents', upload.single('document'), kycController.uploadDocument);
router.patch('/:partnerId/documents/:docId/verify', kycController.verifyDocument);
router.patch('/:partnerId/status', kycController.updateStatus);

module.exports = router;
