import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSecureItem, setSecureItem, clearAuthStorage } from './storage.service';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.gharkapaisa.in/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Platform': 'mobile-app'
  },
  withCredentials: true,
});

// Request Interceptor: Attach bearer token dynamically
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getSecureItem<string>('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handles 401 Token Refresh & Error Normalization
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await getSecureItem<string>('refresh_token');
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, 
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        if (refreshResponse.data?.success && refreshResponse.data?.token) {
          const newToken = refreshResponse.data.token;
          const newRefreshToken = refreshResponse.data.refreshToken || storedRefreshToken;

          await setSecureItem('auth_token', newToken);
          if (newRefreshToken) {
            await setSecureItem('refresh_token', newRefreshToken);
          }

          processQueue(null, newToken);
          isRefreshing = false;

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        await clearAuthStorage();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
