const axios = require('axios');
const crypto = require('crypto');
const logger = require('../../config/logger');

// Cashfree API Configuration
const CLIENT_ID = process.env.CASHFREE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET || '';
const CASHFREE_ENV = (process.env.CASHFREE_ENV || 'TEST').toUpperCase();
const API_VERSION = process.env.CASHFREE_API_VERSION || '2023-08-01';

// Base URLs
const BASE_URL = CASHFREE_ENV === 'PROD' || CASHFREE_ENV === 'PRODUCTION'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

const PAYOUT_BASE_URL = CASHFREE_ENV === 'PROD' || CASHFREE_ENV === 'PRODUCTION'
  ? 'https://payout-api.cashfree.com/payout'
  : 'https://payout-gamma.cashfree.com/payout';

/**
 * Standard Cashfree PG Request Headers
 */
const getHeaders = (idempotencyKey = null) => {
  const headers = {
    'x-client-id': CLIENT_ID,
    'x-client-secret': CLIENT_SECRET,
    'x-api-version': API_VERSION,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (idempotencyKey) {
    headers['x-idempotency-key'] = idempotencyKey;
  }
  return headers;
};

/**
 * 1. Create a Payment Order (Generates payment_session_id for Cashfree Web / Mobile SDK)
 * @param {Object} orderData
 * @param {string} orderData.orderId - Unique order identifier
 * @param {number} orderData.orderAmount - Amount in INR (e.g. 500.00)
 * @param {string} orderData.customerId - Unique customer identifier
 * @param {string} orderData.customerPhone - Customer 10-digit mobile number
 * @param {string} [orderData.customerName] - Customer name
 * @param {string} [orderData.customerEmail] - Customer email address
 * @param {string} [orderData.returnUrl] - URL to redirect after payment completion
 */
const createCashfreeOrder = async ({
  orderId,
  orderAmount,
  customerId,
  customerPhone,
  customerName = 'Customer',
  customerEmail = 'customer@gharkapaisa.in',
  returnUrl = null,
  orderNote = 'GharKaPaisa Service Payment',
}) => {
  try {
    const payload = {
      order_id: String(orderId),
      order_amount: parseFloat(Number(orderAmount).toFixed(2)),
      order_currency: 'INR',
      customer_details: {
        customer_id: String(customerId),
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: String(customerPhone).replace(/\D/g, '').slice(-10),
      },
      order_meta: {
        return_url: returnUrl || `https://gharkapaisa.in/payment/status?order_id={order_id}`,
      },
      order_note: orderNote,
    };

    logger.info(`[CASHFREE] Creating order ${orderId} for amount ₹${orderAmount} in ${CASHFREE_ENV} environment`);

    const response = await axios.post(`${BASE_URL}/orders`, payload, {
      headers: getHeaders(orderId),
      timeout: 10000,
    });

    return {
      success: true,
      order_id: response.data.order_id,
      payment_session_id: response.data.payment_session_id,
      order_status: response.data.order_status,
      order_amount: response.data.order_amount,
      order_currency: response.data.order_currency,
      environment: CASHFREE_ENV,
      cf_order_id: response.data.cf_order_id,
    };
  } catch (error) {
    const errData = error.response?.data || { message: error.message };
    logger.error('[CASHFREE] Order Creation Failed:', errData);
    throw new Error(errData.message || 'Failed to create Cashfree payment order.');
  }
};

/**
 * 2. Fetch Order Details & Status from Cashfree
 * @param {string} orderId
 */
const getCashfreeOrderStatus = async (orderId) => {
  try {
    const response = await axios.get(`${BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
      headers: getHeaders(),
      timeout: 10000,
    });
    return {
      success: true,
      data: response.data,
      isPaid: response.data.order_status === 'PAID',
    };
  } catch (error) {
    const errData = error.response?.data || { message: error.message };
    logger.error(`[CASHFREE] Fetch Order Failed for ${orderId}:`, errData);
    throw new Error(errData.message || 'Failed to verify Cashfree order status.');
  }
};

/**
 * 3. Verify Cashfree Webhook Signature
 * @param {string} rawBody - Raw JSON request body string
 * @param {string} signature - x-webhook-signature header
 * @param {string} timestamp - x-webhook-timestamp header
 */
const verifyWebhookSignature = (rawBody, signature, timestamp) => {
  try {
    if (!signature || !timestamp || !CLIENT_SECRET) return false;
    const bodyStr = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    const data = timestamp + bodyStr;
    const expectedSignature = crypto
      .createHmac('sha256', CLIENT_SECRET)
      .update(data)
      .digest('base64');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (err) {
    logger.error('[CASHFREE] Webhook Signature Verification Error:', err);
    return false;
  }
};

module.exports = {
  createCashfreeOrder,
  getCashfreeOrderStatus,
  verifyWebhookSignature,
  CLIENT_ID,
  CASHFREE_ENV,
  BASE_URL,
};

