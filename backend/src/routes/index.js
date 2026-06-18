// ─────────────────────────────────────────────────────────────────────────────
// backend/src/routes/index.js
// Core Feature: Master Router for /api/v1 endpoint mapping
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();

// Import all sub-routers
const authRoutes = require('./auth.routes');
const PartnerRoutes = require('./partner.routes');
const partnerSelfRouter = require('./partner.self.routes');
const adminRouter = require('./admin.routes');
const superadminRoutes = require('./superadmin.routes');
const bannerRouter = require('./banner.routes');
const settingsRouter = require('./settings.routes');
const kycRouter = require('./kyc.routes');
const applicationRouter = require('./application.routes');
const walletRouter = require('./wallet.routes');
const productRouter = require('./product.routes');
const notificationRouter = require('./notification.routes');
const reportRouter = require('./report.routes');
const bankRouter = require('./bank.routes');
const cmsRouter = require('./cms.routes');
const serviceRouter = require('./service.routes');
const serviceCatalogRouter = require('./service_catalog.routes');
const leadRouter = require('./lead.routes');

// Map endpoints to sub-routers
router.use('/auth', authRoutes);
router.use('/Partners', PartnerRoutes);
router.use('/partner', partnerSelfRouter);
router.use('/admin', adminRouter);
router.use('/superadmin', superadminRoutes);
router.use('/banners', bannerRouter);
router.use('/settings', settingsRouter);
router.use('/applications', applicationRouter);
router.use('/wallet', walletRouter);
router.use('/products', productRouter);
router.use('/notifications', notificationRouter);
router.use('/reports', reportRouter);
router.use('/kyc', kycRouter);
router.use('/banks', bankRouter);
router.use('/cms', cmsRouter);
router.use('/services', serviceRouter);
router.use('/leads', leadRouter);

module.exports = router;
