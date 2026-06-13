const { verifyAccessToken } = require('../utils/jwt');
const { query } = require('../config/db');
const { unauthorized, forbidden } = require('../utils/response');
const logger = require('../utils/logger');

// Verify JWT and attach user to req
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Check user still exists and is active
    const { rows: [user] } = await query(
      `SELECT id, email, mobile, role, status FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (!user) return unauthorized(res, 'User not found');
    if (user.status !== 'active') return forbidden(res, `Account ${user.status}`);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return unauthorized(res, 'Token expired');
    if (err.name === 'JsonWebTokenError') return unauthorized(res, 'Invalid token');
    logger.error('Auth middleware error', err.message);
    return unauthorized(res);
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
const requireApprovedPartner = async (req, res, next) => {
  try {
    const { rows: [Partner] } = await query(
      `SELECT id, kyc_status FROM Partner_profiles WHERE user_id = $1`,
      [req.user.id]
    );
    if (!Partner) return forbidden(res, 'Partner profile not found');
    if (Partner.kyc_status !== 'approved') return forbidden(res, 'KYC not yet approved. Please wait for verification.');
    req.Partner = Partner;
    next();
  } catch (err) {
    logger.error('requireApprovedPartner error', err);
    next(err);
  }
};

// Self or admin — partner can only access own resources
const selfOrAdmin = (paramField = 'PartnerId') => {
  return async (req, res, next) => {
    if (['super_admin', 'admin'].includes(req.user.role)) return next();
    const { rows: [Partner] } = await query(
      `SELECT id FROM Partner_profiles WHERE user_id = $1`, [req.user.id]
    );
    if (!Partner || Partner.id !== req.params[paramField]) {
      return forbidden(res, 'Access denied');
    }
    req.Partner = Partner;
    next();
  };
};

module.exports = { authenticate, authorize, requireApprovedPartner, selfOrAdmin };
