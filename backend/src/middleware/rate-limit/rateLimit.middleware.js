const rateLimit = require('express-rate-limit');

// Global API rate limiter (protecting standard endpoints)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' }
});

// Authentication rate limiter (protecting login / register / OTP endpoints)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Max 50 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests to authentication endpoints. Please try again after an hour.' }
});

// Email-triggering endpoints need a tighter limit because browser-side
// counters can be bypassed and each successful request consumes provider quota.
const emailActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many email requests. Please wait 15 minutes and try again.'
  }
});

module.exports = {
  globalLimiter,
  authLimiter,
  emailActionLimiter
};
