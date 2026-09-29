const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');
const roleCheck = require('../../middleware/authorization/role.middleware');
const ctrl = require('./attendance-reports.controller');

// Enforce authentication & SUPER_ADMIN role for all admin reporting endpoints
router.use(jwtAuth, roleCheck('SUPER_ADMIN'));

/**
 * GET /api/v1/attendance/admin/reports
 * Fetch date-wise attendance reports with filters, search, and pagination
 */
router.get('/', ctrl.getReports);

/**
 * GET /api/v1/attendance/admin/reports/export
 * Export attendance report in CSV or XLSX format
 */
router.get('/export', ctrl.exportReports);

module.exports = router;
