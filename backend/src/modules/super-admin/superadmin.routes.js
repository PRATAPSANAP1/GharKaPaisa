const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');
const ctrl = require('./controller.js');
const linkCtrl = require('../products/link-management.controller.js');
const walletCtrl = require('../wallet/controller.js');
const appCtrl = require('../crm/application.controller.js');
const notifCtrl = require('../notifications/controller.js');
const productCtrl = require('../products/controller.js');

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
router.post('/kyc/verify-document', ctrl.verifyDocument);

router.post('/commission-rules', ctrl.createCommissionRule);
router.get('/commission-rules', ctrl.getCommissionRules);

// Wallet Management & Settlements
router.get('/wallet/overview', walletCtrl.getWalletOverview);
router.get('/wallet/ledger', walletCtrl.getWalletLedger);
router.get('/wallet/withdrawals', walletCtrl.listWithdrawals);
router.get('/wallet/bank-details/all', walletCtrl.getAllBankDetails);
router.post('/wallet/approve', walletCtrl.approveWithdrawalController);
router.post('/wallet/reject', walletCtrl.rejectWithdrawalController);
router.post('/wallet/manual-credit', walletCtrl.walletManualCredit);
router.post('/wallet/manual-debit', walletCtrl.walletManualDebit);
router.post('/wallet/withdrawals/:id/approve', walletCtrl.approveWithdrawalController);
router.post('/wallet/withdrawals/:id/reject', walletCtrl.rejectWithdrawalController);
router.post('/wallet/adjust', walletCtrl.adminAdjustWalletController);

// Customer Application Lifecycles (Task 9)
router.post('/application/approve', appCtrl.approveApplication);
router.post('/application/reject', appCtrl.rejectApplication);
router.post('/application/reassign', appCtrl.reassignApplication);
router.post('/application/manual-commission', appCtrl.manualCommission);

// Announcements & Broadcast Notifications (Task 10)
router.post('/announcement', notifCtrl.createAnnouncement);
router.put('/announcement/:id', notifCtrl.updateAnnouncement);
router.delete('/announcement/:id', notifCtrl.deleteAnnouncement);
router.post('/notification/broadcast', notifCtrl.broadcastNotification);
router.get('/notification/reports', notifCtrl.getNotificationReports);

// Product Management System (Task 7)
router.post('/products', productCtrl.createProduct);
router.put('/products/status', productCtrl.updateStatus);
router.put('/products/featured', productCtrl.updateFeatured);
router.put('/products/:id', productCtrl.updateProduct);
router.delete('/products/:id', productCtrl.deleteProduct);

module.exports = router;
