const express = require('express');
const router = express.Router();
const { authenticate, syncUser, authorize } = require('../../middleware/authentication/auth.middleware');
const ctrl = require('./attendance-admin.controller');

// Enforce authentication & SUPER_ADMIN / ADMIN authorization for admin attendance endpoints
router.use(authenticate, syncUser, authorize('SUPER_ADMIN', 'ADMIN', 'OPERATIONAL_HEAD', 'OPERATIONS_HEAD'));

/**
 * GET /api/v1/attendance/admin/today
 * Retrieve summary metrics and employee attendance records for today (Asia/Kolkata)
 */
router.get('/today', ctrl.getTodayAttendance);

/**
 * GET /api/v1/attendance/admin/history
 * Retrieve historical attendance records with date range filtering, search, and pagination
 */
router.get('/history', ctrl.getAttendanceHistory);

/**
 * GET /api/v1/attendance/admin/employee/:employeeId
 * Retrieve detailed monthly attendance breakdown for a specific employee
 */
router.get('/employee/:employeeId', ctrl.getEmployeeAttendanceDetails);

/**
 * Environment Bypass Admin Management
 */
router.post('/environment-bypass', ctrl.createEnvironmentBypass);
router.get('/environment-bypass', ctrl.listEnvironmentBypasses);
router.delete('/environment-bypass/:bypassId', ctrl.revokeEnvironmentBypass);

module.exports = router;
