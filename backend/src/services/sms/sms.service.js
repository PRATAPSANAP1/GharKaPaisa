const logger = require('../../config/logger');
const axios = require('axios');

// ── MSG91 Config (Primary SMS Provider) ─────────────────────────────────────
const msg91AuthKey = process.env.MSG91_AUTH_KEY;
const msg91SenderId = process.env.MSG91_SENDER_ID || 'GHARKP';
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
 * Send Step 1 Application Link SMS to Customer (DLT Template ID: 1277178678509565584 | Sender: GHARKP)
 */
const sendApplyStep1Sms = async (to, customerName, productName, token) => {
  const applyUrl = String(token || '').startsWith('http') ? token : `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/apply/${token}`;
  const body = `Dear ${customerName || 'Customer'} , complete your prefilled application for ${productName || 'Credit Card'} on GharKaPaisa: ${applyUrl} - GharKaPaisa`;
  const templateId = process.env.MSG91_APPLY_STEP1_TEMPLATE_ID || '1277178678509565584';

  if (msg91AuthKey) {
    try {
      const formattedTo = formatMobile(to);
      await axios.post('https://api.msg91.com/api/v5/flow/', {
        template_id: templateId,
        short_url: '0',
        recipients: [{
          mobiles: formattedTo,
          var1: customerName || 'Customer',
          var2: productName || 'Credit Card',
          var3: applyUrl,
          name: customerName || 'Customer',
          product: productName || 'Credit Card',
          url: applyUrl
        }]
      }, {
        headers: { authkey: msg91AuthKey, 'Content-Type': 'application/json' }
      });
      logger.info(`[SMS] Step 1 Apply SMS sent to ${formattedTo} via MSG91 Flow (Template: ${templateId})`);
      return true;
    } catch (err) {
      logger.error(`[SMS] Failed sending Step 1 Flow SMS: ${err.message}`);
    }
  }

  return await sendSms(to, body);
};

/**
 * Send Step 2 Post-Apply Link SMS to Customer (DLT Template ID: 1277178655941470854 | Sender: GHARKP)
 */
const sendPostApplyStep2Sms = async (to, customerName, productName, token) => {
  const postApplyUrl = `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/apply/${token}/post-apply`;
  const body = `Dear ${customerName || 'Customer'}, please submit your bank application ref & documents for ${productName || 'Credit Card'}: ${postApplyUrl} - GharKaPaisa`;
  const templateId = process.env.MSG91_APPLY_STEP2_TEMPLATE_ID || '1277178655941470854';
  
  if (msg91AuthKey) {
    try {
      const formattedTo = formatMobile(to);
      await axios.post('https://api.msg91.com/api/v5/flow/', {
        template_id: templateId,
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
      logger.info(`[SMS] Step 2 Post-Apply SMS sent to ${formattedTo} via MSG91 Flow (Template: ${templateId})`);
      return true;
    } catch (err) {
      logger.error(`[SMS] Failed sending Step 2 Flow SMS: ${err.message}`);
    }
  }

  return await sendSms(to, body);
};

/**
 * Send Upload Documents Reminder SMS (DLT Template ID: 1277178655031889758 | Sender: GHARKP)
 */
const sendUploadReminderSms = async (to, customerName, appNumber, uploadUrl) => {
  const body = `Dear ${customerName || 'Customer'}, please complete your application ${appNumber || ''} by uploading required documents: ${uploadUrl} - Thanks, GharKaPaisa`;
  const templateId = process.env.MSG91_UPLOAD_REMINDER_TEMPLATE_ID || '1277178655031889758';

  if (msg91AuthKey) {
    try {
      const formattedTo = formatMobile(to);
      await axios.post('https://api.msg91.com/api/v5/flow/', {
        template_id: templateId,
        short_url: '0',
        recipients: [{
          mobiles: formattedTo,
          var1: customerName || 'Customer',
          var2: appNumber || 'ref',
          var3: uploadUrl
        }]
      }, {
        headers: { authkey: msg91AuthKey, 'Content-Type': 'application/json' }
      });
      logger.info(`[SMS] Upload Reminder SMS sent to ${formattedTo} via MSG91 Flow (Template: ${templateId})`);
      return true;
    } catch (err) {
      logger.error(`[SMS] Failed sending Upload Reminder SMS: ${err.message}`);
    }
  }

  return await sendSms(to, body);
};

/**
 * Send Partner / Team Invite SMS (DLT Template ID: 1277178655019181250 | Sender: GHARKP)
 */
const sendPartnerInviteSms = async (to, inviterName, loginUrl) => {
  const targetUrl = loginUrl || `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/login`;
  const body = `Welcome to GharKaPaisa! You have been added as a Team Member by ${inviterName || 'Partner'}. Login here: ${targetUrl}`;
  const templateId = process.env.MSG91_PARTNER_INVITES_TEMPLATE_ID || '1277178655019181250';

  if (msg91AuthKey) {
    try {
      const formattedTo = formatMobile(to);
      await axios.post('https://api.msg91.com/api/v5/flow/', {
        template_id: templateId,
        short_url: '0',
        recipients: [{
          mobiles: formattedTo,
          var1: targetUrl,
          var2: inviterName || 'Partner'
        }]
      }, {
        headers: { authkey: msg91AuthKey, 'Content-Type': 'application/json' }
      });
      logger.info(`[SMS] Partner Invite SMS sent to ${formattedTo} via MSG91 Flow (Template: ${templateId})`);
      return true;
    } catch (err) {
      logger.error(`[SMS] Failed sending Partner Invite SMS: ${err.message}`);
    }
  }

  return await sendSms(to, body);
};

/**
 * Send KYC Status Update SMS (DLT Template ID: 1277178697430872410 | Sender: GHARKP)
 */
const sendKycStatusUpdateSms = async (to, partnerName, statusText) => {
  const body = `Dear ${partnerName || 'Partner'}, your KYC status is updated to ${statusText || 'Updated'} . - GharKaPaisa`;
  const templateId = process.env.MSG91_KYC_STATUS_TEMPLATE_ID || '1277178697430872410';

  if (msg91AuthKey) {
    try {
      const formattedTo = formatMobile(to);
      await axios.post('https://api.msg91.com/api/v5/flow/', {
        template_id: templateId,
        short_url: '0',
        recipients: [{
          mobiles: formattedTo,
          var1: partnerName || 'Partner',
          var2: statusText || 'Updated'
        }]
      }, {
        headers: { authkey: msg91AuthKey, 'Content-Type': 'application/json' }
      });
      logger.info(`[SMS] KYC Status Update SMS sent to ${formattedTo} via MSG91 Flow (Template: ${templateId})`);
      return true;
    } catch (err) {
      logger.error(`[SMS] Failed sending KYC Status Update SMS: ${err.message}`);
    }
  }

  return await sendSms(to, body);
};

/**
 * Send Commission Credited SMS (DLT Template ID: 1277178697043413151 | Sender: GHARKP)
 */
const sendCommissionCreditedSms = async (to, partnerName, amount) => {
  const body = `Dear ${partnerName || 'Partner'}, commission of Rs.${amount || '0'} has been credited to wallet. - GharKaPaisa`;
  const templateId = process.env.MSG91_COMMISSION_CREDITED_TEMPLATE_ID || '1277178697043413151';

  if (msg91AuthKey) {
    try {
      const formattedTo = formatMobile(to);
      await axios.post('https://api.msg91.com/api/v5/flow/', {
        template_id: templateId,
        short_url: '0',
        recipients: [{
          mobiles: formattedTo,
          var1: partnerName || 'Partner',
          var2: String(amount || '0')
        }]
      }, {
        headers: { authkey: msg91AuthKey, 'Content-Type': 'application/json' }
      });
      logger.info(`[SMS] Commission Credited SMS sent to ${formattedTo} via MSG91 Flow (Template: ${templateId})`);
      return true;
    } catch (err) {
      logger.error(`[SMS] Failed sending Commission Credited SMS: ${err.message}`);
    }
  }

  return await sendSms(to, body);
};

/**
 * Send Lead Status SMS (DLT Template ID: 1277178697004117991 | Sender: GHARKP)
 */
const sendLeadStatusSms = async (to, customerName, productOrDetail) => {
  const body = `Dear ${customerName || 'Customer'}, your application for ${productOrDetail || 'Credit Card'}! - GharKaPaisa`;
  const templateId = process.env.MSG91_LEAD1_TEMPLATE_ID || '1277178697004117991';

  if (msg91AuthKey) {
    try {
      const formattedTo = formatMobile(to);
      await axios.post('https://api.msg91.com/api/v5/flow/', {
        template_id: templateId,
        short_url: '0',
        recipients: [{
          mobiles: formattedTo,
          var1: customerName || 'Customer',
          var2: productOrDetail || 'Credit Card'
        }]
      }, {
        headers: { authkey: msg91AuthKey, 'Content-Type': 'application/json' }
      });
      logger.info(`[SMS] Lead Status SMS sent to ${formattedTo} via MSG91 Flow (Template: ${templateId})`);
      return true;
    } catch (err) {
      logger.error(`[SMS] Failed sending Lead Status SMS: ${err.message}`);
    }
  }

  return await sendSms(to, body);
};

/**
 * Standard Catalog of All Platform SMS Templates
 * Note: Strictly <= 2 variables per template for DLT / MSG91 compliance.
 */
const SMS_TEMPLATES = {
  // 1. Payout Confirmation (2 variables: {name}, {amount})
  PAYOUT_CONFIRMATION: (name, amount) =>
    `Dear ${name || 'Partner'}, your payout of Rs.${amount} has been successfully processed. - GharKaPaisa`,

  // 2. Payout UTR Receipt (2 variables: {amount}, {utr})
  PAYOUT_UTR: (amount, utr) =>
    `Your payout of Rs.${amount} has been credited to bank account with UTR: ${utr}. - GharKaPaisa`,

  // 3. Application Step 1 Link (2 variables: {name}, {url})
  APPLY_STEP1: (name, url) =>
    `Dear ${name || 'Customer'}, complete your prefilled application on GharKaPaisa: ${url}`,

  // 4. Document Submission Step 2 Link (2 variables: {name}, {url})
  APPLY_STEP2: (name, url) =>
    `Dear ${name || 'Customer'}, submit bank application ref & documents: ${url} - GharKaPaisa`,

  // 5. Lead Approved (2 variables: {name}, {product})
  LEAD_APPROVED: (name, product) =>
    `Dear ${name || 'Customer'}, your application for ${product}! - GharKaPaisa`,

  // 6. Lead Rejected (2 variables: {name}, {product})
  LEAD_REJECTED: (name, product) =>
    `Dear ${name || 'Customer'}, your application for ${product}! - GharKaPaisa`,

  // 7. Commission Credited (2 variables: {name}, {amount})
  COMMISSION_CREDITED: (name, amount) =>
    `Dear ${name || 'Partner'}, commission of Rs.${amount} has been credited to wallet. - GharKaPaisa`,

  // 8. KYC Status Update (2 variables: {name}, {status})
  KYC_UPDATE: (name, status) =>
    `Dear ${name || 'Partner'}, your KYC status is updated to ${status} . - GharKaPaisa`,

  // 9. OTP Verification (1 variable: {otp})
  OTP_VERIFICATION: (otp) =>
    `Your GharKaPaisa verification OTP is ${otp}. Valid for 10 minutes. Do not share.`,

  // 10. Common Generic Notification (2 variables: {name}, {message})
  GENERIC_NOTIFICATION: (name, message) =>
    `Dear ${name || 'User'}, ${message} - GharKaPaisa`
};

/**
 * Generic Transactional SMS Template function usable anywhere on the platform
 */
const sendGenericNotificationSms = async (to, recipientName, messageContent) => {
  const body = SMS_TEMPLATES.GENERIC_NOTIFICATION(recipientName, messageContent);
  return await sendSms(to, body);
};

module.exports = { 
  sendSms,
  sendGenericNotificationSms,
  sendApplyStep1Sms,
  sendPostApplyStep2Sms,
  sendUploadReminderSms,
  sendPartnerInviteSms,
  sendKycStatusUpdateSms,
  sendCommissionCreditedSms,
  sendLeadStatusSms,
  SMS_TEMPLATES
};

