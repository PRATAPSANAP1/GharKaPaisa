const service = require('./attendance-verification.service');
const { success, error, unauthorized, forbidden, notFound } = require('../../utils/response/response');
const logger = require('../../config/logger');

// POST /api/v1/attendance/verification/session
const createSession = async (req, res) => {
  try {
    const result = await service.createVerificationSession({ reqUser: req.user });
    return success(res, result, 'Attendance verification session created');
  } catch (err) {
    logger.error('Error creating verification session:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// POST /api/v1/attendance/verification/liveness/session
const createLivenessSession = async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      return error(res, 'session_id is required', 400);
    }

    const result = await service.initiateLivenessSession({ sessionId: session_id, reqUser: req.user });
    return success(res, result, 'Liveness session initiated');
  } catch (err) {
    logger.error('Error initiating liveness session:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// POST /api/v1/attendance/verification/liveness/result
const validateLivenessResult = async (req, res) => {
  try {
    const { session_id, provider_session_id } = req.body;
    if (!session_id || !provider_session_id) {
      return error(res, 'session_id and provider_session_id are required', 400);
    }

    const result = await service.validateLivenessResult({
      sessionId: session_id,
      providerSessionId: provider_session_id,
      reqUser: req.user,
    });

    return success(res, result, 'Liveness result validated');
  } catch (err) {
    logger.error('Error validating liveness result:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// POST /api/v1/attendance/verification/complete
const completeVerification = async (req, res) => {
  try {
    const sessionId = req.body.session_id || req.headers['x-verification-session'];
    if (!sessionId) {
      return error(res, 'session_id is required', 400);
    }

    if (!req.file || !req.file.buffer) {
      return error(res, 'Live face image file is required (field name: face_image)', 400);
    }

    const result = await service.completeAttendanceVerification({
      sessionId,
      faceImageBuffer: req.file.buffer,
      originalName: req.file.originalname || 'live_capture.jpg',
      mimeType: req.file.mimetype || 'image/jpeg',
      reqUser: req.user,
    });

    return success(res, result, result.success ? 'Attendance verification passed' : 'Attendance verification failed');
  } catch (err) {
    logger.error('Error completing verification:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

// GET /api/v1/attendance/verification/session/:sessionId
const getSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await service.getVerificationSessionStatus({ sessionId, reqUser: req.user });
    return success(res, result, 'Verification session status loaded');
  } catch (err) {
    logger.error('Error loading session status:', err.message);
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  createSession,
  createLivenessSession,
  validateLivenessResult,
  completeVerification,
  getSessionStatus,
};
