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
const supportRoute                          = require('../modules/support/support.routes.js');
const marketingRoute                        = require('../modules/marketing/marketing.routes.js');
const redirectCtrl = require('../modules/products/link-management.controller.js');
const analyticsRoute = require('../modules/analytics/route.js');

const paymentRoute                          = require('../modules/payment/payment.route.js');
const locationRoute                         = require('../modules/location/location.routes.js');

const walletCtrl = require('../modules/wallet/controller.js');
const partnerCtrl = require('../modules/partner/partner.controller.js');

const customerRoute = require('../modules/customer/customer.routes.js');
const teamRoutes    = require('../modules/team/team.routes.js');

router.post('/razorpay/webhook', walletCtrl.handleRazorpayWebhook);
router.post('/partner/referral-click', partnerCtrl.invitePartnerClick);
router.use('/payment', paymentRoute);
router.use('/location', locationRoute);
router.use('/', teamRoutes);

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
router.use('/customers',        customerRoute);
router.use('/card-applications',cardApplicationRouter);
router.use('/support/tickets',   supportRoute);
router.use('/marketing/materials', marketingRoute);

// Dynamic Product Redirect & Analytics Routes
router.get('/redirect/:productId', redirectCtrl.handleRedirect);
router.get('/r/:partnerCode/:productId', redirectCtrl.handleRedirect);
router.use('/analytics', analyticsRoute);

module.exports = router;
