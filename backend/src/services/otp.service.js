const twilio = require('twilio');
const { query } = require('../config/db');
const { generateOTP, hashOTP, sanitizeMobile } = require('../utils/helpers');
const logger = require('../utils/logger');

let twilioClient;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (e) {
  logger.warn('Twilio not configured; OTPs will be logged only');
}

const sendOTP = async (mobile, purpose = 'login') => {
  const otp = generateOTP();
  const otpHash = hashOTP(otp);
  const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRES_MINUTES) || 10) * 60000);
  const cleanMobile = sanitizeMobile(mobile);

  // Invalidate previous OTPs for same mobile + purpose
  await query(
    `UPDATE otps SET used = true WHERE mobile = $1 AND purpose = $2 AND used = false`,
    [cleanMobile, purpose]
  );

  // Store new OTP
  await query(
    `INSERT INTO otps (mobile, otp_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)`,
    [cleanMobile, otpHash, purpose, expiresAt]
  );

  // Send via Twilio
  if (twilioClient) {
    try {
      await twilioClient.messages.create({
        body: `Your FinEdge OTP is ${otp}. Valid for ${process.env.OTP_EXPIRES_MINUTES || 10} minutes. Do not share this with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: cleanMobile,
      });
      logger.info(`OTP sent to ${cleanMobile} for ${purpose}`);
    } catch (err) {
      logger.error(`Twilio SMS failed for ${cleanMobile}`, err.message);
    }
  } else {
    // Dev mode: log OTP
    logger.warn(`[DEV] OTP for ${cleanMobile}: ${otp}`);
  }

  return { sent: true, mobile: cleanMobile };
};

const verifyOTP = async (mobile, otp, purpose = 'login') => {
  const cleanMobile = sanitizeMobile(mobile);
  const otpHash = hashOTP(otp);

  const { rows } = await query(`
    SELECT id FROM otps
    WHERE mobile = $1 AND otp_hash = $2 AND purpose = $3
      AND used = false AND expires_at > NOW()
    ORDER BY created_at DESC LIMIT 1
  `, [cleanMobile, otpHash, purpose]);

  if (!rows.length) return false;

  // Mark as used
  await query(`UPDATE otps SET used = true WHERE id = $1`, [rows[0].id]);
  return true;
};

module.exports = { sendOTP, verifyOTP };
