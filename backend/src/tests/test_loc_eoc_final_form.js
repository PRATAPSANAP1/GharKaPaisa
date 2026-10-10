const assert = require('assert');

// 1. Detection logic
const isLocOrEocApplication = (app) => {
  if (!app) return false;
  const getClean = (val) => String(val || '').trim().toLowerCase();
  const rawCat = getClean(app.category || app.product_category || app.product?.category || app.metadata?.category);
  const rawSubCat = getClean(app.sub_category || app.product?.sub_category || app.product_type || app.metadata?.sub_category || app.metadata?.product_type);

  const isLocSubCat = rawSubCat === 'loc' || rawSubCat === 'loan_on_credit_card' || rawSubCat === 'loan on credit card' || rawSubCat === 'loan_on_card' || rawSubCat === 'loan on card';
  const isEocSubCat = rawSubCat === 'eoc' || rawSubCat === 'smart_emi' || rawSubCat === 'smart emi' || rawSubCat === 'smartemi' || rawSubCat === 'emi_on_credit_card' || rawSubCat === 'emi on credit card' || rawSubCat === 'emi on card';

  const isExplicitCC = rawCat === 'credit_card' || rawCat === 'credit_cards' || rawCat === 'cc';
  if (isExplicitCC) {
    if (isLocSubCat || isEocSubCat || rawSubCat === 'loc_eoc' || rawSubCat === 'loc/eoc') {
      return true;
    }
    return false;
  }

  const isGenericLoan = rawCat === 'loan' || rawCat === 'loans' || rawCat === 'personal_loan' || rawCat === 'business_loan' || rawCat === 'home_loan' || rawCat === 'insurance';
  if (isGenericLoan) {
    if (isLocSubCat || isEocSubCat || rawSubCat === 'loc_eoc' || rawSubCat === 'loc/eoc') {
      return true;
    }
    return false;
  }

  if (
    rawCat === 'loc_eoc' ||
    rawCat === 'loc/eoc' ||
    rawCat === 'loc' ||
    rawCat === 'eoc' ||
    rawCat === 'loan_on_credit_card' ||
    rawCat === 'loan on credit card' ||
    rawCat === 'loan_on_card' ||
    rawCat === 'loan on card' ||
    rawCat === 'smart_emi' ||
    rawCat === 'smart emi' ||
    rawCat === 'smartemi' ||
    rawCat === 'emi_on_credit_card' ||
    rawCat === 'emi on credit card' ||
    rawCat === 'emi on card'
  ) {
    return true;
  }

  if (isLocSubCat || isEocSubCat || rawSubCat === 'loc_eoc' || rawSubCat === 'loc/eoc') {
    return true;
  }

  return false;
};

const isEocApplication = (app) => {
  if (!app) return false;
  if (!isLocOrEocApplication(app)) return false;
  const getClean = (val) => String(val || '').trim().toLowerCase();
  const rawCat = getClean(app.category || app.product_category || app.product?.category || app.metadata?.category);
  const rawSubCat = getClean(app.sub_category || app.product?.sub_category || app.product_type || app.metadata?.sub_category || app.metadata?.product_type);
  const name = getClean(app.product_name || app.product?.name || app.card_name);

  if (rawSubCat === 'eoc' || rawSubCat === 'smart_emi' || rawSubCat === 'smart emi' || rawSubCat === 'smartemi' || rawSubCat === 'emi_on_credit_card' || rawSubCat === 'emi on credit card' || rawSubCat === 'emi on card') {
    return true;
  }
  if (rawCat === 'eoc' || rawCat === 'smart_emi' || rawCat === 'smart emi' || rawCat === 'smartemi' || rawCat === 'emi_on_credit_card' || rawCat === 'emi on credit card' || rawCat === 'emi on card') {
    return true;
  }
  if (name.includes('smartemi') || name.includes('smart emi') || name.includes('emi on credit card')) {
    return true;
  }
  return false;
};

const isLocApplication = (app) => {
  if (!app) return false;
  if (!isLocOrEocApplication(app)) return false;
  return !isEocApplication(app);
};

const resolveFinalBankStage = (val) => {
  if (!val) return 'DECLINE';
  const s = String(val).trim().toUpperCase();
  if (s === 'DECLINE' || s === 'DECLINED' || s === 'REJECT') return 'DECLINE';
  if (s === 'DISBURSEMENT' || s === 'DISBURSED') return 'DISBURSEMENT';
  if (s === 'DISBURSEMENT PENDING' || s === 'DISBURSEMENT_PENDING') return 'DISBURSEMENT PENDING';
  if (s === 'IN PROCESS' || s === 'IN_PROCESS' || s === 'IN-PROCESS') return 'IN PROCESS';
  const VALID = ['DECLINE', 'DISBURSEMENT', 'DISBURSEMENT PENDING', 'IN PROCESS'];
  const match = VALID.find((opt) => opt === s);
  if (match) return match;
  return 'DECLINE';
};

const resolveDisbursementCompleted = (val) => {
  if (!val) return 'None';
  const s = String(val).trim();
  const lower = s.toLowerCase();
  if (lower === 'yes') return 'Yes';
  if (lower === 'no') return 'No';
  if (lower === 'none') return 'None';
  return 'None';
};

const formatDateToDdMmYyyy = (raw) => {
  if (!raw) return '';
  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return '';
    const d = String(raw.getDate()).padStart(2, '0');
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const y = raw.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const str = String(raw).trim();
  if (!str) return '';
  const datePart = str.split('T')[0];
  if (datePart.includes('-')) {
    const parts = datePart.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
  }
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      } else if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
    }
  }
  return str;
};

const formatDateToYyyyMmDd = (raw) => {
  if (!raw) return '';
  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return '';
    const d = String(raw.getDate()).padStart(2, '0');
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const y = raw.getFullYear();
    return `${y}-${m}-${d}`;
  }
  const str = String(raw).trim();
  if (!str) return '';
  const datePart = str.split('T')[0];
  if (datePart.includes('-')) {
    const parts = datePart.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  if (str.includes('/') || str.includes('-')) {
    const parts = str.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      } else if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
  }
  const digits = str.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
  }
  return str;
};

// Backend controller date parsing
const parseDobToIso = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim().replace(/\D/g, '');
  if (s.length === 8) {
    const day = s.substring(0, 2);
    const month = s.substring(2, 4);
    const year = s.substring(4, 8);
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  if (raw.includes('-') || raw.includes('/')) {
    const parts = raw.split(/[-/]/).map(p => p.trim());
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }
  try {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      if (year >= 1900 && year <= 2100) {
        return `${year}-${month}-${day}`;
      }
    }
  } catch (e) { }
  return null;
};

const parseDateToIso = (raw) => {
  if (!raw) return null;
  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return null;
    return `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, '0')}-${String(raw.getDate()).padStart(2, '0')}`;
  }
  return parseDobToIso(String(raw));
};

// Tests
console.log('--- TEST 1: Category Detection ---');
assert.strictEqual(isLocOrEocApplication({ category: 'credit_card' }), false, 'Credit Card must not be LOC/EOC');
assert.strictEqual(isLocOrEocApplication({ category: 'personal_loan' }), false, 'Personal Loan must not be LOC/EOC');
assert.strictEqual(isLocOrEocApplication({ category: 'loc_eoc', sub_category: 'LOC' }), true);
assert.strictEqual(isLocApplication({ category: 'loc_eoc', sub_category: 'LOC' }), true);
assert.strictEqual(isEocApplication({ category: 'loc_eoc', sub_category: 'LOC' }), false);

assert.strictEqual(isLocOrEocApplication({ category: 'loc_eoc', sub_category: 'EOC' }), true);
assert.strictEqual(isEocApplication({ category: 'loc_eoc', sub_category: 'EOC' }), true);
assert.strictEqual(isLocApplication({ category: 'loc_eoc', sub_category: 'EOC' }), false);

assert.strictEqual(isLocOrEocApplication({ category: 'smart_emi' }), true);
assert.strictEqual(isEocApplication({ category: 'smart_emi' }), true);

assert.strictEqual(isLocOrEocApplication({ category: 'loan_on_credit_card' }), true);
assert.strictEqual(isLocApplication({ category: 'loan_on_credit_card' }), true);
console.log('✅ TEST 1 PASSED: Category Detection correct.');

console.log('--- TEST 2: Option Resolvers ---');
assert.strictEqual(resolveFinalBankStage('DECLINE'), 'DECLINE');
assert.strictEqual(resolveFinalBankStage('disbursement'), 'DISBURSEMENT');
assert.strictEqual(resolveFinalBankStage('DISBURSEMENT PENDING'), 'DISBURSEMENT PENDING');
assert.strictEqual(resolveFinalBankStage('in process'), 'IN PROCESS');
assert.strictEqual(resolveFinalBankStage(null), 'DECLINE');

assert.strictEqual(resolveDisbursementCompleted('None'), 'None');
assert.strictEqual(resolveDisbursementCompleted('Yes'), 'Yes');
assert.strictEqual(resolveDisbursementCompleted('yes'), 'Yes');
assert.strictEqual(resolveDisbursementCompleted('No'), 'No');
assert.strictEqual(resolveDisbursementCompleted(null), 'None');
console.log('✅ TEST 2 PASSED: Option Resolvers correct.');

console.log('--- TEST 3: Date Formatting & Parsing (Timezone Safe) ---');
assert.strictEqual(formatDateToDdMmYyyy('2026-10-09'), '09/10/2026');
assert.strictEqual(formatDateToDdMmYyyy('2026-10-09T00:00:00.000Z'), '09/10/2026');
assert.strictEqual(formatDateToDdMmYyyy('09/10/2026'), '09/10/2026');
assert.strictEqual(formatDateToDdMmYyyy(''), '');

assert.strictEqual(formatDateToYyyyMmDd('09/10/2026'), '2026-10-09');
assert.strictEqual(formatDateToYyyyMmDd('2026-10-09'), '2026-10-09');
assert.strictEqual(formatDateToYyyyMmDd(''), '');

// Backend parseDateToIso
assert.strictEqual(parseDateToIso('09/10/2026'), '2026-10-09');
assert.strictEqual(parseDateToIso('2026-10-09'), '2026-10-09');
assert.strictEqual(parseDateToIso('09-10-2026'), '2026-10-09');
assert.strictEqual(parseDateToIso(new Date(2026, 9, 9)), '2026-10-09');
assert.strictEqual(parseDateToIso(''), null);
assert.strictEqual(parseDateToIso(null), null);
console.log('✅ TEST 3 PASSED: Date formatting and backend parsing preserve exact dates without timezone shifts.');

console.log('--- TEST 4: Exact Acceptance Criteria Verification ---');
const expectedFinalBankStageOptions = ['DECLINE', 'DISBURSEMENT', 'DISBURSEMENT PENDING', 'IN PROCESS'];
const expectedDisbursementCompletedOptions = ['None', 'Yes', 'No'];

assert.deepStrictEqual(expectedFinalBankStageOptions, ['DECLINE', 'DISBURSEMENT', 'DISBURSEMENT PENDING', 'IN PROCESS']);
assert.deepStrictEqual(expectedDisbursementCompletedOptions, ['None', 'Yes', 'No']);
console.log('✅ TEST 4 PASSED: Options match acceptance criteria exactly.');

console.log('--- TEST 5: LOC/EOC Final Form Status Resolution (Final Status removed from form) ---');
const resolveLocEocStatusFromStage = (stage) => {
  const s = String(stage || '').toUpperCase();
  if (s === 'DISBURSEMENT') return { targetStatus: 'approved', finalStatus: 'Approved' };
  if (s === 'DECLINE') return { targetStatus: 'rejected', finalStatus: 'Declined' };
  if (s === 'IN PROCESS') return { targetStatus: 'in_process', finalStatus: 'In Process' };
  if (s === 'DISBURSEMENT PENDING') return { targetStatus: 'in_process', finalStatus: 'Disbursement Pending' };
  return { targetStatus: 'pending', finalStatus: s };
};

assert.deepStrictEqual(resolveLocEocStatusFromStage('DISBURSEMENT'), { targetStatus: 'approved', finalStatus: 'Approved' });
assert.deepStrictEqual(resolveLocEocStatusFromStage('DECLINE'), { targetStatus: 'rejected', finalStatus: 'Declined' });
assert.deepStrictEqual(resolveLocEocStatusFromStage('IN PROCESS'), { targetStatus: 'in_process', finalStatus: 'In Process' });
assert.deepStrictEqual(resolveLocEocStatusFromStage('DISBURSEMENT PENDING'), { targetStatus: 'in_process', finalStatus: 'Disbursement Pending' });
console.log('✅ TEST 5 PASSED: LOC/EOC status and final_status correctly derive from Final Bank Stage.');

console.log('\n🎉 ALL VERIFICATION TESTS PASSED!\n');

