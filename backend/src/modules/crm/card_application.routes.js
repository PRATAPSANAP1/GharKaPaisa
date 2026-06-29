const express = require('express');
const router = express.Router();
const ctrl = require('./card_application.controller.js');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');

// Public route to submit details after OTP verification
router.post('/', ctrl.submitApplication);

// Super Admin route to list card applications
router.get('/', jwtAuth, roleCheck('SUPER_ADMIN'), ctrl.listApplications);

module.exports = router;
