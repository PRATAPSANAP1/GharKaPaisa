const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/agent.controller');
const { authenticate, authorize, requireApprovedAgent, selfOrAdmin } = require('../middleware/auth.middleware');
const { upload } = require('../services/s3.service');

const kycUpload = upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'gst_cert', maxCount: 1 },
  { name: 'cancelled_cheque', maxCount: 1 },
]);

// All routes require auth
router.use(authenticate);

// Agent self-access or admin
router.get('/:agentId/profile',    selfOrAdmin('agentId'), ctrl.getProfile);
router.put('/:agentId/profile',    selfOrAdmin('agentId'), ctrl.updateProfile);
router.post('/:agentId/kyc',       selfOrAdmin('agentId'), kycUpload, ctrl.uploadKYCDocuments);
router.get('/:agentId/dashboard',  selfOrAdmin('agentId'), ctrl.getDashboardStats);

// Admin only
router.get('/',                    authorize('admin', 'super_admin'), ctrl.listAgents);
router.patch('/:agentId/approve',  authorize('admin', 'super_admin'), ctrl.approveAgent);

module.exports = router;
