const { query, getClient } = require('../../config/database');
const logger = require('../../config/logger');
const { logAction } = require('../admin/audit.service');

const isValidUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Helper: format duration in human-readable form (e.g. "1 min", "25 mins", "2h 15m")
 * Prevents misleading "0.0 hrs" for short sessions.
 */
function formatHumanDuration(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return '--';
  const sec = Math.max(0, Math.round(Number(seconds)));
  if (sec < 60) return '1 min'; // sessions under 1 min display as 1 min instead of 0.0 hrs
  const mins = Math.floor(sec / 60);
  if (mins < 60) {
    return `${mins} min${mins === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
}

/**
 * Helper to resolve employeeId from reqUser or user_id mapping.
 * Ensures that candidate codes like "CAND10003" or "EMP1001" are resolved into valid employee UUIDs.
 */
const resolveEmployeeId = async (reqUser) => {
  if (!reqUser) return null;

  // 1. Authoritative: resolve employee by authenticated user_id
  if (reqUser.id && isValidUuid(reqUser.id)) {
    try {
      const { rows: [emp] } = await query(`SELECT id FROM employees WHERE user_id = $1 LIMIT 1`, [reqUser.id]);
      if (emp && isValidUuid(emp.id)) return emp.id;
    } catch (e) {}
  }

  const candidate = reqUser.employeeId || reqUser.employee_id || reqUser.employee_code || reqUser.emp_code;
  
  // 2. If candidate is already a valid UUID format and exists in employees table, return it
  if (candidate && isValidUuid(candidate)) {
    try {
      const { rows: [emp] } = await query(`SELECT id FROM employees WHERE id = $1 LIMIT 1`, [candidate]);
      if (emp) return emp.id;
    } catch (e) {}
  }
  
  // 3. If candidate string code like "CAND10001" or "EMP1001", query employee_id explicitly
  if (candidate && typeof candidate === 'string') {
    try {
      const cleanCandidate = candidate.trim();
      const { rows: [emp] } = await query(
        `SELECT id FROM employees WHERE employee_id = $1 OR candidate_id::text = $1 LIMIT 1`,
        [cleanCandidate]
      );
      if (emp && isValidUuid(emp.id)) return emp.id;
    } catch (e) {
      logger.error('Error resolving employee code to UUID:', e.message);
    }
  }

  // 4. Fallback: try to resolve employee by mobile or email
  if (reqUser.mobile || reqUser.email) {
    try {
      const { rows: [emp] } = await query(
        `SELECT id FROM employees WHERE mobile_number = $1 OR (email_id IS NOT NULL AND email_id != '' AND LOWER(email_id) = LOWER($2)) LIMIT 1`,
        [reqUser.mobile || '', reqUser.email || '']
      );
      if (emp && isValidUuid(emp.id)) return emp.id;
    } catch (e) {}
  }
  
  return null;
};

/**
 * Get current Asia/Kolkata date string (YYYY-MM-DD)
 */
const getKolkataDateString = async () => {
  try {
    const { rows } = await query(`SELECT (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE::TEXT AS today_date`);
    if (rows && rows[0] && rows[0].today_date) {
      return rows[0].today_date;
    }
  } catch (e) {}
  const { getKolkataTimeInfo } = require('../auth/workingHours.service');
  return getKolkataTimeInfo().dateStr;
};

/**
 * Helper: Resolve applicable working hours configuration for an employee for a specific date.
 * Strictly respects USER > DESIGNATION > ROLE > GLOBAL precedence, day schedules,
 * holidays, weekly offs, extensions, and overnight shifts.
 */
async function resolveEmployeeWorkingHoursContext(authEmpId, reqUser, targetDateStr = null) {
  const { 
    ensureWorkingHoursTables, 
    resolvePolicyForUser, 
    resolveHolidayForUser, 
    timeToMinutes, 
    getKolkataTimeInfo 
  } = require('../auth/workingHours.service');

  await ensureWorkingHoursTables();

  const timeInfo = getKolkataTimeInfo(targetDateStr ? new Date(targetDateStr + 'T12:00:00+05:30') : new Date());
  const dateStr = targetDateStr || timeInfo.dateStr;
  const dayName = timeInfo.dayName;

  // 1. Resolve employee and linked user from DB
  let emp = null;
  if (authEmpId) {
    try {
      const { rows } = await query(
        `SELECT e.id, e.employee_id, e.user_id, e.designation, e.department, e.employee_status,
                u.role, u.is_active as user_is_active
         FROM employees e
         LEFT JOIN users u ON u.id = e.user_id
         WHERE e.id = $1 LIMIT 1`,
        [authEmpId]
      );
      emp = rows[0] || null;
    } catch (e) {
      logger.error('Error fetching employee context for working hours:', e.message);
    }
  }

  const userContext = {
    id: emp?.user_id || reqUser?.id || null,
    role: emp?.role || reqUser?.role || 'EMPLOYEE',
    designation: emp?.designation || reqUser?.designation || '',
    employee_id: emp?.id || authEmpId
  };

  // 2. Resolve holiday (USER > DESIGNATION > ROLE > GLOBAL)
  const holiday = await resolveHolidayForUser(userContext, dateStr);

  // 3. Resolve policy (USER > DESIGNATION > ROLE > GLOBAL)
  const policy = await resolvePolicyForUser(userContext, dayName);

  const isConfigAssigned = Boolean(policy && policy.policyId);
  const isPolicyEnabled = policy ? policy.isEnabled !== false : true;

  // Check schedule for dayName
  const dayKey = dayName.toLowerCase();
  const daySched = policy?.scheduleConfig ? policy.scheduleConfig[dayKey] : null;
  const isWorkingDay = daySched ? daySched.is_working !== false : (dayKey !== 'sunday');
  const isWeeklyOff = !isWorkingDay;

  let baseStartTimeStr = daySched?.start_time || policy?.startTime || '09:30 AM';
  let baseEndTimeStr = daySched?.end_time || policy?.endTime || '08:00 PM';

  // 4. Check temporary extension for dateStr
  let isExtended = false;
  let effectiveEndTimeStr = baseEndTimeStr;
  let effectiveStartTimeStr = baseStartTimeStr;

  try {
    const { rows: extensionRows } = await query(`
      SELECT * FROM admin_working_hour_extensions
      WHERE (extension_date = $1::date OR ($1::date >= start_date AND $1::date <= end_date))
        AND is_revoked IS NOT TRUE
        AND (
          user_id = $2 
          OR ($2 = ANY(user_ids))
          OR apply_to = 'ALL'
          OR (apply_to IN ('ROLE', 'COMBINED') AND $3 = ANY(roles))
          OR (apply_to IN ('DESIGNATION', 'COMBINED') AND ($4 = ANY(designations) OR EXISTS (SELECT 1 FROM unnest(designations) d WHERE LOWER(d) = LOWER($4))))
        )
      ORDER BY 
        CASE 
          WHEN user_id = $2 OR ($2 = ANY(user_ids)) THEN 1
          WHEN apply_to IN ('DESIGNATION', 'COMBINED') AND ($4 = ANY(designations) OR EXISTS (SELECT 1 FROM unnest(designations) d WHERE LOWER(d) = LOWER($4))) THEN 2
          WHEN apply_to IN ('ROLE', 'COMBINED') AND $3 = ANY(roles) THEN 3
          ELSE 4
        END ASC,
        created_at DESC
      LIMIT 1
    `, [dateStr, userContext.id, String(userContext.role).toUpperCase(), userContext.designation]);

    if (extensionRows.length > 0) {
      const ext = extensionRows[0];
      if (ext.extended_start_time) {
        effectiveStartTimeStr = ext.extended_start_time;
        isExtended = true;
      }
      if (ext.extended_end_time) {
        effectiveEndTimeStr = ext.extended_end_time;
        isExtended = true;
      }
    }
  } catch (extErr) {
    logger.warn('Error checking working hour extensions:', extErr.message);
  }

  // 5. Calculate shift start & end timestamps in Asia/Kolkata
  const startMinutes = timeToMinutes(effectiveStartTimeStr);
  const endMinutes = timeToMinutes(effectiveEndTimeStr);
  const isOvernight = endMinutes <= startMinutes;

  // Build ISO timestamp for shift end
  let shiftEndDateStr = dateStr;
  if (isOvernight) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const nextDayObj = new Date(Date.UTC(y, m - 1, d + 1));
    shiftEndDateStr = nextDayObj.toISOString().slice(0, 10);
  }

  const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
  const endM = String(endMinutes % 60).padStart(2, '0');
  const shiftEndIso = `${shiftEndDateStr}T${endH}:${endM}:00+05:30`;
  const shiftEndDate = new Date(shiftEndIso);

  const startH = String(Math.floor(startMinutes / 60)).padStart(2, '0');
  const startM = String(startMinutes % 60).padStart(2, '0');
  const shiftStartIso = `${dateStr}T${startH}:${startM}:00+05:30`;
  const shiftStartDate = new Date(shiftStartIso);

  return {
    assigned: isConfigAssigned,
    isEnabled: isPolicyEnabled,
    policyName: policy?.policyName || 'Default Operating Schedule',
    startTime: effectiveStartTimeStr,
    endTime: effectiveEndTimeStr,
    shiftStartDate,
    shiftEndDate,
    shiftStartIso,
    shiftEndIso,
    isOvernight,
    isWorkingDay,
    isWeeklyOff,
    isHoliday: Boolean(holiday),
    holidayName: holiday?.holiday_name || null,
    isExtended,
    timezone: 'Asia/Kolkata',
    missingConfig: !isConfigAssigned
  };
}

/**
 * Authoritative helper: Determine whether an end-attendance reminder should be displayed.
 * Rules:
 * 1. Before attendance marked: no warning.
 * 2. Active before shift end: no warning.
 * 3. Active when shift end reached/passed: show warning.
 * 4. Completed attendance: no warning.
 * 5. Holiday / weekly off without attendance: no warning.
 * 6. Missing config: no warning, report missing config cleanly.
 */
function evaluateAttendanceReminder({ attendance, workingHoursConfig, now = new Date() }) {
  const hasActiveSession = Boolean(attendance && attendance.check_in_time && !attendance.check_out_time);
  const isCompleted = Boolean(attendance && attendance.check_in_time && attendance.check_out_time);

  // Rule 1: Before attendance is marked
  if (!attendance || !attendance.check_in_time) {
    return {
      should_remind: false,
      message: null,
      shift_end_time: workingHoursConfig?.endTime || null,
      is_active_session: false,
      is_completed: false,
      missing_config: Boolean(workingHoursConfig?.missingConfig)
    };
  }

  // Rule 4: If checkout has already been completed
  if (isCompleted) {
    return {
      should_remind: false,
      message: null,
      shift_end_time: workingHoursConfig?.endTime || null,
      is_active_session: false,
      is_completed: true,
      missing_config: Boolean(workingHoursConfig?.missingConfig)
    };
  }

  // Rule 6: If there is no valid working-hours assignment
  if (workingHoursConfig?.missingConfig) {
    return {
      should_remind: false,
      message: 'No assigned working hours configuration found. Please check with your administrator.',
      shift_end_time: null,
      is_active_session: hasActiveSession,
      is_completed: false,
      missing_config: true
    };
  }

  // Rule 2 & 3: Check shift end time
  const shiftEndTime = workingHoursConfig.shiftEndDate;
  const isShiftEnded = shiftEndTime ? now.getTime() >= shiftEndTime.getTime() : false;

  if (hasActiveSession && isShiftEnded) {
    return {
      should_remind: true,
      message: 'Your assigned working hours have ended. Please complete your attendance checkout.',
      shift_end_time: workingHoursConfig.endTime,
      shift_end_iso: workingHoursConfig.shiftEndIso,
      is_active_session: true,
      is_completed: false,
      missing_config: false
    };
  }

  return {
    should_remind: false,
    message: null,
    shift_end_time: workingHoursConfig.endTime,
    shift_end_iso: workingHoursConfig.shiftEndIso,
    is_active_session: true,
    is_completed: false,
    missing_config: false
  };
}

/**
 * 1. Employee Check-In
 */
const checkIn = async ({ verificationSessionId, reqUser, source = 'WEB' }) => {
  const authEmpId = await resolveEmployeeId(reqUser);

  if (!authEmpId) {
    const error = new Error('Authenticated user context is not associated with an employee profile');
    error.statusCode = 400;
    throw error;
  }

  if (!verificationSessionId) {
    const error = new Error('verification_session_id is required for check-in');
    error.statusCode = 400;
    throw error;
  }

  // 1. Validate Phase 6-3 verification session
  const { rows: [session] } = await query(
    `SELECT id, employee_id, status, liveness_status, face_status, environment_status, matched_environment_code, expires_at, consumed_at 
     FROM attendance_verification_sessions 
     WHERE id = $1 LIMIT 1`,
    [verificationSessionId]
  );

  if (!session) {
    const error = new Error('Attendance verification session not found');
    error.statusCode = 404;
    throw error;
  }

  if (session.employee_id !== authEmpId) {
    const error = new Error('Unauthorized: Verification session does not belong to authenticated employee');
    error.statusCode = 403;
    throw error;
  }

  if (session.status !== 'PASSED') {
    const error = new Error(`Verification session is not PASSED (Current status: ${session.status}). Check-in rejected.`);
    error.statusCode = 403;
    throw error;
  }

  if (session.consumed_at) {
    const error = new Error('Verification session has already been consumed. Please perform verification again.');
    error.statusCode = 409;
    error.code = 'VERIFICATION_SESSION_ALREADY_USED';
    throw error;
  }

  if (new Date(session.expires_at) < new Date()) {
    const error = new Error('Verification session has expired. Please perform verification again.');
    error.statusCode = 410;
    throw error;
  }

  const todayDate = await getKolkataDateString();
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 2. Check existing attendance record for today (Asia/Kolkata)
    const { rows: [existing] } = await client.query(
      `SELECT id, check_in_time, check_out_time FROM employee_attendance WHERE employee_id = $1 AND attendance_date = $2 FOR UPDATE`,
      [authEmpId, todayDate]
    );

    if (existing && existing.check_in_time) {
      await client.query('ROLLBACK');
      const error = new Error('Work has already been started for today.');
      error.statusCode = 409;
      error.code = 'ATTENDANCE_ALREADY_CHECKED_IN';
      throw error;
    }

    let record;
    const refId = `VER-${session.id.substring(0, 8).toUpperCase()}`;

    if (!existing) {
      const { rows: [newRec] } = await client.query(
        `INSERT INTO employee_attendance 
         (employee_id, attendance_date, check_in_time, status, verification_status, verification_session_id, verification_reference, source, liveness_status, face_status, environment_status, matched_environment_code, created_at, updated_at)
         VALUES ($1, $2, NOW(), 'PRESENT', 'VERIFIED', $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING *`,
        [
          authEmpId,
          todayDate,
          session.id,
          refId,
          source,
          session.liveness_status,
          session.face_status,
          session.environment_status,
          session.matched_environment_code,
        ]
      );
      record = newRec;
    } else {
      const { rows: [updRec] } = await client.query(
        `UPDATE employee_attendance 
         SET check_in_time = NOW(), status = 'PRESENT', verification_status = 'VERIFIED', verification_session_id = $1, verification_reference = $2, source = $3, liveness_status = $4, face_status = $5, environment_status = $6, matched_environment_code = $7, updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [
          session.id,
          refId,
          source,
          session.liveness_status,
          session.face_status,
          session.environment_status,
          session.matched_environment_code,
          existing.id,
        ]
      );
      record = updRec;
    }

    // Mark verification session as consumed atomically (keep status = 'PASSED', record consumed_at)
    const { rowCount } = await client.query(
      `UPDATE attendance_verification_sessions SET status = 'PASSED', consumed_at = NOW(), updated_at = NOW() WHERE id = $1 AND consumed_at IS NULL`,
      [session.id]
    );

    if (rowCount === 0) {
      await client.query('ROLLBACK');
      const error = new Error('Verification session has already been consumed.');
      error.statusCode = 409;
      error.code = 'VERIFICATION_SESSION_ALREADY_USED';
      throw error;
    }

    await client.query('COMMIT');

    await logAction(reqUser, 'ATTENDANCE_CHECK_IN', authEmpId, {
      attendance_id: record.id,
      attendance_date: todayDate,
      source,
      verification_reference: refId,
    });

    logger.info(`[ATTENDANCE] Check-in successful for employee ${authEmpId} on ${todayDate}`);
    return record;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    logger.error('[ATTENDANCE SERVICE CHECK-IN ERROR]', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      table: err.table,
      constraint: err.constraint,
    });
    throw err;
  } finally {
    client.release();
  }
};

/**
 * 2. Employee Check-Out (Idempotent and concurrency-safe)
 */
const checkOut = async ({ verificationSessionId, reqUser, source = 'WEB' }) => {
  const authEmpId = await resolveEmployeeId(reqUser);

  if (!authEmpId) {
    const error = new Error('Authenticated user context is not associated with an employee profile');
    error.statusCode = 400;
    throw error;
  }

  const todayDate = await getKolkataDateString();
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Fetch today's attendance record
    const { rows: [existing] } = await client.query(
      `SELECT id, employee_id, attendance_date, check_in_time, check_out_time, status, verification_status, verification_reference, source 
       FROM employee_attendance 
       WHERE employee_id = $1 AND attendance_date = $2 FOR UPDATE`,
      [authEmpId, todayDate]
    );

    // Rule: Must be checked in first
    if (!existing || !existing.check_in_time) {
      await client.query('ROLLBACK');
      const error = new Error('Please start work before ending your work session.');
      error.statusCode = 400;
      error.code = 'ATTENDANCE_NOT_STARTED';
      throw error;
    }

    // Rule: Idempotency. If checkout is already recorded, return the completed record cleanly without error
    if (existing.check_out_time) {
      await client.query('COMMIT');
      logger.info(`[ATTENDANCE] Check-out already completed for employee ${authEmpId} on ${todayDate}. Returning existing record idempotently.`);
      return {
        ...existing,
        already_completed: true,
      };
    }

    if (!verificationSessionId) {
      await client.query('ROLLBACK');
      const error = new Error('verification_session_id is required for check-out');
      error.statusCode = 400;
      throw error;
    }

    // 2. Validate Phase 6-3 verification session
    const { rows: [session] } = await client.query(
      `SELECT id, employee_id, status, expires_at, consumed_at FROM attendance_verification_sessions WHERE id = $1 LIMIT 1`,
      [verificationSessionId]
    );

    if (!session) {
      await client.query('ROLLBACK');
      const error = new Error('Attendance verification session not found');
      error.statusCode = 404;
      throw error;
    }

    if (session.employee_id !== authEmpId) {
      await client.query('ROLLBACK');
      const error = new Error('Unauthorized: Verification session does not belong to authenticated employee');
      error.statusCode = 403;
      throw error;
    }

    if (session.status !== 'PASSED') {
      await client.query('ROLLBACK');
      const error = new Error(`Verification session is not PASSED (Current status: ${session.status}). Check-out rejected.`);
      error.statusCode = 403;
      throw error;
    }

    if (session.consumed_at) {
      await client.query('ROLLBACK');
      const error = new Error('Verification session has already been consumed. Please perform verification again.');
      error.statusCode = 409;
      error.code = 'VERIFICATION_SESSION_ALREADY_USED';
      throw error;
    }

    if (new Date(session.expires_at) < new Date()) {
      await client.query('ROLLBACK');
      const error = new Error('Verification session has expired. Please perform verification again.');
      error.statusCode = 410;
      throw error;
    }

    const { rows: [updated] } = await client.query(
      `UPDATE employee_attendance 
       SET check_out_time = NOW(), updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [existing.id]
    );

    // Mark verification session as consumed atomically (keep status = 'PASSED', record consumed_at)
    const { rowCount } = await client.query(
      `UPDATE attendance_verification_sessions SET status = 'PASSED', consumed_at = NOW(), updated_at = NOW() WHERE id = $1 AND consumed_at IS NULL`,
      [session.id]
    );

    if (rowCount === 0) {
      await client.query('ROLLBACK');
      const error = new Error('Verification session has already been consumed.');
      error.statusCode = 409;
      error.code = 'VERIFICATION_SESSION_ALREADY_USED';
      throw error;
    }

    await client.query('COMMIT');

    await logAction(reqUser, 'ATTENDANCE_CHECK_OUT', authEmpId, {
      attendance_id: updated.id,
      attendance_date: todayDate,
      source,
    });

    logger.info(`[ATTENDANCE] Check-out successful for employee ${authEmpId} on ${todayDate}`);
    return updated;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    logger.error('[ATTENDANCE SERVICE CHECK-OUT ERROR]', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      table: err.table,
      constraint: err.constraint,
    });
    throw err;
  } finally {
    client.release();
  }
};

/**
 * 3. Get Today's Attendance for authenticated employee
 * Enriched with server-authoritative working hours config and reminder evaluation.
 */
const getTodayAttendance = async ({ reqUser }) => {
  const authEmpId = await resolveEmployeeId(reqUser);
  if (!authEmpId) return null;

  const todayDate = await getKolkataDateString();

  const { rows: [attendance] } = await query(
    `SELECT id, employee_id, attendance_date, check_in_time, check_out_time, status, verification_status, verification_reference, source, matched_environment_code, created_at, updated_at 
     FROM employee_attendance 
     WHERE employee_id = $1 AND attendance_date = $2 
     LIMIT 1`,
    [authEmpId, todayDate]
  );

  const whConfig = await resolveEmployeeWorkingHoursContext(authEmpId, reqUser, todayDate);
  const reminder = evaluateAttendanceReminder({
    attendance,
    workingHoursConfig: whConfig,
    now: new Date()
  });

  const baseRecord = attendance || {
    id: null,
    employee_id: authEmpId,
    attendance_date: todayDate,
    check_in_time: null,
    check_out_time: null,
    status: null,
    verification_status: null,
    verification_reference: null,
    source: null,
    matched_environment_code: null,
    created_at: null,
    updated_at: null
  };

  return {
    ...baseRecord,
    working_hours: {
      assigned: whConfig.assigned,
      start_time: whConfig.startTime,
      end_time: whConfig.endTime,
      shift_end_iso: whConfig.shiftEndIso,
      shift_start_iso: whConfig.shiftStartIso,
      is_working_day: whConfig.isWorkingDay,
      is_weekly_off: whConfig.isWeeklyOff,
      is_holiday: whConfig.isHoliday,
      holiday_name: whConfig.holidayName,
      is_overnight: whConfig.isOvernight,
      missing_config: whConfig.missingConfig
    },
    reminder
  };
};

/**
 * 4. Get Attendance History for authenticated employee
 * Identifies incomplete past sessions and formats short durations cleanly.
 */
const getMyAttendance = async ({ reqUser, month, year, limit = 31, page = 1 }) => {
  const now = new Date();
  const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
  const targetYear = year ? parseInt(year, 10) : now.getFullYear();

  const authEmpId = await resolveEmployeeId(reqUser);
  if (!authEmpId) {
    return {
      month: targetMonth,
      year: targetYear,
      totalRecords: 0,
      total: 0,
      records: []
    };
  }

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const todayDate = await getKolkataDateString();

  const { rows } = await query(
    `SELECT 
       id, 
       attendance_date::TEXT AS attendance_date, 
       attendance_date::TEXT AS date,
       check_in_time, 
       check_out_time, 
       status, 
       verification_status, 
       verification_reference, 
       source, 
       matched_environment_code, 
       created_at,
       CASE 
         WHEN check_in_time IS NOT NULL AND check_out_time IS NOT NULL 
         THEN EXTRACT(EPOCH FROM (check_out_time - check_in_time))::BIGINT
         ELSE NULL 
       END AS duration_seconds,
       CASE 
         WHEN check_in_time IS NOT NULL AND check_out_time IS NOT NULL 
         THEN ROUND((EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600.0)::numeric, 1)
         ELSE NULL 
       END AS total_hours
     FROM employee_attendance 
     WHERE employee_id = $1 
       AND EXTRACT(MONTH FROM attendance_date) = $2 
       AND EXTRACT(YEAR FROM attendance_date) = $3 
     ORDER BY attendance_date DESC 
     LIMIT $4 OFFSET $5`,
    [authEmpId, targetMonth, targetYear, limit, offset]
  );

  const enrichedRecords = rows.map(r => {
    const isCompleted = Boolean(r.check_in_time && r.check_out_time);
    const isActiveToday = Boolean(r.check_in_time && !r.check_out_time && r.attendance_date === todayDate);
    const isMissingCheckout = Boolean(r.check_in_time && !r.check_out_time && r.attendance_date < todayDate);

    let displayStatus = (r.status || 'PRESENT').toUpperCase();
    if (isCompleted) {
      displayStatus = 'COMPLETED';
    } else if (isActiveToday) {
      displayStatus = 'WORKING';
    } else if (isMissingCheckout) {
      displayStatus = 'CHECKOUT_MISSING';
    }

    return {
      ...r,
      duration_formatted: formatHumanDuration(r.duration_seconds),
      display_status: displayStatus,
      is_active: isActiveToday,
      is_completed: isCompleted,
      is_missing_checkout: isMissingCheckout
    };
  });

  const { rows: [countRow] } = await query(
    `SELECT COUNT(*)::INT AS total 
     FROM employee_attendance 
     WHERE employee_id = $1 
       AND EXTRACT(MONTH FROM attendance_date) = $2 
       AND EXTRACT(YEAR FROM attendance_date) = $3`,
    [authEmpId, targetMonth, targetYear]
  );

  return {
    month: targetMonth,
    year: targetYear,
    totalRecords: countRow ? countRow.total : 0,
    total: countRow ? countRow.total : 0,
    records: enrichedRecords,
  };
};

/**
 * 5. Get Monthly Attendance Summary for authenticated employee
 * Respects existing attendance calendar, assigned working days, holidays, weekly offs, and approved leaves.
 */
const getMySummary = async ({ reqUser, month, year }) => {
  const now = new Date();
  const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
  const targetYear = year ? parseInt(year, 10) : now.getFullYear();

  const authEmpId = await resolveEmployeeId(reqUser);
  if (!authEmpId) {
    return {
      month: targetMonth,
      year: targetYear,
      totalPresent: 0,
      total_present: 0,
      present_days: 0,
      present: 0,
      totalCompleted: 0,
      total_completed: 0,
      completed_days: 0,
      completed: 0,
      totalLate: 0,
      total_late: 0,
      late_days: 0,
      late: 0,
      totalHalfDay: 0,
      total_half_day: 0,
      half_days: 0,
      totalLeave: 0,
      total_leave: 0,
      leave_days: 0,
      totalAbsent: 0,
      total_absent: 0,
      absent_days: 0,
      absent: 0,
      totalWorkingDays: 0,
      total_working_days: 0,
      total_days: 0,
      totalDays: 0,
      totalMarkedDays: 0,
      total_marked_days: 0,
      total: 0,
      attendance_percentage: 0,
      attendancePercentage: 0,
      attendance_rate: 0,
      attendancePct: 0,
      totalWorkingHoursFormatted: '0h 0m',
      total_working_hours_formatted: '0h 0m',
      totalWorkingSeconds: 0,
      total_working_seconds: 0,
      totalHours: 0,
      total_hours: 0,
      weekly_offs: 0,
      holidays: 0
    };
  }

  const { ensureWorkingHoursTables, resolvePolicyForUser, getKolkataTimeInfo } = require('../auth/workingHours.service');
  await ensureWorkingHoursTables();

  const todayDate = await getKolkataDateString();
  const kolkataNow = getKolkataTimeInfo();
  const isCurrentMonth = (targetMonth === (now.getMonth() + 1) && targetYear === now.getFullYear());

  // 1. Resolve employee profile context
  let emp = null;
  try {
    const { rows } = await query(
      `SELECT e.id, e.employee_id, e.user_id, e.designation, e.department, u.role
       FROM employees e
       LEFT JOIN users u ON u.id = e.user_id
       WHERE e.id = $1 LIMIT 1`,
      [authEmpId]
    );
    emp = rows[0] || null;
  } catch (e) {}

  const userContext = {
    id: emp?.user_id || reqUser?.id || null,
    role: emp?.role || reqUser?.role || 'EMPLOYEE',
    designation: emp?.designation || reqUser?.designation || '',
    employee_id: emp?.id || authEmpId
  };

  const samplePolicy = await resolvePolicyForUser(userContext, 'MONDAY');
  const schedConfig = samplePolicy?.scheduleConfig || {
    monday: { is_working: true },
    tuesday: { is_working: true },
    wednesday: { is_working: true },
    thursday: { is_working: true },
    friday: { is_working: true },
    saturday: { is_working: true },
    sunday: { is_working: false }
  };

  // 2. Fetch active holidays in target month
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  const startOfMonthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
  const endOfMonthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  let holidayDateSet = new Set();
  try {
    const { rows: holidayRows } = await query(`
      SELECT holiday_date::TEXT AS holiday_date
      FROM admin_working_hour_holidays
      WHERE is_active = TRUE
        AND holiday_date >= $1::date AND holiday_date <= $2::date
        AND (
          (scope_type = 'USER' AND user_id = $3)
          OR (scope_type = 'DESIGNATION' AND $4 = ANY(designations))
          OR (scope_type = 'ROLE' AND $5 = ANY(roles))
          OR (scope_type = 'GLOBAL')
        )
    `, [startOfMonthStr, endOfMonthStr, userContext.id, userContext.designation, String(userContext.role).toUpperCase()]);

    holidayDateSet = new Set(holidayRows.map(h => h.holiday_date.substring(0, 10)));
  } catch (hErr) {
    logger.warn('Error fetching holidays for attendance summary:', hErr.message);
  }

  // 3. Compute working days, weekly offs, and holidays across month
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  let totalWorkingDays = 0;
  let weeklyOffCount = 0;
  let holidayCount = 0;
  let elapsedWorkingDays = 0;

  const currentKolkataDay = isCurrentMonth ? parseInt(kolkataNow.dateStr.split('-')[2], 10) : daysInMonth;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(Date.UTC(targetYear, targetMonth - 1, day));
    const dayName = dayNames[dateObj.getUTCDay()];
    const dayKey = dayName.toLowerCase();

    const isWorkingInSchedule = schedConfig[dayKey] ? schedConfig[dayKey].is_working !== false : (dayKey !== 'sunday');
    const isHoliday = holidayDateSet.has(dayDateStr);

    if (!isWorkingInSchedule) {
      weeklyOffCount++;
    } else if (isHoliday) {
      holidayCount++;
    } else {
      totalWorkingDays++;
      if (day <= currentKolkataDay) {
        elapsedWorkingDays++;
      }
    }
  }

  // 4. Query employee attendance records for month
  const { rows: attRecords } = await query(
    `SELECT 
       attendance_date::TEXT AS attendance_date,
       check_in_time,
       check_out_time,
       status,
       COALESCE(EXTRACT(EPOCH FROM (check_out_time - check_in_time)), 0)::BIGINT AS working_seconds
     FROM employee_attendance 
     WHERE employee_id = $1 
       AND EXTRACT(MONTH FROM attendance_date) = $2 
       AND EXTRACT(YEAR FROM attendance_date) = $3`,
    [authEmpId, targetMonth, targetYear]
  );

  let presentCount = 0;
  let completedCount = 0;
  let lateCount = 0;
  let halfDayCount = 0;
  let leaveCount = 0;
  let absentCount = 0;
  let totalWorkingSeconds = 0;

  for (const rec of attRecords) {
    const rawStatus = (rec.status || 'PRESENT').toUpperCase();
    const hasCheckIn = Boolean(rec.check_in_time);
    const hasCheckOut = Boolean(rec.check_out_time);

    if (rawStatus === 'LEAVE') {
      leaveCount++;
    } else if (rawStatus === 'ABSENT') {
      absentCount++;
    }

    if (rawStatus === 'LATE') lateCount++;
    if (rawStatus === 'HALF_DAY') halfDayCount++;

    if (hasCheckIn || ['PRESENT', 'LATE', 'HALF_DAY'].includes(rawStatus)) {
      presentCount++;
    }

    // Do NOT count active session as completed! Only count completed if both check_in and check_out exist
    if (hasCheckIn && hasCheckOut) {
      completedCount++;
      totalWorkingSeconds += Number(rec.working_seconds || 0);
    }
  }

  // 5. Calculate Attendance Rate % respecting calendar, assigned working days, holidays, weekly offs, and approved leaves
  const activeWorkingDaysDenominator = isCurrentMonth 
    ? Math.max(0, elapsedWorkingDays - leaveCount)
    : Math.max(0, totalWorkingDays - leaveCount);

  let attendancePct = 0;
  if (activeWorkingDaysDenominator > 0) {
    attendancePct = Math.min(100, Math.round((presentCount / activeWorkingDaysDenominator) * 100));
  } else if (presentCount > 0) {
    attendancePct = 100;
  }

  const hours = Math.floor(totalWorkingSeconds / 3600);
  const minutes = Math.floor((totalWorkingSeconds % 3600) / 60);
  const hoursFormatted = `${hours}h ${minutes}m`;
  const totalHoursDecimal = Number((totalWorkingSeconds / 3600).toFixed(1));

  return {
    month: targetMonth,
    year: targetYear,

    // Core KPIs
    totalWorkingDays,
    total_working_days: totalWorkingDays,
    totalDays: totalWorkingDays,
    total_days: totalWorkingDays,
    working_days: totalWorkingDays,
    calendar_days: daysInMonth,
    elapsed_working_days: elapsedWorkingDays,

    totalPresent: presentCount,
    total_present: presentCount,
    present_days: presentCount,
    present: presentCount,

    totalCompleted: completedCount,
    total_completed: completedCount,
    completed_days: completedCount,
    completed: completedCount,

    attendance_percentage: attendancePct,
    attendancePercentage: attendancePct,
    attendance_rate: attendancePct,
    attendancePct,

    totalLate: lateCount,
    total_late: lateCount,
    late_days: lateCount,
    late: lateCount,

    totalHalfDay: halfDayCount,
    total_half_day: halfDayCount,
    half_days: halfDayCount,

    totalLeave: leaveCount,
    total_leave: leaveCount,
    leave_days: leaveCount,

    totalAbsent: absentCount,
    total_absent: absentCount,
    absent_days: absentCount,
    absent: absentCount,

    totalMarkedDays: attRecords.length,
    total_marked_days: attRecords.length,
    total: totalWorkingDays,

    totalWorkingHoursFormatted: hoursFormatted,
    total_working_hours_formatted: hoursFormatted,
    totalWorkingSeconds: totalWorkingSeconds,
    total_working_seconds: totalWorkingSeconds,
    totalHours: totalHoursDecimal,
    total_hours: totalHoursDecimal,

    weekly_offs: weeklyOffCount,
    holidays: holidayCount
  };
};

module.exports = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  getMySummary,
  formatHumanDuration,
  resolveEmployeeWorkingHoursContext,
  evaluateAttendanceReminder,
};

