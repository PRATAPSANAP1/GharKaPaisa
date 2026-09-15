import axios from 'axios';
import { getSecureItem, setSecureItem, removeSecureItem } from '../services/storage.service';

// Central single source of truth backend endpoint
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.gharkapaisa.in/api/v1';

// Global Event listener for working hours restriction
let onWorkingHoursCallback = null;
export const registerWorkingHoursListener = (callback) => {
  onWorkingHoursCallback = callback;
};

// Create configured Axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Platform': 'mobile-app'
  },
});

// Attach bearer token dynamically on outgoing requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getSecureItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handles Working Hours Over and Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const responseData = error.response?.data;

    // 1. Centralized Working Hours Enforcement
    if (responseData?.code === 'WORKING_HOURS_OVER' || responseData?.message?.includes('Working hours')) {
      if (typeof onWorkingHoursCallback === 'function') {
        onWorkingHoursCallback({
          isRestricted: true,
          message: responseData.message || 'Working hours are over. Your working hours are 09:30 AM to 08:00 PM.',
          details: responseData
        });
      }
    }

    // 2. Token Refresh on 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await getSecureItem('refresh_token');
        if (refreshToken) {
          const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          if (refreshRes.data?.token) {
            const newToken = refreshRes.data.token;
            await setSecureItem('auth_token', newToken);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshErr) {
        // Refresh token failed -> Clear session
        await removeSecureItem('auth_token');
        await removeSecureItem('refresh_token');
        await removeSecureItem('auth_user');
      }
    }

    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export default apiClient;
