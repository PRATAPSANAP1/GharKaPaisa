/**
 * auth.middleware.js
 * ──────────────────────────────────────────────────────────────────────────
 * Primary auth middleware. Verifies JWT token, auto-provisions
 * the user in PostgreSQL on first login (if needed), and attaches req.user.
 */
const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');
const { unauthorized, forbidden } = require('../../utils/response/response');
const logger = require('../../config/logger');

const { JWT_SECRET } = require('../../config/jwt.js');

// ── Core: verify token ───────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;

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
    if (user.status === 'blocked') return forbidden(res, 'Account blocked. Contact support.');

    req.dbUser = { ...user };
    
    // Strip sensitive fields from req.user
    const { password_hash, verification_token, ...safeUser } = user;
    req.user = safeUser;

    // Attach partner profile for Partner role
    if ((user.role || '').toUpperCase() === 'PARTNER') {
      const { rows: [partner] } = await query(
        `SELECT id, kyc_status, first_name, last_name, partner_code
         FROM partner_profiles WHERE user_id = $1`,
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
  const upperRoles = roles.map(r => r.toUpperCase());
  return (req, res, next) => {
    if (!req.user) return unauthorized(res);
    const userRole = (req.user.role || '').toUpperCase();
    if (!upperRoles.includes(userRole)) {
      return forbidden(res, `Role '${req.user.role}' is not allowed to access this resource`);
    }
    next();
  };
};

const requirePartner = (req, res, next) => {
  if ((req.user.role || '').toUpperCase() !== 'PARTNER') return forbidden(res, 'Partners only');
  if (!req.partner) return forbidden(res, 'No partner profile found');
  next();
};

const requireApprovedPartner = (req, res, next) => {
  if ((req.user.role || '').toUpperCase() !== 'PARTNER') return forbidden(res, 'Partners only');
  if (!req.partner) return forbidden(res, 'No partner profile found');
  if (req.partner.kyc_status !== 'approved') {
    req.kycUnapproved = true;
  }
  next();
};

const requireApprovedPartnerOrAdmin = (req, res, next) => {
  const role = (req.user.role || '').toUpperCase();
  if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'EMPLOYEE') return next();
  return requireApprovedPartner(req, res, next);
};

const selfOrAdmin = (paramName = 'id') => (req, res, next) => {
  const targetId = req.params[paramName];
  const userRole = (req.user.role || '').toUpperCase();
  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return next();
  if (req.user.id.toString() === targetId) return next();
  if (req.user.PartnerId && req.user.PartnerId.toString() === targetId) return next();
  if (req.user.partner_id && req.user.partner_id.toString() === targetId) return next();
  return forbidden(res);
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();

    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decodedToken.id,
      email: decodedToken.email,
      phone: decodedToken.phone,
      role: decodedToken.role
    };

    const { rows: [user] } = await query(`SELECT * FROM users WHERE id = $1`, [decodedToken.id]);
    if (user) {
      const { password_hash, verification_token, ...safeUser } = user;
      req.user = safeUser;
      if ((user.role || '').toUpperCase() === 'PARTNER') {
        const { rows: [partner] } = await query(
          `SELECT id, kyc_status, first_name, last_name, partner_code
           FROM partner_profiles WHERE user_id = $1`,
          [user.id]
        );
        req.partner = partner || null;
        if (partner) {
          req.user.PartnerId = partner.id;
          req.user.partner_id = partner.id;
        }
      }
    }
  } catch (err) {
    // Ignore and proceed
  }
  next();
};

module.exports = {
  authenticate,
  syncUser,
  authorize,
  requirePartner,
  requireApprovedPartner,
  requireApprovedPartnerOrAdmin,
  selfOrAdmin,
  optionalAuth
};
