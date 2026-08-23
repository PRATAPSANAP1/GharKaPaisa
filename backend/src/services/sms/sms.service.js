const logger = require('../../config/logger');
const axios = require('axios');

// ── MSG91 Config (Primary SMS Provider) ─────────────────────────────────────
// Accepts either MSG91_AUTH_KEY or MSG91_AUTHKEY
const msg91AuthKey = process.env.MSG91_AUTH_KEY || process.env.MSG91_AUTHKEY;
const msg91SenderId = process.env.MSG91_SENDER_ID || 'GHARKP';
const msg91Route = process.env.MSG91_ROUTE || '4';

if (msg91AuthKey) {
  logger.info('[SMS] MSG91 configured as primary SMS provider');
} else {
  logger.warn('[SMS] MSG91_AUTH_KEY not set in .env — SMS sending will be disabled');
}

/**
 * Format mobile number to 91XXXXXXXXXX format (without + symbol for MSG91)
 */
const formatMobile = (mobile) => {
  const clean = String(mobile || '').replace(/\D/g, '');
  if (clean.startsWith('91') && clean.length >= 12) return clean;
  if (clean.length === 10) return `91${clean}`;
  return clean;
};

/**
 * Send Plain Text SMS via MSG91 Send SMS API
 */
const sendSms = async (to, body) => {
  const formattedTo = formatMobile(to);
  if (!formattedTo) return false;
  
  // Try MSG91 SMS API
  if (msg91AuthKey) {
    try {
      const url = `https://control.msg91.com/api/v5/sms/send`;
      const res = await axios.post(url, {
        sender: msg91SenderId,
        route: msg91Route,
        country: '91',
        sms: [{
          message: body,
          to: [formattedTo]
        }]
      }, {
        headers: {
          authkey: msg91AuthKey,
          'Content-Type': 'application/json',
          accept: 'application/json'
        }
      });

      logger.info(`[SMS] Plain Text MSG91 response for ${formattedTo}: ${JSON.stringify(res.data)}`);
      if (res.data && res.data.type !== 'error' && !res.data.hasError && res.data.code !== '401') {
        return true;
      }
    } catch (err) {
      logger.warn(`[SMS] MSG91 plain text SMS notice for ${formattedTo}: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[SMS-DEV-LOG] Send to: ${formattedTo} | Body: ${body}`);
  }
  return false;
};

/**
 * Generic MSG91 Flow API Helper with full fallback & detailed logging
 */
const sendMsg91FlowSms = async (to, templateId, varsMap, fallbackBody) => {
  const formattedTo = formatMobile(to);
  if (!formattedTo) return false;

  if (msg91AuthKey && templateId) {
    try {
      const url = `https://api.msg91.com/api/v5/flow/?authkey=${encodeURIComponent(msg91AuthKey)}`;
      const payload = {
        template_id: templateId,
        short_url: '0',
        recipients: [{
          mobiles: formattedTo,
          ...varsMap
        }]
      };

      const res = await axios.post(url, payload, {
        headers: { authkey: msg91AuthKey, 'Content-Type': 'application/json' }
      });

      logger.info(`[SMS-FLOW] MSG91 Flow (${templateId}) response for ${formattedTo}: ${JSON.stringify(res.data)}`);

      if (res.data && res.data.type !== 'error' && !res.data.hasError && res.data.code !== '400') {
        return true;
      }
      logger.warn(`[SMS-FLOW] MSG91 Flow returned error: ${JSON.stringify(res.data)}. Executing plain text fallback.`);
    } catch (err) {
      logger.error(`[SMS-FLOW] Failed sending MSG91 Flow SMS (${templateId}) to ${formattedTo}: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    }
  }

  // Fallback to standard SMS API
  return await sendSms(to, fallbackBody);
};

// ── 5 DLT SMS TEMPLATE IMPLEMENTATIONS ──────────────────────────────────────────

/**
 * 1. withdrawal_request (DLT Template ID: 6a8b2a55e4efabac9100d504 | Sender: GHARKP)
 * Preview: Dear ##var1##, your GharKaPaisa withdrawal request of Rs.##var2## has been received and is under processing. -GharKaPaisa -YOHESA MARKETING AND CONSULTATION PRIVATE LIMITED
 */
const sendWithdrawalRequestSms = async (to, partnerName, amount) => {
  const nameStr = partnerName || 'Partner';
  const amountStr = parseFloat(amount || 0).toFixed(2);
  const body = `Dear ${nameStr}, your GharKaPaisa withdrawal request of Rs.${amountStr} has been received and is under processing.\n-GharKaPaisa\n-YOHESA MARKETING AND CONSULTATION PRIVATE LIMITED`;
  const templateId = process.env.MSG91_WITHDRAWAL_REQUEST_TEMPLATE_ID || '6a8b2a55e4efabac9100d504';

  const varsMap = {
    var1: nameStr,
    var2: amountStr
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

/**
 * 2. apply_1 (DLT Template ID: 6a8b2b479cac2288a3094b42 | Sender: GHARKP)
 * Preview: Dear ##var1##, complete your prefilled application for ##var2## on GharKaPaisa: ##var3## - GharKaPaisa -YOHESA MARKETING AND CONSULTATION PRIVATE LIMITED
 */
const sendApply1Sms = async (to, customerName, productName, applyUrl) => {
  const nameStr = customerName || 'Customer';
  const prodStr = productName || 'Credit Card';
  const urlStr = String(applyUrl || '');
  const body = `Dear ${nameStr}, complete your prefilled application for ${prodStr} on GharKaPaisa: ${urlStr} - GharKaPaisa\n-YOHESA MARKETING AND CONSULTATION PRIVATE LIMITED`;
  const templateId = process.env.MSG91_APPLY_1_TEMPLATE_ID || process.env.MSG91_APPLY_STEP1_TEMPLATE_ID || '6a8b2b479cac2288a3094b42';

  const varsMap = {
    var1: nameStr,
    var2: prodStr,
    var3: urlStr
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

// Aliased wrapper for backwards compatibility
const sendApplyStep1Sms = async (to, customerName, productName, token) => {
  const applyUrl = String(token || '').startsWith('http') ? token : `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/apply/${token}`;
  return await sendApply1Sms(to, customerName, productName, applyUrl);
};

/**
 * 3. track (DLT Template ID: 6a8b2ba19aad595e3402bb84 | Sender: GHARKP)
 * Preview: Dear ##alp##, please track and update your ##var1## application using this link: ##var2## - GharKaPaisa -YOHESA MARKETING AND CONSULTATION PRIVATE LIMITED
 */
const sendTrackSms = async (to, name, productName, trackUrl) => {
  const nameStr = name || 'Customer';
  const prodStr = productName || 'Credit Card';
  const urlStr = String(trackUrl || '');
  const body = `Dear ${nameStr}, please track and update your ${prodStr} application using this link: ${urlStr} - GharKaPaisa\n-YOHESA MARKETING AND CONSULTATION PRIVATE LIMITED`;
  const templateId = process.env.MSG91_TRACK_TEMPLATE_ID || '6a8b2ba19aad595e3402bb84';

  const varsMap = {
    alp: nameStr,
    var1: prodStr,
    var2: urlStr
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

/**
 * 4. withdrawal_failed (DLT Template ID: 6a8b2c0786535440540f8554 | Sender: GHARKP)
 * Preview: Dear ##var1##, your GharKaPaisa withdrawal request of Rs.##var2## could not be processed. Please check your registered bank details. -GharKaPaisa -YOHESA MARKETING AND CONSULTATION PRIVATE LIMITED
 */
const sendWithdrawalFailedSms = async (to, partnerName, amount) => {
  const nameStr = partnerName || 'Partner';
  const amountStr = parseFloat(amount || 0).toFixed(2);
  const body = `Dear ${nameStr}, your GharKaPaisa withdrawal request of Rs.${amountStr} could not be processed. Please check your registered bank details.\n-GharKaPaisa\n-YOHESA MARKETING AND CONSULTATION PRIVATE LIMITED`;
  const templateId = process.env.MSG91_WITHDRAWAL_FAILED_TEMPLATE_ID || '6a8b2c0786535440540f8554';

  const varsMap = {
    var1: nameStr,
    var2: amountStr
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

/**
 * 5. application_status (DLT Template ID: 6a8b2c5e05a2ec7fac0b3909 | Sender: GHARKP)
 * Preview: Dear ##var1##, your ##var2##application status has been updated to ##var3## -GharKaPaisa -YOHESA MARKETING AND CONSULTATION PRIVATE LIMITED
 */
const sendApplicationStatusSms = async (to, customerName, productName, statusText) => {
  const nameStr = customerName || 'Customer';
  const prodStr = productName ? (productName.endsWith(' ') ? productName : `${productName} `) : 'Credit Card ';
  const statusStr = String(statusText || 'Updated').toUpperCase();
  const body = `Dear ${nameStr}, your ${prodStr}application status has been updated to ${statusStr}\n-GharKaPaisa\n-YOHESA MARKETING AND CONSULTATION PRIVATE LIMITED`;
  const templateId = process.env.MSG91_APPLICATION_STATUS_TEMPLATE_ID || process.env.MSG91_LEAD1_TEMPLATE_ID || '6a8b2c5e05a2ec7fac0b3909';

  const varsMap = {
    var1: nameStr,
    var2: prodStr,
    var3: statusStr
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

/**
 * Additional Flow API Wrappers
 */
const sendPostApplyStep2Sms = async (to, customerName, productName, token) => {
  const postApplyUrl = String(token || '').startsWith('http') ? token : `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/apply/${token}/post-apply`;
  return await sendTrackSms(to, customerName, productName, postApplyUrl);
};

const sendUploadReminderSms = async (to, customerName, appNumber, uploadUrl) => {
  return await sendTrackSms(to, customerName, appNumber || 'Credit Card', uploadUrl);
};

const sendLeadStatusSms = async (to, customerName, productOrDetail, statusText = 'UPDATED') => {
  return await sendApplicationStatusSms(to, customerName, productOrDetail, statusText);
};

const sendPartnerInviteSms = async (to, inviterName, loginUrl) => {
  const targetUrl = loginUrl || `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/login`;
  const body = `Welcome to GharKaPaisa! You have been added as a Team Member by ${inviterName || 'Partner'}. Login here: ${targetUrl}`;
  const templateId = process.env.MSG91_PARTNER_INVITES_TEMPLATE_ID || '1277178655019181250';

  const varsMap = {
    var1: targetUrl,
    var2: inviterName || 'Partner'
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

const sendKycStatusUpdateSms = async (to, partnerName, statusText) => {
  const body = `Dear ${partnerName || 'Partner'}, your KYC status is updated to ${statusText || 'Updated'} . - GharKaPaisa`;
  const templateId = process.env.MSG91_KYC_STATUS_TEMPLATE_ID || '1277178697430872410';

  const varsMap = {
    var1: partnerName || 'Partner',
    var2: statusText || 'Updated'
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

const sendCommissionCreditedSms = async (to, partnerName, amount) => {
  const body = `Dear ${partnerName || 'Partner'}, commission of Rs.${amount || '0'} has been credited to wallet. - GharKaPaisa`;
  const templateId = process.env.MSG91_COMMISSION_CREDITED_TEMPLATE_ID || '1277178697043413151';

  const varsMap = {
    var1: partnerName || 'Partner',
    var2: String(amount || '0')
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

const sendPayoutReceiptSms = async (to, partnerName, amount, utr) => {
  const body = `Dear ${partnerName || 'Partner'}, your payout of Rs.${amount || '0'} has been credited to bank account with UTR: ${utr || 'N/A'}. - GharKaPaisa`;
  const templateId = process.env.MSG91_PAYOUT_RECEIPT_TEMPLATE_ID || '1277178697170936114';

  const varsMap = {
    var1: partnerName || 'Partner',
    var2: String(amount || '0'),
    var3: utr || 'N/A'
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

/**
 * Standard Catalog of All Platform SMS Templates
 */
const SMS_TEMPLATES = {
  PAYOUT_CONFIRMATION: (name, amount) =>
    `Dear ${name || 'Partner'}, your payout of Rs.${amount} has been successfully processed. - GharKaPaisa`,
  PAYOUT_UTR: (amount, utr) =>
    `Your payout of Rs.${amount} has been credited to bank account with UTR: ${utr}. - GharKaPaisa`,
  APPLY_STEP1: (name, url) =>
    `Dear ${name || 'Customer'}, complete your prefilled application for Credit Card on GharKaPaisa: ${url} - GharKaPaisa`,
  APPLY_STEP2: (name, url) =>
    `Dear ${name || 'Customer'}, please track and update your application using this link: ${url} - GharKaPaisa`,
  LEAD_APPROVED: (name, product) =>
    `Dear ${name || 'Customer'}, your ${product} application status has been updated to APPROVED - GharKaPaisa`,
  LEAD_REJECTED: (name, product) =>
    `Dear ${name || 'Customer'}, your ${product} application status has been updated to REJECTED - GharKaPaisa`,
  COMMISSION_CREDITED: (name, amount) =>
    `Dear ${name || 'Partner'}, commission of Rs.${amount} has been credited to wallet. - GharKaPaisa`,
  KYC_UPDATE: (name, status) =>
    `Dear ${name || 'Partner'}, your KYC status is updated to ${status} . - GharKaPaisa`,
  OTP_VERIFICATION: (otp) =>
    `Your GharKaPaisa verification OTP is ${otp}. Valid for 10 minutes. Do not share.`,
  GENERIC_NOTIFICATION: (name, message) =>
    `Dear ${name || 'User'}, ${message} - GharKaPaisa`
};

const sendGenericNotificationSms = async (to, recipientName, messageContent) => {
  const body = SMS_TEMPLATES.GENERIC_NOTIFICATION(recipientName, messageContent);
  return await sendSms(to, body);
};

module.exports = { 
  sendSms,
  sendGenericNotificationSms,
  sendWithdrawalRequestSms,
  sendApply1Sms,
  sendApplyStep1Sms,
  sendPostApplyStep2Sms,
  sendTrackSms,
  sendWithdrawalFailedSms,
  sendApplicationStatusSms,
  sendUploadReminderSms,
  sendPartnerInviteSms,
  sendKycStatusUpdateSms,
  sendCommissionCreditedSms,
  sendLeadStatusSms,
  sendPayoutReceiptSms,
  SMS_TEMPLATES
};

