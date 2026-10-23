/**
 * test_http_exponential_backoff_retry.js — Automated Test Suite for HTTP 429 Exponential Backoff with Jitter
 *
 * Verifies all 12 production scenarios required by Step 6:
 *  1. A 429 followed by a successful response.
 *  2. Multiple consecutive 429 responses.
 *  3. Exponential delay growth and jitter bounds.
 *  4. Both supported `Retry-After` formats (seconds and HTTP-date).
 *  5. Retry limit exhaustion.
 *  6. Request deadline exhaustion.
 *  7. Caller cancellation during backoff (AbortSignal).
 *  8. No retries for non-retryable 4xx and ordinary 5xx responses.
 *  9. No duplicate financial or state-changing operations (strict blacklist).
 * 10. Concurrent requests do not create a synchronized retry storm (dispersion proof).
 * 11. Authentication headers and existing interceptors still work.
 * 12. End-to-end integration with mock Axios instance.
 */

const assert = require('assert');
const {
  DEFAULT_CONFIG,
  STRICTLY_NON_RETRYABLE_PATTERNS,
  parseRetryAfter,
  normalizePathForMetrics,
  calculateBackoffWithJitter,
  isRequestSafeToRetry,
  sleepWithSignal,
  createCanceledError,
  attachRetryInterceptor,
  retryMetrics
} = require('../utils/httpRetry');

// Color helpers for terminal output
const green = (msg) => `\x1b[32m${msg}\x1b[0m`;
const red = (msg) => `\x1b[31m${msg}\x1b[0m`;
const cyan = (msg) => `\x1b[36m${msg}\x1b[0m`;
const bold = (msg) => `\x1b[1m${msg}\x1b[0m`;

let passedCount = 0;
let failedCount = 0;

function report(testName, passed, detail = '') {
  if (passed) {
    passedCount++;
    console.log(`  ${green('✓ PASS')} : ${testName} ${detail ? cyan(`(${detail})`) : ''}`);
  } else {
    failedCount++;
    console.error(`  ${red('✗ FAIL')} : ${testName} ${detail ? red(`- ${detail}`) : ''}`);
  }
}

/**
 * Creates a lightweight Mock Axios Instance for deterministic testing
 */
function createMockAxios(requestHandler) {
  const interceptors = {
    request: {
      handlers: [],
      use(onFulfilled, onRejected) {
        this.handlers.push({ onFulfilled, onRejected });
        return this.handlers.length - 1;
      }
    },
    response: {
      handlers: [],
      use(onFulfilled, onRejected) {
        this.handlers.push({ onFulfilled, onRejected });
        return this.handlers.length - 1;
      }
    }
  };

  const instance = async function(config) {
    let cfg = { ...config, headers: { ...(config.headers || {}) } };

    // Run request interceptors
    for (const h of interceptors.request.handlers) {
      if (h.onFulfilled) {
        cfg = await h.onFulfilled(cfg);
      }
    }

    let response;
    let error;
    try {
      response = await requestHandler(cfg);
    } catch (err) {
      error = err;
    }

    // Run response interceptors
    for (const h of interceptors.response.handlers) {
      if (!error && h.onFulfilled) {
        try {
          response = await h.onFulfilled(response);
        } catch (err) {
          error = err;
        }
      } else if (error && h.onRejected) {
        try {
          response = await h.onRejected(error);
          error = null; // Interceptor handled/recovered error
        } catch (err) {
          error = err;
        }
      }
    }

    if (error) throw error;
    return response;
  };

  instance.interceptors = interceptors;
  instance.get = (url, cfg) => instance({ ...cfg, method: 'GET', url });
  instance.post = (url, data, cfg) => instance({ ...cfg, method: 'POST', url, data });
  instance.put = (url, data, cfg) => instance({ ...cfg, method: 'PUT', url, data });
  instance.delete = (url, cfg) => instance({ ...cfg, method: 'DELETE', url });

  return instance;
}

async function runTestSuite() {
  console.log(bold('\n======================================================================'));
  console.log(bold('  GharKaPaisa — HTTP 429 Exponential Backoff with Jitter Test Suite'));
  console.log(bold('======================================================================\n'));

  // -----------------------------------------------------------------------------
  // Test 1: A 429 followed by a successful response
  // -----------------------------------------------------------------------------
  {
    retryMetrics.reset();
    let callCount = 0;
    const mockAxios = createMockAxios(async (cfg) => {
      callCount++;
      if (callCount === 1) {
        const err = new Error('Too Many Requests');
        err.response = { status: 429, headers: {} };
        err.config = cfg;
        throw err;
      }
      return { status: 200, data: { success: true }, config: cfg };
    });

    attachRetryInterceptor(mockAxios, {
      sleepFn: async () => {}, // Instant sleep for fast testing
      randomFn: () => 0.5
    });

    const res = await mockAxios.get('/api/v1/applications');
    const ok = res.status === 200 && callCount === 2 && res.config._gkpRetryCount === 1;
    report('1. A 429 followed by a successful response', ok, `Dispatched 2 calls, resolved 200`);
  }

  // -----------------------------------------------------------------------------
  // Test 2: Multiple consecutive 429 responses
  // -----------------------------------------------------------------------------
  {
    retryMetrics.reset();
    let callCount = 0;
    const delaysRecorded = [];
    const mockAxios = createMockAxios(async (cfg) => {
      callCount++;
      if (callCount < 4) {
        const err = new Error('Too Many Requests');
        err.response = { status: 429, headers: {} };
        err.config = cfg;
        throw err;
      }
      return { status: 200, data: { success: true, count: callCount }, config: cfg };
    });

    attachRetryInterceptor(mockAxios, {
      sleepFn: async (ms) => { delaysRecorded.push(ms); },
      randomFn: () => 0.5
    });

    const res = await mockAxios.get('/api/v1/banks');
    const ok = res.status === 200 && callCount === 4 && delaysRecorded.length === 3;
    report('2. Multiple consecutive 429 responses', ok, `3 retries performed with exponential delays: ${delaysRecorded.join('ms, ')}ms`);
  }

  // -----------------------------------------------------------------------------
  // Test 3: Exponential delay growth and jitter bounds
  // -----------------------------------------------------------------------------
  {
    const cfg = {
      initialDelayMs: 500,
      backoffMultiplier: 2,
      maxDelayMs: 8000,
      maxRetries: 4
    };

    let growthOk = true;
    // Test base exponential growth ceilings: 500ms, 1000ms, 2000ms, 4000ms
    const expectedCeilings = [500, 1000, 2000, 4000];
    for (let attempt = 0; attempt < 4; attempt++) {
      // With randomFn returning 1.0 (max jitter ceiling)
      const maxRes = calculateBackoffWithJitter(attempt, { ...cfg, randomFn: () => 0.999 });
      // With randomFn returning 0.0 (min jitter floor)
      const minRes = calculateBackoffWithJitter(attempt, { ...cfg, randomFn: () => 0.0 });

      if (maxRes.delayMs > expectedCeilings[attempt] || minRes.delayMs < 50) {
        growthOk = false;
      }
    }

    // Verify statistical dispersion (100 samples)
    const samples = [];
    for (let i = 0; i < 100; i++) {
      samples.push(calculateBackoffWithJitter(2, cfg).delayMs);
    }
    const uniqueValues = new Set(samples).size;
    const dispersionOk = uniqueValues > 50; // Jitter must produce diverse distinct values

    report('3. Exponential delay growth and jitter bounds', growthOk && dispersionOk, `Ceilings respected & ${uniqueValues}/100 unique jitter delays`);
  }

  // -----------------------------------------------------------------------------
  // Test 4: Both supported `Retry-After` formats (seconds and HTTP-date)
  // -----------------------------------------------------------------------------
  {
    // Format A: Seconds
    const secDelay = parseRetryAfter('7');
    const secOk = secDelay === 7000;

    // Format B: RFC 7231 HTTP-date
    const fixedNow = Date.parse('2026-10-24T00:00:00.000Z');
    const targetDate = 'Sat, 24 Oct 2026 00:00:15 GMT';
    const dateDelay = parseRetryAfter(targetDate, fixedNow);
    const dateOk = dateDelay === 15000;

    // Invalid & edge cases
    const nullDelay = parseRetryAfter(null);
    const invalidDelay = parseRetryAfter('invalid-date-string');
    const pastDateDelay = parseRetryAfter('Fri, 23 Oct 2026 00:00:00 GMT', fixedNow);

    const edgeOk = nullDelay === null && invalidDelay === null && pastDateDelay === 0;

    // Full backoff with Retry-After header
    const retryRes = calculateBackoffWithJitter(0, { now: () => fixedNow, randomFn: () => 0 }, '10', 0);
    const headerOk = retryRes.shouldRetry && retryRes.delayMs >= 10000 && retryRes.fromRetryAfter;

    report('4. Both supported Retry-After formats', secOk && dateOk && edgeOk && headerOk, `Seconds (7s -> 7000ms), HTTP-date (15s -> 15000ms)`);
  }

  // -----------------------------------------------------------------------------
  // Test 5: Retry limit exhaustion
  // -----------------------------------------------------------------------------
  {
    retryMetrics.reset();
    let callCount = 0;
    const mockAxios = createMockAxios(async (cfg) => {
      callCount++;
      const err = new Error('Too Many Requests');
      err.response = { status: 429, headers: {} };
      err.config = cfg;
      throw err;
    });

    attachRetryInterceptor(mockAxios, {
      maxRetries: 3,
      sleepFn: async () => {},
      randomFn: () => 0.5
    });

    let failedAsExpected = false;
    try {
      await mockAxios.get('/api/v1/employees?limit=25');
    } catch (err) {
      if (err.response?.status === 429 && callCount === 4) { // Initial + 3 retries
        failedAsExpected = true;
      }
    }

    const metrics = retryMetrics.getMetrics();
    const ok = failedAsExpected && metrics.totalRetriesExhausted === 1 && metrics.totalRetriesAttempted === 3;
    report('5. Retry limit exhaustion', ok, `Stopped after max 3 retries (total 4 attempts), recorded exhaustion`);
  }

  // -----------------------------------------------------------------------------
  // Test 6: Request deadline exhaustion
  // -----------------------------------------------------------------------------
  {
    retryMetrics.reset();
    let callCount = 0;
    const mockAxios = createMockAxios(async (cfg) => {
      callCount++;
      const err = new Error('Too Many Requests');
      err.response = { status: 429, headers: { 'retry-after': '20' } }; // 20s is <= 30s maxRetryAfterMs, but > 15s deadline
      err.config = cfg;
      throw err;
    });

    attachRetryInterceptor(mockAxios, {
      maxRetryAfterMs: 30000,
      requestTimeoutMs: 15000,
      sleepFn: async () => {}
    });

    let deadlineRejected = false;
    try {
      await mockAxios.get('/api/v1/applications/stats');
    } catch (err) {
      deadlineRejected = true;
    }

    const metrics = retryMetrics.getMetrics();
    const ok = deadlineRejected && callCount === 1 && metrics.totalDeadlinesExceeded === 1;
    report('6. Request deadline exhaustion', ok, `Immediately halted when Retry-After (20s) > deadline (15s)`);
  }

  // -----------------------------------------------------------------------------
  // Test 7: Caller cancellation during backoff (AbortSignal)
  // -----------------------------------------------------------------------------
  {
    retryMetrics.reset();
    const controller = new AbortController();

    let sleepStarted = false;
    let sleepCanceled = false;

    const sleepPromise = sleepWithSignal(5000, controller.signal, (ms, sig) => {
      sleepStarted = true;
      return new Promise((resolve, reject) => {
        const t = setTimeout(resolve, ms);
        sig.addEventListener('abort', () => {
          clearTimeout(t);
          sleepCanceled = true;
          reject(createCanceledError(sig.reason));
        });
      });
    });

    // Abort after 20ms
    setTimeout(() => {
      controller.abort('User navigated away');
    }, 20);

    let abortCaught = false;
    try {
      await sleepPromise;
    } catch (err) {
      if (err.isCanceled || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        abortCaught = true;
      }
    }

    const ok = sleepStarted && sleepCanceled && abortCaught;
    report('7. Caller cancellation during backoff', ok, `Timer aborted promptly upon AbortSignal with CanceledError`);
  }

  // -----------------------------------------------------------------------------
  // Test 8: No retries for non-retryable 4xx and ordinary 5xx responses
  // -----------------------------------------------------------------------------
  {
    const nonRetryStatuses = [400, 401, 403, 404, 422, 500, 502, 503];
    let allNonRetryPassed = true;

    for (const status of nonRetryStatuses) {
      let callCount = 0;
      const mockAxios = createMockAxios(async (cfg) => {
        callCount++;
        const err = new Error(`HTTP Error ${status}`);
        err.response = { status, headers: {} };
        err.config = cfg;
        throw err;
      });

      attachRetryInterceptor(mockAxios, { sleepFn: async () => {} });

      try {
        await mockAxios.get('/api/v1/me');
      } catch (err) {
        if (callCount !== 1) allNonRetryPassed = false;
      }
    }

    report('8. No retries for non-retryable 4xx and ordinary 5xx', allNonRetryPassed, `Verified ${nonRetryStatuses.join(', ')} fail immediately without retry`);
  }

  // -----------------------------------------------------------------------------
  // Test 9: No duplicate financial or state-changing operations (strict blacklist)
  // -----------------------------------------------------------------------------
  {
    const blacklistedEndpoints = [
      { method: 'POST', url: '/api/v1/payments/create' },
      { method: 'POST', url: '/api/v1/payouts/process' },
      { method: 'POST', url: '/api/v1/wallet/withdraw' },
      { method: 'POST', url: '/api/v1/wallet/transfer' },
      { method: 'POST', url: '/api/v1/withdrawals/approve' },
      { method: 'POST', url: '/api/v1/employees' },
      { method: 'POST', url: '/api/v1/auth/register' },
      { method: 'POST', url: '/api/v1/commissions/claim' },
      { method: 'POST', url: '/api/v1/razorpay/order' }
    ];

    let allFinancialBlocked = true;
    for (const ep of blacklistedEndpoints) {
      const isSafe = isRequestSafeToRetry({ method: ep.method, url: ep.url });
      if (isSafe) {
        allFinancialBlocked = false;
        console.error(`Endpoint improperly marked safe: ${ep.method} ${ep.url}`);
      }
    }

    // Verify GET on financial endpoints IS safe (e.g. view transactions)
    const getFinancialSafe = isRequestSafeToRetry({ method: 'GET', url: '/api/v1/wallet/balance' });

    // Verify non-financial POST with explicit idempotency key IS allowed
    const idempotentPostAllowed = isRequestSafeToRetry({
      method: 'POST',
      url: '/api/v1/analytics/log',
      headers: { 'Idempotency-Key': 'abc-123' }
    });

    const ok = allFinancialBlocked && getFinancialSafe && idempotentPostAllowed;
    report('9. No duplicate financial or state-changing operations', ok, `9/9 critical financial mutations blocked`);
  }

  // -----------------------------------------------------------------------------
  // Test 10: Concurrent requests do not create a synchronized retry storm
  // -----------------------------------------------------------------------------
  {
    // Simulate 50 concurrent requests hitting a rate limit at the exact same millisecond
    const concurrentRequests = 50;
    const delays = [];

    for (let i = 0; i < concurrentRequests; i++) {
      const res = calculateBackoffWithJitter(0, {
        initialDelayMs: 500,
        backoffMultiplier: 2,
        maxDelayMs: 8000
      });
      delays.push(res.delayMs);
    }

    // Calculate statistical variance and min/max spread
    const minDelay = Math.min(...delays);
    const maxDelay = Math.max(...delays);
    const mean = delays.reduce((a, b) => a + b, 0) / delays.length;
    const variance = delays.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / delays.length;
    const stdDev = Math.sqrt(variance);

    // Spread must be significant (stdDev > 50ms) to ensure requests desynchronize
    const isDesynchronized = stdDev > 50 && (maxDelay - minDelay) > 200;
    report('10. Concurrent requests do not create a retry storm', isDesynchronized, `50 requests spread over ${minDelay}ms–${maxDelay}ms (stdDev: ${stdDev.toFixed(1)}ms)`);
  }

  // -----------------------------------------------------------------------------
  // Test 11: Authentication headers and existing interceptors still work
  // -----------------------------------------------------------------------------
  {
    let authHeaderPreserved = false;
    let customHeaderPreserved = false;
    let callCount = 0;

    const mockAxios = createMockAxios(async (cfg) => {
      callCount++;
      if (callCount === 1) {
        const err = new Error('Too Many Requests');
        err.response = { status: 429, headers: {} };
        err.config = cfg;
        throw err;
      }

      if (cfg.headers['Authorization'] === 'Bearer secret-jwt-token') {
        authHeaderPreserved = true;
      }
      if (cfg.headers['X-Custom-Client'] === 'portal') {
        customHeaderPreserved = true;
      }

      return { status: 200, data: { user: 'pratap' }, config: cfg };
    });

    // Outer auth interceptor simulating api.js
    mockAxios.interceptors.request.use((config) => {
      config.headers['Authorization'] = 'Bearer secret-jwt-token';
      return config;
    });

    attachRetryInterceptor(mockAxios, { sleepFn: async () => {} });

    await mockAxios.get('/api/v1/auth/me', {
      headers: { 'X-Custom-Client': 'portal' }
    });

    const ok = authHeaderPreserved && customHeaderPreserved && callCount === 2;
    report('11. Authentication headers & existing interceptors preserved', ok, `Bearer token and custom headers intact on retry`);
  }

  // -----------------------------------------------------------------------------
  // Test 12: Endpoint path normalization and privacy-safe observability metrics
  // -----------------------------------------------------------------------------
  {
    retryMetrics.reset();

    // Verify low-cardinality sanitization of UUIDs, numeric IDs, and ObjectIds
    const path1 = normalizePathForMetrics('/api/v1/products/aa14cce7-63ce-4a18-8e71-8f92c375980a');
    const path2 = normalizePathForMetrics('/api/v1/users/60d5ecb8b5c9c61234567890/profile');
    const path3 = normalizePathForMetrics('https://gharkapaisa.in/api/v1/applications/987654?page=1&limit=25');

    const sanitizationOk = path1 === '/api/v1/products/:id' &&
                           path2 === '/api/v1/users/:id/profile' &&
                           path3 === '/api/v1/applications/:id';

    // Verify metrics recording
    retryMetrics.record429('/api/v1/applications/123', 'frontend');
    retryMetrics.recordAttempt('/api/v1/applications/123', 'frontend', 450);
    retryMetrics.recordSuccess('/api/v1/applications/123', 'frontend');

    const m = retryMetrics.getMetrics();
    const metricsOk = m.total429s === 1 &&
                      m.totalRetriesAttempted === 1 &&
                      m.totalRetriesSucceeded === 1 &&
                      m.successRate === 1.0 &&
                      m.byEndpoint['/api/v1/applications/:id']?.successes === 1;

    report('12. Privacy-safe metrics & low-cardinality path normalization', sanitizationOk && metricsOk, `UUIDs & numeric IDs replaced with :id, metrics tracked`);
  }

  // -----------------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------------
  console.log(bold('\n----------------------------------------------------------------------'));
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`);
  console.log(bold('----------------------------------------------------------------------\n'));

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log(green('All 12 HTTP 429 Exponential Backoff with Jitter tests PASSED successfully!\n'));
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
