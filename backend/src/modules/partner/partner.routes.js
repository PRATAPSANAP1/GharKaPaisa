const express = require('express');
const router = express.Router();
const ctrl = require('./partner.controller.js');
const { authenticate, syncUser, authorize, requireApprovedPartner, selfOrAdmin } = require('../../middleware/authentication/auth.middleware.js');
const { upload } = require('../../services/aws/s3.service.js');

const kycUpload = upload.fields([
  { name: 'aadhaar_front', maxCount: 1 },
  { name: 'aadhaar_back', maxCount: 1 },
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

// Team management
router.post('/:PartnerId/team', selfOrAdmin('PartnerId'), requireApprovedPartner, ctrl.addTeamMember);
router.get('/:PartnerId/team', selfOrAdmin('PartnerId'), ctrl.getTeamMembers);

module.exports = router;
