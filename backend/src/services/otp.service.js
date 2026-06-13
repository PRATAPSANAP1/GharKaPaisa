const twilio = require('twilio');
const { sanitizeMobile } = require('../utils/helpers');
const logger = require('../utils/logger');

// ── Dev OTP Bypass ─────────────────────────────────────────────────────────────
// When DEV_OTP_BYPASS=true, all OTP sends are no-ops and
// DEV_OTP_CODE (default "111111") is accepted as a valid OTP for any mobile.
const IS_DEV_BYPASS = process.env.DEV_OTP_BYPASS === 'true';
const DEV_CODE      = process.env.DEV_OTP_CODE || '111111';

if (IS_DEV_BYPASS) {
  logger.warn(`[DEV] OTP bypass enabled — use "${DEV_CODE}" as OTP for all numbers`);
}

// ── Twilio Verify client ───────────────────────────────────────────────────────
let twilioClient;
let VERIFY_SERVICE_SID;

try {
  if (!IS_DEV_BYPASS && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!VERIFY_SERVICE_SID) {
      logger.warn('TWILIO_VERIFY_SERVICE_SID not set — OTPs will not be sent');
    }
  }
} catch (e) {
  logger.warn('Twilio not configured; OTPs will be logged only');
}

// ── sendOTP ───────────────────────────────────────────────────────────────────
// Uses Twilio Verify API — no DB storage needed; Twilio manages OTP lifecycle.
const sendOTP = async (mobile, purpose = 'login') => {
  const cleanMobile = sanitizeMobile(mobile);

  // In dev-bypass mode: skip Twilio entirely
  if (IS_DEV_BYPASS) {
    logger.warn(`[DEV BYPASS] OTP send skipped for ${cleanMobile} (${purpose}). Use "${DEV_CODE}".`);
    return { sent: true, mobile: cleanMobile, dev: true };
  }

  if (!twilioClient || !VERIFY_SERVICE_SID) {
    logger.error('Twilio Verify not configured');
    throw new Error('OTP service unavailable');
  }

  try {
    const verification = await twilioClient.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications
      .create({ to: cleanMobile, channel: 'sms' });

    logger.info(`OTP sent to ${cleanMobile} for ${purpose} — status: ${verification.status}`);
    return { sent: true, mobile: cleanMobile };
  } catch (err) {
    logger.error(`Twilio Verify send failed for ${cleanMobile}`, err.message);
    throw new Error(err.message || 'Failed to send OTP');
  }
};

// ── verifyOTP ─────────────────────────────────────────────────────────────────
// Delegates OTP check to Twilio Verify — no DB lookup required.
const verifyOTP = async (mobile, otp, purpose = 'login') => {
  const cleanMobile = sanitizeMobile(mobile);

  // In dev-bypass mode: accept the magic code
  if (IS_DEV_BYPASS && otp === DEV_CODE) {
    logger.warn(`[DEV BYPASS] OTP accepted for ${cleanMobile} (${purpose})`);
    return true;
  }

  if (!twilioClient || !VERIFY_SERVICE_SID) {
    logger.error('Twilio Verify not configured');
    return false;
  }

  try {
    const check = await twilioClient.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verificationChecks
      .create({ to: cleanMobile, code: otp });

    logger.info(`OTP verify for ${cleanMobile}: status=${check.status}, valid=${check.valid}`);
    return check.status === 'approved' && check.valid === true;
  } catch (err) {
    logger.error(`Twilio Verify check failed for ${cleanMobile}`, err.message);
    return false;
  }
};

module.exports = { sendOTP, verifyOTP };
