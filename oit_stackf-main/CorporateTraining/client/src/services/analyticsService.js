import api from './api';

const analyticsService = {
  getDashboardStats: () => api.get('/analytics/dashboard'),
  getStudentAnalytics: () => api.get('/analytics/students'),
  getTestAnalytics: () => api.get('/analytics/tests'),
  getCategoryAnalytics: () => api.get('/analytics/categories'),
};

export default analyticsService;

