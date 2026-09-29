const service = require('./attendance-reports.service');
const { success, error } = require('../../utils/response/response');
const logger = require('../../config/logger');

/**
 * GET /api/v1/attendance/admin/reports
 * Attendance reporting endpoint supporting filtering, searching, and pagination
 */
const getReports = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      employee_id,
      department,
      status,
      source,
      search,
      sort_by,
      sort_order,
      page,
      limit,
    } = req.query;

    const result = await service.getAttendanceReports({
      startDate: start_date,
      endDate: end_date,
      employeeId: employee_id,
      department,
      status,
      source,
      search,
      sortBy: sort_by,
      sortOrder: sort_order,
      page,
      limit,
    });

    return success(res, result, 'Attendance report retrieved successfully');
  } catch (err) {
    logger.error('Attendance Report API Error:', err.message);
    return error(res, err.message || 'Failed to retrieve attendance report', err.statusCode || 500);
  }
};

/**
 * GET /api/v1/attendance/admin/reports/export
 * Download attendance report in CSV or XLSX format
 */
const exportReports = async (req, res) => {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const {
      start_date,
      end_date,
      employee_id,
      department,
      status,
      source,
      search,
    } = req.query;

    if (!['csv', 'xlsx'].includes(format)) {
      return error(res, 'Unsupported export format. Use csv or xlsx.', 400);
    }

    const { buffer, filename, contentType } = await service.exportAttendanceReports({
      format,
      startDate: start_date,
      endDate: end_date,
      employeeId: employee_id,
      department,
      status,
      source,
      search,
      reqUser: req.user,
      req,
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(buffer);
  } catch (err) {
    logger.error('Attendance Export API Error:', err.message);
    return error(res, err.message || 'Failed to export attendance report', err.statusCode || 500);
  }
};

module.exports = {
  getReports,
  exportReports,
};
