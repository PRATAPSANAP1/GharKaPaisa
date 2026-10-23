const rateLimit = require('express-rate-limit');

// Resolve true client IP behind reverse proxies (Cloudflare, AWS ALB, Nginx)
const getClientIp = (req) => {
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
    req.ip ||
    '127.0.0.1'
  );
};

// Key by user identifier (JWT user ID, email, phone, mobile, username) when present, fallback to client IP.
// Prevents shared-IP environments (offices, colleges, mobile carriers NAT) from blocking each other.
const userOrIpKey = (req) => {
  // 1. Direct user object from auth middleware if present
  let identifier = req.user?.id || req.user?.userId;

  // 2. Decode Authorization Bearer JWT token payload if present (before route auth middleware runs)
  if (!identifier) {
    try {
      const authHeader = req.headers?.authorization || req.headers?.Authorization;
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          identifier = payload?.id || payload?.userId || payload?.sub || null;
        }
      }
    } catch (_) {}
  }

  // 3. Fallback to body identifiers for login/register/otp POST requests
  if (!identifier) {
    identifier =
      req.body?.email ||
      req.body?.phone ||
      req.body?.username ||
      req.body?.mobile ||
      req.body?.identity;
  }

  if (identifier) {
    // Return user-specific key so users on the same office/NAT IP do NOT share rate-limit counters
    return `user_${String(identifier).toLowerCase().trim()}`;
  }

  // Fallback to resolved real client IP for unauthenticated public traffic
  return `ip_${getClientIp(req)}`;
};

// Helper function to skip preflight OPTIONS requests from rate limiting
const skipOptions = (req) => req.method === 'OPTIONS';

// Global API rate limiter - excludes Auth routes and background polling calls
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // 10,000 requests per 15 min per user/IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (skipOptions(req)) return true;
    const url = req.originalUrl || req.url || req.path || '';
    // Skip auth routes (login/refresh have their own dedicated limiters)
    if (url.includes('/api/v1/auth') || url.includes('/auth')) return true;
    // Skip health checks
    if (url === '/health' || url.endsWith('/health')) return true;
    // Skip background polling and real-time counter endpoints so they don't consume user quota
    if (
      url.includes('/notifications/unread') ||
      url.includes('/notifications/announcements') ||
      url.includes('/messenger/unread-count') ||
      url.includes('/socket.io')
    ) {
      return true;
    }
    return false;
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

// Refresh token — 2000 attempts per 15 min (independent of loginLimiter)
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
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

// Customer Tracking Limiter - 60 per 15 min per IP/Mobile
const customerTrackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  skip: skipOptions,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  validate: { trustProxy: false },
  message: { success: false, message: 'Too many tracking requests. Please wait a few minutes and try again.' }
});

// Document Upload Limiter - 60 per 15 min per IP/User
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  skip: skipOptions,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  validate: { trustProxy: false },
  message: { success: false, message: 'Too many document uploads. Please wait a few minutes before trying again.' }
});

// Messenger Rate Limiter — 120 requests per minute per user/IP
const messengerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
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
