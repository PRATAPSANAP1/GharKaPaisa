/**
 * Employee Attendance Feature Rollout Gate Configuration
 * Enables attendance functionality across all employee accounts.
 */

export const ATTENDANCE_ENABLED_EMPLOYEE_CODES = [];

/**
 * Determine if Attendance functionality is enabled for the provided employee code or user context.
 * Returns true for all authenticated employees.
 * 
 * @param {string|object} userOrCode - Employee code string or authenticated user/employee profile object
 * @returns {boolean}
 */
export const isAttendanceEnabled = (userOrCode) => {
  return true;
};

