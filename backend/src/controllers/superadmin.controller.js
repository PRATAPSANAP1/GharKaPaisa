const admin = require('../config/firebase');
const { query } = require('../config/db');
const { logAction } = require('../services/audit.service');
const { getPaginationParams, sanitizeMobile } = require('../utils/helpers');
const { success, created, error, paginate } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * POST /api/v1/superadmin/create-admin
 * Provision a new admin or employee in Firebase Auth and PostgreSQL.
 */
const createAdmin = async (req, res, next) => {
  try {
    const { email, mobile, role, name } = req.body;

    if (!email || !role) {
      return error(res, 'Email and role are required', 400);
    }

    const validRoles = ['admin', 'employee'];
    if (!validRoles.includes(role)) {
      return error(res, 'Invalid role. Must be either admin or employee', 400);
    }

    const formattedMobile = mobile ? sanitizeMobile(mobile) : null;
    let firebaseUser;
    let firebaseUid;

    try {
      // 1. Attempt to create the user in Firebase Auth
      firebaseUser = await admin.auth().createUser({
        email,
        emailVerified: true,
        phoneNumber: formattedMobile || undefined,
        displayName: name || undefined,
      });
      firebaseUid = firebaseUser.uid;
      logger.info(`Successfully created Firebase user for administrative role: ${email} (UID: ${firebaseUid})`);
    } catch (fbErr) {
      // 2. If user already exists in Firebase, retrieve their details
      if (fbErr.code === 'auth/email-already-exists') {
        logger.info(`User ${email} already exists in Firebase. Retrieving existing UID.`);
        firebaseUser = await admin.auth().getUserByEmail(email);
        firebaseUid = firebaseUser.uid;
      } else {
        logger.error('Firebase user creation failed:', fbErr.message);
        return error(res, `Firebase registration failed: ${fbErr.message}`, 400);
      }
    }

    // 3. Insert or update user in PostgreSQL
    let { rows: [dbUser] } = await query(
      `SELECT * FROM users WHERE firebase_uid = $1 OR email = $2`,
      [firebaseUid, email]
    );

    if (dbUser) {
      // Update role and status to active
      const result = await query(
        `UPDATE users 
         SET role = $1, firebase_uid = $2, status = 'active', updated_at = NOW() 
         WHERE id = $3 
         RETURNING *`,
        [role, firebaseUid, dbUser.id]
      );
      dbUser = result.rows[0];
      logger.info(`Updated existing PostgreSQL user role to ${role}: ${email}`);
    } else {
      // Insert new administrative user
      const result = await query(
        `INSERT INTO users (firebase_uid, email, mobile, role, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING *`,
        [firebaseUid, email, formattedMobile, role]
      );
      dbUser = result.rows[0];
      logger.info(`Created new PostgreSQL user with role ${role}: ${email}`);
    }

    // 4. Record the action in audit logs
    await logAction(req.user.id, 'CREATE_ADMIN', dbUser.id, { email, role, firebaseUid });

    return created(res, {
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      status: dbUser.status,
      firebaseUid
    }, `Administrative user (${role}) provisioned successfully.`);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/superadmin/block-user
 * Suspend/unsuspend a user in the database and revoke Firebase session tokens if blocked.
 */
const blockUser = async (req, res, next) => {
  try {
    const { userId, block } = req.body;

    if (userId === undefined || block === undefined) {
      return error(res, 'userId and block parameters are required', 400);
    }

    // Prevent blocking oneself
    if (userId === req.user.id || userId === req.user.firebase_uid) {
      return error(res, 'You are not permitted to block yourself.', 400);
    }

    // 1. Check if user exists in database
    const { rows: [targetUser] } = await query(
      `SELECT id, firebase_uid, email, role, status FROM users WHERE id::text = $1 OR firebase_uid = $1`,
      [userId]
    );

    if (!targetUser) {
      return error(res, 'User not found', 404);
    }

    const newStatus = block ? 'suspended' : 'active';
    const actionName = block ? 'BLOCK_USER' : 'UNBLOCK_USER';

    // 2. Update status in PostgreSQL
    await query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, targetUser.id]
    );

    // 3. If blocking, revoke Firebase refresh tokens to immediately terminate active sessions
    if (block && targetUser.firebase_uid) {
      try {
        await admin.auth().revokeRefreshTokens(targetUser.firebase_uid);
        logger.info(`Revoked Firebase refresh tokens for user UID: ${targetUser.firebase_uid}`);
      } catch (fbErr) {
        logger.warn(`Failed to revoke Firebase tokens for ${targetUser.email}: ${fbErr.message}`);
      }
    }

    // 4. Log to audit logs
    await logAction(req.user.id, actionName, targetUser.id, { email: targetUser.email, role: targetUser.role });

    return success(res, {}, `User status updated to ${newStatus} successfully.`);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/superadmin/audit-logs
 * Fetch system audit logs with pagination and filters.
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { action, admin_user, start_date, end_date } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (action) {
      whereClause += ` AND al.action = $${idx++}`;
      values.push(action);
    }

    if (admin_user) {
      whereClause += ` AND (u.email ILIKE $${idx} OR u.id::text = $${idx} OR u.firebase_uid = $${idx})`;
      values.push(admin_user.includes('@') ? `%${admin_user}%` : admin_user);
      idx++;
    }

    if (start_date) {
      whereClause += ` AND al.created_at >= $${idx++}`;
      values.push(new Date(start_date));
    }

    if (end_date) {
      whereClause += ` AND al.created_at <= $${idx++}`;
      values.push(new Date(end_date));
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ${whereClause}
    `;

    const dataQuery = `
      SELECT al.id, al.action, al.target_id, al.details, al.created_at,
             u.id as admin_id, u.email as admin_email, u.role as admin_role
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const [countResult, dataResult] = await Promise.all([
      query(countQuery, values),
      query(dataQuery, [...values, limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count);
    return paginate(res, dataResult.rows, total, page, limit);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAdmin,
  blockUser,
  getAuditLogs,
};
