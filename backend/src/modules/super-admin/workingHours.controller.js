const { query } = require('../../config/database');
const { success, error, notFound } = require('../../utils/response/response');
const { logAction } = require('../admin/audit.service');
const { getKolkataTimeInfo, timeToMinutes } = require('../auth/workingHours.service');
const logger = require('../../config/logger');

/**
 * GET /api/v1/superadmin/working-hours
 * Fetch current working hours configuration, user statuses, and active extensions.
 */
const getWorkingHoursConfig = async (req, res, next) => {
  try {
    const { dateStr } = getKolkataTimeInfo();

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
      WHERE e.extension_date = $1::date
      ORDER BY e.created_at DESC
    `, [dateStr]);

    // Check if there is a global 'ALL' extension for today
    const globalExtension = extensionsToday.find(e => e.apply_to === 'ALL');

    // Combine users with effective parameters
    const userList = users.map(u => {
      const assignedBanks = bankMap[u.id] || [];
      const bankDisplay = assignedBanks.length > 0 ? assignedBanks.join(', ') : 'All Banks / Platform';
      
      const startTime = u.start_time || defaultConfig.start_time || '09:30 AM';
      const baseEndTime = u.end_time || defaultConfig.end_time || '08:00 PM';

      // Check specific extension or global extension
      const specificExt = extensionsToday.find(e => e.apply_to === 'SPECIFIC' && String(e.user_id) === String(u.id));
      const activeExt = specificExt || globalExtension || null;

      let effectiveEndTime = baseEndTime;
      if (activeExt && timeToMinutes(activeExt.extended_end_time) > timeToMinutes(baseEndTime)) {
        effectiveEndTime = activeExt.extended_end_time;
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
        effectiveEndTime,
        status: isEnabled ? 'Active' : 'Disabled',
        isEnabled,
        isExempt,
        activeExtension: activeExt ? {
          id: activeExt.id,
          applyTo: activeExt.apply_to,
          extensionDate: activeExt.extension_date,
          originalEndTime: activeExt.original_end_time,
          extendedEndTime: activeExt.extended_end_time,
          reason: activeExt.reason,
          createdByName: activeExt.created_by_name
        } : null
      };
    });

    return success(res, {
      defaultConfig,
      dateToday: dateStr,
      users: userList,
      extensionsToday
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
 * Extend working hours for today or a specific date.
 */
const extendWorkingHours = async (req, res, next) => {
  try {
    const { applyTo, userId, extensionDate, extendedEndTime, reason } = req.body;

    if (!extendedEndTime) {
      return error(res, 'New End Time is required', 400);
    }

    const { dateStr } = getKolkataTimeInfo();
    const targetDate = extensionDate || dateStr;
    const applyScope = applyTo === 'ALL' ? 'ALL' : 'SPECIFIC';

    let targetUserName = 'All Users';
    let originalEndTime = '08:00 PM';

    if (applyScope === 'SPECIFIC') {
      if (!userId) {
        return error(res, 'Please select a specific user to extend working hours', 400);
      }
      const { rows: [u] } = await query(`
        SELECT u.full_name, u.email, u.designation, wh.end_time 
        FROM users u 
        LEFT JOIN admin_working_hours wh ON wh.user_id = u.id 
        WHERE u.id::text = $1
      `, [userId]);

      if (!u) return notFound(res, 'Selected user not found');
      targetUserName = `${u.full_name || u.email} (${u.designation || 'Staff'})`;
      originalEndTime = u.end_time || '08:00 PM';
    } else {
      const { rows: [g] } = await query(`SELECT end_time FROM admin_working_hours WHERE user_id IS NULL AND designation IS NULL`);
      if (g?.end_time) originalEndTime = g.end_time;
    }

    // Insert extension record
    const { rows: [ext] } = await query(`
      INSERT INTO admin_working_hour_extensions (
        user_id, apply_to, extension_date, original_end_time, extended_end_time, reason, created_by
      )
      VALUES ($1, $2, $3::date, $4, $5, $6, $7)
      RETURNING *
    `, [applyScope === 'SPECIFIC' ? userId : null, applyScope, targetDate, originalEndTime, extendedEndTime, reason || 'Special operational extension', req.user.id]);

    // Record audit log entry
    await logAction(req, 'WORKING_HOURS_EXTENDED', applyScope === 'SPECIFIC' ? userId : null, {
      applyTo: applyScope === 'ALL' ? 'All Users' : targetUserName,
      extensionDate: targetDate,
      originalEndTime,
      newEndTime: extendedEndTime,
      reason: reason || 'Special operational extension',
      changedBy: req.user.full_name || req.user.email || 'Super Admin'
    });

    logger.info(`[Working Hours Extension] Created by ${req.user.email} for ${targetUserName} until ${extendedEndTime} on ${targetDate}`);

    return success(res, ext, `Working hours extended to ${extendedEndTime} successfully for ${targetUserName}.`);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/superadmin/working-hours/extensions
 * Fetch extension audit logs / history.
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
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWorkingHoursConfig,
  updateWorkingHours,
  extendWorkingHours,
  getExtensionHistory
};
