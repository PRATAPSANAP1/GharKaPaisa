const logger = require('../../config/logger');
const axios = require('axios');

// ── MSG91 Config (Primary SMS Provider) ─────────────────────────────────────
const msg91AuthKey = process.env.MSG91_AUTH_KEY;
const msg91SenderId = process.env.MSG91_SENDER_ID || 'GHRKP';
const msg91Route = process.env.MSG91_ROUTE || '4';

// ── Twilio Config (Fallback SMS Provider) ───────────────────────────────────
let twilioClient = null;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

if (accountSid && authToken && fromPhone) {
  try {
    twilioClient = require('twilio')(accountSid, authToken);
    logger.info('[SMS] Twilio client initialized as fallback');
  } catch (err) {
    logger.warn('[SMS] Failed to initialize Twilio client:', err.message);
  }
}

if (msg91AuthKey) {
  logger.info('[SMS] MSG91 configured as primary SMS provider');
} else if (!twilioClient) {
  logger.warn('[SMS] No SMS provider configured — SMS sending will be disabled. Set MSG91_AUTH_KEY or TWILIO credentials in .env');
}

/**
 * Format mobile number to E.164 / 91XXXXXXXXXX format
 */
const formatMobile = (mobile) => {
  const clean = String(mobile).replace(/\D/g, '');
  if (clean.startsWith('91') && clean.length >= 12) return clean;
  if (clean.length === 10) return `91${clean}`;
  return clean;
};

/**
 * Send SMS via MSG91 Flow API or Twilio (fallback)
 */
const sendSms = async (to, body) => {
  const formattedTo = formatMobile(to);
  
  // 1. Try MSG91 first (primary)
  if (msg91AuthKey) {
    try {
      const templateId = process.env.MSG91_INVITE_TEMPLATE_ID;
      
      if (templateId) {
        // Use MSG91 Flow API with template
        await axios.post('https://api.msg91.com/api/v5/flow/', {
          template_id: templateId,
          short_url: '0',
          mobiles: formattedTo,
          VAR1: body,
        }, {
          headers: { authkey: msg91AuthKey, 'Content-Type': 'application/json' }
        });
      } else {
        // Use MSG91 Send SMS API (plain text)
        await axios.post('https://api.msg91.com/api/v5/flow/', {
          sender: msg91SenderId,
          route: msg91Route,
          country: '91',
          sms: [{
            message: body,
            to: [formattedTo]
          }]
        }, {
          headers: { authkey: msg91AuthKey, 'Content-Type': 'application/json' }
        });
      }

      logger.info(`[SMS] Message sent to ${formattedTo} via MSG91`);
      return true;
    } catch (err) {
      logger.error(`[SMS] MSG91 failed to send message to ${formattedTo}: ${err.response?.data?.message || err.message}`);
    }
  }

  // 2. Fallback to Twilio
  if (twilioClient && fromPhone) {
    try {
      const e164To = `+${formattedTo}`;
      const message = await twilioClient.messages.create({
        body,
        from: fromPhone,
        to: e164To
      });
      logger.info(`[SMS] Message sent to ${e164To} via Twilio, SID: ${message.sid}`);
      return true;
    } catch (err) {
      logger.error(`[SMS] Twilio failed to send message to ${formattedTo}: ${err.message}`);
    }
  }

  // 3. Dev log if no provider available
  if (!msg91AuthKey && !twilioClient) {
    logger.warn(`[SMS] No SMS provider available — skipping SMS to ${formattedTo}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[SMS-DEV-LOG] Send to: ${formattedTo} | Body: ${body}`);
  }
  return false;
};

/**
 * Send Step 1 Application Link SMS to Customer
 */
const sendApplyStep1Sms = async (to, customerName, productName, token) => {
  const applyUrl = `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/apply/${token}`;
  const body = `Dear ${customerName || 'Customer'}, complete your prefilled application for ${productName || 'Credit Card'} on GharKaPaisa: ${applyUrl}`;
  
  if (msg91AuthKey && process.env.MSG91_APPLY_STEP1_TEMPLATE_ID) {
    try {
      const formattedTo = formatMobile(to);
      await axios.post('https://api.msg91.com/api/v5/flow/', {
        template_id: process.env.MSG91_APPLY_STEP1_TEMPLATE_ID,
        short_url: '0',
        recipients: [{
          mobiles: formattedTo,
          name: customerName || 'Customer',
          product: productName || 'Credit Card',
          url: applyUrl
        }]
      }, {
        headers: { authkey: msg91AuthKey, 'Content-Type': 'application/json' }
      });
      logger.info(`[SMS] Step 1 Apply SMS sent to ${formattedTo} via MSG91 Flow`);
      return true;
    } catch (err) {
      logger.error(`[SMS] Failed sending Step 1 Flow SMS: ${err.message}`);
    }
  }

  return await sendSms(to, body);
};

/**
 * Send Step 2 Post-Apply Link SMS to Customer
 */
const sendPostApplyStep2Sms = async (to, customerName, productName, token) => {
  const postApplyUrl = `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/apply/${token}/post-apply`;
  const body = `Dear ${customerName || 'Customer'}, please submit your bank application ref & documents for ${productName || 'Credit Card'}: ${postApplyUrl}`;
  
  if (msg91AuthKey && process.env.MSG91_APPLY_STEP2_TEMPLATE_ID) {
    try {
      const formattedTo = formatMobile(to);
      await axios.post('https://api.msg91.com/api/v5/flow/', {
        template_id: process.env.MSG91_APPLY_STEP2_TEMPLATE_ID,
        short_url: '0',
        recipients: [{
          mobiles: formattedTo,
          name: customerName || 'Customer',
          product: productName || 'Credit Card',
          url: postApplyUrl
        }]
      }, {
        headers: { authkey: msg91AuthKey, 'Content-Type': 'application/json' }
      });
      logger.info(`[SMS] Step 2 Post-Apply SMS sent to ${formattedTo} via MSG91 Flow`);
      return true;
    } catch (err) {
      logger.error(`[SMS] Failed sending Step 2 Flow SMS: ${err.message}`);
    }
  }

  return await sendSms(to, body);
};

module.exports = { 
  sendSms,
  sendApplyStep1Sms,
  sendPostApplyStep2Sms
};

