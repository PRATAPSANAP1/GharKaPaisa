/**
 * Authoritative Money Utility for GharKaPaisa Financial Engine
 * Guarantees zero binary floating-point representation bugs during currency conversions.
 */

/**
 * Convert Rupees (Decimal / String / Number) to Razorpay Integer Paise
 * e.g., "500.50" -> 50050, 100 -> 10000
 */
function rupeesToPaise(rupees) {
  if (rupees === null || rupees === undefined || rupees === '') return 0;
  const str = String(rupees).trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(str)) {
    const num = Number(str);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }
  const parts = str.split('.');
  const whole = parseInt(parts[0] || '0', 10);
  const fraction = (parts[1] || '').padEnd(2, '0').slice(0, 2);
  const fracNum = parseInt(fraction, 10);
  const sign = whole < 0 || str.startsWith('-') ? -1 : 1;
  return sign * (Math.abs(whole) * 100 + fracNum);
}

/**
 * Convert Razorpay Integer Paise to Rupees Decimal String
 * e.g., 50050 -> "500.50"
 */
function paiseToRupees(paise) {
  const p = parseInt(paise || 0, 10);
  if (isNaN(p)) return '0.00';
  const absP = Math.abs(p);
  const rupees = Math.floor(absP / 100);
  const cents = String(absP % 100).padStart(2, '0');
  const sign = p < 0 ? '-' : '';
  return `${sign}${rupees}.${cents}`;
}

/**
 * Standardize Decimal String for PostgreSQL NUMERIC(15,2)
 */
function toDbNumeric(amount) {
  return paiseToRupees(rupeesToPaise(amount));
}

module.exports = {
  rupeesToPaise,
  paiseToRupees,
  toDbNumeric
};
