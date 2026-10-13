const express = require('express');
const router = express.Router();
const { authenticate, syncUser, authorize } = require('../../middleware/authentication/auth.middleware');
const { upload } = require('../../services/aws/s3.service');
const ctrl = require('./attendance-enrollment.controller');

// All routes require authenticated and synchronized user
router.use(authenticate, syncUser);

// ── Employee Biometric Face Enrollment ───────────────────────────
// Session creation (Employee self-service or Admin/HR)
router.post(['/session', '/session/'], ctrl.createSession);

// Commit face capture (upload face_image file with session_token)
router.post(['/commit', '/commit/'], upload.single('face_image'), ctrl.commitFaceEnrollment);

// Current authenticated employee's own biometric status
router.get(['/status', '/status/'], ctrl.getMyStatus);

// Get biometric status for specific employee
router.get(['/employee/:employeeId', '/employee/:employeeId/'], ctrl.getEmployeeStatus);

// ── Super Admin Missing Enrollments & Reminders ──────────────────
router.get(['/missing', '/missing/'], authorize('SUPER_ADMIN', 'ADMIN', 'HR'), ctrl.getMissingList);
router.post(['/reminder', '/reminders', '/reminder/', '/reminders/'], authorize('SUPER_ADMIN', 'ADMIN', 'HR'), ctrl.sendReminder);
router.get(['/reminders/:employeeId', '/reminder/:employeeId'], authorize('SUPER_ADMIN', 'ADMIN', 'HR'), ctrl.getReminderHistory);
router.post(['/reminders/:id/seen', '/reminder/:id/seen'], ctrl.markReminderSeen);

// ── Super Admin Re-Enrollment ────────────────────────────────────
router.post(['/re-enrollment/session', '/re-enrollment/session/'], authorize('SUPER_ADMIN'), ctrl.createReEnrollmentSession);
router.post(['/re-enrollment/commit', '/re-enrollment/commit/'], authorize('SUPER_ADMIN'), upload.single('face_image'), ctrl.commitReEnrollment);

// ── Secure Temporary Image Preview (Admin/Super Admin only) ──────
router.get(['/preview/:employeeId', '/preview/:employeeId/'], authorize('SUPER_ADMIN', 'ADMIN'), ctrl.getPreviewUrl);

// ── Approved Office Environment References ───────────────────────
router.get(['/environment', '/environment/'], authorize('SUPER_ADMIN', 'ADMIN', 'HR'), ctrl.getEnvironmentReferences);
router.post(['/environment', '/environment/'], authorize('SUPER_ADMIN', 'ADMIN'), upload.single('environment_image'), ctrl.registerEnvironmentReference);
router.post(['/environment/:referenceCode/revoke', '/environment/:referenceCode/revoke/'], authorize('SUPER_ADMIN'), ctrl.revokeEnvironmentReference);

module.exports = router;
