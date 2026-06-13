// ─────────────────────────────────────────────────────────────────────────────
// src/routes/index.js — Master router
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/Partners', require('./partner.routes'));
router.use('/applications', require('./application.routes'));
router.use('/wallet', require('./wallet.routes'));
router.use('/products', require('./product.routes'));
router.use('/banks', require('./product.routes'));   // banks endpoint lives in product router
router.use('/notifications', require('./notification.routes'));
router.use('/reports', require('./report.routes'));

module.exports = router;
