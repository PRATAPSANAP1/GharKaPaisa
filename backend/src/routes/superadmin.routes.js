const express = require('express');
const router = express.Router();
const firebaseAuth = require('../middleware/firebaseAuth.middleware');
const roleCheck = require('../middleware/role.middleware');
const ctrl = require('../controllers/superadmin.controller');

// Require authentication and super_admin authorization globally for this router
router.use(firebaseAuth);
router.use(roleCheck('super_admin'));

router.post('/create-admin', ctrl.createAdmin);
router.post('/block-user', ctrl.blockUser);
router.get('/audit-logs', ctrl.getAuditLogs);

module.exports = router;
