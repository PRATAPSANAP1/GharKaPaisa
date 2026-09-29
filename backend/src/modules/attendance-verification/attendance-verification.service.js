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

  const candidate = reqUser.employeeId || reqUser.employee_id || reqUser.employee_code;
  
  // 1. If candidate is already a valid UUID format, return it
  if (candidate && isValidUuid(candidate)) {
    return candidate;
  }
  
  // 2. If candidate is a string code like "CAND10003", query employees table for its UUID
  if (candidate) {
    try {
      const { rows: [emp] } = await query(
        `SELECT id FROM employees WHERE employee_id = $1 OR employee_code = $1 OR candidate_id = $1 OR user_id = $2 LIMIT 1`,
        [candidate, reqUser.id]
      );
      if (emp && isValidUuid(emp.id)) return emp.id;
    } catch (e) {
      logger.error('Error resolving employee code to UUID:', e.message);
    }
  }
  
  // 3. Fallback: try to resolve employee by user_id
  if (reqUser.id) {
    try {
      const { rows: [emp] } = await query(`SELECT id FROM employees WHERE user_id = $1 LIMIT 1`, [reqUser.id]);
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

  // Check for KYC photo (compulsory for attendance)
  const { rows: [kycPhoto] } = await query(
    `SELECT document_key FROM employee_documents WHERE employee_id = $1 AND document_type = 'photo' LIMIT 1`,
    [authEmpId]
  );

  if (!kycPhoto || !kycPhoto.document_key) {
    const error = new Error('KYC photograph is compulsory for attendance. Please upload your photo in the employee panel.');
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
    reference_type: 'KYC_PHOTO',
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
    throw error;
  }

  if (session.employee_id !== authEmpId) {
    const error = new Error('Unauthorized to access this verification session');
    error.statusCode = 403;
    throw error;
  }

  if (new Date(session.expires_at) < new Date()) {
    await query(`UPDATE attendance_verification_sessions SET status = 'EXPIRED', liveness_status = 'EXPIRED' WHERE id = $1`, [sessionId]);
    const error = new Error('Verification session has expired');
    error.statusCode = 410;
    throw error;
  }

  const livenessRes = await faceLivenessProvider.createLivenessSession({
    employeeId: authEmpId,
    sessionId: session.id,
  });

  if (livenessRes.status === 'PROVIDER_NOT_CONFIGURED') {
    await query(
      `UPDATE attendance_verification_sessions 
       SET status = 'FAILED', liveness_status = 'PROVIDER_NOT_CONFIGURED', failure_reason = 'LIVENESS_PROVIDER_NOT_CONFIGURED', updated_at = NOW() 
       WHERE id = $1`,
      [sessionId]
    );

    await logAction(reqUser, 'ATTENDANCE_LIVENESS_FAILED', authEmpId, {
      session_id: sessionId,
      reason: 'LIVENESS_PROVIDER_NOT_CONFIGURED',
    });

    return {
      success: false,
      status: 'PROVIDER_NOT_CONFIGURED',
      sessionId: session.id,
      message: 'Liveness provider is not configured in production environment',
    };
  }

  if (livenessRes.status === 'SESSION_CREATED') {
    await query(
      `UPDATE attendance_verification_sessions 
       SET status = 'LIVENESS_PENDING', provider_liveness_session_id = $1, updated_at = NOW() 
       WHERE id = $2`,
      [livenessRes.sessionId, sessionId]
    );
  }

  return livenessRes;
};

/**
 * 3. Validate liveness result from provider
 */
const validateLivenessResult = async ({ sessionId, providerSessionId, reqUser }) => {
  const authEmpId = await resolveEmployeeId(reqUser);

  if (!authEmpId) {
    const error = new Error('User context is not associated with an employee record');
    error.statusCode = 400;
    throw error;
  }

  const { rows: [session] } = await query(
    `SELECT id, employee_id, status, expires_at FROM attendance_verification_sessions WHERE id = $1 LIMIT 1`,
    [sessionId]
  );

  if (!session || session.employee_id !== authEmpId) {
    const error = new Error('Invalid verification session');
    error.statusCode = 403;
    throw error;
  }

  const livenessResult = await faceLivenessProvider.getLivenessSessionResult(providerSessionId);

  if (livenessResult.isLive) {
    await query(
      `UPDATE attendance_verification_sessions 
       SET liveness_status = 'PASSED', status = 'LIVENESS_PASSED', updated_at = NOW() 
       WHERE id = $1`,
      [sessionId]
    );

    await logAction(reqUser, 'ATTENDANCE_LIVENESS_SUCCESS', authEmpId, {
      session_id: sessionId,
      confidence: livenessResult.confidence,
    });
  } else {
    const failureReason = livenessResult.status || 'LIVENESS_FAILED';
    await query(
      `UPDATE attendance_verification_sessions 
       SET liveness_status = 'FAILED', status = 'FAILED', failure_reason = $1, updated_at = NOW() 
       WHERE id = $2`,
      [failureReason, sessionId]
    );

    await logAction(reqUser, 'ATTENDANCE_LIVENESS_FAILED', authEmpId, {
      session_id: sessionId,
      reason: failureReason,
    });
  }

  return livenessResult;
};

/**
 * 4. Complete backend attendance verification pipeline (Liveness -> Face -> Environment -> Policy)
 */
const completeAttendanceVerification = async ({ sessionId, faceImageBuffer, mimeType, reqUser }) => {
  const authEmpId = await resolveEmployeeId(reqUser);

  if (!authEmpId) {
    const error = new Error('User context is not associated with an employee record');
    error.statusCode = 400;
    throw error;
  }

  if (!sessionId) {
    const error = new Error('verification_session_id is required');
    error.statusCode = 400;
    throw error;
  }

  // Fetch session
  const { rows: [session] } = await query(
    `SELECT id, employee_id, status, liveness_status, face_status, environment_status, expires_at 
     FROM attendance_verification_sessions 
     WHERE id = $1 LIMIT 1`,
    [sessionId]
  );

  if (!session) {
    const error = new Error('Attendance verification session not found');
    error.statusCode = 404;
    throw error;
  }

  if (session.employee_id !== authEmpId) {
    const error = new Error('Unauthorized session context');
    error.statusCode = 403;
    throw error;
  }

  if (['PASSED', 'FAILED', 'EXPIRED'].includes(session.status)) {
    const error = new Error(`Verification session already completed or expired (${session.status})`);
    error.statusCode = 409;
    throw error;
  }

  if (new Date(session.expires_at) < new Date()) {
    await query(`UPDATE attendance_verification_sessions SET status = 'EXPIRED' WHERE id = $1`, [sessionId]);
    const error = new Error('Verification session expired');
    error.statusCode = 410;
    throw error;
  }

  // ── STEP A: LIVENESS VERIFICATION ──────────────────────────────
  if (session.liveness_status !== 'PASSED') {
    const reason = session.liveness_status === 'PROVIDER_NOT_CONFIGURED' 
      ? 'LIVENESS_PROVIDER_NOT_CONFIGURED' 
      : 'LIVENESS_FAILED';

    await query(
      `UPDATE attendance_verification_sessions 
       SET status = 'FAILED', failure_reason = $1, updated_at = NOW() 
       WHERE id = $2`,
      [reason, sessionId]
    );

    await logAction(reqUser, 'ATTENDANCE_VERIFICATION_FAILED', authEmpId, {
      session_id: sessionId,
      reason,
    });

    return {
      success: false,
      reason,
    };
  }

  // ── STEP B: FACE MATCH VERIFICATION ────────────────────────────
  // First, try to get KYC photo from employee_documents (compulsory for attendance)
  const { rows: [kycPhoto] } = await query(
    `SELECT document_key FROM employee_documents WHERE employee_id = $1 AND document_type = 'photo' LIMIT 1`,
    [authEmpId]
  );

  if (!kycPhoto || !kycPhoto.document_key) {
    await query(
      `UPDATE attendance_verification_sessions 
       SET face_status = 'REFERENCE_NOT_FOUND', status = 'FAILED', failure_reason = 'KYC_PHOTO_NOT_FOUND', updated_at = NOW() 
       WHERE id = $1`,
      [sessionId]
    );

    await logAction(reqUser, 'ATTENDANCE_FACE_MATCH_FAILED', authEmpId, {
      session_id: sessionId,
      reason: 'KYC_PHOTO_NOT_FOUND',
    });

    await logAction(reqUser, 'ATTENDANCE_VERIFICATION_FAILED', authEmpId, {
      session_id: sessionId,
      reason: 'KYC_PHOTO_NOT_FOUND',
    });

    return {
      success: false,
      reason: 'KYC_PHOTO_NOT_FOUND',
      message: 'KYC photograph is compulsory for attendance. Please upload your photo in the employee panel.',
    };
  }

  // Validate face quality
  faceBiometricProvider.validateFaceQuality(faceImageBuffer, mimeType);

  // Use KYC photo as reference for face matching
  const faceRes = await faceMatchProvider.compareFace(faceImageBuffer, kycPhoto.document_key);

  if (!faceRes.matched) {
    const reason = faceRes.matchStatus || 'FACE_MISMATCH';

    await query(
      `UPDATE attendance_verification_sessions 
       SET face_status = $1, status = 'FAILED', failure_reason = $2, updated_at = NOW() 
       WHERE id = $3`,
      [reason, reason, sessionId]
    );

    await logAction(reqUser, 'ATTENDANCE_FACE_MATCH_FAILED', authEmpId, {
      session_id: sessionId,
      reason,
    });

    await logAction(reqUser, 'ATTENDANCE_VERIFICATION_FAILED', authEmpId, {
      session_id: sessionId,
      reason,
    });

    return {
      success: false,
      reason,
    };
  }

  await query(
    `UPDATE attendance_verification_sessions 
     SET face_status = 'PASSED', status = 'FACE_PASSED', updated_at = NOW() 
     WHERE id = $1`,
    [sessionId]
  );

  await logAction(reqUser, 'ATTENDANCE_FACE_MATCH_SUCCESS', authEmpId, {
    session_id: sessionId,
    similarity: faceRes.similarity,
  });

  // ── STEP C: OFFICE ENVIRONMENT VERIFICATION ─────────────────────
  const { rows: activeEnvRefs } = await query(
    `SELECT reference_code, s3_key FROM attendance_environment_references WHERE environment_status = 'ACTIVE'`
  );

  if (!activeEnvRefs || activeEnvRefs.length === 0) {
    await query(
      `UPDATE attendance_verification_sessions 
       SET environment_status = 'NO_ACTIVE_REFERENCES', status = 'FAILED', failure_reason = 'NO_ACTIVE_ENVIRONMENT_REFERENCES', updated_at = NOW() 
       WHERE id = $1`,
      [sessionId]
    );

    await logAction(reqUser, 'ATTENDANCE_ENVIRONMENT_MATCH_FAILED', authEmpId, {
      session_id: sessionId,
      reason: 'NO_ACTIVE_ENVIRONMENT_REFERENCES',
    });

    await logAction(reqUser, 'ATTENDANCE_VERIFICATION_FAILED', authEmpId, {
      session_id: sessionId,
      reason: 'NO_ACTIVE_ENVIRONMENT_REFERENCES',
    });

    return {
      success: false,
      reason: 'NO_ACTIVE_ENVIRONMENT_REFERENCES',
    };
  }

  const envRes = await environmentMatchProvider.compareScene(faceImageBuffer, activeEnvRefs);

  if (!envRes.matched) {
    const reason = envRes.matchStatus || 'ENVIRONMENT_MISMATCH';

    await query(
      `UPDATE attendance_verification_sessions 
       SET environment_status = $1, status = 'FAILED', failure_reason = $2, updated_at = NOW() 
       WHERE id = $3`,
      [reason, reason, sessionId]
    );

    await logAction(reqUser, 'ATTENDANCE_ENVIRONMENT_MATCH_FAILED', authEmpId, {
      session_id: sessionId,
      reason,
    });

    await logAction(reqUser, 'ATTENDANCE_VERIFICATION_FAILED', authEmpId, {
      session_id: sessionId,
      reason,
    });

    return {
      success: false,
      reason,
    };
  }

  // ── STEP D: FINAL DECISION POLICY (ALL THREE MUST BE PASSED) ──────
  await query(
    `UPDATE attendance_verification_sessions 
     SET environment_status = 'PASSED', matched_environment_code = $1, status = 'PASSED', completed_at = NOW(), updated_at = NOW() 
     WHERE id = $2`,
    [envRes.matchedCode, sessionId]
  );

  await logAction(reqUser, 'ATTENDANCE_ENVIRONMENT_MATCH_SUCCESS', authEmpId, {
    session_id: sessionId,
    matched_code: envRes.matchedCode,
  });

  await logAction(reqUser, 'ATTENDANCE_VERIFICATION_SUCCESS', authEmpId, {
    session_id: sessionId,
    matched_environment: envRes.matchedCode,
  });

  logger.info(`[ATTENDANCE VERIFICATION] Verification PASSED for employee ${authEmpId} (Session: ${sessionId})`);

  return {
    success: true,
    verification: {
      liveness: 'PASSED',
      face: 'PASSED',
      environment: 'PASSED',
    },
    reference: {
      environment: envRes.matchedCode,
    },
  };
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
  validateLivenessResult,
  completeAttendanceVerification,
  getVerificationSessionStatus,
};
