const express = require('express');
const router = express.Router();
const ctrl = require('./cms.controller.js');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');

// Public route to list layout sections
router.get('/', ctrl.listActiveSections);

// Protected routes (Admin / Super Admin only)
router.get('/all', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.listAllSections);
router.post('/', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.createSection);
router.put('/:key', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.updateSection);
router.delete('/:key', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.deleteSection);

module.exports = router;
