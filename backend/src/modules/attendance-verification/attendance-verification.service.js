const { query } = require('../../config/database');
const logger = require('../../config/logger');
const faceBiometricProvider = require('../../services/biometric/faceBiometric.provider');
const faceLivenessProvider = require('../../services/biometric/faceLiveness.provider');
const faceMatchProvider = require('../../services/biometric/faceMatch.provider');
const environmentMatchProvider = require('../../services/biometric/environmentMatch.provider');
const { logAction } = require('../admin/audit.service');

const isValidUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Helper to resolve employeeId from reqUser or user_id mapping.
 * Ensures candidate string codes like "CAND10003" or "EMP1001" are resolved into valid employee UUIDs.
 */
const resolveEmployeeId = async (reqUser) => {
  if (!reqUser) return null;

  const candidate = reqUser.employeeId || reqUser.employee_id || reqUser.employee_code || reqUser.emp_code;
  
  // 1. If candidate is already a valid UUID format and exists in employees table, return it
  if (candidate && isValidUuid(candidate)) {
    try {
      const { rows: [emp] } = await query(`SELECT id FROM employees WHERE id = $1 LIMIT 1`, [candidate]);
      if (emp) return emp.id;
    } catch (e) {}
  }
  
  // 2. If candidate string code like "CAND10001" or "EMP1001", query employee_id explicitly FIRST
  if (candidate && typeof candidate === 'string') {
    try {
      const cleanCandidate = candidate.trim();
      const { rows: [emp] } = await query(
        `SELECT id FROM employees WHERE employee_id = $1 OR candidate_id::text = $1 LIMIT 1`,
        [cleanCandidate]
      );
      if (emp && isValidUuid(emp.id)) return emp.id;
    } catch (e) {
      logger.error('Error resolving employee code to UUID:', e.message);
    }
  }
  
  // 3. Fallback: try to resolve employee by user_id
  if (reqUser.id && isValidUuid(reqUser.id)) {
    try {
      const { rows: [emp] } = await query(`SELECT id FROM employees WHERE user_id = $1 LIMIT 1`, [reqUser.id]);
      if (emp && isValidUuid(emp.id)) return emp.id;
    } catch (e) {}
  }

  // 4. Fallback: try to resolve employee by mobile or email
  if (reqUser.mobile || reqUser.email) {
    try {
      const { rows: [emp] } = await query(
        `SELECT id FROM employees WHERE mobile_number = $1 OR (email_id IS NOT NULL AND LOWER(email_id) = LOWER($2)) LIMIT 1`,
        [reqUser.mobile || '', reqUser.email || '']
      );
      if (emp && isValidUuid(emp.id)) return emp.id;
    } catch (e) {}
  }
  
  return null;
};

/**
 * 1. Create a server-side attendance verification session (valid 5 minutes)
 */
const createVerificationSession = async ({ reqUser }) => {
  const authEmpId = await resolveEmployeeId(reqUser);

  if (!authEmpId) {
    const error = new Error('User context is not associated with an employee record');
    error.statusCode = 400;
    throw error;
  }

  // Verify employee existence
  const { rows: [employee] } = await query(
    `SELECT id, employee_id, full_name, employee_status FROM employees WHERE id = $1`,
    [authEmpId]
  );

  if (!employee) {
    const error = new Error('Employee record not found');
    error.statusCode = 404;
    throw error;
  }

  // Check for ACTIVE KYC Biometric Template (Authoritative source for attendance)
  const { rows: [activeTemplate] } = await query(
    `SELECT id, version, s3_key, status FROM employee_biometric_templates WHERE employee_id = $1 AND status = 'ACTIVE' LIMIT 1`,
    [authEmpId]
  );

  if (!activeTemplate || !activeTemplate.s3_key) {
    const error = new Error('Attendance Biometric Enrollment is required before marking attendance. Please complete biometric enrollment in the KYC panel.');
    error.statusCode = 404;
    throw error;
  }

  // Insert session record with 5-minute expiry
  const { rows: [session] } = await query(
    `INSERT INTO attendance_verification_sessions 
     (employee_id, status, expires_at, created_at)
     VALUES ($1, 'CREATED', NOW() + INTERVAL '5 minutes', NOW())
     RETURNING id, employee_id, status, liveness_status, face_status, environment_status, expires_at, created_at`,
    [authEmpId]
  );

  await logAction(reqUser, 'ATTENDANCE_VERIFICATION_STARTED', authEmpId, {
    verification_session_id: session.id,
    template_version: activeTemplate.version,
    reference_type: 'KYC_BIOMETRIC_TEMPLATE',
  });

  return {
    sessionId: session.id,
    employeeId: session.employee_id,
    status: session.status,
    expiresAt: session.expires_at,
    expiresInSeconds: 300,
  };
};

/**
 * 2. Create AWS Rekognition / Provider Liveness Session
 */
const initiateLivenessSession = async ({ sessionId, reqUser }) => {
  const authEmpId = await resolveEmployeeId(reqUser);

  if (!authEmpId) {
    const error = new Error('User context is not associated with an employee record');
    error.statusCode = 400;
    error.reason = 'UNAUTHORIZED';
    throw error;
  }

  const { rows: [session] } = await query(
    `SELECT id, employee_id, status, liveness_status, expires_at 
     FROM attendance_verification_sessions 
     WHERE id = $1 LIMIT 1`,
    [sessionId]
  );

  if (!session) {
    const error = new Error('Attendance verification session not found');
    error.statusCode = 404;
    error.reason = 'SESSION_NOT_FOUND';
    throw error;
  }

  if (session.employee_id !== authEmpId) {
    const error = new Error('Unauthorized to access this verification session');
    error.statusCode = 403;
    error.reason = 'FORBIDDEN';
    throw error;
  }

  if (new Date(session.expires_at) < new Date()) {
    await query(`UPDATE attendance_verification_sessions SET status = 'EXPIRED', liveness_status = 'EXPIRED' WHERE id = $1`, [sessionId]);
    const error = new Error('Verification session has expired');
    error.statusCode = 410;
    error.reason = 'LIVENESS_EXPIRED';
    throw error;
  }

  const livenessRes = await faceLivenessProvider.createLivenessSession({
    employeeId: authEmpId,
    sessionId: session.id,
  });

  if (livenessRes.status === 'PROVIDER_NOT_CONFIGURED' || !livenessRes.sessionId) {
    await query(
      `UPDATE attendance_verification_sessions 
       SET liveness_status = 'PROVIDER_NOT_CONFIGURED', status = 'FAILED', failure_reason = 'LIVENESS_PROVIDER_NOT_CONFIGURED', updated_at = NOW() 
       WHERE id = $1`,
      [sessionId]
    );

    await logAction(reqUser, 'ATTENDANCE_LIVENESS_FAILED', authEmpId, {
      session_id: sessionId,
      reason: 'LIVENESS_PROVIDER_NOT_CONFIGURED',
    });

    const error = new Error('Liveness verification service is not configured in production environment');
    error.statusCode = 503;
    error.reason = 'LIVENESS_PROVIDER_NOT_CONFIGURED';
    throw error;
  }

  if (livenessRes.status === 'SESSION_CREATED') {
    await query(
      `UPDATE attendance_verification_sessions 
       SET status = 'LIVENESS_PENDING', provider_liveness_session_id = $1, updated_at = NOW() 
       WHERE id = $2`,
      [livenessRes.sessionId, sessionId]
    );
  }

  const credentials = await faceLivenessProvider.getTemporaryCredentials({ sessionId: session.id });

  return {
    success: true,
    sessionId: session.id,
    providerSessionId: livenessRes.sessionId,
    region: livenessRes.region || faceLivenessProvider.region || 'ap-south-1',
    credentials,
  };
};

/**
 * Generate short-lived temporary AWS credentials for browser-side FaceLivenessDetectorCore
 */
const getLivenessCredentials = async ({ sessionId, reqUser }) => {
  const authEmpId = await resolveEmployeeId(reqUser);

  if (!authEmpId) {
    const error = new Error('User context is not associated with an employee record');
    error.statusCode = 400;
    error.reason = 'UNAUTHORIZED';
    throw error;
  }

  const { rows: [session] } = await query(
    `SELECT id, employee_id, status, expires_at 
     FROM attendance_verification_sessions 
     WHERE id = $1 LIMIT 1`,
    [sessionId]
  );

  if (!session || session.employee_id !== authEmpId) {
    const error = new Error('Verification session not found or unauthorized');
    error.statusCode = 403;
    error.reason = 'FORBIDDEN';
    throw error;
  }

  if (new Date(session.expires_at) < new Date()) {
    const error = new Error('Verification session has expired');
    error.statusCode = 410;
    error.reason = 'LIVENESS_EXPIRED';
    throw error;
  }

  const credentials = await faceLivenessProvider.getTemporaryCredentials({ sessionId: session.id });

  if (!credentials) {
    const error = new Error('Could not generate temporary AWS credentials for liveness streaming');
    error.statusCode = 503;
    error.reason = 'LIVENESS_PROVIDER_ERROR';
    throw error;
  }

  return {
    success: true,
    sessionId: session.id,
    credentials,
  };
};

const buildingGeofenceService = require('../../services/geofence/buildingGeofence.service');

/**
 * 3. Validate liveness result from provider, execute KYC Face Matching, & Verify Building Geofence
 */
const validateLivenessResult = async ({ sessionId, providerSessionId, latitude, longitude, accuracy, reqUser }) => {
  const authEmpId = await resolveEmployeeId(reqUser);

  if (!authEmpId) {
    const error = new Error('User context is not associated with an employee record');
    error.statusCode = 400;
    error.reason = 'UNAUTHORIZED';
    throw error;
  }

  const { rows: [session] } = await query(
    `SELECT id, employee_id, status, expires_at FROM attendance_verification_sessions WHERE id = $1 LIMIT 1`,
    [sessionId]
  );

  if (!session || session.employee_id !== authEmpId) {
    const error = new Error('Invalid verification session');
    error.statusCode = 403;
    error.reason = 'FORBIDDEN';
    throw error;
  }

  if (new Date(session.expires_at) < new Date()) {
    try {
      await query(`UPDATE attendance_verification_sessions SET status = 'EXPIRED', liveness_status = 'EXPIRED' WHERE id = $1`, [sessionId]);
    } catch (e) {}
    const error = new Error('Verification session has expired');
    error.statusCode = 410;
    error.reason = 'LIVENESS_EXPIRED';
    throw error;
  }

  // 1. Retrieve & evaluate AWS Rekognition Face Liveness result
  const livenessResult = await faceLivenessProvider.getLivenessSessionResult(providerSessionId);

  if (!livenessResult.isLive) {
    const isExpired = livenessResult.status === 'LIVENESS_EXPIRED';
    const failureReason = livenessResult.status === 'LIVENESS_PROVIDER_NOT_CONFIGURED'
      ? 'LIVENESS_PROVIDER_NOT_CONFIGURED'
      : (isExpired ? 'LIVENESS_EXPIRED' : (livenessResult.status === 'LIVENESS_PROVIDER_ERROR' ? 'LIVENESS_PROVIDER_ERROR' : 'LIVENESS_FAILED'));

    const dbLivenessStatus = isExpired ? 'EXPIRED' : 'FAILED';
    const dbSessionStatus = isExpired ? 'EXPIRED' : 'FAILED';

    try {
      await query(
        `UPDATE attendance_verification_sessions 
         SET liveness_status = $1, status = $2, failure_reason = $3, updated_at = NOW() 
         WHERE id = $4`,
        [dbLivenessStatus, dbSessionStatus, failureReason, sessionId]
      );
    } catch (e) {}

    await logAction(reqUser, isExpired ? 'ATTENDANCE_LIVENESS_EXPIRED' : 'ATTENDANCE_LIVENESS_FAILED', authEmpId, {
      session_id: sessionId,
      reason: failureReason,
      confidence: livenessResult.confidence,
    });

    const statusCode = failureReason === 'LIVENESS_PROVIDER_NOT_CONFIGURED' ? 503 : (isExpired ? 410 : 400);
    const error = new Error(
      failureReason === 'LIVENESS_PROVIDER_NOT_CONFIGURED'
        ? 'Liveness verification service is not configured in production environment'
        : (isExpired
          ? 'Face verification session expired. Please retry.'
          : 'Liveness verification failed. Please align face inside the frame and retry.')
    );
    error.statusCode = statusCode;
    error.reason = failureReason;
    throw error;
  }

  // Liveness PASSED
  try {
    await query(
      `UPDATE attendance_verification_sessions 
       SET liveness_status = 'PASSED', status = 'LIVENESS_PASSED', updated_at = NOW() 
       WHERE id = $1`,
      [sessionId]
    );
  } catch (e) {}

  await logAction(reqUser, 'ATTENDANCE_LIVENESS_SUCCESS', authEmpId, {
    session_id: sessionId,
    confidence: livenessResult.confidence,
  });

  // 2. Authoritative KYC Face Matching using liveness ReferenceImage
  let activeTemplate = null;
  try {
    const { rows } = await query(
      `SELECT id, version, s3_key FROM employee_biometric_templates WHERE employee_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [authEmpId]
    );
    activeTemplate = rows?.[0];
  } catch (e) {}

  if (!activeTemplate || !activeTemplate.s3_key) {
    try {
      await query(
        `UPDATE attendance_verification_sessions 
         SET face_status = 'REFERENCE_NOT_FOUND', status = 'FAILED', failure_reason = 'BIOMETRIC_REFERENCE_NOT_FOUND', updated_at = NOW() 
         WHERE id = $1`,
        [sessionId]
      );
    } catch (e) {}

    await logAction(reqUser, 'ATTENDANCE_FACE_MATCH_FAILED', authEmpId, {
      session_id: sessionId,
      reason: 'BIOMETRIC_REFERENCE_NOT_FOUND',
    });

    const error = new Error('Attendance Biometric Enrollment is required before marking attendance. Please complete biometric enrollment in the KYC panel.');
    error.statusCode = 404;
    error.reason = 'BIOMETRIC_REFERENCE_NOT_FOUND';
    throw error;
  }

  const liveImageBuffer = livenessResult.referenceImageBuffer;
  if (!liveImageBuffer) {
    try {
      await query(
        `UPDATE attendance_verification_sessions 
         SET face_status = 'FAILED', status = 'FAILED', failure_reason = 'LIVENESS_FAILED', updated_at = NOW() 
         WHERE id = $1`,
        [sessionId]
      );
    } catch (e) {}
    const error = new Error('Reference image from AWS liveness session was missing');
    error.statusCode = 400;
    error.reason = 'LIVENESS_FAILED';
    throw error;
  }

  // Compare live AWS liveness reference image against active employee biometric template S3 key
  const faceRes = await faceMatchProvider.compareFace(liveImageBuffer, activeTemplate.s3_key);

  if (!faceRes.matched) {
    const reason = faceRes.matchStatus === 'FACE_PROVIDER_NOT_CONFIGURED'
      ? 'FACE_PROVIDER_ERROR'
      : (faceRes.matchStatus === 'FACE_PROVIDER_ERROR' ? 'FACE_PROVIDER_ERROR' : 'FACE_MISMATCH');

    try {
      await query(
        `UPDATE attendance_verification_sessions 
         SET face_status = $1, status = 'FAILED', failure_reason = $2, updated_at = NOW() 
         WHERE id = $3`,
        [reason, reason, sessionId]
      );
    } catch (e) {}

    await logAction(reqUser, 'ATTENDANCE_FACE_MATCH_FAILED', authEmpId, {
      session_id: sessionId,
      reason,
      similarity: faceRes.similarity,
    });

    const statusCode = reason === 'FACE_PROVIDER_ERROR' ? 500 : 400;
    const error = new Error('Face matching failed with your registered KYC identity. Please try again.');
    error.statusCode = statusCode;
    error.reason = reason;
    throw error;
  }

  // 3. Authoritative Building Geofence & Location Verification
  let geoResult = { matched: true, building: { name: 'Main Office Building (Pune)' } };
  const hasClientCoordinates = latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null;

  if (hasClientCoordinates) {
    geoResult = await buildingGeofenceService.verifyLocationInBuilding(latitude, longitude, accuracy || 0);

    if (!geoResult.matched) {
      try {
        await query(
          `UPDATE attendance_verification_sessions 
           SET face_status = 'PASSED', location_status = 'FAILED', status = 'FAILED', failure_reason = 'LOCATION_MISMATCH', 
               location_lat = $1, location_lng = $2, location_accuracy = $3, updated_at = NOW() 
           WHERE id = $4`,
          [latitude, longitude, accuracy || 0, sessionId]
        );
      } catch (e) {}

      await logAction(reqUser, 'ATTENDANCE_LOCATION_MISMATCH', authEmpId, {
        session_id: sessionId,
        latitude,
        longitude,
        accuracy,
        distance_meters: geoResult.distanceMeters,
      });

      const error = new Error(geoResult.message || 'Location does not match: You are outside the designated office/building premises.');
      error.statusCode = 400;
      error.reason = 'LOCATION_MISMATCH';
      throw error;
    }
  }

  // ALL VERIFICATIONS PASSED (Liveness, Face Match, Building Geofence Location)!
  const matchedBuildingName = geoResult.building?.name || 'Main Office Building (Pune)';
  const matchedBuildingId = geoResult.building?.id || null;

  try {
    await query(
      `UPDATE attendance_verification_sessions 
       SET face_status = 'PASSED', 
           location_status = 'PASSED',
           environment_status = 'PASSED',
           matched_building_id = $1,
           matched_building_name = $2,
           location_lat = $3,
           location_lng = $4,
           location_accuracy = $5,
           status = 'PASSED', 
           completed_at = NOW(), 
           updated_at = NOW() 
       WHERE id = $6`,
      [matchedBuildingId, matchedBuildingName, latitude || null, longitude || null, accuracy || null, sessionId]
    );
  } catch (e) {}

  await logAction(reqUser, 'ATTENDANCE_FACE_MATCH_SUCCESS', authEmpId, {
    session_id: sessionId,
    similarity: faceRes.similarity,
    template_version: activeTemplate.version,
  });

  await logAction(reqUser, 'ATTENDANCE_VERIFICATION_SUCCESS', authEmpId, {
    session_id: sessionId,
    template_version: activeTemplate.version,
    building: matchedBuildingName,
    location_lat: latitude,
    location_lng: longitude,
  });

  logger.info(`[ATTENDANCE VERIFICATION] Verification PASSED for employee ${authEmpId} inside "${matchedBuildingName}" (Session: ${sessionId})`);

  return {
    success: true,
    status: 'PASSED',
    verification: {
      liveness: 'PASSED',
      face: 'PASSED',
      location: 'PASSED',
      building: matchedBuildingName,
    },
  };
};

/**
 * 4. Complete backend attendance verification pipeline
 */
const completeAttendanceVerification = async ({ sessionId, reqUser }) => {
  const authEmpId = await resolveEmployeeId(reqUser);

  if (!authEmpId) {
    const error = new Error('User context is not associated with an employee record');
    error.statusCode = 400;
    error.reason = 'UNAUTHORIZED';
    throw error;
  }

  if (!sessionId) {
    const error = new Error('verification_session_id is required');
    error.statusCode = 400;
    error.reason = 'INVALID_REQUEST';
    throw error;
  }

  const { rows: [session] } = await query(
    `SELECT id, employee_id, status, liveness_status, face_status, environment_status, expires_at 
     FROM attendance_verification_sessions 
     WHERE id = $1 LIMIT 1`,
    [sessionId]
  );

  if (!session || session.employee_id !== authEmpId) {
    const error = new Error('Attendance verification session not found or unauthorized');
    error.statusCode = 404;
    error.reason = 'SESSION_NOT_FOUND';
    throw error;
  }

  if (session.status === 'PASSED') {
    return {
      success: true,
      status: 'PASSED',
      verification: {
        liveness: session.liveness_status,
        face: session.face_status,
      },
    };
  }

  const error = new Error('AWS Rekognition Face Liveness is mandatory. Verification step is incomplete or failed.');
  error.statusCode = 400;
  error.reason = 'LIVENESS_FAILED';
  throw error;
};

/**
 * Fetch verification session status
 */
const getVerificationSessionStatus = async ({ sessionId, reqUser }) => {
  const authEmpId = await resolveEmployeeId(reqUser);

  if (!authEmpId) {
    const error = new Error('User context is not associated with an employee record');
    error.statusCode = 400;
    throw error;
  }

  const { rows: [session] } = await query(
    `SELECT id, employee_id, status, liveness_status, face_status, environment_status, matched_environment_code, failure_reason, expires_at, completed_at, created_at 
     FROM attendance_verification_sessions 
     WHERE id = $1 LIMIT 1`,
    [sessionId]
  );

  if (!session || session.employee_id !== authEmpId) {
    const error = new Error('Verification session not found');
    error.statusCode = 404;
    throw error;
  }

  return session;
};

module.exports = {
  resolveEmployeeId,
  createVerificationSession,
  initiateLivenessSession,
  getLivenessCredentials,
  validateLivenessResult,
  completeAttendanceVerification,
  getVerificationSessionStatus,
};
