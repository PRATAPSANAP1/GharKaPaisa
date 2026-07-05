const express = require('express');
const router = express.Router();
const ctrl = require('./controller.js');
const { authenticate, syncUser, authorize } = require('../../middleware/authentication/auth.middleware.js');

// All analytics require authentication and admin/superadmin access
router.use(authenticate, syncUser, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/product-links', ctrl.getProductLinkAnalytics);
router.get('/clicks', ctrl.listClicks);
router.get('/conversions', ctrl.listConversions);

module.exports = router;
