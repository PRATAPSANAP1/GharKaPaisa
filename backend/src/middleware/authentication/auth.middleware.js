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
    // Attach partner profile for Partner and Team Member roles
    if (['PARTNER', 'TEAM_MEMBER'].includes((user.role || '').toUpperCase())) {
      let { rows: [partner] } = await query(
        `SELECT id, kyc_status, first_name, last_name, partner_code
         FROM partner_profiles WHERE user_id = $1`,
        [user.id]
      );
      if (!partner) {
        const partnerCode = 'AG' + String(Math.floor(10000 + Math.random() * 90000));
        const { rows: [newP] } = await query(
          `INSERT INTO partner_profiles (user_id, partner_code, first_name, last_name, status, kyc_status, partner_type)
           VALUES ($1, $2, $3, $4, 'active', 'draft', $5)
           ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
           RETURNING id, kyc_status, first_name, last_name, partner_code`,
          [user.id, partnerCode, user.first_name || 'Partner', user.last_name || '', (user.role || '').toUpperCase()]
        );
        partner = newP;
      }
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

const requirePartner = async (req, res, next) => {
  try {
    const role = (req.user?.role || '').toUpperCase();
    if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'EMPLOYEE') return next();
    if (!req.partner && req.user) {
      const { rows: [p] } = await query(`SELECT id, kyc_status FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) {
        req.partner = p;
      } else {
        req.partner = { id: req.user.id, kyc_status: 'approved' };
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

const requireApprovedPartner = async (req, res, next) => {
  try {
    const role = (req.user?.role || '').toUpperCase();
    if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'EMPLOYEE') return next();
    if (!req.partner && req.user) {
      const { rows: [p] } = await query(`SELECT id, kyc_status FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) {
        req.partner = p;
      } else {
        req.partner = { id: req.user.id, kyc_status: 'draft' };
      }
    }
    if (req.partner && req.partner.kyc_status !== 'approved') {
      req.kycUnapproved = true;
    }
    next();
  } catch (err) {
    next(err);
  }
};

const requireApprovedPartnerOrAdmin = (req, res, next) => {
  const role = (req.user.role || '').toUpperCase();
  if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'EMPLOYEE') return next();
  return requireApprovedPartner(req, res, next);
};

const selfOrAdmin = (paramName = 'id') => async (req, res, next) => {
  try {
    const rawTargetId = req.params[paramName];
    if (!rawTargetId || rawTargetId.toLowerCase() === 'me') return next();

    const userRole = (req.user?.role || '').toUpperCase();
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return next();

    const targetId = String(rawTargetId).toLowerCase();
    const userId = String(req.user?.id || '').toLowerCase();
    const userPartnerId = String(req.user?.PartnerId || req.user?.partner_id || '').toLowerCase();

    // Direct match with user ID or partner ID on req.user
    if (userId && userId === targetId) return next();
    if (userPartnerId && userPartnerId === targetId) return next();

    // Fetch partner profile for current user
    const { rows: [currentUserProfile] } = await query(
      `SELECT id, user_id, parent_partner_id FROM partner_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`,
      [req.user?.id]
    );

    if (currentUserProfile) {
      const pId = String(currentUserProfile.id).toLowerCase();
      const pUserId = String(currentUserProfile.user_id).toLowerCase();
      const pParentId = currentUserProfile.parent_partner_id ? String(currentUserProfile.parent_partner_id).toLowerCase() : null;

      if (pId === targetId || pUserId === targetId) return next();
      if (pParentId && pParentId === targetId) return next();
    }

    // Fetch partner profile for target ID (target could be user_id or partner_profiles.id)
    const { rows: [targetProfile] } = await query(
      `SELECT id, user_id, parent_partner_id FROM partner_profiles WHERE id = $1 OR user_id = $1 LIMIT 1`,
      [rawTargetId]
    );

    if (targetProfile) {
      const tId = String(targetProfile.id).toLowerCase();
      const tUserId = String(targetProfile.user_id).toLowerCase();
      const tParentId = targetProfile.parent_partner_id ? String(targetProfile.parent_partner_id).toLowerCase() : null;

      if (userId && (userId === tUserId || userId === tId)) return next();
      if (userPartnerId && (userPartnerId === tId || userPartnerId === tUserId)) return next();

      if (currentUserProfile) {
        const cId = String(currentUserProfile.id).toLowerCase();
        if (cId === tId || cId === tUserId) return next();
        if (cId === tParentId || (cId && String(currentUserProfile.parent_partner_id).toLowerCase() === tId)) return next();
      }

      // Check team relationships in both directions
      const cPartnerId = currentUserProfile?.id || req.user?.PartnerId || req.user?.partner_id;
      if (cPartnerId && targetProfile.id) {
        const { rows } = await query(`
          SELECT 1 FROM partner_team_relationships
          WHERE (parent_partner_id = $1 AND child_partner_id = $2)
             OR (parent_partner_id = $2 AND child_partner_id = $1)
          LIMIT 1
        `, [cPartnerId, targetProfile.id]);
        if (rows.length > 0) return next();
      }
    }

    return forbidden(res);
  } catch (err) {
    next(err);
  }
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
      if (['PARTNER', 'TEAM_MEMBER'].includes((user.role || '').toUpperCase())) {
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
    // Ignore auth errors — proceed unauthenticated
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
