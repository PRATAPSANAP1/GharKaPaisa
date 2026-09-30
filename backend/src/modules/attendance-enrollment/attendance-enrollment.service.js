const jwt = require('jsonwebtoken');
const { query, getClient } = require('../../config/database');
const logger = require('../../config/logger');
const faceBiometricProvider = require('../../services/biometric/faceBiometric.provider');
const { uploadBiometricReference, uploadToS3, getSignedDownloadUrl } = require('../../services/aws/s3.service');
const { logAction } = require('../admin/audit.service');
const { JWT_SECRET } = require('../../config/jwt');

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'gharkapaisa-production-storage';

/**
 * Helper to resolve employeeId from reqUser or user_id mapping
 * Handles both employee_id (UUID) and employee_code (string) by mapping to UUID
 */
const resolveEmployeeId = async (reqUser) => {
  if (!reqUser) return null;
  
  // 1. If employee_id is already a valid UUID, return it
  const empId = reqUser.employeeId || reqUser.employee_id;
  if (typeof empId === 'string' && empId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return empId;
  }
  
  // 2. If employee_code is provided, map it to employee_id (UUID)
  const empCode = reqUser.employee_code || reqUser.emp_code || (typeof empId === 'string' && !empId.includes('-') ? empId : null);
  if (empCode) {
    try {
      const { rows: [emp] } = await query(
        `SELECT id FROM employees WHERE employee_id = $1 OR candidate_id::text = $1 LIMIT 1`,
        [empCode]
      );
      if (emp) return emp.id;
    } catch (e) {
      logger.error('Error resolving employee_code to employee_id:', e.message);
    }
  }
  
  // 3. Fallback: resolve employee by user_id
  if (reqUser.id) {
    try {
      const { rows: [emp] } = await query(`SELECT id FROM employees WHERE user_id = $1 LIMIT 1`, [reqUser.id]);
      if (emp) return emp.id;
    } catch (e) {}
  }
  
  return null;
};

/**
 * Create a secure enrollment session token (valid 5 minutes)
 */
const createEnrollmentSession = async ({ userId, employeeId, isReEnrollment = false, reason = null, reqUser }) => {
  const userRole = (reqUser.role || '').toUpperCase();
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isAdminRole = ['SUPER_ADMIN', 'ADMIN', 'HR'].includes(userRole);
  const authEmpId = await resolveEmployeeId(reqUser);

  // Non-administrative users cannot target other employees
  if (!isAdminRole && authEmpId && employeeId !== authEmpId) {
    const error = new Error('Unauthorized to create biometric enrollment session for another employee');
    error.statusCode = 403;
    throw error;
  }

  // Check employee existence
  const { rows: [employee] } = await query(
    `SELECT id, employee_id, full_name, designation, department, employee_status FROM employees WHERE id = $1`,
    [employeeId]
  );

  if (!employee) {
    const error = new Error('Employee record not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if an ACTIVE biometric template already exists
  const { rows: [activeTemplate] } = await query(
    `SELECT id, version, status, enrolled_at FROM employee_biometric_templates WHERE employee_id = $1 AND status = 'ACTIVE' LIMIT 1`,
    [employee.id]
  );

  if (activeTemplate && !isReEnrollment && !isSuperAdmin) {
    const error = new Error('Biometric face reference already enrolled and locked. Only Super Admin can authorize re-enrollment.');
    error.statusCode = 409;
    throw error;
  }

  if (isReEnrollment && !isSuperAdmin) {
    const error = new Error('Only Super Admin can initiate biometric re-enrollment.');
    error.statusCode = 403;
    throw error;
  }

  if (isReEnrollment && (!reason || reason.trim().length < 5)) {
    const error = new Error('A valid reason (minimum 5 characters) is required for biometric re-enrollment.');
    error.statusCode = 400;
    throw error;
  }

  // Session payload
  const payload = {
    employeeId: employee.id,
    employeeCode: employee.employee_id,
    isReEnrollment: !!isReEnrollment,
    reason: reason ? reason.trim() : null,
    initiatedBy: userId,
    type: 'BIOMETRIC_ENROLLMENT_SESSION',
  };

  const sessionToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '5m' });

  return {
    sessionToken,
    expiresInSeconds: 300,
    employee: {
      id: employee.id,
      employee_id: employee.employee_id,
      full_name: employee.full_name,
      designation: employee.designation,
      department: employee.department,
    },
    is_enrolled: !!activeTemplate,
    active_template_version: activeTemplate ? activeTemplate.version : null,
    message: activeTemplate
      ? (isReEnrollment ? 'Super Admin re-enrollment session active' : 'Biometric reference already active')
      : 'Biometric enrollment session created successfully. Capture live employee face photograph.',
  };
};

/**
 * Commit captured face image as authoritative KYC biometric reference
 */
const commitFaceEnrollment = async ({ sessionToken, imageBuffer, originalName, mimeType, reqUser }) => {
  if (!sessionToken) {
    const error = new Error('Enrollment session token is required');
    error.statusCode = 400;
    throw error;
  }

  let session;
  try {
    session = jwt.verify(sessionToken, JWT_SECRET);
  } catch (err) {
    const error = new Error('Invalid or expired enrollment session token');
    error.statusCode = 401;
    throw error;
  }

  if (session.type !== 'BIOMETRIC_ENROLLMENT_SESSION' || !session.employeeId) {
    const error = new Error('Malformed enrollment session payload');
    error.statusCode = 400;
    throw error;
  }

  const userRole = (reqUser.role || '').toUpperCase();
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isAdminRole = ['SUPER_ADMIN', 'ADMIN', 'HR'].includes(userRole);
  const authEmpId = await resolveEmployeeId(reqUser);

  // Non-administrative users cannot commit an enrollment session belonging to another employee
  if (!isAdminRole && authEmpId && session.employeeId !== authEmpId) {
    const error = new Error('Session token employee ID does not match authenticated employee context');
    error.statusCode = 403;
    throw error;
  }

  // 1. Validate image quality, size, and MIME format
  faceBiometricProvider.validateFaceQuality(imageBuffer, mimeType);

  // 2. Compute cryptographic SHA-256 hash
  const imageHash = faceBiometricProvider.calculateImageHash(imageBuffer);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Fetch existing active template
    const { rows: [existingTemplate] } = await client.query(
      `SELECT id, version, status, s3_key FROM employee_biometric_templates WHERE employee_id = $1 AND status = 'ACTIVE' FOR UPDATE`,
      [session.employeeId]
    );

    let nextVersion = 1;

    if (existingTemplate) {
      if (!session.isReEnrollment && !isSuperAdmin) {
        throw new Error('Biometric face reference already enrolled. Only Super Admin can authorize re-enrollment.');
      }

      // Revoke old template only inside transaction
      await client.query(
        `UPDATE employee_biometric_templates 
         SET status = 'REVOKED', revoked_at = NOW(), revoked_by = $1, revocation_reason = $2, updated_at = NOW()
         WHERE id = $3`,
        [reqUser.id, session.reason || 'Super Admin Re-enrollment', existingTemplate.id]
      );

      nextVersion = (existingTemplate.version || 1) + 1;
    }

    // 3. Upload to private S3: employee-biometric/{employeeId}/v{version}/reference.{ext}
    const s3Result = await uploadBiometricReference({
      buffer: imageBuffer,
      employeeId: session.employeeId,
      version: nextVersion,
      mimeType,
    });

    // 4. Index in Rekognition Collection if provider configured
    const indexResult = await faceBiometricProvider.indexFaceReference({
      bucket: s3Result.bucket,
      key: s3Result.key,
      employeeId: session.employeeId,
    });

    const enrollmentSource = session.isReEnrollment ? 'SUPER_ADMIN_RE_ENROLLMENT' : 'KYC_FACE_ENROLLMENT';

    // 5. Insert new ACTIVE template
    const { rows: [newTemplate] } = await client.query(
      `INSERT INTO employee_biometric_templates 
       (employee_id, employee_code, version, status, s3_bucket, s3_key, face_provider, face_provider_id, rekognition_collection_id, rekognition_face_id, image_hash, enrollment_source, enrolled_by, enrolled_at)
       VALUES ($1, $2, $3, 'ACTIVE', $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       RETURNING id, employee_id, employee_code, version, status, s3_key, image_hash, enrollment_source, enrolled_at`,
      [
        session.employeeId,
        session.employeeCode || null,
        nextVersion,
        s3Result.bucket,
        s3Result.key,
        indexResult.faceProvider || 'LOCAL_S3',
        indexResult.faceId || null,
        indexResult.collectionId || null,
        indexResult.faceId || null,
        imageHash,
        enrollmentSource,
        reqUser.id
      ]
    );

    await client.query('COMMIT');

    // 6. Write audit log
    const auditAction = session.isReEnrollment ? 'FACE_RE_ENROLLMENT' : 'FACE_ENROLLMENT';
    await logAction(reqUser, auditAction, session.employeeId, {
      template_id: newTemplate.id,
      version: newTemplate.version,
      image_hash: newTemplate.image_hash,
      source: enrollmentSource,
      reason: session.reason || null,
      provider: indexResult.faceProvider || 'LOCAL_S3',
    });

    logger.info(`[BIOMETRIC ENROLLMENT] Biometric face reference committed successfully for employee ${session.employeeId} (v${newTemplate.version})`);

    return {
      success: true,
      message: session.isReEnrollment 
        ? 'Biometric face reference updated successfully by Super Admin' 
        : 'Biometric face reference enrolled and locked successfully for attendance',
      template: {
        id: newTemplate.id,
        employee_id: newTemplate.employee_id,
        version: newTemplate.version,
        status: newTemplate.status,
        enrollment_source: newTemplate.enrollment_source,
        enrolled_at: newTemplate.enrolled_at,
      }
    };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error committing biometric face enrollment:', err.message);

    // Audit failed enrollment
    const failAction = session?.isReEnrollment ? 'FACE_RE_ENROLLMENT_FAILED' : 'FACE_ENROLLMENT_FAILED';
    if (session?.employeeId) {
      await logAction(reqUser, failAction, session.employeeId, {
        error: err.message,
        reason: session.reason || null
      }).catch(() => {});
    }

    throw err;
  } finally {
    client.release();
  }
};

/**
 * Fetch employee biometric enrollment status
 */
const getEmployeeBiometricStatus = async (employeeId, reqUser) => {
  const { rows: templates } = await query(
    `SELECT t.id, t.employee_id, t.employee_code, t.version, t.status, t.enrollment_source, t.enrolled_at, t.revoked_at, t.revocation_reason,
            u.full_name as enrolled_by_name
     FROM employee_biometric_templates t
     LEFT JOIN users u ON u.id = t.enrolled_by
     WHERE t.employee_id = $1
     ORDER BY t.version DESC`,
    [employeeId]
  );

  const activeTemplate = templates.find(t => t.status === 'ACTIVE') || null;

  return {
    employee_id: employeeId,
    is_enrolled: !!activeTemplate,
    status: activeTemplate ? 'ACTIVE' : 'NOT_ENROLLED',
    active_template: activeTemplate ? {
      id: activeTemplate.id,
      version: activeTemplate.version,
      status: activeTemplate.status,
      enrollment_source: activeTemplate.enrollment_source,
      enrolled_at: activeTemplate.enrolled_at,
      enrolled_by_name: activeTemplate.enrolled_by_name
    } : null,
    history: (reqUser.role || '').toUpperCase() === 'SUPER_ADMIN' ? templates : []
  };
};

/**
 * Generate short-lived signed preview URL for Super Admin / Admin inspection
 */
const getSignedPreviewUrl = async (employeeId, reqUser) => {
  const role = (reqUser.role || '').toUpperCase();
  if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
    const error = new Error('Unauthorized to preview sensitive biometric reference image');
    error.statusCode = 403;
    throw error;
  }

  const { rows: [template] } = await query(
    `SELECT s3_key FROM employee_biometric_templates WHERE employee_id = $1 AND status = 'ACTIVE' LIMIT 1`,
    [employeeId]
  );

  if (!template || !template.s3_key) {
    const error = new Error('No active biometric reference image found for this employee');
    error.statusCode = 404;
    throw error;
  }

  const signedUrl = await getSignedDownloadUrl(template.s3_key, 300); // 5 minutes expiration

  return {
    signedUrl,
    expiresInSeconds: 300,
  };
};

/**
 * Fetch all registered office environment references
 */
const getEnvironmentReferences = async () => {
  const { rows } = await query(
    `SELECT r.id, r.reference_code, r.reference_name, r.environment_status, r.capture_description,
            r.image_hash, r.created_at, r.updated_at, u.full_name as created_by_name
     FROM attendance_environment_references r
     LEFT JOIN users u ON u.id = r.created_by
     ORDER BY r.reference_code ASC`
  );

  return rows;
};

/**
 * Register or update an office environment reference image
 */
const registerEnvironmentReference = async ({ referenceCode, referenceName, captureDescription, imageBuffer, originalName, mimeType, reqUser }) => {
  const role = (reqUser.role || '').toUpperCase();
  if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
    const error = new Error('Unauthorized to register office environment references');
    error.statusCode = 403;
    throw error;
  }

  const normalizedCode = (referenceCode || '').toUpperCase().trim();
  if (!['BKG1', 'BKG2', 'BKG3', 'BKG4'].includes(normalizedCode)) {
    const error = new Error('Invalid environment reference code. Must be BKG1, BKG2, BKG3, or BKG4');
    error.statusCode = 422;
    throw error;
  }

  faceBiometricProvider.validateFaceQuality(imageBuffer, mimeType);
  const imageHash = faceBiometricProvider.calculateImageHash(imageBuffer);

  const folderPath = `biometric/environment/${normalizedCode}`;
  const ext = mimeType === 'image/png' ? '.png' : '.jpg';
  const fileName = `env_${Date.now()}${ext}`;

  const s3Result = await uploadToS3(imageBuffer, fileName, folderPath);

  const { rows: [existing] } = await query(
    `SELECT id FROM attendance_environment_references WHERE reference_code = $1 LIMIT 1`,
    [normalizedCode]
  );

  let result;
  if (existing) {
    const { rows: [updated] } = await query(
      `UPDATE attendance_environment_references
       SET reference_name = $1, s3_bucket = $2, s3_key = $3, image_hash = $4,
           environment_status = 'ACTIVE', capture_description = $5, updated_at = NOW()
       WHERE reference_code = $6
       RETURNING id, reference_code, reference_name, environment_status, capture_description, created_at, updated_at`,
      [referenceName, BUCKET_NAME, s3Result.key, imageHash, captureDescription, normalizedCode]
    );
    result = updated;
    await logAction(reqUser, 'ENVIRONMENT_REFERENCE_UPDATED', null, { reference_code: normalizedCode, hash: imageHash });
  } else {
    const { rows: [inserted] } = await query(
      `INSERT INTO attendance_environment_references
       (reference_code, reference_name, s3_bucket, s3_key, image_hash, environment_status, capture_description, created_by)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6, $7)
       RETURNING id, reference_code, reference_name, environment_status, capture_description, created_at, updated_at`,
      [normalizedCode, referenceName, BUCKET_NAME, s3Result.key, imageHash, captureDescription, reqUser.id]
    );
    result = inserted;
    await logAction(reqUser, 'ENVIRONMENT_REFERENCE_CREATED', null, { reference_code: normalizedCode, hash: imageHash });
  }

  return result;
};

/**
 * Revoke an office environment reference
 */
const revokeEnvironmentReference = async (referenceCode, reason, reqUser) => {
  const role = (reqUser.role || '').toUpperCase();
  if (role !== 'SUPER_ADMIN') {
    const error = new Error('Only Super Admin can revoke approved environment references');
    error.statusCode = 403;
    throw error;
  }

  const normalizedCode = (referenceCode || '').toUpperCase().trim();
  const { rows: [ref] } = await query(
    `UPDATE attendance_environment_references
     SET environment_status = 'REVOKED', revoked_at = NOW(), updated_at = NOW()
     WHERE reference_code = $1
     RETURNING id, reference_code, environment_status`,
    [normalizedCode]
  );

  if (!ref) {
    const error = new Error(`Environment reference ${normalizedCode} not found`);
    error.statusCode = 404;
    throw error;
  }

  await logAction(reqUser, 'ENVIRONMENT_REFERENCE_REVOKED', null, { reference_code: normalizedCode, reason });
  return ref;
};

module.exports = {
  resolveEmployeeId,
  createEnrollmentSession,
  commitFaceEnrollment,
  getEmployeeBiometricStatus,
  getSignedPreviewUrl,
  getEnvironmentReferences,
  registerEnvironmentReference,
  revokeEnvironmentReference,
};
