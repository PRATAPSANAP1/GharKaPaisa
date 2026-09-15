import axios from 'axios';

// Central configuration for the mobile app API
// Uses EXPO_PUBLIC_API_URL or defaults to production API URL
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.gharkapaisa.in/api/v1';

// Create a configured Axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Helper to set authorization token on client requests
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export default apiClient;
