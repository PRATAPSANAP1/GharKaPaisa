const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/partner.controller');
const { authenticate, syncUser, authorize, requireApprovedPartner, selfOrAdmin } = require('../middleware/auth.middleware');
const { upload } = require('../services/s3.service');

const kycUpload = upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'gst_cert', maxCount: 1 },
  { name: 'cancelled_cheque', maxCount: 1 },
]);

// All routes require auth
router.use(authenticate, syncUser);

// Partner self-access or admin
router.get('/:PartnerId/profile', selfOrAdmin('PartnerId'), ctrl.getProfile);
router.put('/:PartnerId/profile', selfOrAdmin('PartnerId'), ctrl.updateProfile);
router.post('/:PartnerId/kyc', 
  selfOrAdmin('PartnerId'), 
  kycUpload, 
  (req, res, next) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'];
    const files = Object.values(req.files || {}).flat();
    const invalid = files.filter(f => !allowed.includes(f.mimetype));
    if (invalid.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only JPG, PNG, PDF files allowed' 
      });
    }
    next();
  },
  ctrl.uploadKYCDocuments
);
router.get('/:PartnerId/dashboard', selfOrAdmin('PartnerId'), requireApprovedPartner, ctrl.getDashboardStats);

// Admin only — partner management
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), ctrl.listPartners);
router.patch('/:PartnerId/approve', authorize('ADMIN', 'SUPER_ADMIN'), ctrl.approvePartner);

module.exports = router;
