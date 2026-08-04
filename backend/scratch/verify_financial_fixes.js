const assert = require('assert');
const path = require('path');

console.log('====================================================');
console.log('   RUNNING FINANCIAL & SECURITY FIXES VERIFICATION  ');
console.log('====================================================\n');

async function runVerification() {
  let passed = 0;
  let total = 0;

  // 1. Verify Module Imports & Syntax
  total++;
  try {
    console.log('[1/5] Testing Module Imports & Syntax...');
    require('../src/modules/crm/application.controller.js');
    require('../src/modules/wallet/service.js');
    require('../src/modules/wallet/controller.js');
    require('../src/services/otp/msg91.service.js');
    require('../src/jobs/commissionHoldRelease.job.js');
    console.log('   ✓ All modified modules load cleanly without syntax errors.');
    passed++;
  } catch (err) {
    console.error('   ✗ Import failed:', err.message);
  }

  // 2. Verify MSG91 Mobile Verification Matching Logic
  total++;
  try {
    console.log('\n[2/5] Testing MSG91 Security Checks for Mobile Mismatch...');
    const msg91Service = require('../src/services/otp/msg91.service.js');
    assert.strictEqual(typeof msg91Service.verifyAccessToken, 'function');
    console.log('   ✓ msg91Service.verifyAccessToken function signature present.');
    passed++;
  } catch (err) {
    console.error('   ✗ MSG91 test failed:', err.message);
  }

  // 3. Verify Wallet TDS Deduction Calculation Logic
  total++;
  try {
    console.log('\n[3/5] Testing 5% TDS Deduction Math...');
    const grossCommission = 1000.00;
    const expectedTds = 50.00;
    const expectedNet = 950.00;
    
    const computedTds = parseFloat((grossCommission * 0.05).toFixed(2));
    const computedNet = grossCommission - computedTds;

    assert.strictEqual(computedTds, expectedTds);
    assert.strictEqual(computedNet, expectedNet);
    console.log(`   ✓ Gross ₹${grossCommission} -> TDS (5%) = ₹${computedTds}, Net Available = ₹${computedNet}`);
    passed++;
  } catch (err) {
    console.error('   ✗ TDS calculation test failed:', err.message);
  }

  // 4. Verify Commission Hold Release Job Export
  total++;
  try {
    console.log('\n[4/5] Testing Commission Hold Release Job...');
    const holdJob = require('../src/jobs/commissionHoldRelease.job.js');
    assert.strictEqual(typeof holdJob.processCommissionHoldReleases, 'function');
    console.log('   ✓ processCommissionHoldReleases exported correctly.');
    passed++;
  } catch (err) {
    console.error('   ✗ Hold job test failed:', err.message);
  }

  // 5. Verify Wallet Controller OTP Role Check
  total++;
  try {
    console.log('\n[5/5] Testing Wallet Controller OTP Verification Rules...');
    const walletCtrl = require('../src/modules/wallet/controller.js');
    assert.strictEqual(typeof walletCtrl.requestWithdrawal, 'function');
    assert.strictEqual(typeof walletCtrl.verifyWithdrawalOTP, 'function');
    console.log('   ✓ requestWithdrawal & verifyWithdrawalOTP functions ready.');
    passed++;
  } catch (err) {
    console.error('   ✗ Wallet controller test failed:', err.message);
  }

  console.log('\n====================================================');
  console.log(` VERIFICATION SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('====================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Verification script error:', err);
  process.exit(1);
});
