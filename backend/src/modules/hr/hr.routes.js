const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');
const roleCheck = require('../../middleware/authorization/role.middleware');
const bcrypt = require('bcryptjs');
const { sendEmployeeInvitationEmail } = require('../../services/email/email.service');
const { sendSms, sendEmployeeInviteSms } = require('../../services/sms/sms.service');
const logger = require('../../config/logger');
const { getSignedDownloadUrl } = require('../../services/aws/s3.service');

// HR Endpoints protected by auth and role (HR, ADMIN, SUPER_ADMIN)
router.use(jwtAuth);
router.use(roleCheck('HR', 'ADMIN', 'SUPER_ADMIN'));

// Helper: Generate unique Employee ID in format like YOH-TM0985, YOH-HR0123
async function generateEmployeeId(designation = '') {
  const desigUpper = String(designation || '').toUpperCase();
  let code = 'TM';
  if (desigUpper.includes('HR')) code = 'HR';
  else if (desigUpper.includes('TELECALLER') || desigUpper === 'TC') code = 'TM';
  else if (desigUpper.includes('TEAM LEADER') || desigUpper === 'TL') code = 'TL';
  else if (desigUpper.includes('MANAGER')) code = 'MG';
  else if (desigUpper.includes('SALES')) code = 'SE';
  
  let isUnique = false;
  let employeeId = '';
  while (!isUnique) {
    const num = Math.floor(1000 + Math.random() * 9000);
    employeeId = `YOH-${code}${String(num).padStart(4, '0')}`;
    const { rows } = await query(`SELECT id FROM users WHERE employee_id = $1`, [employeeId]);
    if (rows.length === 0) {
      isUnique = true;
    }
  }
  return employeeId;
}

// Helper: Generate presigned download URL for private S3 resume objects
async function getCandidateSignedResumeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  let key = rawUrl;
  if (rawUrl.includes('.amazonaws.com/')) {
    key = rawUrl.split('.amazonaws.com/')[1];
  } else if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }
  
  key = key.split('?')[0];

  try {
    const signedUrl = await getSignedDownloadUrl(key, 7200); // 2 hours validity
    return signedUrl;
  } catch (err) {
    logger.warn(`Failed to generate presigned S3 download URL for key ${key}: ${err.message}`);
    return rawUrl;
  }
}

// Helper: Ensure assigned_hr_id and selection columns exist
async function ensureHRColumnsExist() {
  try {
    await query(`ALTER TABLE employee_candidates ADD COLUMN IF NOT EXISTS assigned_hr_id UUID`);
    await query(`ALTER TABLE employee_candidates ADD COLUMN IF NOT EXISTS assigned_hr_name VARCHAR(100)`);
    await query(`ALTER TABLE employee_candidates ADD COLUMN IF NOT EXISTS offered_salary NUMERIC`);
    await query(`ALTER TABLE employee_candidates ADD COLUMN IF NOT EXISTS offered_designation VARCHAR(100)`);
    await query(`ALTER TABLE employee_candidates ADD COLUMN IF NOT EXISTS offered_department VARCHAR(100)`);
    await query(`ALTER TABLE employee_candidates ADD COLUMN IF NOT EXISTS expected_joining_date DATE`);
    await query(`ALTER TABLE employee_candidates ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50)`);
  } catch (err) {
    logger.warn('Failed to ensure HR columns on employee_candidates:', err.message);
  }
}

// GET /api/v1/hr/candidates — List candidate applications with search and filters
router.get('/candidates', async (req, res, next) => {
  try {
    await ensureHRColumnsExist();
    const { status, search, limit = 50, offset = 0 } = req.query;

    const userRole = (req.user?.role || '').toUpperCase();
    const userId = req.user?.id;
    const userName = req.user?.full_name || req.user?.fullName || '';

    let queryStr = `SELECT * FROM employee_candidates WHERE 1=1`;
    const params = [];

    // HR users see ONLY candidates assigned specifically to them
    if (userRole === 'HR') {
      params.push(userId, userName);
      queryStr += ` AND (assigned_hr_id = $1 OR assigned_hr_name ILIKE $2 OR hr_name ILIKE $2)`;
    }

    if (status) {
      params.push(status);
      queryStr += ` AND interview_status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      queryStr += ` AND (full_name ILIKE $${params.length} OR mobile_number ILIKE $${params.length} OR email_id ILIKE $${params.length} OR reference_code ILIKE $${params.length})`;
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await query(queryStr, params);

    // Count query
    let countStr = `SELECT COUNT(*) FROM employee_candidates WHERE 1=1`;
    const countParams = [];
    if (userRole === 'HR') {
      countParams.push(userId, userName);
      countStr += ` AND (assigned_hr_id = $1 OR assigned_hr_name ILIKE $2 OR hr_name ILIKE $2)`;
    }
    if (status) {
      countParams.push(status);
      countStr += ` AND interview_status = $${countParams.length}`;
    }
    if (search) {
      countParams.push(`%${search}%`);
      countStr += ` AND (full_name ILIKE $${countParams.length} OR mobile_number ILIKE $${countParams.length} OR email_id ILIKE $${countParams.length} OR reference_code ILIKE $${countParams.length})`;
    }

    const countRes = await query(countStr, countParams);

    const formattedRows = await Promise.all(
      rows.map(async (cand) => {
        let signedResumeUrl = cand.resume_url;
        if (cand.resume_url) {
          signedResumeUrl = await getCandidateSignedResumeUrl(cand.resume_url);
        }
        return {
          ...cand,
          resume_url: signedResumeUrl
        };
      })
    );

    res.json({
      success: true,
      data: formattedRows,
      total: parseInt(countRes.rows[0]?.count || 0)
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/hr/candidates/:id/assign-hr — Assign candidate to specific HR Manager
router.post('/candidates/:id/assign-hr', async (req, res, next) => {
  try {
    await ensureHRColumnsExist();
    const { id } = req.params;
    const { hr_id, hr_name } = req.body;

    let hrName = hr_name;
    if (hr_id && !hrName) {
      const hrRes = await query(`SELECT full_name FROM users WHERE id = $1`, [hr_id]);
      if (hrRes.rows.length > 0) {
        hrName = hrRes.rows[0].full_name;
      }
    }

    const { rows } = await query(
      `UPDATE employee_candidates SET assigned_hr_id = $1, assigned_hr_name = $2, hr_name = $2 WHERE id = $3 RETURNING *`,
      [hr_id || null, hrName || null, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Candidate record not found' });
    }

    res.json({
      success: true,
      message: 'Candidate assigned to HR successfully',
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/hr/candidates/:id/resume — Presigned URL endpoint for candidate resume
router.get('/candidates/:id/resume', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(`SELECT resume_url FROM employee_candidates WHERE id = $1`, [id]);
    if (rows.length === 0 || !rows[0].resume_url) {
      return res.status(404).json({ success: false, message: 'Resume document not found for candidate' });
    }
    const signedUrl = await getCandidateSignedResumeUrl(rows[0].resume_url);
    if (req.query.redirect === 'true') {
      return res.redirect(signedUrl);
    }
    res.json({ success: true, url: signedUrl });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/hr/candidates/stats — Candidate summary metrics
router.get('/candidates/stats', async (req, res, next) => {
  try {
    await ensureHRColumnsExist();
    const userRole = (req.user?.role || '').toUpperCase();
    const userId = req.user?.id;
    const userName = req.user?.full_name || req.user?.fullName || '';

    let whereClause = `WHERE 1=1`;
    const params = [];

    if (userRole === 'HR') {
      params.push(userId, userName);
      whereClause += ` AND (assigned_hr_id = $1 OR assigned_hr_name ILIKE $2 OR hr_name ILIKE $2)`;
    }

    const { rows } = await query(`
      SELECT 
        COUNT(*) as total_candidates,
        COUNT(*) FILTER (WHERE interview_status = 'REGISTERED') as registered,
        COUNT(*) FILTER (WHERE interview_status = 'INTERVIEW_PENDING') as interview_pending,
        COUNT(*) FILTER (WHERE interview_status = 'SELECTED') as selected,
        COUNT(*) FILTER (WHERE interview_status = 'REJECTED') as rejected,
        COUNT(*) FILTER (WHERE interview_status = 'EMPLOYEE_CREATED') as converted
      FROM employee_candidates
      ${whereClause}
    `, params);

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/hr/candidates/:id — Candidate 360 view
router.get('/candidates/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(`SELECT * FROM employee_candidates WHERE id = $1`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/hr/candidates/:id/interview — Update interview status and feedback
router.post('/candidates/:id/interview', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { interview_status, interview_date, interview_feedback, interview_rating } = req.body;

    const { rows } = await query(
      `UPDATE employee_candidates 
       SET interview_status = $1, interview_date = $2, interview_feedback = $3, interview_rating = $4, interviewer_id = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [interview_status || 'INTERVIEWED', interview_date || new Date(), interview_feedback, interview_rating, req.user.id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    res.json({ success: true, message: 'Interview details updated', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/hr/candidates/:id/select — Select candidate & generate Employee ID
router.post('/candidates/:id/select', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { offered_salary, offered_designation, offered_department, expected_joining_date, employment_type = 'Full-time' } = req.body;

    if (!offered_salary || !offered_designation || !offered_department) {
      return res.status(400).json({ success: false, message: 'Offered salary, designation, and department are required' });
    }

    const candRes = await query(`SELECT * FROM employee_candidates WHERE id = $1`, [id]);
    if (candRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }
    const candidate = candRes.rows[0];

    // Check if user already exists
    let userRes = await query(`SELECT id FROM users WHERE mobile = $1 OR email = $2`, [candidate.mobile_number, candidate.email_id]);
    let userId = null;

    const employee_id = await generateEmployeeId(offered_designation);

    // Generate readable temporary password
    const tempPassword = `GKP@${Math.floor(100000 + Math.random() * 900000)}`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      await query(
        `UPDATE users SET role = 'EMPLOYEE', status = 'active', password_hash = $1, designation = $2, department = $3, employee_id = $4, must_change_password = true WHERE id = $5`,
        [hashedPassword, offered_designation, offered_department, employee_id, userId]
      );
    } else {
      const newUser = await query(
        `INSERT INTO users (full_name, mobile, email, role, status, employee_id, designation, department, password_hash, must_change_password)
         VALUES ($1, $2, $3, 'EMPLOYEE', 'active', $4, $5, $6, $7, true) RETURNING id`,
        [candidate.full_name, candidate.mobile_number, candidate.email_id, employee_id, offered_designation, offered_department, hashedPassword]
      );
      userId = newUser.rows[0].id;
    }

    // Create Employee record
    const empInsert = await query(
      `INSERT INTO employees (
        employee_id, user_id, candidate_id, full_name, mobile_number, email_id,
        date_of_birth, current_address, designation, department, joining_date,
        employment_type, offered_salary, recruitment_source, interviewer_id,
        interview_feedback, interview_result, employee_status, activation_status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15,
        $16, 'SELECTED', 'ONBOARDING', 'PENDING', $17
      ) ON CONFLICT (user_id) DO UPDATE SET designation = EXCLUDED.designation RETURNING *`,
      [
        employee_id, userId, id, candidate.full_name, candidate.mobile_number, candidate.email_id,
        candidate.date_of_birth, candidate.current_address, offered_designation, offered_department, expected_joining_date || new Date(),
        employment_type, offered_salary, candidate.how_did_you_hear || 'Career Portal', req.user.id,
        candidate.interview_feedback, req.user.id
      ]
    );

    const createdEmp = empInsert.rows[0];

    // Create Onboarding Checklist
    await query(
      `INSERT INTO employee_onboarding_checklist (
        employee_id, interview_completed, interview_completed_at, employee_created, employee_created_at, overall_progress, current_stage
      ) VALUES ($1, true, NOW(), true, NOW(), 20, 'JOINING_FORM_PENDING')
      ON CONFLICT (employee_id) DO NOTHING`,
      [createdEmp.id]
    );

    // Update candidate status & selection details
    await query(
      `UPDATE employee_candidates 
       SET interview_status = 'EMPLOYEE_CREATED', 
           converted_to_employee_id = $1, 
           conversion_date = NOW(),
           offered_salary = $2,
           offered_designation = $3,
           offered_department = $4,
           expected_joining_date = $5,
           employee_id = $6
       WHERE id = $7`,
      [userId, offered_salary, offered_designation, offered_department, expected_joining_date || null, employee_id, id]
    );

    // Send invitation email and SMS to candidate with credentials & login instructions
    try {
      if (candidate.email_id) {
        sendEmployeeInvitationEmail({
          email: candidate.email_id,
          fullName: candidate.full_name,
          employeeId: employee_id,
          tempPassword,
          mobileNumber: candidate.mobile_number
        }).catch(e => console.warn(`[INVITE-EMAIL] Failed to send employee invitation email: ${e.message}`));
      }

      if (candidate.mobile_number) {
        sendEmployeeInviteSms(candidate.mobile_number, employee_id, tempPassword, 'https://gharkapaisa.in/login')
          .catch(e => console.warn(`[INVITE-SMS] Failed to send employee invitation SMS: ${e.message}`));
      }
    } catch (inviteErr) {
      console.warn(`[INVITE-WARN] Invitation dispatch error: ${inviteErr.message}`);
    }

    res.json({
      success: true,
      message: `Candidate selected! Employee ID generated: ${employee_id}. Temporary Password sent via Mobile SMS & Email.`,
      data: {
        employee_id,
        temp_password: tempPassword,
        employee_record: createdEmp
      }
    });

  } catch (err) {
    next(err);
  }
});

// POST /api/v1/hr/candidates/:id/reject — Reject candidate
router.post('/candidates/:id/reject', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    const { rows } = await query(
      `UPDATE employee_candidates 
       SET interview_status = 'REJECTED', rejection_reason = $1, rejection_date = NOW(), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [rejection_reason || 'Not meeting selection criteria', id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    res.json({ success: true, message: 'Candidate status updated to Rejected', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/hr/employees — List all employees
router.get('/employees', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT e.*, c.overall_progress, c.current_stage 
      FROM employees e
      LEFT JOIN employee_onboarding_checklist c ON c.employee_id = e.id
      ORDER BY e.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/hr/kyc/pending — List pending employee KYC submissions
router.get('/kyc/pending', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT k.*, e.employee_id as emp_code, e.full_name, e.mobile_number, e.designation 
      FROM employee_kyc k
      JOIN employees e ON e.id = k.employee_id
      WHERE k.kyc_status IN ('SUBMITTED', 'UNDER_REVIEW', 'PENDING')
      ORDER BY k.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/hr/kyc/:id/verify — Verify or Reject employee KYC
router.post('/kyc/:id/verify', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { kyc_status, review_notes, pan_verified, aadhaar_verified, bank_verified } = req.body;

    const { rows } = await query(
      `UPDATE employee_kyc 
       SET kyc_status = $1, review_notes = $2, pan_verified = $3, aadhaar_verified = $4, bank_verified = $5, reviewed_by = $6, reviewed_at = NOW()
       WHERE id = $7 RETURNING *`,
      [kyc_status || 'VERIFIED', review_notes, pan_verified !== false, aadhaar_verified !== false, bank_verified !== false, req.user.id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'KYC record not found' });
    }

    if (kyc_status === 'VERIFIED') {
      await query(
        `UPDATE employee_onboarding_checklist SET kyc_verified = true, kyc_verified_at = NOW(), overall_progress = 80 WHERE employee_id = $1`,
        [rows[0].employee_id]
      );
    }

    res.json({ success: true, message: 'KYC verification updated', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
