import api from './api';

/**
 * Lead API Service
 * Centralized API calls for lead management
 */

export const fetchLeads = async (params = {}) => {
  try {
    const response = await api.get('/leads', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch leads' };
  }
};

export const fetchLeadDetails = async (id) => {
  try {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch lead details' };
  }
};

export const createLead = async (leadData) => {
  try {
    const response = await api.post('/leads', leadData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to create lead' };
  }
};

export const updateLead = async (id, leadData) => {
  try {
    const response = await api.put(`/leads/${id}`, leadData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update lead' };
  }
};

export const updateLeadStatus = async (id, status, remarks = '') => {
  try {
    const response = await api.patch(`/leads/${id}/status`, { status, remarks });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update lead status' };
  }
};

export const deleteLead = async (id) => {
  try {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to delete lead' };
  }
};

export const assignLead = async (id, assigneeId) => {
  try {
    const response = await api.post(`/leads/${id}/assign`, { assigneeId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to assign lead' };
  }
};
