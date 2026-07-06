const express = require('express');
const router  = express.Router();

const authRoute                             = require('../modules/auth/route.js');
const { partnerRouter, partnerSelfRouter, kycRouter } = require('../modules/partner/route.js');
const adminRoute                            = require('../modules/admin/route.js');
const { superadminRouter, settingsRouter }  = require('../modules/super-admin/route.js');
const bannerRoute                           = require('../modules/banner/route.js');
const { applicationRouter, leadRouter, cardApplicationRouter } = require('../modules/crm/route.js');
const walletRoute                           = require('../modules/wallet/route.js');
const productRoute                          = require('../modules/products/route.js');
const notificationRoute                     = require('../modules/notifications/route.js');
const reportRoute                           = require('../modules/reports/route.js');
const bankRoute                             = require('../modules/banks/route.js');
const { cmsRouter, serviceRouter, serviceCatalogRouter } = require('../modules/cms/route.js');
const redirectCtrl = require('../modules/products/link-management.controller.js');
const analyticsRoute = require('../modules/analytics/route.js');

router.use('/auth',             authRoute);
router.use('/Partners',         partnerRouter);
router.use('/partner',          partnerSelfRouter);
router.use('/admin',            adminRoute);
router.use('/superadmin',       superadminRouter);
router.use('/banners',          bannerRoute);
router.use('/settings',         settingsRouter);
router.use('/applications',     applicationRouter);
router.use('/wallet',           walletRoute);
router.use('/products',         productRoute);
router.use('/notifications',    notificationRoute);
router.use('/reports',          reportRoute);
router.use('/kyc',              kycRouter);
router.use('/partner/kyc',      kycRouter);
router.use('/banks',            bankRoute);
router.use('/cms/sections',     cmsRouter);
router.use('/services',         serviceRouter);
router.use('/service-catalog',  serviceCatalogRouter);
router.use('/leads',            leadRouter);
router.use('/card-applications',cardApplicationRouter);

// Dynamic Product Redirect & Analytics Routes
router.get('/redirect/:productId', redirectCtrl.handleRedirect);
router.get('/r/:partnerCode/:productId', redirectCtrl.handleRedirect);
router.use('/analytics', analyticsRoute);

module.exports = router;
