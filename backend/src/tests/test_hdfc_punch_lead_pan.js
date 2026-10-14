const assert = require('assert');

// 1. Indian PAN Format Regex
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const validatePan = (input) => {
  if (!input || typeof input !== 'string') return false;
  const clean = input.trim().toUpperCase();
  return PAN_REGEX.test(clean);
};

const formatPan = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input.trim().toUpperCase();
};

// 2. HDFC Credit Card Identification Helper
const isHdfcCreditCardProduct = (product) => {
  if (!product) return false;
  const HDFC_BANK_ID = 'f0b5742d-f04d-4a91-b162-6009ddf6e345';
  const bId = String(product.bank_id || '');
  const bName = String(product.bank_name || product.bank_code || '').toUpperCase();
  const pName = String(product.name || product.product_name || '').toUpperCase();
  
  const isHdfc = bId === HDFC_BANK_ID || bName.includes('HDFC') || pName.includes('HDFC');
  
  const prodCat = String(product.category || '').toLowerCase();
  const isLocEoc = ['loc', 'eoc', 'loc_eoc', 'loan_on_credit_card', 'smart_emi', 'loan_on_card', 'card_on_loan'].includes(prodCat);
  const isOtherCat = prodCat.includes('loan') || prodCat.includes('insurance');
  const isCreditCard = !isLocEoc && !isOtherCat;
  
  return isHdfc && isCreditCard;
};

// 3. Validation Logic for Punch Lead Application Flow
const validatePunchLeadApplication = (product, formData) => {
  const errors = {};
  const { customerName, mobile, panNumber, processType = 'lead_punching' } = formData;

  if (!customerName || customerName.trim().length < 2) {
    errors.customerName = 'Customer Name must be at least 2 characters.';
  }
  if (!mobile || !/^[6-9]\d{9}$/.test(String(mobile).trim())) {
    errors.mobile = 'Please enter a valid 10-digit mobile number.';
  }

  const isHdfcCc = isHdfcCreditCardProduct(product);
  if (isHdfcCc) {
    const cleanPan = formatPan(panNumber);
    if (processType === 'lead_punching') {
      if (!cleanPan || !PAN_REGEX.test(cleanPan)) {
        errors.panNumber = 'Please enter a valid 10-character PAN Card number (e.g. ABCDE1234F).';
      }
    } else if (cleanPan && !PAN_REGEX.test(cleanPan)) {
      errors.panNumber = 'Please enter a valid 10-character PAN Card number (e.g. ABCDE1234F).';
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

// ----------------- TEST SUITE -----------------
console.log('--- Testing PAN Regex Validation ---');
// Positive PAN cases
assert.strictEqual(validatePan('ABCDE1234F'), true, 'Valid PAN ABCDE1234F must pass');
assert.strictEqual(validatePan('abcde1234f'), true, 'Lowercase PAN must be validated when cleaned');
assert.strictEqual(validatePan('AAAPA1234C'), true, 'Valid PAN AAAPA1234C must pass');
assert.strictEqual(validatePan('ZZZZZ9999Z'), true, 'Valid boundary PAN ZZZZZ9999Z must pass');
assert.strictEqual(formatPan(' abcde1234f '), 'ABCDE1234F', 'formatPan must trim and uppercase');

// Negative PAN cases
assert.strictEqual(validatePan(''), false, 'Empty string is not valid PAN');
assert.strictEqual(validatePan(null), false, 'null is not valid PAN');
assert.strictEqual(validatePan(undefined), false, 'undefined is not valid PAN');
assert.strictEqual(validatePan('ABCD1234F'), false, '9-char PAN must fail');
assert.strictEqual(validatePan('ABCDE12345'), false, 'PAN ending in digit must fail');
assert.strictEqual(validatePan('12345ABCDE'), false, 'PAN starting with numbers must fail');
assert.strictEqual(validatePan('ABCDE12345F'), false, '11-char PAN must fail');
assert.strictEqual(validatePan('ABCDE123456'), false, 'All number tail must fail');
assert.strictEqual(validatePan('ABC-E1234F'), false, 'Special characters must fail');
console.log('✓ PAN Regex validation tests passed');

console.log('--- Testing HDFC Credit Card Detection & Isolation ---');
const HDFC_BANK_ID = 'f0b5742d-f04d-4a91-b162-6009ddf6e345';
const SBI_BANK_ID = 'e7c2c604-139d-4fcf-a87c-695633535a02';
const ICICI_BANK_ID = 'b3d6874a-251c-4b5b-8f3e-8c679a987111';

// HDFC Credit Cards (Must match)
assert.strictEqual(isHdfcCreditCardProduct({ bank_id: HDFC_BANK_ID, name: 'HDFC Millennia', category: 'credit_card' }), true);
assert.strictEqual(isHdfcCreditCardProduct({ bank_name: 'HDFC Bank', name: 'Regalia Gold', category: 'credit_card' }), true);
assert.strictEqual(isHdfcCreditCardProduct({ bank_code: 'HDFC', name: 'Freedom Card', category: 'cards' }), true);
assert.strictEqual(isHdfcCreditCardProduct({ bank_name: 'HDFC Bank', name: 'Swiggy HDFC Card', category: 'co_branded_card' }), true);
assert.strictEqual(isHdfcCreditCardProduct({ bank_id: HDFC_BANK_ID, name: 'Tata Neu Plus HDFC', category: 'co_branded_card' }), true);
assert.strictEqual(isHdfcCreditCardProduct({ bank_name: 'HDFC', name: 'Pixel Play', category: '' }), true);

// Other Bank Credit Cards (Must NOT match)
assert.strictEqual(isHdfcCreditCardProduct({ bank_id: SBI_BANK_ID, bank_name: 'SBI Card', name: 'SimplyCLICK', category: 'credit_card' }), false);
assert.strictEqual(isHdfcCreditCardProduct({ bank_id: ICICI_BANK_ID, bank_name: 'ICICI Bank', name: 'Coral Card', category: 'credit_card' }), false);
assert.strictEqual(isHdfcCreditCardProduct({ bank_name: 'Axis Bank', name: 'Neo Card', category: 'credit_card' }), false);

// Other Application Categories for HDFC (Must NOT match - preserve all other categories)
assert.strictEqual(isHdfcCreditCardProduct({ bank_id: HDFC_BANK_ID, name: 'HDFC Jumbo Loan', category: 'loan_on_credit_card' }), false);
assert.strictEqual(isHdfcCreditCardProduct({ bank_id: HDFC_BANK_ID, name: 'HDFC Insta Loan', category: 'loc_eoc' }), false);
assert.strictEqual(isHdfcCreditCardProduct({ bank_id: HDFC_BANK_ID, name: 'HDFC Smart EMI', category: 'smart_emi' }), false);
assert.strictEqual(isHdfcCreditCardProduct({ bank_id: HDFC_BANK_ID, name: 'HDFC Personal Loan', category: 'personal_loan' }), false);
assert.strictEqual(isHdfcCreditCardProduct({ bank_id: HDFC_BANK_ID, name: 'HDFC Life Insurance', category: 'insurance' }), false);
console.log('✓ HDFC Credit Card detection and category isolation tests passed');

console.log('--- Testing Punch Lead Form Validation Behavior ---');
const hdfcCard = { bank_id: HDFC_BANK_ID, bank_name: 'HDFC Bank', name: 'HDFC Regalia', category: 'credit_card' };
const iciciCard = { bank_id: ICICI_BANK_ID, bank_name: 'ICICI Bank', name: 'ICICI Sapphiro', category: 'credit_card' };

// 1. HDFC Credit Card in lead_punching without PAN -> FAILS
const res1 = validatePunchLeadApplication(hdfcCard, {
  customerName: 'Rahul Sharma',
  mobile: '9876543210',
  panNumber: '',
  processType: 'lead_punching'
});
assert.strictEqual(res1.isValid, false);
assert.ok(res1.errors.panNumber, 'panNumber error must be set for empty PAN on HDFC Credit Card');

// 2. HDFC Credit Card in lead_punching with invalid PAN -> FAILS
const res2 = validatePunchLeadApplication(hdfcCard, {
  customerName: 'Rahul Sharma',
  mobile: '9876543210',
  panNumber: 'INVALID123',
  processType: 'lead_punching'
});
assert.strictEqual(res2.isValid, false);
assert.ok(res2.errors.panNumber, 'panNumber error must be set for invalid PAN format');

// 3. HDFC Credit Card in lead_punching with valid lowercase PAN -> PASSES (converted to uppercase)
const res3 = validatePunchLeadApplication(hdfcCard, {
  customerName: 'Rahul Sharma',
  mobile: '9876543210',
  panNumber: 'abcde1234f',
  processType: 'lead_punching'
});
assert.strictEqual(res3.isValid, true, 'Valid PAN must pass validation');
assert.strictEqual(formatPan('abcde1234f'), 'ABCDE1234F', 'Input must convert to uppercase');

// 4. Non-HDFC bank card (e.g. ICICI) in lead_punching without PAN -> PASSES (PAN not required for other banks)
const res4 = validatePunchLeadApplication(iciciCard, {
  customerName: 'Aman Gupta',
  mobile: '9876543210',
  panNumber: '',
  processType: 'lead_punching'
});
assert.strictEqual(res4.isValid, true, 'Non-HDFC card must not require PAN');

// 5. HDFC LOC/EOC in lead_punching without PAN -> PASSES (other categories preserved)
const hdfcLoc = { bank_id: HDFC_BANK_ID, bank_name: 'HDFC Bank', name: 'HDFC Jumbo Loan', category: 'loan_on_credit_card' };
const res5 = validatePunchLeadApplication(hdfcLoc, {
  customerName: 'Pooja Verma',
  mobile: '9876543210',
  panNumber: '',
  processType: 'lead_punching'
});
assert.strictEqual(res5.isValid, true, 'HDFC LOC/EOC must not require PAN');

console.log('✓ Punch Lead form validation behavior tests passed');
console.log('All tests completed successfully!');
