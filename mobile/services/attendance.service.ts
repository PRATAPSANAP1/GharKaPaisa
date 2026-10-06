import apiClient from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface AttendanceRecord {
  id: string;
  attendance_date: string;
  check_in_time: string;
  check_out_time: string;
  status: string;
  verification_status: string;
  verification_reference: string;
  source: string;
  working_hours: string;
}

export interface MonthlySummary {
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalHalfDay: number;
  totalLeave: number;
  totalMarkedDays: number;
  totalWorkingHoursFormatted: string;
}

export interface VerificationSession {
  sessionId: string;
  employeeId: string;
  status: string;
  expiresAt: string;
  expiresInSeconds: number;
  challenge?: {
    token: string;
    type: string;
    instructions: string;
  };
}

export interface LivenessSession {
  sessionId: string;
  status: string;
  expiresAt: string;
}

export interface LivenessCredentials {
  region: string;
  sessionId: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    expiration: string;
  };
}

export interface VerificationResult {
  success: boolean;
  verification?: {
    liveness: string;
    face: string;
    environment: string;
  };
  reference?: {
    template_version: string;
    face_similarity: number;
  };
  telemetry?: {
    device_integrity_valid: boolean;
    mock_location_detected: boolean;
    face_quality_score: number;
  };
  reason?: string;
  userFeedback?: string;
  shouldRetry?: boolean;
}

export interface AttendanceResponse {
  success: boolean;
  message?: string;
  attendance_id?: string;
  check_in_time?: string;
  check_out_time?: string;
  status?: string;
}

// ============================================================================
// ATTENDANCE ENDPOINTS
// ============================================================================

/**
 * Fetch Today's Attendance for authenticated employee
 */
export const getTodayAttendance = async (): Promise<AttendanceRecord | null> => {
  try {
    const response = await apiClient.get('/attendance/today');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to load today\'s attendance' };
  }
};

/**
 * Fetch Monthly Attendance History for authenticated employee
 */
export const getMyAttendanceHistory = async (params: {
  month?: number;
  year?: number;
  limit?: number;
} = {}): Promise<{ records: AttendanceRecord[]; total: number }> => {
  try {
    const response = await apiClient.get('/attendance/my-attendance', { params });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to load attendance history' };
  }
};

/**
 * Fetch Monthly Attendance Summary for authenticated employee
 */
export const getMyAttendanceSummary = async (params: {
  month?: number;
  year?: number;
} = {}): Promise<MonthlySummary> => {
  try {
    const response = await apiClient.get('/attendance/my-summary', { params });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to load attendance summary' };
  }
};

/**
 * Get enrollment status for biometric attendance
 */
export const getEnrollmentStatus = async (): Promise<{ is_enrolled: boolean }> => {
  try {
    const response = await apiClient.get('/attendance/enrollment/status');
    return response.data?.data || response.data;
  } catch (error: any) {
    // If endpoint doesn't exist, return default
    return { is_enrolled: true };
  }
};

/**
 * Create a new Attendance Verification Session (5 min expiry)
 */
export const createVerificationSession = async (): Promise<VerificationSession> => {
  try {
    const response = await apiClient.post('/attendance/verification/session');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to create verification session' };
  }
};

/**
 * Initiate Liveness Session
 */
export const createLivenessSession = async (sessionId: string): Promise<LivenessSession> => {
  try {
    const response = await apiClient.post('/attendance/verification/liveness/session', {
      session_id: sessionId,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to create liveness session' };
  }
};

/**
 * Fetch Temporary AWS Liveness Credentials for session
 */
export const getLivenessCredentials = async (sessionId: string): Promise<LivenessCredentials> => {
  try {
    const response = await apiClient.post('/attendance/verification/liveness/credentials', {
      session_id: sessionId,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to fetch liveness credentials' };
  }
};

/**
 * Validate AWS Rekognition Liveness Result + Execute KYC Face Matching
 */
export const validateLivenessResult = async (
  sessionId: string,
  providerSessionId: string,
  locationData?: { latitude?: number; longitude?: number; accuracy?: number }
): Promise<VerificationResult> => {
  try {
    const response = await apiClient.post('/attendance/verification/liveness/result', {
      session_id: sessionId,
      provider_session_id: providerSessionId,
      latitude: locationData?.latitude,
      longitude: locationData?.longitude,
      accuracy: locationData?.accuracy,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to validate liveness result' };
  }
};

/**
 * Complete Verification Pipeline (Upload live face image)
 */
export const completeVerificationPipeline = async (
  sessionId: string,
  imageUri: string
): Promise<VerificationResult> => {
  try {
    const formData = new FormData();
    formData.append('session_id', sessionId);

    const filename = imageUri.split('/').pop() || `face_capture_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('face_image', {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    const response = await apiClient.post('/attendance/verification/complete', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to complete verification' };
  }
};

/**
 * Execute Attendance Check-In
 */
export const executeCheckIn = async (verificationSessionId: string): Promise<AttendanceResponse> => {
  try {
    const response = await apiClient.post('/attendance/check-in', {
      verification_session_id: verificationSessionId,
      source: 'MOBILE',
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to mark check-in' };
  }
};

/**
 * Execute Attendance Check-Out
 */
export const executeCheckOut = async (verificationSessionId: string): Promise<AttendanceResponse> => {
  try {
    const response = await apiClient.post('/attendance/check-out', {
      verification_session_id: verificationSessionId,
      source: 'MOBILE',
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to mark check-out' };
  }
};
