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
