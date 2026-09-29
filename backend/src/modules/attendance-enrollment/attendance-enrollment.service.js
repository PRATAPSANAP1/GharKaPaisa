const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query, getClient } = require('../../config/database');
const logger = require('../../config/logger');
const faceBiometricProvider = require('../../services/biometric/faceBiometric.provider');
const { uploadToS3, getSignedDownloadUrl } = require('../../services/aws/s3.service');
const { logAction } = require('../admin/audit.service');
const { JWT_SECRET } = require('../../config/jwt');

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'gharkapaisa-production-storage';

/**
 * Create a secure enrollment session token (valid 15 minutes)
 */
const createEnrollmentSession = async ({ userId, employeeId, isReEnrollment = false, reason = null, reqUser }) => {
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

  const userRole = (reqUser.role || '').toUpperCase();

  // If re-enrollment requested, require SUPER_ADMIN role
  if (isReEnrollment && userRole !== 'SUPER_ADMIN') {
    const error = new Error('Only Super Admin is authorized to initiate biometric re-enrollment');
    error.statusCode = 403;
    throw error;
  }

  // Check active biometric template status
  const { rows: [activeTemplate] } = await query(
    `SELECT id, version, status, enrolled_at FROM employee_biometric_templates WHERE employee_id = $1 AND status = 'ACTIVE' LIMIT 1`,
    [employeeId]
  );

  if (activeTemplate && !isReEnrollment) {
    const error = new Error('Employee already has an active biometric face reference. Re-enrollment requires Super Admin authorization.');
    error.statusCode = 409;
    throw error;
  }

  // Session payload
  const payload = {
    employeeId: employee.id,
    employeeCode: employee.employee_id,
    isReEnrollment: !!isReEnrollment,
    reason: reason || null,
    initiatedBy: userId,
    type: 'BIOMETRIC_ENROLLMENT_SESSION',
  };

  const sessionToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

  return {
    sessionToken,
    expiresInSeconds: 900,
    employee: {
      id: employee.id,
      employee_id: employee.employee_id,
      full_name: employee.full_name,
      designation: employee.designation,
      department: employee.department,
    },
    hasActiveReference: !!activeTemplate,
    activeTemplate: activeTemplate ? { version: activeTemplate.version, enrolled_at: activeTemplate.enrolled_at } : null,
  };
};

/**
 * Commit captured face image as biometric reference
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

  // Validate image quality & format
  faceBiometricProvider.validateFaceQuality(imageBuffer, mimeType);

  // Compute cryptographic SHA-256 hash
  const imageHash = faceBiometricProvider.calculateImageHash(imageBuffer);

  const folderPath = `biometric/employees/${session.employeeId}/face-reference`;
  const ext = mimeType === 'image/png' ? '.png' : '.jpg';
  const fileName = `ref_${uuidv4()}${ext}`;

  // Upload to private S3
  const s3Result = await uploadToS3(imageBuffer, fileName, folderPath);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Fetch existing active template
    const { rows: [existingTemplate] } = await client.query(
      `SELECT id, version, status, s3_key FROM employee_biometric_templates WHERE employee_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [session.employeeId]
    );

    let nextVersion = 1;

    if (existingTemplate) {
      if (!session.isReEnrollment && (reqUser.role || '').toUpperCase() !== 'SUPER_ADMIN') {
        throw new Error('Biometric reference already exists. Only Super Admin can re-enroll.');
      }

      // Revoke old template
      await client.query(
        `UPDATE employee_biometric_templates 
         SET status = 'REVOKED', revoked_at = NOW(), revoked_by = $1, revocation_reason = $2, updated_at = NOW()
         WHERE id = $3`,
        [reqUser.id, session.reason || 'Super Admin Re-enrollment', existingTemplate.id]
      );

      nextVersion = (existingTemplate.version || 1) + 1;
    }

    const enrollmentSource = session.isReEnrollment ? 'SUPER_ADMIN_RE_ENROLLMENT' : 'KYC_FACE_ENROLLMENT';

    // Insert new active template
    const { rows: [newTemplate] } = await client.query(
      `INSERT INTO employee_biometric_templates 
       (employee_id, version, status, s3_bucket, s3_key, face_provider, image_hash, enrollment_source, enrolled_by, enrolled_at)
       VALUES ($1, $2, 'ACTIVE', $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, employee_id, version, status, s3_key, image_hash, enrollment_source, enrolled_at`,
      [
        session.employeeId,
        nextVersion,
        BUCKET_NAME,
        s3Result.key,
        faceBiometricProvider.providerName,
        imageHash,
        enrollmentSource,
        reqUser.id
      ]
    );

    await client.query('COMMIT');

    // Write audit log
    const auditAction = session.isReEnrollment ? 'FACE_RE_ENROLLMENT' : 'FACE_ENROLLMENT';
    await logAction(reqUser, auditAction, session.employeeId, {
      template_id: newTemplate.id,
      version: newTemplate.version,
      image_hash: newTemplate.image_hash,
      source: enrollmentSource,
      reason: session.reason || null
    });

    logger.info(`Biometric face reference committed successfully for employee ${session.employeeId} (v${newTemplate.version})`);

    return {
      success: true,
      message: session.isReEnrollment 
        ? 'Biometric face reference updated successfully by Super Admin' 
        : 'Biometric face reference enrolled successfully',
      template: {
        id: newTemplate.id,
        employee_id: newTemplate.employee_id,
        version: newTemplate.version,
        status: newTemplate.status,
        enrollment_source: newTemplate.enrollment_source,
        enrolled_at: newTemplate.enrolled_at,
        image_hash: newTemplate.image_hash
      }
    };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error committing biometric face enrollment:', err.message);
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
    `SELECT t.id, t.employee_id, t.version, t.status, t.enrollment_source, t.enrolled_at, t.revoked_at, t.revocation_reason,
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
  const fileName = `env_${uuidv4()}${ext}`;

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
  createEnrollmentSession,
  commitFaceEnrollment,
  getEmployeeBiometricStatus,
  getSignedPreviewUrl,
  getEnvironmentReferences,
  registerEnvironmentReference,
  revokeEnvironmentReference,
};
