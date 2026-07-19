const express = require('express');
const router = express.Router();
const ctrl = require('./card_application.controller.js');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');

// Public & Admin route to submit details after OTP verification or manual lead entry
router.post('/', ctrl.submitApplication);

// Admin & Super Admin route to list direct applications
router.get('/', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.listApplications);

// Admin & Super Admin route to update direct lead status
router.put('/:id/status', jwtAuth, roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.updateApplicationStatus);

module.exports = router;
