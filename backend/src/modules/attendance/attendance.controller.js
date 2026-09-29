const service = require('./attendance.service');
const { success, error } = require('../../utils/response/response');
const logger = require('../../config/logger');

// POST /api/v1/attendance/check-in
const checkIn = async (req, res) => {
  try {
    const { verification_session_id } = req.body;
    // Derive source strictly from trusted server-side authentication context.
    // Client-supplied body 'source' or headers are ignored to prevent spoofing.
    const source = req.user?.client_type === 'MOBILE' ? 'MOBILE' : 'WEB';

    const result = await service.checkIn({
      verificationSessionId: verification_session_id,
      reqUser: req.user,
      source,
    });
    return success(res, result, 'Attendance Check-In marked successfully');
  } catch (err) {
    logger.error('Attendance Check-In error:', err.message);
    return error(res, err.message, err.statusCode || 500, err.code || null);
  }
};

// POST /api/v1/attendance/check-out
const checkOut = async (req, res) => {
  try {
    const { verification_session_id } = req.body;
    // Derive source strictly from trusted server-side authentication context.
    const source = req.user?.client_type === 'MOBILE' ? 'MOBILE' : 'WEB';

    const result = await service.checkOut({
      verificationSessionId: verification_session_id,
      reqUser: req.user,
      source,
    });
    return success(res, result, 'Attendance Check-Out marked successfully');
  } catch (err) {
    logger.error('Attendance Check-Out error:', err.message);
    return error(res, err.message, err.statusCode || 500, err.code || null);
  }
};

// GET /api/v1/attendance/today
const getTodayAttendance = async (req, res) => {
  try {
    const result = await service.getTodayAttendance({ reqUser: req.user });
    return success(res, result, 'Today attendance loaded');
  } catch (err) {
    logger.error('Error fetching today attendance:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// GET /api/v1/attendance/my-attendance
const getMyAttendance = async (req, res) => {
  try {
    const { month, year, page, limit } = req.query;
    const result = await service.getMyAttendance({
      reqUser: req.user,
      month,
      year,
      page,
      limit,
    });
    return success(res, result, 'Attendance history loaded');
  } catch (err) {
    logger.error('Error fetching attendance history:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// GET /api/v1/attendance/my-summary
const getMySummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const result = await service.getMySummary({
      reqUser: req.user,
      month,
      year,
    });
    return success(res, result, 'Attendance monthly summary loaded');
  } catch (err) {
    logger.error('Error fetching attendance summary:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  getMySummary,
};
