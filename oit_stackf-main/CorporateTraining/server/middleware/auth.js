const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const { errorResponse } = require('../utils/apiResponse');

const auth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 401, 'Not authorized, no token provided');
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return errorResponse(res, 401, 'Not authorized, user not found');
    }

    if (user.activeSessionId && decoded.sessionId !== user.activeSessionId) {
      return errorResponse(res, 401, 'Session expired or logged in from another device');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'Not authorized, invalid token');
    }

    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Not authorized, token has expired');
    }

    return errorResponse(res, 401, 'Not authorized');
  }
};

module.exports = auth;

