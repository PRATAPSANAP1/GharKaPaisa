/**
 * api.js — Central Axios instance for https://api.gharkapaisa.in/api/v1
 *
 * Features:
 *  - Injects Authorization header from localStorage on every request
 *  - Auto-refreshes access token on 401 (single retry)
 *  - Clears session and redirects to login on refresh failure
 */
import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach access token ──────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gkp_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: handle 401 → attempt token refresh ──────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('gkp_refresh_token');
      if (!refreshToken) {
        clearSession();
        return Promise.reject(err);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const newAccess = data.data.access_token;
        const newRefresh = data.data.refresh_token;
        localStorage.setItem('gkp_access_token', newAccess);
        localStorage.setItem('gkp_refresh_token', newRefresh);
        processQueue(null, newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearSession();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

// ── Session helpers ────────────────────────────────────────────────────────────
export function saveSession({ access_token, refresh_token, user }) {
  localStorage.setItem('gkp_access_token', access_token);
  localStorage.setItem('gkp_refresh_token', refresh_token);
  localStorage.setItem('gkp_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('gkp_access_token');
  localStorage.removeItem('gkp_refresh_token');
  localStorage.removeItem('gkp_user');
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('gkp_user') || 'null');
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem('gkp_access_token');
}

export default api;
