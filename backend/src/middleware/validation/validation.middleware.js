/**
 * validation.middleware.js
 * ─────────────────────────────────────────────────────────────────────────
 * Backend validation for authentication and business profile inputs.
 */
const { body, param, query, validationResult } = require('express-validator');
const { error } = require('../../utils/response/response');

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
  body('last_name').optional({ checkFalsy: true }).trim(),
  body('aadhaar').optional({ checkFalsy: true }).trim().matches(/^\d{12}$/).withMessage('Valid Aadhaar number required'),
  body('pan').optional({ checkFalsy: true }).trim().toUpperCase()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Valid PAN number required'),
  body('current_address').optional({ checkFalsy: true }).trim(),
  body('pincode').optional({ checkFalsy: true }).trim().matches(/^\d{6}$/).withMessage('Valid 6-digit Pincode required'),
  body('bank_name').optional({ checkFalsy: true }).trim(),
  body('account_number').optional({ checkFalsy: true }).trim(),
  body('ifsc_code').optional({ checkFalsy: true }).trim().toUpperCase()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Valid IFSC code required'),
  body('account_holder_name').optional({ checkFalsy: true }).trim(),
  body('company_name').optional({ checkFalsy: true }).trim(),
  body('company_type').optional({ checkFalsy: true }).trim(),
  body('gst_number').optional({ checkFalsy: true }).trim().toUpperCase()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Valid GST number required'),
  body('business_location').optional({ checkFalsy: true }).trim(),
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

// ── Product Application Settings validators ────────────────────────────────
const applicationSettingsRules = [
  body('application_type')
    .isIn(['internal_form', 'external_url', 'affiliate_url', 'api_integration'])
    .withMessage('Invalid application type'),
  body('application_url')
    .custom((value, { req }) => {
      if (req.body.application_type !== 'internal_form') {
        if (!value) {
          throw new Error('Application URL is required for this application type');
        }
        if (!/^https?:\/\//i.test(value)) {
          throw new Error('Application URL must start with http:// or https://');
        }
      }
      return true;
    }),
  body('open_type')
    .optional()
    .isIn(['same_tab', 'new_tab'])
    .withMessage('Invalid open type'),
  body('partner_enabled')
    .optional()
    .isBoolean()
    .withMessage('partner_enabled must be a boolean'),
  body('customer_enabled')
    .optional()
    .isBoolean()
    .withMessage('customer_enabled must be a boolean'),
  body('track_clicks')
    .optional()
    .isBoolean()
    .withMessage('track_clicks must be a boolean'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status'),
];

module.exports = {
  validate,
  registerRules,
  applicationRules,
  withdrawalRules,
  commissionRules,
  applicationSettingsRules,
};
