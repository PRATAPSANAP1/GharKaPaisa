const { body, param, query, validationResult } = require('express-validator');
const { error } = require('../utils/response');

// Run validation and return errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'Validation failed', 422, errors.array().map(e => ({ field: e.path, message: e.msg })));
  }
  next();
};

// ── Auth validators ────────────────────────────────────────────
const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit mobile required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number'),
  body('first_name').trim().notEmpty().withMessage('First name required'),
  body('last_name').trim().notEmpty().withMessage('Last name required'),
  body('current_address').trim().notEmpty().withMessage('Address required'),
  body('bank_name').trim().notEmpty().withMessage('Bank name required'),
  body('account_number').trim().notEmpty().withMessage('Account number required'),
  body('ifsc_code').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Valid IFSC code required'),
  body('account_holder_name').trim().notEmpty().withMessage('Account holder name required'),
];

const loginRules = [
  body('identifier').trim().notEmpty().withMessage('Email or mobile required'),
  body('password').notEmpty().withMessage('Password required'),
];

const otpSendRules = [
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid mobile required'),
];

const otpVerifyRules = [
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid mobile required'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Valid 6-digit OTP required'),
];

// ── Application validators ─────────────────────────────────────
const applicationRules = [
  body('product_id').isUUID().withMessage('Valid product ID required'),
  body('customer.full_name').trim().notEmpty().withMessage('Customer name required'),
  body('customer.mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid customer mobile required'),
  body('customer.pan_number').optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Valid PAN required'),
  body('customer.monthly_income').optional().isNumeric().withMessage('Monthly income must be a number'),
  body('customer.employment_type').optional()
    .isIn(['salaried', 'self_employed', 'business']).withMessage('Invalid employment type'),
];

// ── Withdrawal validators ──────────────────────────────────────
const withdrawalRules = [
  body('amount').isFloat({ min: 100 }).withMessage('Minimum withdrawal amount is ₹100'),
];

// ── Commission structure validators ───────────────────────────
const commissionRules = [
  body('product_id').isUUID().withMessage('Valid product ID required'),
  body('commission_value').isFloat({ min: 0 }).withMessage('Commission value must be positive'),
  body('commission_type').isIn(['fixed', 'percentage']).withMessage('Type must be fixed or percentage'),
  body('effective_from').isDate().withMessage('Valid date required'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  otpSendRules,
  otpVerifyRules,
  applicationRules,
  withdrawalRules,
  commissionRules,
};
