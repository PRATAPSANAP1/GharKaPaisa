const express = require('express');
const router = express.Router();
const ctrl = require('./partner.controller.js');
const { authenticate, syncUser, authorize, requireApprovedPartner, selfOrAdmin } = require('../../middleware/authentication/auth.middleware.js');
const { upload } = require('../../services/aws/s3.service.js');

const kycUpload = upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'gst_cert', maxCount: 1 },
  { name: 'cancelled_cheque', maxCount: 1 },
]);

// Public route for tracking referral clicks
router.post('/referral-click', ctrl.invitePartnerClick);

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
router.get('/:PartnerId/dashboard', selfOrAdmin('PartnerId'), ctrl.getDashboardStats);

// Admin only — partner management
router.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'), ctrl.listPartners);
router.patch('/:PartnerId/approve', authorize('ADMIN', 'SUPER_ADMIN'), ctrl.approvePartner);

// Super Admin / Admin team network routes
router.get('/network/all', authorize('ADMIN', 'SUPER_ADMIN'), ctrl.getWholeNetwork);
router.patch('/:PartnerId/change-parent', authorize('SUPER_ADMIN'), ctrl.changeParentPartner);
router.patch('/:PartnerId/deactivate-team', authorize('SUPER_ADMIN'), ctrl.deactivateTeam);

// Team management
router.post('/:PartnerId/team', selfOrAdmin('PartnerId'), requireApprovedPartner, ctrl.addTeamMember);
router.get('/:PartnerId/team', selfOrAdmin('PartnerId'), ctrl.getTeamMembers);

module.exports = router;
