const successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

const errorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors !== null && errors !== undefined) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse,
};

