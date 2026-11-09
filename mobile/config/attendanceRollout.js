/**
 * Phase 6 Rollout Gate Configuration for Mobile Attendance
 * Enables attendance functionality across all active employee accounts.
 */

export const ATTENDANCE_ENABLED_EMPLOYEE_CODES = [];

/**
 * Validates whether the given employee code or user context is authorized for attendance feature.
 * @param {string|object} userOrCode - Canonical employee code or user object
 * @returns {boolean} True if attendance feature is enabled
 */
export const isAttendanceEnabledForEmployee = (userOrCode) => {
  if (!userOrCode) return false;
  if (typeof userOrCode === 'object') {
    const role = (userOrCode.role || '').toUpperCase();
    if (role === 'EMPLOYEE' || role === 'SUPER_ADMIN' || role === 'ADMIN' || userOrCode.id) {
      return true;
    }
    const code = userOrCode.employee_code || userOrCode.employee_id || userOrCode.emp_code || '';
    return String(code).trim().length > 0;
  }
  const cleanCode = String(userOrCode).trim().toUpperCase();
  return cleanCode.length > 0;
};
