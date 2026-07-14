const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');

// Protect payment routes with JWT auth
router.use(jwtAuth);

// Payment routes
router.post('/create-order', paymentController.createOrder);
router.post('/verify-payment', paymentController.verifyPayment);

module.exports = router;
