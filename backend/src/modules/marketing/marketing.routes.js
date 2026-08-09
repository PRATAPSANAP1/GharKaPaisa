const express = require('express');
const router = express.Router();
const ctrl = require('./marketing.controller.js');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');

const { upload: uploadGeneric } = require('../../services/aws/s3.service.js');

// List materials (accessible to Partner, Team Member, Admin, Super Admin)
router.get('/', jwtAuth, roleCheck('PARTNER', 'TEAM_MEMBER', 'ADMIN', 'SUPER_ADMIN'), ctrl.listMarketingMaterials);

// Create material (Admin only)
router.post('/', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), uploadGeneric.fields([
  { name: 'file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), ctrl.createMarketingMaterial);

module.exports = router;
