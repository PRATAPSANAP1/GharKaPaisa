import api from './api';

const testService = {
  getTests: (params) => api.get('/tests', { params }),
  getTest: (id) => api.get(`/tests/${id}`),
  createTest: (data) => api.post('/tests', data),
  updateTest: (id, data) => api.put(`/tests/${id}`, data),
  deleteTest: (id) => api.delete(`/tests/${id}`),
  startTest: (id) => api.post(`/tests/${id}/start`),
  saveAnswer: (resultId, data) => api.patch(`/tests/results/${resultId}/save-answer`, data),
  submitTest: (id, submissionData) => api.post(`/tests/${id}/submit`, submissionData),
};

export default testService;

