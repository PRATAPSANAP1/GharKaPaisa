import api from './api';

/**
 * Customer API Service
 * Centralized API calls for customer/CRM management
 */

export const fetchCustomers = async (params = {}) => {
  try {
    const response = await api.get('/customers', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch customers' };
  }
};

export const fetchCustomerDashboardMetrics = async () => {
  try {
    const response = await api.get('/customers/dashboard/metrics');
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch dashboard metrics' };
  }
};

export const fetchCustomerProfile = async (id) => {
  try {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch customer profile' };
  }
};

export const createCustomer = async (customerData) => {
  try {
    const response = await api.post('/customers', customerData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to create customer' };
  }
};

export const updateCustomer = async (id, customerData) => {
  try {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update customer' };
  }
};

export const updatePipelineStatus = async (id, status) => {
  try {
    const response = await api.patch(`/customers/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update pipeline status' };
  }
};

export const archiveCustomer = async (id) => {
  try {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to archive customer' };
  }
};

export const mergeCustomers = async (mergeData) => {
  try {
    const response = await api.post('/customers/merge', mergeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to merge customers' };
  }
};

export const uploadCustomerDocument = async (id, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/customers/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to upload document' };
  }
};

export const deleteCustomerDocument = async (id, docId) => {
  try {
    const response = await api.delete(`/customers/${id}/documents/${docId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to delete document' };
  }
};

export const generateShareLink = async (id) => {
  try {
    const response = await api.post(`/customers/${id}/share-link`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to generate share link' };
  }
};

export const addCustomerNote = async (id, note) => {
  try {
    const response = await api.post(`/customers/${id}/notes`, note);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to add note' };
  }
};

export const addFollowup = async (id, followup) => {
  try {
    const response = await api.post(`/customers/${id}/followups`, followup);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to add followup' };
  }
};

export const logCommunication = async (id, communication) => {
  try {
    const response = await api.post(`/customers/${id}/log-call`, communication);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to log communication' };
  }
};
