const assert = require('assert');

// Test suite for Administrative Sales Operator Claim Request logic and filtering
console.log('--- Running Administrative Sales Operator Claim Tests ---');

// 1. Test Filter Logic
function matchesSalesExecClaimFilter(app, currentUserId) {
  const isUnclaimed = !app.sales_claimed_by || app.sales_claimed_by === '';
  const isSelfClaimed = app.sales_claimed_by === currentUserId;
  return isUnclaimed || isSelfClaimed;
}

const op1_id = 'user-op-1';
const op2_id = 'user-op-2';

const app1_unclaimed = {
  id: 'app-1',
  app_number: 'APP001',
  sales_claimed_by: null,
  sales_claimed_by_name: null
};

const app2_claimed_by_op1 = {
  id: 'app-2',
  app_number: 'APP002',
  sales_claimed_by: op1_id,
  sales_claimed_by_name: 'Sales Operator 1'
};

const app3_claimed_by_op2 = {
  id: 'app-3',
  app_number: 'APP003',
  sales_claimed_by: op2_id,
  sales_claimed_by_name: 'Sales Operator 2'
};

const allApps = [app1_unclaimed, app2_claimed_by_op1, app3_claimed_by_op2];

// Test for Operator 1:
const op1_visible = allApps.filter(app => matchesSalesExecClaimFilter(app, op1_id));
assert.strictEqual(op1_visible.length, 2, 'Operator 1 should see 2 applications');
assert.ok(op1_visible.some(a => a.id === 'app-1'), 'Operator 1 must see unclaimed app-1');
assert.ok(op1_visible.some(a => a.id === 'app-2'), 'Operator 1 must see their own claimed app-2');
assert.ok(!op1_visible.some(a => a.id === 'app-3'), 'Operator 1 MUST NOT see app-3 claimed by Operator 2');
console.log('✓ Operator 1 visibility check passed (hidden from other operator)');

// Test for Operator 2:
const op2_visible = allApps.filter(app => matchesSalesExecClaimFilter(app, op2_id));
assert.strictEqual(op2_visible.length, 2, 'Operator 2 should see 2 applications');
assert.ok(op2_visible.some(a => a.id === 'app-1'), 'Operator 2 must see unclaimed app-1');
assert.ok(op2_visible.some(a => a.id === 'app-3'), 'Operator 2 must see their own claimed app-3');
assert.ok(!op2_visible.some(a => a.id === 'app-2'), 'Operator 2 MUST NOT see app-2 claimed by Operator 1');
console.log('✓ Operator 2 visibility check passed (hidden from other operator)');

// 2. Test Claiming Permission & Conflict Logic
function simulateClaim(app, user) {
  const userRole = (user.role || '').toUpperCase();
  const userDesignation = (user.designation || '').toUpperCase();
  const isSalesUser = ['ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE SALES OPERATOR', 'ADMINISTRATIVE_SALES_OPERATOR'].includes(userDesignation) || ['ADMINISTRATIVE SALES EXECUTIVE', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE SALES OPERATOR', 'ADMINISTRATIVE_SALES_OPERATOR'].includes(userRole);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);

  if (!isSalesUser && !isAdmin) {
    return { status: 403, error: 'Forbidden' };
  }

  if (app.sales_claimed_by && app.sales_claimed_by !== user.id && !isAdmin) {
    return { status: 409, error: `Already claimed by ${app.sales_claimed_by_name}` };
  }

  if (app.sales_claimed_by === user.id) {
    return { status: 200, message: 'Already claimed by you' };
  }

  // Successfully claimed
  app.sales_claimed_by = user.id;
  app.sales_claimed_by_name = user.full_name;
  return { status: 200, success: true };
}

// Unauthorized user attempt
const partnerUser = { id: 'partner-1', role: 'PARTNER', designation: 'PARTNER' };
const claimAttempt1 = simulateClaim({ ...app1_unclaimed }, partnerUser);
assert.strictEqual(claimAttempt1.status, 403, 'Partner should be forbidden from claiming');
console.log('✓ Non-sales role is forbidden');

// Valid Operator claim
const salesOpUser1 = { id: op1_id, role: 'EMPLOYEE', designation: 'ADMINISTRATIVE SALES OPERATOR', full_name: 'Sales Operator 1' };
const targetApp = { ...app1_unclaimed };
const claimAttempt2 = simulateClaim(targetApp, salesOpUser1);
assert.strictEqual(claimAttempt2.status, 200);
assert.strictEqual(targetApp.sales_claimed_by, op1_id);
console.log('✓ Administrative Sales Operator successfully claimed unclaimed application');

// Conflict: Operator 2 attempts to claim already-claimed application
const salesOpUser2 = { id: op2_id, role: 'EMPLOYEE', designation: 'ADMINISTRATIVE SALES OPERATOR', full_name: 'Sales Operator 2' };
const claimAttempt3 = simulateClaim(targetApp, salesOpUser2);
assert.strictEqual(claimAttempt3.status, 409, 'Should return 409 conflict when already claimed');
console.log('✓ Conflict 409 correctly returned when another operator tries to claim');

// Idempotent: Operator 1 claims again
const claimAttempt4 = simulateClaim(targetApp, salesOpUser1);
assert.strictEqual(claimAttempt4.status, 200);
console.log('✓ Idempotent re-claim succeeds');

// 3. Test Bank Scope & SBI Bank matching for Administrative Sales Executive
function matchesSalesExecBankScope(app, userBankAssignments = []) {
  const isSbi = (app.bank_code?.toLowerCase() === 'sbi' || app.bank_name?.toLowerCase().includes('sbi')) &&
    !app.bank_name?.toLowerCase().includes('tata') && !app.bank_code?.toLowerCase().includes('tata');
  const isHdfc = (app.bank_code?.toLowerCase() === 'hdfc' || app.bank_name?.toLowerCase().includes('hdfc')) &&
    !app.bank_name?.toLowerCase().includes('tata') && !app.bank_code?.toLowerCase().includes('tata');

  const hasAssignment = userBankAssignments.length > 0;
  if (hasAssignment) {
    const matchesAssigned = userBankAssignments.some(b =>
      (b.short_code?.toLowerCase() === app.bank_code?.toLowerCase() || b.name?.toLowerCase() === app.bank_name?.toLowerCase())
    );
    return matchesAssigned || isSbi;
  }
  return isHdfc || isSbi;
}

const hdfcApp = { id: 'hdfc-1', bank_code: 'hdfc', bank_name: 'HDFC Bank', process_type: 'lead_punching' };
const sbiApp = { id: 'sbi-1', bank_code: 'sbi', bank_name: 'SBI Bank', process_type: 'lead_punching' };
const sbiPhysicalApp = { id: 'sbi-2', bank_code: 'sbi', bank_name: 'SBI Bank', process_type: 'physical_process' };
const axisApp = { id: 'axis-1', bank_code: 'axis', bank_name: 'Axis Bank', process_type: 'lead_punching' };

// Case A: User has only HDFC in bank assignments
const hdfcOnlyAssignments = [{ short_code: 'hdfc', name: 'HDFC Bank' }];
assert.ok(matchesSalesExecBankScope(hdfcApp, hdfcOnlyAssignments), 'HDFC app must match');
assert.ok(matchesSalesExecBankScope(sbiApp, hdfcOnlyAssignments), 'SBI app must match even if only HDFC assigned');
assert.ok(!matchesSalesExecBankScope(axisApp, hdfcOnlyAssignments), 'Axis app must NOT match');
console.log('✓ Bank scope matches both HDFC and SBI for Sales Executive');

// Case B: Claiming SBI application by Sales Executive
const sbiClaimAttempt = simulateClaim(sbiApp, salesOpUser1);
assert.strictEqual(sbiClaimAttempt.status, 200, 'Sales Operator can claim SBI Bank application');
assert.strictEqual(sbiApp.sales_claimed_by, op1_id);
console.log('✓ Administrative Sales Operator successfully claimed SBI application');

console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
process.exit(0);
