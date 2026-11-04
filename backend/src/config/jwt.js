const logger = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'oitstack-secret-key-fallback');
if (!JWT_SECRET) {
  const errMsg = 'FATAL ERROR: JWT_SECRET environment variable is not defined in production.';
  logger.error(errMsg);
  throw new Error(errMsg);
}

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? null : 'oitstack-refresh-key-fallback');
if (!JWT_REFRESH_SECRET) {
  const errMsg = 'FATAL ERROR: JWT_REFRESH_SECRET environment variable is not defined in production.';
  logger.error(errMsg);
  throw new Error(errMsg);
}

const OTP_PEPPER = process.env.OTP_PEPPER || (process.env.NODE_ENV === 'production' ? null : 'oitstack-otp-pepper-default');
if (!OTP_PEPPER) {
  const errMsg = 'FATAL ERROR: OTP_PEPPER environment variable is not defined in production.';
  logger.error(errMsg);
  throw new Error(errMsg);
}

module.exports = {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  OTP_PEPPER
};
