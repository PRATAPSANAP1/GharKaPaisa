const { query, getClient } = require('../../config/database');
const logger = require('../../config/logger');
const { logAction } = require('../admin/audit.service');

const isValidUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Helper to resolve employeeId from reqUser or user_id mapping.
 * Ensures that candidate codes like "CAND10003" or "EMP1001" are resolved into valid employee UUIDs.
 */
const resolveEmployeeId = async (reqUser) => {
  if (!reqUser) return null;

  const candidate = reqUser.employeeId || reqUser.employee_id || reqUser.employee_code;
  
  // 1. If candidate is already a valid UUID format, return it
  if (candidate && isValidUuid(candidate)) {
    return candidate;
  }
  
  // 2. If candidate is a string code like "CAND10003", query employees table for its UUID
  if (candidate) {
    try {
      const { rows: [emp] } = await query(
        `SELECT id FROM employees WHERE employee_id = $1 OR candidate_id::text = $1 OR user_id = $2 LIMIT 1`,
        [candidate, reqUser.id]
      );
      if (emp && isValidUuid(emp.id)) return emp.id;
    } catch (e) {
      logger.error('Error resolving employee code to UUID:', e.message);
    }
  }
  
  // 3. Fallback: try to resolve employee by user_id
  if (reqUser.id) {
    try {
      const { rows: [emp] } = await query(`SELECT id FROM employees WHERE user_id = $1 LIMIT 1`, [reqUser.id]);
      if (emp && isValidUuid(emp.id)) return emp.id;
    } catch (e) {}
  }
  
  return null;
};

/**
 * Get current Asia/Kolkata date string (YYYY-MM-DD)
 */
const getKolkataDateString = async () => {
  const { rows } = await query(`SELECT (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE::TEXT AS today_date`);
  return rows[0].today_date;
};

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
    `SELECT id, employee_id, status, liveness_status, face_status, environment_status, matched_environment_code, expires_at 
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

    // Mark verification session as CONSUMED
    await client.query(
      `UPDATE attendance_verification_sessions SET status = 'CONSUMED', updated_at = NOW() WHERE id = $1`,
      [session.id]
    );

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
    throw err;
  } finally {
    client.release();
  }
};

/**
 * 2. Employee Check-Out
 */
const checkOut = async ({ verificationSessionId, reqUser, source = 'WEB' }) => {
  const authEmpId = await resolveEmployeeId(reqUser);

  if (!authEmpId) {
    const error = new Error('Authenticated user context is not associated with an employee profile');
    error.statusCode = 400;
    throw error;
  }

  if (!verificationSessionId) {
    const error = new Error('verification_session_id is required for check-out');
    error.statusCode = 400;
    throw error;
  }

  // 1. Validate Phase 6-3 verification session
  const { rows: [session] } = await query(
    `SELECT id, employee_id, status, expires_at FROM attendance_verification_sessions WHERE id = $1 LIMIT 1`,
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
    const error = new Error(`Verification session is not PASSED (Current status: ${session.status}). Check-out rejected.`);
    error.statusCode = 403;
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

    // 2. Fetch today's attendance record
    const { rows: [existing] } = await client.query(
      `SELECT id, check_in_time, check_out_time FROM employee_attendance WHERE employee_id = $1 AND attendance_date = $2 FOR UPDATE`,
      [authEmpId, todayDate]
    );

    if (!existing || !existing.check_in_time) {
      await client.query('ROLLBACK');
      const error = new Error('Please start work before ending your work session.');
      error.statusCode = 400;
      error.code = 'ATTENDANCE_NOT_STARTED';
      throw error;
    }

    if (existing.check_out_time) {
      await client.query('ROLLBACK');
      const error = new Error('Work has already been ended for today.');
      error.statusCode = 409;
      error.code = 'ATTENDANCE_ALREADY_COMPLETED';
      throw error;
    }

    const { rows: [updated] } = await client.query(
      `UPDATE employee_attendance 
       SET check_out_time = NOW(), updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [existing.id]
    );

    // Mark verification session as CONSUMED
    await client.query(
      `UPDATE attendance_verification_sessions SET status = 'CONSUMED', updated_at = NOW() WHERE id = $1`,
      [session.id]
    );

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
    throw err;
  } finally {
    client.release();
  }
};

/**
 * 3. Get Today's Attendance for authenticated employee
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

  return attendance || null;
};

/**
 * 4. Get Attendance History for authenticated employee
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
      records: []
    };
  }

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const { rows } = await query(
    `SELECT id, attendance_date, check_in_time, check_out_time, status, verification_status, verification_reference, source, matched_environment_code, created_at 
     FROM employee_attendance 
     WHERE employee_id = $1 
       AND EXTRACT(MONTH FROM attendance_date) = $2 
       AND EXTRACT(YEAR FROM attendance_date) = $3 
     ORDER BY attendance_date DESC 
     LIMIT $4 OFFSET $5`,
    [authEmpId, targetMonth, targetYear, limit, offset]
  );

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
    records: rows,
  };
};

/**
 * 5. Get Monthly Attendance Summary for authenticated employee
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
      totalLate: 0,
      totalHalfDay: 0,
      totalLeave: 0,
      totalAbsent: 0,
      totalMarkedDays: 0,
      totalWorkingHoursFormatted: '0h 0m',
    };
  }

  const { rows } = await query(
    `SELECT 
       COUNT(*) FILTER (WHERE status = 'PRESENT')::INT AS total_present,
       COUNT(*) FILTER (WHERE status = 'LATE')::INT AS total_late,
       COUNT(*) FILTER (WHERE status = 'HALF_DAY')::INT AS total_half_day,
       COUNT(*) FILTER (WHERE status = 'LEAVE')::INT AS total_leave,
       COUNT(*) FILTER (WHERE status = 'ABSENT')::INT AS total_absent,
       COUNT(*)::INT AS total_marked_days,
       COALESCE(SUM(EXTRACT(EPOCH FROM (check_out_time - check_in_time))), 0)::BIGINT AS total_working_seconds
     FROM employee_attendance 
     WHERE employee_id = $1 
       AND EXTRACT(MONTH FROM attendance_date) = $2 
       AND EXTRACT(YEAR FROM attendance_date) = $3`,
    [authEmpId, targetMonth, targetYear]
  );

  const summary = rows[0] || {};
  const totalSeconds = Number(summary.total_working_seconds || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return {
    month: targetMonth,
    year: targetYear,
    totalPresent: summary.total_present || 0,
    totalLate: summary.total_late || 0,
    totalHalfDay: summary.total_half_day || 0,
    totalLeave: summary.total_leave || 0,
    totalAbsent: summary.total_absent || 0,
    totalMarkedDays: summary.total_marked_days || 0,
    totalWorkingHoursFormatted: `${hours}h ${minutes}m`,
  };
};

module.exports = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  getMySummary,
};
