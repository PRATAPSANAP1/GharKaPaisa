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

// Verification fallback routes
const verificationCtrl = require('../attendance-verification/attendance-verification.controller');
const { upload } = require('../../services/aws/s3.service');

router.post(['/verification/session', '/verification-session', '/session'], verificationCtrl.createSession);
router.post(['/verification/liveness/session', '/liveness/session'], verificationCtrl.createLivenessSession);
router.post(['/verification/liveness/credentials', '/liveness/credentials'], verificationCtrl.getLivenessCredentials);
router.post(['/verification/liveness/result', '/liveness/result'], verificationCtrl.validateLivenessResult);
router.post(['/verification/complete', '/complete'], upload.single('face_image'), verificationCtrl.completeVerification);
router.get(['/verification/session/:sessionId', '/session/:sessionId'], verificationCtrl.getSessionStatus);

module.exports = router;
