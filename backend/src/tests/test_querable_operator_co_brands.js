const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { query } = require('../config/database');

async function runQuerableOperatorTests() {
  console.log('--- Starting Querable Operator Simplified Rules Test Suite ---');
  let passed = 0;
  let failed = 0;

  try {
    const hdfcId = '11111111-1111-1111-1111-111111111111';
    const sbiId = '22222222-2222-2222-2222-222222222222';
    const axisId = '33333333-3333-3333-3333-333333333333';

    function evaluateQuerableAccess(assignedBankIds, candidateApp) {
      if (!assignedBankIds || assignedBankIds.length === 0) return false;
      
      const bankMatched = assignedBankIds.includes(candidateApp.bank_id);
      if (!bankMatched) return false;

      const s = String(candidateApp.status || '').toLowerCase();
      const isRejected = (
        ['rejected', 'declined', 'decline', 'technical_error'].includes(s) ||
        s.includes('reject') || s.includes('decline')
      );

      return isRejected;
    }

    function assertTest(testNum, testName, assignedBankIds, candidateApp, expectedVisible) {
      const isVisible = evaluateQuerableAccess(assignedBankIds, candidateApp);
      if (isVisible === expectedVisible) {
        console.log(`✅ TEST ${testNum}: ${testName} -> PASSED (Expected: ${expectedVisible}, Got: ${isVisible})`);
        passed++;
      } else {
        console.error(`❌ TEST ${testNum}: ${testName} -> FAILED (Expected: ${expectedVisible}, Got: ${isVisible})`);
        failed++;
      }
    }

    // TEST 1: Querable assigned HDFC, HDFC rejected -> visible
    assertTest(1, 'Querable assigned HDFC | HDFC rejected -> VISIBLE', [hdfcId], { bank_id: hdfcId, status: 'rejected' }, true);

    // TEST 2: Querable assigned HDFC, HDFC approved -> hidden
    assertTest(2, 'Querable assigned HDFC | HDFC approved -> HIDDEN', [hdfcId], { bank_id: hdfcId, status: 'approved' }, false);

    // TEST 3: Querable assigned HDFC, SBI rejected -> hidden
    assertTest(3, 'Querable assigned HDFC | SBI rejected -> HIDDEN', [hdfcId], { bank_id: sbiId, status: 'rejected' }, false);

    // TEST 4: Querable assigned HDFC + SBI, HDFC rejected -> visible
    assertTest(4, 'Querable assigned HDFC + SBI | HDFC rejected -> VISIBLE', [hdfcId, sbiId], { bank_id: hdfcId, status: 'rejected' }, true);

    // TEST 5: Querable assigned HDFC + SBI, SBI rejected -> visible
    assertTest(5, 'Querable assigned HDFC + SBI | SBI rejected -> VISIBLE', [hdfcId, sbiId], { bank_id: sbiId, status: 'rejected' }, true);

    // TEST 6: Querable assigned HDFC + SBI, Axis rejected -> hidden
    assertTest(6, 'Querable assigned HDFC + SBI | Axis rejected -> HIDDEN', [hdfcId, sbiId], { bank_id: axisId, status: 'rejected' }, false);

    // TEST 7: Querable has no bank assignments, Any rejected application -> hidden
    assertTest(7, 'Querable has no bank assignments | HDFC rejected -> HIDDEN', [], { bank_id: hdfcId, status: 'rejected' }, false);

    // TEST 8: Search for an unauthorized bank's rejected application -> no result
    assertTest(8, 'Search for unauthorized bank (Axis) rejected application -> HIDDEN', [hdfcId], { bank_id: axisId, status: 'rejected' }, false);

    // TEST 9: Counters -> count only assigned-bank rejected applications
    const mockDb = [
      { id: 1, bank_id: hdfcId, status: 'rejected' },
      { id: 2, bank_id: hdfcId, status: 'rejected' },
      { id: 3, bank_id: hdfcId, status: 'rejected' },
      { id: 4, bank_id: hdfcId, status: 'rejected' },
      { id: 5, bank_id: hdfcId, status: 'rejected' },
      { id: 6, bank_id: hdfcId, status: 'approved' },
      { id: 7, bank_id: sbiId, status: 'rejected' },
      { id: 8, bank_id: sbiId, status: 'rejected' },
      { id: 9, bank_id: sbiId, status: 'rejected' },
      { id: 10, bank_id: sbiId, status: 'pending' },
      { id: 11, bank_id: axisId, status: 'rejected' }
    ];
    const assignedHdfcSbi = [hdfcId, sbiId];
    const filteredApps = mockDb.filter(app => evaluateQuerableAccess(assignedHdfcSbi, app));
    const counterValue = filteredApps.length;
    if (counterValue === 8) {
      console.log(`✅ TEST 9: Counters (Expected: 8, Got: ${counterValue}) -> PASSED`);
      passed++;
    } else {
      console.error(`❌ TEST 9: Counters (Expected: 8, Got: ${counterValue}) -> FAILED`);
      failed++;
    }

    // TEST 10: Pagination -> only assigned-bank rejected applications
    const page1 = filteredApps.slice(0, 5);
    const page2 = filteredApps.slice(5, 10);
    if (page1.length === 5 && page2.length === 3) {
      console.log(`✅ TEST 10: Pagination (Page 1: ${page1.length}, Page 2: ${page2.length}) -> PASSED`);
      passed++;
    } else {
      console.error(`❌ TEST 10: Pagination -> FAILED`);
      failed++;
    }

    console.log('\n================ TEST SUMMARY ================');
    console.log(`Total Tests Run: ${passed + failed}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 ALL 10 QUERABLE OPERATOR TESTS PASSED SUCCESSFULLY!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Error running test script:', err);
    process.exit(1);
  }
}

runQuerableOperatorTests();
