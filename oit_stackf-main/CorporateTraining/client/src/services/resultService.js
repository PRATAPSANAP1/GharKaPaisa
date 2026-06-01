import api from './api';

const resultService = {
  getMyResults: (params) => api.get('/results/my', { params }),
  getResultDetail: (id) => api.get(`/results/my/${id}`),
  getAllResults: (params) => api.get('/results/admin/all', { params }),
  getResultStats: (testId) => api.get(`/results/admin/stats/${testId}`),
};

export default resultService;

