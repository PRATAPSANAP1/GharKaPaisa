import api from './api';

export const applicationService = {
  submit: (data) => api.post('/applications', data),
  list: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  updateStatus: (id, data) => api.patch(`/applications/${id}/status`, data),
  uploadDoc: (id, file, doc_type) => {
    const form = new FormData();
    form.append('document', file);
    form.append('doc_type', doc_type);
    return api.post(`/applications/${id}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export default applicationService;
