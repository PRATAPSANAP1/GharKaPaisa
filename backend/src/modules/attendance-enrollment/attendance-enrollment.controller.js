const service = require('./attendance-enrollment.service');
const { success, error, unauthorized, forbidden, notFound } = require('../../utils/response/response');
const logger = require('../../config/logger');

// POST /api/v1/attendance/enrollment/session
const createSession = async (req, res) => {
  try {
    const { employee_id, is_re_enrollment, reason } = req.body;
    const userRole = (req.user.role || '').toUpperCase();
    const isAdminRole = ['SUPER_ADMIN', 'ADMIN', 'HR'].includes(userRole);
    const resolvedAuthEmpId = await service.resolveEmployeeId(req.user);

    let targetEmployeeId;

    if (isAdminRole) {
      targetEmployeeId = employee_id || resolvedAuthEmpId;
    } else {
      // Non-administrative roles MUST use authenticated employee ID and cannot target others
      if (employee_id && resolvedAuthEmpId && String(employee_id).toLowerCase() !== String(resolvedAuthEmpId).toLowerCase()) {
        return error(res, 'Unauthorized to create biometric enrollment session for another employee', 403);
      }
      targetEmployeeId = resolvedAuthEmpId;
    }

    if (!targetEmployeeId) {
      return error(res, 'employee_id is required or user is not linked to an employee profile', 400);
    }

    const result = await service.createEnrollmentSession({
      userId: req.user.id,
      employeeId: targetEmployeeId,
      isReEnrollment: is_re_enrollment,
      reason,
      reqUser: req.user,
    });

    return success(res, result, 'Biometric enrollment session created');
  } catch (err) {
    logger.error('Error creating enrollment session:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// POST /api/v1/attendance/enrollment/commit
const commitFaceEnrollment = async (req, res) => {
  try {
    const sessionToken = req.body.session_token || req.headers['x-enrollment-session'];

    if (!sessionToken) {
      return error(res, 'session_token is required', 400);
    }

    if (!req.file || !req.file.buffer) {
      return error(res, 'Face image file is required (field name: face_image)', 400);
    }

    const result = await service.commitFaceEnrollment({
      sessionToken,
      imageBuffer: req.file.buffer,
      originalName: req.file.originalname || 'face.jpg',
      mimeType: req.file.mimetype || 'image/jpeg',
      reqUser: req.user,
    });

    return success(res, result.template, result.message);
  } catch (err) {
    logger.error('Error committing face enrollment:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// GET /api/v1/attendance/enrollment/status (Current authenticated user)
const getMyStatus = async (req, res) => {
  try {
    const result = await service.getMyBiometricStatus(req.user);
    return success(res, result, 'Biometric enrollment status retrieved');
  } catch (err) {
    logger.error('Error fetching own biometric status:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// GET /api/v1/attendance/enrollment/employee/:employeeId
const getEmployeeStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const result = await service.getEmployeeBiometricStatus(employeeId, req.user);
    return success(res, result, 'Employee biometric status retrieved');
  } catch (err) {
    logger.error('Error fetching employee biometric status:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// GET /api/v1/attendance/enrollment/missing (Super Admin only)
const getMissingList = async (req, res) => {
  try {
    const { search, status, page, limit } = req.query;
    const result = await service.getMissingBiometrics({
      search,
      status,
      page,
      limit,
    });
    return success(res, result, 'Missing face verification list retrieved');
  } catch (err) {
    logger.error('Error fetching missing face verification list:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// POST /api/v1/attendance/enrollment/reminder (Super Admin only)
const sendReminder = async (req, res) => {
  try {
    const { employee_id, message } = req.body;

    if (!employee_id) {
      return error(res, 'employee_id is required', 400);
    }

    const result = await service.sendFaceVerificationReminder({
      employeeId: employee_id,
      message,
      reqUser: req.user,
    });

    return success(res, result.reminder, result.message);
  } catch (err) {
    logger.error('Error sending face verification reminder:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// GET /api/v1/attendance/enrollment/reminders/:employeeId (Super Admin only)
const getReminderHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await service.getReminderHistory(employeeId);
    return success(res, result, 'Reminder history retrieved');
  } catch (err) {
    logger.error('Error fetching reminder history:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// POST /api/v1/attendance/enrollment/reminders/:id/seen
const markReminderSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await service.markReminderSeen(id, req.user);
    return success(res, result, 'Reminder marked as seen');
  } catch (err) {
    logger.error('Error marking reminder as seen:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// POST /api/v1/attendance/enrollment/re-enrollment/session
const createReEnrollmentSession = async (req, res) => {
  try {
    const { employee_id, reason } = req.body;

    if (!employee_id) {
      return error(res, 'employee_id is required for re-enrollment', 400);
    }

    if (!reason || reason.trim().length < 5) {
      return error(res, 'A valid reason (minimum 5 characters) is required for re-enrollment', 400);
    }

    const result = await service.createEnrollmentSession({
      userId: req.user.id,
      employeeId: employee_id,
      isReEnrollment: true,
      reason,
      reqUser: req.user,
    });

    return success(res, result, 'Super Admin biometric re-enrollment session initiated');
  } catch (err) {
    logger.error('Error initiating re-enrollment session:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// POST /api/v1/attendance/enrollment/re-enrollment/commit
const commitReEnrollment = async (req, res) => {
  try {
    const sessionToken = req.body.session_token || req.headers['x-enrollment-session'];

    if (!sessionToken) {
      return error(res, 'session_token is required', 400);
    }

    if (!req.file || !req.file.buffer) {
      return error(res, 'Face image file is required (field name: face_image)', 400);
    }

    const result = await service.commitFaceEnrollment({
      sessionToken,
      imageBuffer: req.file.buffer,
      originalName: req.file.originalname || 'face.jpg',
      mimeType: req.file.mimetype || 'image/jpeg',
      reqUser: req.user,
    });

    return success(res, result.template, result.message);
  } catch (err) {
    logger.error('Error committing re-enrollment face image:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// GET /api/v1/attendance/enrollment/preview/:employeeId
const getPreviewUrl = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await service.getSignedPreviewUrl(employeeId, req.user);
    return success(res, result, 'Signed preview URL generated');
  } catch (err) {
    logger.error('Error generating preview URL:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// GET /api/v1/attendance/enrollment/environment
const getEnvironmentReferences = async (req, res) => {
  try {
    const result = await service.getEnvironmentReferences();
    return success(res, result, 'Environment references retrieved');
  } catch (err) {
    logger.error('Error fetching environment references:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// POST /api/v1/attendance/enrollment/environment
const registerEnvironmentReference = async (req, res) => {
  try {
    const { reference_code, reference_name, capture_description } = req.body;

    if (!reference_code) {
      return error(res, 'reference_code is required (BKG1-BKG4)', 400);
    }

    if (!req.file || !req.file.buffer) {
      return error(res, 'Environment image file is required (field name: environment_image)', 400);
    }

    const result = await service.registerEnvironmentReference({
      referenceCode: reference_code,
      referenceName: reference_name || `Office Environment ${reference_code}`,
      captureDescription: capture_description || null,
      imageBuffer: req.file.buffer,
      originalName: req.file.originalname || 'env.jpg',
      mimeType: req.file.mimetype || 'image/jpeg',
      reqUser: req.user,
    });

    return success(res, result, 'Office environment reference registered successfully');
  } catch (err) {
    logger.error('Error registering environment reference:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// POST /api/v1/attendance/enrollment/environment/:referenceCode/revoke
const revokeEnvironmentReference = async (req, res) => {
  try {
    const { referenceCode } = req.params;
    const { reason } = req.body;

    const result = await service.revokeEnvironmentReference(referenceCode, reason, req.user);
    return success(res, result, 'Environment reference revoked successfully');
  } catch (err) {
    logger.error('Error revoking environment reference:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  createSession,
  commitFaceEnrollment,
  getMyStatus,
  getEmployeeStatus,
  getMissingList,
  sendReminder,
  getReminderHistory,
  markReminderSeen,
  createReEnrollmentSession,
  commitReEnrollment,
  getPreviewUrl,
  getEnvironmentReferences,
  registerEnvironmentReference,
  revokeEnvironmentReference,
};
