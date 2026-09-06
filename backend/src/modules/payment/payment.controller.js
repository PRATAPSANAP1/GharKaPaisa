const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../../config/logger');
const { creditWalletFromPayment } = require('../wallet/service');

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

module.exports = {
  createOrder,
  verifyPayment
};
