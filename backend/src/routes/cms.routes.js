const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cms.controller');
const jwtAuth = require('../middleware/jwtAuth.middleware');
const roleCheck = require('../middleware/role.middleware');

// Public route to list layout sections
router.get('/', ctrl.listActiveSections);

// Protected routes (Admin / Super Admin only)
router.get('/all', jwtAuth, roleCheck('admin', 'super_admin'), ctrl.listAllSections);
router.post('/', jwtAuth, roleCheck('super_admin'), ctrl.createSection);
router.put('/:key', jwtAuth, roleCheck('admin', 'super_admin'), ctrl.updateSection);
router.delete('/:key', jwtAuth, roleCheck('super_admin'), ctrl.deleteSection);

module.exports = router;
