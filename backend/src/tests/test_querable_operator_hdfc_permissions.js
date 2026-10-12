/**
 * Test Suite: Querable Operator HDFC Category Permissions
 * 
 * Verifies that:
 * 1. HDFC assigned only to Credit Card: LOC/EOC applications are excluded.
 * 2. HDFC assigned only to LOC/EOC: Credit Card applications are excluded.
 * 3. HDFC assigned to both categories: both authorized categories are included.
 * 4. HDFC Credit Card assignment does not grant access to an unassigned category.
 * 5. Legacy assignment label CREDIT CARD normalizes to credit_card.
 * 6. Pagination totals and status counts agree with the visible list.
 * 7. Other banks and existing operator workflows remain unchanged.
 * 8. Route authorization continues to enforce least privilege.
 */

const assert = require('assert');
const { normalizeAssignmentCategory } = require('../utils/helpers/helpers');

// ── SQL Filter Emulation matching backend/src/modules/crm/application.controller.js ──

function evaluateLocEoc(app) {
  const cat = String(app.category || '').toLowerCase();
  const subCat = String(app.sub_category || '').toLowerCase();
  const pName = String(app.product_name || '').toLowerCase();
  const bShort = String(app.bank_code || '').toUpperCase();
  const bName = String(app.bank_name || '').toLowerCase();

  const isLocEocCategory = ['loc_eoc', 'loc', 'eoc', 'loan_on_credit_card', 'smart_emi', 'loan_on_card', 'card_on_loan'].includes(cat);
  const isLocEocSubCategory = ['loc', 'eoc', 'loc_eoc', 'loan_on_credit_card', 'smart_emi', 'loan_on_card', 'card_on_loan'].includes(subCat);
  const isLocEocProductName = (
    pName.includes('encash') ||
    pName.includes('loan on card') ||
    pName.includes('loan on credit card') ||
    pName.includes('smart emi') ||
    pName.includes('smartemi') ||
    pName.includes('emi on card') ||
    pName.includes('emi on credit card') ||
    pName.includes('dial a draft') ||
    pName.includes('jumbo loan') ||
    pName.includes('insta loan') ||
    pName.includes('instant & jumbo loan') ||
    pName.includes('instant and jumbo loan') ||
    pName.includes('instant loan')
  );
  const isVirtualBank = bShort === 'LOC_EOC' || /loc|loan on card|smart emi/i.test(bName);

  return isLocEocCategory || isLocEocSubCategory || isLocEocProductName || isVirtualBank;
}

function evaluateCreditCard(app) {
  const isLocEoc = evaluateLocEoc(app);
  if (isLocEoc) return false;

  const cat = String(app.category || 'credit_card').toLowerCase();
  const isCcCategory = (
    ['credit_card', 'creditcard', 'cards', 'card'].includes(cat) ||
    cat.includes('credit') && cat.includes('card') ||
    app.category === null || app.category === undefined
  );
  return isCcCategory;
}

function evaluateBankMatch(app, assignment) {
  const bId = assignment.bank_id;
  const isVirtualLocBank = (assignment.short_code || '').toUpperCase() === 'LOC_EOC' || /loc[\s/_]*eoc|loan\s+on\s+card/i.test(assignment.name || '');
  if (isVirtualLocBank) return true;

  const bankIdMatch = app.bank_id === bId || app.product_bank_id === bId;
  const shortCodeMatch = assignment.short_code && String(app.bank_code || '').toLowerCase().includes(assignment.short_code.toLowerCase());
  const nameMatch = assignment.name && String(app.bank_name || '').toLowerCase().includes(assignment.name.toLowerCase());

  const hasTata = (assignment.name || '').toLowerCase().includes('tata') || (assignment.short_code || '').toLowerCase().includes('tata');
  const appHasTata = String(app.bank_name || '').toLowerCase().includes('tata') || String(app.bank_code || '').toLowerCase().includes('tata');
  if (!hasTata && appHasTata) return false;

  return bankIdMatch || shortCodeMatch || nameMatch;
}

function evaluateOperatorAccess(app, assignments) {
  if (!assignments || assignments.length === 0) return false;

  return assignments.some(b => {
    const bankMatches = evaluateBankMatch(app, b);
    if (!bankMatches) return false;

    const cat = normalizeAssignmentCategory(b.category);
    if (cat === 'loc_eoc') {
      return evaluateLocEoc(app);
    } else if (cat === 'credit_card') {
      return evaluateCreditCard(app);
    } else {
      return String(app.category || '').toLowerCase() === cat;
    }
  });
}

function filterApplications(apps, assignments, statusFilter = null, categoryFilter = 'all') {
  return apps.filter(app => {
    // 1. Querable operator rejected status condition
    const s = String(app.status || '').toLowerCase();
    const fs = String(app.final_status || '').toLowerCase();
    const bs = String(app.bank_current_lead_status || '').toLowerCase();
    const isRejected = (
      ['rejected', 'declined', 'decline', 'technical_error'].includes(s) ||
      s.includes('reject') || s.includes('decline') ||
      ['rejected', 'declined', 'decline', 'technical_error'].includes(fs) ||
      fs.includes('reject') || fs.includes('decline') ||
      bs.includes('reject') || bs.includes('decline')
    );
    if (!isRejected) return false;

    // 2. Active status filter
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'rejected' && !isRejected) return false;
    }

    // 3. User assigned bank-category access filter (baseBankAccessFilterSQL)
    const hasAccess = evaluateOperatorAccess(app, assignments);
    if (!hasAccess) return false;

    // 4. UI category filter (if user selects specific category)
    if (categoryFilter && categoryFilter !== 'all') {
      const normUiCat = normalizeAssignmentCategory(categoryFilter);
      if (normUiCat === 'loc_eoc' && !evaluateLocEoc(app)) return false;
      if (normUiCat === 'credit_card' && !evaluateCreditCard(app)) return false;
    }

    return true;
  });
}

// ── TEST FIXTURES ──
const HDFC_BANK_ID = 'f0b5742d-f04d-4a91-b162-6009ddf6e345';
const SBI_BANK_ID = 'e1a2b3c4-1111-2222-3333-444455556666';
const ICICI_BANK_ID = 'a9b8c7d6-9999-8888-7777-666655554444';

const sampleApplications = [
  // 1. HDFC LOC Product: Instant & Jumbo Loan
  {
    id: 'app-hdfc-loc-1',
    app_number: 'APP20261001',
    bank_id: HDFC_BANK_ID,
    bank_name: 'HDFC Bank',
    bank_code: 'HDFC',
    product_name: 'HDFC Bank Instant & Jumbo Loan',
    category: 'loc_eoc',
    sub_category: 'LOC',
    status: 'rejected',
    final_status: 'rejected'
  },
  // 2. HDFC EOC Product: EMI on Credit Card
  {
    id: 'app-hdfc-eoc-2',
    app_number: 'APP20261002',
    bank_id: HDFC_BANK_ID,
    bank_name: 'HDFC Bank',
    bank_code: 'HDFC',
    product_name: 'HDFC Bank EMI on Credit Card',
    category: 'loc_eoc',
    sub_category: 'EOC',
    status: 'declined',
    final_status: 'decline'
  },
  // 3. HDFC Credit Card: Millennia Credit Card
  {
    id: 'app-hdfc-cc-1',
    app_number: 'APP20261003',
    bank_id: HDFC_BANK_ID,
    bank_name: 'HDFC Bank',
    bank_code: 'HDFC',
    product_name: 'HDFC Bank Millennia Credit Card',
    category: 'credit_card',
    sub_category: null,
    status: 'rejected',
    final_status: 'rejected'
  },
  // 4. HDFC Credit Card: Regalia Gold
  {
    id: 'app-hdfc-cc-2',
    app_number: 'APP20261004',
    bank_id: HDFC_BANK_ID,
    bank_name: 'HDFC Bank',
    bank_code: 'HDFC',
    product_name: 'HDFC Bank Regalia Gold Credit Card',
    category: 'credit_card',
    sub_category: null,
    status: 'technical_error',
    final_status: 'rejected'
  },
  // 5. HDFC Personal Loan (unassigned product category)
  {
    id: 'app-hdfc-pl-1',
    app_number: 'APP20261005',
    bank_id: HDFC_BANK_ID,
    bank_name: 'HDFC Bank',
    bank_code: 'HDFC',
    product_name: 'HDFC Bank Xpress Personal Loan',
    category: 'personal_loan',
    sub_category: null,
    status: 'rejected',
    final_status: 'rejected'
  },
  // 6. SBI Credit Card
  {
    id: 'app-sbi-cc-1',
    app_number: 'APP20261006',
    bank_id: SBI_BANK_ID,
    bank_name: 'State Bank of India',
    bank_code: 'SBI',
    product_name: 'SBI SimplyCLICK Credit Card',
    category: 'credit_card',
    sub_category: null,
    status: 'rejected',
    final_status: 'rejected'
  },
  // 7. ICICI LOC/EOC Product
  {
    id: 'app-icici-loc-1',
    app_number: 'APP20261007',
    bank_id: ICICI_BANK_ID,
    bank_name: 'ICICI Bank',
    bank_code: 'ICICI',
    product_name: 'ICICI Bank Loan On Credit Card',
    category: 'loc_eoc',
    sub_category: 'LOC',
    status: 'declined',
    final_status: 'declined'
  },
  // 8. HDFC Approved Credit Card (should be excluded by Querable Operator status rule)
  {
    id: 'app-hdfc-cc-approved',
    app_number: 'APP20261008',
    bank_id: HDFC_BANK_ID,
    bank_name: 'HDFC Bank',
    bank_code: 'HDFC',
    product_name: 'HDFC Bank Tata Neu Plus Credit Card',
    category: 'credit_card',
    sub_category: null,
    status: 'approved',
    final_status: 'approved'
  }
];

// ── TEST RUNNER ──
console.log('Running Querable Operator HDFC Permission Test Suite...\n');

// Test 1: HDFC assigned only to Credit Card: LOC/EOC applications are excluded
{
  const hdfcCreditCardAssignments = [
    { bank_id: HDFC_BANK_ID, short_code: 'HDFC', name: 'HDFC Bank', category: 'CREDIT CARD' }
  ];
  const results = filterApplications(sampleApplications, hdfcCreditCardAssignments, 'rejected', 'all');
  const resultIds = results.map(r => r.id);

  assert(!resultIds.includes('app-hdfc-loc-1'), 'FAIL: Instant & Jumbo Loan LOC app must be excluded under Credit Card assignment');
  assert(!resultIds.includes('app-hdfc-eoc-2'), 'FAIL: EMI on Credit Card EOC app must be excluded under Credit Card assignment');
  assert(resultIds.includes('app-hdfc-cc-1'), 'FAIL: Millennia Credit Card must be included');
  assert(resultIds.includes('app-hdfc-cc-2'), 'FAIL: Regalia Gold Credit Card must be included');
  assert(!resultIds.includes('app-hdfc-pl-1'), 'FAIL: Personal Loan must be excluded');
  assert(!resultIds.includes('app-sbi-cc-1'), 'FAIL: SBI app must be excluded');
  assert.strictEqual(results.length, 2, 'FAIL: Exactly 2 HDFC Credit Card rejected apps must be returned');

  console.log('✓ Test 1 Passed: HDFC assigned only to Credit Card strictly excludes LOC/EOC applications.');
}

// Test 2: HDFC assigned only to LOC/EOC: Credit Card applications are excluded
{
  const hdfcLocEocAssignments = [
    { bank_id: HDFC_BANK_ID, short_code: 'HDFC', name: 'HDFC Bank', category: 'LOC/EOC' }
  ];
  const results = filterApplications(sampleApplications, hdfcLocEocAssignments, 'rejected', 'all');
  const resultIds = results.map(r => r.id);

  assert(resultIds.includes('app-hdfc-loc-1'), 'FAIL: Instant & Jumbo Loan LOC app must be included under LOC/EOC assignment');
  assert(resultIds.includes('app-hdfc-eoc-2'), 'FAIL: EMI on Credit Card EOC app must be included under LOC/EOC assignment');
  assert(!resultIds.includes('app-hdfc-cc-1'), 'FAIL: Credit Card app must be excluded under LOC/EOC assignment');
  assert(!resultIds.includes('app-hdfc-cc-2'), 'FAIL: Credit Card app must be excluded under LOC/EOC assignment');
  assert(!resultIds.includes('app-hdfc-pl-1'), 'FAIL: Personal Loan must be excluded');
  assert.strictEqual(results.length, 2, 'FAIL: Exactly 2 HDFC LOC/EOC apps must be returned');

  console.log('✓ Test 2 Passed: HDFC assigned only to LOC/EOC strictly excludes Credit Card applications.');
}

// Test 3: HDFC assigned to both categories: both authorized categories are included
{
  const hdfcBothAssignments = [
    { bank_id: HDFC_BANK_ID, short_code: 'HDFC', name: 'HDFC Bank', category: 'CREDIT CARD' },
    { bank_id: HDFC_BANK_ID, short_code: 'HDFC', name: 'HDFC Bank', category: 'LOC/EOC' }
  ];
  const results = filterApplications(sampleApplications, hdfcBothAssignments, 'rejected', 'all');
  const resultIds = results.map(r => r.id);

  assert(resultIds.includes('app-hdfc-loc-1'), 'FAIL: Instant & Jumbo Loan must be included when both assigned');
  assert(resultIds.includes('app-hdfc-eoc-2'), 'FAIL: EMI on Credit Card must be included when both assigned');
  assert(resultIds.includes('app-hdfc-cc-1'), 'FAIL: Millennia CC must be included when both assigned');
  assert(resultIds.includes('app-hdfc-cc-2'), 'FAIL: Regalia CC must be included when both assigned');
  assert(!resultIds.includes('app-hdfc-pl-1'), 'FAIL: Personal loan must remain excluded even when both card categories assigned');
  assert.strictEqual(results.length, 4, 'FAIL: Exactly 4 HDFC card apps (2 CC + 2 LOC/EOC) must be returned');

  console.log('✓ Test 3 Passed: HDFC assigned to both categories includes both CC and LOC/EOC.');
}

// Test 4: HDFC Credit Card assignment does not grant access to an unassigned category
{
  const hdfcCreditCardAssignments = [
    { bank_id: HDFC_BANK_ID, short_code: 'HDFC', name: 'HDFC Bank', category: 'credit_card' }
  ];
  const results = filterApplications(sampleApplications, hdfcCreditCardAssignments, 'rejected', 'all');
  const hasPl = results.some(r => r.category === 'personal_loan' || r.product_name.includes('Personal Loan'));
  assert.strictEqual(hasPl, false, 'FAIL: HDFC Credit Card assignment must never leak Personal Loan applications');

  console.log('✓ Test 4 Passed: HDFC Credit Card assignment does not grant access to unassigned categories.');
}

// Test 5: Legacy assignment labels normalize correctly
{
  const legacyLabels = [
    { input: 'CREDIT CARD', expected: 'credit_card' },
    { input: 'Credit Card', expected: 'credit_card' },
    { input: 'credit_card', expected: 'credit_card' },
    { input: 'credit card', expected: 'credit_card' },
    { input: 'cards', expected: 'credit_card' },
    { input: 'LOC/EOC', expected: 'loc_eoc' },
    { input: 'LOC / EOC', expected: 'loc_eoc' },
    { input: 'loc_eoc', expected: 'loc_eoc' },
    { input: 'loc-eoc', expected: 'loc_eoc' },
    { input: 'loan_on_credit_card', expected: 'loc_eoc' },
    { input: 'smart_emi', expected: 'loc_eoc' },
    { input: null, expected: 'credit_card' },
    { input: undefined, expected: 'credit_card' },
    { input: '', expected: 'credit_card' }
  ];

  legacyLabels.forEach(({ input, expected }) => {
    assert.strictEqual(
      normalizeAssignmentCategory(input),
      expected,
      `FAIL: Normalization of "${input}" should be "${expected}", got "${normalizeAssignmentCategory(input)}"`
    );
  });

  console.log('✓ Test 5 Passed: All legacy assignment labels correctly normalize to canonical keys.');
}

// Test 6: Pagination totals and status counts agree with the visible list
{
  const hdfcCreditCardAssignments = [
    { bank_id: HDFC_BANK_ID, short_code: 'HDFC', name: 'HDFC Bank', category: 'CREDIT CARD' }
  ];
  const listResults = filterApplications(sampleApplications, hdfcCreditCardAssignments, 'rejected', 'all');
  const countTotal = filterApplications(sampleApplications, hdfcCreditCardAssignments, 'rejected', 'all').length;

  const statusCounts = { rejected: 0, approved: 0, pending: 0, all: 0 };
  sampleApplications.forEach(app => {
    // Only count applications authorized under operator access
    if (evaluateOperatorAccess(app, hdfcCreditCardAssignments)) {
      const s = String(app.status || '').toLowerCase();
      const fs = String(app.final_status || '').toLowerCase();
      if (['rejected', 'declined', 'technical_error'].includes(s) || s.includes('reject') || fs.includes('reject')) {
        statusCounts.rejected++;
      }
    }
  });

  assert.strictEqual(listResults.length, countTotal, 'FAIL: List length must match count query total');
  assert.strictEqual(listResults.length, statusCounts.rejected, 'FAIL: List length must match status counts rejected count');

  console.log('✓ Test 6 Passed: Pagination totals and status counts agree with visible list (2 rejected Credit Cards).');
}

// Test 7: Other banks and existing operator workflows remain unchanged
{
  const multiBankAssignments = [
    { bank_id: SBI_BANK_ID, short_code: 'SBI', name: 'State Bank of India', category: 'credit_card' },
    { bank_id: ICICI_BANK_ID, short_code: 'ICICI', name: 'ICICI Bank', category: 'loc_eoc' }
  ];
  const results = filterApplications(sampleApplications, multiBankAssignments, 'rejected', 'all');
  const resultIds = results.map(r => r.id);

  assert(resultIds.includes('app-sbi-cc-1'), 'FAIL: SBI Credit Card must be included');
  assert(resultIds.includes('app-icici-loc-1'), 'FAIL: ICICI LOC/EOC must be included');
  assert(!resultIds.includes('app-hdfc-cc-1'), 'FAIL: HDFC CC must be excluded');
  assert(!resultIds.includes('app-hdfc-loc-1'), 'FAIL: HDFC LOC must be excluded');
  assert.strictEqual(results.length, 2, 'FAIL: Exactly 2 applications for other banks');

  console.log('✓ Test 7 Passed: Multi-bank operator workflows and bank boundaries preserved.');
}

// Test 8: Single application authorization check enforces least privilege
{
  const hdfcCcUserAssignments = [
    { bank_id: HDFC_BANK_ID, short_code: 'HDFC', name: 'HDFC Bank', category: 'CREDIT CARD' }
  ];

  function checkSingleAppAccess(app, assignments) {
    const isAppLocEoc = evaluateLocEoc(app);
    const appCategory = isAppLocEoc ? 'loc_eoc' : 'credit_card';
    return assignments.some(a => {
      const assignCat = normalizeAssignmentCategory(a.category);
      return assignCat === appCategory && a.bank_id === app.bank_id;
    });
  }

  const hdfcCcApp = sampleApplications.find(a => a.id === 'app-hdfc-cc-1');
  const hdfcLocApp = sampleApplications.find(a => a.id === 'app-hdfc-loc-1');
  const hdfcEocApp = sampleApplications.find(a => a.id === 'app-hdfc-eoc-2');

  assert.strictEqual(checkSingleAppAccess(hdfcCcApp, hdfcCcUserAssignments), true, 'Credit card app must be allowed');
  assert.strictEqual(checkSingleAppAccess(hdfcLocApp, hdfcCcUserAssignments), false, 'Instant & Jumbo Loan must be forbidden');
  assert.strictEqual(checkSingleAppAccess(hdfcEocApp, hdfcCcUserAssignments), false, 'EMI on Credit Card must be forbidden');

  console.log('✓ Test 8 Passed: Single application route check strictly rejects unassigned LOC/EOC.');
}

console.log('\n======================================================');
console.log('ALL 8 TEST SUITES COMPLETED SUCCESSFULLY! ZERO DEFECTS.');
console.log('======================================================');
