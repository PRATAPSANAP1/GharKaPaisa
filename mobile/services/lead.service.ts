import apiClient from './api';
import { LeadItem } from '../types';

export interface LeadQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  source?: string;
  bank_id?: string;
  from_date?: string;
  to_date?: string;
}

export interface CreateLeadPayload {
  product_id: string;
  customer_name: string;
  mobile: string;
  email?: string;
  city?: string;
  state?: string;
  pincode?: string;
  process_type?: string;
  monthly_salary?: string | number;
  company_name?: string;
  pan?: string;
  pan_number?: string;
  priority?: string;
  remarks?: string;
  business_type?: string;
}

export const fetchLeads = async (params: LeadQueryParams = {}) => {
  try {
    const res = await apiClient.get('/leads', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch leads' };
  }
};

export const fetchLeadDetails = async (id: string) => {
  try {
    const res = await apiClient.get(`/leads/${id}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch lead details' };
  }
};

export const createLead = async (payload: CreateLeadPayload) => {
  try {
    const res = await apiClient.post('/leads', payload);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to create lead' };
  }
};

export const sendLeadOtp = async (leadId: string, channel: 'sms' | 'whatsapp' = 'sms') => {
  try {
    const res = await apiClient.post(`/leads/${leadId}/send-otp`, { channel });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to send OTP' };
  }
};

export const verifyLeadOtp = async (leadId: string, otp: string) => {
  try {
    const res = await apiClient.post(`/leads/${leadId}/verify-otp`, { otp });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Invalid OTP' };
  }
};

export const addLeadNote = async (leadId: string, note: string) => {
  try {
    const res = await apiClient.post(`/leads/${leadId}/note`, { note, visibility: 'partner' });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to add note' };
  }
};

export const updateLeadStatus = async (leadId: string, status: string) => {
  try {
    const res = await apiClient.patch(`/leads/${leadId}`, { status });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to update status' };
  }
};

export const convertLeadToApplication = async (leadId: string) => {
  try {
    const res = await apiClient.post(`/leads/${leadId}/convert`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to convert lead' };
  }
};
