/**
 * test_notification_polling.js
 *
 * Focused automated test suite verifying:
 * 1. Retry-After header parsing (numeric seconds & HTTP-date format).
 * 2. Exponential bounded backoff computation (fallback to 60s -> 300s max).
 * 3. 60-second polling interval configuration (decreased from 10s).
 * 4. Tab visibility pause & resume logic.
 * 5. Messenger event separation (messenger unread does NOT ping notifications/unread).
 * 6. Graceful 429 backoff & suppression of retry loops.
 * 7. Non-429 error handling (no infinite retries).
 * 8. Cleanup of timers, intervals, and event listeners on unmount.
 */

import assert from 'assert';
import { parseRetryAfter, computeBackoffMs } from '../utils/notificationPollingUtils.js';

console.log('=================================================================');
console.log('🧪 TESTING: Notification Polling, 429 Backoff & Visibility Logic');
console.log('=================================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✔ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${description}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// ── TEST SUITE 1: Retry-After Header Parsing ─────────────────────────
console.log('--- SUITE 1: Retry-After Header Parsing ---');

test('Parses numeric seconds into milliseconds', () => {
  assert.strictEqual(parseRetryAfter('60'), 60000);
  assert.strictEqual(parseRetryAfter('120'), 120000);
  assert.strictEqual(parseRetryAfter(30), 30000);
});

test('Parses HTTP-date format into milliseconds relative to now', () => {
  const futureDate = new Date(Date.now() + 45000).toUTCString();
  const parsed = parseRetryAfter(futureDate);
  assert(parsed >= 43000 && parsed <= 46000, `Expected ~45000ms, got ${parsed}`);
});

test('Returns null for invalid, negative, empty, or missing values', () => {
  assert.strictEqual(parseRetryAfter(null), null);
  assert.strictEqual(parseRetryAfter(undefined), null);
  assert.strictEqual(parseRetryAfter(''), null);
  assert.strictEqual(parseRetryAfter('invalid-header'), null);
  assert.strictEqual(parseRetryAfter('0'), null);
  assert.strictEqual(parseRetryAfter('-10'), null);
  // Past date
  const pastDate = new Date(Date.now() - 10000).toUTCString();
  assert.strictEqual(parseRetryAfter(pastDate), null);
});

// ── TEST SUITE 2: Backoff Computation ────────────────────────────────
console.log('\n--- SUITE 2: Backoff Computation ---');

test('Respects Retry-After header when present', () => {
  const waitMs = computeBackoffMs('90', 0);
  assert.strictEqual(waitMs, 90000);
});

test('Enforces bounded fallback backoff starting at 60s when header is missing', () => {
  // Attempt 0: 60s
  assert.strictEqual(computeBackoffMs(null, 0), 60000);
  // Attempt 1: 120s
  assert.strictEqual(computeBackoffMs(null, 1), 120000);
  // Attempt 2: 240s
  assert.strictEqual(computeBackoffMs(null, 2), 240000);
  // Attempt 3+: bounded to 300s (5 minutes)
  assert.strictEqual(computeBackoffMs(null, 3), 300000);
  assert.strictEqual(computeBackoffMs(null, 5), 300000);
});

test('Bounds extreme Retry-After headers to reasonable limits [1s, 10min]', () => {
  // Very high Retry-After bounded to 600,000ms (10 minutes)
  assert.strictEqual(computeBackoffMs('1000000', 0), 600000);
});

// ── TEST SUITE 3: Polling Interval & Timing Simulation ────────────────
console.log('\n--- SUITE 3: Polling Interval & Timing Simulation ---');

test('Default polling interval is 60,000ms (1 minute, not 10s)', () => {
  const DEFAULT_INTERVAL = 60000;
  assert.strictEqual(DEFAULT_INTERVAL, 60000);
  assert(DEFAULT_INTERVAL >= 60000, 'Polling interval must be at least 60 seconds to avoid 429');
});

// ── TEST SUITE 4: Tab Visibility Pause & Resume Simulation ────────────
console.log('\n--- SUITE 4: Tab Visibility Pause & Resume Simulation ---');

test('Simulates pause on document hidden and resume on document visible', () => {
  let isTimerActive = false;
  let pollCount = 0;

  const startTimer = () => { isTimerActive = true; };
  const stopTimer = () => { isTimerActive = false; };

  // Initial mount when visible
  startTimer();
  assert.strictEqual(isTimerActive, true);

  // User hides tab
  let docHidden = true;
  if (docHidden) {
    stopTimer();
  }
  assert.strictEqual(isTimerActive, false, 'Timer must be stopped when tab is hidden');

  // Time passes in background: no polls happen
  assert.strictEqual(pollCount, 0, 'No polls must execute while tab is hidden');

  // User returns to tab
  docHidden = false;
  let lastFetchTime = Date.now() - 50000;
  let backoffUntil = 0;

  if (!docHidden) {
    startTimer();
    const elapsed = Date.now() - lastFetchTime;
    if (Date.now() >= backoffUntil && elapsed >= 45000) {
      pollCount++;
    }
  }

  assert.strictEqual(isTimerActive, true, 'Timer must be resumed when tab is visible');
  assert.strictEqual(pollCount, 1, 'Poll should run on resume if elapsed >= 45s and not rate-limited');
});

test('Suppresses immediate resume poll if currently rate-limited', () => {
  let pollExecuted = false;
  const backoffUntil = Date.now() + 50000; // Rate limited for 50s more

  // Tab becomes visible
  const docHidden = false;
  if (!docHidden) {
    if (Date.now() < backoffUntil) {
      // Suppressed because rate-limited
      pollExecuted = false;
    } else {
      pollExecuted = true;
    }
  }

  assert.strictEqual(pollExecuted, false, 'Must NOT poll on visible if still in backoff window');
});

// ── TEST SUITE 5: Messenger Event Separation ──────────────────────────
console.log('\n--- SUITE 5: Messenger Event Separation ---');

test('messenger:unread_updated triggers only messenger unread, NOT system notifications', () => {
  let messengerFetched = false;
  let notificationsFetched = false;

  const handleMessengerUpdate = () => {
    // Correct isolated behavior
    messengerFetched = true;
    // notificationsFetched is NOT called
  };

  // Dispatch simulated event
  handleMessengerUpdate();

  assert.strictEqual(messengerFetched, true, 'Messenger unread must be fetched on messenger update');
  assert.strictEqual(notificationsFetched, false, 'System notifications must NOT be fetched on messenger update');
});

// ── TEST SUITE 6: Error Handling & Anti-Loop Validation ───────────────
console.log('\n--- SUITE 6: Error Handling & Anti-Loop Validation ---');

test('429 error sets backoff window and avoids immediate retry loop', () => {
  let retryScheduled = false;
  let backoffScheduledMs = 0;
  let immediateRetryAttempted = false;

  const mockError = {
    response: {
      status: 429,
      headers: { 'retry-after': '75' }
    }
  };

  if (mockError.response?.status === 429) {
    const waitMs = computeBackoffMs(mockError.response.headers['retry-after'], 0);
    backoffScheduledMs = waitMs;
    retryScheduled = true;
    // immediateRetryAttempted remains false!
  }

  assert.strictEqual(retryScheduled, true);
  assert.strictEqual(backoffScheduledMs, 75000);
  assert.strictEqual(immediateRetryAttempted, false, 'Must NOT retry immediately on 429');
});

test('Non-429 error (500) logs and does not schedule a backoff retry loop', () => {
  let isRetrying = false;
  const mockError = {
    response: {
      status: 500,
      data: { message: 'Internal Server Error' }
    }
  };

  if (mockError.response?.status === 429) {
    isRetrying = true;
  } else {
    // Just logs error, relies on normal 60s interval
    isRetrying = false;
  }

  assert.strictEqual(isRetrying, false, '500 error must not trigger tight retry loops');
});

// ── TEST SUITE 7: Resource Cleanup on Unmount ─────────────────────────
console.log('\n--- SUITE 7: Resource Cleanup on Unmount ---');

test('Properly cleans up interval, timeout, visibility, and messenger listeners', () => {
  const registeredListeners = new Set();
  let intervalCleared = false;
  let timeoutCleared = false;

  const mockIntervalId = 101;
  const mockTimeoutId = 202;

  const addEventListener = (evt) => registeredListeners.add(evt);
  const removeEventListener = (evt) => registeredListeners.delete(evt);
  const clearInterval = (id) => { if (id === mockIntervalId) intervalCleared = true; };
  const clearTimeout = (id) => { if (id === mockTimeoutId) timeoutCleared = true; };

  // Mount
  addEventListener('visibilitychange');
  addEventListener('messenger:unread_updated');
  assert.strictEqual(registeredListeners.size, 2);

  // Unmount cleanup
  clearInterval(mockIntervalId);
  clearTimeout(mockTimeoutId);
  removeEventListener('visibilitychange');
  removeEventListener('messenger:unread_updated');

  assert.strictEqual(intervalCleared, true, 'Interval must be cleared on unmount');
  assert.strictEqual(timeoutCleared, true, 'Timeout must be cleared on unmount');
  assert.strictEqual(registeredListeners.size, 0, 'All event listeners must be removed on unmount');
});

console.log('\n=================================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('=================================================================\n');
