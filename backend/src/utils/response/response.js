// Standard API response helpers

const success = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

const created = (res, data = {}, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

const error = (res, message = 'An error occurred', statusCode = 400, errors = null) => {
  const body = { success: false, message, timestamp: new Date().toISOString() };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

const unauthorized = (res, message = 'Unauthorized') => error(res, message, 401);
const forbidden = (res, message = 'Forbidden') => error(res, message, 403);
const notFound = (res, message = 'Resource not found') => error(res, message, 404);
const serverError = (res, message = 'Internal server error') => error(res, message, 500);

// Pagination helper
const paginate = (res, data, total, page, limit, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = { success, created, error, unauthorized, forbidden, notFound, serverError, paginate };
