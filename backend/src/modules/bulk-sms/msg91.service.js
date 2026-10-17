const path = require('path');
const fs = require('fs');
const axios = require('axios');
const logger = require('../../config/logger');

// Defensively load .env if not yet loaded in runtime environment
if (!process.env.MSG91_AUTH_KEY && !process.env.MSG91_AUTHKEY) {
  const backendEnvPath = path.resolve(__dirname, '../../../.env');
  if (fs.existsSync(backendEnvPath)) {
    require('dotenv').config({ path: backendEnvPath });
  } else {
    require('dotenv').config();
  }
}

// MSG91 Configuration Helpers (read dynamically from runtime process.env)
const getMsg91AuthKey = () => (process.env.MSG91_AUTH_KEY || process.env.MSG91_AUTHKEY || '').trim();
const getMsg91SenderId = () => (process.env.MSG91_SENDER_ID || 'GHARKP').trim();
const getMsg91Route = () => (process.env.MSG91_ROUTE || '4').trim();
const getMsg91BaseUrl = () => (process.env.MSG91_BASE_URL || 'https://api.msg91.com/api/v5').replace(/\/$/, '');
const getConfiguredTemplateId = () => (process.env.MSG91_BULK_SMS_TEMPLATE_ID || '').trim() || '6acdf0660b357ef1f10a6343';

/**
 * Format Indian mobile number for MSG91:
 * MSG91 requires 91XXXXXXXXXX (12 digits, starting with 91, followed by 10-digit mobile starting with 6-9)
 */
const normalizeForMsg91 = (mobile) => {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
    return `91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
    return digits;
  }
  return null;
};

/**
 * Mask mobile number for privacy and audit previews:
 * 9876543210 -> 98******10
 */
const maskMobileNumber = (mobile) => {
  const digits = String(mobile || '').replace(/\D/g, '');
  const tenDigit = digits.length >= 10 ? digits.slice(-10) : digits;
  if (tenDigit.length === 10) {
    return `${tenDigit.slice(0, 2)}******${tenDigit.slice(-2)}`;
  }
  return `${tenDigit.slice(0, 2)}****${tenDigit.slice(-2)}`;
};

/**
 * Send Batch SMS via MSG91 Flow API
 * @param {string} templateId - MSG91 Flow / DLT Template ID
 * @param {Array<{mobiles: string, [key: string]: any}>} recipients - Array of recipient objects with mobile & variables
 * @param {string} senderId - Sender ID (default: GHARKP)
 */
const sendBatchViaFlow = async (templateId, recipients = [], senderId = null) => {
  if (!recipients || recipients.length === 0) {
    return { success: true, count: 0, results: [] };
  }

  const authKey = getMsg91AuthKey();
  const effectiveSenderId = senderId || getMsg91SenderId();
  const baseUrl = getMsg91BaseUrl();
  const configuredTemplateId = getConfiguredTemplateId();

  // Validate that templateId matches the configured template ID
  if (templateId !== configuredTemplateId) {
    logger.error(`[MSG91-FLOW] Template ID mismatch: provided '${templateId}' does not match configured '${configuredTemplateId}'.`);
    return {
      success: false,
      simulated: false,
      error: `Template ID mismatch: provided '${templateId}' does not match configured '${configuredTemplateId}'.`,
      recipients: recipients.map((r) => ({
        mobile: r.mobiles,
        status: 'FAILED',
        failure_reason: `Template ID mismatch: provided '${templateId}' does not match configured '${configuredTemplateId}'.`,
      })),
    };
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isMockKey = !authKey || authKey === 'mock_key';

  // In production, missing credentials or mock key MUST produce a configuration error, NOT a simulated success
  if (isProduction && isMockKey) {
    const errorMsg = 'MSG91 credentials missing or mock key detected in production environment.';
    logger.error(`[MSG91-FLOW] Production error: ${errorMsg}`);
    return {
      success: false,
      simulated: false,
      error: errorMsg,
      recipients: recipients.map((r) => ({
        mobile: r.mobiles,
        status: 'FAILED',
        failure_reason: errorMsg,
      })),
    };
  }

  // Non-production simulation / test mode:
  // Returns status 'SIMULATED' (NEVER 'SENT' or 'DELIVERED') so mock responses never increment real sent/delivered counts
  if (isMockKey || (process.env.NODE_ENV === 'test' && !process.env.MSG91_FORCE_LIVE)) {
    logger.info(`[MSG91-MOCK] Simulating Flow SMS dispatch for ${recipients.length} recipients using template ${templateId}`);
    return {
      success: true,
      simulated: true,
      messageId: `MOCK_MSG91_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      recipients: recipients.map((r) => ({
        mobile: r.mobiles,
        status: 'SIMULATED',
        message_id: `MOCK_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      })),
    };
  }

  try {
    const url = `${baseUrl}/flow/?authkey=${encodeURIComponent(authKey)}`;
    const payload = {
      template_id: templateId,
      sender: effectiveSenderId,
      short_url: '0',
      recipients: recipients.map((r) => ({
        ...r,
        mobiles: normalizeForMsg91(r.mobiles) || r.mobiles,
      })),
    };

    const res = await axios.post(url, payload, {
      headers: {
        authkey: authKey,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });

    const data = res.data;
    // Log response type without exposing auth keys or recipient PII
    logger.info(`[MSG91-FLOW] Batch dispatched. Provider status: ${data?.type || data?.status || 'received'}`);

    const isSuccess = Boolean(
      data &&
      data.type !== 'error' &&
      (data.type === 'success' || data.status === 'success' || data.hasError === false)
    );

    const providerRequestId = data?.request_id || (data?.type === 'success' && typeof data?.message === 'string' ? data.message : null) || `MSG91_${Date.now()}`;

    return {
      success: isSuccess,
      simulated: false,
      messageId: isSuccess ? providerRequestId : null,
      providerResponse: data,
      recipients: recipients.map((r) => ({
        mobile: r.mobiles,
        // Provider acceptance sets status to SENT (awaiting delivery receipt), NEVER DELIVERED
        status: isSuccess ? 'SENT' : 'FAILED',
        message_id: isSuccess ? providerRequestId : null,
        failure_reason: isSuccess ? null : (data?.message || 'Provider rejected request'),
      })),
    };
  } catch (error) {
    const errData = error.response?.data || error.message;
    logger.error(`[MSG91-FLOW] Dispatch error: ${typeof errData === 'string' ? errData : JSON.stringify(errData)}`);
    return {
      success: false,
      simulated: false,
      error: typeof errData === 'string' ? errData : (errData?.message || JSON.stringify(errData)),
      recipients: recipients.map((r) => ({
        mobile: r.mobiles,
        status: 'FAILED',
        failure_reason: typeof errData === 'string' ? errData : (errData?.message || JSON.stringify(errData)),
      })),
    };
  }
};

module.exports = {
  getMsg91AuthKey,
  getMsg91SenderId,
  getMsg91Route,
  getMsg91BaseUrl,
  getConfiguredTemplateId,
  normalizeForMsg91,
  maskMobileNumber,
  sendBatchViaFlow,
};
