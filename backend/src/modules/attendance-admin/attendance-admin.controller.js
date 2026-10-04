const attendanceAdminService = require('./attendance-admin.service');
const environmentBypassService = require('./environmentBypass.service');
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

/**
 * POST /api/v1/attendance/admin/environment-bypass
 * Creates controlled environment bypass with non-self-approval enforcement
 */
const createEnvironmentBypass = async (req, res, next) => {
  try {
    const { employeeId, bypassReason, startDate, endDate } = req.body;

    const data = await environmentBypassService.createEnvironmentBypass({
      employeeId,
      bypassReason,
      startDate,
      endDate,
      reqUser: req.user
    });

    res.status(201).json({
      success: true,
      message: 'Environment bypass approval created successfully',
      data
    });
  } catch (error) {
    logger.error(`[ATTENDANCE-ADMIN] createEnvironmentBypass error: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/v1/attendance/admin/environment-bypass
 * Lists active & historical environment bypasses
 */
const listEnvironmentBypasses = async (req, res, next) => {
  try {
    const { page, limit, employeeId, activeOnly } = req.query;

    const data = await environmentBypassService.listEnvironmentBypasses({
      page,
      limit,
      employeeId,
      activeOnly: activeOnly === 'true'
    });

    res.json({
      success: true,
      message: 'Environment bypass approvals retrieved successfully',
      data
    });
  } catch (error) {
    logger.error(`[ATTENDANCE-ADMIN] listEnvironmentBypasses error: ${error.message}`);
    next(error);
  }
};

/**
 * DELETE /api/v1/attendance/admin/environment-bypass/:bypassId
 * Revokes / deactivates an environment bypass approval
 */
const revokeEnvironmentBypass = async (req, res, next) => {
  try {
    const { bypassId } = req.params;

    const data = await environmentBypassService.revokeEnvironmentBypass({
      bypassId,
      reqUser: req.user
    });

    res.json({
      success: true,
      message: 'Environment bypass approval revoked successfully',
      data
    });
  } catch (error) {
    logger.error(`[ATTENDANCE-ADMIN] revokeEnvironmentBypass error: ${error.message}`);
    next(error);
  }
};

const buildingGeofenceService = require('../../services/geofence/buildingGeofence.service');

/**
 * GET /api/v1/attendance/admin/buildings
 * List all office building geofences
 */
const listBuildings = async (req, res, next) => {
  try {
    const data = await buildingGeofenceService.getAllBuildings();
    res.json({
      success: true,
      message: 'Office building geofences loaded successfully',
      data
    });
  } catch (error) {
    logger.error(`[ATTENDANCE-ADMIN] listBuildings error: ${error.message}`);
    next(error);
  }
};

/**
 * POST /api/v1/attendance/admin/buildings
 * Create a new office building geofence
 */
const createBuilding = async (req, res, next) => {
  try {
    const { name, code, address, polygon_coordinates, tolerance_meters, is_active } = req.body;
    const data = await buildingGeofenceService.createBuilding({
      name,
      code,
      address,
      polygon_coordinates,
      tolerance_meters,
      is_active
    });
    res.status(201).json({
      success: true,
      message: 'Office building geofence created successfully',
      data
    });
  } catch (error) {
    logger.error(`[ATTENDANCE-ADMIN] createBuilding error: ${error.message}`);
    next(error);
  }
};

/**
 * PUT /api/v1/attendance/admin/buildings/:id
 * Update an existing building geofence
 */
const updateBuilding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, address, polygon_coordinates, tolerance_meters, is_active } = req.body;
    const data = await buildingGeofenceService.updateBuilding(id, {
      name,
      code,
      address,
      polygon_coordinates,
      tolerance_meters,
      is_active
    });
    res.json({
      success: true,
      message: 'Office building geofence updated successfully',
      data
    });
  } catch (error) {
    logger.error(`[ATTENDANCE-ADMIN] updateBuilding error: ${error.message}`);
    next(error);
  }
};

/**
 * DELETE /api/v1/attendance/admin/buildings/:id
 * Delete a building geofence
 */
const deleteBuilding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await buildingGeofenceService.deleteBuilding(id);
    res.json({
      success: true,
      message: 'Office building geofence deleted successfully',
      data
    });
  } catch (error) {
    logger.error(`[ATTENDANCE-ADMIN] deleteBuilding error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getTodayAttendance,
  getAttendanceHistory,
  getEmployeeAttendanceDetails,
  createEnvironmentBypass,
  listEnvironmentBypasses,
  revokeEnvironmentBypass,
  listBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding
};
