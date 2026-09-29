import apiClient from './api';
import {
  UserProfile,
  ProfileUpdateRequest,
  PasswordChangeRequest,
  SecurityDeviceSession,
  SecurityDashboardMetrics,
} from '../types';
import { setSecureItem, clearAuthStorage } from './storage.service';

export const sendOtp = async (identity: string, role = 'PARTNER') => {
  try {
    const res = await apiClient.post('/auth/send-otp', { identity, role });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to send OTP' };
  }
};

export const loginWithOtp = async (identity: string, otp: string, role = 'PARTNER', rememberMe = true) => {
  try {
    const res = await apiClient.post('/auth/login', {
      identity,
      otp,
      role,
      rememberMe,
    });

    if (res.data?.success && res.data?.token) {
      await setSecureItem('auth_token', res.data.token);
      if (res.data.refreshToken) {
        await setSecureItem('refresh_token', res.data.refreshToken);
      }
      if (res.data.user) {
        await setSecureItem('auth_user', res.data.user);
      }
    }
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Login failed' };
  }
};

export const fetchCurrentUser = async (): Promise<{ success: boolean; user?: UserProfile }> => {
  try {
    const res = await apiClient.get('/auth/me');
    if (res.data?.user) {
      await setSecureItem('auth_user', res.data.user);
    }
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch profile' };
  }
};

export const updateProfile = async (reqPayload: ProfileUpdateRequest): Promise<{ success: boolean; data?: UserProfile; message?: string }> => {
  try {
    const res = await apiClient.put('/auth/profile', reqPayload);
    if (res.data?.data) {
      await setSecureItem('auth_user', res.data.data);
    }
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to update profile' };
  }
};

export const changePassword = async (reqPayload: PasswordChangeRequest): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await apiClient.post('/auth/change-password', reqPayload);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to change password' };
  }
};

export const requestEmailChange = async (newEmail: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await apiClient.post('/auth/change-email/request', { newEmail });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to request email change' };
  }
};

export const verifyEmailChange = async (oldOtp: string, newOtp: string): Promise<{ success: boolean; message?: string; email?: string }> => {
  try {
    const res = await apiClient.post('/auth/change-email', { oldOtp, newOtp });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to verify email change' };
  }
};

export const requestMobileChange = async (newMobile: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await apiClient.post('/auth/change-mobile/request', { newMobile });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to request mobile change' };
  }
};

export const verifyMobileChange = async (oldOtp: string, newOtp: string): Promise<{ success: boolean; message?: string; mobile?: string }> => {
  try {
    const res = await apiClient.post('/auth/change-mobile', { oldOtp, newOtp });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to verify mobile change' };
  }
};

export const fetchActiveDevices = async (): Promise<SecurityDeviceSession[]> => {
  try {
    const res = await apiClient.get('/auth/devices');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  } catch (err: any) {
    console.error('Failed to fetch active devices:', err);
    throw err.response?.data || { success: false, message: 'Failed to fetch active devices' };
  }
};

export const revokeDeviceSession = async (deviceId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await apiClient.delete(`/auth/device/${deviceId}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to revoke device session' };
  }
};

export const logoutAllDevices = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await apiClient.post('/auth/logout-all');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to logout from all devices' };
  }
};

export const fetchSecurityDashboard = async (): Promise<SecurityDashboardMetrics | null> => {
  try {
    const res = await apiClient.get('/auth/security-dashboard');
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (err: any) {
    console.error('Failed to fetch security dashboard:', err);
    throw err.response?.data || { success: false, message: 'Failed to fetch security dashboard' };
  }
};

export const logoutSession = async () => {
  try {
    await apiClient.post('/auth/logout').catch(() => {});
  } finally {
    await clearAuthStorage();
  }
  return { success: true };
};
