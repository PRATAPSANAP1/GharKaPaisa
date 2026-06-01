import api from './api';

const adminService = {
  getDashboardStats: () => api.get('/analytics/dashboard'),

  getStudents: (params) => api.get('/users', { params }),
  getStudent: (id) => api.get(`/users/${id}`),
  updateStudent: (id, data) => api.put(`/users/${id}`, data),
  deleteStudent: (id) => api.delete(`/users/${id}`),
  getUserStats: (id) => api.get(`/users/${id}/stats`),

  getQuestions: (params) => api.get('/questions', { params }),
  getQuestion: (id) => api.get(`/questions/${id}`),
  createQuestion: (data) => api.post('/questions', data),
  updateQuestion: (id, data) => api.put(`/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
  bulkImportQuestions: (data) => api.post('/questions/bulk', data),

  getTests: (params) => api.get('/tests', { params }),
  getTest: (id) => api.get(`/tests/${id}`),
  createTest: (data) => api.post('/tests', data),
  updateTest: (id, data) => api.put(`/tests/${id}`, data),
  deleteTest: (id) => api.delete(`/tests/${id}`),
  toggleTestStatus: (id, isActive) => api.put(`/tests/${id}`, { isActive }),

  getCodingProblems: (params) => api.get('/coding/problems', { params }),
  getCodingProblem: (id) => api.get(`/coding/problems/${id}`),
  createCodingProblem: (data) => api.post('/coding/problems', data),
  updateCodingProblem: (id, data) => api.put(`/coding/problems/${id}`, data),
  deleteCodingProblem: (id) => api.delete(`/coding/problems/${id}`),

  getCategories: (params) => api.get('/categories', { params }),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),

  getSubcategories: (categoryId) => api.get(`/categories/${categoryId}/subcategories`),
  createSubcategory: (categoryId, data) => api.post(`/categories/${categoryId}/subcategories`, data),
  updateSubcategory: (id, data) => api.put(`/categories/subcategories/${id}`, data),
  deleteSubcategory: (id) => api.delete(`/categories/subcategories/${id}`),

  getResults: (params) => api.get('/results/admin/all', { params }),
  getResultDetail: (id) => api.get(`/results/my/${id}`),
  getResultStats: (testId) => api.get(`/results/admin/stats/${testId}`),

  getStudentAnalytics: () => api.get('/analytics/students'),
  getTestAnalytics: () => api.get('/analytics/tests'),
  getCategoryAnalytics: () => api.get('/analytics/categories'),
};

export default adminService;

