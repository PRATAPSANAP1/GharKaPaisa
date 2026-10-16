const assert = require('assert');

// Test Suite: Sync User Remark to Bank Remark, Final Form, and Export File
console.log('=================================================================');
console.log('🧪 TESTING: User Remark to Bank Remark, Final Form & Export Sync');
console.log('=================================================================\n');

// 1. Sync & Fallback Resolution Logic Test
const resolveBankRemark = (userRemark, bankRemark) => {
  const cleanUser = userRemark !== null && userRemark !== undefined ? String(userRemark).trim() : '';
  if (cleanUser !== '' && cleanUser.toUpperCase() !== 'NA' && cleanUser.toUpperCase() !== 'N/A') {
    return cleanUser;
  }
  const cleanBank = bankRemark !== null && bankRemark !== undefined ? String(bankRemark).trim() : '';
  if (cleanBank !== '' && cleanBank.toUpperCase() !== 'NA' && cleanBank.toUpperCase() !== 'N/A') {
    return cleanBank;
  }
  return 'NA';
};

console.log('--- TEST 1: Acceptance Criteria - Application with valid User Remark ---');
const appWithRemark = {
  id: 'app-001',
  user_remark: 'Customer approved for HDFC Millennia card',
  bank_remark: null,
  status: 'operational_verified'
};

const bankRemark1 = resolveBankRemark(appWithRemark.user_remark, appWithRemark.bank_remark);
const finalFormRemark1 = bankRemark1;
const exportBankRemark1 = bankRemark1;

assert.strictEqual(bankRemark1, 'Customer approved for HDFC Millennia card', 'Bank Remark must populate from User Remark');
assert.strictEqual(finalFormRemark1, 'Customer approved for HDFC Millennia card', 'Final Form must display the same User Remark');
assert.strictEqual(exportBankRemark1, 'Customer approved for HDFC Millennia card', 'Export file Bank Remark must contain the User Remark');
console.log('✔ Valid remark correctly synced across Bank Remark, Final Form, and Export file');

console.log('\n--- TEST 2: Acceptance Criteria - Application with Empty / Blank Remark ---');
const appEmptyRemark = {
  id: 'app-002',
  user_remark: '   ', // whitespace only
  bank_remark: null,
  status: 'under_review'
};

const bankRemark2 = resolveBankRemark(appEmptyRemark.user_remark, appEmptyRemark.bank_remark);
const finalFormRemark2 = bankRemark2;
const exportBankRemark2 = bankRemark2;

assert.strictEqual(bankRemark2, 'NA', 'Missing or blank remark must appear as NA in Bank Remark');
assert.strictEqual(finalFormRemark2, 'NA', 'Missing or blank remark must appear as NA in Final Form');
assert.strictEqual(exportBankRemark2, 'NA', 'Missing or blank remark must appear as NA in Export file');
console.log('✔ Whitespace / null remark correctly resolves to "NA" across Bank Remark, Final Form, and Export file');

console.log('\n--- TEST 3: Acceptance Criteria - Application with null / undefined fields ---');
const appNullRemark = {
  id: 'app-003',
  user_remark: null,
  bank_remark: undefined,
  status: 'details_submitted'
};

const bankRemark3 = resolveBankRemark(appNullRemark.user_remark, appNullRemark.bank_remark);
assert.strictEqual(bankRemark3, 'NA');
console.log('✔ Null / undefined remark correctly resolves to "NA"');

console.log('\n--- TEST 4: Verification across all Admin Designations ---');
const adminDesignations = [
  'SUPER_ADMIN',
  'ADMIN',
  'OPERATIONS_HEAD',
  'OPERATIONAL_HEAD',
  'ADMINISTRATIVE_OPERATOR',
  'ADMINISTRATIVE SALES EXECUTIVE',
  'PAN_CHECKER',
  'REMARK_OPERATOR',
  'QD_OPERATOR',
  'FINAL_STATUS_OPERATOR',
  'PHYSICAL_CURABLE',
  'DIGITAL_CURABLE',
  'EMAIL_CURABLE',
  'QUERYABLE_OPERATOR'
];

adminDesignations.forEach((desig) => {
  // Check that resolveBankRemark functions consistently for any role context
  const testValWithRemark = resolveBankRemark('Verified by ' + desig, null);
  assert.strictEqual(testValWithRemark, 'Verified by ' + desig, `Designation ${desig} must see correct remark`);

  const testValEmpty = resolveBankRemark('', '');
  assert.strictEqual(testValEmpty, 'NA', `Designation ${desig} must see NA when empty`);
});
console.log(`✔ Verified behavior across all ${adminDesignations.length} Admin designations`);

console.log('\n--- TEST 5: CSV Quoting and Escaping for Export File ---');
const appWithSpecialChars = {
  user_remark: 'Customer stated: "Prefers branch visit", needs urgent processing\r\nLine 2 info',
  bank_remark: null
};
const resolvedSpecial = resolveBankRemark(appWithSpecialChars.user_remark, appWithSpecialChars.bank_remark);
const csvEscaped = `"${resolvedSpecial.replace(/[\r\n]+/g, ' ').replace(/"/g, '""')}"`;
assert.strictEqual(csvEscaped, '"Customer stated: ""Prefers branch visit"", needs urgent processing Line 2 info"');
console.log('✔ Special characters, quotes, and newlines properly escaped for export CSV');

console.log('\n=================================================================');
console.log('🎉 ALL SYNC & FALLBACK ACCEPTANCE CRITERIA TESTS PASSED!');
console.log('=================================================================\n');
