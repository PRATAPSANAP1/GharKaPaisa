const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  validate, registerRules, loginRules, otpSendRules, otpVerifyRules
} = require('../middleware/validation.middleware');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again after 15 minutes.' }
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many OTP requests. Try again after 5 minutes.' },
  keyGenerator: (req) => (req.body.mobile || '') + req.ip
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many registration attempts. Try again after an hour.' }
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { success: false, message: 'Too many token refresh requests. Try again after 15 minutes.' }
});

router.post('/register',        registerLimiter, registerRules,   validate, ctrl.register);
router.post('/login',           loginLimiter, loginRules,  validate, ctrl.login);
router.post('/otp/send',        otpLimiter,   otpSendRules,   validate, ctrl.sendOTPHandler);
router.post('/otp/verify',      loginLimiter, otpVerifyRules, validate, ctrl.verifyOTPLogin);
router.post('/refresh',         refreshLimiter, ctrl.refreshToken);
router.post('/logout',          authenticate, ctrl.logout);
router.get('/me',               authenticate, ctrl.getMe);

module.exports = router;
