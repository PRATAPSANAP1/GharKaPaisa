/**
 * auth.routes.js — Email OTP Auth
 * ─────────────────────────────────────────────────────────────────────────
 * All login is via email OTP. No password-based login.
 */
const express = require('express');
const router  = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');
const {
  loginLimiter,
  sendOtpLimiter,
  verifyOtpLimiter,
  registerLimiter,
  forgotPasswordLimiter
} = require('../../middleware/rate-limit/rateLimit.middleware.js');
const ctrl = require('./controller.js');
const { validate, registerRules } = require('../../middleware/validation/validation.middleware.js');

// ── Public Auth Routes ──────────────────────────────────────────────────────────
router.post('/login',                    loginLimiter,          ctrl.login);
router.post('/login-msg91',              loginLimiter,          ctrl.loginWithMsg91);
router.post('/login-password',           loginLimiter,          ctrl.loginPassword);
router.post('/send-otp',                 sendOtpLimiter,        ctrl.sendOtp);
router.post('/send-registration-otp',    sendOtpLimiter,        ctrl.sendRegistrationOtp);
router.post('/verify-otp',               verifyOtpLimiter,      ctrl.login);
router.post('/verify-registration-otp',  verifyOtpLimiter,      ctrl.verifyRegistrationOtp);
router.post('/lookup',                   loginLimiter,          ctrl.lookupUser);
router.post('/register',                 registerLimiter,       registerRules, validate, ctrl.register);
router.post('/forgot-password',          forgotPasswordLimiter, ctrl.forgotPassword);
router.post('/forgot-mobile',            forgotPasswordLimiter, ctrl.forgotMobile);
router.post('/reset-password',           forgotPasswordLimiter, ctrl.resetPassword);
router.post('/verify-email',             verifyOtpLimiter,      ctrl.verifyEmail);
router.post('/resend-verification',      sendOtpLimiter,        ctrl.resendVerificationEmail);
router.post('/refresh',                  loginLimiter,          ctrl.refresh);

// ── Protected Auth Routes ───────────────────────────────────────────────────────
router.get('/me', jwtAuth, ctrl.getMe);
router.post('/logout', jwtAuth, ctrl.logout);

// Admin-only route to set role
router.put('/admin/set-role', loginLimiter, jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.setRole);

// Password update with OTP (Requires JWT Auth)
router.post('/update-password-with-otp', verifyOtpLimiter, jwtAuth, ctrl.updatePasswordWithOtp);

// User profile update (Requires JWT Auth)
router.put('/profile', jwtAuth, ctrl.updateProfile);

// User password change directly (Requires JWT Auth)
router.post('/change-password', jwtAuth, ctrl.changePassword);

module.exports = router;
