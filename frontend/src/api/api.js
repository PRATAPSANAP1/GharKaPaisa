/**
 * api.js — Central Axios instance for https://api.gharkapaisa.in/api/v1
 *
 * Features:
 *  - Injects Authorization header from in-memory / sessionStorage on every request
 *  - Auto-refreshes access token on 401 (single retry)
 *  - Clears session and redirects/reloads to login on refresh failure
 */
import axios from 'axios';
import { getAuth } from 'firebase/auth';

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let inMemoryAccessToken = sessionStorage.getItem('gkp_access_token') || null;

export function setAccessToken(token) {
  inMemoryAccessToken = token;
  if (token) {
    sessionStorage.setItem('gkp_access_token', token);
  } else {
    sessionStorage.removeItem('gkp_access_token');
  }
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

export function clearAccessToken() {
  inMemoryAccessToken = null;
  sessionStorage.removeItem('gkp_access_token');
}

// ── Request: attach access token ──────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getAccessToken();
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
    // Timeout error handling
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      return Promise.reject({ 
        message: 'Request timed out. Check your connection.', 
        isTimeout: true 
      });
    }

    // Network offline detection
    if (!err.response) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return Promise.reject({ message: 'No internet connection', isOffline: true });
      }
      return Promise.reject({ message: 'Server unreachable', isNetworkError: true });
    }

    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            return api({
              ...original,
              headers: {
                ...original.headers,
                Authorization: `Bearer ${token}`,
              },
            });
          })
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Firebase manages token refresh internally — just request a fresh ID token
        const firebaseAuth = getAuth();
        const currentUser = firebaseAuth.currentUser;

        if (!currentUser) {
          processQueue(new Error('No Firebase user'), null);
          clearSession();
          return Promise.reject(err);
        }

        const newToken = await currentUser.getIdToken(true);
        setAccessToken(newToken);
        localStorage.setItem('gkp_refresh_token', currentUser.refreshToken || newToken);

        processQueue(null, newToken);

        return api({
          ...original,
          headers: {
            ...original.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
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
  setAccessToken(access_token);
  localStorage.setItem('gkp_refresh_token', refresh_token);
  
  sessionStorage.setItem('gkp_user', JSON.stringify({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    Partner_code: user.Partner_code || user.id,
    Partner_id: user.Partner_id,
  }));
}

export function clearSession() {
  clearAccessToken();
  localStorage.removeItem('gkp_refresh_token');
  sessionStorage.removeItem('gkp_user');

  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}

export function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('gkp_user') || 'null');
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  const token = sessionStorage.getItem('gkp_access_token');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default api;
