import api from './api';

const codingService = {
  getProblems: (params) => api.get('/coding/problems', { params }),
  getProblem: (id) => api.get(`/coding/problems/${id}`),
  createProblem: (data) => api.post('/coding/problems', data),
  updateProblem: (id, data) => api.put(`/coding/problems/${id}`, data),
  deleteProblem: (id) => api.delete(`/coding/problems/${id}`),
  runCode: (data) => api.post('/coding/run', data),
  submitCode: (data) => api.post('/coding/submit', data),
  getSubmissions: (problemId) => api.get(`/coding/submissions/${problemId}`),
};

export default codingService;

