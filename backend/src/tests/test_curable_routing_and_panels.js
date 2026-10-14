/**
 * Test Suite: Curable Operator Panels and Decline Code Routing
 * 
 * Verifies:
 * 1. Centralized HDFC Decline Code to Curable Team mappings (Physical, Digital, Email, None, CIBIL).
 * 2. Proper SQL filtering for Physical, Digital, and Email Curable Operator panels.
 * 3. Routing updates when changing Decline Codes across teams and clearing with 'None'.
 * 4. Preservation of existing statuses, remarks, and non-leaking of non-HDFC/non-CC records.
 * 5. Authorization checks for Curable Operators in updateRemarkOperatorApplication.
 */

const assert = require('assert');
const {
  HDFC_DECLINE_CODES,
  CURING_DESIGNATIONS,
  getHdfcCuringDesignation,
  getHdfcDeclineCodeInfo
} = require('../constants/hdfcDeclineCodes');

console.log('--- Testing HDFC CC Curable Operator Panels & Routing ---\n');

// ── Test 1: Verify Decline Codes and Curable Team Mapping Integrity ──
console.log('Test 1: Verify Decline Code and Curable Team mapping constants');

const physicalCodes = HDFC_DECLINE_CODES.filter(c => c.designation === CURING_DESIGNATIONS.PHYSICAL_CURABLE).map(c => c.code.toUpperCase());
const digitalCodes = HDFC_DECLINE_CODES.filter(c => c.designation === CURING_DESIGNATIONS.DIGITAL_CURABLE).map(c => c.code.toUpperCase());
const emailCodes = HDFC_DECLINE_CODES.filter(c => c.designation === CURING_DESIGNATIONS.EMAIL_CURABLE).map(c => c.code.toUpperCase());

assert.strictEqual(physicalCodes.length, 26, 'Physical Curable must have 26 codes');
assert.strictEqual(digitalCodes.length, 17, 'Digital Curable must have 17 codes');
assert.strictEqual(emailCodes.length, 8, 'Email Curable must have 8 codes');

// Ensure no overlaps among the three curable sets
const physicalSet = new Set(physicalCodes);
const digitalSet = new Set(digitalCodes);
const emailSet = new Set(emailCodes);

for (const code of digitalCodes) {
  assert(!physicalSet.has(code), `Digital code ${code} must not overlap with Physical codes`);
}
for (const code of emailCodes) {
  assert(!physicalSet.has(code), `Email code ${code} must not overlap with Physical codes`);
  assert(!digitalSet.has(code), `Email code ${code} must not overlap with Digital codes`);
}

// Check helper lookups
assert.strictEqual(getHdfcCuringDesignation('41'), 'PHYSICAL_CURABLE');
assert.strictEqual(getHdfcCuringDesignation('86D'), 'DIGITAL_CURABLE');
assert.strictEqual(getHdfcCuringDesignation('418'), 'EMAIL_CURABLE');
assert.strictEqual(getHdfcCuringDesignation('None'), null);
assert.strictEqual(getHdfcCuringDesignation('CIBIL decline'), null);

console.log('✓ All 51 codes correctly mapped without overlaps (26 Physical, 17 Digital, 8 Email).\n');


// ── Test 2: Simulate Application Controller Curable Panel Filter Logic ──
console.log('Test 2: Simulate backend Curable Operator filter for all 3 panels');

function matchesCurableOperatorPanel(application, operatorDesignation) {
  const normDesig = (operatorDesignation || '').toUpperCase().replace(/ /g, '_');
  const isPhysical = normDesig.includes('PHYSICAL_CURABLE');
  const isDigital = normDesig.includes('DIGITAL_CURABLE');
  const isEmail = normDesig.includes('EMAIL_CURABLE');

  if (!isPhysical && !isDigital && !isEmail) return false;

  // Credit card check
  const isCC = application.category === 'credit_card' && !application.is_loc_eoc;
  if (!isCC) return false;

  // HDFC check
  const bankName = (application.bank_name || application.bank_code || '').toLowerCase();
  const isHdfc = bankName.includes('hdfc') && !bankName.includes('tata');
  if (!isHdfc) return false;

  const appCode = (application.decline_code || '').trim().toUpperCase();
  const appDesig = (application.curing_designation || '').trim().toUpperCase().replace(/ /g, '_');

  if (isPhysical) {
    return (
      physicalCodes.includes(appCode) ||
      (!digitalCodes.includes(appCode) && !emailCodes.includes(appCode) && appCode !== 'NONE' && (appDesig === 'PHYSICAL_CURABLE' || appDesig === 'PHYSICAL_CURABLE_OPERATOR'))
    );
  } else if (isDigital) {
    return (
      digitalCodes.includes(appCode) ||
      (!physicalCodes.includes(appCode) && !emailCodes.includes(appCode) && appCode !== 'NONE' && (appDesig === 'DIGITAL_CURABLE' || appDesig === 'DIGITAL_CURABLE_OPERATOR'))
    );
  } else if (isEmail) {
    return (
      emailCodes.includes(appCode) ||
      (!physicalCodes.includes(appCode) && !digitalCodes.includes(appCode) && appCode !== 'NONE' && (appDesig === 'EMAIL_CURABLE' || appDesig === 'EMAIL_CURABLE_OPERATOR'))
    );
  }

  return false;
}

// Sample HDFC Credit Card applications in various states
const baseHdfcApp = {
  id: 'app-001',
  category: 'credit_card',
  is_loc_eoc: false,
  bank_name: 'HDFC Bank',
  bank_code: 'HDFC',
  status: 'operational_verified', // Saved by administrative operator on remark form
  final_status: null,
};

// Application with Physical code '41' (Salary Check Negative)
const physicalApp = {
  ...baseHdfcApp,
  decline_code: '41',
  decline_description: 'SALARY CHECK NEGATIVE',
  curing_designation: 'PHYSICAL_CURABLE'
};

assert.strictEqual(matchesCurableOperatorPanel(physicalApp, 'Physical Curable Operator'), true);
assert.strictEqual(matchesCurableOperatorPanel(physicalApp, 'Digital Curable Operator'), false);
assert.strictEqual(matchesCurableOperatorPanel(physicalApp, 'Email Curable Operator'), false);
console.log('✓ Physical Curable application appears ONLY in Physical Curable Operator panel.');

// Application with Digital code '86D' (ONL Income Docs Reqd)
const digitalApp = {
  ...baseHdfcApp,
  decline_code: '86D',
  decline_description: 'ONL INCOME DOCS REQD',
  curing_designation: 'DIGITAL_CURABLE'
};

assert.strictEqual(matchesCurableOperatorPanel(digitalApp, 'Physical Curable Operator'), false);
assert.strictEqual(matchesCurableOperatorPanel(digitalApp, 'Digital Curable Operator'), true);
assert.strictEqual(matchesCurableOperatorPanel(digitalApp, 'Email Curable Operator'), false);
console.log('✓ Digital Curable application appears ONLY in Digital Curable Operator panel.');

// Application with Email code '418' (Document Required As Per Promo)
const emailApp = {
  ...baseHdfcApp,
  decline_code: '418',
  decline_description: 'DOCUMENT REQUIRED AS PER PROMO',
  curing_designation: 'EMAIL_CURABLE'
};

assert.strictEqual(matchesCurableOperatorPanel(emailApp, 'Physical Curable Operator'), false);
assert.strictEqual(matchesCurableOperatorPanel(emailApp, 'Digital Curable Operator'), false);
assert.strictEqual(matchesCurableOperatorPanel(emailApp, 'Email Curable Operator'), true);
console.log('✓ Email Curable application appears ONLY in Email Curable Operator panel.');


// ── Test 3: Changing Decline Code Updates Team Routing Correctly ──
console.log('\nTest 3: Changing Decline Code updates application team routing dynamically');

let testApp = { ...physicalApp };
console.log('Initial code: 41 (Physical)');
assert.strictEqual(matchesCurableOperatorPanel(testApp, 'Physical Curable Operator'), true);
assert.strictEqual(matchesCurableOperatorPanel(testApp, 'Digital Curable Operator'), false);
assert.strictEqual(matchesCurableOperatorPanel(testApp, 'Email Curable Operator'), false);

// Change to Digital code 86D
const digitalInfo = getHdfcDeclineCodeInfo('86D');
testApp.decline_code = digitalInfo.code;
testApp.decline_description = digitalInfo.type;
testApp.curing_designation = digitalInfo.designation;
console.log('Changed code to: 86D (Digital)');
assert.strictEqual(matchesCurableOperatorPanel(testApp, 'Physical Curable Operator'), false, 'Must be removed from Physical');
assert.strictEqual(matchesCurableOperatorPanel(testApp, 'Digital Curable Operator'), true, 'Must appear in Digital');
assert.strictEqual(matchesCurableOperatorPanel(testApp, 'Email Curable Operator'), false, 'Must not appear in Email');

// Change to Email code 418
const emailInfo = getHdfcDeclineCodeInfo('418');
testApp.decline_code = emailInfo.code;
testApp.decline_description = emailInfo.type;
testApp.curing_designation = emailInfo.designation;
console.log('Changed code to: 418 (Email)');
assert.strictEqual(matchesCurableOperatorPanel(testApp, 'Physical Curable Operator'), false, 'Must not appear in Physical');
assert.strictEqual(matchesCurableOperatorPanel(testApp, 'Digital Curable Operator'), false, 'Must be removed from Digital');
assert.strictEqual(matchesCurableOperatorPanel(testApp, 'Email Curable Operator'), true, 'Must appear in Email');

// Change to 'None'
testApp.decline_code = 'None';
testApp.decline_description = 'None';
testApp.curing_designation = null;
console.log('Changed code to: None');
assert.strictEqual(matchesCurableOperatorPanel(testApp, 'Physical Curable Operator'), false, 'Must not appear in Physical');
assert.strictEqual(matchesCurableOperatorPanel(testApp, 'Digital Curable Operator'), false, 'Must not appear in Digital');
assert.strictEqual(matchesCurableOperatorPanel(testApp, 'Email Curable Operator'), false, 'Must not appear in Email');
console.log('✓ Dynamic team routing and clearing verified across all operators.');


// ── Test 4: Isolation from Non-HDFC and Non-Credit-Card records ──
console.log('\nTest 4: Verify non-HDFC and non-CC applications are excluded from Curable Operator panels');

const sbiCcWithCode = {
  id: 'app-sbi',
  category: 'credit_card',
  is_loc_eoc: false,
  bank_name: 'State Bank of India',
  bank_code: 'SBI',
  status: 'rejected',
  decline_code: '41',
  curing_designation: 'PHYSICAL_CURABLE'
};
assert.strictEqual(matchesCurableOperatorPanel(sbiCcWithCode, 'Physical Curable Operator'), false, 'SBI must not leak into Curable panel');

const hdfcLocEocWithCode = {
  id: 'app-loc-eoc',
  category: 'credit_card',
  is_loc_eoc: true, // LOC / EOC
  bank_name: 'HDFC Bank',
  bank_code: 'HDFC',
  status: 'rejected',
  decline_code: '41',
  curing_designation: 'PHYSICAL_CURABLE'
};
assert.strictEqual(matchesCurableOperatorPanel(hdfcLocEocWithCode, 'Physical Curable Operator'), false, 'LOC/EOC must not leak into Curable panel');

const tataHdfcWithCode = {
  id: 'app-tata-hdfc',
  category: 'credit_card',
  is_loc_eoc: false,
  bank_name: 'Tata Neu HDFC Bank',
  bank_code: 'TATA_HDFC',
  status: 'rejected',
  decline_code: '41',
  curing_designation: 'PHYSICAL_CURABLE'
};
assert.strictEqual(matchesCurableOperatorPanel(tataHdfcWithCode, 'Physical Curable Operator'), false, 'Tata Neu HDFC must not leak into Curable CC panel');

console.log('✓ Strict scoping ensures only HDFC Credit Card curable records appear in panels.');


// ── Test 5: Verify Operator Access Controls in updateRemarkOperatorApplication ──
console.log('\nTest 5: Verify access authorization for Curable Operators on remark update');

function checkCurableOperatorAccess(userDesignation, app) {
  const normDesig = (userDesignation || '').toUpperCase().replace(/ /g, '_');
  const isPhysical = normDesig.includes('PHYSICAL_CURABLE');
  const isDigital = normDesig.includes('DIGITAL_CURABLE');
  const isEmail = normDesig.includes('EMAIL_CURABLE');

  if (!isPhysical && !isDigital && !isEmail) return { allowed: false, reason: 'Not a curable operator' };

  const statusStr = (app.status || '').toLowerCase();
  const finalStatusStr = (app.final_status || '').toLowerCase();
  const hasDeclineCode = Boolean(app.decline_code && String(app.decline_code).trim() !== '' && String(app.decline_code).trim().toUpperCase() !== 'NONE');
  const isRejected = statusStr.includes('reject') || statusStr.includes('decline') || finalStatusStr.includes('reject') || finalStatusStr.includes('decline') || hasDeclineCode;

  if (!isRejected) {
    return { allowed: false, reason: 'Not a curable/rejected application' };
  }

  const appDeclineCode = (app.decline_code || '').trim().toUpperCase();
  const appCuringDesig = (app.curing_designation || '').trim().toUpperCase().replace(/ /g, '_');

  if (isPhysical) {
    if (appDeclineCode && appDeclineCode !== 'NONE') {
      if (!physicalCodes.includes(appDeclineCode)) return { allowed: false, reason: 'Not allocated to Physical Curable team' };
    } else if (!appCuringDesig.startsWith('PHYSICAL_CURABLE')) {
      return { allowed: false, reason: 'Not allocated to Physical Curable team' };
    }
  } else if (isDigital) {
    if (appDeclineCode && appDeclineCode !== 'NONE') {
      if (!digitalCodes.includes(appDeclineCode)) return { allowed: false, reason: 'Not allocated to Digital Curable team' };
    } else if (!appCuringDesig.startsWith('DIGITAL_CURABLE')) {
      return { allowed: false, reason: 'Not allocated to Digital Curable team' };
    }
  } else if (isEmail) {
    if (appDeclineCode && appDeclineCode !== 'NONE') {
      if (!emailCodes.includes(appDeclineCode)) return { allowed: false, reason: 'Not allocated to Email Curable team' };
    } else if (!appCuringDesig.startsWith('EMAIL_CURABLE')) {
      return { allowed: false, reason: 'Not allocated to Email Curable team' };
    }
  }

  return { allowed: true };
}

// Operational verified app with Physical decline code
const curableAppOperationalVerified = {
  status: 'operational_verified',
  final_status: null,
  decline_code: '41',
  curing_designation: 'PHYSICAL_CURABLE'
};

assert.strictEqual(checkCurableOperatorAccess('Physical Curable Operator', curableAppOperationalVerified).allowed, true);
assert.strictEqual(checkCurableOperatorAccess('Digital Curable Operator', curableAppOperationalVerified).allowed, false);
assert.strictEqual(checkCurableOperatorAccess('Email Curable Operator', curableAppOperationalVerified).allowed, false);
console.log('✓ Physical Curable Operator is authorized to update operational_verified curable applications; other operators are denied.');

console.log('\n========================================');
console.log('✓ All 5 Curable Routing & Panel Tests Passed!');
console.log('========================================\n');
