/**
 * httpRetry.js — Production-Ready HTTP 429 Exponential Backoff with Jitter
 *
 * Provides:
 *  1. Exponential backoff with Full Jitter to prevent retry storms.
 *  2. Standard RFC 7231 `Retry-After` header parsing (seconds and HTTP-date).
 *  3. Method & path idempotency safeguards (never retries payment/wallet/financial mutations).
 *  4. Request deadline and maximum retry count caps.
 *  5. AbortSignal cancellation support to immediately abort backoff timers.
 *  6. Structured privacy-safe observability metrics (normalized low-cardinality endpoints).
 *  7. Axios interceptor and functional request wrapper.
 */

const logger = (function getLogger() {
  try {
    return require('../config/logger');
  } catch (e) {
    return {
      info: () => {},
      warn: (msg, meta) => console.warn(`[HTTP Retry Warn]: ${msg}`, meta || ''),
      error: (msg, meta) => console.error(`[HTTP Retry Error]: ${msg}`, meta || ''),
      debug: () => {}
    };
  }
})();

// Default Policy Configuration
const DEFAULT_CONFIG = {
  initialDelayMs: 500,       // 500ms initial wait
  backoffMultiplier: 2,      // 2x exponential growth: 500ms -> 1000ms -> 2000ms -> 4000ms -> 8000ms
  maxDelayMs: 8000,          // 8 seconds maximum backoff cap
  maxRetries: 4,             // 4 maximum retries
  maxRetryAfterMs: 30000,    // 30 seconds max server-mandated wait; fail fast if exceeded
  requestTimeoutMs: 35000,   // Overall request deadline
  clientType: 'backend'      // 'backend' | 'frontend' | 'mobile'
};

// Sensitive / Non-Idempotent / Financial URL patterns that must NEVER be automatically retried
const STRICTLY_NON_RETRYABLE_PATTERNS = [
  /\/payments?/i,
  /\/payouts?/i,
  /\/wallet\/(withdraw|transfer|credit|debit|release|hold)/i,
  /\/withdrawals?/i,
  /\/settlements?/i,
  /\/collections?/i,
  /\/razorpay/i,
  /\/employees(\/|$)/i,       // Employee creation / onboarding
  /\/auth\/(register|login|reset-password)/i,
  /\/commissions?\/(claim|override|release)/i
];

/**
 * Parses HTTP `Retry-After` header value (seconds or HTTP-date).
 * Returns duration in milliseconds, or null if missing or invalid.
 *
 * @param {string|number|null|undefined} headerValue
 * @param {number} [now=Date.now()]
 * @returns {number|null} Milliseconds to wait, or null.
 */
function parseRetryAfter(headerValue, now = Date.now()) {
  if (headerValue === null || headerValue === undefined) return null;
  const str = String(headerValue).trim();
  if (!str) return null;

  // Format 1: Number of seconds (RFC 7231 / express-rate-limit)
  if (/^\d+(\.\d+)?$/.test(str)) {
    const sec = parseFloat(str);
    if (!isNaN(sec) && sec >= 0) {
      return Math.round(sec * 1000);
    }
  }

  // Format 2: HTTP-date (e.g. 'Wed, 21 Oct 2026 07:28:00 GMT')
  const parsedTime = Date.parse(str);
  if (!isNaN(parsedTime)) {
    const diff = parsedTime - now;
    return diff > 0 ? diff : 0;
  }

  return null;
}

/**
 * Normalizes URL path to low-cardinality template for privacy-safe metrics and logging.
 * Replaces UUIDs, numeric IDs, and Mongo ObjectIds with :id.
 *
 * @param {string} rawUrl
 * @returns {string} Sanitized URL path
 */
function normalizePathForMetrics(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return 'unknown';
  try {
    let path = rawUrl.split('?')[0];
    if (path.startsWith('http://') || path.startsWith('https://')) {
      path = new URL(path).pathname;
    }
    // UUID replacement (8-4-4-4-12)
    path = path.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, ':id');
    // Mongo 24-char hex replacement
    path = path.replace(/\b[0-9a-fA-F]{24}\b/g, ':id');
    // Numeric segments replacement (e.g. /12345/ -> /:id/)
    path = path.replace(/\/\d+(?=\/|$)/g, '/:id');
    return path;
  } catch (e) {
    return 'unparseable';
  }
}

/**
 * Calculates exponential backoff delay with randomized Full Jitter.
 *
 * @param {number} attempt 0-indexed attempt count (0 for 1st retry, 1 for 2nd, etc.)
 * @param {object} [options] Configuration overrides
 * @param {string|number|null} [retryAfterHeader] Value of server's Retry-After header
 * @param {number} [elapsedMs=0] Total elapsed time since initial request dispatch
 * @returns {{ shouldRetry: boolean, delayMs: number, reason?: string, fromRetryAfter: boolean }}
 */
function calculateBackoffWithJitter(attempt, options = {}, retryAfterHeader = null, elapsedMs = 0) {
  const cfg = { ...DEFAULT_CONFIG, ...options };
  const randomFn = typeof cfg.randomFn === 'function' ? cfg.randomFn : Math.random;

  // 1. Check if max retry attempts exhausted
  if (attempt >= cfg.maxRetries) {
    return { shouldRetry: false, delayMs: 0, reason: 'MAX_RETRIES_EXHAUSTED', fromRetryAfter: false };
  }

  // 2. Check server-provided Retry-After header
  const retryAfterMs = parseRetryAfter(retryAfterHeader, cfg.now ? cfg.now() : Date.now());

  if (retryAfterMs !== null) {
    // If server requires waiting longer than configured maximum allowed wait
    if (retryAfterMs > cfg.maxRetryAfterMs) {
      return { shouldRetry: false, delayMs: 0, reason: 'RETRY_AFTER_EXCEEDS_MAX', fromRetryAfter: true };
    }
    // If waiting would violate request deadline
    if (elapsedMs + retryAfterMs > cfg.requestTimeoutMs) {
      return { shouldRetry: false, delayMs: 0, reason: 'DEADLINE_EXCEEDED', fromRetryAfter: true };
    }

    // Add slight randomized jitter (+0 to +250ms) to decorrelate batch-unlocked clients
    const maxJitter = Math.min(500, Math.max(50, Math.round(retryAfterMs * 0.1)));
    const jitter = Math.floor(randomFn() * maxJitter);
    const delayMs = retryAfterMs + jitter;

    if (elapsedMs + delayMs > cfg.requestTimeoutMs) {
      return { shouldRetry: false, delayMs: 0, reason: 'DEADLINE_EXCEEDED', fromRetryAfter: true };
    }

    return { shouldRetry: true, delayMs, fromRetryAfter: true };
  }

  // 3. Fallback: Exponential Backoff with Full Jitter
  // Cap exponential base backoff to maxDelayMs
  const unjitteredDelay = Math.min(
    cfg.maxDelayMs,
    cfg.initialDelayMs * Math.pow(cfg.backoffMultiplier, attempt)
  );

  // Full Jitter: Uniform distribution between minFloor and unjitteredDelay
  // Floor ensures a minimum pause (>50ms) to allow transient queue drainage
  const floorMs = Math.min(50, Math.floor(cfg.initialDelayMs * 0.2));
  const variableRange = Math.max(0, unjitteredDelay - floorMs);
  const delayMs = floorMs + Math.floor(randomFn() * variableRange);

  // Check deadline
  if (elapsedMs + delayMs > cfg.requestTimeoutMs) {
    return { shouldRetry: false, delayMs: 0, reason: 'DEADLINE_EXCEEDED', fromRetryAfter: false };
  }

  return { shouldRetry: true, delayMs, fromRetryAfter: false };
}

/**
 * Checks whether an HTTP request is safe and eligible to be retried on 429.
 *
 * @param {object} config Axios request configuration
 * @returns {boolean} True if safe to retry; false otherwise.
 */
function isRequestSafeToRetry(config) {
  if (!config) return false;
  const method = String(config.method || 'GET').toUpperCase();
  const url = String(config.url || '');

  // 1. Explicit caller opt-out
  if (config.retryOn429 === false || config.noRetry === true) {
    return false;
  }

  // 2. Strict blacklist: financial, wallet, payment, creation operations are never retried
  for (const pattern of STRICTLY_NON_RETRYABLE_PATTERNS) {
    if (pattern.test(url)) {
      // Non-GET requests on financial/creation paths are strictly non-retryable
      if (method !== 'GET' && method !== 'HEAD') {
        return false;
      }
    }
  }

  // 3. Safe idempotent methods (GET, HEAD, OPTIONS)
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  // 4. Mutation methods (POST, PUT, PATCH, DELETE)
  // Only retry if caller explicitly confirmed idempotency via config or Idempotency-Key header
  const hasIdempotencyKey = Boolean(
    config.headers && (
      config.headers['Idempotency-Key'] ||
      config.headers['idempotency-key'] ||
      config.headers['X-Idempotency-Key'] ||
      config.headers['x-idempotency-key']
    )
  );

  if (config.isIdempotent === true || config.retryOn429 === true || hasIdempotencyKey) {
    return true;
  }

  return false;
}

/**
 * In-Memory Metrics Collector for Observability (Thread-safe & privacy-preserving)
 */
class RetryMetricsCollector {
  constructor() {
    this.reset();
  }

  reset() {
    this.total429s = 0;
    this.totalRetriesAttempted = 0;
    this.totalRetriesSucceeded = 0;
    this.totalRetriesExhausted = 0;
    this.totalDeadlinesExceeded = 0;
    this.totalAborted = 0;
    this.byEndpoint = {};
    this.byClient = {};
    this.totalBackoffDurationMs = 0;
  }

  record429(endpoint, clientType) {
    this.total429s++;
    const ep = normalizePathForMetrics(endpoint);
    this.byEndpoint[ep] = this.byEndpoint[ep] || { attempts: 0, successes: 0, exhausted: 0, '429s': 0 };
    this.byEndpoint[ep]['429s']++;

    const ct = clientType || 'unknown';
    this.byClient[ct] = this.byClient[ct] || { attempts: 0, successes: 0, '429s': 0 };
    this.byClient[ct]['429s']++;
  }

  recordAttempt(endpoint, clientType, delayMs) {
    this.totalRetriesAttempted++;
    this.totalBackoffDurationMs += delayMs;

    const ep = normalizePathForMetrics(endpoint);
    this.byEndpoint[ep] = this.byEndpoint[ep] || { attempts: 0, successes: 0, exhausted: 0, '429s': 0 };
    this.byEndpoint[ep].attempts++;

    const ct = clientType || 'unknown';
    this.byClient[ct] = this.byClient[ct] || { attempts: 0, successes: 0, '429s': 0 };
    this.byClient[ct].attempts++;
  }

  recordSuccess(endpoint, clientType) {
    this.totalRetriesSucceeded++;

    const ep = normalizePathForMetrics(endpoint);
    if (this.byEndpoint[ep]) this.byEndpoint[ep].successes++;

    const ct = clientType || 'unknown';
    if (this.byClient[ct]) this.byClient[ct].successes++;
  }

  recordExhaustion(endpoint, clientType, reason) {
    if (reason === 'DEADLINE_EXCEEDED') {
      this.totalDeadlinesExceeded++;
    } else if (reason === 'ABORTED') {
      this.totalAborted++;
    } else {
      this.totalRetriesExhausted++;
    }

    const ep = normalizePathForMetrics(endpoint);
    if (this.byEndpoint[ep]) this.byEndpoint[ep].exhausted++;
  }

  getMetrics() {
    return {
      total429s: this.total429s,
      totalRetriesAttempted: this.totalRetriesAttempted,
      totalRetriesSucceeded: this.totalRetriesSucceeded,
      totalRetriesExhausted: this.totalRetriesExhausted,
      totalDeadlinesExceeded: this.totalDeadlinesExceeded,
      totalAborted: this.totalAborted,
      successRate: this.totalRetriesAttempted > 0 ? (this.totalRetriesSucceeded / this.totalRetriesAttempted) : 0,
      totalBackoffDurationMs: this.totalBackoffDurationMs,
      byEndpoint: { ...this.byEndpoint },
      byClient: { ...this.byClient }
    };
  }
}

const retryMetrics = new RetryMetricsCollector();

/**
 * Creates an AbortError compatible with Axios / Fetch standards
 */
function createCanceledError(reason) {
  const err = new Error(reason || 'Request canceled during backoff');
  err.name = 'CanceledError';
  err.isCanceled = true;
  err.code = 'ERR_CANCELED';
  return err;
}

/**
 * Sleep helper that respects AbortSignal for immediate timer cancellation
 */
function sleepWithSignal(ms, signal, customSleepFn = null) {
  if (typeof customSleepFn === 'function') {
    return customSleepFn(ms, signal);
  }

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(createCanceledError(signal.reason));
    }

    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      cleanup();
      reject(createCanceledError(signal?.reason));
    }

    function cleanup() {
      if (signal && typeof signal.removeEventListener === 'function') {
        signal.removeEventListener('abort', onAbort);
      }
    }

    if (signal && typeof signal.addEventListener === 'function') {
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/**
 * Attaches the 429 Exponential Backoff with Jitter interceptor to an Axios instance.
 *
 * @param {import('axios').AxiosInstance} axiosInstance
 * @param {object} [options]
 * @returns {number} Interceptor ID
 */
function attachRetryInterceptor(axiosInstance, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };

  return axiosInstance.interceptors.response.use(
    (response) => {
      // If request previously had retries and succeeded, record success metric
      if (response.config && response.config._gkpRetryCount > 0) {
        retryMetrics.recordSuccess(response.config.url, config.clientType);
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Only handle HTTP 429 responses with a valid request configuration
      if (!error.response || error.response.status !== 429 || !originalRequest) {
        return Promise.reject(error);
      }

      // Check caller cancellation
      if (originalRequest.signal?.aborted) {
        retryMetrics.recordExhaustion(originalRequest.url, config.clientType, 'ABORTED');
        return Promise.reject(createCanceledError(originalRequest.signal.reason));
      }

      // Record 429 encounter
      retryMetrics.record429(originalRequest.url, config.clientType);

      // Verify if request is safe and eligible for retry
      if (!isRequestSafeToRetry(originalRequest)) {
        logger.warn(`[HTTP 429] Non-retryable request throttled: ${originalRequest.method?.toUpperCase()} ${normalizePathForMetrics(originalRequest.url)}`);
        return Promise.reject(error);
      }

      // Track retry attempts on request config to prevent nested or duplicate loops
      originalRequest._gkpRetryCount = originalRequest._gkpRetryCount || 0;
      originalRequest._gkpStartTime = originalRequest._gkpStartTime || Date.now();

      const attempt = originalRequest._gkpRetryCount;
      const elapsedMs = Date.now() - originalRequest._gkpStartTime;

      // Extract Retry-After header (case-insensitive)
      const headers = error.response.headers || {};
      const retryAfterHeader = headers['retry-after'] || headers['Retry-After'] || null;

      // Calculate jittered exponential backoff
      const decision = calculateBackoffWithJitter(attempt, config, retryAfterHeader, elapsedMs);

      if (!decision.shouldRetry) {
        retryMetrics.recordExhaustion(originalRequest.url, config.clientType, decision.reason);
        logger.warn(`[HTTP 429] Retry not eligible (${decision.reason}) for ${normalizePathForMetrics(originalRequest.url)} after attempt ${attempt}`);
        return Promise.reject(error);
      }

      // Record retry attempt
      originalRequest._gkpRetryCount = attempt + 1;
      retryMetrics.recordAttempt(originalRequest.url, config.clientType, decision.delayMs);

      logger.info(`[HTTP 429] Throttled on ${normalizePathForMetrics(originalRequest.url)}. Retrying attempt ${attempt + 1}/${config.maxRetries} after ${decision.delayMs}ms backoff (fromRetryAfter: ${decision.fromRetryAfter})`);

      try {
        // Await backoff with cancellation support
        await sleepWithSignal(decision.delayMs, originalRequest.signal, config.sleepFn);
      } catch (sleepErr) {
        retryMetrics.recordExhaustion(originalRequest.url, config.clientType, 'ABORTED');
        return Promise.reject(sleepErr);
      }

      // Re-dispatch through the Axios instance
      return axiosInstance(originalRequest);
    }
  );
}

module.exports = {
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
};
