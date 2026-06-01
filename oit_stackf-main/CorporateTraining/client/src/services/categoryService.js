import api from './api';

const categoryService = {
  getCategories: (params) => api.get('/categories', { params }),
  getCategory: (id) => api.get(`/categories/${id}`),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  getSubcategories: (categoryId) => api.get(`/categories/${categoryId}/subcategories`),
  createSubcategory: (categoryId, data) => api.post(`/categories/${categoryId}/subcategories`, data),
  updateSubcategory: (id, data) => api.put(`/categories/subcategories/${id}`, data),
  deleteSubcategory: (id) => api.delete(`/categories/subcategories/${id}`),
};

export default categoryService;

