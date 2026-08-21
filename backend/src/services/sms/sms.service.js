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

/**
 * Send Step 1 Application Link SMS to Customer (DLT Template ID: 1277178678509565584 | Sender: GHARKP)
 * Uses clean variables: var1, var2, var3
 */
const sendApplyStep1Sms = async (to, customerName, productName, token) => {
  const applyUrl = String(token || '').startsWith('http') ? token : `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/apply/${token}`;
  const body = `Dear ${customerName || 'Customer'} , complete your prefilled application for ${productName || 'Credit Card'} on GharKaPaisa: ${applyUrl} - GharKaPaisa`;
  const templateId = process.env.MSG91_APPLY_STEP1_TEMPLATE_ID || '1277178678509565584';

  const varsMap = {
    var1: customerName || 'Customer',
    var2: productName || 'Credit Card',
    var3: applyUrl
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

/**
 * Send Step 2 Post-Apply Link SMS to Customer (DLT Template ID: 1277178655941470854 | Sender: GHARKP)
 * Uses clean variables: name, product, url
 */
const sendPostApplyStep2Sms = async (to, customerName, productName, token) => {
  const postApplyUrl = String(token || '').startsWith('http') ? token : `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/apply/${token}/post-apply`;
  const body = `Dear ${customerName || 'Customer'}, please submit your bank application ref & documents for ${productName || 'Credit Card'}: ${postApplyUrl} - GharKaPaisa`;
  const templateId = process.env.MSG91_APPLY_STEP2_TEMPLATE_ID || '1277178655941470854';

  const varsMap = {
    name: customerName || 'Customer',
    product: productName || 'Credit Card',
    url: postApplyUrl
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

/**
 * Send Apply 2 SMS (DLT Template ID: 1277178697669731121 | Sender: GHARKP)
 */
const sendApply2Sms = async (to, customerName, productName, applyUrl) => {
  const body = `Dear ${customerName || 'Customer'} , complete your prefilled application for ${productName || 'Credit Card'} on GharKaPaisa: ${applyUrl} - GharKaPaisa`;
  const templateId = process.env.MSG91_APPLY_2_TEMPLATE_ID || '1277178697669731121';

  const varsMap = {
    var1: customerName || 'Customer',
    var2: productName || 'Credit Card',
    var3: applyUrl
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

/**
 * Send Upload Documents Reminder SMS (DLT Template ID: 1277178655031889758 | Sender: GHARKP)
 */
const sendUploadReminderSms = async (to, customerName, appNumber, uploadUrl) => {
  const body = `Dear ${customerName || 'Customer'}, please complete your application ${appNumber || ''} by uploading required documents: ${uploadUrl} - Thanks, GharKaPaisa`;
  const templateId = process.env.MSG91_UPLOAD_REMINDER_TEMPLATE_ID || '1277178655031889758';

  const varsMap = {
    var1: customerName || 'Customer',
    var2: appNumber || 'ref',
    var3: uploadUrl
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

/**
 * Send Partner / Team Invite SMS (DLT Template ID: 1277178655019181250 | Sender: GHARKP)
 */
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

/**
 * Send KYC Status Update SMS (DLT Template ID: 1277178697430872410 | Sender: GHARKP)
 */
const sendKycStatusUpdateSms = async (to, partnerName, statusText) => {
  const body = `Dear ${partnerName || 'Partner'}, your KYC status is updated to ${statusText || 'Updated'} . - GharKaPaisa`;
  const templateId = process.env.MSG91_KYC_STATUS_TEMPLATE_ID || '1277178697430872410';

  const varsMap = {
    var1: partnerName || 'Partner',
    var2: statusText || 'Updated'
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

/**
 * Send Commission Credited SMS (DLT Template ID: 1277178697043413151 | Sender: GHARKP)
 */
const sendCommissionCreditedSms = async (to, partnerName, amount) => {
  const body = `Dear ${partnerName || 'Partner'}, commission of Rs.${amount || '0'} has been credited to wallet. - GharKaPaisa`;
  const templateId = process.env.MSG91_COMMISSION_CREDITED_TEMPLATE_ID || '1277178697043413151';

  const varsMap = {
    var1: partnerName || 'Partner',
    var2: String(amount || '0')
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

/**
 * Send Lead Status SMS (DLT Template ID: 1277178697004117991 | Sender: GHARKP)
 */
const sendLeadStatusSms = async (to, customerName, productOrDetail) => {
  const body = `Dear ${customerName || 'Customer'}, your application for ${productOrDetail || 'Credit Card'}! - GharKaPaisa`;
  const templateId = process.env.MSG91_LEAD1_TEMPLATE_ID || '1277178697004117991';

  const varsMap = {
    var1: customerName || 'Customer',
    var2: productOrDetail || 'Credit Card'
  };

  return await sendMsg91FlowSms(to, templateId, varsMap, body);
};

/**
 * Send Payout Receipt SMS (DLT Template ID: 1277178697170936114 | Sender: GHARKP)
 */
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
    `Dear ${name || 'Customer'}, complete your prefilled application on GharKaPaisa: ${url}`,
  APPLY_STEP2: (name, url) =>
    `Dear ${name || 'Customer'}, submit bank application ref & documents: ${url} - GharKaPaisa`,
  LEAD_APPROVED: (name, product) =>
    `Dear ${name || 'Customer'}, your application for ${product}! - GharKaPaisa`,
  LEAD_REJECTED: (name, product) =>
    `Dear ${name || 'Customer'}, your application for ${product}! - GharKaPaisa`,
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
  sendApplyStep1Sms,
  sendPostApplyStep2Sms,
  sendApply2Sms,
  sendUploadReminderSms,
  sendPartnerInviteSms,
  sendKycStatusUpdateSms,
  sendCommissionCreditedSms,
  sendLeadStatusSms,
  sendPayoutReceiptSms,
  SMS_TEMPLATES
};
