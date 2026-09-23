const express = require('express');
const router = express.Router();

const { authenticate, syncUser, authorize } = require('../../middleware/authentication/auth.middleware');
const {
  getEmployeeReport,
  getCustomerReport,
  getAdminReport,
  getPartnerReport,
  getApplicationReport,
  getCompleteSystemReport,
  exportEmployeeReport,
  exportCustomerReport,
  exportAdminReport,
  exportPartnerReport,
  exportApplicationReport,
  exportCompleteSystemReport
} = require('./reports.controller');

// Enforce authentication & Super Admin role authorization
router.use(authenticate, syncUser, authorize('SUPER_ADMIN'));

// ── Preview Data Endpoints ─────────────────────────────────────
router.get('/employees', getEmployeeReport);
router.get('/customers', getCustomerReport);
router.get('/admins', getAdminReport);
router.get('/partners', getPartnerReport);
router.get('/applications', getApplicationReport);
router.get('/complete', getCompleteSystemReport);

// ── Excel Export Endpoints ─────────────────────────────────────
router.get('/employees/export', exportEmployeeReport);
router.get('/customers/export', exportCustomerReport);
router.get('/admins/export', exportAdminReport);
router.get('/partners/export', exportPartnerReport);
router.get('/applications/export', exportApplicationReport);
router.get('/complete/export', exportCompleteSystemReport);

module.exports = router;
