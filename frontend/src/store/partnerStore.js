import { create } from 'zustand';
import api from '../api/api';

export const usePartnerStore = create((set) => ({
  profile: null,
  applications: [],
  isLoading: false,
  error: null,
  
  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/partner/profile');
      set({ profile: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch profile', isLoading: false });
      throw error;
    }
  },
  
  fetchApplications: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/partner/applications', { params });
      set({ applications: response.data.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch applications', isLoading: false });
      throw error;
    }
  },

  clearData: () => set({ profile: null, applications: [], error: null })
}));
