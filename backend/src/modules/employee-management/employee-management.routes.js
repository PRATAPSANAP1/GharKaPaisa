const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');
const roleCheck = require('../../middleware/authorization/role.middleware');
const logger = require('../../config/logger');

// Protect routes: Super Admin and Admin only
router.use(jwtAuth);
router.use(roleCheck('SUPER_ADMIN', 'ADMIN'));

// Helper function to sync registered candidates and ensure initial demo employees exist
async function syncAndSeedEmployees() {
  try {
    // 1. Sync candidates from employee_candidates into users table
    await query(`
      INSERT INTO users (full_name, mobile, email, role, status, employee_id, designation, department, password_hash)
      SELECT 
        c.full_name, TRIM(c.mobile_number), LOWER(TRIM(c.email_id)), 'EMPLOYEE', 'active', 
        REPLACE(COALESCE(c.reference_code, 'CAND10001'), 'CAND', 'EMP'), COALESCE(c.target_role, 'TC'), 'Sales & Support',
        '$2a$10$e8w.oF/9Z9sK.9J0U.Y0c.Z0/0.0.0.0.0.0.0.0.0.0'
      FROM employee_candidates c
      WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.mobile = TRIM(c.mobile_number) OR LOWER(u.email) = LOWER(TRIM(c.email_id)))
      ON CONFLICT (mobile) DO NOTHING
    `).catch(e => logger.warn('User candidate sync note:', e.message));

    // 2. Sync candidates into employees table
    await query(`
      INSERT INTO employees (
        employee_id, user_id, candidate_id, full_name, mobile_number, email_id,
        date_of_birth, current_address, designation, department, joining_date,
        employment_type, offered_salary, recruitment_source, employee_status, activation_status
      )
      SELECT 
        REPLACE(COALESCE(c.reference_code, 'CAND10001'), 'CAND', 'EMP'), u.id, c.id, c.full_name, TRIM(c.mobile_number), LOWER(TRIM(c.email_id)),
        c.date_of_birth, c.current_address, COALESCE(c.target_role, 'TC'), 'Sales & Support', CURRENT_DATE,
        COALESCE(c.experience_type, 'Full-time'), COALESCE(c.expected_salary, 18000), COALESCE(c.how_did_you_hear, 'Career Portal'),
        'ONBOARDING', 'PENDING'
      FROM employee_candidates c
      LEFT JOIN users u ON (u.mobile = TRIM(c.mobile_number) OR LOWER(u.email) = LOWER(TRIM(c.email_id)))
      WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.candidate_id = c.id OR e.mobile_number = TRIM(c.mobile_number))
      ON CONFLICT (mobile_number) DO NOTHING
    `).catch(e => logger.warn('Employee candidate sync note:', e.message));

    // 3. Create checklist records for synced employees
    await query(`
      INSERT INTO employee_onboarding_checklist (employee_id, interview_completed, employee_created, overall_progress, current_stage)
      SELECT e.id, true, true, 20, 'JOINING_FORM_PENDING'
      FROM employees e
      WHERE NOT EXISTS (SELECT 1 FROM employee_onboarding_checklist ch WHERE ch.employee_id = e.id)
      ON CONFLICT (employee_id) DO NOTHING
    `).catch(e => logger.warn('Checklist sync note:', e.message));

    // 4. Seed initial employees if total count is 0
    const checkEmp = await query(`SELECT COUNT(*) FROM employees`);
    if (parseInt(checkEmp.rows[0].count) === 0) {
      const seedData = [
        { emp_id: 'EMP10001', name: 'Rahul Sharma', mobile: '9876543210', email: 'rahul.sharma@gharkapaisa.in', desg: 'Manager', dept: 'Operations & Management', salary: 65000, status: 'ACTIVE', act: 'APPROVED' },
        { emp_id: 'EMP10002', name: 'Priya Patel', mobile: '9876543211', email: 'priya.patel@gharkapaisa.in', desg: 'Team Leader', dept: 'Sales & Distribution', salary: 45000, status: 'ACTIVE', act: 'APPROVED' },
        { emp_id: 'EMP10003', name: 'Amit Kumar', mobile: '9876543212', email: 'amit.kumar@gharkapaisa.in', desg: 'TC', dept: 'Telecalling Support', salary: 22000, status: 'ONBOARDING', act: 'PENDING' },
        { emp_id: 'EMP10004', name: 'Sneha Verma', mobile: '9876543213', email: 'sneha.verma@gharkapaisa.in', desg: 'TC', dept: 'Customer Support', salary: 20000, status: 'ONBOARDING', act: 'PENDING' }
      ];

      for (const s of seedData) {
        let uId = null;
        const userRes = await query(
          `INSERT INTO users (full_name, mobile, email, role, status, employee_id, designation, department, password_hash)
           VALUES ($1, $2, $3, 'EMPLOYEE', 'active', $4, $5, $6, '$2a$10$e8w.oF/9Z9sK.9J0U.Y0c.Z0/0.0.0.0.0.0.0.0.0.0')
           ON CONFLICT (mobile) DO UPDATE SET employee_id = EXCLUDED.employee_id RETURNING id`,
          [s.name, s.mobile, s.email, s.emp_id, s.desg, s.dept]
        ).catch(() => null);

        uId = userRes?.rows?.[0]?.id;
        if (!uId) {
          const uFind = await query(`SELECT id FROM users WHERE mobile = $1 OR email = $2`, [s.mobile, s.email]);
          uId = uFind.rows[0]?.id;
        }

        if (uId) {
          let eId = null;
          const empRes = await query(
            `INSERT INTO employees (employee_id, user_id, full_name, mobile_number, email_id, designation, department, joining_date, employment_type, offered_salary, employee_status, activation_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, 'Full-time', $8, $9, $10)
             ON CONFLICT (mobile_number) DO UPDATE SET full_name = EXCLUDED.full_name RETURNING id`,
            [s.emp_id, uId, s.name, s.mobile, s.email, s.desg, s.dept, s.salary, s.status, s.act]
          ).catch(() => null);

          eId = empRes?.rows?.[0]?.id;
          if (!eId) {
            const eFind = await query(`SELECT id FROM employees WHERE mobile_number = $1 OR email_id = $2`, [s.mobile, s.email]);
            eId = eFind.rows[0]?.id;
          }

          if (eId) {
            await query(
              `INSERT INTO employee_onboarding_checklist (employee_id, interview_completed, employee_created, joining_form_completed, kyc_submitted, terms_completed, overall_progress, current_stage)
               VALUES ($1, true, true, $2, $3, $4, $5, $6) ON CONFLICT (employee_id) DO NOTHING`,
              [eId, s.act === 'APPROVED', s.act === 'APPROVED', s.act === 'APPROVED', s.act === 'APPROVED' ? 100 : 20, s.act === 'APPROVED' ? 'ACTIVE' : 'JOINING_FORM_PENDING']
            );
          }
        }
      }
    }
  } catch (err) {
    logger.warn('syncAndSeedEmployees error:', err.message);
  }
}

// GET /api/v1/employees — List all employees with rich search and filtering
router.get('/', async (req, res, next) => {
  try {
    await syncAndSeedEmployees();

    const { status, activation_status, designation, search, limit = 200, offset = 0 } = req.query;
    let queryStr = `
      SELECT 
        e.*,
        c.overall_progress, c.current_stage, c.kyc_verified, c.terms_completed,
        h.team_leader_id, h.manager_id, h.hierarchy_level,
        tl.full_name as team_leader_name,
        mgr.full_name as manager_name,
        (SELECT COUNT(*) FROM employee_product_links pl WHERE pl.employee_id = e.id AND pl.status = 'ACTIVE') as active_links_count,
        (SELECT COUNT(*) FROM applications app WHERE app.employee_id = e.id) as total_applications,
        (SELECT COALESCE(SUM(amount), 0) FROM employee_incentive_transactions it WHERE it.employee_id = e.id AND it.status = 'COMPLETED') as total_incentives_earned
      FROM employees e
      LEFT JOIN employee_onboarding_checklist c ON c.employee_id = e.id
      LEFT JOIN employee_hierarchy h ON h.employee_id = e.id AND h.is_active = true
      LEFT JOIN employees tl ON tl.id = h.team_leader_id
      LEFT JOIN employees mgr ON mgr.id = h.manager_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      queryStr += ` AND e.employee_status = $${params.length}`;
    }

    if (activation_status) {
      params.push(activation_status);
      queryStr += ` AND e.activation_status = $${params.length}`;
    }

    if (designation) {
      params.push(designation);
      queryStr += ` AND e.designation = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      queryStr += ` AND (e.full_name ILIKE $${params.length} OR e.employee_id ILIKE $${params.length} OR e.mobile_number ILIKE $${params.length} OR e.email_id ILIKE $${params.length})`;
    }

    queryStr += ` ORDER BY e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await query(queryStr, params);
    const countRes = await query(`SELECT COUNT(*) FROM employees`);

    res.json({
      success: true,
      data: rows,
      total: parseInt(countRes.rows[0].count)
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/employees/stats — Global employee metrics for dashboard
router.get('/stats', async (req, res, next) => {
  try {
    await syncAndSeedEmployees();

    const { rows } = await query(`
      SELECT 
        COUNT(*) as total_employees,
        COUNT(*) FILTER (WHERE employee_status = 'ACTIVE') as active_employees,
        COUNT(*) FILTER (WHERE employee_status = 'ONBOARDING') as onboarding_employees,
        COUNT(*) FILTER (WHERE activation_status = 'PENDING') as pending_activation,
        COUNT(*) FILTER (WHERE designation = 'Manager') as total_managers,
        COUNT(*) FILTER (WHERE designation = 'Team Leader') as total_tls,
        COUNT(*) FILTER (WHERE designation = 'TC') as total_tcs
      FROM employees
    `);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/employees/:id — Complete Employee 360 view
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 1. Employee profile
    const empRes = await query(`
      SELECT e.*, c.resume_url, c.pan_number as cand_pan, c.aadhaar_number as cand_aadhaar, c.bank_account_number as cand_bank, c.ifsc_code as cand_ifsc
      FROM employees e
      LEFT JOIN employee_candidates c ON c.id = e.candidate_id OR c.mobile_number = e.mobile_number
      WHERE e.id = $1
    `, [id]);

    if (empRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    const employee = empRes.rows[0];

    // 2. Joining details (check by employee_id or mobile_number)
    const joiningRes = await query(
      `SELECT * FROM employee_joining_details WHERE employee_id = $1 OR mobile_number = $2 ORDER BY created_at DESC LIMIT 1`,
      [id, employee.mobile_number]
    );

    // 3. KYC details (check by employee_id or mobile_number)
    const kycRes = await query(
      `SELECT * FROM employee_kyc WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [id]
    );

    let kycData = kycRes.rows[0] || null;

    if (!kycData) {
      const joiningData = joiningRes.rows[0] || {};
      if (joiningData.pan_number || joiningData.aadhaar_number || joiningData.bank_account_number || employee.cand_pan || employee.cand_aadhaar || employee.cand_bank) {
        kycData = {
          pan_number: joiningData.pan_number || employee.cand_pan || null,
          pan_document_url: null,
          aadhaar_number: joiningData.aadhaar_number || employee.cand_aadhaar || null,
          aadhaar_document_url: null,
          bank_account_number: joiningData.bank_account_number || employee.cand_bank || null,
          ifsc_code: joiningData.ifsc_code || employee.cand_ifsc || null,
          bank_document_url: null,
          kyc_status: 'SUBMITTED'
        };
      }
    }

    // 4. Documents (check employee_documents, plus add candidate resume if present)
    const docsRes = await query(
      `SELECT * FROM employee_documents WHERE employee_id = $1 OR mobile_number = $2 ORDER BY uploaded_at DESC`,
      [id, employee.mobile_number]
    );
    let docs = docsRes.rows;
    if (employee.resume_url && !docs.some(d => d.document_type === 'resume')) {
      docs.unshift({
        id: 'cand-resume',
        document_type: 'resume',
        document_url: employee.resume_url,
        document_file_name: 'Candidate_Resume.pdf',
        verification_status: 'VERIFIED'
      });
    }

    // 5. Terms acceptance
    const termsRes = await query(
      `SELECT * FROM employee_terms_acceptance WHERE employee_id = $1 ORDER BY accepted_at DESC LIMIT 1`,
      [id]
    );

    // 6. Onboarding checklist
    const checklistRes = await query(`SELECT * FROM employee_onboarding_checklist WHERE employee_id = $1`, [id]);
    // 7. Hierarchy
    const hierarchyRes = await query(`
      SELECT h.*, tl.full_name as team_leader_name, mgr.full_name as manager_name
      FROM employee_hierarchy h
      LEFT JOIN employees tl ON tl.id = h.team_leader_id
      LEFT JOIN employees mgr ON mgr.id = h.manager_id
      WHERE h.employee_id = $1 AND h.is_active = true
    `, [id]);

    // 8. Product links assigned
    const linksRes = await query(`
      SELECT pl.*, p.name as product_name, p.category, p.logo, b.name as bank_name
      FROM employee_product_links pl
      JOIN products p ON p.id = pl.product_id
      LEFT JOIN banks b ON b.id = p.bank_id
      WHERE pl.employee_id = $1
    `, [id]);

    // 9. Incentives summary
    const incRes = await query(`
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE status = 'COMPLETED'), 0) as total_earned,
        COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0) as pending_incentives,
        COUNT(*) as total_transactions
      FROM employee_incentive_transactions
      WHERE employee_id = $1
    `, [id]);

    res.json({
      success: true,
      data: {
        employee,
        joining_details: joiningRes.rows[0] || null,
        kyc: kycData,
        documents: docs,
        terms: termsRes.rows[0] || null,
        checklist: checklistRes.rows[0] || null,
        hierarchy: hierarchyRes.rows[0] || null,
        product_links: linksRes.rows,
        incentives_summary: incRes.rows[0]
      }
    });

  } catch (err) {
    next(err);
  }
});

// POST /api/v1/employees/:id/activate — Super Admin Activate / Deactivate Employee
router.post('/:id/activate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activation_status, employee_status } = req.body;

    const newActivation = activation_status || 'APPROVED';
    const newStatus = employee_status || (newActivation === 'APPROVED' ? 'ACTIVE' : 'INACTIVE');

    const { rows } = await query(
      `UPDATE employees 
       SET activation_status = $1, employee_status = $2, activated_at = NOW(), activated_by = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [newActivation, newStatus, req.user.id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Update onboarding checklist
    if (newActivation === 'APPROVED') {
      await query(
        `UPDATE employee_onboarding_checklist SET activated = true, activated_at = NOW(), overall_progress = 100, current_stage = 'ACTIVE' WHERE employee_id = $1`,
        [id]
      );
    }

    res.json({ success: true, message: `Employee activation updated to ${newActivation}`, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/employees/:id/kyc-verify — Super Admin & HR Approve or Reject Employee KYC
router.post('/:id/kyc-verify', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { kyc_status, review_notes } = req.body; // 'VERIFIED' or 'REJECTED'

    if (!kyc_status || !['VERIFIED', 'REJECTED'].includes(kyc_status)) {
      return res.status(400).json({ success: false, message: 'Status must be VERIFIED or REJECTED' });
    }

    const isVerified = kyc_status === 'VERIFIED';

    // Update employee_kyc table
    await query(
      `INSERT INTO employee_kyc (employee_id, kyc_status, reviewed_by, reviewed_at, review_notes, updated_at)
       VALUES ($1, $2, $3, NOW(), $4, NOW())
       ON CONFLICT (employee_id) DO UPDATE SET
         kyc_status = EXCLUDED.kyc_status,
         reviewed_by = EXCLUDED.reviewed_by,
         reviewed_at = NOW(),
         review_notes = EXCLUDED.review_notes,
         updated_at = NOW()`,
      [id, kyc_status, req.user.id, review_notes || null]
    );

    // Update onboarding checklist
    await query(
      `UPDATE employee_onboarding_checklist 
       SET kyc_verified = $1, kyc_verified_at = $2, 
           overall_progress = $3, 
           current_stage = $4 
       WHERE employee_id = $5`,
      [isVerified, isVerified ? new Date() : null, isVerified ? 90 : 75, isVerified ? 'VERIFIED_PENDING_ACTIVATION' : 'KYC_REJECTED', id]
    );

    // Update employee activation status if verified
    if (isVerified) {
      await query(
        `UPDATE employees SET activation_status = 'APPROVED', employee_status = 'ACTIVE', activated_at = NOW() WHERE id = $1`,
        [id]
      );
    }

    res.json({ success: true, message: `Employee KYC marked as ${kyc_status}`, status: kyc_status });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/employees/:id/hierarchy — Assign Manager & Team Leader
router.post('/:id/hierarchy', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { team_leader_id, manager_id, hierarchy_level } = req.body;

    if (!hierarchy_level) {
      return res.status(400).json({ success: false, message: 'Hierarchy level is required (MANAGER, TEAM_LEADER, TC)' });
    }

    // Deactivate previous active hierarchy
    await query(`UPDATE employee_hierarchy SET is_active = false WHERE employee_id = $1`, [id]);

    const { rows } = await query(
      `INSERT INTO employee_hierarchy (employee_id, team_leader_id, manager_id, hierarchy_level, assigned_by, is_active)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
      [id, team_leader_id || null, manager_id || null, hierarchy_level.toUpperCase(), req.user.id]
    );

    res.json({ success: true, message: 'Employee hierarchy assigned successfully', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/employees/:id/product-links — Assign product link to an employee
router.post('/:id/product-links', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { product_id, employee_referral_url, incentive_amount, incentive_type = 'FIXED', status = 'ACTIVE' } = req.body;

    if (!product_id || !incentive_amount) {
      return res.status(400).json({ success: false, message: 'Product ID and incentive amount are required' });
    }

    // Fetch employee and product details for URL construction fallback
    const empRes = await query(`SELECT employee_id FROM employees WHERE id = $1`, [id]);
    if (empRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    const empCode = empRes.rows[0].employee_id;

    const prodRes = await query(`SELECT id, name, public_url FROM products WHERE id = $1`, [product_id]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const product = prodRes.rows[0];

    const generatedUrl = employee_referral_url || `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/apply/${product_id}?emp=${empCode}`;

    const { rows } = await query(
      `INSERT INTO employee_product_links (
        employee_id, product_id, employee_referral_url, incentive_amount, incentive_type, status, assigned_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (employee_id, product_id) DO UPDATE 
      SET employee_referral_url = EXCLUDED.employee_referral_url,
          incentive_amount = EXCLUDED.incentive_amount,
          incentive_type = EXCLUDED.incentive_type,
          status = EXCLUDED.status,
          updated_at = NOW()
      RETURNING *`,
      [id, product_id, generatedUrl, parseFloat(incentive_amount), incentive_type, status, req.user.id]
    );

    // Update onboarding checklist
    await query(
      `UPDATE employee_onboarding_checklist SET links_assigned = true, links_assigned_at = NOW() WHERE employee_id = $1`,
      [id]
    );

    res.json({ success: true, message: 'Employee product link assigned successfully', data: rows[0] });

  } catch (err) {
    next(err);
  }
});

// POST /api/v1/employees/bulk-product-links — Bulk assign product links to employees
router.post('/bulk-product-links', async (req, res, next) => {
  try {
    const { employee_ids, product_id, incentive_amount, incentive_type = 'FIXED' } = req.body;

    if (!Array.isArray(employee_ids) || employee_ids.length === 0 || !product_id || !incentive_amount) {
      return res.status(400).json({ success: false, message: 'Employee IDs array, Product ID, and incentive amount are required' });
    }

    const assigned = [];
    for (const empId of employee_ids) {
      const empRes = await query(`SELECT employee_id FROM employees WHERE id = $1`, [empId]);
      if (empRes.rows.length === 0) continue;
      const empCode = empRes.rows[0].employee_id;
      const referralUrl = `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/apply/${product_id}?emp=${empCode}`;

      const { rows } = await query(
        `INSERT INTO employee_product_links (
          employee_id, product_id, employee_referral_url, incentive_amount, incentive_type, status, assigned_by
        ) VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6)
        ON CONFLICT (employee_id, product_id) DO UPDATE 
        SET employee_referral_url = EXCLUDED.employee_referral_url,
            incentive_amount = EXCLUDED.incentive_amount,
            incentive_type = EXCLUDED.incentive_type,
            status = 'ACTIVE',
            updated_at = NOW()
        RETURNING *`,
        [empId, product_id, referralUrl, parseFloat(incentive_amount), incentive_type, req.user.id]
      );
      if (rows[0]) assigned.push(rows[0]);
    }

    res.json({ success: true, message: `Product links assigned to ${assigned.length} employees`, data: assigned });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
