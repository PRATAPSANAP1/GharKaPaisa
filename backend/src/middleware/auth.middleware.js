const admin = require('../config/firebase');
const { query } = require('../config/db');
const { unauthorized, forbidden } = require('../utils/response');
const logger = require('../utils/logger');

// Verify Firebase ID Token and attach user to req
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify Firebase ID Token
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

    const firebaseUid = decoded.uid;

    // Look up user in PostgreSQL by firebase_uid
    const { rows: [user] } = await query(
      `SELECT id, email, mobile, role, status, firebase_uid FROM users WHERE firebase_uid = $1`,
      [firebaseUid]
    );

    if (!user) {
      return unauthorized(res, 'User not registered. Please complete registration first.');
    }

    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        code: 'PENDING_KYC',
        message: 'Account pending KYC approval'
      });
    }
    if (user.status === 'suspended') return unauthorized(res, 'Account suspended. Contact support.');
    if (user.status === 'rejected') return unauthorized(res, 'Account rejected. Contact support.');

    req.user = user;
    req.firebaseUser = decoded;

    // Fetch and cache partner profile for Partner role
    if (user.role === 'Partner') {
      const { rows: [partner] } = await query(
        `SELECT id, kyc_status FROM Partner_profiles WHERE user_id = $1`, [user.id]
      );
      req.partner = partner;
    }

    next();
  } catch (err) {
    logger.error('Auth middleware error', err.message);
    return unauthorized(res, 'Authentication failed');
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res);
    if (!roles.includes(req.user.role)) {
      return forbidden(res, `Role '${req.user.role}' is not allowed to access this resource`);
    }
    next();
  };
};

// Partner must be KYC approved
const requireApprovedPartner = (req, res, next) => {
  if (!req.partner) return forbidden(res, 'Partner profile not found');
  if (req.partner.kyc_status !== 'approved') return forbidden(res, 'KYC not yet approved. Please wait for verification.');
  req.Partner = req.partner;
  next();
};

// Self or admin — partner can only access own resources
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
