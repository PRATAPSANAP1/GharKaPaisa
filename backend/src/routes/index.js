const express = require('express');
const router  = express.Router();

const authRoute                             = require('../modules/auth/route.js');
const { partnerRouter, partnerSelfRouter, kycRouter } = require('../modules/partner/route.js');
const adminRoute                            = require('../modules/admin/route.js');
const { superadminRouter, settingsRouter }  = require('../modules/super-admin/route.js');
const bannerRoute                           = require('../modules/banner/route.js');
const { applicationRouter, leadRouter, cardApplicationRouter, loanApplicationRouter, insuranceApplicationRouter, bankCardApplicationRouter } = require('../modules/crm/route.js');
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
const customerPortalRoute = require('../modules/customer/customer_portal.routes.js');
const teamRoutes    = require('../modules/team/team.routes.js');

// ── Webhooks & Public Actions ──────────────────────────────────
router.post('/razorpay/webhook', walletCtrl.handleRazorpayWebhook);
router.post('/partner/referral-click', partnerCtrl.invitePartnerClick);

// ── Public Homepage & Catalog Content (No auth required) ────────
router.use('/products',         productRoute);
router.use('/banners',          bannerRoute);
router.use('/cms/sections',     cmsRouter);
router.use('/services',         serviceRouter);
router.use('/service-catalog',  serviceCatalogRouter);
router.use('/settings',         settingsRouter);
router.use('/customer-portal',  customerPortalRoute);

// ── Redirects & Analytics ──────────────────────────────────────
router.get('/redirect/:productId', redirectCtrl.handleRedirect);
router.get('/r/:partnerCode/:productId', redirectCtrl.handleRedirect);
router.use('/analytics', analyticsRoute);

// ── Auth Endpoints ─────────────────────────────────────────────
router.use('/auth',             authRoute);

// ── Location & Payment ─────────────────────────────────────────
router.use('/payment', paymentRoute);
router.use('/location', locationRoute);

// ── Partner Scopes ─────────────────────────────────────────────
router.use('/partner',          partnerSelfRouter);
router.use('/Partners',         partnerRouter);
router.use('/kyc',              kycRouter);

// ── Admin / CRM / Operational Scopes ───────────────────────────
router.use('/admin',            adminRoute);
router.use('/superadmin',       superadminRouter);
router.use('/applications',     applicationRouter);
router.use('/wallet',           walletRoute);
router.use('/notifications',    notificationRoute);
router.use('/reports',          reportRoute);
router.use('/banks',            bankRoute);
router.use('/leads',            leadRouter);
router.use('/customers',        customerRoute);
router.use('/card-applications',cardApplicationRouter);
router.use('/admin/bank-cards', bankCardApplicationRouter);
router.use('/crm/loan-applications', loanApplicationRouter);
router.use('/crm/insurance-applications', insuranceApplicationRouter);
router.use('/support/tickets',   supportRoute);
router.use('/marketing/materials', marketingRoute);

// ── Team & Referrals Routes ──
router.use('/team', teamRoutes);

module.exports = router;
