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

// ── Core: verify token + auto-provision user ───────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    // 1. Verify Firebase ID Token
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch (firebaseErr) {
      logger.warn('Firebase token verification failed:', firebaseErr.code);
      if (firebaseErr.code === 'auth/id-token-expired') {
        return unauthorized(res, 'Token expired. Please sign in again.');
      }
      return unauthorized(res, 'Invalid or expired token');
    }

    const firebaseUid   = decoded.uid;
    const email         = decoded.email        || null;
    const phone         = decoded.phone_number || null;

    // 2. Find user by firebase_uid, email, or mobile
    let { rows: [user] } = await query(
      `SELECT * FROM users WHERE firebase_uid = $1 OR email = $2 OR mobile = $3`,
      [firebaseUid, email, phone]
    );

    // 3. Auto-provision: create user row on very first login
    if (!user) {
      logger.info(`Auto-provisioning new user for Firebase UID: ${firebaseUid}`);
      const { rows: [newUser] } = await query(
        `INSERT INTO users (firebase_uid, email, mobile, role, status)
         VALUES ($1, $2, $3, 'Partner', 'pending')
         RETURNING *`,
        [firebaseUid, email, phone]
      );
      user = newUser;
    } else if (!user.firebase_uid) {
      // Existing user found by email/mobile — link firebase_uid
      await query(
        `UPDATE users SET firebase_uid = $1 WHERE id = $2`,
        [firebaseUid, user.id]
      );
      user.firebase_uid = firebaseUid;
    }

    // 4. Status checks
    if (user.status === 'suspended') return forbidden(res, 'Account suspended. Contact support.');
    if (user.status === 'rejected')  return forbidden(res, 'Account rejected. Contact support.');

    req.user        = user;
    req.firebaseUser = decoded;

    // 5. Attach partner profile for Partner role
    if (user.role === 'Partner') {
      const { rows: [partner] } = await query(
        `SELECT id, kyc_status, first_name, last_name, Partner_code
         FROM Partner_profiles WHERE user_id = $1`,
        [user.id]
      );
      req.partner = partner || null;
    }

    next();
  } catch (err) {
    logger.error('Auth middleware error:', err.message);
    return unauthorized(res, 'Authentication failed');
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

module.exports = { authenticate, authorize, requireApprovedPartner, selfOrAdmin };
