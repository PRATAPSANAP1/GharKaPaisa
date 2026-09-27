const { query } = require('../../config/database');
const logger = require('../../config/logger');

let tablesInitialized = false;

/**
 * Self-healing helper: Ensure required working hours tables and default records exist.
 */
async function ensureWorkingHoursTables() {
  if (tablesInitialized) return;
  try {
    await query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS admin_working_hours (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        designation VARCHAR(100),
        start_time VARCHAR(10) DEFAULT '09:30 AM',
        end_time VARCHAR(10) DEFAULT '08:00 PM',
        timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
        is_enabled BOOLEAN DEFAULT TRUE,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admin_working_hour_extensions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        apply_to VARCHAR(20) DEFAULT 'SPECIFIC',
        extension_date DATE NOT NULL,
        original_end_time VARCHAR(10) DEFAULT '08:00 PM',
        extended_end_time VARCHAR(10) NOT NULL,
        reason TEXT,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_awhe_date_user ON admin_working_hour_extensions(extension_date, user_id);
    `);

    const { rows: existingGlobal } = await query(`SELECT id FROM admin_working_hours WHERE user_id IS NULL AND designation IS NULL LIMIT 1`);
    if (existingGlobal.length === 0) {
      await query(`
        INSERT INTO admin_working_hours (user_id, designation, start_time, end_time, timezone, is_enabled)
        VALUES (NULL, NULL, '09:30 AM', '08:00 PM', 'Asia/Kolkata', TRUE)
      `);
    }

    try {
      const migrateWorkingHoursPhase2 = require('../../database/migrations/migrate_working_hours_phase2');
      await migrateWorkingHoursPhase2();
    } catch (migErr) {
      logger.warn('Phase 2 migration call note:', migErr.message);
    }

    tablesInitialized = true;
  } catch (err) {
    logger.error('Failed to auto-initialize admin working hours tables:', err.message);
  }
}

/**
 * Convert time string (e.g. "09:30 AM", "08:00 PM", "20:00") into minutes past midnight (0..1439).
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const str = String(timeStr).trim();
  const ampmMatch = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!ampmMatch) return 0;
  
  let hours = parseInt(ampmMatch[1], 10);
  const minutes = parseInt(ampmMatch[2], 10);
  const ampm = ampmMatch[3] ? ampmMatch[3].toUpperCase() : null;

  if (ampm) {
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }
  return hours * 60 + minutes;
}

/**
 * Format minutes past midnight (e.g. 570) to 12-hour string (e.g. "09:30 AM").
 */
function minutesToTimeStr(totalMinutes) {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  let hours12 = hours % 12;
  if (hours12 === 0) hours12 = 12;
  const hStr = String(hours12).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  return `${hStr}:${mStr} ${ampm}`;
}

/**
 * Get Date (YYYY-MM-DD), Day Name, Day Number, and current minutes past midnight in Asia/Kolkata timezone.
 */
function getKolkataTimeInfo(dateObj = new Date()) {
  const optionsDate = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const optionsTime = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false };
  const optionsDay = { timeZone: 'Asia/Kolkata', weekday: 'long' };

  const formatterDate = new Intl.DateTimeFormat('en-CA', optionsDate); // YYYY-MM-DD
  const formatterTime = new Intl.DateTimeFormat('en-GB', optionsTime); // HH:mm
  const formatterDay = new Intl.DateTimeFormat('en-US', optionsDay);   // Monday, Tuesday, etc.

  const dateStr = formatterDate.format(dateObj);
  const timeStr = formatterTime.format(dateObj);
  const dayName = formatterDay.format(dateObj).toUpperCase(); // MONDAY, TUESDAY...

  const dayMap = { MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 7 };
  const dayNumber = dayMap[dayName] || 1;

  const [h, m] = timeStr.split(':').map(Number);
  const currentMinutes = h * 60 + m;

  return { dateStr, timeStr, dayName, dayNumber, currentMinutes };
}

/**
 * Helper: Resolve active holiday for a given user & date according to precedence:
 * USER > DESIGNATION > ROLE > GLOBAL
 */
async function resolveHolidayForUser(user, dateStr) {
  try {
    const userDesignation = user.designation || '';
    const userRole = user.role || '';

    const { rows } = await query(`
      SELECT * FROM admin_working_hour_holidays
      WHERE is_active = TRUE
        AND holiday_date = $1::date
        AND (
          (scope_type = 'USER' AND user_id = $2)
          OR (scope_type = 'DESIGNATION' AND $3 = ANY(designations))
          OR (scope_type = 'ROLE' AND $4 = ANY(roles))
          OR (scope_type = 'GLOBAL')
        )
      ORDER BY 
        CASE 
          WHEN scope_type = 'USER' AND user_id = $2 THEN 1
          WHEN scope_type = 'DESIGNATION' AND $3 = ANY(designations) THEN 2
          WHEN scope_type = 'ROLE' AND $4 = ANY(roles) THEN 3
          WHEN scope_type = 'GLOBAL' THEN 4
          ELSE 5
        END ASC,
        created_at DESC
      LIMIT 1
    `, [dateStr, user.id || null, userDesignation, userRole]);

    return rows[0] || null;
  } catch (err) {
    logger.error('Error resolving holiday:', err.message);
    return null;
  }
}

/**
 * Helper: Resolve working hours policy & day schedule for a user according to precedence:
 * USER > DESIGNATION > ROLE > GLOBAL
 */
async function resolvePolicyForUser(user, dayName) {
  try {
    const userDesignation = user.designation || '';
    const userRole = user.role || '';
    const dayKey = String(dayName || 'MONDAY').toLowerCase();

    // 1. Try Phase 2 policy table first
    const { rows: policyRows } = await query(`
      SELECT * FROM admin_working_hour_policies
      WHERE is_enabled = TRUE
        AND (
          (scope_type = 'USER' AND user_id = $1)
          OR (scope_type = 'DESIGNATION' AND $2 = ANY(designations))
          OR (scope_type = 'ROLE' AND $3 = ANY(roles))
          OR (scope_type = 'GLOBAL')
        )
      ORDER BY 
        CASE 
          WHEN scope_type = 'USER' AND user_id = $1 THEN 1
          WHEN scope_type = 'DESIGNATION' AND $2 = ANY(designations) THEN 2
          WHEN scope_type = 'ROLE' AND $3 = ANY(roles) THEN 3
          WHEN scope_type = 'GLOBAL' THEN 4
          ELSE 5
        END ASC,
        priority DESC,
        created_at DESC
      LIMIT 1
    `, [user.id || null, userDesignation, userRole]);

    if (policyRows.length > 0) {
      const pol = policyRows[0];
      const schedConfig = pol.schedule_config || {};
      const daySched = schedConfig[dayKey] || {
        is_working: dayKey !== 'sunday',
        start_time: '09:30 AM',
        end_time: '08:00 PM'
      };

      return {
        policyId: pol.id,
        policyName: pol.name,
        scopeType: pol.scope_type,
        isEnabled: pol.is_enabled,
        isWorking: daySched.is_working !== false,
        startTime: daySched.start_time || '09:30 AM',
        endTime: daySched.end_time || '08:00 PM'
      };
    }

    // 2. Fallback to legacy admin_working_hours table if Phase 2 policy table doesn't match
    const { rows: legacyRows } = await query(`
      SELECT * FROM admin_working_hours
      WHERE (user_id = $1)
         OR (UPPER(designation) = UPPER($2))
         OR (user_id IS NULL AND designation IS NULL)
      ORDER BY 
        CASE 
          WHEN user_id IS NOT NULL THEN 1 
          WHEN designation IS NOT NULL THEN 2 
          ELSE 3 
        END ASC
      LIMIT 1
    `, [user.id || null, userDesignation]);

    let legacy = legacyRows[0] || {
      start_time: '09:30 AM',
      end_time: '08:00 PM',
      is_enabled: true
    };

    return {
      policyId: legacy.id,
      policyName: 'Legacy Base Working Hours',
      scopeType: legacy.user_id ? 'USER' : legacy.designation ? 'DESIGNATION' : 'GLOBAL',
      isEnabled: legacy.is_enabled !== false,
      isWorking: true,
      startTime: legacy.start_time || '09:30 AM',
      endTime: legacy.end_time || '08:00 PM'
    };
  } catch (err) {
    logger.error('Error resolving working hours policy:', err.message);
    return {
      policyId: null,
      policyName: 'Fallback Default',
      scopeType: 'GLOBAL',
      isEnabled: true,
      isWorking: true,
      startTime: '09:30 AM',
      endTime: '08:00 PM'
    };
  }
}

/**
 * Helper: Find the next working day date string (YYYY-MM-DD) starting after fromDateStr.
 */
async function findNextWorkingDay(user, fromDateStr) {
  try {
    const baseDate = new Date(fromDateStr + 'T00:00:00Z');
    for (let i = 1; i <= 30; i++) {
      const nextDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
      const timeInfo = getKolkataTimeInfo(nextDate);

      // Check if nextDate is a holiday
      const holiday = await resolveHolidayForUser(user, timeInfo.dateStr);
      if (holiday) continue;

      // Check policy schedule for nextDate day of week
      const policy = await resolvePolicyForUser(user, timeInfo.dayName);
      if (policy && policy.isEnabled && policy.isWorking) {
        return timeInfo.dateStr;
      }
    }
  } catch (err) {
    logger.error('Error finding next working day:', err);
  }
  return null;
}

/**
 * Core validation helper: Check if user is allowed to log in at current time in Asia/Kolkata.
 * 
 * Rules (Phase 3):
 * 1. Identify User.
 * 2. Super Admin remains unrestricted. Restricted role (ADMIN) undergoes evaluation.
 * 3. Precedence hierarchy: USER > DESIGNATION > ROLE > GLOBAL.
 * 4. Holiday check: If holiday -> block login (code: HOLIDAY).
 * 5. Working day check: If non-working day -> block login (code: NON_WORKING_DAY).
 * 6. Working hours check: If outside start/end times -> block login (code: OUTSIDE_WORKING_HOURS).
 * 7. If inside hours -> allow login.
 */
async function checkUserWorkingHours(user) {
  try {
    if (!user) {
      return { allowed: true };
    }

    const roleUpper = String(user.role || '').toUpperCase();
    
    // Super Admin is ALWAYS exempt. Working hours logic ONLY applies to restricted roles (ADMIN).
    if (roleUpper !== 'ADMIN') {
      return { allowed: true, isExempt: true };
    }

    // Ensure database tables exist automatically
    await ensureWorkingHoursTables();

    // Get current Kolkata time info (dateStr, dayName, dayNumber, currentMinutes)
    const { dateStr, dayName, currentMinutes } = getKolkataTimeInfo();

    // 1. Check Holiday Precedence (USER > DESIGNATION > ROLE > GLOBAL)
    const holiday = await resolveHolidayForUser(user, dateStr);
    if (holiday) {
      const nextWorkingDay = await findNextWorkingDay(user, dateStr);
      const formattedNotice = `Today is a holiday (${holiday.holiday_name}). Login is currently unavailable. Please try again on your next working day (${nextWorkingDay || 'soon'}).`;

      return {
        allowed: false,
        code: 'HOLIDAY',
        reason: 'HOLIDAY',
        holiday_name: holiday.holiday_name,
        working_day: false,
        next_working_day: nextWorkingDay,
        message: formattedNotice,
        userRole: user.role,
        userDesignation: user.designation
      };
    }

    // 2. Resolve Working Hours Policy (Precedence: USER > DESIGNATION > ROLE > GLOBAL)
    const policy = await resolvePolicyForUser(user, dayName);

    // If policy is explicitly disabled, allow login 24/7
    if (!policy.isEnabled) {
      return { allowed: true, isEnabled: false };
    }

    // 3. Check whether today is a working day
    if (!policy.isWorking) {
      const nextWorkingDay = await findNextWorkingDay(user, dateStr);
      const formattedNotice = `Today (${dayName}) is a non-working day. Login is currently unavailable. Please try again on your next working day (${nextWorkingDay || 'soon'}).`;

      return {
        allowed: false,
        code: 'NON_WORKING_DAY',
        reason: 'NON_WORKING_DAY',
        working_day: false,
        start_time: policy.startTime,
        end_time: policy.endTime,
        next_working_day: nextWorkingDay,
        message: formattedNotice,
        userRole: user.role,
        userDesignation: user.designation
      };
    }

    // 4. Base start & end times
    let baseStartTimeStr = policy.startTime || '09:30 AM';
    let baseEndTimeStr = policy.endTime || '08:00 PM';

    let startMinutes = timeToMinutes(baseStartTimeStr);
    let endMinutes = timeToMinutes(baseEndTimeStr);

    // 5. Check active temporary extensions for today in Asia/Kolkata
    const { rows: extensionRows } = await query(`
      SELECT * FROM admin_working_hour_extensions
      WHERE extension_date = $1::date
        AND (user_id = $2 OR apply_to = 'ALL')
      ORDER BY created_at DESC
      LIMIT 1
    `, [dateStr, user.id]);

    let isExtended = false;
    let effectiveEndTimeStr = baseEndTimeStr;

    if (extensionRows.length > 0) {
      const ext = extensionRows[0];
      const extEndMinutes = timeToMinutes(ext.extended_end_time);
      if (extEndMinutes > endMinutes) {
        endMinutes = extEndMinutes;
        effectiveEndTimeStr = ext.extended_end_time;
        isExtended = true;
      }
    }

    // 6. Evaluate current time against allowed window [startMinutes, endMinutes)
    if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
      const nextWorkingDay = currentMinutes >= endMinutes 
        ? await findNextWorkingDay(user, dateStr) 
        : dateStr;

      const formattedNotice = `Working Hours Over\nYour working hours are from ${baseStartTimeStr} to ${effectiveEndTimeStr}. Login is currently unavailable. Please try again during your working hours.`;

      return {
        allowed: false,
        code: 'OUTSIDE_WORKING_HOURS',
        reason: 'OUTSIDE_WORKING_HOURS',
        working_day: true,
        start_time: baseStartTimeStr,
        end_time: effectiveEndTimeStr,
        startTime: baseStartTimeStr,
        endTime: baseEndTimeStr,
        effectiveEndTime: effectiveEndTimeStr,
        next_working_day: nextWorkingDay,
        isExtended,
        message: formattedNotice,
        userRole: user.role,
        userDesignation: user.designation
      };
    }

    // 7. Inside working hours -> Allow login
    return {
      allowed: true,
      working_day: true,
      start_time: baseStartTimeStr,
      end_time: effectiveEndTimeStr,
      startTime: baseStartTimeStr,
      endTime: effectiveEndTimeStr,
      isExtended
    };
  } catch (err) {
    logger.error('Working hours evaluation error:', err);
    // Safe fallback: allow login if check encounters DB issue to avoid system lockout
    return { allowed: true, error: err.message };
  }
}

module.exports = {
  timeToMinutes,
  minutesToTimeStr,
  getKolkataTimeInfo,
  checkUserWorkingHours,
  ensureWorkingHoursTables,
  resolveHolidayForUser,
  resolvePolicyForUser,
  findNextWorkingDay
};
