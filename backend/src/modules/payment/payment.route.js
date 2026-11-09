const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');

// Public webhook route (verified via Cashfree HMAC signature header)
router.post('/cashfree/webhook', paymentController.cashfreeWebhook);

// Protected routes (require JWT authentication)
router.post('/create-order', jwtAuth, paymentController.createOrder);
router.post('/verify-payment', jwtAuth, paymentController.verifyPayment);

// Cashfree Payment Gateway routes
router.post('/cashfree/create-order', jwtAuth, paymentController.createCashfreeOrder);
router.post('/cashfree/verify-payment', jwtAuth, paymentController.verifyCashfreePayment);

module.exports = router;
