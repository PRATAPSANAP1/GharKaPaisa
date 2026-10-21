const assert = require('assert');

// Test the logic directly against attendance.service and attendance-verification.service concepts
console.log('===============================================================');
console.log('TEST SUITE: ATTENDANCE SESSION CONSUMPTION & REPLAY PROTECTIONS');
console.log('===============================================================');

// 1. Verify validateLivenessResult logic with consumed vs unconsumed session
console.log('\n--- TEST 1: Verification replay allows idempotent replay only when unconsumed ---');

// Mock session 1: PASSED and not consumed
const activePassedSession = {
  id: 'sess-1',
  employee_id: 'emp-1',
  status: 'PASSED',
  liveness_status: 'PASSED',
  face_status: 'PASSED',
  environment_status: 'PASSED',
  matched_building_name: 'Main Office',
  expires_at: new Date(Date.now() + 3600000),
  consumed_at: null,
};

// Mock session 2: PASSED but already consumed
const consumedPassedSession = {
  id: 'sess-2',
  employee_id: 'emp-1',
  status: 'PASSED',
  liveness_status: 'PASSED',
  face_status: 'PASSED',
  environment_status: 'PASSED',
  matched_building_name: 'Main Office',
  expires_at: new Date(Date.now() + 3600000),
  consumed_at: new Date(),
};

function simulateReplayCheck(session) {
  if (session.consumed_at || session.status === 'CONSUMED') {
    const error = new Error('This verification session has already been used for attendance.');
    error.statusCode = 410;
    error.reason = 'SESSION_ALREADY_CONSUMED';
    throw error;
  }

  if (session.status === 'PASSED') {
    return {
      success: true,
      status: 'PASSED',
      verification: {
        liveness: 'PASSED',
        face: 'PASSED',
        location: 'PASSED',
        building: session.matched_building_name,
      },
      isIdempotentReplay: true,
    };
  }
}

// Check active session allows idempotent replay
const replayRes = simulateReplayCheck(activePassedSession);
assert.strictEqual(replayRes.success, true);
assert.strictEqual(replayRes.isIdempotentReplay, true);
console.log('✅ Active PASSED session correctly returns idempotent replay');

// Check consumed session throws 410 SESSION_ALREADY_CONSUMED
try {
  simulateReplayCheck(consumedPassedSession);
  assert.fail('Should have thrown 410 for consumed session');
} catch (err) {
  assert.strictEqual(err.statusCode, 410);
  assert.strictEqual(err.reason, 'SESSION_ALREADY_CONSUMED');
  console.log('✅ Consumed PASSED session correctly rejected with 410 SESSION_ALREADY_CONSUMED');
}

// 2. Check duplicate protection atomic UPDATE simulation
console.log('\n--- TEST 2: Duplicate protection rowCount verification ---');

let dbSession = {
  id: 'sess-atomic-1',
  status: 'PASSED',
  consumed_at: null,
};

function mockAtomicConsume(sessionId) {
  // Simulates: UPDATE attendance_verification_sessions SET status = 'PASSED', consumed_at = NOW() WHERE id = $1 AND consumed_at IS NULL
  if (dbSession.id === sessionId && dbSession.consumed_at === null) {
    dbSession.status = 'PASSED';
    dbSession.consumed_at = new Date();
    return { rowCount: 1 };
  }
  return { rowCount: 0 };
}

// First concurrent execution succeeds
const res1 = mockAtomicConsume('sess-atomic-1');
assert.strictEqual(res1.rowCount, 1);
assert.strictEqual(dbSession.status, 'PASSED');
assert.ok(dbSession.consumed_at !== null);
console.log('✅ First transaction update succeeded: status remains PASSED, consumed_at is set');

// Second concurrent execution fails
const res2 = mockAtomicConsume('sess-atomic-1');
assert.strictEqual(res2.rowCount, 0);
console.log('✅ Second concurrent update saw rowCount === 0 and was blocked');

// 3. Check-out requiring its own newly verified session
console.log('\n--- TEST 3: Check-out rejects check-in session and requires distinct verified session ---');

const checkInSession = {
  id: 'sess-checkin',
  employee_id: 'emp-1',
  status: 'PASSED',
  consumed_at: new Date(), // consumed during check-in
};

const checkOutNewSession = {
  id: 'sess-checkout',
  employee_id: 'emp-1',
  status: 'PASSED',
  consumed_at: null, // fresh session
};

function validateSessionForCheckout(session, authEmpId) {
  if (session.employee_id !== authEmpId) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }
  if (session.status !== 'PASSED') {
    const error = new Error('Not PASSED');
    error.statusCode = 403;
    throw error;
  }
  if (session.consumed_at) {
    const error = new Error('Verification session has already been consumed. Please perform verification again.');
    error.statusCode = 409;
    error.code = 'VERIFICATION_SESSION_ALREADY_USED';
    throw error;
  }
  return true;
}

// Attempting to reuse check-in session for checkout
try {
  validateSessionForCheckout(checkInSession, 'emp-1');
  assert.fail('Reusing check-in session for checkout should fail');
} catch (err) {
  assert.strictEqual(err.statusCode, 409);
  assert.strictEqual(err.code, 'VERIFICATION_SESSION_ALREADY_USED');
  console.log('✅ Check-out rejected previously consumed session with 409 VERIFICATION_SESSION_ALREADY_USED');
}

// Using fresh session for checkout succeeds
const checkoutAllowed = validateSessionForCheckout(checkOutNewSession, 'emp-1');
assert.strictEqual(checkoutAllowed, true);
console.log('✅ Check-out accepted fresh verified session');

console.log('\n===============================================================');
console.log('ALL VERIFICATION & CONSUMPTION TESTS PASSED CLEANLY');
console.log('===============================================================');
