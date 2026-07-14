import api from './api';

export const partnerService = {
  getProfile: (id) => api.get(`/Partners/${id}/profile`),
  getOnboarding: () => api.get('/partner/onboarding'),
  updateProfile: (id, data) => api.put(`/Partners/${id}/profile`, data),
  getDashboard: (id) => api.get(`/Partners/${id}/dashboard`),
  uploadKYC: (id, files, numbers) => {
    const form = new FormData();
    Object.entries(files).forEach(([k, v]) => {
      if (v) form.append(k, v);
    });
    Object.entries(numbers).forEach(([k, v]) => {
      if (v) form.append(k, v);
    });
    return api.post(`/Partners/${id}/kyc`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export default partnerService;
