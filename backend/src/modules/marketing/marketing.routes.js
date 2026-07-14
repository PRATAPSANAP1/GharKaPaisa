const express = require('express');
const router = express.Router();
const ctrl = require('./marketing.controller.js');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');

// List materials (accessible to Partner, Admin, Super Admin)
router.get('/', jwtAuth, ctrl.listMarketingMaterials);

// Create material (Admin only)
router.post('/', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.createMarketingMaterial);

module.exports = router;
