const express = require('express');
const router = express.Router();
const reportCtrl = require('../../controllers/report/report.controller.js');
const { authenticate, syncUser, authorize } = require('../../middleware/auth.middleware.js');

router.use(authenticate, syncUser);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/overview', reportCtrl.getOverview);
router.get('/applications-by-product', reportCtrl.applicationsByProduct);
router.get('/top-Partners', reportCtrl.topPartners);
router.get('/monthly-trend', reportCtrl.monthlyTrend);
router.get('/payouts-export', reportCtrl.exportPayoutsReport);
router.get('/partners-export', reportCtrl.exportPartnersReport);

module.exports = router;
