const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kyc.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { upload } = require('../services/s3.service');

// Partner self-service routes
router.get('/me', protect, kycController.getKyc);
router.post('/me/documents', protect, upload.single('document'), kycController.uploadDocument);

// Admin/Superadmin routes
router.use(protect, restrictTo('admin', 'superadmin'));
router.get('/:partnerId', kycController.getKyc);
router.post('/:partnerId/documents', upload.single('document'), kycController.uploadDocument);
router.patch('/:partnerId/documents/:docId/verify', kycController.verifyDocument);
router.patch('/:partnerId/status', kycController.updateStatus);

module.exports = router;
