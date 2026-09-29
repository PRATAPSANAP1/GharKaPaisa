/**
 * Phase 6 Rollout Gate Configuration for Mobile Attendance
 * Centralized employee code rollout access gate.
 * 
 * NOTE: Attendance feature is now enabled for ALL employees.
 * The whitelist below is deprecated but kept for reference.
 */

export const ATTENDANCE_ENABLED_EMPLOYEE_CODES = ['CAND10001'];

/**
 * Validates whether the given employee code is authorized for attendance feature.
 * @param {string} employeeCode - Canonical employee code (e.g. CAND10001)
 * @returns {boolean} True if attendance feature is enabled
 * 
 * Updated: Now returns true for ALL employees with valid employee codes.
 */
export const isAttendanceEnabledForEmployee = (employeeCode) => {
  // Enable attendance for ALL employees with a valid employee code
  if (!employeeCode) return false;
  const cleanCode = String(employeeCode).trim().toUpperCase();
  // Only return false if employee code is empty or invalid
  return cleanCode.length > 0;
};
