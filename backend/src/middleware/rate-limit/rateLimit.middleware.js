const rateLimit = require('express-rate-limit');

// Key by identity (email/mobile) when present, fallback to IP.
// Prevents shared-IP environments (offices, colleges) from blocking each other.
const userOrIpKey = (req) =>
  req.body?.email || req.body?.mobile || req.body?.identity || req.ip;

// Global API rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' }
});

// Login — 20 attempts per 15 min, failed attempts only
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});

// Send OTP — 10 per 10 min per user
const sendOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  message: { success: false, message: 'Too many OTP requests. Please wait 10 minutes and try again.' }
});

// Verify OTP — 30 per 10 min, failed only
const verifyOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  message: { success: false, message: 'Too many OTP verification attempts. Please wait 10 minutes.' }
});

// Register — 5 per 30 min per IP (no identity yet at registration time)
const registerLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many registration attempts. Please wait 30 minutes.' }
});

// Forgot/reset password — 5 per 30 min
const forgotPasswordLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  message: { success: false, message: 'Too many password reset requests. Please wait 30 minutes.' }
});

// Refresh token — 100 attempts per 15 min (independent of loginLimiter)
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many refresh attempts. Please try again later.' }
});

// Legacy alias — kept so any existing imports don't break
const authLimiter = loginLimiter;
const emailActionLimiter = sendOtpLimiter;

module.exports = {
  globalLimiter,
  loginLimiter,
  refreshLimiter,
  sendOtpLimiter,
  verifyOtpLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  // legacy aliases
  authLimiter,
  emailActionLimiter
};
