import api from './api';

const attendanceService = {
  // Verification endpoints
  createVerificationSession: async () => {
    const response = await api.post('/attendance/verification/session');
    return response.data;
  },

  initiateLivenessSession: async (sessionId) => {
    const response = await api.post('/attendance/verification/liveness/session', {
      session_id: sessionId,
    });
    return response.data;
  },

  getLivenessCredentials: async (sessionId) => {
    const response = await api.post('/attendance/verification/liveness/credentials', {
      session_id: sessionId,
    });
    return response.data;
  },

  validateLivenessResult: async (sessionId, providerSessionId) => {
    const response = await api.post('/attendance/verification/liveness/result', {
      session_id: sessionId,
      provider_session_id: providerSessionId,
    });
    return response.data;
  },

  completeVerification: async (sessionId, faceFile) => {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('face_image', faceFile);

    const response = await api.post('/attendance/verification/complete', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
