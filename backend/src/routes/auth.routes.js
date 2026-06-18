/**
 * auth.routes.js — Custom JWT Auth
 * ─────────────────────────────────────────────────────────────────────────
 */
const express = require('express');
const router  = express.Router();
const jwtAuth = require('../middleware/jwtAuth.middleware');
const roleCheck = require('../middleware/role.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const ctrl = require('../controllers/auth.controller');
const { validate, registerRules } = require('../middleware/validation.middleware');

// ── Public Auth Routes ──────────────────────────────────────────────────────────
router.post('/login', authLimiter, ctrl.login);
router.post('/send-otp', authLimiter, ctrl.sendOtp);
router.post('/verify-otp', authLimiter, ctrl.verifyOtpLogin);
router.post('/lookup', authLimiter, ctrl.lookupUser);
router.post('/register', authLimiter, registerRules, validate, ctrl.register);
router.post('/reset-password', authLimiter, ctrl.resetPassword);

// ── Protected Auth Routes ───────────────────────────────────────────────────────
router.get('/me', jwtAuth, ctrl.getMe);
router.post('/logout', jwtAuth, ctrl.logout);

// Admin-only route to set role
router.put('/admin/set-role', authLimiter, jwtAuth, roleCheck('admin', 'super_admin'), ctrl.setRole);

module.exports = router;
