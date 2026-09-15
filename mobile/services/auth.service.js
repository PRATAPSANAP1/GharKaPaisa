import apiClient from '../config/api';
import { setSecureItem, removeSecureItem, getSecureItem } from './storage.service';

/**
 * Single Authentication Service for Mobile Client
 */
export const loginWithCredentials = async (identifier, password, role = 'PARTNER') => {
  try {
    const response = await apiClient.post('/auth/login', {
      identifier,
      password,
      role
    });

    if (response.data?.success && response.data?.token) {
      await setSecureItem('auth_token', response.data.token);
      if (response.data.refreshToken) {
        await setSecureItem('refresh_token', response.data.refreshToken);
      }
      await setSecureItem('auth_user', response.data.user);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: error.message || 'Login failed' };
  }
};

export const registerPartner = async (partnerData) => {
  try {
    const response = await apiClient.post('/auth/register', partnerData);
    if (response.data?.success && response.data?.token) {
      await setSecureItem('auth_token', response.data.token);
      await setSecureItem('auth_user', response.data.user);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: error.message || 'Registration failed' };
  }
};

export const sendMobileOtp = async (mobile, purpose = 'login') => {
  try {
    const response = await apiClient.post('/auth/send-otp', { mobile, purpose });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: error.message || 'Failed to send OTP' };
  }
};

export const verifyMobileOtp = async (mobile, otp, role = 'PARTNER') => {
  try {
    const response = await apiClient.post('/auth/verify-otp', { mobile, otp, role });
    if (response.data?.success && response.data?.token) {
      await setSecureItem('auth_token', response.data.token);
      await setSecureItem('auth_user', response.data.user);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: error.message || 'OTP verification failed' };
  }
};

export const getCurrentUserProfile = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    if (response.data?.user) {
      await setSecureItem('auth_user', response.data.user);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch user profile' };
  }
};

export const logoutSession = async () => {
  try {
    await apiClient.post('/auth/logout').catch(() => {});
  } finally {
    await removeSecureItem('auth_token');
    await removeSecureItem('refresh_token');
    await removeSecureItem('auth_user');
  }
  return { success: true };
};
