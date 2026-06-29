import api from './api';

const MAX_RETRIES = 3;
const delay = ms => new Promise(res => setTimeout(res, ms));

export const applicationService = {
  submit: (data) => api.post('/applications', data),
  list: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  updateStatus: (id, data) => api.patch(`/applications/${id}/status`, data),
  uploadDoc: async (id, file, doc_type, onUploadProgress) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Only PDF, JPG, and PNG are allowed.`);
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`File is too large. Max size is 5MB.`);
    }

    const form = new FormData();
    form.append('document', file);
    form.append('doc_type', doc_type);
    
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      try {
        return await api.post(`/applications/${id}/documents`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress
        });
      } catch (err) {
        attempt++;
        if (err.message === 'Network Error' && attempt < MAX_RETRIES) {
          await delay(1000 * attempt);
          continue;
        }
        throw err;
      }
    }
  },
};

export default applicationService;
