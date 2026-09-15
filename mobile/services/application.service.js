import apiClient from '../config/api';

/**
 * Shared Application Service for Mobile & Backend Synchronization
 */
export const fetchApplicationsList = async (params = {}) => {
  try {
    const response = await apiClient.get('/applications', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to load applications' };
  }
};

export const fetchApplicationsDashboardStats = async (scope = 'my') => {
  try {
    const response = await apiClient.get('/applications/dashboard', { params: { scope } });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to load dashboard metrics' };
  }
};

export const createNewApplication = async (applicationPayload) => {
  try {
    const response = await apiClient.post('/applications', applicationPayload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to submit application' };
  }
};

export const fetchApplicationTimeline = async (appId) => {
  try {
    const response = await apiClient.get(`/applications/${appId}/timeline`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch application timeline' };
  }
};

export const trackPublicApplication = async (appNumber, mobile) => {
  try {
    const response = await apiClient.all('/customer-portal/public/track-application', {
      params: { app_number: appNumber, mobile }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to track application' };
  }
};

export const updateApplicationStatus = async (appId, status, remarks = '') => {
  try {
    const response = await apiClient.put(`/applications/${appId}/status`, { status, remarks });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update application status' };
  }
};
