const express = require('express');
const router = express.Router();
const ctrl = require('./lead.controller.js');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');
const { requireApprovedPartner, requireApprovedPartnerOrAdmin } = require('../../middleware/authentication/auth.middleware.js');

// List leads (accessible to Partner, Admin, Super Admin)
router.get('/', jwtAuth, requireApprovedPartnerOrAdmin, ctrl.listLeads);

// Create a new lead (accessible to Partner only)
router.post('/', jwtAuth, requireApprovedPartner, ctrl.createLead);

// Update lead status (accessible to Admin/Super Admin only)
router.patch('/:id/status', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.updateLeadStatus);

module.exports = router;
