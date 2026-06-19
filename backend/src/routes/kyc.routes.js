const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kyc.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { upload } = require('../services/s3.service');

// Partner self-service routes
router.get('/me', authenticate, kycController.getKyc);
router.post('/me/documents', authenticate, upload.single('document'), kycController.uploadDocument);

// Admin/Superadmin routes
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));
router.get('/:partnerId', kycController.getKyc);
router.post('/:partnerId/documents', upload.single('document'), kycController.uploadDocument);
router.patch('/:partnerId/documents/:docId/verify', kycController.verifyDocument);
router.patch('/:partnerId/status', kycController.updateStatus);

module.exports = router;
