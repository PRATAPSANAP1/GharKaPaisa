import apiClient from './api';
import { ApplicationItem } from '../types';

export interface ApplicationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  bank_id?: string;
  product_id?: string;
  category?: string;
  period?: string;
  commission_status?: string;
}

export const fetchApplications = async (params: ApplicationQueryParams = {}) => {
  try {
    const res = await apiClient.get('/applications', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to load applications' };
  }
};

export const fetchApplicationDetails = async (id: string) => {
  try {
    const res = await apiClient.get(`/applications/${id}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch application details' };
  }
};

export const fetchApplicationTimeline = async (id: string) => {
  try {
    const res = await apiClient.get(`/applications/${id}/timeline`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch application timeline' };
  }
};

export const fetchApplicationDocuments = async (id: string) => {
  try {
    const res = await apiClient.get(`/applications/${id}/documents`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch application documents' };
  }
};

export const fetchApplicationOperatorHistory = async (id: string) => {
  try {
    const res = await apiClient.get(`/applications/${id}/operator-history`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch operator history' };
  }
};

export const fetchNotifications = async () => {
  try {
    const res = await apiClient.get('/notifications');
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch notifications' };
  }
};

export const markNotificationRead = async (id: string) => {
  try {
    const res = await apiClient.put('/notifications/read', { id });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to mark notification as read' };
  }
};

export const submitCustomerApplication = async (payload: {
  product_id: string;
  customer_name: string;
  customer_mobile: string;
  customer_email?: string;
  pan_number?: string;
  income?: number;
  employment_type?: string;
  city?: string;
  partner_code?: string;
  tracking_token?: string;
}) => {
  try {
    const res = await apiClient.post('/public/share/submit', payload).catch(async () => {
      return await apiClient.post('/applications', payload);
    });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to submit application' };
  }
};

export const uploadCustomerDocument = async (tokenOrAppId: string, formData: any) => {
  try {
    const res = await apiClient.post(`/customer/upload/${tokenOrAppId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).catch(async () => {
      return await apiClient.post(`/applications/${tokenOrAppId}/documents`, formData);
    });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to upload document' };
  }
};

export const fetchBankCards = async (bankSlug: string) => {
  try {
    const res = await apiClient.get(`/products`, { params: { bank: bankSlug, category: 'credit-card' } });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch bank cards' };
  }
};

export const fetchCardBenefits = async (productId: string) => {
  try {
    const res = await apiClient.get(`/products/${productId}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch card benefits' };
  }
};
