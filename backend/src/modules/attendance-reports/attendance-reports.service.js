const { query } = require('../../config/database');
const logger = require('../../config/logger');
const security = require('../auth/security.service');
const ExcelJS = require('exceljs');

/**
 * Get current Asia/Kolkata date string (YYYY-MM-DD)
 */
const getKolkataTodayDate = async () => {
  const { rows } = await query(`SELECT (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE::TEXT AS today_date`);
  return rows[0].today_date;
};

/**
 * Helper to validate YYYY-MM-DD date format
 */
const isValidDateFormat = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
};

/**
 * Format minutes into display string e.g. "8h 32m"
 */
const formatDurationDisplay = (durationMinutes) => {
  if (durationMinutes === null || durationMinutes === undefined || isNaN(durationMinutes) || durationMinutes < 0) {
    return null;
  }
  const mins = parseInt(durationMinutes, 10);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins < 10 ? '0' : ''}${remMins}m`;
};

/**
 * Sanitize text fields against CSV formula injection
 */
const sanitizeCsvField = (val) => {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${val}`;
  }
  return val;
};

/**
 * Format ISO time into Asia/Kolkata time string HH:mm:ss
 */
const formatKolkataTime = (isoString) => {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return '-';
  }
};

/**
 * 1. Get Attendance Reports (Paginated with Aggregations)
 */
const getAttendanceReports = async ({
  startDate,
  endDate,
  employeeId,
  department,
  status,
  source,
  search,
  sortBy = 'attendance_date',
  sortOrder = 'DESC',
  page = 1,
  limit = 25,
}) => {
  const kolkataToday = await getKolkataTodayDate();
  const validEndDate = isValidDateFormat(endDate) ? endDate.trim() : kolkataToday;
  let validStartDate = isValidDateFormat(startDate) ? startDate.trim() : null;

  if (!validStartDate) {
    const endD = new Date(validEndDate);
    endD.setDate(endD.getDate() - 30);
    validStartDate = endD.toISOString().split('T')[0];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
  const offset = (pageNum - 1) * limitNum;

  // Build parameterized WHERE conditions
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
    const normalizedStatus = status.trim().toUpperCase();
    if (normalizedStatus === 'NOT_MARKED') {
      baseWhere += ` AND att.id IS NULL`;
    } else {
      baseWhere += ` AND att.status = $${paramIdx}`;
      params.push(normalizedStatus);
      paramIdx++;
    }
  }

  if (source && source.trim() && source.toUpperCase() !== 'ALL') {
    baseWhere += ` AND att.source = $${paramIdx}`;
    params.push(source.trim().toUpperCase());
    paramIdx++;
  }

  if (employeeId && employeeId.trim()) {
    const isEmpUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId.trim());
    if (isEmpUuid) {
      baseWhere += ` AND (att.employee_id = $${paramIdx} OR e.employee_id = $${paramIdx} OR e.user_id = $${paramIdx})`;
    } else {
      baseWhere += ` AND (e.employee_id = $${paramIdx} OR e.mobile_number = $${paramIdx})`;
    }
    params.push(employeeId.trim());
    paramIdx++;
  }

  // Count total filtered records
  const countQuery = `
    SELECT COUNT(att.id)::INT AS total
    FROM employee_attendance att
    JOIN employees e ON e.id = att.employee_id
    LEFT JOIN users u ON u.id = e.user_id
    ${baseWhere}
  `;
  const { rows: [countRow] } = await query(countQuery, params);
  const totalFiltered = countRow ? countRow.total : 0;

  // Validate sort parameters
  const allowedSortFields = {
    attendance_date: 'att.attendance_date',
    check_in_time: 'att.check_in_time',
    check_out_time: 'att.check_out_time',
    status: 'att.status',
    source: 'att.source',
    full_name: 'e.full_name'
  };
  const sortColumn = allowedSortFields[sortBy] || 'att.attendance_date';
  const sortDirection = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Fetch paginated report records
  const listParams = [...params, limitNum, offset];
  const listQuery = `
    SELECT
      att.id AS attendance_id,
      att.attendance_date,
      e.id AS employee_uuid,
      e.employee_id AS employee_code,
      e.full_name AS employee_name,
      e.email_id,
      e.mobile_number,
      e.department,
      e.designation,
      e.work_location,
      att.check_in_time,
      att.check_out_time,
      CASE 
        WHEN att.check_in_time IS NOT NULL AND att.check_out_time IS NOT NULL AND att.check_out_time >= att.check_in_time
        THEN ROUND(EXTRACT(EPOCH FROM (att.check_out_time - att.check_in_time)) / 60)::INT
        ELSE NULL 
      END AS duration_minutes,
      att.status,
      att.source,
      att.verification_status,
      att.verification_reference,
      att.matched_environment_code,
      att.created_at
    FROM employee_attendance att
    JOIN employees e ON e.id = att.employee_id
    LEFT JOIN users u ON u.id = e.user_id
    ${baseWhere}
    ORDER BY ${sortColumn} ${sortDirection}, att.check_in_time DESC NULLS LAST
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const { rows: rawRecords } = await query(listQuery, listParams);

  const data = rawRecords.map(r => ({
    attendance_id: r.attendance_id,
    date: r.attendance_date,
    employee_name: r.employee_name,
    employee_code: r.employee_code,
    department: r.department,
    designation: r.designation,
    check_in_time: r.check_in_time,
    check_out_time: r.check_out_time,
    duration_minutes: r.duration_minutes,
    duration_display: formatDurationDisplay(r.duration_minutes),
    status: r.status,
    source: r.source,
    verification_status: r.verification_status,
    verification_reference: r.verification_reference,
    environment_code: r.matched_environment_code,
  }));

  // Summary aggregated stats for the selected date range and filters
  const summaryQuery = `
    SELECT
      COUNT(att.id)::INT AS total_records,
      COUNT(att.id) FILTER (WHERE att.status = 'PRESENT')::INT AS present_count,
      COUNT(att.id) FILTER (WHERE att.status = 'LATE')::INT AS late_count,
      COUNT(att.id) FILTER (WHERE att.status = 'HALF_DAY')::INT AS half_day_count,
      COUNT(att.id) FILTER (WHERE att.status = 'LEAVE')::INT AS leave_count,
      COUNT(att.id) FILTER (WHERE att.status = 'ABSENT')::INT AS absent_count,
      COALESCE(SUM(
        CASE WHEN att.check_in_time IS NOT NULL AND att.check_out_time IS NOT NULL AND att.check_out_time >= att.check_in_time
        THEN EXTRACT(EPOCH FROM (att.check_out_time - att.check_in_time))
        ELSE 0 END
      ), 0)::BIGINT AS total_working_seconds
    FROM employee_attendance att
    JOIN employees e ON e.id = att.employee_id
    LEFT JOIN users u ON u.id = e.user_id
    ${baseWhere}
  `;
  const { rows: [summaryRow] } = await query(summaryQuery, params);

  const totalSeconds = Number(summaryRow?.total_working_seconds || 0);
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMins = Math.floor((totalSeconds % 3600) / 60);

  // Fetch departments list for filtering dropdown
  const { rows: deptRows } = await query(`
    SELECT DISTINCT department 
    FROM employees 
    WHERE department IS NOT NULL AND employee_status != 'TERMINATED' 
    ORDER BY department ASC
  `);

  return {
    startDate: validStartDate,
    endDate: validEndDate,
    summary: {
      total_records: summaryRow?.total_records || 0,
      present_count: summaryRow?.present_count || 0,
      late_count: summaryRow?.late_count || 0,
      half_day_count: summaryRow?.half_day_count || 0,
      leave_count: summaryRow?.leave_count || 0,
      absent_count: summaryRow?.absent_count || 0,
      total_working_duration: `${totalHours}h ${totalMins}m`
    },
    departments: deptRows.map(d => d.department),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalFiltered,
      total_pages: Math.ceil(totalFiltered / limitNum) || 1,
    },
    data,
  };
};

/**
 * 2. Export Attendance Reports (CSV or XLSX format)
 */
const exportAttendanceReports = async ({
  format = 'csv',
  startDate,
  endDate,
  employeeId,
  department,
  status,
  source,
  search,
  reqUser,
  req,
}) => {
  const kolkataToday = await getKolkataTodayDate();
  const validEndDate = isValidDateFormat(endDate) ? endDate.trim() : kolkataToday;
  let validStartDate = isValidDateFormat(startDate) ? startDate.trim() : null;

  if (!validStartDate) {
    const endD = new Date(validEndDate);
    endD.setDate(endD.getDate() - 30);
    validStartDate = endD.toISOString().split('T')[0];
  }

  // Build parameterized WHERE conditions
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
    const normalizedStatus = status.trim().toUpperCase();
    if (normalizedStatus === 'NOT_MARKED') {
      baseWhere += ` AND att.id IS NULL`;
    } else {
      baseWhere += ` AND att.status = $${paramIdx}`;
      params.push(normalizedStatus);
      paramIdx++;
    }
  }

  if (source && source.trim() && source.toUpperCase() !== 'ALL') {
    baseWhere += ` AND att.source = $${paramIdx}`;
    params.push(source.trim().toUpperCase());
    paramIdx++;
  }

  if (employeeId && employeeId.trim()) {
    const isEmpUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId.trim());
    if (isEmpUuid) {
      baseWhere += ` AND (att.employee_id = $${paramIdx} OR e.employee_id = $${paramIdx} OR e.user_id = $${paramIdx})`;
    } else {
      baseWhere += ` AND (e.employee_id = $${paramIdx} OR e.mobile_number = $${paramIdx})`;
    }
    params.push(employeeId.trim());
    paramIdx++;
  }

  // Fetch all matching attendance records up to 10,000 for safe export
  const exportQuery = `
    SELECT
      att.attendance_date,
      e.full_name AS employee_name,
      e.employee_id AS employee_code,
      e.department,
      e.designation,
      att.check_in_time,
      att.check_out_time,
      CASE 
        WHEN att.check_in_time IS NOT NULL AND att.check_out_time IS NOT NULL AND att.check_out_time >= att.check_in_time
        THEN ROUND(EXTRACT(EPOCH FROM (att.check_out_time - att.check_in_time)) / 60)::INT
        ELSE NULL 
      END AS duration_minutes,
      att.status,
      att.source,
      att.verification_status,
      att.matched_environment_code
    FROM employee_attendance att
    JOIN employees e ON e.id = att.employee_id
    LEFT JOIN users u ON u.id = e.user_id
    ${baseWhere}
    ORDER BY att.attendance_date DESC, att.check_in_time DESC NULLS LAST
    LIMIT 10000
  `;

  const { rows: rawRecords } = await query(exportQuery, params);

  // Audit export execution
  if (reqUser && reqUser.id) {
    await security.audit(reqUser.id, 'ATTENDANCE_REPORT_EXPORT', req, {
      export_format: format.toUpperCase(),
      record_count: rawRecords.length,
      filters: {
        startDate: validStartDate,
        endDate: validEndDate,
        department: department || 'ALL',
        status: status || 'ALL',
        source: source || 'ALL',
        search: search || null,
      },
      timestamp: new Date().toISOString()
    }).catch(err => logger.error('Export audit error:', err.message));
  }

  // Create ExcelJS Workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GharKaPaisa Super Admin Attendance System';
  workbook.lastModifiedBy = 'Super Admin';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Attendance Report', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // Define Columns
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Employee Name', key: 'employee_name', width: 24 },
    { header: 'Employee Code', key: 'employee_code', width: 16 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Designation', key: 'designation', width: 22 },
    { header: 'Check In', key: 'check_in', width: 14 },
    { header: 'Check Out', key: 'check_out', width: 14 },
    { header: 'Duration', key: 'duration', width: 14 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Source', key: 'source', width: 12 },
    { header: 'Verification Status', key: 'verification_status', width: 20 },
    { header: 'Environment Code', key: 'environment_code', width: 18 }
  ];

  // Format Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Fill Rows
  rawRecords.forEach(r => {
    const durDisp = formatDurationDisplay(r.duration_minutes) || '-';
    const checkInStr = formatKolkataTime(r.check_in_time);
    const checkOutStr = formatKolkataTime(r.check_out_time);

    worksheet.addRow({
      date: r.attendance_date,
      employee_name: sanitizeCsvField(r.employee_name || '-'),
      employee_code: sanitizeCsvField(r.employee_code || '-'),
      department: sanitizeCsvField(r.department || '-'),
      designation: sanitizeCsvField(r.designation || '-'),
      check_in: checkInStr,
      check_out: checkOutStr,
      duration: durDisp,
      status: r.status || 'NOT_MARKED',
      source: r.source || 'WEB',
      verification_status: r.verification_status || '-',
      environment_code: sanitizeCsvField(r.matched_environment_code || '-')
    });
  });

  const filename = `attendance-report-${validStartDate}-to-${validEndDate}.${format === 'xlsx' ? 'xlsx' : 'csv'}`;
  let buffer;

  if (format === 'xlsx') {
    buffer = await workbook.xlsx.writeBuffer();
  } else {
    buffer = await workbook.csv.writeBuffer();
  }

  return {
    buffer,
    filename,
    contentType: format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv'
  };
};

module.exports = {
  getKolkataTodayDate,
  getAttendanceReports,
  exportAttendanceReports,
};
