const express = require('express');
const router = express.Router();
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');

const partnerCtrl = require('../partner/partner.controller.js');
const authCtrl = require('../auth/controller.js');
const appCtrl = require('../crm/application.controller.js');
const productCtrl = require('../products/controller.js');
const walletCtrl = require('../wallet/controller.js');
const superAdminCtrl = require('../super-admin/controller.js');
const designationAuditCtrl = require('./designationAudit.controller.js');

const { validate, commissionRules } = require('../../middleware/validation/validation.middleware.js');

// All admin routes require authenticated Firebase token
router.use(jwtAuth);

// ── GET /admin/designation-rules (Read-Only Audit API) ────────────────────────
router.get('/designation-rules', roleCheck('ADMIN', 'SUPER_ADMIN'), designationAuditCtrl.getDesignationRulesAudit);
router.get('/designation-audit', roleCheck('ADMIN', 'SUPER_ADMIN'), designationAuditCtrl.getDesignationRulesAudit);

// ── GET /admin/partners ──────────────────────────────────────────────────────
router.get('/partners', roleCheck('ADMIN', 'SUPER_ADMIN'), partnerCtrl.listPartners);
router.delete('/partners/:id', roleCheck('SUPER_ADMIN'), superAdminCtrl.deleteAdmin);
router.delete('/users/:id', roleCheck('SUPER_ADMIN'), superAdminCtrl.deleteAdmin);

// ── POST /admin/approve-kyc ──────────────────────────────────────────────────
router.post('/approve-kyc', roleCheck('ADMIN', 'SUPER_ADMIN'), partnerCtrl.approvePartnerKYC);

// ── POST /admin/update-role ──────────────────────────────────────────────────
router.post('/update-role', roleCheck('ADMIN', 'SUPER_ADMIN'), authCtrl.setRole);

router.get('/applications', roleCheck('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE', 'OPERATIONAL_HEAD', 'OPERATIONS_HEAD', 'OPERATIONAL HEAD', 'OPERATIONS HEAD', 'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'PAN CHECKER', 'PAN_CHECKER', 'QD OPERATOR', 'QD_OPERATOR', 'REMARK OPERATOR', 'REMARK_OPERATOR', 'FINAL STATUS OPERATOR', 'FINAL_STATUS_OPERATOR', 'QUERABLE OPERATOR', 'QUERABLE_OPERATOR', 'QUERYABLE OPERATOR', 'QUERYABLE_OPERATOR', 'PHYSICAL_CURABLE', 'PHYSICAL CURABLE', 'DIGITAL_CURABLE', 'DIGITAL CURABLE', 'EMAIL_CURABLE', 'EMAIL CURABLE', 'PHYSICAL_CURABLE_OPERATOR', 'PHYSICAL CURABLE OPERATOR', 'DIGITAL_CURABLE_OPERATOR', 'DIGITAL CURABLE OPERATOR', 'EMAIL_CURABLE_OPERATOR', 'EMAIL CURABLE OPERATOR'), appCtrl.listApplications);
router.post('/applications/:id/claim-request', roleCheck('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE', 'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_OPERATOR', 'ADMINISTRATIVE SALES OPERATOR'), appCtrl.claimApplicationRequest);
router.put('/applications/:id/claim-request', roleCheck('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE', 'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_OPERATOR', 'ADMINISTRATIVE SALES OPERATOR'), appCtrl.claimApplicationRequest);
router.patch('/applications/:id/claim-request', roleCheck('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE', 'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_OPERATOR', 'ADMINISTRATIVE SALES OPERATOR'), appCtrl.claimApplicationRequest);
router.post('/applications/:id/assign-sales-executive', roleCheck('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE', 'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_OPERATOR', 'ADMINISTRATIVE SALES OPERATOR'), appCtrl.assignApplicationToSalesExecutive);
router.get('/assignable-employees', roleCheck('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE', 'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_OPERATOR', 'ADMINISTRATIVE SALES OPERATOR'), appCtrl.getAssignableEmployees);

// ── POST /admin/commission-rule ──────────────────────────────────────────────
router.post('/commission-rule', roleCheck('SUPER_ADMIN'), commissionRules, validate, productCtrl.setCommission);
router.post('/commission-rules/bulk', roleCheck('SUPER_ADMIN'), productCtrl.bulkSetCommission);

// ── GET /admin/commission-rules ──────────────────────────────────────────────
router.get('/commission-rules', roleCheck('SUPER_ADMIN'), productCtrl.listCommissionRules);

// ── DELETE /admin/commission-rules/:id ─────────────────────────────────────────
router.delete('/commission-rules/:id', roleCheck('SUPER_ADMIN'), productCtrl.deleteCommissionRule);

// ── POST /admin/withdrawal/approve ───────────────────────────────────────────
router.post('/withdrawal/approve', roleCheck('ADMIN', 'SUPER_ADMIN'), walletCtrl.approveWithdrawalController);

// ── POST /admin/withdrawal/reject ────────────────────────────────────────────
router.post('/withdrawal/reject', roleCheck('ADMIN', 'SUPER_ADMIN'), walletCtrl.rejectWithdrawalController);

// ── POST /admin/wallet/adjust ────────────────────────────────────────────────
router.post('/wallet/adjust', roleCheck('ADMIN', 'SUPER_ADMIN'), walletCtrl.adminAdjustWalletController);

// ── Bulk SMS Sub-Router Compatibility ────────────────────────────────────────
const bulkSmsRoute = require('../bulk-sms/bulk-sms.routes.js');
router.use('/bulk-sms', bulkSmsRoute);

module.exports = router;
