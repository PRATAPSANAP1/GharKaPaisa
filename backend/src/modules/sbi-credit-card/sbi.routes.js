const express = require('express');
const router = express.Router();
const ctrl = require('./sbi.controller');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');
const roleCheck = require('../../middleware/authorization/role.middleware');

// Apply auth to all routes in this module
router.use(jwtAuth);
router.use(roleCheck('ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'));

// Routing definitions
router.post('/', ctrl.createApplication);
router.put('/:id', ctrl.updateApplication);
router.get('/', ctrl.listApplications);
router.get('/executives', ctrl.getExecutives);
router.get('/reports', ctrl.getReports);
router.get('/:id', ctrl.getApplication);
router.get('/:id/timeline', ctrl.getTimeline);
router.post('/:id/timeline', ctrl.addTimelineEvent);

module.exports = router;
