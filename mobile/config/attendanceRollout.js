/**
 * Phase 6 Rollout Gate Configuration for Mobile Attendance
 * Centralized employee code rollout access gate.
 */

export const ATTENDANCE_ENABLED_EMPLOYEE_CODES = ['CAND10001'];

/**
 * Validates whether the given employee code is authorized for attendance feature.
 * @param {string} employeeCode - Canonical employee code (e.g. CAND10001)
 * @returns {boolean} True if attendance feature is enabled
 */
export const isAttendanceEnabledForEmployee = (employeeCode) => {
  if (!employeeCode) return false;
  const cleanCode = String(employeeCode).trim().toUpperCase();
  return ATTENDANCE_ENABLED_EMPLOYEE_CODES.includes(cleanCode);
};
