const twilio = require('twilio');
const { query } = require('../config/db');
const { generateOTP, hashOTP, sanitizeMobile } = require('../utils/helpers');
const logger = require('../utils/logger');

// ── Dev OTP Bypass ─────────────────────────────────────────────────────────────
// When DEV_OTP_BYPASS=true, all OTP sends are no-ops and
// DEV_OTP_CODE (default "111111") is accepted as a valid OTP for any mobile.
const IS_DEV_BYPASS = process.env.DEV_OTP_BYPASS === 'true';
const DEV_CODE      = process.env.DEV_OTP_CODE || '111111';

if (IS_DEV_BYPASS) {
  logger.warn(`[DEV] OTP bypass enabled — use "${DEV_CODE}" as OTP for all numbers`);
}

// ── Twilio client (only initialised when NOT in bypass mode) ──────────────────
let twilioClient;
try {
  if (!IS_DEV_BYPASS && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (e) {
  logger.warn('Twilio not configured; OTPs will be logged only');
}

// ── sendOTP ───────────────────────────────────────────────────────────────────
const sendOTP = async (mobile, purpose = 'login') => {
  const cleanMobile = sanitizeMobile(mobile);

  // In dev-bypass mode: skip DB + Twilio entirely
  if (IS_DEV_BYPASS) {
    logger.warn(`[DEV BYPASS] OTP send skipped for ${cleanMobile} (${purpose}). Use "${DEV_CODE}".`);
    return { sent: true, mobile: cleanMobile, dev: true };
  }

  const otp      = generateOTP();
  const otpHash  = hashOTP(otp);
  const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRES_MINUTES) || 10) * 60000);

  // Invalidate previous OTPs for same mobile + purpose
  await query(
    `UPDATE otps SET used = true WHERE mobile = $1 AND purpose = $2 AND used = false`,
    [cleanMobile, purpose]
  );

  // Store new OTP hash
  await query(
    `INSERT INTO otps (mobile, otp_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)`,
    [cleanMobile, otpHash, purpose, expiresAt]
  );

  // Send via Twilio
  if (twilioClient) {
    try {
      await twilioClient.messages.create({
        body: `Your GharKaPaisa OTP is ${otp}. Valid for ${process.env.OTP_EXPIRES_MINUTES || 10} minutes. Do not share this with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: cleanMobile,
      });
      logger.info(`OTP sent to ${cleanMobile} for ${purpose}`);
    } catch (err) {
      logger.error(`Twilio SMS failed for ${cleanMobile}`, err.message);
    }
  } else {
    // No Twilio configured — log OTP for debugging
    logger.warn(`[DEV] OTP for ${cleanMobile} (${purpose}): ${otp}`);
  }

  return { sent: true, mobile: cleanMobile };
};

// ── verifyOTP ─────────────────────────────────────────────────────────────────
const verifyOTP = async (mobile, otp, purpose = 'login') => {
  const cleanMobile = sanitizeMobile(mobile);

  // In dev-bypass mode: accept the magic code without touching DB
  if (IS_DEV_BYPASS && otp === DEV_CODE) {
    logger.warn(`[DEV BYPASS] OTP accepted for ${cleanMobile} (${purpose})`);
    return true;
  }

  // Production: hash and check DB
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
