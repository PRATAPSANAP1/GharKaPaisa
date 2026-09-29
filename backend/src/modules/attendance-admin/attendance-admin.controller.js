const attendanceAdminService = require('./attendance-admin.service');
const logger = require('../../config/logger');

/**
 * GET /api/v1/attendance/admin/today
 * Returns today's attendance summary and active employee status list
 */
const getTodayAttendance = async (req, res, next) => {
  try {
    const { date, search, status, department, page, limit } = req.query;

    const data = await attendanceAdminService.getTodayAdminAttendance({
      date,
      search,
      status,
      department,
      page,
      limit,
    });

    res.json({
      success: true,
      message: "Today's attendance overview retrieved successfully",
      data,
    });
  } catch (error) {
    logger.error(`[ATTENDANCE-ADMIN] getTodayAttendance error: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/v1/attendance/admin/history
 * Returns historical attendance records with server-side pagination, search & filters
 */
const getAttendanceHistory = async (req, res, next) => {
  try {
    const { startDate, endDate, search, status, department, employeeId, page, limit } = req.query;

    const data = await attendanceAdminService.getAdminAttendanceHistory({
      startDate,
      endDate,
      search,
      status,
      department,
      employeeId,
      page,
      limit,
    });

    res.json({
      success: true,
      message: 'Attendance history retrieved successfully',
      data,
    });
  } catch (error) {
    logger.error(`[ATTENDANCE-ADMIN] getAttendanceHistory error: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/v1/attendance/admin/employee/:employeeId
 * Returns detailed attendance & monthly breakdown for a specific employee
 */
const getEmployeeAttendanceDetails = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    const data = await attendanceAdminService.getEmployeeAttendanceDetails(employeeId, month, year);

    res.json({
      success: true,
      message: 'Employee attendance details retrieved successfully',
      data,
    });
  } catch (error) {
    logger.error(`[ATTENDANCE-ADMIN] getEmployeeAttendanceDetails error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getTodayAttendance,
  getAttendanceHistory,
  getEmployeeAttendanceDetails,
};
