const axios = require('axios');
const logger = require('../../config/logger');

// MSG91 Configuration
const msg91AuthKey = (process.env.MSG91_AUTH_KEY || process.env.MSG91_AUTHKEY || '').trim();
const msg91SenderId = (process.env.MSG91_SENDER_ID || 'GHARKP').trim();
const msg91Route = (process.env.MSG91_ROUTE || '4').trim();
const msg91BaseUrl = (process.env.MSG91_BASE_URL || 'https://api.msg91.com/api/v5').replace(/\/$/, '');

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
const sendBatchViaFlow = async (templateId, recipients = [], senderId = msg91SenderId) => {
  if (!recipients || recipients.length === 0) {
    return { success: true, count: 0, results: [] };
  }

  // If no live MSG91 key configured or in test mode, simulate realistic response
  if (!msg91AuthKey || msg91AuthKey === 'mock_key' || process.env.NODE_ENV === 'test') {
    logger.info(`[MSG91-MOCK] Simulating Flow SMS dispatch for ${recipients.length} recipients using template ${templateId}`);
    return {
      success: true,
      simulated: true,
      messageId: `MOCK_MSG91_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      recipients: recipients.map((r) => ({
        mobile: r.mobiles,
        status: 'SENT',
        message_id: `MOCK_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      })),
    };
  }

  try {
    const url = `${msg91BaseUrl}/flow/?authkey=${encodeURIComponent(msg91AuthKey)}`;
    const payload = {
      template_id: templateId,
      sender: senderId || msg91SenderId,
      short_url: '0',
      recipients: recipients.map((r) => ({
        ...r,
        mobiles: normalizeForMsg91(r.mobiles) || r.mobiles,
      })),
    };

    const res = await axios.post(url, payload, {
      headers: {
        authkey: msg91AuthKey,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });

    const data = res.data;
    logger.info(`[MSG91-FLOW] Batch dispatched: ${JSON.stringify(data)}`);

    const isSuccess = data && (data.type === 'success' || data.status === 'success' || !data.hasError);

    return {
      success: isSuccess,
      simulated: false,
      messageId: data.request_id || data.message || `MSG91_${Date.now()}`,
      providerResponse: data,
      recipients: recipients.map((r) => ({
        mobile: r.mobiles,
        status: isSuccess ? 'SENT' : 'FAILED',
        message_id: data.request_id || `MSG91_${Date.now()}`,
        failure_reason: isSuccess ? null : (data.message || 'Provider rejected request'),
      })),
    };
  } catch (error) {
    const errData = error.response?.data || error.message;
    logger.error(`[MSG91-FLOW] Dispatch error: ${JSON.stringify(errData)}`);
    return {
      success: false,
      simulated: false,
      error: errData,
      recipients: recipients.map((r) => ({
        mobile: r.mobiles,
        status: 'FAILED',
        failure_reason: typeof errData === 'string' ? errData : JSON.stringify(errData),
      })),
    };
  }
};

module.exports = {
  msg91AuthKey,
  msg91SenderId,
  msg91Route,
  normalizeForMsg91,
  maskMobileNumber,
  sendBatchViaFlow,
};
