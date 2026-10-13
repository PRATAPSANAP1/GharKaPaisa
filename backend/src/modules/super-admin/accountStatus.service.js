const { query, getClient } = require('../../config/database');
const logger = require('../../config/logger');
const { logAction } = require('../admin/audit.service');
const { getKolkataTimeInfo, resolvePolicyForUser, resolveHolidayForUser, checkUserWorkingHours } = require('../auth/workingHours.service');

let schemaEnsured = false;

/**
 * Ensure database columns for account activation lifecycle are present.
 */
async function ensureAccountStatusSchema() {
  if (schemaEnsured) return;
  try {
    const { migrateAccountActivationLifecycle } = require('../../database/migrations/migrate_account_activation_lifecycle');
    await migrateAccountActivationLifecycle();
    schemaEnsured = true;
  } catch (err) {
    logger.warn('Schema ensure notice:', err.message);
  }
}

/**
 * Derive high-level account status badge key:
 * - 'scheduled'
 * - 'inactive'
 * - 'active'
 */
function determineAccountStatus(user) {
  const now = new Date();
  const hasScheduledActivation = user.activation_scheduled_at && new Date(user.activation_scheduled_at) > now;
  const hasScheduledDeactivation = user.deactivation_scheduled_at && new Date(user.deactivation_scheduled_at) > now;

  if (hasScheduledActivation || hasScheduledDeactivation) {
    return 'scheduled';
  }

  if (user.is_active === false || ['inactive', 'suspended', 'blocked'].includes(String(user.status || '').toLowerCase())) {
    return 'inactive';
  }

  return 'active';
}

/**
 * Compute user working-hours configuration summary & live status
 */
async function getWorkingHoursSummary(user) {
  try {
    const roleUpper = String(user.role || '').toUpperCase();
    const isExempt = roleUpper === 'SUPER_ADMIN' || !['ADMIN'].includes(roleUpper);

    const { dateStr, dayName, currentMinutes } = getKolkataTimeInfo();
    const policy = await resolvePolicyForUser(user, dayName);
    const holiday = await resolveHolidayForUser(user, dateStr);

    let scheduleStr = 'Mon-Sat 09:30 AM - 08:00 PM';
    if (policy && policy.startTime && policy.endTime) {
      scheduleStr = `${policy.startTime} - ${policy.endTime}`;
    }

    let liveState = 'within_hours';
    let liveLabel = 'Within Hours';

    if (isExempt) {
      liveState = 'unrestricted';
      liveLabel = '24/7 Unrestricted';
    } else if (holiday) {
      liveState = 'holiday';
      liveLabel = `Holiday (${holiday.holiday_name})`;
    } else if (!policy.isWorking) {
      liveState = 'non_working_day';
      liveLabel = `Off Day (${dayName})`;
    } else {
      const whCheck = await checkUserWorkingHours(user);
      if (!whCheck.allowed) {
        liveState = 'outside_hours';
        liveLabel = 'Outside Shift Hours';
      } else {
        liveState = 'within_hours';
        liveLabel = 'Within Shift Hours';
      }
    }

    return {
      policy_id: policy.policyId,
      policy_name: policy.policyName || 'Standard Operating Schedule',
      schedule_str: scheduleStr,
      start_time: policy.startTime || '09:30 AM',
      end_time: policy.endTime || '08:00 PM',
      timezone: 'Asia/Kolkata',
      is_exempt: isExempt,
      live_state: liveState,
      live_label: liveLabel
    };
  } catch (err) {
    logger.warn('Working hours summary error:', err.message);
    return {
      policy_name: 'Standard Operating Schedule',
      schedule_str: '09:30 AM - 08:00 PM',
      start_time: '09:30 AM',
      end_time: '08:00 PM',
      timezone: 'Asia/Kolkata',
      is_exempt: String(user.role || '').toUpperCase() === 'SUPER_ADMIN',
      live_state: 'unknown',
      live_label: 'Working Hours Active'
    };
  }
}

/**
 * List accounts with status, search, role filters, and working hours metadata
 */
async function listAccounts({ role = 'ALL', status = 'ALL', search = '', page = 1, limit = 20 }) {
  await ensureAccountStatusSchema();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * pageSize;

  let baseWhere = `WHERE 1=1`;
  const params = [];
  let paramIdx = 1;

  // Role Filter
  const roleNorm = String(role || 'ALL').trim().toUpperCase();
  if (roleNorm !== 'ALL') {
    baseWhere += ` AND u.role::text = $${paramIdx++}`;
    params.push(roleNorm);
  }

  // Search Filter
  if (search && search.trim()) {
    const q = `%${search.trim().toLowerCase()}%`;
    baseWhere += ` AND (
      LOWER(COALESCE(u.full_name, '')) LIKE $${paramIdx} 
      OR LOWER(COALESCE(u.email, '')) LIKE $${paramIdx} 
      OR COALESCE(u.mobile, '') LIKE $${paramIdx} 
      OR LOWER(COALESCE(u.employee_id, '')) LIKE $${paramIdx}
      OR LOWER(COALESCE(u.designation, '')) LIKE $${paramIdx}
      OR u.id::text LIKE $${paramIdx}
    )`;
    params.push(q);
    paramIdx++;
  }

  // Fetch users matching base criteria
  const queryStr = `
    SELECT 
      u.id,
      u.id as _id,
      u.email,
      u.mobile,
      u.role,
      u.status,
      u.is_active,
      u.full_name,
      u.employee_id,
      u.department,
      u.designation,
      u.created_at,
      u.updated_at,
      u.activated_at,
      u.activated_by,
      u.deactivated_at,
      u.deactivated_by,
      u.deactivation_reason,
      u.activation_scheduled_at,
      u.deactivation_scheduled_at,
      u.scheduled_status_action,
      u.scheduled_by,
      u.scheduled_reason,
      act_admin.full_name as activated_by_name,
      deact_admin.full_name as deactivated_by_name,
      sched_admin.full_name as scheduled_by_name
    FROM users u
    LEFT JOIN users act_admin ON act_admin.id = u.activated_by
    LEFT JOIN users deact_admin ON deact_admin.id = u.deactivated_by
    LEFT JOIN users sched_admin ON sched_admin.id = u.scheduled_by
    ${baseWhere}
    ORDER BY u.created_at DESC
  `;

  const { rows: allMatchedUsers } = await query(queryStr, params);

  // Compute status & working hours summary for each user
  const enrichedUsers = await Promise.all(allMatchedUsers.map(async u => {
    const accountStatus = determineAccountStatus(u);
    const whSummary = await getWorkingHoursSummary(u);

    return {
      ...u,
      account_status: accountStatus,
      status: u.status || 'active',
      is_active: u.is_active !== false,
      working_hours: whSummary
    };
  }));

  // Status Filter
  const statusNorm = String(status || 'ALL').trim().toLowerCase();
  const filteredUsers = enrichedUsers.filter(u => {
    if (statusNorm === 'all') return true;
    return u.account_status === statusNorm;
  });

  // Calculate status counts across allMatchedUsers
  const counts = {
    total: enrichedUsers.length,
    active: enrichedUsers.filter(u => u.account_status === 'active').length,
    inactive: enrichedUsers.filter(u => u.account_status === 'inactive').length,
    scheduled: enrichedUsers.filter(u => u.account_status === 'scheduled').length
  };

  const paginatedAccounts = filteredUsers.slice(offset, offset + pageSize);

  return {
    accounts: paginatedAccounts,
    counts,
    pagination: {
      total: filteredUsers.length,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(filteredUsers.length / pageSize) || 1
    }
  };
}

/**
 * Activate an account (immediately or scheduled)
 */
async function activateAccount(targetUserId, actorAdminId, { isScheduled = false, scheduledAt = null, reason = '' } = {}, reqContext = null) {
  await ensureAccountStatusSchema();

  const { rows: [targetUser] } = await query(
    `SELECT id, email, mobile, role, status, is_active, full_name, employee_id, activation_scheduled_at, deactivation_scheduled_at 
     FROM users WHERE id::text = $1`,
    [targetUserId]
  );

  if (!targetUser) {
    const err = new Error('Target user account not found.');
    err.statusCode = 404;
    throw err;
  }

  const previousStatus = determineAccountStatus(targetUser);

  if (isScheduled && scheduledAt) {
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      const err = new Error('Scheduled activation time must be a valid future timestamp.');
      err.statusCode = 400;
      throw err;
    }

    await query(`
      UPDATE users SET
        activation_scheduled_at = $1,
        deactivation_scheduled_at = NULL,
        scheduled_status_action = 'ACTIVATE',
        scheduled_by = $2,
        scheduled_reason = $3,
        updated_at = NOW()
      WHERE id = $4
    `, [scheduledDate, actorAdminId, reason || 'Scheduled activation requested by administrator', targetUserId]);

    await logAction(reqContext || actorAdminId, 'SCHEDULE_ACCOUNT_STATUS_CHANGE', targetUserId, {
      targetUserId,
      targetEmail: targetUser.email,
      targetRole: targetUser.role,
      action: 'ACTIVATE',
      previousStatus,
      newStatus: 'scheduled',
      scheduledAt: scheduledDate.toISOString(),
      reason: reason || 'Scheduled activation'
    });

    return {
      targetUserId,
      status: 'scheduled',
      action: 'ACTIVATE',
      scheduledAt: scheduledDate.toISOString(),
      message: `Account activation scheduled for ${scheduledDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (Asia/Kolkata).`
    };
  }

  // Immediate activation
  await query(`
    UPDATE users SET
      is_active = TRUE,
      status = 'active',
      activated_at = NOW(),
      activated_by = $1,
      deactivated_at = NULL,
      deactivation_reason = NULL,
      activation_scheduled_at = NULL,
      deactivation_scheduled_at = NULL,
      scheduled_status_action = NULL,
      scheduled_by = NULL,
      scheduled_reason = NULL,
      updated_at = NOW()
    WHERE id = $2
  `, [actorAdminId, targetUserId]);

  await logAction(reqContext || actorAdminId, 'ACTIVATE_ACCOUNT', targetUserId, {
    targetUserId,
    targetEmail: targetUser.email,
    targetRole: targetUser.role,
    previousStatus,
    newStatus: 'active',
    isScheduled: false,
    reason: reason || 'Account activated by administrator'
  });

  return {
    targetUserId,
    status: 'active',
    is_active: true,
    message: `Account for ${targetUser.full_name || targetUser.email} has been activated successfully.`
  };
}

/**
 * Deactivate an account (immediately or scheduled)
 */
async function deactivateAccount(targetUserId, actorAdminId, { isScheduled = false, scheduledAt = null, reason = '' } = {}, reqContext = null) {
  await ensureAccountStatusSchema();

  // 1. Prevent self-deactivation
  if (String(targetUserId).toLowerCase() === String(actorAdminId).toLowerCase()) {
    const err = new Error('You cannot deactivate your own Super Admin account.');
    err.statusCode = 400;
    throw err;
  }

  const { rows: [targetUser] } = await query(
    `SELECT id, email, mobile, role, status, is_active, full_name, employee_id, activation_scheduled_at, deactivation_scheduled_at 
     FROM users WHERE id::text = $1`,
    [targetUserId]
  );

  if (!targetUser) {
    const err = new Error('Target user account not found.');
    err.statusCode = 404;
    throw err;
  }

  // 2. Prevent deactivation of the last active Super Admin
  if (String(targetUser.role || '').toUpperCase() === 'SUPER_ADMIN') {
    const { rows: [{ active_count }] } = await query(`
      SELECT COUNT(*)::int as active_count 
      FROM users 
      WHERE role = 'SUPER_ADMIN' 
        AND is_active = TRUE 
        AND status = 'active'
        AND id != $1
    `, [targetUserId]);

    if (active_count === 0) {
      const err = new Error('Cannot deactivate the last active Super Admin in the system.');
      err.statusCode = 400;
      throw err;
    }
  }

  const previousStatus = determineAccountStatus(targetUser);

  if (isScheduled && scheduledAt) {
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      const err = new Error('Scheduled deactivation time must be a valid future timestamp.');
      err.statusCode = 400;
      throw err;
    }

    await query(`
      UPDATE users SET
        deactivation_scheduled_at = $1,
        activation_scheduled_at = NULL,
        scheduled_status_action = 'DEACTIVATE',
        scheduled_by = $2,
        scheduled_reason = $3,
        updated_at = NOW()
      WHERE id = $4
    `, [scheduledDate, actorAdminId, reason || 'Scheduled deactivation requested by administrator', targetUserId]);

    await logAction(reqContext || actorAdminId, 'SCHEDULE_ACCOUNT_STATUS_CHANGE', targetUserId, {
      targetUserId,
      targetEmail: targetUser.email,
      targetRole: targetUser.role,
      action: 'DEACTIVATE',
      previousStatus,
      newStatus: 'scheduled',
      scheduledAt: scheduledDate.toISOString(),
      reason: reason || 'Scheduled deactivation'
    });

    return {
      targetUserId,
      status: 'scheduled',
      action: 'DEACTIVATE',
      scheduledAt: scheduledDate.toISOString(),
      message: `Account deactivation scheduled for ${scheduledDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (Asia/Kolkata).`
    };
  }

  // Immediate deactivation
  await query(`
    UPDATE users SET
      is_active = FALSE,
      status = 'inactive',
      deactivated_at = NOW(),
      deactivated_by = $1,
      deactivation_reason = $2,
      activation_scheduled_at = NULL,
      deactivation_scheduled_at = NULL,
      scheduled_status_action = NULL,
      scheduled_by = NULL,
      scheduled_reason = NULL,
      updated_at = NOW()
    WHERE id = $3
  `, [actorAdminId, reason || 'Account deactivated by administrator', targetUserId]);

  // Invalidate and revoke all refresh tokens for the deactivated user
  await query(`
    UPDATE refresh_tokens 
    SET revoked = true, revoked_at = NOW() 
    WHERE user_id = $1 AND revoked = false
  `, [targetUserId]);

  await logAction(reqContext || actorAdminId, 'DEACTIVATE_ACCOUNT', targetUserId, {
    targetUserId,
    targetEmail: targetUser.email,
    targetRole: targetUser.role,
    previousStatus,
    newStatus: 'inactive',
    isScheduled: false,
    reason: reason || 'Account deactivated by administrator'
  });

  return {
    targetUserId,
    status: 'inactive',
    is_active: false,
    message: `Account for ${targetUser.full_name || targetUser.email} has been deactivated and active sessions revoked.`
  };
}

/**
 * Cancel any scheduled activation or deactivation
 */
async function cancelScheduledStatus(targetUserId, actorAdminId, reqContext = null) {
  await ensureAccountStatusSchema();

  const { rows: [targetUser] } = await query(
    `SELECT id, email, role, full_name, activation_scheduled_at, deactivation_scheduled_at, scheduled_status_action
     FROM users WHERE id::text = $1`,
    [targetUserId]
  );

  if (!targetUser) {
    const err = new Error('Target user account not found.');
    err.statusCode = 404;
    throw err;
  }

  await query(`
    UPDATE users SET
      activation_scheduled_at = NULL,
      deactivation_scheduled_at = NULL,
      scheduled_status_action = NULL,
      scheduled_by = NULL,
      scheduled_reason = NULL,
      updated_at = NOW()
    WHERE id = $1
  `, [targetUserId]);

  await logAction(reqContext || actorAdminId, 'CANCEL_SCHEDULED_ACCOUNT_STATUS_CHANGE', targetUserId, {
    targetUserId,
    targetEmail: targetUser.email,
    targetRole: targetUser.role,
    cancelledAction: targetUser.scheduled_status_action || 'UNKNOWN'
  });

  return {
    targetUserId,
    message: 'Scheduled status transition cancelled successfully.'
  };
}

/**
 * Fetch status change audit log history for an account
 */
async function getAccountAuditHistory(targetUserId) {
  const { rows: logs } = await query(`
    SELECT 
      al.id,
      al.action,
      al.details,
      al.created_at,
      al.ip_address,
      al.role as actor_role,
      u.full_name as actor_name,
      u.email as actor_email
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.user_id
    WHERE al.target_id::text = $1
      AND al.action IN (
        'ACTIVATE_ACCOUNT', 
        'DEACTIVATE_ACCOUNT', 
        'SCHEDULE_ACCOUNT_STATUS_CHANGE', 
        'CANCEL_SCHEDULED_ACCOUNT_STATUS_CHANGE',
        'BLOCK_USER',
        'UNBLOCK_USER'
      )
    ORDER BY al.created_at DESC
  `, [targetUserId]);

  return logs;
}

/**
 * Background worker task: Process due scheduled activations & deactivations
 */
async function processScheduledAccountTransitions() {
  await ensureAccountStatusSchema();

  try {
    const now = new Date();

    // 1. Due Activations
    const { rows: dueActivations } = await query(`
      SELECT id, email, role, full_name, scheduled_by, scheduled_reason 
      FROM users
      WHERE activation_scheduled_at IS NOT NULL 
        AND activation_scheduled_at <= $1
    `, [now]);

    for (const user of dueActivations) {
      try {
        await query(`
          UPDATE users SET
            is_active = TRUE,
            status = 'active',
            activated_at = NOW(),
            activated_by = $1,
            activation_scheduled_at = NULL,
            scheduled_status_action = NULL,
            scheduled_by = NULL,
            scheduled_reason = NULL,
            updated_at = NOW()
          WHERE id = $2
        `, [user.scheduled_by || null, user.id]);

        await logAction(user.scheduled_by || user.id, 'ACTIVATE_ACCOUNT', user.id, {
          targetUserId: user.id,
          targetEmail: user.email,
          targetRole: user.role,
          previousStatus: 'scheduled',
          newStatus: 'active',
          isScheduled: true,
          reason: user.scheduled_reason || 'Automated execution of scheduled activation'
        });

        logger.info(`[Account Scheduler] Activated user account: ${user.id} (${user.email})`);
      } catch (err) {
        logger.error(`[Account Scheduler] Failed to execute scheduled activation for user ${user.id}:`, err);
      }
    }

    // 2. Due Deactivations
    const { rows: dueDeactivations } = await query(`
      SELECT id, email, role, full_name, scheduled_by, scheduled_reason 
      FROM users
      WHERE deactivation_scheduled_at IS NOT NULL 
        AND deactivation_scheduled_at <= $1
    `, [now]);

    for (const user of dueDeactivations) {
      try {
        await query(`
          UPDATE users SET
            is_active = FALSE,
            status = 'inactive',
            deactivated_at = NOW(),
            deactivated_by = $1,
            deactivation_reason = $2,
            deactivation_scheduled_at = NULL,
            scheduled_status_action = NULL,
            scheduled_by = NULL,
            scheduled_reason = NULL,
            updated_at = NOW()
          WHERE id = $3
        `, [user.scheduled_by || null, user.scheduled_reason || 'Automated scheduled deactivation', user.id]);

        // Revoke active sessions
        await query(`
          UPDATE refresh_tokens 
          SET revoked = true, revoked_at = NOW() 
          WHERE user_id = $1 AND revoked = false
        `, [user.id]);

        await logAction(user.scheduled_by || user.id, 'DEACTIVATE_ACCOUNT', user.id, {
          targetUserId: user.id,
          targetEmail: user.email,
          targetRole: user.role,
          previousStatus: 'scheduled',
          newStatus: 'inactive',
          isScheduled: true,
          reason: user.scheduled_reason || 'Automated execution of scheduled deactivation'
        });

        logger.info(`[Account Scheduler] Deactivated user account & revoked tokens: ${user.id} (${user.email})`);
      } catch (err) {
        logger.error(`[Account Scheduler] Failed to execute scheduled deactivation for user ${user.id}:`, err);
      }
    }
  } catch (err) {
    logger.error('[Account Scheduler] Error processing scheduled account transitions:', err.message);
  }
}

module.exports = {
  ensureAccountStatusSchema,
  determineAccountStatus,
  getWorkingHoursSummary,
  listAccounts,
  activateAccount,
  deactivateAccount,
  cancelScheduledStatus,
  getAccountAuditHistory,
  processScheduledAccountTransitions
};
