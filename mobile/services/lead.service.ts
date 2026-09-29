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
  priority?: string;
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
