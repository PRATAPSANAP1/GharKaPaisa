/**
 * auth.routes.js — Firebase Auth Only
 * ─────────────────────────────────────────────────────────────────────────
 * PHASE 6: Only 3 clean routes remain.
 *   GET  /me       — verify token + return user profile
 *   POST /register — save business/bank profile after Firebase signup
 *   POST /logout   — client-side token cleanup signal
 */
const express = require('express');
const router  = express.Router();
const rateLimit = require('express-rate-limit');
const firebaseAuth = require('../middleware/firebaseAuth.middleware');
const roleCheck = require('../middleware/role.middleware');
const ctrl = require('../controllers/auth.controller');
const { validate, registerRules } = require('../middleware/validation.middleware');

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, message: 'Too many registration attempts. Try again after an hour.' }
});

const meLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many requests.' }
});

// ── Primary Routes ──────────────────────────────────────────────────────────
router.get('/me',       meLimiter,      firebaseAuth,                          ctrl.getMe);
router.post('/register', registerLimiter, firebaseAuth, registerRules, validate, ctrl.register);
router.post('/logout',  firebaseAuth,   ctrl.logout);

// Admin-only route to set role
router.put('/admin/set-role', firebaseAuth, roleCheck('admin', 'super_admin'), ctrl.setRole);

module.exports = router;
