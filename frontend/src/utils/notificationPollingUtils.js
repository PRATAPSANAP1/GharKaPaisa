/**
 * notificationPollingUtils.js
 *
 * Pure utilities for notification polling timing, HTTP 429 Retry-After parsing,
 * and bounded exponential backoff calculation.
 */

/**
 * Parses HTTP `Retry-After` header value (seconds or HTTP-date).
 * Returns duration in milliseconds, or null if missing/invalid.
 *
 * @param {string|number|null|undefined} headerValue
 * @returns {number|null} Milliseconds to wait, or null.
 */
export function parseRetryAfter(headerValue) {
  if (headerValue === null || headerValue === undefined) return null;
  const str = String(headerValue).trim();
  if (!str) return null;

  // Format 1: Number of seconds (RFC 7231 / express-rate-limit)
  if (/^\d+$/.test(str)) {
    const sec = parseInt(str, 10);
    if (!isNaN(sec) && sec > 0) {
      return sec * 1000;
    }
  }

  // Format 2: HTTP-date (RFC 7231)
  const parsedTime = Date.parse(str);
  if (!isNaN(parsedTime)) {
    const diff = parsedTime - Date.now();
    if (diff > 0) {
      return diff;
    }
  }

  return null;
}

/**
 * Computes backoff duration in milliseconds for HTTP 429.
 * Respects Retry-After header if provided; otherwise falls back to
 * a bounded exponential backoff starting at baseMs (default 60s).
 *
 * @param {string|number|null|undefined} retryHeader
 * @param {number} attempt Consecutive 429 attempts (0-indexed)
 * @param {number} baseMs Base backoff in ms (default: 60,000ms = 60s)
 * @param {number} maxMs Maximum backoff in ms (default: 300,000ms = 5min)
 * @returns {number} Wait time in milliseconds
 */
export function computeBackoffMs(retryHeader, attempt = 0, baseMs = 60000, maxMs = 300000) {
  const fromHeader = parseRetryAfter(retryHeader);
  if (fromHeader !== null) {
    // Respect Retry-After bounded to a reasonable range [1s, 10min]
    return Math.max(1000, Math.min(fromHeader, 600000));
  }

  // Bounded fallback exponential backoff starting at baseMs (60s)
  const multiplier = Math.pow(2, Math.max(0, attempt));
  return Math.min(maxMs, baseMs * multiplier);
}
