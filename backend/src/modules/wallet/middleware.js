const rateLimit = require('express-rate-limit');
const { error } = require('../../utils/response/response');

const withdrawalOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, message: 'Too many withdrawal OTP requests. Please try again in 15 minutes.' }
});

const validateBankDetails = (req, res, next) => {
  const accountNumber = String(req.body.account_number || '').replace(/\s/g, '');
  const ifsc = String(req.body.ifsc_code || '').trim().toUpperCase();
  const upi = String(req.body.upi_id || '').trim();
  if (accountNumber && !/^\d{9,18}$/.test(accountNumber)) return error(res, 'Invalid account number format');
  if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return error(res, 'Invalid IFSC code format');
  if (upi && !/^[A-Za-z0-9._-]{2,256}@[A-Za-z]{2,64}$/.test(upi)) return error(res, 'Invalid UPI ID format');
  if (!accountNumber && !upi && ['POST', 'PUT'].includes(req.method)) return error(res, 'Provide a bank account number or UPI ID');
  req.body.account_number = accountNumber || undefined;
  req.body.ifsc_code = ifsc || undefined;
  req.body.upi_id = upi || undefined;
  next();
};

const validateWithdrawalAmount = (req, res, next) => {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100) return error(res, 'Amount must be a positive value with at most two decimal places');
  next();
};

module.exports = { withdrawalOtpLimiter, validateBankDetails, validateWithdrawalAmount };
