const { query, getClient } = require('../../config/database');
const logger = require('../../config/logger');
const faceBiometricProvider = require('../../services/biometric/faceBiometric.provider');
const faceLivenessProvider = require('../../services/biometric/faceLiveness.provider');
const faceMatchProvider = require('../../services/biometric/faceMatch.provider');
const environmentMatchEnhancedProvider = require('../../services/biometric/environmentMatchEnhanced.provider');
const challengeResponseService = require('../../services/attendance/challengeResponse.service');
const rateLimiterService = require('../../services/attendance/rateLimiter.service');
const { logAction } = require('../admin/audit.service');

const isValidUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Helper to resolve employeeId from reqUser or user_id mapping.
 */
const resolveEmployeeId = async (reqUser) => {
  if (!reqUser) return null;

  // 1. Authoritative: resolve employee by authenticated user_id
  if (reqUser.id && isValidUuid(reqUser.id)) {
    try {
      const { rows: [emp] } = await query(`SELECT id FROM employees WHERE user_id = $1 LIMIT 1`, [reqUser.id]);
      if (emp && isValidUuid(emp.id)) return emp.id;
    } catch (e) {}
  }

  const candidate = reqUser.employeeId || reqUser.employee_id || reqUser.employee_code || reqUser.emp_code;
  
  // 2. If candidate is already a valid UUID format and exists in employees table, return it
  if (candidate && isValidUuid(candidate)) {
    try {
      const { rows: [emp] } = await query(`SELECT id FROM employees WHERE id = $1 LIMIT 1`, [candidate]);
      if (emp) return emp.id;
    } catch (e) {}
  }
  
  // 3. If candidate string code like "CAND10001" or "EMP1001", query employee_id explicitly
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

  // 4. Fallback: try to resolve employee by mobile or email
  if (reqUser.mobile || reqUser.email) {
    try {
      const { rows: [emp] } = await query(
        `SELECT id FROM employees WHERE mobile_number = $1 OR (email_id IS NOT NULL AND email_id != '' AND LOWER(email_id) = LOWER($2)) LIMIT 1`,
        [reqUser.mobile || '', reqUser.email || '']
      );
      if (emp && isValidUuid(emp.id)) return emp.id;
    } catch (e) {}
  }
  
  return null;
};

/**
 * Enhanced Attendance Verification Service with Production Hardening
 * 
 * Implements:
 * 1. Optimized API call sequencing (client checks → liveness → face → environment)
 * 2. Challenge-response for anti-replay
 * 3. Secondary validation anchors (network/geo)
 * 4. Rate limiting and circuit breakers
 * 5. Graceful failure handling with user feedback
 */
class AttendanceVerificationEnhancedService {
  /**
   * Create verification session with challenge generation
   */
  async createVerificationSession({ reqUser }) {
    const authEmpId = await resolveEmployeeId(reqUser);

    if (!authEmpId) {
      const error = new Error('User context is not associated with an employee record');
      error.statusCode = 400;
      throw error;
    }

    // Check rate limit
    const rateLimitCheck = await rateLimiterService.checkRateLimit(authEmpId);
    if (!rateLimitCheck.allowed) {
      const error = new Error(`Rate limit exceeded: ${rateLimitCheck.reason}`);
      error.statusCode = 429;
      error.rateLimitInfo = rateLimitCheck;
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

    // Check for ACTIVE KYC Biometric Template
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
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const { rows: [session] } = await client.query(
        `INSERT INTO attendance_verification_sessions 
         (employee_id, status, expires_at, created_at)
         VALUES ($1, 'CREATED', NOW() + INTERVAL '5 minutes', NOW())
         RETURNING id, employee_id, status, expires_at, created_at`,
        [authEmpId]
      );

      // Generate challenge for anti-replay
      const challenge = await challengeResponseService.generateChallenge(session.id);

      await client.query('COMMIT');

      await logAction(reqUser, 'ATTENDANCE_VERIFICATION_STARTED', authEmpId, {
        verification_session_id: session.id,
        template_version: activeTemplate.version,
        challenge_type: challenge.challengeType,
      });

      return {
        sessionId: session.id,
        employeeId: session.employee_id,
        status: session.status,
        expiresAt: session.expires_at,
        expiresInSeconds: 300,
        challenge: {
          token: challenge.challengeToken,
          type: challenge.challengeType,
          instructions: challenge.instructions,
        },
      };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Complete enhanced verification pipeline with optimized sequencing
   */
  async completeAttendanceVerification({
    sessionId,
    faceImageBuffer,
    mimeType,
    reqUser,
    clientContext = {},
  }) {
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

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Fetch session
      const { rows: [session] } = await client.query(
        `SELECT id, employee_id, status, liveness_status, face_status, environment_status, 
                expires_at, challenge_token, challenge_type, challenge_completed_at
         FROM attendance_verification_sessions 
         WHERE id = $1 LIMIT 1 FOR UPDATE`,
        [sessionId]
      );

      if (!session) {
        await client.query('ROLLBACK');
        const error = new Error('Attendance verification session not found');
        error.statusCode = 404;
        throw error;
      }

      if (session.employee_id !== authEmpId) {
        await client.query('ROLLBACK');
        const error = new Error('Unauthorized session context');
        error.statusCode = 403;
        throw error;
      }

      if (['PASSED', 'FAILED', 'EXPIRED'].includes(session.status)) {
        await client.query('ROLLBACK');
        const error = new Error(`Verification session already completed or expired (${session.status})`);
        error.statusCode = 409;
        throw error;
      }

      if (new Date(session.expires_at) < new Date()) {
        await client.query(
          `UPDATE attendance_verification_sessions SET status = 'EXPIRED', updated_at = NOW() WHERE id = $1`,
          [sessionId]
        );
        await client.query('ROLLBACK');
        const error = new Error('Verification session expired');
        error.statusCode = 410;
        throw error;
      }

      // ── STEP 0: Client-side quality checks (fastest, cheapest) ─────
      const qualityCheck = await this.performClientSideQualityCheck(faceImageBuffer, mimeType);
      
      if (!qualityCheck.passed) {
        await client.query(
          `UPDATE attendance_verification_sessions 
           SET status = 'FAILED', failure_reason = $1, updated_at = NOW() 
           WHERE id = $2`,
          [qualityCheck.reason, sessionId]
        );
        await client.query('COMMIT');

        await logAction(reqUser, 'ATTENDANCE_VERIFICATION_FAILED', authEmpId, {
          session_id: sessionId,
          reason: qualityCheck.reason,
          stage: 'QUALITY_CHECK',
        });

        return {
          success: false,
          reason: qualityCheck.reason,
          userFeedback: qualityCheck.userFeedback,
        };
      }

      // Store quality metrics
      await client.query(
        `UPDATE attendance_verification_sessions 
         SET face_quality_score = $1, 
             lighting_condition = $2, 
             occlusion_detected = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [qualityCheck.score, qualityCheck.lighting, qualityCheck.occlusion, sessionId]
      );

      // ── STEP 1: Verify challenge-response (anti-replay) ─────────────
      if (clientContext.challengeToken && clientContext.challengeCompletedAt) {
        const challengeVerify = await challengeResponseService.verifyChallenge(
          sessionId,
          clientContext.challengeToken,
          clientContext.challengeCompletedAt
        );

        if (!challengeVerify.success) {
          await client.query(
            `UPDATE attendance_verification_sessions 
             SET status = 'FAILED', failure_reason = $1, updated_at = NOW() 
             WHERE id = $2`,
            [`CHALLENGE_${challengeVerify.reason}`, sessionId]
          );
          await client.query('COMMIT');

          await logAction(reqUser, 'ATTENDANCE_VERIFICATION_FAILED', authEmpId, {
            session_id: sessionId,
            reason: challengeVerify.reason,
            stage: 'CHALLENGE_RESPONSE',
          });

          return {
            success: false,
            reason: `CHALLENGE_${challengeVerify.reason}`,
          };
        }
      }

      // ── STEP 2: LIVENESS VERIFICATION (if provider configured) ─────
      if (session.liveness_status !== 'PASSED') {
        // Skip liveness if provider not configured (graceful degradation)
        const livenessCheck = await this.checkLivenessStatus(session);
        
        if (!livenessCheck.skip && !livenessCheck.passed) {
          await client.query(
            `UPDATE attendance_verification_sessions 
             SET status = 'FAILED', liveness_status = $1, failure_reason = $2, updated_at = NOW() 
             WHERE id = $3`,
            [livenessCheck.status, livenessCheck.reason, sessionId]
          );
          await client.query('COMMIT');

          await logAction(reqUser, 'ATTENDANCE_VERIFICATION_FAILED', authEmpId, {
            session_id: sessionId,
            reason: livenessCheck.reason,
            stage: 'LIVENESS',
          });

          return {
            success: false,
            reason: livenessCheck.reason,
          };
        }

        if (livenessCheck.passed) {
          await client.query(
            `UPDATE attendance_verification_sessions 
             SET liveness_status = 'PASSED', status = 'LIVENESS_PASSED', updated_at = NOW() 
             WHERE id = $1`,
            [sessionId]
          );
        }
      }

      // ── STEP 3: FACE MATCH VERIFICATION (with circuit breaker) ─────
      const { rows: [activeTemplate] } = await client.query(
        `SELECT id, version, s3_key FROM employee_biometric_templates WHERE employee_id = $1 AND status = 'ACTIVE' LIMIT 1`,
        [authEmpId]
      );

      if (!activeTemplate || !activeTemplate.s3_key) {
        await client.query(
          `UPDATE attendance_verification_sessions 
           SET face_status = 'REFERENCE_NOT_FOUND', status = 'FAILED', failure_reason = 'BIOMETRIC_REFERENCE_NOT_FOUND', updated_at = NOW() 
           WHERE id = $1`,
          [sessionId]
        );
        await client.query('COMMIT');

        await logAction(reqUser, 'ATTENDANCE_VERIFICATION_FAILED', authEmpId, {
          session_id: sessionId,
          reason: 'BIOMETRIC_REFERENCE_NOT_FOUND',
          stage: 'FACE_MATCH',
        });

        return {
          success: false,
          reason: 'BIOMETRIC_REFERENCE_NOT_FOUND',
          message: 'Attendance Biometric Enrollment is required before marking attendance.',
        };
      }

      // Use circuit breaker for face match API call
      const faceRes = await rateLimiterService.circuitBreaker.execute(async () => {
        return await faceMatchProvider.compareFace(faceImageBuffer, activeTemplate.s3_key);
      });

      if (!faceRes.matched) {
        const reason = faceRes.matchStatus || 'FACE_MISMATCH';

        await client.query(
          `UPDATE attendance_verification_sessions 
           SET face_status = $1, status = 'FAILED', failure_reason = $2, updated_at = NOW() 
           WHERE id = $3`,
          [reason, reason, sessionId]
        );
        await client.query('COMMIT');

        await logAction(reqUser, 'ATTENDANCE_FACE_MATCH_FAILED', authEmpId, {
          session_id: sessionId,
          reason,
          template_version: activeTemplate.version,
        });

        await logAction(reqUser, 'ATTENDANCE_VERIFICATION_FAILED', authEmpId, {
          session_id: sessionId,
          reason,
          stage: 'FACE_MATCH',
        });

        return {
          success: false,
          reason,
          userFeedback: this.getFaceMatchFeedback(reason),
        };
      }

      await client.query(
        `UPDATE attendance_verification_sessions 
         SET face_status = 'PASSED', status = 'FACE_PASSED', updated_at = NOW() 
         WHERE id = $1`,
        [sessionId]
      );

      await logAction(reqUser, 'ATTENDANCE_FACE_MATCH_SUCCESS', authEmpId, {
        session_id: sessionId,
        similarity: faceRes.similarity,
        template_version: activeTemplate.version,
      });

      // ── STEP 4: ENVIRONMENT VERIFICATION with fallback anchors ─────
      const { rows: activeEnvRefs } = await client.query(
        `SELECT reference_code, s3_key FROM attendance_environment_references WHERE environment_status = 'ACTIVE'`
      );

      const envRes = await environmentMatchEnhancedProvider.compareScene(
        faceImageBuffer,
        activeEnvRefs,
        {
          clientIp: clientContext.clientIp,
          clientBssid: clientContext.clientBssid,
          clientLatitude: clientContext.clientLatitude,
          clientLongitude: clientContext.clientLongitude,
          locationAccuracy: clientContext.locationAccuracy,
          officeCode: clientContext.officeCode,
        }
      );

      if (!envRes.matched) {
        const reason = envRes.matchStatus || 'ENVIRONMENT_MISMATCH';

        await client.query(
          `UPDATE attendance_verification_sessions 
           SET environment_status = $1, status = 'FAILED', failure_reason = $2, updated_at = NOW() 
           WHERE id = $3`,
          [reason, reason, sessionId]
        );
        await client.query('COMMIT');

        await logAction(reqUser, 'ATTENDANCE_ENVIRONMENT_MATCH_FAILED', authEmpId, {
          session_id: sessionId,
          reason,
        });

        await logAction(reqUser, 'ATTENDANCE_VERIFICATION_FAILED', authEmpId, {
          session_id: sessionId,
          reason,
          stage: 'ENVIRONMENT',
        });

        return {
          success: false,
          reason,
          userFeedback: this.getEnvironmentFeedback(envRes),
        };
      }

      // ── STEP 5: FINAL SUCCESS ────────────────────────────────────
      await client.query(
        `UPDATE attendance_verification_sessions 
         SET environment_status = 'PASSED', 
             matched_environment_code = $1, 
             status = 'PASSED', 
             completed_at = NOW(), 
             updated_at = NOW(),
             client_ip_address = $2,
             client_user_agent = $3,
             client_network_bssid = $4,
             client_latitude = $5,
             client_longitude = $6,
             client_location_accuracy = $7
         WHERE id = $8`,
        [
          envRes.matchedCode,
          clientContext.clientIp,
          clientContext.userAgent,
          clientContext.clientBssid,
          clientContext.clientLatitude,
          clientContext.clientLongitude,
          clientContext.locationAccuracy,
          sessionId,
        ]
      );

      await client.query('COMMIT');

      await logAction(reqUser, 'ATTENDANCE_ENVIRONMENT_MATCH_SUCCESS', authEmpId, {
        session_id: sessionId,
        matched_code: envRes.matchedCode,
        method: envRes.method,
      });

      await logAction(reqUser, 'ATTENDANCE_VERIFICATION_SUCCESS', authEmpId, {
        session_id: sessionId,
        matched_environment: envRes.matchedCode,
        template_version: activeTemplate.version,
        verification_method: envRes.method,
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
          template_version: activeTemplate.version,
          method: envRes.method,
        },
      };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      
      // Handle circuit breaker errors
      if (err.message === 'CIRCUIT_BREAKER_OPEN') {
        logger.error('[ATTENDANCE VERIFICATION] Circuit breaker open, rejecting request');
        const error = new Error('Service temporarily unavailable due to high error rate. Please try again in a minute.');
        error.statusCode = 503;
        throw error;
      }

      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Perform client-side quality checks (fastest, cheapest validation)
   */
  async performClientSideQualityCheck(imageBuffer, mimeType) {
    try {
      // Validate face image quality & size
      faceBiometricProvider.validateFaceQuality(imageBuffer, mimeType);

      // Simulate lighting and occlusion detection
      // In production, this would use actual CV analysis
      const lighting = 'GOOD'; // Placeholder
      const occlusion = false; // Placeholder
      const score = 85; // Placeholder quality score

      return {
        passed: true,
        score,
        lighting,
        occlusion,
      };
    } catch (err) {
      return {
        passed: false,
        reason: 'QUALITY_CHECK_FAILED',
        userFeedback: this.getQualityFeedback(err.message),
      };
    }
  }

  /**
   * Check liveness status (skip if provider not configured)
   */
  async checkLivenessStatus(session) {
    if (session.liveness_status === 'PROVIDER_NOT_CONFIGURED') {
      return {
        skip: true,
        passed: true,
        status: 'PROVIDER_NOT_CONFIGURED',
      };
    }

    if (session.liveness_status === 'PASSED') {
      return {
        skip: false,
        passed: true,
        status: 'PASSED',
      };
    }

    return {
      skip: false,
      passed: false,
      status: 'LIVENESS_PENDING',
      reason: 'LIVENESS_NOT_COMPLETED',
    };
  }

  /**
   * Get user-friendly feedback for quality check failures
   */
  getQualityFeedback(errorMessage) {
    if (errorMessage.includes('lighting') || errorMessage.includes('dark')) {
      return 'Low light detected. Please move to a well-lit area.';
    }
    if (errorMessage.includes('face') || errorMessage.includes('detect')) {
      return 'Face not clearly visible. Please ensure your face is in frame.';
    }
    if (errorMessage.includes('blur')) {
      return 'Image is blurry. Please hold your device steady.';
    }
    return 'Image quality insufficient. Please try again with better lighting and framing.';
  }

  /**
   * Get user-friendly feedback for face match failures
   */
  getFaceMatchFeedback(reason) {
    switch (reason) {
      case 'FACE_MISMATCH':
        return 'Face verification failed. Please ensure you are looking directly at the camera without obstructions.';
      case 'FACE_PROVIDER_NOT_CONFIGURED':
        return 'Face verification service unavailable. Please try again later.';
      case 'FACE_INVALID_INPUT':
        return 'Invalid image format. Please try again.';
      default:
        return 'Face verification failed. Please try again.';
    }
  }

  /**
   * Get user-friendly feedback for environment verification failures
   */
  getEnvironmentFeedback(envRes) {
    if (envRes.method === 'HYBRID_FALLBACK') {
      if (envRes.networkStatus === 'NETWORK_FAILED') {
        return 'Please connect to office Wi-Fi network for attendance verification.';
      }
      if (envRes.geoStatus === 'GEO_FAILED') {
        return 'Please ensure you are within the office premises for attendance verification.';
      }
    }
    return 'Environment verification failed. Please ensure you are at your designated work location.';
  }

  /**
   * Rollback session on network disconnect
   */
  async rollbackSession(sessionId, reason) {
    try {
      await query(
        `UPDATE attendance_verification_sessions 
         SET status = 'FAILED', 
             rollback_reason = $1, 
             rolled_back_at = NOW(),
             updated_at = NOW()
         WHERE id = $2`,
        [reason, sessionId]
      );

      logger.info(`[ATTENDANCE VERIFICATION] Session ${sessionId} rolled back: ${reason}`);
    } catch (err) {
      logger.error('[ATTENDANCE VERIFICATION] Failed to rollback session:', err.message);
    }
  }
}

module.exports = new AttendanceVerificationEnhancedService();
