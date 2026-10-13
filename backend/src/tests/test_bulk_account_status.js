const assert = require('assert');
const accountStatusService = require('../modules/super-admin/accountStatus.service');
const superadminRoutes = require('../modules/super-admin/superadmin.routes');

async function runTests() {
  console.log('===============================================================');
  console.log('TEST SUITE: BULK ACCOUNT STATUS MANAGEMENT (MANAGE ALL USERS)');
  console.log('===============================================================\n');

  // TEST 1: Endpoint Registration
  console.log('--- TEST 1: Route registration for /accounts/bulk-status ---');
  const bulkStatusRoute = superadminRoutes.stack.find(
    layer => layer.route && layer.route.path === '/accounts/bulk-status' && layer.route.methods.post
  );
  assert(bulkStatusRoute, 'Route POST /accounts/bulk-status should be registered on superadmin router');
  console.log('✅ TEST 1 PASSED: POST /accounts/bulk-status cleanly registered on superadminRouter.\n');

  // TEST 2: Validation of invalid action
  console.log('--- TEST 2: Rejection of invalid action ---');
  let errCaught = false;
  try {
    await accountStatusService.bulkUpdateAccountStatus({ action: 'INVALID_ACTION' }, 'admin-123');
  } catch (err) {
    errCaught = true;
    assert.strictEqual(err.statusCode, 400);
    assert(err.message.includes('ACTIVATE') && err.message.includes('DEACTIVATE'));
  }
  assert(errCaught, 'Should throw 400 error on invalid action');
  console.log('✅ TEST 2 PASSED: Invalid action rejected with HTTP 400.\n');

  // TEST 3: Service export check
  console.log('--- TEST 3: Service exports check ---');
  assert(typeof accountStatusService.bulkUpdateAccountStatus === 'function', 'bulkUpdateAccountStatus must be exported');
  assert(typeof accountStatusService.activateAccount === 'function', 'activateAccount must be exported');
  assert(typeof accountStatusService.deactivateAccount === 'function', 'deactivateAccount must be exported');
  console.log('✅ TEST 3 PASSED: All account lifecycle management functions exported.\n');

  console.log('===============================================================');
  console.log('ALL BULK ACCOUNT STATUS TESTS PASSED (100% SUCCESS)');
  console.log('===============================================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
