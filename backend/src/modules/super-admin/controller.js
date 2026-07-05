const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { query } = require('../../config/database');
const { logAction } = require('../admin/audit.service.js');
const { getPaginationParams, sanitizeMobile } = require('../../utils/helpers/helpers');
const { success, created, error, paginate } = require('../../utils/response/response');
const logger = require('../../config/logger');

/**
 * POST /api/v1/superadmin/create-admin
 * Provision a new admin or employee in Firebase Auth and PostgreSQL.
 */
const createAdmin = async (req, res, next) => {
  try {
    let { 
      fullName, email, mobile, role,
      password, confirmPassword, department, designation 
    } = req.body;

    role = role || 'ADMIN';

    console.log("CREATE ADMIN REQUEST:", req.body);
    console.log("ROLE:", role);

    if (!fullName || !email || !mobile || !password || !confirmPassword || !department || !designation) {
      console.log("FAILED: Missing required fields");
      return error(res, 'All required fields must be provided', 400);
    }

    const employeeId = 'GKP-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    if (!['ADMIN', 'EMPLOYEE'].includes(role)) {
      return error(res, 'Role must be either ADMIN or EMPLOYEE', 400);
    }

    if (password !== confirmPassword) {
      console.log("FAILED: Password mismatch");
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
    let uniqueEmployeeId = employeeId;
    let isUnique = false;
    while (!isUnique) {
      const { rows: [existingEmployee] } = await query(`SELECT id FROM users WHERE employee_id = $1`, [uniqueEmployeeId]);
      if (existingEmployee) {
        uniqueEmployeeId = 'GKP-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      } else {
        isUnique = true;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new User
    const { rows: [dbUser] } = await query(
      `INSERT INTO users (
        email, mobile, password_hash, role, status, 
        full_name, employee_id, department, designation, created_by, is_active, email_verified
      )
      VALUES ($1, $2, $3, $9, 'active', $4, $5, $6, $7, $8, true, true)
      RETURNING id, email, role, status`,
      [email, formattedMobile, hashedPassword, fullName, uniqueEmployeeId, department, designation, req.user.id, role]
    );

    logger.info(`Super admin ${req.user.email} created new user: ${email} with role: ${role}`);

    // Record the action in audit logs
    await logAction(req, 'CREATE_USER', dbUser.id, { email, role: dbUser.role });

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
      WHERE role IN ('ADMIN', 'EMPLOYEE')
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

/**
 * DELETE /api/v1/superadmin/admins/:id
 * Delete an administrator user permanently.
 */
const deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting oneself
    if (id === req.user.id) {
      return error(res, 'You are not permitted to delete your own account.', 400);
    }

    // Check if user exists and is admin/employee
    const { rows: [targetUser] } = await query(
      `SELECT id, email, role FROM users WHERE id::text = $1 AND role IN ('ADMIN', 'EMPLOYEE')`,
      [id]
    );

    if (!targetUser) {
      return error(res, 'Administrator not found', 404);
    }

    // Delete user
    await query(`DELETE FROM users WHERE id = $1`, [targetUser.id]);

    // Record action in audit logs
    await logAction(req, 'DELETE_USER', targetUser.id, { email: targetUser.email, role: targetUser.role });

    return success(res, {}, 'Administrator account deleted successfully.');
  } catch (err) {
    next(err);
  }
};

const updatePartnerStatus = async (req, res, next) => {
  try {
    const { userId, status } = req.body;

    if (!userId || !status) {
      return error(res, 'userId and status are required', 400);
    }

    let checkStatus = status.toLowerCase();
    if (checkStatus === 'pending_verification') {
      checkStatus = 'pending';
    }

    const validStatuses = ['active', 'inactive', 'pending', 'suspended', 'rejected', 'blocked'];
    if (!validStatuses.includes(checkStatus)) {
      return error(res, `Invalid status value. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Resolve user: either it is direct user_id, or it is partner profile ID
    let targetUser;
    const { rows: [userById] } = await query(`SELECT id, email, role, status FROM users WHERE id::text = $1`, [userId]);
    if (userById) {
      targetUser = userById;
    } else {
      const { rows: [userByPartnerId] } = await query(`
        SELECT u.id, u.email, u.role, u.status 
        FROM users u 
        JOIN partner_profiles ap ON ap.user_id = u.id 
        WHERE ap.id::text = $1
      `, [userId]);
      if (userByPartnerId) {
        targetUser = userByPartnerId;
      }
    }

    if (!targetUser) {
      return error(res, 'User or Partner Profile not found', 404);
    }

    // Prevent changing oneself
    if (targetUser.id === req.user.id) {
      return error(res, 'You are not permitted to change your own status.', 400);
    }

    const oldStatus = targetUser.status;
    const newStatus = checkStatus;

    // Update in database
    await query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, targetUser.id]
    );

    // Log to audit logs
    await logAction(req, 'UPDATE_PARTNER_STATUS', targetUser.id, { 
      email: targetUser.email, 
      role: targetUser.role, 
      oldStatus, 
      newStatus 
    });

    return success(res, {}, `Partner status updated from ${oldStatus} to ${newStatus} successfully.`);
  } catch (err) {
    logger.error('updatePartnerStatus failed:', { error: err.message, stack: err.stack, body: req.body });
    next(err);
  }
};


/**
 * Commission Rules CRUD
 */
const createCommissionRule = async (req, res, next) => {
  try {
    const { productId, partnerPercentage, parentPercentage, campaignBonus, status } = req.body;
    
    if (!productId) {
      return error(res, 'Product ID is required', 400);
    }

    const { rows: [rule] } = await query(`
      INSERT INTO commission_rules (product_id, partner_percentage, parent_percentage, campaign_bonus, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [productId, partnerPercentage || 90, parentPercentage || 10, campaignBonus || 0, status || 'active']);

    await logAction(req, 'CREATE_COMMISSION_RULE', rule.id, { productId, partnerPercentage });

    return created(res, rule, 'Commission rule created successfully');
  } catch (err) {
    next(err);
  }
};

const getCommissionRules = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT cr.*, p.name as product_name
      FROM commission_rules cr
      LEFT JOIN products p ON p.id = cr.product_id
      ORDER BY cr.created_at DESC
    `);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

const approveKYC = async (req, res, next) => {
  const client = await getClient();
  try {
    const { partnerId } = req.body;
    if (!partnerId) return error(res, 'partnerId is required', 400);

    const { rows: [partner] } = await client.query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [partnerId]);
    if (!partner) return notFound(res, 'Partner profile not found');

    const { rows: [user] } = await client.query(`SELECT email FROM users WHERE id = $1`, [partner.user_id]);

    await client.query('BEGIN');

    // 1. Update partner profile
    await client.query(`
      UPDATE partner_profiles 
      SET kyc_status = 'approved', 
          kyc_reviewed_at = NOW(), 
          kyc_reviewed_by = $1,
          rejection_reason = NULL,
          kyc_rejection_reason = NULL
      WHERE id = $2
    `, [req.user.id, partnerId]);

    // 2. Update user status to active
    await client.query(`UPDATE users SET status = 'active' WHERE id = $1`, [partner.user_id]);

    // 3. Mark all documents as approved
    await client.query(`
      UPDATE kyc_documents 
      SET verified = true, 
          verification_status = 'approved',
          verified_by = $1,
          verified_at = NOW()
      WHERE Partner_id = $2
    `, [req.user.id, partnerId]);

    // 4. Mark video as approved
    await client.query(`
      UPDATE partner_videos 
      SET verification_status = 'approved'
      WHERE partner_id = $1
    `, [partnerId]);

    // 5. Ensure wallet exists
    const { ensureWallet } = require('../wallet/service.js');
    await ensureWallet(partnerId, client);

    await client.query('COMMIT');

    // Send notifications
    try {
      const { notify } = require('../notifications/service.js');
      const { sendKycApprovedEmail } = require('../../services/email/email.service.js');
      await notify.kycApproved(partner.user_id);
      if (user?.email) {
        await sendKycApprovedEmail(user.email);
      }
    } catch (notifErr) {
      logger.error('Failed to send KYC approval notifications:', notifErr.message);
    }

    await logAction(req, 'APPROVE_KYC', partnerId, { userId: partner.user_id });

    return success(res, {}, 'Partner KYC approved and profile activated successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const rejectKYC = async (req, res, next) => {
  const client = await getClient();
  try {
    const { partnerId, rejection_reason } = req.body;
    if (!partnerId) return error(res, 'partnerId is required', 400);
    if (!rejection_reason) return error(res, 'rejection_reason is required', 400);

    const { rows: [partner] } = await client.query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [partnerId]);
    if (!partner) return notFound(res, 'Partner profile not found');

    const { rows: [user] } = await client.query(`SELECT email FROM users WHERE id = $1`, [partner.user_id]);

    await client.query('BEGIN');

    // 1. Update partner profile
    await client.query(`
      UPDATE partner_profiles 
      SET kyc_status = 'rejected', 
          kyc_reviewed_at = NOW(), 
          kyc_reviewed_by = $1,
          rejection_reason = $2,
          kyc_rejection_reason = $2
      WHERE id = $3
    `, [req.user.id, rejection_reason, partnerId]);

    // 2. Update user status to rejected
    await client.query(`UPDATE users SET status = 'rejected' WHERE id = $1`, [partner.user_id]);

    // 3. Mark all unverified documents as rejected
    await client.query(`
      UPDATE kyc_documents 
      SET verification_status = 'rejected'
      WHERE Partner_id = $1 AND verified = false
    `, [partnerId]);

    // 4. Mark video as rejected
    await client.query(`
      UPDATE partner_videos 
      SET verification_status = 'rejected'
      WHERE partner_id = $1
    `, [partnerId]);

    await client.query('COMMIT');

    // Send notifications
    try {
      const { notify } = require('../notifications/service.js');
      const { sendKycRejectedEmail } = require('../../services/email/email.service.js');
      await notify.kycRejected(partner.user_id, rejection_reason);
      if (user?.email) {
        await sendKycRejectedEmail(user.email, rejection_reason);
      }
    } catch (notifErr) {
      logger.error('Failed to send KYC rejection notifications:', notifErr.message);
    }

    await logAction(req, 'REJECT_KYC', partnerId, { userId: partner.user_id, rejection_reason });

    return success(res, {}, 'Partner KYC rejected successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const requestChangesKYC = async (req, res, next) => {
  const client = await getClient();
  try {
    const { partnerId, rejection_reason, rejected_documents } = req.body;
    if (!partnerId) return error(res, 'partnerId is required', 400);
    if (!rejection_reason) return error(res, 'rejection_reason is required', 400);
    if (!Array.isArray(rejected_documents) || rejected_documents.length === 0) {
      return error(res, 'rejected_documents list is required and must contain document types', 400);
    }

    const { rows: [partner] } = await client.query(`SELECT user_id FROM partner_profiles WHERE id = $1`, [partnerId]);
    if (!partner) return notFound(res, 'Partner profile not found');

    const { rows: [user] } = await client.query(`SELECT email FROM users WHERE id = $1`, [partner.user_id]);

    await client.query('BEGIN');

    // 1. Update partner profile status to rejected
    await client.query(`
      UPDATE partner_profiles 
      SET kyc_status = 'rejected', 
          kyc_reviewed_at = NOW(), 
          kyc_reviewed_by = $1,
          rejection_reason = $2,
          kyc_rejection_reason = $2
      WHERE id = $3
    `, [req.user.id, rejection_reason, partnerId]);

    // 2. Set user status to rejected so they correct documents
    await client.query(`UPDATE users SET status = 'rejected' WHERE id = $1`, [partner.user_id]);

    // 3. Mark selected documents as rejected
    for (const docType of rejected_documents) {
      if (docType === 'video') {
        await client.query(`
          UPDATE partner_videos 
          SET verification_status = 'rejected'
          WHERE partner_id = $1
        `, [partnerId]);
      } else {
        await client.query(`
          UPDATE kyc_documents 
          SET verification_status = 'rejected',
              verified = false
          WHERE Partner_id = $1 AND doc_type = $2
        `, [partnerId, docType]);
      }
    }

    // 4. Mark non-rejected documents as approved/verified
    await client.query(`
      UPDATE kyc_documents
      SET verification_status = 'approved',
          verified = true,
          verified_by = $1,
          verified_at = NOW()
      WHERE Partner_id = $2 AND NOT (doc_type = ANY($3))
    `, [req.user.id, partnerId, rejected_documents]);

    if (!rejected_documents.includes('video')) {
      await client.query(`
        UPDATE partner_videos 
        SET verification_status = 'approved'
        WHERE partner_id = $1
      `, [partnerId]);
    }

    await client.query('COMMIT');

    // Send notifications
    try {
      const { notify } = require('../notifications/service.js');
      const { sendKycRejectedEmail } = require('../../services/email/email.service.js');
      await notify.kycRejected(partner.user_id, rejection_reason);
      if (user?.email) {
        await sendKycRejectedEmail(user.email, rejection_reason);
      }
    } catch (notifErr) {
      logger.error('Failed to send KYC request-changes notifications:', notifErr.message);
    }

    await logAction(req, 'REQUEST_KYC_CHANGES', partnerId, { userId: partner.user_id, rejected_documents, rejection_reason });

    return success(res, {}, 'KYC correction requested successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = {
  createCommissionRule,
  getCommissionRules,
  createAdmin,
  listAdmins,
  blockUser,
  getAuditLogs,
  deleteAdmin,
  updatePartnerStatus,
  approveKYC,
  rejectKYC,
  requestChangesKYC
};
