import apiClient from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface BiometricTemplate {
  id: string;
  version: number;
  status: string;
  enrollment_source: string;
  enrolled_at: string;
  enrolled_by_name?: string;
  image_url?: string | null;
  revoked_at?: string | null;
  revocation_reason?: string | null;
}

export interface BiometricStatus {
  employee_id: string;
  is_enrolled: boolean;
  status: string;
  active_template: BiometricTemplate | null;
  history: BiometricTemplate[];
  message?: string;
}

export interface BiometricReminder {
  id: string;
  employee_id: string;
  message: string;
  status: string;
  sent_at: string;
  seen_at?: string | null;
  completed_at?: string | null;
  sent_by_name?: string;
}

export interface MissingEnrollmentEmployee {
  id: string;
  employee_code?: string;
  full_name: string;
  designation?: string;
  department?: string;
  mobile_number?: string;
  email_id?: string;
  face_verification_status: string;
  attendance_access?: string;
  active_template_version?: number | null;
  latest_reminder_sent_at?: string | null;
}

export interface LocalImageFile {
  uri: string;
  name: string;
  type: string;
}

// ============================================================================
// BIOMETRIC FACE ENROLLMENT ENDPOINTS
// ============================================================================

/**
 * Fetch biometric enrollment status for a specific employee
 */
export const getEmployeeBiometricStatus = async (employeeId: string): Promise<BiometricStatus> => {
  try {
    const res = await apiClient.get(`/attendance/enrollment/employee/${employeeId}`);
    return res.data?.data || res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch biometric status' };
  }
};

/**
 * Fetch face verification reminder history for an employee
 */
export const getBiometricReminderHistory = async (employeeId: string): Promise<BiometricReminder[]> => {
  try {
    const res = await apiClient.get(`/attendance/enrollment/reminders/${employeeId}`);
    const data = res.data?.data;
    if (Array.isArray(data)) return data;
    return data?.reminders || [];
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch reminder history' };
  }
};

/**
 * Send a face verification reminder to an employee
 * (server enforces a 10-minute anti-spam throttle per employee)
 */
export const sendBiometricReminder = async (employeeId: string, message?: string): Promise<any> => {
  try {
    const res = await apiClient.post('/attendance/enrollment/reminder', {
      employee_id: employeeId,
      message,
    });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to send reminder' };
  }
};

/**
 * Generate a short-lived signed preview URL for the active biometric reference
 */
export const getBiometricPreviewUrl = async (employeeId: string): Promise<{ signedUrl: string; expiresInSeconds: number }> => {
  try {
    const res = await apiClient.get(`/attendance/enrollment/preview/${employeeId}`);
    return res.data?.data || res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to generate preview URL' };
  }
};

/**
 * Super Admin: initiate a biometric re-enrollment session.
 * Requires a business justification of at least 5 characters.
 */
export const createBiometricReEnrollmentSession = async (
  employeeId: string,
  reason: string
): Promise<{ sessionToken: string; expiresInSeconds: number }> => {
  try {
    const res = await apiClient.post('/attendance/enrollment/re-enrollment/session', {
      employee_id: employeeId,
      reason,
    });
    const data = res.data?.data || res.data;
    return { sessionToken: data.sessionToken || data.session_token, expiresInSeconds: data.expiresInSeconds };
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to initiate re-enrollment session' };
  }
};

/**
 * Super Admin: commit a replacement face reference image (multipart upload)
 */
export const commitBiometricReEnrollment = async (sessionToken: string, image: LocalImageFile): Promise<any> => {
  const formData = new FormData();
  formData.append('session_token', sessionToken);
  formData.append('face_image', {
    uri: image.uri,
    name: image.name,
    type: image.type,
  } as any);

  try {
    const res = await apiClient.post('/attendance/enrollment/re-enrollment/commit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to commit re-enrollment' };
  }
};

/**
 * Super Admin: list employees with missing/pending face verification
 */
export const getMissingBiometricEnrollments = async (
  params: { search?: string; status?: string; page?: number; limit?: number } = {}
): Promise<{ employees: MissingEnrollmentEmployee[]; pagination: any }> => {
  try {
    const res = await apiClient.get('/attendance/enrollment/missing', { params });
    const data = res.data?.data || res.data;
    return {
      employees: data?.missing_employees || data?.employees || [],
      pagination: data?.pagination || null,
    };
  } catch (err: any) {
    throw err.response?.data || { success: false, message: 'Failed to fetch missing enrollments' };
  }
};
