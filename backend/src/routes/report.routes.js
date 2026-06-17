const express = require('express');
const router = express.Router();
const reportCtrl = require('../controllers/report.controller');
const { authenticate, syncUser, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, syncUser);
router.use(authorize('admin', 'super_admin'));

router.get('/overview', reportCtrl.getOverview);
router.get('/applications-by-product', reportCtrl.applicationsByProduct);
router.get('/top-Partners', reportCtrl.topPartners);
router.get('/monthly-trend', reportCtrl.monthlyTrend);
router.get('/payouts-export', reportCtrl.exportPayoutsReport);

module.exports = router;
