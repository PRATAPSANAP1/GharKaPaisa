const { errorResponse } = require('../utils/apiResponse');

const admin = (req, res, next) => {
  if (!req.user) {
    return errorResponse(
      res,
      401,
      'Not authorized, authentication required before admin check'
    );
  }

  if (req.user.role !== 'admin') {
    return errorResponse(
      res,
      403,
      'Forbidden: Admin access required'
    );
  }

  next();
};

module.exports = admin;

