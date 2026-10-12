const { query } = require('../../config/database');
const { success, error, notFound } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service');
const { getKolkataTimeInfo, timeToMinutes, ensureWorkingHoursTables } = require('../auth/workingHours.service');
const logger = require('../../config/logger');

/**
 * GET /api/v1/superadmin/working-hours
 * Fetch current working hours configuration, user statuses, active extensions, policies, and holidays.
 */
const getWorkingHoursConfig = async (req, res, next) => {
  try {
    await ensureWorkingHoursTables();
    const { dateStr, dayName } = getKolkataTimeInfo();
    const { resolvePolicyForUser } = require('../auth/workingHours.service');

    // 1. Fetch global/default config
    const { rows: globalRows } = await query(`
      SELECT * FROM admin_working_hours 
      WHERE user_id IS NULL AND designation IS NULL 
      LIMIT 1
    `);
    const defaultConfig = globalRows[0] || {
      start_time: '09:30 AM',
      end_time: '08:00 PM',
      timezone: 'Asia/Kolkata',
      is_enabled: true
    };

    // 2. Fetch all admin/operational users
    const { rows: users } = await query(`
      SELECT 
        u.id, u.full_name, u.email, u.mobile, u.role, u.designation, u.status, u.employee_id,
        wh.start_time, wh.end_time, wh.is_enabled as user_is_enabled, wh.id as working_hour_id
      FROM users u
      LEFT JOIN admin_working_hours wh ON wh.user_id = u.id
      WHERE u.role IN ('ADMIN', 'EMPLOYEE', 'HR', 'SUPER_ADMIN')
      ORDER BY u.created_at DESC
    `);

    // 3. Fetch assigned banks map
    const { rows: assignments } = await query(`
      SELECT aba.admin_id, b.id as bank_id, b.name as bank_name, b.short_code
      FROM admin_bank_assignments aba
      JOIN banks b ON b.id = aba.bank_id
    `);
    const bankMap = {};
    assignments.forEach(a => {
      if (!bankMap[a.admin_id]) bankMap[a.admin_id] = [];
      bankMap[a.admin_id].push(a.bank_name || a.short_code);
    });

    // 4. Fetch active extensions for today in Asia/Kolkata
    const { rows: extensionsToday } = await query(`
      SELECT 
        e.*, u.full_name as user_name, creator.full_name as created_by_name
      FROM admin_working_hour_extensions e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN users creator ON creator.id = e.created_by
      WHERE e.extension_date = $1::date AND e.is_revoked IS NOT TRUE
      ORDER BY e.created_at DESC
    `, [dateStr]);


    // Clean up any corrupt legacy 10:00 AM rows in admin_working_hours
    await query(`
      UPDATE admin_working_hours 
      SET end_time = '08:00 PM' 
      WHERE UPPER(end_time) IN ('10:00 AM', '10:00AM', '10:00')
    `).catch(() => {});

    // Combine users with effective parameters
    const userList = await Promise.all(users.map(async u => {
      const assignedBanks = bankMap[u.id] || [];
      const bankDisplay = assignedBanks.length > 0 ? assignedBanks.join(', ') : 'All Banks / Platform';
      
      const policyRes = await resolvePolicyForUser(u, dayName);

      let startTime = u.start_time || policyRes.startTime || defaultConfig.start_time || '09:30 AM';
      let baseEndTime = u.end_time || policyRes.endTime || defaultConfig.end_time || '08:00 PM';

      // Fix invalid 10:00 AM or < 1 hr shift error in baseEndTime
      if (timeToMinutes(baseEndTime) <= timeToMinutes(startTime) + 60) {
        baseEndTime = defaultConfig.end_time || '08:00 PM';
      }

      const globalExtension = extensionsToday.find(e => e.apply_to === 'ALL');
      const roleExtension = extensionsToday.find(e => (e.apply_to === 'ROLE' || e.apply_to === 'COMBINED') && Array.isArray(e.roles) && e.roles.includes(u.role));
      const desigExtension = extensionsToday.find(e => (e.apply_to === 'DESIGNATION' || e.apply_to === 'COMBINED') && Array.isArray(e.designations) && (e.designations.includes(u.designation) || e.designations.some(d => String(d).toLowerCase() === String(u.designation).toLowerCase())));
      const specificExt = extensionsToday.find(e => (e.apply_to === 'SPECIFIC' || e.apply_to === 'USER' || e.apply_to === 'COMBINED') && (String(e.user_id) === String(u.id) || (Array.isArray(e.user_ids) && e.user_ids.includes(u.id))));
      const activeExt = specificExt || desigExtension || roleExtension || globalExtension || null;

      let effectiveStartTime = startTime;
      let effectiveEndTime = baseEndTime;
      if (activeExt) {
        if (activeExt.extended_start_time) {
          effectiveStartTime = activeExt.extended_start_time;
        }
        if (timeToMinutes(activeExt.extended_end_time) > timeToMinutes(baseEndTime) || activeExt.extended_start_time) {
          effectiveEndTime = activeExt.extended_end_time;
        }
      }

      const isExempt = String(u.role).toUpperCase() === 'SUPER_ADMIN';
      const isEnabled = u.user_is_enabled !== null && u.user_is_enabled !== undefined 
        ? u.user_is_enabled 
        : defaultConfig.is_enabled;

      return {
        id: u.id,
        user: u.full_name || u.email,
        email: u.email,
        mobile: u.mobile,
        designation: u.designation || 'Operation Staff',
        role: u.role,
        employeeId: u.employee_id,
        bank: bankDisplay,
        startTime,
        endTime: baseEndTime,
        effectiveStartTime,
        effectiveEndTime,
        status: isEnabled ? 'Active' : 'Disabled',
        isEnabled,
        isExempt,
        activeExtension: activeExt ? {
          id: activeExt.id,
          applyTo: activeExt.apply_to,
          extensionDate: activeExt.extension_date,
          originalStartTime: activeExt.original_start_time,
          extendedStartTime: activeExt.extended_start_time,
          originalEndTime: activeExt.original_end_time,
          extendedEndTime: activeExt.extended_end_time,
          reason: activeExt.reason,
          createdByName: activeExt.created_by_name
        } : null
      };
    }));

    // 5. Fetch Phase 4 Policies
    const { rows: policies } = await query(`
      SELECT p.*, u.full_name as user_name, u.email as user_email
      FROM admin_working_hour_policies p
      LEFT JOIN users u ON u.id = p.user_id
      ORDER BY p.priority DESC, p.created_at DESC
    `);

    // 6. Fetch Phase 4 Holidays
    const { rows: holidays } = await query(`
      SELECT h.*, u.full_name as user_name, u.email as user_email, c.full_name as created_by_name
      FROM admin_working_hour_holidays h
      LEFT JOIN users u ON u.id = h.user_id
      LEFT JOIN users c ON c.id = h.created_by
      ORDER BY h.holiday_date ASC, h.created_at DESC
    `);

    // 7. Fetch distinct designations for dropdowns
    const { rows: desigRows } = await query(`
      SELECT DISTINCT designation FROM users WHERE designation IS NOT NULL AND TRIM(designation) != '' ORDER BY designation ASC
    `);
    const distinctDesignations = desigRows.map(r => r.designation);

    const distinctRoles = ['ADMIN', 'EMPLOYEE', 'HR', 'SUPER_ADMIN', 'PARTNER', 'TEAM_MEMBER'];

    return success(res, {
      defaultConfig,
      dateToday: dateStr,
      users: userList,
      extensionsToday,
      policies,
      holidays,
      distinctDesignations,
      distinctRoles
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/superadmin/working-hours
 * Update base working hours for specific user, designation, or global default.
 */
const updateWorkingHours = async (req, res, next) => {
  try {
    await ensureWorkingHoursTables();
    const { userId, designation, startTime, endTime, isEnabled, isGlobal } = req.body;

    if (!startTime || !endTime) {
      return error(res, 'startTime and endTime are required', 400);
    }

    let targetType = 'GLOBAL';
    let targetLabel = 'All Users (Default)';
    let oldConfigStr = '09:30 AM - 08:00 PM';

    if (userId) {
      targetType = 'USER';
      const { rows: [u] } = await query(`SELECT full_name, email, designation FROM users WHERE id::text = $1`, [userId]);
      if (!u) return notFound(res, 'Target user not found');
      targetLabel = `${u.full_name || u.email} (${u.designation || 'Admin'})`;

      const { rows: [existing] } = await query(`SELECT * FROM admin_working_hours WHERE user_id = $1`, [userId]);
      if (existing) {
        oldConfigStr = `${existing.start_time} - ${existing.end_time}`;
        await query(`
          UPDATE admin_working_hours
          SET start_time = $1, end_time = $2, is_enabled = $3, updated_at = NOW()
          WHERE user_id = $4
        `, [startTime, endTime, isEnabled !== false, userId]);
      } else {
        await query(`
          INSERT INTO admin_working_hours (user_id, start_time, end_time, is_enabled, created_by)
          VALUES ($1, $2, $3, $4, $5)
        `, [userId, startTime, endTime, isEnabled !== false, req.user.id]);
      }
    } else if (designation) {
      targetType = 'DESIGNATION';
      targetLabel = `Designation: ${designation}`;

      const { rows: [existing] } = await query(`SELECT * FROM admin_working_hours WHERE UPPER(designation) = UPPER($1)`, [designation]);
      if (existing) {
        oldConfigStr = `${existing.start_time} - ${existing.end_time}`;
        await query(`
          UPDATE admin_working_hours
          SET start_time = $1, end_time = $2, is_enabled = $3, updated_at = NOW()
          WHERE UPPER(designation) = UPPER($4)
        `, [startTime, endTime, isEnabled !== false, designation]);
      } else {
        await query(`
          INSERT INTO admin_working_hours (designation, start_time, end_time, is_enabled, created_by)
          VALUES ($1, $2, $3, $4, $5)
        `, [designation, startTime, endTime, isEnabled !== false, req.user.id]);
      }
    } else {
      // Global default update
      targetType = 'GLOBAL';
      const { rows: [existing] } = await query(`SELECT * FROM admin_working_hours WHERE user_id IS NULL AND designation IS NULL`);
      if (existing) {
        oldConfigStr = `${existing.start_time} - ${existing.end_time}`;
        await query(`
          UPDATE admin_working_hours
          SET start_time = $1, end_time = $2, is_enabled = $3, updated_at = NOW()
          WHERE user_id IS NULL AND designation IS NULL
        `, [startTime, endTime, isEnabled !== false]);
      } else {
        await query(`
          INSERT INTO admin_working_hours (user_id, designation, start_time, end_time, is_enabled, created_by)
          VALUES (NULL, NULL, $1, $2, $3, $4)
        `, [startTime, endTime, isEnabled !== false, req.user.id]);
      }
    }

    // Record audit log
    await logAction(req, 'WORKING_HOURS_UPDATED', userId || null, {
      applyTo: targetLabel,
      targetType,
      oldWorkingHours: oldConfigStr,
      newWorkingHours: `${startTime} - ${endTime}`,
      isEnabled: isEnabled !== false,
      changedBy: req.user.full_name || req.user.email || 'Super Admin'
    });

    return success(res, {}, `Working hours updated successfully for ${targetLabel}.`);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/superadmin/working-hours/extend
 * Extend working hours for today or future dates/ranges.
 * Supports:
 * - Searchable Multi-User selection
 * - Multi-Role & Multi-Designation selection
 * - Combined selection
 * - Start time change + End time change
 * - Required reason
 */
const extendWorkingHours = async (req, res, next) => {
  try {
    await ensureWorkingHoursTables();
    const { 
      applyTo, 
      userId, 
      userIds, 
      roles, 
      designations, 
      extensionDate, 
      startDate, 
      endDate, 
      extendedStartTime, 
      extendedEndTime, 
      reason 
    } = req.body;

    if (!extendedEndTime) {
      return error(res, 'New End Time is required', 400);
    }
    if (!reason || !String(reason).trim()) {
      return error(res, 'A reason for the extension is required', 400);
    }

    const { dateStr } = getKolkataTimeInfo();
    const targetDate = extensionDate || startDate || dateStr;
    const finalStartDate = startDate || targetDate;
    const finalEndDate = endDate || targetDate;

    const scope = (applyTo || 'USER').toUpperCase();
    const userList = Array.isArray(userIds) && userIds.length > 0 
      ? userIds 
      : (userId ? [userId] : []);
    const roleList = Array.isArray(roles) ? roles : (roles ? [roles] : []);
    const desigList = Array.isArray(designations) ? designations : (designations ? [designations] : []);

    let targetSummary = 'All Staff';
    if (scope === 'ALL') {
      targetSummary = 'All Users';
    } else if (scope === 'ROLE' || (roleList.length > 0 && userList.length === 0)) {
      targetSummary = `Roles: ${roleList.join(', ')}`;
    } else if (scope === 'DESIGNATION' || (desigList.length > 0 && userList.length === 0)) {
      targetSummary = `Designations: ${desigList.join(', ')}`;
    } else if (userList.length > 0) {
      const { rows: uRows } = await query(
        `SELECT full_name, email FROM users WHERE id = ANY($1::uuid[])`,
        [userList]
      );
      targetSummary = uRows.map(u => u.full_name || u.email).join(', ');
      if (roleList.length > 0) targetSummary += ` + Roles (${roleList.join(', ')})`;
    }

    let originalStartTime = '09:30 AM';
    let originalEndTime = '08:00 PM';
    const { rows: [g] } = await query(`SELECT start_time, end_time FROM admin_working_hours WHERE user_id IS NULL AND designation IS NULL`);
    if (g?.start_time) originalStartTime = g.start_time;
    if (g?.end_time) originalEndTime = g.end_time;

    const { rows: [ext] } = await query(`
      INSERT INTO admin_working_hour_extensions (
        user_id, user_ids, apply_to, roles, designations,
        extension_date, start_date, end_date,
        original_start_time, extended_start_time,
        original_end_time, extended_end_time,
        reason, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6::date, $7::date, $8::date, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      userList.length === 1 ? userList[0] : null,
      userList,
      scope,
      roleList,
      desigList,
      targetDate,
      finalStartDate,
      finalEndDate,
      originalStartTime,
      extendedStartTime || null,
      originalEndTime,
      extendedEndTime,
      reason.trim(),
      req.user.id
    ]);

    await logAction(req, 'WORKING_HOURS_EXTENDED', userList[0] || null, {
      applyTo: targetSummary,
      extensionDate: targetDate,
      startDate: finalStartDate,
      endDate: finalEndDate,
      originalStartTime,
      extendedStartTime: extendedStartTime || originalStartTime,
      originalEndTime,
      newEndTime: extendedEndTime,
      reason: reason.trim(),
      changedBy: req.user.full_name || req.user.email || 'Super Admin'
    });

    return success(res, ext, `Working hours extension saved successfully for ${targetSummary}.`);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/superadmin/working-hours/extensions
 */
const getExtensionHistory = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT 
        e.*, 
        u.full_name as target_user_name, 
        u.email as target_user_email,
        u.designation as target_user_designation,
        c.full_name as created_by_name, 
        c.email as created_by_email
      FROM admin_working_hour_extensions e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN users c ON c.id = e.created_by
      ORDER BY e.created_at DESC
      LIMIT 100
    `);

    // Fetch user names for multi-user user_ids
    const enhanced = await Promise.all(rows.map(async row => {
      if (Array.isArray(row.user_ids) && row.user_ids.length > 0 && !row.target_user_name) {
        const { rows: uNames } = await query(`SELECT full_name, email FROM users WHERE id = ANY($1::uuid[])`, [row.user_ids]);
        row.target_user_name = uNames.map(u => u.full_name || u.email).join(', ');
      }
      return row;
    }));

    return success(res, enhanced);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/superadmin/working-hours/policy
 * Create or Update a Day-Wise Working Hours Schedule Policy.
 */
const savePolicy = async (req, res, next) => {
  try {
    await ensureWorkingHoursTables();
    const { id, name, scopeType, roles, designations, userId, userIds, scheduleConfig, isEnabled } = req.body;

    const scope = scopeType || 'GLOBAL';
    const roleArr = Array.isArray(roles) ? roles : (roles ? [roles] : []);
    const desigArr = Array.isArray(designations) ? designations : (designations ? [designations] : []);
    const userArr = Array.isArray(userIds) ? userIds : (userId ? [userId] : []);
    const targetUserId = scope === 'USER' ? (userArr[0] || null) : null;

    const priorityMap = { USER: 100, DESIGNATION: 50, ROLE: 20, GLOBAL: 10 };
    const priority = priorityMap[scope] || 0;

    const defaultConfig = {
      monday:    { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
      tuesday:   { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
      wednesday: { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
      thursday:  { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
      friday:    { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
      saturday:  { is_working: true,  start_time: '09:30 AM', end_time: '08:00 PM' },
      sunday:    { is_working: false, start_time: '09:30 AM', end_time: '08:00 PM' }
    };

    const finalConfig = scheduleConfig || defaultConfig;
    let resultPolicy = null;

    if (id) {
      const { rows: [updated] } = await query(`
        UPDATE admin_working_hour_policies
        SET name = COALESCE($1, name),
            scope_type = $2,
            roles = $3,
            designations = $4,
            user_id = $5,
            user_ids = $6,
            schedule_config = $7::jsonb,
            is_enabled = $8,
            priority = $9,
            updated_at = NOW()
        WHERE id = $10
        RETURNING *
      `, [name || 'Working Hours Policy', scope, roleArr, desigArr, targetUserId, userArr, JSON.stringify(finalConfig), isEnabled !== false, priority, id]);
      resultPolicy = updated;
    } else {
      const { rows: [created] } = await query(`
        INSERT INTO admin_working_hour_policies (name, scope_type, roles, designations, user_id, user_ids, schedule_config, is_enabled, priority, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
        RETURNING *
      `, [name || 'Working Hours Policy', scope, roleArr, desigArr, targetUserId, userArr, JSON.stringify(finalConfig), isEnabled !== false, priority, req.user.id]);
      resultPolicy = created;
    }

    // Sync child table admin_working_hour_schedule_days
    if (resultPolicy && resultPolicy.id && finalConfig) {
      const days = [
        { day: 'MONDAY', num: 1, key: 'monday' },
        { day: 'TUESDAY', num: 2, key: 'tuesday' },
        { day: 'WEDNESDAY', num: 3, key: 'wednesday' },
        { day: 'THURSDAY', num: 4, key: 'thursday' },
        { day: 'FRIDAY', num: 5, key: 'friday' },
        { day: 'SATURDAY', num: 6, key: 'saturday' },
        { day: 'SUNDAY', num: 7, key: 'sunday' }
      ];

      for (const d of days) {
        const item = finalConfig[d.key] || { is_working: true, start_time: '09:30 AM', end_time: '08:00 PM' };
        await query(`
          INSERT INTO admin_working_hour_schedule_days (policy_id, day_of_week, day_number, is_working, start_time, end_time)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (policy_id, day_of_week) DO UPDATE SET
            is_working = EXCLUDED.is_working,
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            updated_at = NOW()
        `, [resultPolicy.id, d.day, d.num, item.is_working !== false, item.start_time || '09:30 AM', item.end_time || '08:00 PM']);
      }
    }

    await logAction(req, 'WORKING_HOURS_POLICY_SAVED', targetUserId, {
      policyName: name || 'Working Hours Policy',
      scopeType: scope,
      roles: roleArr,
      designations: desigArr,
      isEnabled: isEnabled !== false,
      changedBy: req.user.full_name || req.user.email
    });

    return success(res, resultPolicy, 'Working hours policy saved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/superadmin/working-hours/policies
 */
const getPolicies = async (req, res, next) => {
  try {
    await ensureWorkingHoursTables();
    const { rows } = await query(`
      SELECT p.*, u.full_name as user_name, u.email as user_email
      FROM admin_working_hour_policies p
      LEFT JOIN users u ON u.id = p.user_id
      ORDER BY p.priority DESC, p.created_at DESC
    `);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/superadmin/working-hours/policy/:id
 */
const deletePolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM admin_working_hour_policies WHERE id = $1`, [id]);
    return success(res, {}, 'Policy deleted successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/superadmin/working-hours/holiday
 * Create or Update a Holiday record.
 */
const saveHoliday = async (req, res, next) => {
  try {
    await ensureWorkingHoursTables();
    const { id, holidayName, holidayDate, scopeType, roles, designations, userId, reason, isActive } = req.body;

    if (!holidayName || !holidayDate) {
      return error(res, 'Holiday name and date are required', 400);
    }

    const scope = scopeType || 'GLOBAL';
    const roleArr = Array.isArray(roles) ? roles : (roles ? [roles] : []);
    const desigArr = Array.isArray(designations) ? designations : (designations ? [designations] : []);
    const targetUserId = scope === 'USER' ? (userId || null) : null;

    let result = null;
    if (id) {
      const { rows: [updated] } = await query(`
        UPDATE admin_working_hour_holidays
        SET holiday_name = $1,
            holiday_date = $2::date,
            scope_type = $3,
            roles = $4,
            designations = $5,
            user_id = $6,
            reason = $7,
            is_active = $8,
            updated_at = NOW()
        WHERE id = $9
        RETURNING *
      `, [holidayName, holidayDate, scope, roleArr, desigArr, targetUserId, reason || null, isActive !== false, id]);
      result = updated;
    } else {
      const { rows: [created] } = await query(`
        INSERT INTO admin_working_hour_holidays (holiday_name, holiday_date, scope_type, roles, designations, user_id, reason, is_active, created_by)
        VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [holidayName, holidayDate, scope, roleArr, desigArr, targetUserId, reason || null, isActive !== false, req.user.id]);
      result = created;
    }

    await logAction(req, 'WORKING_HOURS_HOLIDAY_SAVED', targetUserId, {
      holidayName,
      holidayDate,
      scopeType: scope,
      isActive: isActive !== false,
      changedBy: req.user.full_name || req.user.email
    });

    return success(res, result, 'Holiday saved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/superadmin/working-hours/holidays
 */
const getHolidays = async (req, res, next) => {
  try {
    await ensureWorkingHoursTables();
    const { rows } = await query(`
      SELECT h.*, u.full_name as user_name, u.email as user_email, c.full_name as created_by_name
      FROM admin_working_hour_holidays h
      LEFT JOIN users u ON u.id = h.user_id
      LEFT JOIN users c ON c.id = h.created_by
      ORDER BY h.holiday_date ASC, h.created_at DESC
    `);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/superadmin/working-hours/holiday/:id
 */
const deleteHoliday = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM admin_working_hour_holidays WHERE id = $1`, [id]);
    return success(res, {}, 'Holiday deleted successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/superadmin/working-hours/extension/:id
 */
const revokeExtension = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query(`
      UPDATE admin_working_hour_extensions 
      SET is_revoked = TRUE, updated_at = NOW() 
      WHERE id = $1
    `, [id]);
    await logAction(req, 'WORKING_HOURS_EXTENSION_REVOKED', null, {
      extensionId: id,
      revokedBy: req.user?.full_name || req.user?.email || 'Super Admin'
    });
    return success(res, {}, 'Extension revoked successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWorkingHoursConfig,
  updateWorkingHours,
  extendWorkingHours,
  getExtensionHistory,
  revokeExtension,
  savePolicy,
  getPolicies,
  deletePolicy,
  saveHoliday,
  getHolidays,
  deleteHoliday
};
