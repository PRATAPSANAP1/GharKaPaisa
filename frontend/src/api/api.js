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
  withCredentials: true,
});

let inMemoryAccessToken = null;
let activeRequests = 0;

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


export function setAccessToken(token) {
  inMemoryAccessToken = token;
  try {
    useAuthStore.setState({ token, isAuthenticated: !!token });
  } catch (e) {
    console.warn("Zustand sync error:", e);
  }
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

export function clearAccessToken() {
  inMemoryAccessToken = null;
  try {
    useAuthStore.setState({ token: null, isAuthenticated: false });
  } catch (e) {
    console.warn("Zustand sync error:", e);
  }
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
export function saveSession({ access_token, user }) {
  try {
    localStorage.setItem('gkp_logged_in', 'true');
  } catch (e) {
    console.warn("Failed to set login flag:", e);
  }
  setAccessToken(access_token);
  
  // Update Zustand Store
  try {
    useAuthStore.setState({ user, token: access_token, isAuthenticated: true });
  } catch (e) {
    console.warn("Zustand session save sync error:", e);
  }
}

export function clearSession() {
  try {
    localStorage.removeItem('gkp_logged_in');
  } catch (e) {
    console.warn("Failed to remove login flag:", e);
  }
  clearAccessToken();

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
    return useAuthStore.getState().user;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  try {
    return useAuthStore.getState().isAuthenticated;
  } catch {
    return !!inMemoryAccessToken;
  }
}

export default api;
