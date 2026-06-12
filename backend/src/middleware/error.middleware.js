const logger = require('../utils/logger');
const { serverError, error } = require('../utils/response');

// 404 handler
const notFoundHandler = (req, res) => {
  return error(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, {
    stack: err.stack,
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
    const field = err.detail?.match(/\((.+)\)/)?.[1] || 'field';
    return error(res, `${field} already exists`, 409);
  }
  if (err.code === '23503') {  // foreign key violation
    return error(res, 'Referenced record not found', 400);
  }
  if (err.code === '22P02') {  // invalid UUID
    return error(res, 'Invalid ID format', 400);
  }

  // Default
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({ success: false, message: err.message, stack: err.stack });
  }
  return serverError(res);
};

module.exports = { notFoundHandler, errorHandler };
