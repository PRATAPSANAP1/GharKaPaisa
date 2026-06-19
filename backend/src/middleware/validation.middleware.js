/**
 * validation.middleware.js
 * ─────────────────────────────────────────────────────────────────────────
 * Backend validation for authentication and business profile inputs.
 */
const { body, param, query, validationResult } = require('express-validator');
const { error } = require('../utils/response');

// Run validation and return errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'Validation failed', 422, errors.array().map(e => ({ field: e.path || e.param, message: e.msg })));
  }
  next();
};

// ── Registration: business/bank profile fields ─────────────────────────────
const registerRules = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('mobile')
    .trim()
    .matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit mobile number is required'),
  body('first_name').trim().notEmpty().withMessage('First name required'),
  body('last_name').trim().notEmpty().withMessage('Last name required'),
  body('aadhaar').trim().notEmpty().matches(/^\d{12}$/).withMessage('Valid Aadhaar number required'),
  body('pan').trim().toUpperCase().notEmpty()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Valid PAN number required'),
  body('current_address').trim().notEmpty().withMessage('Address required'),
  body('bank_name').trim().notEmpty().withMessage('Bank name required'),
  body('account_number').trim().notEmpty().withMessage('Account number required'),
  body('ifsc_code').trim().toUpperCase()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Valid IFSC code required'),
  body('account_holder_name').trim().notEmpty().withMessage('Account holder name required'),
  body('company_name').trim().notEmpty().withMessage('Company name required'),
  body('company_type')
    .isIn(['individual', 'proprietorship', 'partnership', 'pvt_ltd', 'llp', 'other'])
    .withMessage('Valid company type required'),
  body('gst_number').optional({ checkFalsy: true }).trim().toUpperCase()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Valid GST number required'),
  body('business_location').trim().notEmpty().withMessage('Business location required'),
];

// ── Application validators ─────────────────────────────────────────────────
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

// ── Withdrawal validators ──────────────────────────────────────────────────
const withdrawalRules = [
  body('amount').isFloat({ min: 100, max: 500000 }).withMessage('Amount must be between ₹100 and ₹5,00,000'),
];

// ── Commission structure validators ───────────────────────────────────────
const commissionRules = [
  body('product_id').isUUID().withMessage('Valid product ID required'),
  body('commission_value').isFloat({ min: 0 }).withMessage('Commission value must be positive'),
  body('commission_type').isIn(['fixed', 'percentage']).withMessage('Type must be fixed or percentage'),
  body('effective_from').isDate().withMessage('Valid date required'),
  body('effective_to').optional().isDate().withMessage('Valid end date required')
    .custom((val, { req }) => {
      if (val && new Date(val) <= new Date(req.body.effective_from)) {
        throw new Error('effective_to must be after effective_from');
      }
      return true;
    }),
];

module.exports = {
  validate,
  registerRules,
  applicationRules,
  withdrawalRules,
  commissionRules,
};
