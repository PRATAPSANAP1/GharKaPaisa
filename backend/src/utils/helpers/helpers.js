const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Generate unique application number: APP + YYYYMMDD + sequence or random
const generateAppNumber = (seq) => {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  if (seq) {
    return `APP${datePart}${String(seq).padStart(5, '0')}`;
  }
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `APP${datePart}${rand}`;
};

// Generate Partner code: AG + 5-digit zero-padded sequence
const generatePartnerCode = (seq) => `AG${String(seq).padStart(5, '0')}`;

// Hash OTP
const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

// Generate 6-digit OTP
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// Calculate commission for an application
const calculateCommission = (product, applicationAmount) => {
  if (product.commission_type === 'percentage') {
    return (applicationAmount * product.commission_value) / 100;
  }
  return parseFloat(product.commission_value);
};

// Paginate query helper
const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(1000, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

// Build WHERE clause from filters
const buildWhereClause = (filters, startIndex = 1) => {
  const conditions = [];
  const values = [];
  let idx = startIndex;
  for (const [key, val] of Object.entries(filters)) {
    if (val !== undefined && val !== null && val !== '') {
      conditions.push(`${key} = $${idx++}`);
      values.push(val);
    }
  }
  return {
    where: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '',
    values,
    nextIndex: idx,
  };
};

// Sanitize phone: ensure +91 format
const sanitizeMobile = (mobile) => {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return mobile;
};

// Generate secure random referral code (12-16 uppercase alphanumeric chars)
const generateRandomReferralCode = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
};

// Generate Team Code (starts with TM + 11 random uppercase alphanumeric chars)
const generateTeamCode = (length = 11) => {
  return 'TM' + generateRandomReferralCode(length);
};

// Mask last 6 digits of mobile number (e.g. +91 9635869526 -> +91 9635******)
const maskMobileLast6 = (mobile, countryCode = '+91') => {
  if (!mobile) return '******';
  const raw = String(mobile).trim();
  let cc = (countryCode || '').trim();
  if (!cc) cc = '+91';
  if (!cc.startsWith('+')) cc = `+${cc}`;

  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.length >= 6) {
    const visiblePart = digits.slice(0, digits.length - 6);
    return `${cc} ${visiblePart}******`.trim();
  }
  return `${cc} ******`.trim();
};

// Normalize assignment category strings (CREDIT CARD, Credit Card, credit_card, LOC/EOC, loc_eoc, etc.) to canonical keys
const normalizeAssignmentCategory = (cat) => {
  if (!cat) return 'credit_card';
  const c = String(cat).trim().toLowerCase().replace(/[\s\/-]+/g, '_');
  if (['credit_card', 'creditcard', 'cards', 'card'].includes(c)) return 'credit_card';
  if (['loc_eoc', 'loceoc', 'loc', 'eoc', 'loan_on_credit_card', 'smart_emi', 'loan_on_card', 'card_on_loan'].includes(c)) return 'loc_eoc';
  if (['personal_loan', 'personalloan', 'pl', 'personal', 'cibil_loan', 'cibil', 'loan', 'loans'].includes(c)) return 'personal_loan';
  if (['business_loan', 'businessloan', 'bl', 'business'].includes(c)) return 'business_loan';
  if (['home_loan', 'homeloan', 'hl', 'home'].includes(c)) return 'home_loan';
  if (['insurance'].includes(c)) return 'insurance';
  return c;
};

// Check if request originates from an employee, HR, operator, or staff user (as opposed to an external partner)
const isEmployeeOrStaffUser = (req) => {
  if (!req) return false;
  const rawRole = String(req.user?.role || req.user?.user_role || '').toUpperCase().trim();
  const designation = String(req.user?.designation || req.employee?.designation || '').toUpperCase().trim();

  const staffRoles = [
    'EMPLOYEE', 'HR', 'TELECALLER', 'TEAM_LEADER', 'SALES_EXECUTIVE',
    'ADMIN', 'SUPER_ADMIN', 'OPERATIONAL_HEAD', 'OPERATIONS_HEAD', 'OPERATIONAL HEAD', 'OPERATIONS HEAD',
    'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'OPERATOR', 'BACKEND', 'BACKEND OPERATION', 'BACKEND_OPERATION', 'BACKEND OPERATOR',
    'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_OPERATOR', 'ADMINISTRATIVE SALES OPERATOR',
    'PAN_CHECKER', 'PAN CHECKER', 'QD_OPERATOR', 'QD OPERATOR', 'REMARK_OPERATOR', 'REMARK OPERATOR', 'FINAL_STATUS_OPERATOR', 'FINAL STATUS OPERATOR',
    'QUERABLE_OPERATOR', 'QUERABLE OPERATOR', 'QUERYABLE_OPERATOR', 'QUERYABLE OPERATOR',
    'PHYSICAL_CURABLE', 'PHYSICAL CURABLE', 'DIGITAL_CURABLE', 'DIGITAL CURABLE', 'EMAIL_CURABLE', 'EMAIL CURABLE',
    'PHYSICAL_CURABLE_OPERATOR', 'PHYSICAL CURABLE OPERATOR', 'DIGITAL_CURABLE_OPERATOR', 'DIGITAL CURABLE OPERATOR', 'EMAIL_CURABLE_OPERATOR', 'EMAIL CURABLE OPERATOR'
  ];

  if (staffRoles.includes(rawRole)) return true;
  if (staffRoles.some(r => designation.includes(r))) return true;
  if (Boolean(req.employee || req.user?.employee_id || req.user?.emp_code)) return true;
  return false;
};

module.exports = {
  generateAppNumber,
  generatePartnerCode,
  generateRandomReferralCode,
  generateTeamCode,
  hashOTP,
  generateOTP,
  calculateCommission,
  getPaginationParams,
  buildWhereClause,
  sanitizeMobile,
  maskMobileLast6,
  normalizeAssignmentCategory,
  isEmployeeOrStaffUser,
};

