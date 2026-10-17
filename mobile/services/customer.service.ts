import apiClient from './api';
import { CustomerItem } from '../types';

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  partner_id?: string;
  from_date?: string;
  to_date?: string;
}

export interface CreateCustomerPayload {
  full_name: string;
  mobile: string;
  email?: string;
  pan_number?: string;
  city?: string;
  state?: string;
  pincode?: string;
  employment_type?: string;
  monthly_income?: number;
  employer?: string;
}

export const fetchCustomers = async (params: CustomerQueryParams = {}) => {
  try {
    const res = await apiClient.get('/customers', { params });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch customers' };
  }
};

export const fetchCustomerProfile = async (id: string) => {
  try {
    const res = await apiClient.get(`/customers/${id}`);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch customer profile' };
  }
};

export const createCustomer = async (payload: CreateCustomerPayload) => {
  try {
    const res = await apiClient.post('/customers', payload);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to create customer' };
  }
};

/**
 * Add a note to a customer
 */
export const addCustomerNote = async (customerId: string, note: string) => {
  try {
    const res = await apiClient.post(`/customers/${customerId}/notes`, { note });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to add note' };
  }
};

/**
 * Add a follow-up to a customer
 */
export const addCustomerFollowUp = async (customerId: string, followUpData: {
  follow_up_date: string;
  remarks?: string;
}) => {
  try {
    const res = await apiClient.post(`/customers/${customerId}/followups`, followUpData);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to schedule follow-up' };
  }
};

/**
 * Merge two customers
 */
export const mergeCustomers = async (sourceId: string, targetId: string) => {
  try {
    const res = await apiClient.post('/customers/merge', {
      source_id: sourceId,
      target_id: targetId,
    });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to merge customers' };
  }
};
