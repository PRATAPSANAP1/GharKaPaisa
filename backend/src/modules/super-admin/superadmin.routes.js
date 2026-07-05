const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');
const ctrl = require('./controller.js');
const linkCtrl = require('../products/link-management.controller.js');

// Require authentication and super_admin authorization globally for this router
router.use(jwtAuth);
router.use(roleCheck('SUPER_ADMIN'));

router.post('/create-admin', ctrl.createAdmin);
router.get('/admins', ctrl.listAdmins);
router.delete('/admins/:id', ctrl.deleteAdmin);
router.post('/block-user', ctrl.blockUser);
router.post('/update-partner-status', ctrl.updatePartnerStatus);
router.get('/audit-logs', ctrl.getAuditLogs);

// Dynamic Product Link Management endpoints
router.post('/products/link', linkCtrl.saveProductLink);
router.put('/products/link/:id', linkCtrl.saveProductLink);
router.delete('/products/link/:id', linkCtrl.deleteProductLink);

// Video KYC review endpoints
router.post('/kyc/approve', ctrl.approveKYC);
router.post('/kyc/reject', ctrl.rejectKYC);
router.post('/kyc/request-changes', ctrl.requestChangesKYC);

router.post('/commission-rules', ctrl.createCommissionRule);
router.get('/commission-rules', ctrl.getCommissionRules);

module.exports = router;
