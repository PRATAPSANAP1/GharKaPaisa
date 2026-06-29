// ─────────────────────────────────────────────────────────────────────────────
// backend/src/routes/index.js
// Core Feature: Master Router for /api/v1 endpoint mapping
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();

// Import all sub-routers
const authRoutes = require('./auth.routes.js');
const PartnerRoutes = require('./partner/partner.routes.js');
const partnerSelfRouter = require('./partner/partner.self.routes.js');
const adminRouter = require('./admin/admin.routes.js');
const superadminRoutes = require('./settings/superadmin.routes.js');
const bannerRouter = require('./cms/banner.routes.js');
const settingsRouter = require('./settings/settings.routes.js');
const kycRouter = require('./partner/kyc.routes.js');
const applicationRouter = require('./admin/application.routes.js');
const walletRouter = require('./wallet/wallet.routes.js');
const productRouter = require('./cms/product.routes.js');
const notificationRouter = require('./settings/notification.routes.js');
const reportRouter = require('./reports/report.routes.js');
const bankRouter = require('./cms/bank.routes.js');
const cmsRouter = require('./cms/cms.routes.js');
const serviceRouter = require('./cms/service.routes.js');
const serviceCatalogRouter = require('./cms/service_catalog.routes.js');
const leadRouter = require('./admin/lead.routes.js');
const cardApplicationRouter = require('./cards/card_application.routes.js');

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
router.use('/cms/sections', cmsRouter);
router.use('/services', serviceRouter);
router.use('/service-catalog', serviceCatalogRouter);
router.use('/leads', leadRouter);
router.use('/card-applications', cardApplicationRouter);

module.exports = router;
