/**
 * auth.middleware.js
 * ──────────────────────────────────────────────────────────────────────────
 * Primary auth middleware. Verifies JWT token, auto-provisions
 * the user in PostgreSQL on first login (if needed), and attaches req.user.
 */
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { unauthorized, forbidden } = require('../utils/response');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'gharkapaisa-secret-key-fallback';

// ── Core: verify token ───────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return unauthorized(res, 'No token provided');
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decodedToken.id,
      email: decodedToken.email,
      phone: decodedToken.phone,
      role: decodedToken.role
    };

    next();
  } catch (err) {
    return unauthorized(res, 'Invalid or expired token');
  }
};

// ── Sync User: map JWT user to PostgreSQL DB user ────────────────────
const syncUser = async (req, res, next) => {
  try {
    const { id } = req.user;

    let { rows: [user] } = await query(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );

    if (!user) {
      return unauthorized(res, 'User no longer exists');
    }

    if (user.status === 'suspended') return forbidden(res, 'Account suspended. Contact support.');
    if (user.status === 'rejected')  return forbidden(res, 'Account rejected. Contact support.');

    req.dbUser = user;
    req.user = user;

    // Attach partner profile for Partner role
    if (user.role === 'Partner') {
      const { rows: [partner] } = await query(
        `SELECT id, kyc_status, first_name, last_name, Partner_code
         FROM Partner_profiles WHERE user_id = $1`,
        [user.id]
      );
      req.partner = partner || null;
      if (partner) {
        req.dbUser.PartnerId = partner.id;
        req.dbUser.partner_id = partner.id;
        req.user.PartnerId = partner.id;
        req.user.partner_id = partner.id;
      }
    }

    next();
  } catch (err) {
    logger.error('syncUser middleware error:', err.message);
    return unauthorized(res, 'Failed to synchronize user profile');
  }
};

// ── Role-based access control ──────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res);
    if (!roles.includes(req.user.role)) {
      return forbidden(res, `Role '${req.user.role}' is not allowed to access this resource`);
    }
    next();
  };
};

const requireApprovedPartner = (req, res, next) => {
  if (req.user.role !== 'Partner') return forbidden(res, 'Partners only');
  if (!req.partner) return forbidden(res, 'No partner profile found');
  if (req.partner.kyc_status !== 'approved') return forbidden(res, 'KYC not approved');
  next();
};

const selfOrAdmin = (paramName = 'id') => (req, res, next) => {
  const targetId = req.params[paramName];
  if (req.user.role === 'admin' || req.user.role === 'superadmin' || req.user.role === 'super_admin') return next();
  if (req.user.id.toString() === targetId) return next();
  return forbidden(res);
};

module.exports = {
  authenticate,
  syncUser,
  authorize,
  requireApprovedPartner,
  selfOrAdmin
};
