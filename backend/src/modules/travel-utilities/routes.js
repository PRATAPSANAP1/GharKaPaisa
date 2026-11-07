const express = require('express');
const router = express.Router();
const ctrl = require('./controller.js');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');

// All travel & utilities endpoints require an authenticated partner/employee.
router.use(jwtAuth);

// Service catalog with margin rates
router.get('/services', ctrl.listServices);

// Partner's utility / travel transaction history
router.get('/transactions', ctrl.listTransactions);

// Record a new utility / travel transaction (margin is derived server-side)
router.post('/transactions', ctrl.createTransaction);

module.exports = router;
