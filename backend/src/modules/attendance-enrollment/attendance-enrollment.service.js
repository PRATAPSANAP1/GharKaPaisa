const jwt = require('jsonwebtoken');
const { query, getClient } = require('../../config/database');
const logger = require('../../config/logger');
const faceBiometricProvider = require('../../services/biometric/faceBiometric.provider');
const { uploadBiometricReference, uploadToS3, getSignedDownloadUrl } = require('../../services/aws/s3.service');
const { logAction } = require('../admin/audit.service');
const { JWT_SECRET } = require('../../config/jwt');

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'gharkapaisa-production-storage';

/**
 * Ensure face_verification_reminders table exists lazily
 */
let remindersTableInitialized = false;
const ensureRemindersTable = async () => {
  if (remindersTableInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS face_verification_reminders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        sent_by UUID REFERENCES users(id),
        message TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'SEEN', 'COMPLETED', 'CANCELLED')),
        sent_at TIMESTAMPTZ DEFAULT NOW(),
        seen_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_face_reminders_emp_id ON face_verification_reminders(employee_id);
      CREATE INDEX IF NOT EXISTS idx_face_reminders_status ON face_verification_reminders(status);
      CREATE INDEX IF NOT EXISTS idx_face_reminders_sent_at ON face_verification_reminders(sent_at DESC);
    `);
    remindersTableInitialized = true;
  } catch (err) {
    logger.warn('Lazy table init warning (face_verification_reminders):', err.message);
  }
};

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

  const targetEmpId = employeeId || authEmpId;

  // Non-administrative users cannot target other employees
  if (!isAdminRole && authEmpId && String(targetEmpId).toLowerCase() !== String(authEmpId).toLowerCase()) {
    const error = new Error('Unauthorized to create biometric enrollment session for another employee');
    error.statusCode = 403;
    throw error;
  }

  // Check employee existence
  const { rows: [employee] } = await query(
    `SELECT id, employee_id, full_name, designation, department, employee_status FROM employees WHERE id = $1`,
    [targetEmpId]
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

  // Audit session start
  const startAuditAction = isReEnrollment ? 'FACE_VERIFICATION_RE_ENROLLMENT_STARTED' : 'FACE_ENROLLMENT_STARTED';
  await logAction(reqUser, startAuditAction, employee.id, {
    reason: reason || null,
    is_re_enrollment: !!isReEnrollment,
  }).catch(() => {});

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

      await logAction(reqUser, 'FACE_BIOMETRIC_REVOKED', session.employeeId, {
        previous_template_id: existingTemplate.id,
        previous_version: existingTemplate.version,
        reason: session.reason || 'Replaced by new enrollment'
      }).catch(() => {});

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

    // 6. Complete any pending reminders for this employee
    await ensureRemindersTable();
    await client.query(
      `UPDATE face_verification_reminders 
       SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW() 
       WHERE employee_id = $1 AND status IN ('SENT', 'SEEN')`,
      [session.employeeId]
    ).catch(() => {});

    await client.query('COMMIT');

    // 7. Write audit log
    const auditAction = session.isReEnrollment ? 'FACE_RE_ENROLLMENT_COMPLETED' : 'FACE_ENROLLMENT_COMPLETED';
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
    await client.query('ROLLBACK').catch(() => {});
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
  if (!employeeId) {
    return {
      is_enrolled: false,
      status: 'NOT_ENROLLED',
      message: 'Employee ID required'
    };
  }

  const rawId = String(employeeId).trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);

  let targetEmpId = rawId;
  if (isUuid) {
    const { rows: [foundEmp] } = await query(
      `SELECT id FROM employees WHERE id = $1 OR user_id = $1 LIMIT 1`,
      [rawId]
    );
    if (foundEmp) targetEmpId = foundEmp.id;
  } else {
    const { rows: [foundEmpByCode] } = await query(
      `SELECT id FROM employees WHERE employee_id = $1 OR candidate_id::text = $1 LIMIT 1`,
      [rawId]
    );
    if (foundEmpByCode) targetEmpId = foundEmpByCode.id;
  }

  const { rows: templates } = await query(
    `SELECT t.id, t.employee_id, t.employee_code, t.version, t.status, t.enrollment_source, t.enrolled_at, t.revoked_at, t.revocation_reason,
            u.full_name as enrolled_by_name
     FROM employee_biometric_templates t
     LEFT JOIN users u ON u.id = t.enrolled_by
     WHERE t.employee_id = $1
     ORDER BY t.version DESC`,
    [targetEmpId]
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
    history: (reqUser?.role || '').toUpperCase() === 'SUPER_ADMIN' ? templates : []
  };
};

/**
 * Get authenticated employee's own biometric status
 */
const getMyBiometricStatus = async (reqUser) => {
  const authEmpId = await resolveEmployeeId(reqUser);
  if (!authEmpId) {
    return {
      is_enrolled: false,
      status: 'NOT_ENROLLED',
      message: 'No employee profile associated with current user context'
    };
  }
  return getEmployeeBiometricStatus(authEmpId, reqUser);
};

/**
 * Super Admin: List employees with missing face verification + status breakdown
 */
const getMissingBiometrics = async ({ search = '', status = 'ALL', page = 1, limit = 50 }) => {
  await ensureRemindersTable();

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const searchPattern = search ? `%${search.trim()}%` : null;

  let whereClauses = [`e.employee_status != 'TERMINATED'`];
  let params = [];

  if (searchPattern) {
    params.push(searchPattern);
    whereClauses.push(`(e.full_name ILIKE $${params.length} OR e.employee_id ILIKE $${params.length} OR e.mobile_number ILIKE $${params.length} OR e.email_id ILIKE $${params.length})`);
  }

  // Filter based on Face Verification status: 'ALL' | 'VERIFIED' | 'MISSING' | 'PENDING' | 'REVOKED'
  const normStatus = status.toUpperCase();
  if (normStatus === 'VERIFIED') {
    whereClauses.push(`t.status = 'ACTIVE'`);
  } else if (normStatus === 'MISSING' || normStatus === 'PENDING') {
    whereClauses.push(`t.status IS NULL OR t.status != 'ACTIVE'`);
  } else if (normStatus === 'REVOKED') {
    whereClauses.push(`t.status = 'REVOKED'`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(DISTINCT e.id) as total
    FROM employees e
    LEFT JOIN employee_biometric_templates t ON t.employee_id = e.id AND t.status = 'ACTIVE'
    ${whereSql}
  `;
  const { rows: [countResult] } = await query(countQuery, params);
  const total = parseInt(countResult?.total || 0, 10);

  params.push(parseInt(limit, 10), offset);
  const limitParamIdx = params.length - 1;
  const offsetParamIdx = params.length;

  const dataQuery = `
    SELECT 
      e.id, 
      e.employee_id as employee_code, 
      e.full_name, 
      e.designation, 
      e.department, 
      e.mobile_number, 
      e.email_id, 
      e.employee_status,
      e.activation_status as kyc_status,
      t.id as active_template_id,
      t.version as active_template_version,
      t.enrolled_at as active_enrolled_at,
      r.id as latest_reminder_id,
      r.sent_at as latest_reminder_sent_at,
      r.status as latest_reminder_status,
      CASE 
        WHEN t.status = 'ACTIVE' THEN 'VERIFIED'
        WHEN EXISTS(SELECT 1 FROM employee_biometric_templates rev WHERE rev.employee_id = e.id AND rev.status = 'REVOKED') AND t.status IS NULL THEN 'REVOKED'
        ELSE 'MISSING'
      END as face_verification_status,
      CASE 
        WHEN t.status = 'ACTIVE' THEN 'ENABLED'
        ELSE 'RESTRICTED'
      END as attendance_access
    FROM employees e
    LEFT JOIN employee_biometric_templates t ON t.employee_id = e.id AND t.status = 'ACTIVE'
    LEFT JOIN LATERAL (
      SELECT id, sent_at, status 
      FROM face_verification_reminders rem 
      WHERE rem.employee_id = e.id 
      ORDER BY sent_at DESC 
      LIMIT 1
    ) r ON true
    ${whereSql}
    ORDER BY e.created_at DESC
    LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}
  `;

  const { rows: employees } = await query(dataQuery, params);

  return {
    employees,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)) || 1
    }
  };
};

/**
 * Super Admin: Send Face Verification Reminder to an employee
 */
const sendFaceVerificationReminder = async ({ employeeId, message, reqUser }) => {
  await ensureRemindersTable();

  if (!employeeId) {
    const error = new Error('employee_id is required');
    error.statusCode = 400;
    throw error;
  }

  const rawId = String(employeeId).trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);

  // Validate employee across id (UUID), user_id (UUID), employee_id string code, or candidate_id
  let emp = null;
  if (isUuid) {
    const { rows: [foundEmp] } = await query(
      `SELECT id, employee_id, full_name, user_id FROM employees WHERE id = $1 OR user_id = $1 LIMIT 1`,
      [rawId]
    );
    emp = foundEmp;
  }

  if (!emp) {
    const { rows: [foundEmpByCode] } = await query(
      `SELECT id, employee_id, full_name, user_id FROM employees WHERE employee_id = $1 OR candidate_id::text = $1 LIMIT 1`,
      [rawId]
    );
    emp = foundEmpByCode;
  }

  if (!emp) {
    const error = new Error('Employee record not found');
    error.statusCode = 404;
    throw error;
  }

  const targetEmpId = emp.id;

  // Anti-Spam Check: Disallow sending reminder if one was sent in the last 10 minutes
  const { rows: [recentReminder] } = await query(
    `SELECT id, sent_at FROM face_verification_reminders 
     WHERE employee_id = $1 AND sent_at > NOW() - INTERVAL '10 minutes' AND status = 'SENT'
     LIMIT 1`,
    [targetEmpId]
  );

  if (recentReminder) {
    const error = new Error('A reminder was already sent to this employee recently. Please wait before sending another.');
    error.statusCode = 429;
    throw error;
  }

  const defaultMsg = message && message.trim()
    ? message.trim()
    : 'Please complete your KYC face verification from your employee dashboard to enable biometric attendance.';

  // 1. Insert into face_verification_reminders table
  const { rows: [reminder] } = await query(
    `INSERT INTO face_verification_reminders 
     (employee_id, sent_by, message, status, sent_at, created_at, updated_at)
     VALUES ($1, $2, $3, 'SENT', NOW(), NOW(), NOW())
     RETURNING id, employee_id, sent_by, message, status, sent_at`,
    [targetEmpId, reqUser.id, defaultMsg]
  );

  // 2. Dispatch in-app notification if user_id exists
  if (emp.user_id) {
    try {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
         VALUES ($1, $2, $3, 'FACE_VERIFICATION_REMINDER', false, NOW())`,
        [
          emp.user_id,
          'Face Verification Required',
          defaultMsg
        ]
      );
    } catch (e) {
      // Non-critical fallback
      logger.warn('Failed to insert into notifications table:', e.message);
    }
  }

  // 3. Audit Action
  await logAction(reqUser, 'FACE_VERIFICATION_REMINDER_SENT', targetEmpId, {
    reminder_id: reminder.id,
    message: defaultMsg,
  });

  return {
    success: true,
    message: 'Face verification reminder sent successfully',
    reminder: {
      id: reminder.id,
      employee_id: reminder.employee_id,
      employee_name: emp.full_name,
      employee_code: emp.employee_id,
      sent_at: reminder.sent_at,
      status: reminder.status,
    }
  };
};

/**
 * Super Admin: Get reminder history for an employee
 */
const getReminderHistory = async (employeeId) => {
  await ensureRemindersTable();

  if (!employeeId) return [];

  const rawId = String(employeeId).trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);

  let targetEmpId = rawId;
  if (isUuid) {
    const { rows: [foundEmp] } = await query(
      `SELECT id FROM employees WHERE id = $1 OR user_id = $1 LIMIT 1`,
      [rawId]
    );
    if (foundEmp) targetEmpId = foundEmp.id;
  } else {
    const { rows: [foundEmpByCode] } = await query(
      `SELECT id FROM employees WHERE employee_id = $1 OR candidate_id::text = $1 LIMIT 1`,
      [rawId]
    );
    if (foundEmpByCode) targetEmpId = foundEmpByCode.id;
  }

  const { rows: history } = await query(
    `SELECT r.id, r.employee_id, r.message, r.status, r.sent_at, r.seen_at, r.completed_at,
            u.full_name as sent_by_name
     FROM face_verification_reminders r
     LEFT JOIN users u ON u.id = r.sent_by
     WHERE r.employee_id = $1
     ORDER BY r.sent_at DESC`,
    [targetEmpId]
  );

  return history;
};

/**
 * Mark a reminder as seen by employee
 */
const markReminderSeen = async (reminderId, reqUser) => {
  await ensureRemindersTable();

  const { rows: [updated] } = await query(
    `UPDATE face_verification_reminders
     SET status = 'SEEN', seen_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status = 'SENT'
     RETURNING id, status, seen_at`,
    [reminderId]
  );

  if (updated) {
    await logAction(reqUser, 'FACE_VERIFICATION_REMINDER_SEEN', null, { reminder_id: reminderId }).catch(() => {});
  }

  return updated || { id: reminderId, status: 'SEEN' };
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
  getMyBiometricStatus,
  getMissingBiometrics,
  sendFaceVerificationReminder,
  getReminderHistory,
  markReminderSeen,
  getSignedPreviewUrl,
  getEnvironmentReferences,
  registerEnvironmentReference,
  revokeEnvironmentReference,
};
