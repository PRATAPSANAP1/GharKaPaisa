const express = require('express');
const multer = require('multer');
const router = express.Router();

const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');
const roleCheck = require('../../middleware/authorization/role.middleware');
const ctrl = require('./bulk-sms.controller');

// ── Multer Configuration (Memory Storage, 10MB limit) ────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = /\.(csv|xlsx|xls|pdf)$/i;
    if (!allowedExts.test(file.originalname)) {
      return cb(new Error('Invalid file type. Only CSV, XLSX, XLS, and PDF files are supported.'));
    }
    cb(null, true);
  },
});

// ── Super Admin Authorization Enforcement ────────────────────────────────────
// Direct API requests from non-Super Admin users are strictly rejected (401/403)
router.use(jwtAuth);
router.use(roleCheck('SUPER_ADMIN'));

// ── Bulk SMS Endpoints ───────────────────────────────────────────────────────
// Upload & Validation
router.post('/upload', upload.single('file'), ctrl.uploadRecipients);

// Statistics
router.get('/stats', ctrl.getStats);

// Templates
router.get('/templates', ctrl.getTemplates);
router.get('/templates/:id', ctrl.getTemplate);
router.post('/templates', ctrl.createTemplate);

// Campaigns
router.post('/campaigns', ctrl.createCampaign);
router.get('/campaigns', ctrl.listCampaigns);
router.get('/campaigns/:id', ctrl.getCampaign);
router.get('/campaigns/:id/recipients', ctrl.getCampaignRecipients);
router.get('/campaigns/:id/report', ctrl.getCampaignReport);
router.get('/campaigns/:id/export', ctrl.exportCampaignReport);
router.post('/campaigns/:id/send', ctrl.triggerSendNow);
router.post('/campaigns/:id/schedule', ctrl.rescheduleCampaign);

module.exports = router;
