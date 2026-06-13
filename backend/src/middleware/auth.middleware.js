/**
 * auth.middleware.js
 * ──────────────────────────────────────────────────────────────────────────
 * Primary auth middleware. Verifies Firebase ID Token, auto-provisions
 * the user in PostgreSQL on first login, and attaches req.user.
 *
 * Also exports: authorize, requireApprovedPartner, selfOrAdmin helpers.
 */
const admin = require('../config/firebase');
const { query } = require('../config/db');
const { unauthorized, forbidden } = require('../utils/response');
const logger = require('../utils/logger');

// ── Core: verify token ───────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return unauthorized(res, 'No token provided');
    }

    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      phone: decodedToken.phone_number
    };

    next();
  } catch (err) {
    return unauthorized(res, 'Invalid Firebase token');
  }
};

// ── Sync User: map Firebase user to PostgreSQL DB user ────────────────────
const syncUser = async (req, res, next) => {
  try {
    const { uid, email, phone } = req.user;

    let { rows: [user] } = await query(
      `SELECT * FROM users WHERE firebase_uid = $1 OR email = $2 OR mobile = $3`,
      [uid, email, phone]
    );

    if (!user) {
      logger.info(`Auto-provisioning new user for Firebase UID: ${uid}`);
      const result = await query(
        `INSERT INTO users (firebase_uid, email, mobile, role, status)
         VALUES ($1, $2, $3, 'Partner', 'active')
         RETURNING *`,
        [uid, email, phone]
      );
      user = result.rows[0];
    } else if (!user.firebase_uid) {
      await query(
        `UPDATE users SET firebase_uid = $1 WHERE id = $2`,
        [uid, user.id]
      );
      user.firebase_uid = uid;
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

// ── Partner must be KYC approved ───────────────────────────────────────────
const requireApprovedPartner = (req, res, next) => {
  if (!req.partner) return forbidden(res, 'Partner profile not found. Please complete registration.');
  if (req.partner.kyc_status !== 'approved') {
    return forbidden(res, 'KYC not yet approved. Please wait for verification.');
  }
  req.Partner = req.partner;
  next();
};

// ── Self or admin guard ────────────────────────────────────────────────────
const selfOrAdmin = (paramField = 'PartnerId') => {
  return (req, res, next) => {
    if (['super_admin', 'admin'].includes(req.user.role)) return next();
    const partner = req.partner;
    if (!partner || partner.id.toString() !== req.params[paramField].toString()) {
      return forbidden(res, 'Access denied');
    }
    req.Partner = partner;
    next();
  };
};

module.exports = { authenticate, syncUser, authorize, requireApprovedPartner, selfOrAdmin };
