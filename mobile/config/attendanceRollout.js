/**
 * Phase 6 Rollout Gate Configuration for Mobile Attendance
 * Enables attendance functionality across all active employee accounts.
 */

export const ATTENDANCE_ENABLED_EMPLOYEE_CODES = [];

/**
 * Validates whether the given employee code is authorized for attendance feature.
 * @param {string} employeeCode - Canonical employee code
 * @returns {boolean} True if attendance feature is enabled
 */
export const isAttendanceEnabledForEmployee = (employeeCode) => {
  if (!employeeCode) return false;
  const cleanCode = String(employeeCode).trim().toUpperCase();
  return cleanCode.length > 0;
};
