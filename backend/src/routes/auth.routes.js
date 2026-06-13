/**
 * auth.routes.js
 * ──────────────────────────────────────────────────────────────────────────
 * Firebase Auth is the source of truth for credentials.
 * Backend routes only handle:
 *   GET  /me          — return user + firebase profile
 *   POST /register    — save extra profile data (business/bank) after Firebase signup
 *   POST /logout      — signal logout (Firebase token expires client-side)
 *
 * Legacy routes (login, otp, refresh) are retained as stubs so existing
 * clients don't get 404s during transition.
 */
const express = require('express');
const router  = express.Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, registerRules } = require('../middleware/validation.middleware');

// Rate limiters
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, message: 'Too many registration attempts. Try again after an hour.' }
});

const meLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60,
  message: { success: false, message: 'Too many requests.' }
});

// ── Primary Routes (Firebase Auth) ────────────────────────────────────────
// GET /auth/me — called after Firebase login to get full user profile
router.get('/me', meLimiter, authenticate, ctrl.getMe);

// POST /auth/register — save business/bank profile after Firebase signup
router.post('/register', registerLimiter, registerRules, validate, ctrl.register);

// POST /auth/logout
router.post('/logout', authenticate, ctrl.logout);

// ── Legacy stub routes (kept to avoid 404 during transition) ──────────────
router.post('/login',       ctrl.login);
router.post('/otp/send',    ctrl.sendOTPHandler);
router.post('/otp/verify',  ctrl.verifyOTPLogin);
router.post('/refresh',     ctrl.refreshToken);

module.exports = router;
