/**
 * auth.routes.js — Email OTP Auth
 * ─────────────────────────────────────────────────────────────────────────
 * All login is via email OTP. No password-based login.
 */
const express = require('express');
const router  = express.Router();
const jwtAuth = require('../middleware/jwtAuth.middleware');
const roleCheck = require('../middleware/role.middleware');
const { authLimiter, emailActionLimiter } = require('../middleware/rateLimit.middleware');
const ctrl = require('../controllers/auth.controller');
const { validate, registerRules } = require('../middleware/validation.middleware');

// ── Public Auth Routes ──────────────────────────────────────────────────────────
router.post('/login', authLimiter, ctrl.login);
router.post('/login-msg91', authLimiter, ctrl.loginWithMsg91);
router.post('/login-password', authLimiter, ctrl.loginPassword);
router.post('/send-otp', emailActionLimiter, ctrl.sendOtp);
router.post('/send-registration-otp', emailActionLimiter, ctrl.sendRegistrationOtp);
router.post('/verify-otp', authLimiter, ctrl.login);
router.post('/verify-registration-otp', authLimiter, ctrl.verifyRegistrationOtp);
router.post('/lookup', authLimiter, ctrl.lookupUser);
router.post('/register', authLimiter, registerRules, validate, ctrl.register);
router.post('/forgot-password', authLimiter, ctrl.forgotPassword);
router.post('/reset-password', authLimiter, ctrl.resetPassword);
router.post('/verify-email', authLimiter, ctrl.verifyEmail);
router.post('/resend-verification', emailActionLimiter, ctrl.resendVerificationEmail);
router.post('/refresh', authLimiter, ctrl.refresh);

// ── Protected Auth Routes ───────────────────────────────────────────────────────
router.get('/me', jwtAuth, ctrl.getMe);
router.post('/logout', jwtAuth, ctrl.logout);

// Admin-only route to set role
router.put('/admin/set-role', authLimiter, jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.setRole);

module.exports = router;
