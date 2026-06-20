const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/card_application.controller');
const jwtAuth = require('../middleware/jwtAuth.middleware');
const roleCheck = require('../middleware/role.middleware');

// Public route to submit details after OTP verification
router.post('/', ctrl.submitApplication);

// Super Admin route to list card applications
router.get('/', jwtAuth, roleCheck('SUPER_ADMIN'), ctrl.listApplications);

module.exports = router;
