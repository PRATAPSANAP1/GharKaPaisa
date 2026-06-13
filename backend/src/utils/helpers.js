const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Generate unique application number: APP + YYYYMMDD + random 4 digits
const generateAppNumber = () => {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
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
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
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

module.exports = {
  generateAppNumber,
  generatePartnerCode,
  hashOTP,
  generateOTP,
  calculateCommission,
  getPaginationParams,
  buildWhereClause,
  sanitizeMobile,
};
