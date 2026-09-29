const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');
const roleCheck = require('../../middleware/authorization/role.middleware');
const ctrl = require('./attendance-admin.controller');

// Enforce authentication & SUPER_ADMIN role for all admin attendance endpoints
router.use(jwtAuth, roleCheck('SUPER_ADMIN'));

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

module.exports = router;
