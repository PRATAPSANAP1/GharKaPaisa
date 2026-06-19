const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lead.controller');
const jwtAuth = require('../middleware/jwtAuth.middleware');
const roleCheck = require('../middleware/role.middleware');

// List leads (accessible to Partner, Admin, Super Admin)
router.get('/', jwtAuth, roleCheck('PARTNER', 'ADMIN', 'SUPER_ADMIN'), ctrl.listLeads);

// Create a new lead (accessible to Partner only)
router.post('/', jwtAuth, roleCheck('PARTNER'), ctrl.createLead);

// Update lead status (accessible to Admin/Super Admin only)
router.patch('/:id/status', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.updateLeadStatus);

module.exports = router;
