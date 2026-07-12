const axios = require('axios');
const crypto = require('crypto');
const { query } = require('../../config/database');
const logger = require('../../config/logger');

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const MERCHANT_ACCOUNT = process.env.RAZORPAY_ACCOUNT_NUMBER;

const isLive = !!(KEY_ID && KEY_SECRET && MERCHANT_ACCOUNT);

// Helper to log payout API request/responses
const logPayoutApiCall = async (withdrawalId, request, response, httpStatus, retryCount = 0) => {
  try {
    await query(`
      INSERT INTO payout_logs (withdrawal_id, api_request, api_response, http_status, retry_count)
      VALUES ($1, $2, $3, $4, $5)
    `, [withdrawalId, JSON.stringify(request), JSON.stringify(response), httpStatus, retryCount]);
  } catch (err) {
    logger.error('Failed to write payout log:', err.message);
  }
};

// Create a contact in Razorpay
const createRazorpayContact = async (partner, withdrawalId) => {
  const url = 'https://api.razorpay.com/v1/contacts';
  const name = `${partner.first_name} ${partner.last_name || ''}`.trim();
  const requestBody = {
    name,
    email: partner.email || 'no-email@gharkapaisa.in',
    contact: partner.mobile,
    type: 'employee',
    reference_id: partner.id
  };

  if (!isLive) {
    // Simulator
    const responseBody = {
      id: `cont_sim_${crypto.randomBytes(6).toString('hex')}`,
      entity: 'contact',
      name,
      contact: partner.mobile,
      email: partner.email,
      type: 'employee',
      reference_id: partner.id,
      active: true,
      created_at: Math.floor(Date.now() / 1000)
    };
    await logPayoutApiCall(withdrawalId, { url, method: 'POST', body: requestBody }, responseBody, 201);
    return responseBody;
  }

  try {
    const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
    const res = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    await logPayoutApiCall(withdrawalId, { url, method: 'POST', body: requestBody }, res.data, res.status);
    return res.data;
  } catch (err) {
    const errorResponse = err.response ? err.response.data : { message: err.message };
    const status = err.response ? err.response.status : 500;
    await logPayoutApiCall(withdrawalId, { url, method: 'POST', body: requestBody }, errorResponse, status);
    throw new Error(errorResponse.error?.description || 'Failed to create Razorpay contact');
  }
};

// Create a Fund Account (Bank Account) in Razorpay
const createRazorpayFundAccount = async (contactId, bankDetails, withdrawalId) => {
  const url = 'https://api.razorpay.com/v1/fund_accounts';
  const requestBody = {
    contact_id: contactId,
    account_type: 'bank_account',
    bank_account: {
      name: bankDetails.account_holder_name,
      ifsc: bankDetails.ifsc_code,
      account_number: bankDetails.account_number
    }
  };

  if (!isLive) {
    // Simulator
    const responseBody = {
      id: `fa_sim_${crypto.randomBytes(6).toString('hex')}`,
      entity: 'fund_account',
      contact_id: contactId,
      account_type: 'bank_account',
      bank_account: {
        name: bankDetails.account_holder_name,
        ifsc: bankDetails.ifsc_code,
        bank_name: bankDetails.bank_name,
        account_number: `******${bankDetails.account_number.slice(-4)}`
      },
      active: true,
      created_at: Math.floor(Date.now() / 1000)
    };
    await logPayoutApiCall(withdrawalId, { url, method: 'POST', body: requestBody }, responseBody, 201);
    return responseBody;
  }

  try {
    const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
    const res = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    await logPayoutApiCall(withdrawalId, { url, method: 'POST', body: requestBody }, res.data, res.status);
    return res.data;
  } catch (err) {
    const errorResponse = err.response ? err.response.data : { message: err.message };
    const status = err.response ? err.response.status : 500;
    await logPayoutApiCall(withdrawalId, { url, method: 'POST', body: requestBody }, errorResponse, status);
    throw new Error(errorResponse.error?.description || 'Failed to create Razorpay fund account');
  }
};

// Create a payout via Razorpay
const createRazorpayPayout = async (fundAccountId, amountRupees, withdrawalId) => {
  const url = 'https://api.razorpay.com/v1/payouts';
  const amountPaise = Math.round(amountRupees * 100);
  const idempotencyKey = crypto.createHash('sha256').update(withdrawalId.toString()).digest('hex');

  const requestBody = {
    account_number: MERCHANT_ACCOUNT,
    fund_account_id: fundAccountId,
    amount: amountPaise,
    currency: 'INR',
    mode: 'IMPS',
    purpose: 'payout',
    queue_if_low_balance: true,
    reference_id: withdrawalId.toString()
  };

  if (!isLive) {
    // Simulator - auto process after 500ms simulation
    const responseBody = {
      id: `pout_sim_${crypto.randomBytes(6).toString('hex')}`,
      entity: 'payout',
      fund_account_id: fundAccountId,
      amount: amountPaise,
      currency: 'INR',
      notes: {},
      fees: 0,
      tax: 0,
      status: 'processed',
      utr: `SIMUTR${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      mode: 'IMPS',
      purpose: 'payout',
      reference_id: withdrawalId.toString(),
      created_at: Math.floor(Date.now() / 1000)
    };
    await logPayoutApiCall(withdrawalId, { url, method: 'POST', headers: { 'X-Payout-Idempotency': idempotencyKey }, body: requestBody }, responseBody, 200);
    return responseBody;
  }

  try {
    const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
    const res = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        'X-Payout-Idempotency': idempotencyKey
      }
    });
    await logPayoutApiCall(withdrawalId, { url, method: 'POST', headers: { 'X-Payout-Idempotency': idempotencyKey }, body: requestBody }, res.data, res.status);
    return res.data;
  } catch (err) {
    const errorResponse = err.response ? err.response.data : { message: err.message };
    const status = err.response ? err.response.status : 500;
    await logPayoutApiCall(withdrawalId, { url, method: 'POST', headers: { 'X-Payout-Idempotency': idempotencyKey }, body: requestBody }, errorResponse, status);
    throw new Error(errorResponse.error?.description || 'Failed to initiate Razorpay payout');
  }
};

module.exports = {
  createRazorpayContact,
  createRazorpayFundAccount,
  createRazorpayPayout,
  isLive
};
