const logger = require('../utils/logger');

let twilioClient = null;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

if (accountSid && authToken && fromPhone) {
  try {
    twilioClient = require('twilio')(accountSid, authToken);
  } catch (err) {
    logger.warn('Failed to initialize Twilio client:', err.message);
  }
}

const sendSms = async (to, body) => {
  if (twilioClient && fromPhone) {
    try {
      const message = await twilioClient.messages.create({
        body,
        from: fromPhone,
        to
      });
      logger.info(`[SMS] Message sent to ${to} via Twilio, SID: ${message.sid}`);
      return true;
    } catch (err) {
      logger.error(`[SMS] Twilio failed to send message to ${to}: ${err.message}`);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[SMS-DEV-LOG] Send to: ${to} | Body: ${body}`);
  }
  return false;
};

module.exports = { sendSms };
