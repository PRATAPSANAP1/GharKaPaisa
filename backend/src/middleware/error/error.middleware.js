const logger = require('../../config/logger');
const { serverError, error } = require('../../utils/response/response');

// 404 handler
const notFoundHandler = (req, res) => {
  return error(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
};

// Global error handler
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, {
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return error(res, 'File size exceeds 5MB limit', 413);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return error(res, 'Unexpected file field', 400);
  }

  // PostgreSQL errors
  if (err.code === '23505') {  // unique violation
    const uniqueFieldMap = {
      'users_email_key': 'Email already registered',
      'users_mobile_key': 'Mobile already registered',
      'Partner_profiles_gst_number_key': 'GST number already registered',
      'partner_profiles_gst_number_key': 'GST number already registered',
    };
    const safeMsg = uniqueFieldMap[err.constraint] || 'Record already exists';
    return error(res, safeMsg, 409);
  }
  if (err.code === '23503') {  // foreign key violation
    return error(res, 'Referenced record not found', 400);
  }
  if (err.code === '22P02') {  // invalid UUID
    return error(res, 'Invalid ID format', 400);
  }
  if (err.code === '23502') { // not null violation
    return error(res, 'Required field missing', 400);
  }
  if (err.code === '42P01') { // undefined table
    logger.error('DB schema error — undefined table', { message: err.message });
    return serverError(res);
  }
  if (err.code === 'ECONNREFUSED') { // DB connection lost
    logger.error('DB connection refused');
    return serverError(res, 'Database unavailable');
  }

  // Default
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
  return serverError(res);
};

module.exports = { notFoundHandler, errorHandler };
