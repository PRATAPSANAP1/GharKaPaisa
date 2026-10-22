import apiClient from './api';

/**
 * Fetch Today's Attendance for authenticated employee
 */
export const getTodayAttendance = async () => {
  const response = await apiClient.get('/attendance/today');
  return response.data;
};

/**
 * Fetch Monthly Attendance History for authenticated employee
 */
export const getMyAttendanceHistory = async (params = {}) => {
  const response = await apiClient.get('/attendance/my-attendance', { params });
  return response.data;
};

/**
 * Fetch Monthly Attendance Summary for authenticated employee
 */
export const getMyAttendanceSummary = async (params = {}) => {
  const response = await apiClient.get('/attendance/my-summary', { params });
  return response.data;
};

/**
 * Create a new Attendance Verification Session (5 min expiry)
 */
export const createVerificationSession = async () => {
  try {
    const response = await apiClient.post('/attendance/verification/session');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      try {
        const fb1 = await apiClient.post('/attendance/session');
        return fb1.data;
      } catch (e1) {
        if (e1.response?.status === 404) {
          const fb2 = await apiClient.post('/attendance-verification/session');
          return fb2.data;
        }
      }
    }
    throw error;
  }
};

/**
 * Initiate Liveness Session
 */
export const createLivenessSession = async (sessionId) => {
  const payload = { session_id: sessionId };
  try {
    const response = await apiClient.post('/attendance/verification/liveness/session', payload);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      try {
        const fb1 = await apiClient.post('/attendance/liveness/session', payload);
        return fb1.data;
      } catch (e1) {
        if (e1.response?.status === 404) {
          const fb2 = await apiClient.post('/attendance-verification/liveness/session', payload);
          return fb2.data;
        }
      }
    }
    throw error;
  }
};

/**
 * Fetch Temporary AWS Liveness Credentials for session
 */
export const getLivenessCredentials = async (sessionId) => {
  const payload = { session_id: sessionId };
  try {
    const response = await apiClient.post('/attendance/verification/liveness/credentials', payload);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      try {
        const fb1 = await apiClient.post('/attendance/liveness/credentials', payload);
        return fb1.data;
      } catch (e1) {
        if (e1.response?.status === 404) {
          const fb2 = await apiClient.post('/attendance-verification/liveness/credentials', payload);
          return fb2.data;
        }
      }
    }
    throw error;
  }
};

/**
 * Validate AWS Rekognition Liveness Result + Execute KYC Face Matching + Geofence Verification
 */
export const validateLivenessResult = async (sessionId, providerSessionId, locationData = {}) => {
  const payload = {
    session_id: sessionId,
    provider_session_id: providerSessionId,
    latitude: locationData.latitude ?? locationData.lat,
    longitude: locationData.longitude ?? locationData.lng,
    accuracy: locationData.accuracy,
  };
  try {
    const response = await apiClient.post('/attendance/verification/liveness/result', payload);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      try {
        const fb1 = await apiClient.post('/attendance/liveness/result', payload);
        return fb1.data;
      } catch (e1) {
        if (e1.response?.status === 404) {
          const fb2 = await apiClient.post('/attendance-verification/liveness/result', payload);
          return fb2.data;
        }
      }
    }
    throw error;
  }
};

/**
 * Complete Verification Pipeline (Upload live face image)
 */
export const completeVerificationPipeline = async (sessionId, imageUri) => {
  const formData = new FormData();
  formData.append('session_id', sessionId);

  const filename = imageUri.split('/').pop() || `face_capture_${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('face_image', {
    uri: imageUri,
    name: filename,
    type: type,
  });

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  try {
    const response = await apiClient.post('/attendance/verification/complete', formData, config);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      try {
        const fb1 = await apiClient.post('/attendance/complete', formData, config);
        return fb1.data;
      } catch (e1) {
        if (e1.response?.status === 404) {
          const fb2 = await apiClient.post('/attendance-verification/complete', formData, config);
          return fb2.data;
        }
      }
    }
    throw error;
  }
};

/**
 * Execute Attendance Check-In
 */
export const executeCheckIn = async (verificationSessionId) => {
  const response = await apiClient.post('/attendance/check-in', {
    verification_session_id: verificationSessionId,
    source: 'MOBILE',
  });
  return response.data;
};

/**
 * Execute Attendance Check-Out
 */
export const executeCheckOut = async (verificationSessionId) => {
  const response = await apiClient.post('/attendance/check-out', {
    verification_session_id: verificationSessionId,
    source: 'MOBILE',
  });
  return response.data;
};
