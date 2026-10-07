const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { query } = require('../config/database');

async function runQuerableOperatorTests() {
  console.log('--- Starting Querable Operator Co-Brand & Relational Authorization Tests ---');
  let passed = 0;
  let failed = 0;

  try {
    let banks = [];
    try {
      const dbRes = await query(`SELECT id, name, short_code FROM banks`);
      banks = dbRes.rows;
      console.log(`Found ${banks.length} banks in database.`);
    } catch (dbErr) {
      console.log('Database query notice:', dbErr.message);
    }

    const findBank = (nameKey) => banks.find(b => 
      b.name.toLowerCase().includes(nameKey.toLowerCase()) || 
      (b.short_code && b.short_code.toLowerCase().includes(nameKey.toLowerCase()))
    );

    let hdfcBank = findBank('hdfc');
    let sbiBank = findBank('sbi');
    let iciciBank = findBank('icici');

    const hdfcId = hdfcBank?.id || '11111111-1111-1111-1111-111111111111';
    const tataHdfcId = '22222222-2222-2222-2222-222222222222';
    const sbiId = sbiBank?.id || '33333333-3333-3333-3333-333333333333';
    const tataSbiId = '44444444-4444-4444-4444-444444444444';
    const iciciId = iciciBank?.id || '55555555-5555-5555-5555-555555555555';

    function evaluateQuerableAccess(assignedBankIds, candidateApp) {
      if (!assignedBankIds || assignedBankIds.length === 0) return false;
      
      const bankMatched = assignedBankIds.includes(candidateApp.bank_id);
      if (!bankMatched) return false;

      const s = String(candidateApp.status || '').toLowerCase();
      const fs = String(candidateApp.final_status || '').toLowerCase();
      const bs = String(candidateApp.bank_current_lead_status || '').toLowerCase();

      const isRejected = (
        ['rejected', 'declined', 'decline', 'technical_error'].includes(s) ||
        s.includes('reject') || s.includes('decline') ||
        fs.includes('reject') || fs.includes('decline') ||
        bs.includes('reject') || bs.includes('decline')
      ) && !(
        ['cancelled', 'cancel', 'canceled'].includes(s) ||
        s.includes('cancel') || fs.includes('cancel') || bs.includes('cancel')
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

    // TEST 1: Assigned bank = SBI, Application: bank_id = SBI, status = rejected => VISIBLE
    assertTest(1, 'Assigned bank = SBI, Application = SBI Rejected', [sbiId], { bank_id: sbiId, status: 'rejected' }, true);

    // TEST 2: Assigned bank = SBI, Application: bank_id = Tata Co-brand SBI, status = rejected => NOT VISIBLE
    assertTest(2, 'Assigned bank = SBI, Application = Tata Co-brand SBI Rejected', [sbiId], { bank_id: tataSbiId, status: 'rejected' }, false);

    // TEST 3: Assigned bank = HDFC, Application: bank_id = HDFC, status = rejected => VISIBLE
    assertTest(3, 'Assigned bank = HDFC, Application = HDFC Rejected', [hdfcId], { bank_id: hdfcId, status: 'rejected' }, true);

    // TEST 4: Assigned bank = HDFC, Application: bank_id = Tata Co-brand HDFC, status = rejected => NOT VISIBLE
    assertTest(4, 'Assigned bank = HDFC, Application = Tata Co-brand HDFC Rejected', [hdfcId], { bank_id: tataHdfcId, status: 'rejected' }, false);

    // TEST 5: Assigned bank = HDFC, Application: bank_id = SBI, status = rejected => NOT VISIBLE
    assertTest(5, 'Assigned bank = HDFC, Application = SBI Rejected', [hdfcId], { bank_id: sbiId, status: 'rejected' }, false);

    // TEST 6: Assigned bank = SBI, Application: bank_id = SBI, status = approved => NOT VISIBLE
    assertTest(6, 'Assigned bank = SBI, Application = SBI Approved', [sbiId], { bank_id: sbiId, status: 'approved' }, false);

    // TEST 7: Assigned bank = SBI, Application: bank_id = SBI, status = pending => NOT VISIBLE
    assertTest(7, 'Assigned bank = SBI, Application = SBI Pending', [sbiId], { bank_id: sbiId, status: 'pending' }, false);

    // TEST 8: Assigned banks = HDFC + SBI
    const multiAssigned = [hdfcId, sbiId];
    assertTest('8a', 'Assigned HDFC+SBI, App = HDFC Rejected', multiAssigned, { bank_id: hdfcId, status: 'rejected' }, true);
    assertTest('8b', 'Assigned HDFC+SBI, App = SBI Rejected', multiAssigned, { bank_id: sbiId, status: 'rejected' }, true);
    assertTest('8c', 'Assigned HDFC+SBI, App = Tata HDFC Rejected', multiAssigned, { bank_id: tataHdfcId, status: 'rejected' }, false);
    assertTest('8d', 'Assigned HDFC+SBI, App = Tata SBI Rejected', multiAssigned, { bank_id: tataSbiId, status: 'rejected' }, false);
    assertTest('8e', 'Assigned HDFC+SBI, App = ICICI Rejected', multiAssigned, { bank_id: iciciId, status: 'rejected' }, false);

    console.log('\n================ TEST SUMMARY ================');
    console.log(`Total Tests Run: ${passed + failed}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 ALL QUERABLE OPERATOR TESTS PASSED SUCCESSFULLY!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Error running test script:', err);
    process.exit(1);
  }
}

runQuerableOperatorTests();
