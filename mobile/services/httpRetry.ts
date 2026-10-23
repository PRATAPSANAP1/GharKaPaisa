/**
 * httpRetry.ts — Production-Ready HTTP 429 Exponential Backoff with Jitter for React Native / Expo
 *
 * Implements:
 *  1. Exponential backoff with Full Jitter to prevent mobile retry storms / thundering herds.
 *  2. Standard RFC 7231 `Retry-After` header parsing (seconds and HTTP-date).
 *  3. Method & path idempotency safeguards (never retries payment/wallet/financial mutations).
 *  4. Request deadline and maximum retry count caps.
 *  5. AbortSignal cancellation support to immediately abort backoff timers.
 *  6. Structured privacy-safe observability metrics (normalized low-cardinality endpoints).
 *  7. Axios interceptor attachment.
 */

import { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Default Policy Configuration
export const DEFAULT_CONFIG = {
  initialDelayMs: 500,       // 500ms initial wait
  backoffMultiplier: 2,      // 2x exponential growth: 500ms -> 1000ms -> 2000ms -> 4000ms -> 8000ms
  maxDelayMs: 8000,          // 8 seconds maximum backoff cap
  maxRetries: 4,             // 4 maximum retries
  maxRetryAfterMs: 30000,    // 30 seconds max server-mandated wait; fail fast if exceeded
  requestTimeoutMs: 35000,   // Overall request deadline
  clientType: 'mobile'       // 'frontend' | 'backend' | 'mobile'
};

// Sensitive / Non-Idempotent / Financial URL patterns that must NEVER be automatically retried
export const STRICTLY_NON_RETRYABLE_PATTERNS = [
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
 */
export function parseRetryAfter(headerValue: any, now: number = Date.now()): number | null {
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
 */
export function normalizePathForMetrics(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return 'unknown';
  try {
    let path = rawUrl.split('?')[0];
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // Simple path extraction without relying on window.URL
      const match = path.match(/^https?:\/\/[^\/]+(\/.*)$/);
      if (match && match[1]) {
        path = match[1];
      }
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
 */
export function calculateBackoffWithJitter(
  attempt: number,
  options: any = {},
  retryAfterHeader: any = null,
  elapsedMs: number = 0
): { shouldRetry: boolean; delayMs: number; reason?: string; fromRetryAfter: boolean } {
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
 */
export function isRequestSafeToRetry(config: any): boolean {
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
  const headers = config.headers || {};
  const hasIdempotencyKey = Boolean(
    headers['Idempotency-Key'] ||
    headers['idempotency-key'] ||
    headers['X-Idempotency-Key'] ||
    headers['x-idempotency-key']
  );

  if (config.isIdempotent === true || config.retryOn429 === true || hasIdempotencyKey) {
    return true;
  }

  return false;
}

/**
 * In-Memory Metrics Collector for Observability (Thread-safe & privacy-preserving)
 */
export class RetryMetricsCollector {
  total429s = 0;
  totalRetriesAttempted = 0;
  totalRetriesSucceeded = 0;
  totalRetriesExhausted = 0;
  totalDeadlinesExceeded = 0;
  totalAborted = 0;
  byEndpoint: Record<string, { attempts: number; successes: number; exhausted: number; '429s': number }> = {};
  byClient: Record<string, { attempts: number; successes: number; '429s': number }> = {};
  totalBackoffDurationMs = 0;

  record429(endpoint?: string, clientType?: string) {
    this.total429s++;
    const ep = normalizePathForMetrics(endpoint);
    this.byEndpoint[ep] = this.byEndpoint[ep] || { attempts: 0, successes: 0, exhausted: 0, '429s': 0 };
    this.byEndpoint[ep]['429s']++;

    const ct = clientType || 'unknown';
    this.byClient[ct] = this.byClient[ct] || { attempts: 0, successes: 0, '429s': 0 };
    this.byClient[ct]['429s']++;
  }

  recordAttempt(endpoint?: string, clientType?: string, delayMs: number = 0) {
    this.totalRetriesAttempted++;
    this.totalBackoffDurationMs += delayMs;

    const ep = normalizePathForMetrics(endpoint);
    this.byEndpoint[ep] = this.byEndpoint[ep] || { attempts: 0, successes: 0, exhausted: 0, '429s': 0 };
    this.byEndpoint[ep].attempts++;

    const ct = clientType || 'unknown';
    this.byClient[ct] = this.byClient[ct] || { attempts: 0, successes: 0, '429s': 0 };
    this.byClient[ct].attempts++;
  }

  recordSuccess(endpoint?: string, clientType?: string) {
    this.totalRetriesSucceeded++;

    const ep = normalizePathForMetrics(endpoint);
    if (this.byEndpoint[ep]) this.byEndpoint[ep].successes++;

    const ct = clientType || 'unknown';
    if (this.byClient[ct]) this.byClient[ct].successes++;
  }

  recordExhaustion(endpoint?: string, clientType?: string, reason?: string) {
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

export const retryMetrics = new RetryMetricsCollector();

/**
 * Creates an AbortError compatible with Axios / Fetch standards
 */
export function createCanceledError(reason?: string) {
  const err: any = new Error(reason || 'Request canceled during backoff');
  err.name = 'CanceledError';
  err.isCanceled = true;
  err.code = 'ERR_CANCELED';
  return err;
}

/**
 * Sleep helper that respects AbortSignal for immediate timer cancellation
 */
export function sleepWithSignal(ms: number, signal?: any, customSleepFn: any = null): Promise<void> {
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
 */
export function attachRetryInterceptor(axiosInstance: AxiosInstance, options: any = {}): number {
  const config = { ...DEFAULT_CONFIG, ...options };

  return axiosInstance.interceptors.response.use(
    (response) => {
      const reqConfig = response.config as any;
      if (reqConfig && reqConfig._gkpRetryCount > 0) {
        retryMetrics.recordSuccess(reqConfig.url, config.clientType);
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config as any;

      if (!error.response || error.response.status !== 429 || !originalRequest) {
        return Promise.reject(error);
      }

      if (originalRequest.signal?.aborted) {
        retryMetrics.recordExhaustion(originalRequest.url, config.clientType, 'ABORTED');
        return Promise.reject(createCanceledError(originalRequest.signal.reason));
      }

      retryMetrics.record429(originalRequest.url, config.clientType);

      if (!isRequestSafeToRetry(originalRequest)) {
        return Promise.reject(error);
      }

      originalRequest._gkpRetryCount = originalRequest._gkpRetryCount || 0;
      originalRequest._gkpStartTime = originalRequest._gkpStartTime || Date.now();

      const attempt = originalRequest._gkpRetryCount;
      const elapsedMs = Date.now() - originalRequest._gkpStartTime;

      const headers = error.response.headers || {};
      const retryAfterHeader = headers['retry-after'] || headers['Retry-After'] || null;

      const decision = calculateBackoffWithJitter(attempt, config, retryAfterHeader, elapsedMs);

      if (!decision.shouldRetry) {
        retryMetrics.recordExhaustion(originalRequest.url, config.clientType, decision.reason);
        return Promise.reject(error);
      }

      originalRequest._gkpRetryCount = attempt + 1;
      retryMetrics.recordAttempt(originalRequest.url, config.clientType, decision.delayMs);

      try {
        await sleepWithSignal(decision.delayMs, originalRequest.signal, config.sleepFn);
      } catch (sleepErr) {
        retryMetrics.recordExhaustion(originalRequest.url, config.clientType, 'ABORTED');
        return Promise.reject(sleepErr);
      }

      return axiosInstance(originalRequest);
    }
  );
}

export default {
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
