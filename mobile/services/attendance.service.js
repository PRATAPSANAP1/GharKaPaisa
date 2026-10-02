import apiClient from '../config/api';

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
  const response = await apiClient.post('/attendance/verification/session');
  return response.data;
};

/**
 * Initiate Liveness Session
 */
export const createLivenessSession = async (sessionId) => {
  const response = await apiClient.post('/attendance/verification/liveness/session', {
    session_id: sessionId,
  });
  return response.data;
};

/**
 * Fetch Temporary AWS Liveness Credentials for session
 */
export const getLivenessCredentials = async (sessionId) => {
  const response = await apiClient.post('/attendance/verification/liveness/credentials', {
    session_id: sessionId,
  });
  return response.data;
};

/**
 * Validate AWS Rekognition Liveness Result + Execute KYC Face Matching
 */
export const validateLivenessResult = async (sessionId, providerSessionId) => {
  const response = await apiClient.post('/attendance/verification/liveness/result', {
    session_id: sessionId,
    provider_session_id: providerSessionId,
  });
  return response.data;
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

  const response = await apiClient.post('/attendance/verification/complete', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
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
