const express = require('express');
const router = express.Router();
const { authenticate, syncUser, authorize } = require('../../middleware/authentication/auth.middleware');
const { upload } = require('../../services/aws/s3.service');
const ctrl = require('./attendance-enrollment.controller');

// All routes require authenticated and synchronized user
router.use(authenticate, syncUser);

// ── Employee Biometric Face Enrollment ───────────────────────────
// Session creation (Admin, HR, or Employee initiating initial session)
router.post('/session', ctrl.createSession);

// Commit face capture (upload face_image file with session_token)
router.post('/commit', upload.single('face_image'), ctrl.commitFaceEnrollment);

// Get biometric status for employee
router.get('/employee/:employeeId', ctrl.getEmployeeStatus);

// ── Super Admin Re-Enrollment ────────────────────────────────────
router.post('/re-enrollment/session', authorize('SUPER_ADMIN'), ctrl.createReEnrollmentSession);
router.post('/re-enrollment/commit', authorize('SUPER_ADMIN'), upload.single('face_image'), ctrl.commitReEnrollment);

// ── Secure Temporary Image Preview (Admin/Super Admin only) ──────
router.get('/preview/:employeeId', authorize('SUPER_ADMIN', 'ADMIN'), ctrl.getPreviewUrl);

// ── Approved Office Environment References ───────────────────────
router.get('/environment', authorize('SUPER_ADMIN', 'ADMIN', 'HR'), ctrl.getEnvironmentReferences);
router.post('/environment', authorize('SUPER_ADMIN', 'ADMIN'), upload.single('environment_image'), ctrl.registerEnvironmentReference);
router.post('/environment/:referenceCode/revoke', authorize('SUPER_ADMIN'), ctrl.revokeEnvironmentReference);

module.exports = router;
