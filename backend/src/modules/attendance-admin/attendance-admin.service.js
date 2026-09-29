const { query } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Get current Asia/Kolkata date string (YYYY-MM-DD)
 */
const getKolkataTodayDate = async () => {
  const { rows } = await query(`SELECT (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE::TEXT AS today_date`);
  return rows[0].today_date;
};

/**
 * Helper to validate date format (YYYY-MM-DD)
 */
const isValidDateFormat = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
};

/**
 * 1. Get Today's Admin Attendance Overview and List
 */
const getTodayAdminAttendance = async ({
  date,
  search,
  status,
  department,
  page = 1,
  limit = 20,
}) => {
  const targetDate = isValidDateFormat(date) ? date.trim() : await getKolkataTodayDate();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  // 1. Overview summary metrics across active employee population for targetDate
  const summaryQuery = `
    SELECT
      COUNT(e.id)::INT AS total_employees,
      COUNT(att.id) FILTER (WHERE att.status = 'PRESENT')::INT AS total_present,
      COUNT(att.id) FILTER (WHERE att.status = 'LATE')::INT AS total_late,
      COUNT(att.id) FILTER (WHERE att.status = 'HALF_DAY')::INT AS total_half_day,
      COUNT(att.id) FILTER (WHERE att.status = 'LEAVE')::INT AS total_leave,
      COUNT(att.id) FILTER (WHERE att.status = 'ABSENT')::INT AS total_absent
    FROM employees e
    LEFT JOIN users u ON u.id = e.user_id
    LEFT JOIN employee_attendance att ON att.employee_id = e.id AND att.attendance_date = $1
    WHERE e.employee_status != 'TERMINATED'
      AND (u.role IS NULL OR u.role = 'EMPLOYEE')
      AND (e.designation NOT ILIKE '%HR%' AND e.designation NOT ILIKE '%Human Resource%')
  `;
  const { rows: [summaryRow] } = await query(summaryQuery, [targetDate]);

  const totalEmployees = summaryRow ? summaryRow.total_employees : 0;
  const totalPresent = summaryRow ? summaryRow.total_present : 0;
  const totalLate = summaryRow ? summaryRow.total_late : 0;
  const totalHalfDay = summaryRow ? summaryRow.total_half_day : 0;
  const totalLeave = summaryRow ? summaryRow.total_leave : 0;
  const totalAbsent = summaryRow ? summaryRow.total_absent : 0;

  const totalMarked = totalPresent + totalLate + totalHalfDay + totalLeave + totalAbsent;
  const totalNotMarked = Math.max(0, totalEmployees - totalMarked);

  // 2. Build filtered employee attendance list for targetDate
  const params = [targetDate];
  let paramIdx = 2;

  let baseWhere = `
    WHERE e.employee_status != 'TERMINATED'
      AND (u.role IS NULL OR u.role = 'EMPLOYEE')
      AND (e.designation NOT ILIKE '%HR%' AND e.designation NOT ILIKE '%Human Resource%')
  `;

  if (search && search.trim()) {
    const searchPattern = `%${search.trim()}%`;
    baseWhere += ` AND (e.full_name ILIKE $${paramIdx} OR e.employee_id ILIKE $${paramIdx} OR e.email_id ILIKE $${paramIdx} OR e.mobile_number ILIKE $${paramIdx})`;
    params.push(searchPattern);
    paramIdx++;
  }

  if (department && department.trim() && department.toUpperCase() !== 'ALL') {
    baseWhere += ` AND e.department = $${paramIdx}`;
    params.push(department.trim());
    paramIdx++;
  }

  if (status && status.trim() && status.toUpperCase() !== 'ALL') {
    const normalizedStatus = status.trim().toUpperCase();
    if (normalizedStatus === 'NOT_MARKED') {
      baseWhere += ` AND att.id IS NULL`;
    } else {
      baseWhere += ` AND att.status = $${paramIdx}`;
      params.push(normalizedStatus);
      paramIdx++;
    }
  }

  // Count query for pagination
  const countQuery = `
    SELECT COUNT(e.id)::INT AS total
    FROM employees e
    LEFT JOIN users u ON u.id = e.user_id
    LEFT JOIN employee_attendance att ON att.employee_id = e.id AND att.attendance_date = $1
    ${baseWhere}
  `;
  const { rows: [countRow] } = await query(countQuery, params);
  const totalFiltered = countRow ? countRow.total : 0;

  // Records query
  const listParams = [...params, limitNum, offset];
  const recordsQuery = `
    SELECT
      e.id AS employee_id,
      e.employee_id AS employee_code,
      e.full_name,
      e.email_id,
      e.mobile_number,
      e.department,
      e.designation,
      e.work_location,
      att.id AS attendance_id,
      att.attendance_date,
      att.check_in_time,
      att.check_out_time,
      COALESCE(att.status, 'NOT_MARKED') AS attendance_status,
      att.verification_status,
      att.verification_reference,
      att.source,
      att.matched_environment_code,
      att.liveness_status,
      att.face_status,
      att.environment_status,
      att.created_at AS marked_at
    FROM employees e
    LEFT JOIN users u ON u.id = e.user_id
    LEFT JOIN employee_attendance att ON att.employee_id = e.id AND att.attendance_date = $1
    ${baseWhere}
    ORDER BY e.employee_id ASC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const { rows: records } = await query(recordsQuery, listParams);

  // Get list of distinct departments for filtering dropdown
  const { rows: deptRows } = await query(`
    SELECT DISTINCT department 
    FROM employees 
    WHERE department IS NOT NULL AND employee_status != 'TERMINATED' 
    ORDER BY department ASC
  `);

  return {
    date: targetDate,
    summary: {
      totalEmployees,
      totalPresent,
      totalLate,
      totalHalfDay,
      totalLeave,
      totalAbsent,
      totalNotMarked,
    },
    departments: deptRows.map(d => d.department),
    pagination: {
      totalRecords: totalFiltered,
      currentPage: pageNum,
      totalPages: Math.ceil(totalFiltered / limitNum) || 1,
      limit: limitNum,
    },
    records,
  };
};

/**
 * 2. Get Admin Attendance History with Pagination & Filters
 */
const getAdminAttendanceHistory = async ({
  startDate,
  endDate,
  search,
  status,
  department,
  employeeId,
  page = 1,
  limit = 20,
}) => {
  const kolkataToday = await getKolkataTodayDate();

  const validEndDate = isValidDateFormat(endDate) ? endDate.trim() : kolkataToday;
  let validStartDate = isValidDateFormat(startDate) ? startDate.trim() : null;

  if (!validStartDate) {
    // Default to 30 days prior to validEndDate
    const endD = new Date(validEndDate);
    endD.setDate(endD.getDate() - 30);
    validStartDate = endD.toISOString().split('T')[0];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const params = [validStartDate, validEndDate];
  let paramIdx = 3;

  let baseWhere = `
    WHERE att.attendance_date >= $1 AND att.attendance_date <= $2
      AND e.employee_status != 'TERMINATED'
      AND (u.role IS NULL OR u.role = 'EMPLOYEE')
      AND (e.designation NOT ILIKE '%HR%' AND e.designation NOT ILIKE '%Human Resource%')
  `;

  if (search && search.trim()) {
    const searchPattern = `%${search.trim()}%`;
    baseWhere += ` AND (e.full_name ILIKE $${paramIdx} OR e.employee_id ILIKE $${paramIdx} OR e.email_id ILIKE $${paramIdx} OR e.mobile_number ILIKE $${paramIdx})`;
    params.push(searchPattern);
    paramIdx++;
  }

  if (department && department.trim() && department.toUpperCase() !== 'ALL') {
    baseWhere += ` AND e.department = $${paramIdx}`;
    params.push(department.trim());
    paramIdx++;
  }

  if (status && status.trim() && status.toUpperCase() !== 'ALL') {
    baseWhere += ` AND att.status = $${paramIdx}`;
    params.push(status.trim().toUpperCase());
    paramIdx++;
  }

  if (employeeId && employeeId.trim()) {
    baseWhere += ` AND (att.employee_id = $${paramIdx} OR e.employee_id = $${paramIdx})`;
    params.push(employeeId.trim());
    paramIdx++;
  }

  // Count query
  const countQuery = `
    SELECT COUNT(att.id)::INT AS total
    FROM employee_attendance att
    JOIN employees e ON e.id = att.employee_id
    LEFT JOIN users u ON u.id = e.user_id
    ${baseWhere}
  `;
  const { rows: [countRow] } = await query(countQuery, params);
  const totalFiltered = countRow ? countRow.total : 0;

  // History list query
  const listParams = [...params, limitNum, offset];
  const listQuery = `
    SELECT
      att.id AS attendance_id,
      att.employee_id,
      e.employee_id AS employee_code,
      e.full_name,
      e.email_id,
      e.mobile_number,
      e.department,
      e.designation,
      e.work_location,
      att.attendance_date,
      att.check_in_time,
      att.check_out_time,
      att.status AS attendance_status,
      att.verification_status,
      att.verification_reference,
      att.source,
      att.matched_environment_code,
      att.liveness_status,
      att.face_status,
      att.environment_status,
      att.created_at,
      att.updated_at
    FROM employee_attendance att
    JOIN employees e ON e.id = att.employee_id
    LEFT JOIN users u ON u.id = e.user_id
    ${baseWhere}
    ORDER BY att.attendance_date DESC, att.check_in_time DESC NULLS LAST
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const { rows: records } = await query(listQuery, listParams);

  // Aggregated summary for history date range
  const summaryQuery = `
    SELECT
      COUNT(att.id)::INT AS total_records,
      COUNT(att.id) FILTER (WHERE att.status = 'PRESENT')::INT AS total_present,
      COUNT(att.id) FILTER (WHERE att.status = 'LATE')::INT AS total_late,
      COUNT(att.id) FILTER (WHERE att.status = 'HALF_DAY')::INT AS total_half_day,
      COUNT(att.id) FILTER (WHERE att.status = 'LEAVE')::INT AS total_leave,
      COUNT(att.id) FILTER (WHERE att.status = 'ABSENT')::INT AS total_absent,
      COALESCE(SUM(EXTRACT(EPOCH FROM (att.check_out_time - att.check_in_time))), 0)::BIGINT AS total_working_seconds
    FROM employee_attendance att
    JOIN employees e ON e.id = att.employee_id
    LEFT JOIN users u ON u.id = e.user_id
    ${baseWhere}
  `;
  const { rows: [rangeSummaryRow] } = await query(summaryQuery, params);

  const rangeSummary = rangeSummaryRow || {};
  const totalSeconds = Number(rangeSummary.total_working_seconds || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return {
    startDate: validStartDate,
    endDate: validEndDate,
    summary: {
      totalRecords: rangeSummary.total_records || 0,
      totalPresent: rangeSummary.total_present || 0,
      totalLate: rangeSummary.total_late || 0,
      totalHalfDay: rangeSummary.total_half_day || 0,
      totalLeave: rangeSummary.total_leave || 0,
      totalAbsent: rangeSummary.total_absent || 0,
      totalWorkingHoursFormatted: `${hours}h ${minutes}m`,
    },
    pagination: {
      totalRecords: totalFiltered,
      currentPage: pageNum,
      totalPages: Math.ceil(totalFiltered / limitNum) || 1,
      limit: limitNum,
    },
    records,
  };
};

/**
 * 3. Get Single Employee Attendance Details & Monthly Breakdown
 */
const getEmployeeAttendanceDetails = async (employeeId, month, year) => {
  const kolkataToday = await getKolkataTodayDate();
  const todayParts = kolkataToday.split('-');

  const targetMonth = month ? parseInt(month, 10) : parseInt(todayParts[1], 10);
  const targetYear = year ? parseInt(year, 10) : parseInt(todayParts[0], 10);

  // Fetch employee details
  const { rows: [emp] } = await query(
    `SELECT id, employee_id, full_name, email_id, mobile_number, designation, department, work_location, joining_date, employee_status
     FROM employees 
     WHERE (id = $1 OR employee_id = $1) AND employee_status != 'TERMINATED'
     LIMIT 1`,
    [employeeId]
  );

  if (!emp) {
    const error = new Error('Employee not found or terminated');
    error.statusCode = 404;
    throw error;
  }

  // Monthly records
  const { rows: monthlyRecords } = await query(
    `SELECT
       id AS attendance_id,
       attendance_date,
       check_in_time,
       check_out_time,
       status AS attendance_status,
       verification_status,
       verification_reference,
       source,
       matched_environment_code,
       liveness_status,
       face_status,
       environment_status,
       created_at
     FROM employee_attendance
     WHERE employee_id = $1
       AND EXTRACT(MONTH FROM attendance_date) = $2
       AND EXTRACT(YEAR FROM attendance_date) = $3
     ORDER BY attendance_date DESC`,
    [emp.id, targetMonth, targetYear]
  );

  // Monthly summary
  const { rows: [monthlySummaryRow] } = await query(
    `SELECT
       COUNT(*)::INT AS total_marked,
       COUNT(*) FILTER (WHERE status = 'PRESENT')::INT AS total_present,
       COUNT(*) FILTER (WHERE status = 'LATE')::INT AS total_late,
       COUNT(*) FILTER (WHERE status = 'HALF_DAY')::INT AS total_half_day,
       COUNT(*) FILTER (WHERE status = 'LEAVE')::INT AS total_leave,
       COUNT(*) FILTER (WHERE status = 'ABSENT')::INT AS total_absent,
       COALESCE(SUM(EXTRACT(EPOCH FROM (check_out_time - check_in_time))), 0)::BIGINT AS total_working_seconds
     FROM employee_attendance
     WHERE employee_id = $1
       AND EXTRACT(MONTH FROM attendance_date) = $2
       AND EXTRACT(YEAR FROM attendance_date) = $3`,
    [emp.id, targetMonth, targetYear]
  );

  const summary = monthlySummaryRow || {};
  const totalSeconds = Number(summary.total_working_seconds || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return {
    employee: emp,
    month: targetMonth,
    year: targetYear,
    summary: {
      totalMarkedDays: summary.total_marked || 0,
      totalPresent: summary.total_present || 0,
      totalLate: summary.total_late || 0,
      totalHalfDay: summary.total_half_day || 0,
      totalLeave: summary.total_leave || 0,
      totalAbsent: summary.total_absent || 0,
      totalWorkingHoursFormatted: `${hours}h ${minutes}m`,
    },
    records: monthlyRecords,
  };
};

module.exports = {
  getKolkataTodayDate,
  getTodayAdminAttendance,
  getAdminAttendanceHistory,
  getEmployeeAttendanceDetails,
};
