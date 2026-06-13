const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/partner.controller');
const { authenticate, authorize, requireApprovedPartner, selfOrAdmin } = require('../middleware/auth.middleware');
const { upload } = require('../services/s3.service');

const kycUpload = upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'gst_cert', maxCount: 1 },
  { name: 'cancelled_cheque', maxCount: 1 },
]);

// All routes require auth
router.use(authenticate);

// Partner self-access or admin
router.get('/:PartnerId/profile', selfOrAdmin('PartnerId'), ctrl.getProfile);
router.put('/:PartnerId/profile', selfOrAdmin('PartnerId'), ctrl.updateProfile);
router.post('/:PartnerId/kyc', selfOrAdmin('PartnerId'), kycUpload, ctrl.uploadKYCDocuments);
router.get('/:PartnerId/dashboard', selfOrAdmin('PartnerId'), ctrl.getDashboardStats);

// Admin only — partner management
router.get('/', authorize('admin', 'super_admin'), ctrl.listPartners);
router.patch('/:PartnerId/approve', authorize('admin', 'super_admin'), ctrl.approvePartner);

module.exports = router;
