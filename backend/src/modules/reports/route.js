const express = require('express');
const router = express.Router();
const reportCtrl = require('./controller.js');
const { authenticate, syncUser, authorize } = require('../../middleware/authentication/auth.middleware.js');

router.use(authenticate, syncUser);
router.use(authorize('PARTNER', 'ADMIN', 'SUPER_ADMIN'));

router.get('/overview', reportCtrl.getOverview);
router.get('/applications', reportCtrl.getApplicationsReport);
router.get('/customers', reportCtrl.getCustomersReport);
router.get('/applications-by-product', reportCtrl.applicationsByProduct);
router.get('/top-Partners', reportCtrl.topPartners);
router.get('/monthly-trend', reportCtrl.monthlyTrend);
router.get('/payouts-export', reportCtrl.exportPayoutsReport);
router.get('/partners-export', reportCtrl.exportPartnersReport);
router.get('/application-clicks', reportCtrl.getApplicationClickReport);

module.exports = router;
