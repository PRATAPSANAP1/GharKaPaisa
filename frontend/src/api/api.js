/**
 * api.js — Central Axios instance for https://api.gharkapaisa.in/api/v1
 *
 * Features:
 *  - Injects Authorization header from in-memory / sessionStorage on every request
 *  - Auto-refreshes access token on 401 using Refresh Token Rotation (RTR)
 *  - Clears session and redirects/reloads to login on refresh failure
 */
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const rawBase = import.meta.env.VITE_API_URL || 'https://api.gharkapaisa.in';
const BASE_URL = rawBase.replace(/\/+$/, '').endsWith('/api/v1') ? rawBase.replace(/\/+$/, '') : rawBase.replace(/\/+$/, '') + '/api/v1';

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
    // Sync with Zustand store
    try {
      useAuthStore.setState({ token, isAuthenticated: true });
    } catch (e) {
      console.warn("Zustand sync error:", e);
    }
  } else {
    sessionStorage.removeItem('gkp_access_token');
    // Sync with Zustand store
    try {
      useAuthStore.setState({ token: null, isAuthenticated: false });
    } catch (e) {
      console.warn("Zustand sync error:", e);
    }
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
    const originalRequest = err.config;

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

    // Handle 401 Unauthorized and attempt token refresh
    if (err.response.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if the request is to login or refresh itself
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
        return Promise.reject(err);
      }

      const refreshToken = localStorage.getItem('gkp_refresh_token');
      if (!refreshToken) {
        clearSession();
        return Promise.reject(err);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        if (response.data && response.data.success) {
          const newToken = response.data.token;
          const newRefreshToken = response.data.refreshToken;
          
          setAccessToken(newToken);
          localStorage.setItem('gkp_refresh_token', newRefreshToken);
          
          api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
          originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
          
          processQueue(null, newToken);
          isRefreshing = false;
          
          return api(originalRequest);
        } else {
          clearSession();
          return Promise.reject(err);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        clearSession();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  }
);

// ── Session helpers ────────────────────────────────────────────────────────────
export function saveSession({ access_token, refresh_token, user }) {
  setAccessToken(access_token);
  if (refresh_token) {
    localStorage.setItem('gkp_refresh_token', refresh_token);
  }
  
  sessionStorage.setItem('user', JSON.stringify(user));
  
  // Update Zustand Store
  try {
    useAuthStore.setState({ user, token: access_token, isAuthenticated: true });
  } catch (e) {
    console.warn("Zustand session save sync error:", e);
  }

  sessionStorage.setItem('gkp_user', JSON.stringify({
    id: user.id,
    first_name: user.first_name || user.full_name || '',
    last_name: user.last_name || '',
    role: user.role,
    Partner_code: user.Partner_code || user.id,
    Partner_id: user.Partner_id,
  }));
}

export function clearSession() {
  clearAccessToken();
  localStorage.removeItem('gkp_refresh_token');
  sessionStorage.removeItem('gkp_user');
  sessionStorage.removeItem('user');

  try {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  } catch (e) {
    console.warn("Zustand session clear sync error:", e);
  }

  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}

export function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user') || 'null');
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
