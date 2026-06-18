const bcrypt = require('bcrypt');
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
    const { 
      fullName, email, mobile, employeeId, 
      password, confirmPassword, department, designation 
    } = req.body;

    if (!fullName || !email || !mobile || !employeeId || !password || !confirmPassword || !department || !designation) {
      return error(res, 'All required fields must be provided', 400);
    }

    if (password !== confirmPassword) {
      return error(res, 'Passwords do not match', 400);
    }

    const validDepartments = ['Operations', 'Sales', 'Credit', 'Collection', 'Support', 'Accounts', 'Marketing'];
    if (!validDepartments.includes(department)) {
      return error(res, `Invalid department. Must be one of: ${validDepartments.join(', ')}`, 400);
    }

    const formattedMobile = sanitizeMobile(mobile);

    // Check if email already exists
    const { rows: [existingEmail] } = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existingEmail) {
      return error(res, 'A user with this email address already exists', 400);
    }

    // Check if mobile already exists
    const { rows: [existingMobile] } = await query(`SELECT id FROM users WHERE mobile = $1`, [formattedMobile]);
    if (existingMobile) {
      return error(res, 'A user with this mobile number already exists', 400);
    }

    // Check if employeeId already exists
    const { rows: [existingEmployee] } = await query(`SELECT id FROM users WHERE employee_id = $1`, [employeeId]);
    if (existingEmployee) {
      return error(res, 'An administrative user with this Employee ID already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new Administrative User (ADMIN role)
    const { rows: [dbUser] } = await query(
      `INSERT INTO users (
        email, mobile, password_hash, role, status, 
        full_name, employee_id, department, designation, created_by, is_active
      )
      VALUES ($1, $2, $3, 'admin', 'active', $4, $5, $6, $7, $8, true)
      RETURNING id, email, role, status`,
      [email, formattedMobile, hashedPassword, fullName, employeeId, department, designation, req.user.id]
    );

    logger.info(`Super admin ${req.user.email} created new Admin user: ${email}`);

    // Record the action in audit logs
    await logAction(req, 'CREATE_ADMIN', dbUser.id, { email, role: 'admin' });

    return created(res, {
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      status: dbUser.status
    }, `Administrative user provisioned successfully.`);
  } catch (err) {
    next(err);
  }
};

const listAdmins = async (req, res, next) => {
  try {
    const { rows: admins } = await query(`
      SELECT 
        id as _id, 
        email, 
        mobile, 
        role, 
        status, 
        full_name as "fullName", 
        employee_id as "employeeId", 
        department, 
        designation, 
        is_active as "isActive", 
        created_by as "createdBy", 
        created_at as "createdAt"
      FROM users 
      WHERE role = 'admin'
      ORDER BY created_at DESC
    `);
    return success(res, admins);
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
    if (userId === req.user.id) {
      return error(res, 'You are not permitted to block yourself.', 400);
    }

    // 1. Check if user exists in database
    const { rows: [targetUser] } = await query(
      `SELECT id, email, role, status FROM users WHERE id::text = $1`,
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

    // 3. Removed Firebase token revocation

    // 4. Log to audit logs
    await logAction(req, actionName, targetUser.id, { email: targetUser.email, role: targetUser.role });

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
  listAdmins,
  blockUser,
  getAuditLogs,
};
