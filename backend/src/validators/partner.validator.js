const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const createPartnerRules = [
  body('first_name').notEmpty().withMessage('First name is required').trim(),
  body('last_name').notEmpty().withMessage('Last name is required').trim(),
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit mobile number is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const updateKycRules = [
  body('status').isIn(['pending', 'under_review', 'approved', 'rejected']).withMessage('Invalid KYC status'),
  body('rejection_reason').if(body('status').equals('rejected')).notEmpty().withMessage('Rejection reason is required when status is rejected')
];

module.exports = {
  createPartner: validate(createPartnerRules),
  updateKyc: validate(updateKycRules)
};
