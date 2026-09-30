const rateLimit = require('express-rate-limit');

// Key by user identifier (email, phone, mobile, username, user ID) when present, fallback to IP.
// Prevents shared-IP environments (offices, colleges, mobile carriers NAT) from blocking each other.
const userOrIpKey = (req) => {
  const identifier =
    req.user?.id ||
    req.body?.email ||
    req.body?.phone ||
    req.body?.username ||
    req.body?.mobile ||
    req.body?.identity;

  if (identifier) {
    return `${String(identifier).toLowerCase().trim()}_${req.ip}`;
  }
  return req.ip;
};

// Helper function to skip preflight OPTIONS requests from rate limiting
const skipOptions = (req) => req.method === 'OPTIONS';

// Global API rate limiter - excludes Auth routes (/api/v1/auth) so background calls don't consume login allowance
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (skipOptions(req)) return true;
    const url = req.originalUrl || req.url || req.path || '';
    return url.includes('/api/v1/auth') || url.includes('/auth');
  },
  keyGenerator: userOrIpKey,
  validate: { trustProxy: false },
  message: { success: false, message: 'Too many requests. Please slow down.' }
});

// Login — 20 attempts per 15 min, failed attempts only
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  skip: skipOptions,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  validate: { trustProxy: false },
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});

// Send OTP — 10 per 10 min per user
const sendOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: false,
  skip: skipOptions,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  validate: { trustProxy: false },
  message: { success: false, message: 'Too many OTP requests. Please wait 10 minutes and try again.' }
});

// Verify OTP — 10 per 2 min, failed only
const verifyOtpLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  skip: skipOptions,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  validate: { trustProxy: false },
  message: { success: false, message: 'Too many OTP verification attempts. Please wait 2 minutes.' }
});

// Register — 5 per 30 min per IP (no identity yet at registration time)
const registerLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  skip: skipOptions,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { success: false, message: 'Too many registration attempts. Please wait 30 minutes.' }
});

// Forgot/reset password — 5 per 30 min
const forgotPasswordLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: false,
  skip: skipOptions,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  validate: { trustProxy: false },
  message: { success: false, message: 'Too many password reset requests. Please wait 30 minutes.' }
});

// Refresh token — 1000 attempts per 15 min (independent of loginLimiter)
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skip: skipOptions,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  validate: { trustProxy: false },
  message: { success: false, message: 'Too many refresh attempts. Please try again later.' }
});

// Chatbot message limiter — 60 messages per 1 minute per user/IP
const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  skip: skipOptions,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  validate: { trustProxy: false },
  message: { success: false, message: 'Rate limit exceeded for chatbot messages. Please wait a moment.' }
});

// Customer Tracking Limiter - 30 per 15 min per IP/Mobile
const customerTrackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skip: skipOptions,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  validate: { trustProxy: false },
  message: { success: false, message: 'Too many tracking requests. Please wait a few minutes and try again.' }
});

// Document Upload Limiter - 20 per 15 min per IP/User
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: skipOptions,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  validate: { trustProxy: false },
  message: { success: false, message: 'Too many document uploads. Please wait a few minutes before trying again.' }
});

// Messenger Rate Limiter — 60 requests per minute per user/IP
const messengerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  skip: skipOptions,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  validate: { trustProxy: false },
  message: { success: false, message: 'Too many messenger requests. Please slow down.' }
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
  chatbotLimiter,
  customerTrackingLimiter,
  uploadLimiter,
  messengerLimiter,
  // legacy aliases
  authLimiter,
  emailActionLimiter
};
