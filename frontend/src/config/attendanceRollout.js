/**
 * Employee Attendance Feature Rollout Gate Configuration
 * Restricts the Phase 6-4 Employee Website Attendance functionality
 * to authorized employee codes during controlled testing/rollout.
 */

export const ATTENDANCE_ENABLED_EMPLOYEE_CODES = [
  'CAND10001'
];

/**
 * Determine if Attendance functionality is enabled for the provided employee code or user context.
 * Returns true ONLY if the employee code matches CAND10001 (or any code in ATTENDANCE_ENABLED_EMPLOYEE_CODES).
 * Returns false if missing, null, undefined, empty, or unapproved.
 * 
 * @param {string|object} userOrCode - Employee code string or authenticated user/employee profile object
 * @returns {boolean}
 */
export const isAttendanceEnabled = (userOrCode) => {
  if (!userOrCode) return false;

  let code = '';

  if (typeof userOrCode === 'string') {
    code = userOrCode;
  } else if (typeof userOrCode === 'object') {
    code = userOrCode.employee_id || 
           userOrCode.emp_code || 
           userOrCode.employee_code || 
           userOrCode.candidate_code || 
           userOrCode.code || 
           '';
  }

  const cleanCode = String(code).trim().toUpperCase();

  if (!cleanCode) return false;

  return ATTENDANCE_ENABLED_EMPLOYEE_CODES.map((c) => c.toUpperCase()).includes(cleanCode);
};
