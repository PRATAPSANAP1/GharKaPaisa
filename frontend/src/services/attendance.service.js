import api from './api';

const attendanceService = {
  // Verification endpoints
  createVerificationSession: async () => {
    try {
      const response = await api.post('/attendance/verification/session');
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          const fallback1 = await api.post('/attendance/session');
          return fallback1.data;
        } catch (e1) {
          if (e1.response?.status === 404) {
            const fallback2 = await api.post('/attendance-verification/session');
            return fallback2.data;
          }
          throw e1;
        }
      }
      throw err;
    }
  },

  initiateLivenessSession: async (sessionId) => {
    const payload = { session_id: sessionId };
    try {
      const response = await api.post('/attendance/verification/liveness/session', payload);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          const fallback1 = await api.post('/attendance/liveness/session', payload);
          return fallback1.data;
        } catch (e1) {
          if (e1.response?.status === 404) {
            const fallback2 = await api.post('/attendance-verification/liveness/session', payload);
            return fallback2.data;
          }
          throw e1;
        }
      }
      throw err;
    }
  },

  getLivenessCredentials: async (sessionId) => {
    const payload = { session_id: sessionId };
    try {
      const response = await api.post('/attendance/verification/liveness/credentials', payload);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          const fallback1 = await api.post('/attendance/liveness/credentials', payload);
          return fallback1.data;
        } catch (e1) {
          if (e1.response?.status === 404) {
            const fallback2 = await api.post('/attendance-verification/liveness/credentials', payload);
            return fallback2.data;
          }
          throw e1;
        }
      }
      throw err;
    }
  },

  validateLivenessResult: async (sessionId, providerSessionId, locationData = {}) => {
    const payload = {
      session_id: sessionId,
      provider_session_id: providerSessionId,
      latitude: locationData.latitude ?? locationData.lat,
      longitude: locationData.longitude ?? locationData.lng,
      accuracy: locationData.accuracy,
    };
    try {
      const response = await api.post('/attendance/verification/liveness/result', payload);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          const fallback1 = await api.post('/attendance/liveness/result', payload);
          return fallback1.data;
        } catch (e1) {
          if (e1.response?.status === 404) {
            const fallback2 = await api.post('/attendance-verification/liveness/result', payload);
            return fallback2.data;
          }
          throw e1;
        }
      }
      throw err;
    }
  },

  // Office Building Geofence Endpoints
  getBuildingGeofences: async () => {
    const response = await api.get('/attendance/admin/buildings');
    return response.data;
  },

  createBuildingGeofence: async (data) => {
    const response = await api.post('/attendance/admin/buildings', data);
    return response.data;
  },

  updateBuildingGeofence: async (id, data) => {
    const response = await api.put(`/attendance/admin/buildings/${id}`, data);
    return response.data;
  },

  deleteBuildingGeofence: async (id) => {
    const response = await api.delete(`/attendance/admin/buildings/${id}`);
    return response.data;
  },

  completeVerification: async (sessionId, faceFile) => {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('face_image', faceFile);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    try {
      const response = await api.post('/attendance/verification/complete', formData, config);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          const fallback1 = await api.post('/attendance/complete', formData, config);
          return fallback1.data;
        } catch (e1) {
          if (e1.response?.status === 404) {
            const fallback2 = await api.post('/attendance-verification/complete', formData, config);
            return fallback2.data;
          }
          throw e1;
        }
      }
      throw err;
    }
  },

  // Biometric Enrollment Endpoints
  getEnrollmentStatus: async () => {
    const response = await api.get('/attendance/enrollment/status');
    return response.data;
  },

  getEmployeeEnrollmentStatus: async (employeeId) => {
    const response = await api.get(`/attendance/enrollment/employee/${employeeId}`);
    return response.data;
  },

  getMissingEnrollments: async (params) => {
    const response = await api.get('/attendance/enrollment/missing', { params });
    return response.data;
  },

  sendEnrollmentReminder: async (employeeId, message) => {
    const response = await api.post('/attendance/enrollment/reminder', {
      employee_id: employeeId,
      message,
    });
    return response.data;
  },

  getReminderHistory: async (employeeId) => {
    const response = await api.get(`/attendance/enrollment/reminders/${employeeId}`);
    return response.data;
  },

  // Attendance actions
  checkIn: async (verificationSessionId) => {
    const response = await api.post('/attendance/check-in', {
      verification_session_id: verificationSessionId,
    });
    return response.data;
  },

  checkOut: async (verificationSessionId) => {
    const response = await api.post('/attendance/check-out', {
      verification_session_id: verificationSessionId,
    });
    return response.data;
  },

  getTodayAttendance: async () => {
    const response = await api.get('/attendance/today');
    return response.data;
  },

  getMyAttendance: async (month, year) => {
    const response = await api.get('/attendance/my-attendance', {
      params: { month, year },
    });
    return response.data;
  },

  getMySummary: async (month, year) => {
    const response = await api.get('/attendance/my-summary', {
      params: { month, year },
    });
    return response.data;
  },
};

export default attendanceService;
