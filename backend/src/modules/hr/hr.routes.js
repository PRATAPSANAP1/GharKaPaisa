const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');
const roleCheck = require('../../middleware/authorization/role.middleware');
const logger = require('../../config/logger');

// HR Endpoints protected by auth and role (HR, ADMIN, SUPER_ADMIN)
router.use(jwtAuth);
router.use(roleCheck('HR', 'ADMIN', 'SUPER_ADMIN'));

// Helper: Generate Employee ID (e.g. EMP10001)
async function generateEmployeeId() {
  const { rows } = await query(`SELECT nextval('employee_id_seq') as seq`);
  const seqNum = rows[0]?.seq || Math.floor(10000 + Math.random() * 90000);
  return `EMP${seqNum}`;
}

// GET /api/v1/hr/candidates — List candidate applications with search and filters
router.get('/candidates', async (req, res, next) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    let queryStr = `SELECT * FROM employee_candidates WHERE 1=1`;
    const params = [];

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
    const countRes = await query(`SELECT COUNT(*) FROM employee_candidates`);

    res.json({
      success: true,
      data: rows,
      total: parseInt(countRes.rows[0].count)
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/hr/candidates/stats — Candidate summary metrics
router.get('/candidates/stats', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT 
        COUNT(*) as total_candidates,
        COUNT(*) FILTER (WHERE interview_status = 'REGISTERED') as registered,
        COUNT(*) FILTER (WHERE interview_status = 'INTERVIEW_PENDING') as interview_pending,
        COUNT(*) FILTER (WHERE interview_status = 'SELECTED') as selected,
        COUNT(*) FILTER (WHERE interview_status = 'REJECTED') as rejected,
        COUNT(*) FILTER (WHERE interview_status = 'EMPLOYEE_CREATED') as converted
      FROM employee_candidates
    `);
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

    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      await query(`UPDATE users SET role = 'EMPLOYEE', designation = $1, department = $2 WHERE id = $3`, [offered_designation, offered_department, userId]);
    } else {
      const empIdCode = await generateEmployeeId();
      const newUser = await query(
        `INSERT INTO users (full_name, mobile, email, role, status, employee_id, designation, department)
         VALUES ($1, $2, $3, 'EMPLOYEE', 'active', $4, $5, $6) RETURNING id`,
        [candidate.full_name, candidate.mobile_number, candidate.email_id, empIdCode, offered_designation, offered_department]
      );
      userId = newUser.rows[0].id;
    }

    const employee_id = await generateEmployeeId();

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

    // Update candidate status
    await query(
      `UPDATE employee_candidates SET interview_status = 'EMPLOYEE_CREATED', converted_to_employee_id = $1, conversion_date = NOW() WHERE id = $2`,
      [userId, id]
    );

    res.json({
      success: true,
      message: `Candidate selected successfully! Employee ID generated: ${employee_id}`,
      data: {
        employee_id,
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
