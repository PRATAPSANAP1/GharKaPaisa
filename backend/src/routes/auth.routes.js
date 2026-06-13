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
const firebaseAuth = require('../middleware/firebaseAuth.middleware');
const roleCheck = require('../middleware/role.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const ctrl = require('../controllers/auth.controller');
const { validate, registerRules } = require('../middleware/validation.middleware');

// ── Primary Routes ──────────────────────────────────────────────────────────
router.get('/me',       firebaseAuth,                          ctrl.getMe);
router.post('/register', authLimiter, firebaseAuth, registerRules, validate, ctrl.register);
router.post('/logout',  firebaseAuth,   ctrl.logout);
router.post('/lookup',   authLimiter,                           ctrl.lookupUser);

// Admin-only route to set role
router.put('/admin/set-role', authLimiter, firebaseAuth, roleCheck('admin', 'super_admin'), ctrl.setRole);

module.exports = router;
