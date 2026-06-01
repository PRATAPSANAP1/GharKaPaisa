// Global Configuration and API Utility
const CONFIG = {
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : '/api'
};

// Global API Utility
const api = {
    // Get token from local storage
    getToken: () => localStorage.getItem('token'),

    // Set token to local storage
    setToken: (token) => localStorage.setItem('token', token),

    // Remove token
    removeToken: () => localStorage.removeItem('token'),

    // Logout helper
    logout: () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    },

    // Generic Fetch Wrapper
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_URL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Specific API calls
    auth: {
        login: (credentials) => api.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),
        register: (userData) => api.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),
        forgotPassword: (email) => api.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        }),
        getProfile: () => api.request('/auth/profile', { method: 'GET' }),
        updateProfile: (data) => api.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    },

    admin: {
        getStats: () => api.request('/admin/stats'),
        getUsers: (params = '') => api.request(`/admin/users${params}`),
        deleteUser: (id) => api.request(`/admin/users/${id}`, { method: 'DELETE' }),
        getUserStats: (id) => api.request(`/admin/users/${id}/stats`),
        getTests: (params = '') => api.request(`/admin/tests${params}`),
        getTest: (id) => api.request(`/admin/tests/${id}`),
        createTest: (data) => api.request('/admin/tests', { method: 'POST', body: JSON.stringify(data) }),
        updateTest: (id, data) => api.request(`/admin/tests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteTest: (id) => api.request(`/admin/tests/${id}`, { method: 'DELETE' }),
        toggleTest: (id) => api.request(`/admin/tests/${id}/toggle`, { method: 'PATCH' }),
        getCoding: (params = '') => api.request(`/admin/coding${params}`),
        getCodingProblem: (id) => api.request(`/admin/coding/${id}`),
        createCoding: (data) => api.request('/admin/coding', { method: 'POST', body: JSON.stringify(data) }),
        updateCoding: (id, data) => api.request(`/admin/coding/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteCoding: (id) => api.request(`/admin/coding/${id}`, { method: 'DELETE' }),
        getCategories: (params = '') => api.request(`/admin/categories${params}`)
    },

    tests: {
        getAll: (params = '') => api.request(`/tests${params}`),
        getOne: (id) => api.request(`/tests/${id}`),
        start: (id) => api.request(`/tests/${id}/start`, { method: 'POST' }),
        submit: (id, data) => api.request(`/tests/${id}/submit`, { method: 'POST', body: JSON.stringify(data) })
    },

    results: {
        getMy: (params = '') => api.request(`/results/my-results${params}`),
        getOne: (id) => api.request(`/results/${id}`),
        getAll: (params = '') => api.request(`/results${params}`),
        saveAnswer: (resultId, data) => api.request(`/results/${resultId}/answer`, { method: 'PUT', body: JSON.stringify(data) })
    },

    coding: {
        getProblems: (params = '') => api.request(`/coding/problems${params}`),
        getProblem: (id) => api.request(`/coding/problems/${id}`),
        getSubmissions: (id) => api.request(`/coding/problems/${id}/submissions`),
        run: (data) => api.request('/coding/run', { method: 'POST', body: JSON.stringify(data) }),
        submit: (data) => api.request('/coding/submit', { method: 'POST', body: JSON.stringify(data) })
    },

    leaderboard: {
        get: (params = '') => api.request(`/leaderboard${params}`)
    },

    categories: {
        getAll: () => api.request('/categories'),
        getOne: (id) => api.request(`/categories/${id}`),
        create: (data) => api.request('/categories', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => api.request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => api.request(`/categories/${id}`, { method: 'DELETE' }),
        getSubcategories: (id) => api.request(`/categories/${id}/subcategories`),
        createSubcategory: (id, data) => api.request(`/categories/${id}/subcategories`, { method: 'POST', body: JSON.stringify(data) }),
        updateSubcategory: (id, data) => api.request(`/categories/subcategories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        deleteSubcategory: (id) => api.request(`/categories/subcategories/${id}`, { method: 'DELETE' })
    },

    questions: {
        getAll: (params = '') => api.request(`/questions${params}`),
        getOne: (id) => api.request(`/questions/${id}`),
        create: (data) => api.request('/questions', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => api.request(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => api.request(`/questions/${id}`, { method: 'DELETE' }),
        bulkImport: (data) => api.request('/questions/bulk', { method: 'POST', body: JSON.stringify(data) })
    },

    interview: {
        start: (data) => api.request('/interview/start', { method: 'POST', body: JSON.stringify(data) }),
        answer: (data) => api.request('/interview/answer', { method: 'POST', body: JSON.stringify(data) }),
        end: (data) => api.request('/interview/end', { method: 'POST', body: JSON.stringify(data) }),
        getHistory: () => api.request('/interview/history')
    },

    analytics: {
        getStudents: () => api.request('/analytics/students'),
        getTests: () => api.request('/analytics/tests'),
        getCategories: () => api.request('/analytics/categories')
    }
};
