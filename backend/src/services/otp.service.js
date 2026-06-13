/**
 * otp.service.js — DEPRECATED
 * ─────────────────────────────────────────────────────────────────────────
 * Twilio OTP has been removed. OTP is now handled client-side by Firebase
 * Phone Auth. This file is kept as a tombstone to avoid import errors
 * during transition. Safe to delete once all imports are removed.
 */

const logger = require('../utils/logger');

const sendOTP = async () => {
  logger.warn('otp.service.js is deprecated. OTP is handled by Firebase Auth.');
  throw new Error('OTP service deprecated. Use Firebase Phone Auth on the client.');
};

const verifyOTP = async () => {
  logger.warn('otp.service.js is deprecated. OTP is handled by Firebase Auth.');
  return false;
};

module.exports = { sendOTP, verifyOTP };
