const express = require('express');
const router = express.Router();
const reportCtrl = require('./controller.js');
const { authenticate, syncUser, authorize } = require('../../middleware/authentication/auth.middleware.js');

router.use(authenticate, syncUser);
router.use(authorize('PARTNER', 'ADMIN', 'SUPER_ADMIN'));

// Core 10 Report Endpoints
router.get('/dashboard', reportCtrl.getDashboardReportController);
router.get('/applications', reportCtrl.getApplicationsReportController);
router.get('/customers', reportCtrl.getCustomersReportController);
router.get('/wallet', reportCtrl.getWalletReportController);
router.get('/commission', reportCtrl.getCommissionReportController);
router.get('/team', reportCtrl.getTeamReportController);
router.get('/withdrawals', reportCtrl.getWithdrawalsReportController);
router.get('/products', reportCtrl.getProductsReportController);
router.get('/banks', reportCtrl.getBanksReportController);
router.get('/revenue', authorize('ADMIN', 'SUPER_ADMIN'), reportCtrl.getRevenueReportController);

// Export & Scheduling Endpoints
router.post('/export', reportCtrl.postReportExportController);
router.post('/schedule', reportCtrl.postScheduleReportController);

// Legacy/Auxiliary Report Endpoints
router.get('/overview', reportCtrl.getOverview);
router.get('/applications-by-product', reportCtrl.applicationsByProduct);
router.get('/top-Partners', reportCtrl.topPartners);
router.get('/monthly-trend', reportCtrl.monthlyTrend);
router.get('/payouts-export', reportCtrl.exportPayoutsReport);
router.get('/partners-export', reportCtrl.exportPartnersReport);
router.get('/application-clicks', reportCtrl.getApplicationClickReport);

module.exports = router;
