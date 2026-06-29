const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/role.middleware.js');
const ctrl = require('../../controllers/superAdmin/superadmin.controller.js');

// Require authentication and super_admin authorization globally for this router
router.use(jwtAuth);
router.use(roleCheck('SUPER_ADMIN'));

router.post('/create-admin', ctrl.createAdmin);
router.get('/admins', ctrl.listAdmins);
router.delete('/admins/:id', ctrl.deleteAdmin);
router.post('/block-user', ctrl.blockUser);
router.post('/update-partner-status', ctrl.updatePartnerStatus);
router.get('/audit-logs', ctrl.getAuditLogs);

module.exports = router;
