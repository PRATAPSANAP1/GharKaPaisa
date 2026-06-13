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
  max: 10, // Max 10 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests to authentication endpoints. Try again after an hour.' }
});

module.exports = {
  globalLimiter,
  authLimiter
};
