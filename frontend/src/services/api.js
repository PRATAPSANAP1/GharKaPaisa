/**
 * api.js — Central Axios instance (see config/api.js for base URL)
 *
 * Features:
 *  - Injects Authorization header from in-memory / sessionStorage on every request
 *  - Auto-refreshes access token on 401 using Refresh Token Rotation (RTR)
 *  - Clears session and updates Zustand state on refresh failure (without hard page reload loops)
 */
import axios from 'axios';
import { getApiV1Url } from '../config/api';

const BASE_URL = getApiV1Url();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let inMemoryAccessToken = null;
let activeRequests = 0;
let authFailureHandler = null;

const getDeviceId = () => {
  const key = 'gkp_device_id';
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
};

const showLoader = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("loader", { detail: true }));
  }
};

const hideLoader = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("loader", { detail: false }));
  }
};

export function registerAuthFailureHandler(handler) {
  authFailureHandler = handler;
}

export function setAccessToken(token) {
  inMemoryAccessToken = token;
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

export function clearAccessToken() {
  inMemoryAccessToken = null;
}

// ── Request: attach access token ──────────────────────────────────────────────
api.interceptors.request.use((config) => {
  activeRequests++;
  showLoader();
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => {
  activeRequests--;
  if (activeRequests <= 0) {
    activeRequests = 0;
    hideLoader();
  }
  return Promise.reject(err);
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
  (res) => {
    activeRequests--;
    if (activeRequests <= 0) {
      activeRequests = 0;
      hideLoader();
    }
    return res;
  },
  async (err) => {
    activeRequests--;
    if (activeRequests <= 0) {
      activeRequests = 0;
      hideLoader();
    }
    const originalRequest = err.config;

    // Timeout error handling
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
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
      const requestUrl = originalRequest.url || '';
      // Don't try to refresh if the request is to login or refresh itself
      if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh') || requestUrl.includes('auth/refresh')) {
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
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        if (response.data && response.data.success) {
          const newToken = response.data.token;
          
          setAccessToken(newToken);
          
          api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
          originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
          
          processQueue(null, newToken);
          isRefreshing = false;
          
          return api(originalRequest);
        } else {
          processQueue(new Error('Refresh returned unsuccessful response'), null);
          isRefreshing = false;
          clearSession();
          return Promise.reject(err);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        // Clear session on authentication/refresh failures (401, 500, 403) to prevent stale token retries
        const status = refreshError?.response?.status;
        if (!status || status === 401 || status === 500 || status === 403) {
          clearSession();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  }
);

// ── Session helpers ────────────────────────────────────────────────────────────
export function clearSession() {
  clearAccessToken();
  if (authFailureHandler) {
    try {
      authFailureHandler();
    } catch (e) {
      console.warn("Auth failure handler failed:", e);
    }
  }
}

export default api;
