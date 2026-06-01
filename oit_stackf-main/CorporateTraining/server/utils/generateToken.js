const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateTokens = (userId, role = 'student', sessionId = null) => {
  // Access Token (1 hour)
  const accessToken = jwt.sign({ id: userId, sessionId }, config.jwtSecret, {
    expiresIn: '1h',
  });

  // Refresh Token (7 days)
  const refreshToken = jwt.sign({ id: userId, sessionId }, config.jwtSecret, {
    expiresIn: '7d',
  });

  return { accessToken, refreshToken };
};

module.exports = generateTokens;

