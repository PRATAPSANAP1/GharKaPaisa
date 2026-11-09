const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../../config/logger');
const { creditWalletFromPayment } = require('../wallet/service');
const cashfreeHelper = require('../../utils/helpers/cashfree');

// Lazy-initialize Razorpay instance to use latest env vars
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error('Razorpay API keys are not configured in environment variables.');
  }
  return new Razorpay({ key_id, key_secret });
};

/**
 * STEP 1: Create Razorpay Order
 * POST /api/create-order or /api/v1/payment/create-order
 */
const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount provided. Amount must be a positive number in INR.'
      });
    }

    // Convert INR amount explicitly to paise (minimum 100 paise = 1 INR)
    const amountInPaise = Math.round(numAmount * 100);
    if (amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum order amount must be at least ₹1 (100 paise).'
      });
    }

    const { query } = require('../../config/database');
    let partnerId = req.partner?.id || req.user?.PartnerId || req.user?.partner_id;
    if (!partnerId && req.user) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) partnerId = p.id;
    }

    const razorpay = getRazorpayInstance();
    const options = {
      amount: amountInPaise,
      currency: currency.toUpperCase(),
      receipt: receipt || `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        partner_id: partnerId || null
      }
    };

    const order = await razorpay.orders.create(options);

    logger.info(`Razorpay order created successfully: ${order.id} for amount ${order.amount} ${order.currency}`);

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    logger.error('Razorpay Create Order Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create Razorpay order.'
    });
  }
};

/**
 * STEP 3: Verify Payment Signature & Credit Partner Wallet Atomically
 * POST /api/verify-payment or /api/v1/payment/verify-payment
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters (razorpay_order_id, razorpay_payment_id, razorpay_signature).'
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay Key Secret is missing on server configuration.'
      });
    }

    // 1. Timing-safe HMAC Signature Verification
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(String(razorpay_signature).trim(), 'hex');

    const isAuthentic = expectedBuffer.length === providedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, providedBuffer);

    if (!isAuthentic) {
      logger.warn(`Razorpay payment verification failed: Invalid signature for order ${razorpay_order_id}, payment ${razorpay_payment_id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.'
      });
    }

    // 2. Fetch order details from Razorpay to verify order amount & partner ownership
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const amountInInr = parseFloat((order.amount / 100).toFixed(2)); // Convert paise to INR

    // 3. Resolve authenticated partner ID
    const { query } = require('../../config/database');
    let partnerId = req.partner?.id || req.user?.PartnerId || req.user?.partner_id;
    if (!partnerId && req.user) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) partnerId = p.id;
    }

    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Authenticated partner profile not found.'
      });
    }

    // 4. Server-Side Order Ownership Validation
    const orderPartnerId = order.notes?.partner_id;
    if (orderPartnerId && String(orderPartnerId) !== String(partnerId)) {
      logger.warn(`Payment ownership mismatch: Order ${razorpay_order_id} partner (${orderPartnerId}) !== req partner (${partnerId})`);
      return res.status(403).json({
        success: false,
        message: 'Payment order ownership mismatch. Unauthorized payment verification attempt.'
      });
    }

    // 5. Atomic & Idempotent Wallet Credit
    const result = await creditWalletFromPayment(
      partnerId,
      amountInInr,
      razorpay_payment_id,
      razorpay_order_id,
      req.user?.id || null
    );

    return res.status(200).json({
      success: true,
      message: result.alreadyProcessed 
        ? 'Payment verification completed (already processed).' 
        : 'Payment verified and wallet credited successfully.',
      already_processed: result.alreadyProcessed,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      amount: amountInInr
    });

  } catch (error) {
    logger.error('Razorpay Payment Verification Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while verifying payment signature.'
    });
  }
};

/**
 * CASHFREE STEP 1: Create Cashfree PG Order
 * POST /api/v1/payment/cashfree/create-order
 */
const createCashfreeOrder = async (req, res) => {
  try {
    const { amount, customerPhone, customerName, customerEmail, returnUrl, note } = req.body;

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount provided. Amount must be a positive number in INR.'
      });
    }

    const { query } = require('../../config/database');
    let partnerId = req.partner?.id || req.user?.PartnerId || req.user?.partner_id;
    if (!partnerId && req.user) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) partnerId = p.id;
    }

    const orderId = `cf_ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const phone = customerPhone || req.user?.mobile || '9999999999';
    const name = customerName || req.user?.full_name || req.user?.first_name || 'GKP Customer';
    const email = customerEmail || req.user?.email || 'customer@gharkapaisa.in';
    const customerId = partnerId ? `partner_${partnerId}` : (req.user?.id ? `user_${req.user.id}` : `guest_${Date.now()}`);

    const cfOrder = await cashfreeHelper.createCashfreeOrder({
      orderId,
      orderAmount: numAmount,
      customerId,
      customerPhone: phone,
      customerName: name,
      customerEmail: email,
      returnUrl,
      orderNote: note || `GharKaPaisa Wallet Topup for ${name}`
    });

    return res.status(200).json({
      success: true,
      ...cfOrder,
      client_id: cashfreeHelper.CLIENT_ID
    });
  } catch (error) {
    logger.error('Cashfree Create Order Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create Cashfree payment order.'
    });
  }
};

/**
 * CASHFREE STEP 2: Verify Cashfree Payment & Credit Wallet
 * POST /api/v1/payment/cashfree/verify-payment
 */
const verifyCashfreePayment = async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: 'order_id is required for Cashfree payment verification.'
      });
    }

    const statusRes = await cashfreeHelper.getCashfreeOrderStatus(order_id);
    const orderData = statusRes.data;

    if (!statusRes.isPaid) {
      return res.status(400).json({
        success: false,
        message: `Order status is '${orderData.order_status}', not PAID.`,
        order_status: orderData.order_status
      });
    }

    const { query } = require('../../config/database');
    let partnerId = req.partner?.id || req.user?.PartnerId || req.user?.partner_id;
    if (!partnerId && req.user) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) partnerId = p.id;
    }

    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Authenticated partner profile not found.'
      });
    }

    const amountInInr = parseFloat(Number(orderData.order_amount).toFixed(2));
    const paymentId = orderData.cf_order_id ? String(orderData.cf_order_id) : `cf_pay_${order_id}`;

    const result = await creditWalletFromPayment(
      partnerId,
      amountInInr,
      paymentId,
      order_id,
      req.user?.id || null
    );

    return res.status(200).json({
      success: true,
      message: result.alreadyProcessed
        ? 'Payment verified (already processed).'
        : 'Cashfree payment verified and wallet credited successfully.',
      already_processed: result.alreadyProcessed,
      payment_id: paymentId,
      order_id,
      amount: amountInInr
    });
  } catch (error) {
    logger.error('Cashfree Payment Verification Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify Cashfree payment.'
    });
  }
};

/**
 * CASHFREE Webhook Endpoint
 * POST /api/v1/payment/cashfree/webhook
 */
const cashfreeWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    const isValid = cashfreeHelper.verifyWebhookSignature(rawBody, signature, timestamp);
    if (!isValid) {
      logger.warn('[CASHFREE_WEBHOOK] Invalid webhook signature detected.');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const event = req.body;
    logger.info(`[CASHFREE_WEBHOOK] Received event: ${event.type}`);

    if (event.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const paymentData = event.data?.payment;
      const orderData = event.data?.order;
      if (orderData && paymentData && paymentData.payment_status === 'SUCCESS') {
        const orderId = orderData.order_id;
        const amount = parseFloat(paymentData.payment_amount);
        const paymentId = String(paymentData.cf_payment_id || orderData.cf_order_id);
        const customerId = orderData.customer_details?.customer_id || '';
        const partnerId = customerId.startsWith('partner_') ? customerId.replace('partner_', '') : null;

        if (partnerId) {
          await creditWalletFromPayment(partnerId, amount, paymentId, orderId, null);
          logger.info(`[CASHFREE_WEBHOOK] Wallet successfully credited for partner ${partnerId}, amount ₹${amount}`);
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook processed.' });
  } catch (err) {
    logger.error('[CASHFREE_WEBHOOK] Error handling webhook:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  createCashfreeOrder,
  verifyCashfreePayment,
  cashfreeWebhook
};
