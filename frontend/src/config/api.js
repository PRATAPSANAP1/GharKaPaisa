/**
 * Central API URL helpers — use these instead of inline env fallbacks.
 * VITE_API_URL may be the host root (https://api.example.com) or include /api/v1.
 */
const PROD_API_ROOT = 'https://api.gharkapaisa.in';
const DEV_API_ROOT = 'http://localhost:5000';

export function getApiRoot() {
  const fallback = import.meta.env.DEV ? DEV_API_ROOT : PROD_API_ROOT;
  const raw = (import.meta.env.VITE_API_URL || fallback).replace(/\/+$/, '');
  return raw.endsWith('/api/v1') ? raw.slice(0, -'/api/v1'.length) : raw;
}

export function getApiV1Url() {
  return `${getApiRoot()}/api/v1`;
}
