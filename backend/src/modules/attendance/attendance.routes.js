const express = require('express');
const router = express.Router();
const { authenticate, syncUser } = require('../../middleware/authentication/auth.middleware');
const ctrl = require('./attendance.controller');

// Require authentication for all attendance endpoints
router.use(authenticate, syncUser);

router.post('/check-in', ctrl.checkIn);
router.post('/check-out', ctrl.checkOut);
router.get('/today', ctrl.getTodayAttendance);
router.get('/my-attendance', ctrl.getMyAttendance);
router.get('/my-summary', ctrl.getMySummary);

// Fallback alias routes for enrollment & verification status
router.get('/enrollment/status', (req, res, next) => {
  try {
    const enrollmentCtrl = require('../attendance-enrollment/attendance-enrollment.controller');
    return enrollmentCtrl.getMyStatus(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.post(['/enrollment/reminder', '/enrollment/reminders', '/reminder', '/reminders'], (req, res, next) => {
  try {
    const enrollmentCtrl = require('../attendance-enrollment/attendance-enrollment.controller');
    return enrollmentCtrl.sendReminder(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.get(['/enrollment/reminders/:employeeId', '/enrollment/reminder/:employeeId', '/reminders/:employeeId', '/reminder/:employeeId'], (req, res, next) => {
  try {
    const enrollmentCtrl = require('../attendance-enrollment/attendance-enrollment.controller');
    return enrollmentCtrl.getReminderHistory(req, res, next);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
