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

export function getImageUrl(url) {
  if (!url) return '';
  const normalizedUrl = String(url).replace(/\\/g, '/');
  if (normalizedUrl.startsWith('data:') || normalizedUrl.startsWith('blob:') || normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
    return normalizedUrl;
  }
  const cleanPath = normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;
  return `${getApiRoot()}${cleanPath}`;
}
