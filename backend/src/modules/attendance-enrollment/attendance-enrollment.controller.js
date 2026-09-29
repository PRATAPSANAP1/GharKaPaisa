const service = require('./attendance-enrollment.service');
const { success, error, unauthorized, forbidden, notFound } = require('../../utils/response/response');
const logger = require('../../config/logger');

// POST /api/v1/attendance/enrollment/session
const createSession = async (req, res) => {
  try {
    const { employee_id, is_re_enrollment, reason } = req.body;
    const targetEmployeeId = employee_id || req.user.employeeId || req.user.employee_id;

    if (!targetEmployeeId) {
      return error(res, 'employee_id is required', 400);
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

    return success(res, result, 'Re-enrollment session created successfully');
  } catch (err) {
    logger.error('Error creating re-enrollment session:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// POST /api/v1/attendance/enrollment/re-enrollment/commit
const commitReEnrollment = async (req, res) => {
  try {
    return await commitFaceEnrollment(req, res);
  } catch (err) {
    logger.error('Error committing re-enrollment:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// GET /api/v1/attendance/enrollment/preview/:employeeId
const getPreviewUrl = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await service.getSignedPreviewUrl(employeeId, req.user);
    return success(res, result, 'Temporary signed preview URL generated');
  } catch (err) {
    logger.error('Error generating signed preview URL:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// GET /api/v1/attendance/enrollment/environment
const getEnvironmentReferences = async (req, res) => {
  try {
    const result = await service.getEnvironmentReferences(req.user);
    return success(res, result, 'Office environment references loaded');
  } catch (err) {
    logger.error('Error loading environment references:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// POST /api/v1/attendance/enrollment/environment
const registerEnvironmentReference = async (req, res) => {
  try {
    const { reference_code, reference_name, capture_description } = req.body;

    if (!reference_code || !reference_name) {
      return error(res, 'reference_code and reference_name are required', 400);
    }

    if (!req.file || !req.file.buffer) {
      return error(res, 'Environment image file is required (field name: environment_image)', 400);
    }

    const result = await service.registerEnvironmentReference({
      referenceCode: reference_code,
      referenceName: reference_name,
      captureDescription: capture_description,
      imageBuffer: req.file.buffer,
      originalName: req.file.originalname || `${reference_code}.png`,
      mimeType: req.file.mimetype || 'image/png',
      reqUser: req.user,
    });

    return success(res, result, 'Environment reference registered successfully');
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
    return success(res, result, `Environment reference ${referenceCode} revoked successfully`);
  } catch (err) {
    logger.error('Error revoking environment reference:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  createSession,
  commitFaceEnrollment,
  getEmployeeStatus,
  createReEnrollmentSession,
  commitReEnrollment,
  getPreviewUrl,
  getEnvironmentReferences,
  registerEnvironmentReference,
  revokeEnvironmentReference,
};
