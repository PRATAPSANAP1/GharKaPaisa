const axios = require('axios');
const crypto = require('crypto');
const { query } = require('../../config/database');
const logger = require('../../config/logger');

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const MERCHANT_ACCOUNT = process.env.RAZORPAY_ACCOUNT_NUMBER;

if (process.env.NODE_ENV === 'production' && (!KEY_ID || !KEY_SECRET)) {
  logger.error('CRITICAL: Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured in production environment.');
}

const isLive = !!(KEY_ID && KEY_SECRET && !KEY_ID.includes('test'));

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
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Razorpay live credentials are required in production mode for contact creation.');
    }
    // Simulator (Development / Testing)
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
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Razorpay live credentials are required in production mode for fund account creation.');
    }
    // Simulator (Development / Testing)
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

// Fetch Banking Balance from RazorpayX
const getRazorpayBalance = async () => {
  // 1. Try fetching real balance from Razorpay API
  if (KEY_ID && KEY_SECRET) {
    try {
      const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
      const url = MERCHANT_ACCOUNT 
        ? `https://api.razorpay.com/v1/banking_balances?account_number=${MERCHANT_ACCOUNT}`
        : `https://api.razorpay.com/v1/banking_balances`;
      const res = await axios.get(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      const balanceData = res.data?.items?.[0] || res.data;
      if (balanceData && balanceData.balance !== undefined) {
        const balanceRupees = balanceData.balance / 100;
        return {
          success: true,
          balance: balanceRupees,
          currency: balanceData.currency || 'INR',
          account_number: MERCHANT_ACCOUNT || balanceData.account_number || '2333300582845610',
          is_simulated: false,
          updated_at: new Date().toISOString()
        };
      }
    } catch (err) {
      logger.info(`[RAZORPAY_BALANCE_API] API call notice (${err.message}). Using dynamic ledger reconciliation.`);
    }
  }

  // 2. Dynamic ledger balance calculation: (Initial Seed + Confirmed Add Funds - Completed Payouts)
  let totalAddFunds = 0;
  let totalPayouts = 0;
  try {
    const { rows: [fundRes] } = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM razorpay_fund_requests WHERE status = 'CONFIRMED'`
    );
    totalAddFunds = parseFloat(fundRes?.total || 0);

    const { rows: [payoutRes] } = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM wallet_withdrawals WHERE status IN ('transferred', 'processed', 'successful', 'SUCCESS')`
    );
    totalPayouts = parseFloat(payoutRes?.total || 0);
  } catch (err) {
    logger.warn('Failed to calculate dynamic balance from DB:', err.message);
  }

  const initialBaseBalance = 250000.00;
  const dynamicBalance = Math.max(0, initialBaseBalance + totalAddFunds - totalPayouts);

  return {
    success: true,
    balance: dynamicBalance,
    total_added: totalAddFunds,
    total_withdrawn: totalPayouts,
    currency: 'INR',
    account_number: MERCHANT_ACCOUNT || '2333300582845610',
    is_simulated: true,
    updated_at: new Date().toISOString()
  };
};

// Create a payout via Razorpay
const createRazorpayPayout = async (fundAccountId, amountRupees, withdrawalId, options = {}) => {
  const { mode = 'IMPS', purpose = 'payout', narration = 'GharKaPaisa Commission' } = options;
  const url = 'https://api.razorpay.com/v1/payouts';
  const amountPaise = Math.round(amountRupees * 100);
  const idempotencyKey = crypto.createHash('sha256').update(withdrawalId.toString()).digest('hex');

  // Explicit balance check before payout
  try {
    const balInfo = await getRazorpayBalance();
    if (balInfo && balInfo.balance < amountRupees) {
      throw new Error(`Insufficient RazorpayX balance. Available: ₹${balInfo.balance}, Requested: ₹${amountRupees}`);
    }
  } catch (balErr) {
    if (balErr.message.includes('Insufficient RazorpayX balance')) {
      throw balErr;
    }
  }

  const requestBody = {
    account_number: MERCHANT_ACCOUNT || 'RAZORPAYX_ACC',
    fund_account_id: fundAccountId,
    amount: amountPaise,
    currency: 'INR',
    mode: mode.toUpperCase(),
    purpose,
    narration,
    queue_if_low_balance: false,
    reference_id: withdrawalId.toString()
  };

  if (!isLive) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Razorpay live credentials are required in production mode to initiate payouts.');
    }
    // Simulator - auto process after simulation (Development / Testing only)
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
      mode: mode.toUpperCase(),
      purpose,
      narration,
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

// Validate Fund Account (Penny Drop validation) in Razorpay
const validateRazorpayFundAccount = async (fundAccountId, partnerId) => {
  const url = 'https://api.razorpay.com/v1/fund_accounts/validations';
  const requestBody = {
    account_number: MERCHANT_ACCOUNT || 'RAZORPAYX_ACC',
    fund_account: {
      id: fundAccountId
    },
    amount: 100, // 1 INR in paise
    currency: 'INR',
    notes: {
      partner_id: partnerId ? partnerId.toString() : ''
    }
  };

  if (!isLive) {
    const responseBody = {
      id: `fav_sim_${crypto.randomBytes(6).toString('hex')}`,
      entity: 'fund_account_validation',
      fund_account_id: fundAccountId,
      status: 'completed',
      results: {
        account_status: 'active',
        registered_name: 'Validated Partner'
      },
      created_at: Math.floor(Date.now() / 1000)
    };
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
    return res.data;
  } catch (err) {
    const errorResponse = err.response ? err.response.data : { message: err.message };
    logger.error('Failed to validate Razorpay fund account:', errorResponse);
    throw new Error(errorResponse.error?.description || 'Failed to validate fund account with Razorpay');
  }
};

module.exports = {
  createRazorpayContact,
  createRazorpayFundAccount,
  validateRazorpayFundAccount,
  createRazorpayPayout,
  getRazorpayBalance,
  isLive
};
