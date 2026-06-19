const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'gharkapaisa-secret-key-fallback');
if (!JWT_SECRET) {
  logger.error('FATAL ERROR: JWT_SECRET environment variable is not defined in production.');
  process.exit(1);
}

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? null : 'gharkapaisa-refresh-key-fallback');
if (!JWT_REFRESH_SECRET) {
  logger.error('FATAL ERROR: JWT_REFRESH_SECRET environment variable is not defined in production.');
  process.exit(1);
}

const OTP_PEPPER = process.env.OTP_PEPPER || 'gharkapaisa-otp-pepper-default';

module.exports = {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  OTP_PEPPER
};
