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
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      reason: err.reason || 'SESSION_CREATION_FAILED',
      message: err.message,
    });
  }
};

// POST /api/v1/attendance/verification/liveness/session
const createLivenessSession = async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ success: false, reason: 'INVALID_REQUEST', message: 'session_id is required' });
    }

    const result = await service.initiateLivenessSession({ sessionId: session_id, reqUser: req.user });
    return success(res, result, 'Liveness session initiated');
  } catch (err) {
    logger.error('Error initiating liveness session:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      reason: err.reason || 'LIVENESS_PROVIDER_ERROR',
      message: err.message,
    });
  }
// POST /api/v1/attendance/verification/liveness/result
const validateLivenessResult = async (req, res) => {
  const { session_id, provider_session_id, latitude, longitude, accuracy, lat, lng } = req.body;
  const clientLat = latitude !== undefined ? latitude : lat;
  const clientLng = longitude !== undefined ? longitude : lng;
  const empId = req.user?.employeeId || req.user?.employee_id || req.user?.id || null;

  try {
    if (!session_id || !provider_session_id) {
      logger.warn('[ATTENDANCE DIAGNOSTIC REJECTION]', {
        endpoint: '/api/v1/attendance/verification/liveness/result',
        sessionId: session_id || null,
        employeeId: empId,
        latitude: clientLat ?? null,
        longitude: clientLng ?? null,
        accuracy: accuracy ?? null,
        livenessStatus: 'NOT_STARTED',
        faceStatus: 'NOT_STARTED',
        environmentStatus: 'NOT_STARTED',
        reason: 'INVALID_REQUEST',
        message: 'session_id and provider_session_id are required'
      });
      return res.status(400).json({ success: false, reason: 'INVALID_REQUEST', message: 'session_id and provider_session_id are required' });
    }

    const result = await service.validateLivenessResult({
      sessionId: session_id,
      providerSessionId: provider_session_id,
      latitude: clientLat,
      longitude: clientLng,
      accuracy: accuracy !== undefined ? accuracy : 0,
      reqUser: req.user,
    });

    return success(res, result, 'Attendance verification passed');
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const reason = err.reason || 'VERIFICATION_FAILED';
    const message = err.message || 'Verification process failed';

    const diagnostic = err.diagnostic || {
      endpoint: '/api/v1/attendance/verification/liveness/result',
      sessionId: session_id || null,
      employeeId: empId,
      latitude: clientLat ?? null,
      longitude: clientLng ?? null,
      accuracy: accuracy ?? null,
      livenessStatus: 'UNKNOWN',
      faceStatus: 'UNKNOWN',
      environmentStatus: 'UNKNOWN',
      reason,
      message,
    };

    logger.warn('[ATTENDANCE DIAGNOSTIC REJECTION]', diagnostic);

    return res.status(statusCode).json({
      success: false,
      reason,
      message,
    });
  }
};

// POST /api/v1/attendance/verification/complete
const completeVerification = async (req, res) => {
  try {
    const sessionId = req.body.session_id || req.headers['x-verification-session'];
    if (!sessionId) {
      return res.status(400).json({ success: false, reason: 'INVALID_REQUEST', message: 'session_id is required' });
    }

    const result = await service.completeAttendanceVerification({
      sessionId,
      reqUser: req.user,
    });

    return success(res, result, 'Attendance verification passed');
  } catch (err) {
    logger.error('Error completing verification:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      reason: err.reason || 'VERIFICATION_FAILED',
      message: err.message || 'Verification process failed',
    });
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
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      reason: err.reason || 'SESSION_NOT_FOUND',
      message: err.message,
    });
  }
};

// POST /api/v1/attendance/verification/liveness/credentials
const getLivenessCredentials = async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ success: false, reason: 'INVALID_REQUEST', message: 'session_id is required' });
    }

    const result = await service.getLivenessCredentials({ sessionId: session_id, reqUser: req.user });
    return success(res, result, 'Temporary AWS liveness credentials issued');
  } catch (err) {
    logger.error('Error issuing liveness credentials:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      reason: err.reason || 'LIVENESS_PROVIDER_ERROR',
      message: err.message,
    });
  }
};

module.exports = {
  createSession,
  createLivenessSession,
  getLivenessCredentials,
  validateLivenessResult,
  completeVerification,
  getSessionStatus,
};
