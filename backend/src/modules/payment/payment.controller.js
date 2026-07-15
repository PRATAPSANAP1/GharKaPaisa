const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../../config/logger');

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

    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount provided.'
      });
    }

    // Convert to paise if amount given in Rupees (< 100 implies rupees, or if passed directly in paise)
    // Minimum Razorpay amount is 100 paise (1 INR)
    let amountInPaise = Number(amount);
    if (amountInPaise < 100) {
      amountInPaise = Math.round(amountInPaise * 100);
    }

    if (amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum order amount must be at least 100 paise (1 INR).'
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
 * STEP 3: Verify Payment Signature
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

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      logger.warn(`Razorpay payment verification failed for order: ${razorpay_order_id}, payment: ${razorpay_payment_id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.'
      });
    }

    logger.info(`Razorpay payment verified successfully: payment_id ${razorpay_payment_id}, order_id ${razorpay_order_id}`);

    // Fetch order details from Razorpay to get the actual amount securely
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const amount = parseFloat((order.amount / 100).toFixed(2)); // Convert paise to INR

    // Resolve partner ID
    const { query } = require('../../config/database');
    let partnerId = req.partner?.id || req.user?.PartnerId || req.user?.partner_id;
    if (!partnerId && req.user) {
      const { rows: [p] } = await query(`SELECT id FROM partner_profiles WHERE user_id = $1`, [req.user.id]);
      if (p) partnerId = p.id;
    }

    if (partnerId) {
      const { rows: [wallet] } = await query(`
        SELECT id FROM partner_wallets WHERE partner_id = $1
      `, [partnerId]);

      if (wallet) {
        // Credit the available balance
        await query(`
          UPDATE partner_wallets SET
            available_balance = available_balance + $1,
            total_earned = total_earned + $1,
            last_updated = NOW()
          WHERE id = $2
        `, [amount, wallet.id]);

        // Insert into wallet_transactions
        await query(`
          INSERT INTO wallet_transactions (
            wallet_id, partner_id, type, amount, status, description, reference_type, reference_id, processed_at
          ) VALUES ($1, $2, 'TOPUP', $3, 'success', $4, 'razorpay_payout', $5, NOW())
        `, [wallet.id, partnerId, amount, `Wallet top-up via Razorpay: ${razorpay_payment_id}`, razorpay_payment_id]);

        // Insert into wallet_ledger
        await query(`
          INSERT INTO wallet_ledger (
            wallet_id, partner_id, transaction_type, credit, debit, balance_after_transaction, description, reference_number, created_at
          )
          SELECT 
            $1, $2, 'ADJUSTMENT'::ledger_transaction_type, $3, 0, available_balance, $4, $5, NOW()
          FROM partner_wallets WHERE id = $1
        `, [wallet.id, partnerId, amount, `Wallet top-up via Razorpay: ${razorpay_payment_id}`, razorpay_payment_id]);

        logger.info(`Credited partner ${partnerId} wallet with TOPUP of INR ${amount}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and wallet credited successfully.',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      amount
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
