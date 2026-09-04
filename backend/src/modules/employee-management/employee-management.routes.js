const express = require('express');
const router = express.Router();
const { query, getClient } = require('../../config/database');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');
const roleCheck = require('../../middleware/authorization/role.middleware');
const logger = require('../../config/logger');
const { getSignedDownloadUrl } = require('../../services/aws/s3.service');

// Helper to convert raw S3 URLs/Keys into presigned S3 download URLs
const resolveS3Url = async (urlOrKey) => {
  if (!urlOrKey || typeof urlOrKey !== 'string') return urlOrKey;
  if (urlOrKey.includes('X-Amz-Signature') || urlOrKey.includes('X-Amz-Algorithm')) {
    return urlOrKey;
  }
  let key = urlOrKey;
  if (key.includes('.amazonaws.com/')) {
    key = key.split('.amazonaws.com/')[1];
  } else if (key.startsWith('http://') || key.startsWith('https://')) {
    const parts = key.split('/');
    key = parts.slice(3).join('/');
  }
  key = key.replace(/^\//, '');
  if (!key) return urlOrKey;

  try {
    const signedUrl = await getSignedDownloadUrl(key, 86400); // 24 hours validity
    return signedUrl;
  } catch (err) {
    logger.warn(`Failed to generate signed S3 URL for key "${key}": ${err.message}`);
    return urlOrKey;
  }
};

// Protect routes: Super Admin and Admin only
router.use(jwtAuth);
router.use(roleCheck('SUPER_ADMIN', 'ADMIN'));

// Helper function to sync registered candidates and ensure initial demo employees exist
async function syncAndSeedEmployees() {
  try {
    // Ensure 5-level hierarchy columns exist on employee_hierarchy table
    await query(`ALTER TABLE employee_hierarchy ADD COLUMN IF NOT EXISTS senior_manager_id UUID REFERENCES employees(id)`).catch(() => {});
    await query(`ALTER TABLE employee_hierarchy ADD COLUMN IF NOT EXISTS branch_head_id UUID REFERENCES employees(id)`).catch(() => {});

    // Ensure Employee Bank Assignment & Bonus Rules tables exist
    await query(`
      CREATE TABLE IF NOT EXISTS employee_bank_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
        assigned_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(employee_id, bank_id)
      )
    `).catch(() => {});

    await query(`
      CREATE TABLE IF NOT EXISTS employee_bonus_rules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        target_count INTEGER NOT NULL DEFAULT 0,
        bonus_per_card DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch(() => {});

    await query(`
      CREATE TABLE IF NOT EXISTS employee_bonus_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
        application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
        bonus_rule_id UUID REFERENCES employee_bonus_rules(id) ON DELETE CASCADE,
        bonus_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'EARNED',
        earned_at TIMESTAMPTZ DEFAULT NOW(),
        paid_at TIMESTAMPTZ,
        UNIQUE(application_id, bonus_rule_id)
      )
    `).catch(() => {});

    // 1. Sync candidates from employee_candidates into users table
    await query(`
      INSERT INTO users (full_name, mobile, email, role, status, employee_id, designation, department, password_hash)
      SELECT 
        c.full_name, TRIM(c.mobile_number), LOWER(TRIM(c.email_id)), 'EMPLOYEE', 'active', 
        COALESCE(c.employee_id, 'YOH-SE' || FLOOR(1000 + RANDOM() * 9000)::text), COALESCE(c.offered_designation, c.target_role, 'TC'), 'Sales & Support',
        '$2a$10$e8w.oF/9Z9sK.9J0U.Y0c.Z0/0.0.0.0.0.0.0.0.0.0'
      FROM employee_candidates c
      WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.mobile = TRIM(c.mobile_number) OR (u.email IS NOT NULL AND LOWER(u.email) = LOWER(TRIM(c.email_id))))
      ON CONFLICT (mobile) DO UPDATE SET role = 'EMPLOYEE'
    `).catch(e => logger.warn('User candidate sync note:', e.message));

    // 2. Sync candidates into employees table
    await query(`
      INSERT INTO employees (
        employee_id, user_id, candidate_id, full_name, mobile_number, email_id,
        date_of_birth, current_address, designation, department, joining_date,
        employment_type, offered_salary, recruitment_source, employee_status, activation_status
      )
      SELECT 
        COALESCE(u.employee_id, c.employee_id, 'YOH-SE' || FLOOR(1000 + RANDOM() * 9000)::text), u.id, c.id, c.full_name, TRIM(c.mobile_number), LOWER(TRIM(c.email_id)),
        c.date_of_birth, c.current_address, COALESCE(c.offered_designation, c.target_role, 'TC'), 'Sales & Support', CURRENT_DATE,
        COALESCE(c.experience_type, 'Full-time'), COALESCE(c.offered_salary, c.expected_salary, 18000), COALESCE(c.how_did_you_hear, 'Career Portal'),
        'ONBOARDING', 'PENDING'
      FROM employee_candidates c
      LEFT JOIN users u ON (u.mobile = TRIM(c.mobile_number) OR (u.email IS NOT NULL AND LOWER(u.email) = LOWER(TRIM(c.email_id))))
      WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.candidate_id = c.id OR e.mobile_number = TRIM(c.mobile_number))
      ON CONFLICT (mobile_number) DO UPDATE SET user_id = EXCLUDED.user_id
    `).catch(e => logger.warn('Employee candidate sync note:', e.message));

    // 3. Ensure hr_profiles table exists and sync HR users
    await query(`
      CREATE TABLE IF NOT EXISTS hr_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        mobile_number VARCHAR(20) NOT NULL,
        designation VARCHAR(100) DEFAULT 'HR Manager',
        department VARCHAR(100) DEFAULT 'Human Resources',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `).catch(() => {});

    await query(`
      INSERT INTO hr_profiles (user_id, employee_id, full_name, email, mobile_number, designation, department, status)
      SELECT 
        u.id, 
        COALESCE(u.employee_id, 'YOH-HR' || FLOOR(1000 + RANDOM() * 9000)::text), 
        u.full_name, 
        LOWER(TRIM(u.email)), 
        TRIM(u.mobile), 
        COALESCE(u.designation, 'HR Manager'), 
        COALESCE(u.department, 'Human Resources'), 
        'active'
      FROM users u
      WHERE u.role = 'HR'
        AND NOT EXISTS (SELECT 1 FROM hr_profiles hp WHERE hp.user_id = u.id OR hp.mobile_number = TRIM(u.mobile))
      ON CONFLICT DO NOTHING;
    `).catch(e => logger.warn('HR sync note:', e.message));

    // Remove any HR records from employees table so they do not show on super-admin/employees
    const hrEmpSubquery = `SELECT id FROM employees WHERE user_id IN (SELECT id FROM users WHERE role = 'HR') OR designation ILIKE '%HR%' OR designation ILIKE '%Human Resource%'`;
    await query(`DELETE FROM employee_onboarding_checklist WHERE employee_id IN (${hrEmpSubquery})`).catch(() => {});
    await query(`DELETE FROM employee_hierarchy WHERE employee_id IN (${hrEmpSubquery}) OR team_leader_id IN (${hrEmpSubquery}) OR manager_id IN (${hrEmpSubquery})`).catch(() => {});
    await query(`DELETE FROM employee_joining_details WHERE employee_id IN (${hrEmpSubquery})`).catch(() => {});
    await query(`DELETE FROM employee_kyc WHERE employee_id IN (${hrEmpSubquery})`).catch(() => {});
    await query(`DELETE FROM employee_documents WHERE employee_id IN (${hrEmpSubquery})`).catch(() => {});
    await query(`DELETE FROM employee_terms_acceptance WHERE employee_id IN (${hrEmpSubquery})`).catch(() => {});
    await query(`DELETE FROM employee_product_links WHERE employee_id IN (${hrEmpSubquery})`).catch(() => {});
    await query(`DELETE FROM employee_incentive_transactions WHERE employee_id IN (${hrEmpSubquery})`).catch(() => {});
    await query(`DELETE FROM employees WHERE id IN (${hrEmpSubquery})`).catch(e => logger.warn('Delete HR employees note:', e.message));

    // 4. Sync non-HR users with role EMPLOYEE into employees table (catches directly registered/created users)
    await query(`
      INSERT INTO employees (
        employee_id, user_id, full_name, mobile_number, email_id,
        designation, department, joining_date, employment_type, offered_salary,
        employee_status, activation_status
      )
      SELECT 
        COALESCE(u.employee_id, 'YOH-SE' || FLOOR(1000 + RANDOM() * 9000)::text), u.id, u.full_name, TRIM(u.mobile), LOWER(TRIM(u.email)),
        COALESCE(u.designation, 'TC'), COALESCE(u.department, 'Sales & Support'), CURRENT_DATE,
        'Full-time', 18000,
        'ONBOARDING', 'PENDING'
      FROM users u
      WHERE u.role = 'EMPLOYEE'
        AND (u.designation IS NULL OR (u.designation NOT ILIKE '%HR%' AND u.designation NOT ILIKE '%Human Resource%'))
        AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.user_id = u.id OR e.mobile_number = TRIM(u.mobile))
      ON CONFLICT (mobile_number) DO UPDATE SET user_id = EXCLUDED.user_id
    `).catch(e => logger.warn('User-to-employee sync note:', e.message));

    // 4. Update users.employee_id from employees table if users.employee_id is null
    await query(`
      UPDATE users u
      SET employee_id = e.employee_id
      FROM employees e
      WHERE e.user_id = u.id AND (u.employee_id IS NULL OR u.employee_id = '')
    `).catch(e => logger.warn('User employee_id sync note:', e.message));

    // 5. Create checklist records for synced employees
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

// GET /api/v1/employees — List all employees with rich search and filtering across 5 hierarchy levels
router.get('/', async (req, res, next) => {
  try {
    await syncAndSeedEmployees();

    const { status, activation_status, designation, search, limit = 200, offset = 0 } = req.query;
    let queryStr = `
      SELECT 
        e.*,
        c.overall_progress, c.current_stage, c.kyc_verified, c.terms_completed,
        h.team_leader_id, h.manager_id, h.senior_manager_id, h.branch_head_id, h.hierarchy_level,
        tl.full_name as team_leader_name,
        mgr.full_name as manager_name,
        sm.full_name as senior_manager_name,
        bh.full_name as branch_head_name,
        (SELECT COUNT(*) FROM employee_product_links pl WHERE pl.employee_id = e.id AND pl.status = 'ACTIVE') as active_links_count,
        (SELECT COUNT(*) FROM applications app WHERE app.employee_id = e.id) as total_applications,
        (SELECT COALESCE(SUM(amount), 0) FROM employee_incentive_transactions it WHERE it.employee_id = e.id AND it.status = 'COMPLETED') as total_incentives_earned
      FROM employees e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN employee_onboarding_checklist c ON c.employee_id = e.id
      LEFT JOIN employee_hierarchy h ON h.employee_id = e.id AND h.is_active = true
      LEFT JOIN employees tl ON tl.id = h.team_leader_id
      LEFT JOIN employees mgr ON mgr.id = h.manager_id
      LEFT JOIN employees sm ON sm.id = h.senior_manager_id
      LEFT JOIN employees bh ON bh.id = h.branch_head_id
      WHERE (u.role IS NULL OR u.role = 'EMPLOYEE')
        AND (e.designation NOT ILIKE '%HR%' AND e.designation NOT ILIKE '%Human Resource%')
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

    // Standardize designations in DB
    await query(`
      UPDATE employees e
      SET designation = CASE 
        WHEN h.hierarchy_level = 'BRANCH_HEAD' THEN 'Branch Head'
        WHEN h.hierarchy_level = 'SENIOR_MANAGER' THEN 'Senior Manager'
        WHEN h.hierarchy_level = 'MANAGER' THEN 'Manager'
        WHEN h.hierarchy_level = 'TEAM_LEADER' THEN 'Team Leader'
        WHEN h.hierarchy_level = 'TC' THEN 'TC'
        ELSE e.designation
      END
      FROM employee_hierarchy h
      WHERE h.employee_id = e.id AND h.is_active = true
    `).catch(() => {});

    if (designation) {
      if (designation === 'TC' || designation === 'Telecaller (TC)' || designation === 'Telecaller') {
        queryStr += ` AND (e.designation = 'TC' OR e.designation ILIKE '%Telecaller%' OR h.hierarchy_level = 'TC')`;
      } else if (designation === 'TL' || designation === 'Team Leader') {
        queryStr += ` AND (e.designation ILIKE '%Team Leader%' OR e.designation = 'TL' OR h.hierarchy_level = 'TEAM_LEADER')`;
      } else if (designation === 'Manager' || designation === 'MANAGER') {
        queryStr += ` AND (e.designation = 'Manager' OR e.designation = 'MANAGER' OR h.hierarchy_level = 'MANAGER')`;
      } else if (designation === 'Senior Manager' || designation === 'SENIOR_MANAGER' || designation === 'SENIOR MANAGER') {
        queryStr += ` AND (e.designation ILIKE '%Senior Manager%' OR e.designation = 'SENIOR MANAGER' OR h.hierarchy_level = 'SENIOR_MANAGER')`;
      } else if (designation === 'Branch Head' || designation === 'BRANCH_HEAD' || designation === 'BRANCH HEAD') {
        queryStr += ` AND (e.designation ILIKE '%Branch Head%' OR e.designation = 'BRANCH HEAD' OR h.hierarchy_level = 'BRANCH_HEAD')`;
      } else {
        params.push(designation);
        queryStr += ` AND e.designation = $${params.length}`;
      }
    }

    if (search) {
      params.push(`%${search}%`);
      queryStr += ` AND (e.full_name ILIKE $${params.length} OR e.employee_id ILIKE $${params.length} OR e.mobile_number ILIKE $${params.length} OR e.email_id ILIKE $${params.length})`;
    }

    queryStr += ` ORDER BY e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await query(queryStr, params);
    const countRes = await query(`
      SELECT COUNT(*) 
      FROM employees e 
      LEFT JOIN users u ON u.id = e.user_id 
      WHERE (u.role IS NULL OR u.role = 'EMPLOYEE')
        AND (e.designation NOT ILIKE '%HR%' AND e.designation NOT ILIKE '%Human Resource%')
    `);

    res.json({
      success: true,
      data: rows,
      total: parseInt(countRes.rows[0].count)
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/employees/stats — Global employee metrics across 5 hierarchy levels
router.get('/stats', async (req, res, next) => {
  try {
    await syncAndSeedEmployees();

    const { rows } = await query(`
      SELECT 
        COUNT(*) as total_employees,
        COUNT(*) FILTER (WHERE e.employee_status = 'ACTIVE') as active_employees,
        COUNT(*) FILTER (WHERE e.employee_status = 'ONBOARDING') as onboarding_employees,
        COUNT(*) FILTER (WHERE e.activation_status = 'PENDING') as pending_activation,
        COUNT(*) FILTER (WHERE e.designation = 'Branch Head' OR h.hierarchy_level = 'BRANCH_HEAD') as total_branch_heads,
        COUNT(*) FILTER (WHERE e.designation = 'Senior Manager' OR h.hierarchy_level = 'SENIOR_MANAGER') as total_senior_managers,
        COUNT(*) FILTER (WHERE e.designation = 'Manager' OR h.hierarchy_level = 'MANAGER') as total_managers,
        COUNT(*) FILTER (WHERE e.designation = 'Team Leader' OR h.hierarchy_level = 'TEAM_LEADER') as total_tls,
        COUNT(*) FILTER (WHERE e.designation = 'TC' OR h.hierarchy_level = 'TC') as total_tcs
      FROM employees e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN employee_hierarchy h ON h.employee_id = e.id AND h.is_active = true
      WHERE (u.role IS NULL OR u.role = 'EMPLOYEE')
        AND (e.designation NOT ILIKE '%HR%' AND e.designation NOT ILIKE '%Human Resource%')
    `);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/employees/assigned-product-links — List assigned employee custom product links
router.get('/assigned-product-links', async (req, res, next) => {
  try {
    const { search, employee_id, bank_id, product_id } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (employee_id) {
      queryParams.push(employee_id);
      whereConditions.push(`pl.employee_id = $${queryParams.length}`);
    }

    if (bank_id) {
      queryParams.push(bank_id);
      whereConditions.push(`p.bank_id = $${queryParams.length}`);
    }

    if (product_id) {
      queryParams.push(product_id);
      whereConditions.push(`pl.product_id = $${queryParams.length}`);
    }

    if (search && search.trim()) {
      queryParams.push(`%${search.trim()}%`);
      const pIdx = queryParams.length;
      whereConditions.push(`(e.full_name ILIKE $${pIdx} OR e.employee_id ILIKE $${pIdx} OR p.name ILIKE $${pIdx} OR b.name ILIKE $${pIdx})`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const { rows } = await query(`
      SELECT 
        pl.*,
        e.full_name as employee_name,
        e.employee_id as emp_code,
        e.mobile_number as employee_mobile,
        e.email_id as employee_email,
        p.name as product_name,
        p.category as product_category,
        p.image_url as product_image,
        b.name as bank_name,
        u.full_name as assigned_by_name
      FROM employee_product_links pl
      JOIN employees e ON e.id = pl.employee_id
      JOIN products p ON p.id = pl.product_id
      LEFT JOIN banks b ON b.id = p.bank_id
      LEFT JOIN users u ON u.id = pl.assigned_by
      ${whereClause}
      ORDER BY pl.updated_at DESC, pl.created_at DESC
    `, queryParams);

    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/employees/assigned-product-links/:id — Unassign employee link
router.delete('/assigned-product-links/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(`DELETE FROM employee_product_links WHERE id = $1 RETURNING *`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assigned link record not found' });
    }
    res.json({ success: true, message: 'Employee custom bank link unassigned successfully' });
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

// POST /api/v1/employees/assign-custom-product-links — Super Admin Assign custom bank links to select employees & products
router.post('/assign-custom-product-links', async (req, res, next) => {
  try {
    let { employee_ids, product_ids, bank_id, custom_bank_url, incentive_amount = 0, status = 'ACTIVE' } = req.body;

    if (!custom_bank_url || !custom_bank_url.trim()) {
      return res.status(400).json({ success: false, message: 'Custom bank link URL is required' });
    }

    // Resolve employee_ids if 'ALL' or array
    let empList = [];
    if (employee_ids === 'ALL' || (Array.isArray(employee_ids) && employee_ids.length === 0)) {
      const allEmps = await query(`SELECT id, employee_id, full_name FROM employees WHERE employee_status != 'TERMINATED'`);
      empList = allEmps.rows;
    } else if (Array.isArray(employee_ids)) {
      const emps = await query(`SELECT id, employee_id, full_name FROM employees WHERE id = ANY($1::uuid[]) OR user_id = ANY($1::uuid[])`, [employee_ids]);
      empList = emps.rows;
    }

    if (empList.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one valid employee must be selected' });
    }

    // Resolve product_ids
    let prodList = [];
    if (Array.isArray(product_ids) && product_ids.length > 0) {
      const prods = await query(`SELECT id, name, bank_id FROM products WHERE id = ANY($1::uuid[])`, [product_ids]);
      prodList = prods.rows;
    } else if (bank_id) {
      const prods = await query(`SELECT id, name, bank_id FROM products WHERE bank_id = $1 AND is_active = true`, [bank_id]);
      prodList = prods.rows;
    }

    if (prodList.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one valid product must be selected' });
    }

    const assignedResults = [];
    const cleanUrl = custom_bank_url.trim();

    for (const emp of empList) {
      for (const prod of prodList) {
        // Support optional dynamic placeholder {emp_code}
        const finalUrl = cleanUrl.replace(/\{emp_code\}/g, emp.employee_id || emp.id);

        const { rows } = await query(
          `INSERT INTO employee_product_links (
            employee_id, product_id, employee_referral_url, incentive_amount, incentive_type, status, assigned_by
          ) VALUES ($1, $2, $3, $4, 'FIXED', $5, $6)
          ON CONFLICT (employee_id, product_id) DO UPDATE 
          SET employee_referral_url = EXCLUDED.employee_referral_url,
              incentive_amount = COALESCE(EXCLUDED.incentive_amount, employee_product_links.incentive_amount),
              status = EXCLUDED.status,
              updated_at = NOW()
          RETURNING *`,
          [emp.id, prod.id, finalUrl, parseFloat(incentive_amount) || 0, status, req.user.id]
        );

        if (rows[0]) assignedResults.push(rows[0]);

        await query(
          `UPDATE employee_onboarding_checklist SET links_assigned = true, links_assigned_at = NOW() WHERE employee_id = $1`,
          [emp.id]
        ).catch(() => {});
      }
    }

    res.json({
      success: true,
      message: `Custom bank link assigned to ${empList.length} employee(s) across ${prodList.length} product(s). (${assignedResults.length} link records updated)`,
      count: assignedResults.length,
      data: assignedResults
    });

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
      SELECT e.*, c.resume_url
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
      if (joiningData.pan_number || joiningData.aadhaar_number || joiningData.bank_account_number) {
        kycData = {
          pan_number: joiningData.pan_number || null,
          pan_document_url: null,
          aadhaar_number: joiningData.aadhaar_number || null,
          aadhaar_document_url: null,
          bank_account_number: joiningData.bank_account_number || null,
          ifsc_code: joiningData.ifsc_code || null,
          bank_document_url: null,
          kyc_status: 'SUBMITTED'
        };
      }
    }

    // 4. Documents (check employee_documents, plus add candidate resume if present)
    const docsRes = await query(
      `SELECT * FROM employee_documents WHERE employee_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    let docsMap = new Map();
    for (const d of docsRes.rows) {
      const typeKey = String(d.document_type || '').toLowerCase().trim();
      if (typeKey && !docsMap.has(typeKey)) {
        docsMap.set(typeKey, d);
      }
    }
    let docs = Array.from(docsMap.values());
    if (employee.resume_url && !docs.some(d => String(d.document_type || '').toLowerCase().trim() === 'resume')) {
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

    // Resolve S3 document URLs to signed URLs to allow public viewing in dashboard
    if (employee.resume_url) {
      employee.resume_url = await resolveS3Url(employee.resume_url);
    }

    if (kycData) {
      if (kycData.pan_document_url) kycData.pan_document_url = await resolveS3Url(kycData.pan_document_url);
      if (kycData.aadhaar_document_url) kycData.aadhaar_document_url = await resolveS3Url(kycData.aadhaar_document_url);
      if (kycData.bank_document_url) kycData.bank_document_url = await resolveS3Url(kycData.bank_document_url);
    }

    if (Array.isArray(docs)) {
      for (let d of docs) {
        if (d.document_url) {
          d.document_url = await resolveS3Url(d.document_url);
        }
      }
    }

    let termsData = termsRes.rows[0] || null;
    if (termsData && termsData.video_url) {
      termsData.video_url = await resolveS3Url(termsData.video_url);
    }

    res.json({
      success: true,
      data: {
        employee,
        joining_details: joiningRes.rows[0] || null,
        kyc: kycData,
        documents: docs,
        terms: termsData,
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

// POST /api/v1/employees/:id/kyc-verify — Super Admin & HR Approve or Reject Employee KYC (Document-Level & Overall)
router.post('/:id/kyc-verify', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      kyc_status, 
      review_notes,
      pan_action, pan_reason,
      aadhaar_action, aadhaar_reason,
      bank_action, bank_reason,
      video_action, video_reason
    } = req.body;

    // Fetch existing KYC record
    const existingRes = await query(`SELECT * FROM employee_kyc WHERE employee_id = $1`, [id]);
    const existing = existingRes.rows[0] || {};

    let pan_status = existing.pan_status || 'PENDING';
    let pan_verified = existing.pan_verified || false;
    let pan_rejection_reason = existing.pan_rejection_reason || null;

    let aadhaar_status = existing.aadhaar_status || 'PENDING';
    let aadhaar_verified = existing.aadhaar_verified || false;
    let aadhaar_rejection_reason = existing.aadhaar_rejection_reason || null;

    let bank_status = existing.bank_status || 'PENDING';
    let bank_verified = existing.bank_verified || false;
    let bank_rejection_reason = existing.bank_rejection_reason || null;

    let video_status = existing.video_status || 'PENDING';
    let video_verified = existing.video_verified || false;
    let video_rejection_reason = existing.video_rejection_reason || null;

    // Handle document level decisions if provided
    if (pan_action) {
      if (pan_action === 'VERIFIED') {
        pan_status = 'VERIFIED';
        pan_verified = true;
        pan_rejection_reason = null;
      } else if (pan_action === 'REJECTED') {
        pan_status = 'REJECTED';
        pan_verified = false;
        pan_rejection_reason = pan_reason || review_notes || 'PAN document unclear or invalid';
      }
    }

    if (aadhaar_action) {
      if (aadhaar_action === 'VERIFIED') {
        aadhaar_status = 'VERIFIED';
        aadhaar_verified = true;
        aadhaar_rejection_reason = null;
      } else if (aadhaar_action === 'REJECTED') {
        aadhaar_status = 'REJECTED';
        aadhaar_verified = false;
        aadhaar_rejection_reason = aadhaar_reason || review_notes || 'Aadhaar document unclear or invalid';
      }
    }

    if (bank_action) {
      if (bank_action === 'VERIFIED') {
        bank_status = 'VERIFIED';
        bank_verified = true;
        bank_rejection_reason = null;
      } else if (bank_action === 'REJECTED') {
        bank_status = 'REJECTED';
        bank_verified = false;
        bank_rejection_reason = bank_reason || review_notes || 'Bank proof document unclear or invalid';
      }
    }

    if (video_action) {
      if (video_action === 'VERIFIED') {
        video_status = 'VERIFIED';
        video_verified = true;
        video_rejection_reason = null;
      } else if (video_action === 'REJECTED') {
        video_status = 'REJECTED';
        video_verified = false;
        video_rejection_reason = video_reason || review_notes || 'Video verification unclear or invalid';
      }
    }

    // Handle bulk overall decision fallback
    if (kyc_status === 'VERIFIED' && !pan_action && !aadhaar_action && !bank_action) {
      pan_status = 'VERIFIED'; pan_verified = true; pan_rejection_reason = null;
      aadhaar_status = 'VERIFIED'; aadhaar_verified = true; aadhaar_rejection_reason = null;
      bank_status = 'VERIFIED'; bank_verified = true; bank_rejection_reason = null;
    } else if (kyc_status === 'REJECTED' && !pan_action && !aadhaar_action && !bank_action) {
      if (!pan_verified) { pan_status = 'REJECTED'; pan_verified = false; pan_rejection_reason = review_notes || 'PAN rejected'; }
      if (!aadhaar_verified) { aadhaar_status = 'REJECTED'; aadhaar_verified = false; aadhaar_rejection_reason = review_notes || 'Aadhaar rejected'; }
      if (!bank_verified) { bank_status = 'REJECTED'; bank_verified = false; bank_rejection_reason = review_notes || 'Bank proof rejected'; }
    }

    // Determine final overall KYC status
    let finalKycStatus = 'UNDER_REVIEW';
    if (pan_status === 'VERIFIED' && aadhaar_status === 'VERIFIED' && bank_status === 'VERIFIED') {
      finalKycStatus = 'VERIFIED';
    } else if (pan_status === 'REJECTED' || aadhaar_status === 'REJECTED' || bank_status === 'REJECTED') {
      finalKycStatus = 'REJECTED';
    }

    const isFullyVerified = finalKycStatus === 'VERIFIED';

    // Update employee_kyc table
    await query(
      `INSERT INTO employee_kyc (
        employee_id, pan_status, pan_verified, pan_rejection_reason,
        aadhaar_status, aadhaar_verified, aadhaar_rejection_reason,
        bank_status, bank_verified, bank_rejection_reason,
        kyc_status, reviewed_by, reviewed_at, review_notes, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, NOW())
      ON CONFLICT (employee_id) DO UPDATE SET
        pan_status = EXCLUDED.pan_status,
        pan_verified = EXCLUDED.pan_verified,
        pan_rejection_reason = EXCLUDED.pan_rejection_reason,
        aadhaar_status = EXCLUDED.aadhaar_status,
        aadhaar_verified = EXCLUDED.aadhaar_verified,
        aadhaar_rejection_reason = EXCLUDED.aadhaar_rejection_reason,
        bank_status = EXCLUDED.bank_status,
        bank_verified = EXCLUDED.bank_verified,
        bank_rejection_reason = EXCLUDED.bank_rejection_reason,
        kyc_status = EXCLUDED.kyc_status,
        reviewed_by = EXCLUDED.reviewed_by,
        reviewed_at = NOW(),
        review_notes = EXCLUDED.review_notes,
        updated_at = NOW()`,
      [
        id,
        pan_status, pan_verified, pan_rejection_reason,
        aadhaar_status, aadhaar_verified, aadhaar_rejection_reason,
        bank_status, bank_verified, bank_rejection_reason,
        finalKycStatus, req.user.id, review_notes || null
      ]
    );

    // Update employee_documents table for source-of-truth consistency
    await query(`
      UPDATE employee_documents 
      SET verification_status = CASE 
            WHEN document_type = 'pan' THEN $2::varchar
            WHEN document_type = 'aadhaar' THEN $3::varchar
            WHEN document_type = 'bank_proof' THEN $4::varchar
            ELSE verification_status 
          END,
          rejection_reason = CASE 
            WHEN document_type = 'pan' THEN $5::text
            WHEN document_type = 'aadhaar' THEN $6::text
            WHEN document_type = 'bank_proof' THEN $7::text
            ELSE rejection_reason 
          END,
          verified_by = $8,
          verified_at = NOW()
      WHERE employee_id = $1
    `, [
      id,
      pan_status === 'VERIFIED' ? 'APPROVED' : (pan_status === 'REJECTED' ? 'REJECTED' : 'PENDING'),
      aadhaar_status === 'VERIFIED' ? 'APPROVED' : (aadhaar_status === 'REJECTED' ? 'REJECTED' : 'PENDING'),
      bank_status === 'VERIFIED' ? 'APPROVED' : (bank_status === 'REJECTED' ? 'REJECTED' : 'PENDING'),
      pan_rejection_reason,
      aadhaar_rejection_reason,
      bank_rejection_reason,
      req.user.id
    ]).catch(() => {});

    // Update onboarding checklist
    await query(
      `UPDATE employee_onboarding_checklist 
       SET kyc_verified = $1, kyc_verified_at = $2, 
           activated = $3, activated_at = $4,
           overall_progress = $5, 
           current_stage = $6 
       WHERE employee_id = $7`,
      [
        isFullyVerified, isFullyVerified ? new Date() : null,
        isFullyVerified, isFullyVerified ? new Date() : null,
        isFullyVerified ? 100 : 75,
        isFullyVerified ? 'ACTIVE' : (finalKycStatus === 'REJECTED' ? 'KYC_REJECTED' : 'KYC_UNDER_REVIEW'),
        id
      ]
    );

    // Update employee activation status and user account status
    if (isFullyVerified) {
      await query(
        `UPDATE employees SET activation_status = 'APPROVED', employee_status = 'ACTIVE', activated_at = NOW() WHERE id = $1`,
        [id]
      );
      await query(
        `UPDATE users SET status = 'active' WHERE id = (SELECT user_id FROM employees WHERE id = $1) AND id IS NOT NULL`,
        [id]
      );
    } else {
      await query(
        `UPDATE employees SET activation_status = 'REJECTED', employee_status = 'ONBOARDING' WHERE id = $1`,
        [id]
      );
      await query(
        `UPDATE users SET status = 'inactive' WHERE id = (SELECT user_id FROM employees WHERE id = $1) AND id IS NOT NULL`,
        [id]
      );
    }

    res.json({
      success: true,
      message: isFullyVerified ? 'Employee KYC verified and account activated' : 'Document review updated',
      kyc_status: finalKycStatus,
      documents: {
        pan: { status: pan_status, reason: pan_rejection_reason },
        aadhaar: { status: aadhaar_status, reason: aadhaar_rejection_reason },
        bank: { status: bank_status, reason: bank_rejection_reason }
      }
    });

  } catch (err) {
    next(err);
  }
});

// POST /api/v1/employees/create — Super Admin Create new employee directly with 5-level hierarchy
router.post('/create', async (req, res, next) => {
  try {
    const {
      full_name, mobile_number, email_id, designation, department = 'Sales & Distribution',
      offered_salary = 25000, work_location = 'Head Office', hierarchy_level = 'TC',
      branch_head_id, senior_manager_id, manager_id, team_leader_id
    } = req.body;

    if (!full_name || !mobile_number) {
      return res.status(400).json({ success: false, message: 'Full Name and Mobile Number are required' });
    }

    const cleanMobile = String(mobile_number).trim();
    const cleanEmail = email_id ? String(email_id).trim().toLowerCase() : `${cleanMobile}@gharkapaisa.in`;

    // 1. Check existing user/employee
    const existing = await query(`SELECT id FROM employees WHERE mobile_number = $1 OR email_id = $2`, [cleanMobile, cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Employee with this mobile number or email already exists' });
    }

    // 2. Generate Employee Code based on hierarchy level
    const levelUpper = (hierarchy_level || designation || 'TC').toUpperCase();
    let prefix = 'TC';
    if (levelUpper.includes('BRANCH') || levelUpper === 'BRANCH_HEAD') prefix = 'BH';
    else if (levelUpper.includes('SENIOR') || levelUpper === 'SENIOR_MANAGER') prefix = 'SM';
    else if (levelUpper.includes('MANAGER') || levelUpper === 'MANAGER') prefix = 'MGR';
    else if (levelUpper.includes('TEAM') || levelUpper.includes('TL') || levelUpper === 'TEAM_LEADER') prefix = 'TL';

    const seqRes = await query(`SELECT nextval('employee_id_seq') as seq`).catch(() => ({ rows: [{ seq: Math.floor(1000 + Math.random() * 9000) }] }));
    const empCode = `YOH-${prefix}${seqRes.rows[0]?.seq || Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Create User record
    const bcrypt = require('bcryptjs');
    const defaultHash = await bcrypt.hash('Gkp@123456', 10);
    const userRes = await query(
      `INSERT INTO users (full_name, mobile, email, role, status, employee_id, designation, department, password_hash)
       VALUES ($1, $2, $3, 'EMPLOYEE', 'active', $4, $5, $6, $7) RETURNING id`,
      [full_name, cleanMobile, cleanEmail, empCode, designation || prefix, department, defaultHash]
    );
    const userId = userRes.rows[0].id;

    // 4. Create Employee record
    const mapDesg = { 'BRANCH_HEAD': 'Branch Head', 'SENIOR_MANAGER': 'Senior Manager', 'MANAGER': 'Manager', 'TEAM_LEADER': 'Team Leader', 'TL': 'Team Leader', 'TC': 'TC' };
    const finalDesg = mapDesg[levelUpper] || designation || 'TC';

    const empRes = await query(
      `INSERT INTO employees (
        employee_id, user_id, full_name, mobile_number, email_id, designation, department,
        joining_date, work_location, employment_type, offered_salary, employee_status, activation_status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8, 'Full-time', $9, 'ACTIVE', 'APPROVED', $10) RETURNING *`,
      [empCode, userId, full_name, cleanMobile, cleanEmail, finalDesg, department, work_location, parseFloat(offered_salary) || 25000, req.user?.id || null]
    );
    const employee = empRes.rows[0];

    // 5. Create Checklist record
    await query(
      `INSERT INTO employee_onboarding_checklist (employee_id, interview_completed, employee_created, joining_form_completed, kyc_submitted, kyc_verified, terms_completed, activated, overall_progress, current_stage)
       VALUES ($1, true, true, true, true, true, true, true, 100, 'ACTIVE') ON CONFLICT (employee_id) DO NOTHING`,
      [employee.id]
    );

    // 6. Assign Hierarchy
    const cleanBhId = (branch_head_id && branch_head_id !== 'null' && String(branch_head_id).trim()) ? String(branch_head_id).trim() : null;
    const cleanSmId = (senior_manager_id && senior_manager_id !== 'null' && String(senior_manager_id).trim()) ? String(senior_manager_id).trim() : null;
    const cleanMgrId = (manager_id && manager_id !== 'null' && String(manager_id).trim()) ? String(manager_id).trim() : null;
    const cleanTlId = (team_leader_id && team_leader_id !== 'null' && String(team_leader_id).trim()) ? String(team_leader_id).trim() : null;

    await query(
      `INSERT INTO employee_hierarchy (employee_id, branch_head_id, senior_manager_id, manager_id, team_leader_id, hierarchy_level, assigned_by, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
      [employee.id, cleanBhId, cleanSmId, cleanMgrId, cleanTlId, levelUpper, req.user?.id || null]
    );

    res.status(201).json({
      success: true,
      message: `Employee ${full_name} (${empCode}) created successfully!`,
      data: employee
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/employees/:id/hierarchy — Assign Hierarchy Level & Reporting Structure (Branch Head, Senior Manager, Manager, TL)
router.post('/:id/hierarchy', async (req, res, next) => {
  try {
    const { id } = req.params;
    let { branch_head_id, senior_manager_id, manager_id, team_leader_id, hierarchy_level } = req.body;

    if (!hierarchy_level) {
      return res.status(400).json({ success: false, message: 'Hierarchy level is required (BRANCH_HEAD, SENIOR_MANAGER, MANAGER, TEAM_LEADER, TC)' });
    }

    const cleanBhId = (branch_head_id && branch_head_id !== 'null' && branch_head_id !== 'undefined' && String(branch_head_id).trim() !== '') ? String(branch_head_id).trim() : null;
    const cleanSmId = (senior_manager_id && senior_manager_id !== 'null' && senior_manager_id !== 'undefined' && String(senior_manager_id).trim() !== '') ? String(senior_manager_id).trim() : null;
    const cleanMgrId = (manager_id && manager_id !== 'null' && manager_id !== 'undefined' && String(manager_id).trim() !== '') ? String(manager_id).trim() : null;
    const cleanTlId = (team_leader_id && team_leader_id !== 'null' && team_leader_id !== 'undefined' && String(team_leader_id).trim() !== '') ? String(team_leader_id).trim() : null;

    const levelUpper = hierarchy_level.toUpperCase();

    // Sync employee designation in employees table
    const mapDesg = { 'BRANCH_HEAD': 'Branch Head', 'SENIOR_MANAGER': 'Senior Manager', 'MANAGER': 'Manager', 'TEAM_LEADER': 'Team Leader', 'TL': 'Team Leader', 'TC': 'TC' };
    const desg = mapDesg[levelUpper] || hierarchy_level;
    await query(`UPDATE employees SET designation = $1, updated_at = NOW() WHERE id = $2`, [desg, id]);

    // Deactivate previous active hierarchy
    await query(`UPDATE employee_hierarchy SET is_active = false WHERE employee_id = $1`, [id]);

    const assignedBy = req.user?.id || req.user?.userId || null;

    const { rows } = await query(
      `INSERT INTO employee_hierarchy (employee_id, branch_head_id, senior_manager_id, manager_id, team_leader_id, hierarchy_level, assigned_by, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
      [id, cleanBhId, cleanSmId, cleanMgrId, cleanTlId, levelUpper, assignedBy]
    );

    res.json({ success: true, message: 'Employee hierarchy assigned successfully', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/employees/bulk-hierarchy — Bulk assign hierarchy for multiple employees
router.post('/bulk-hierarchy', async (req, res, next) => {
  try {
    const { assignments } = req.body; // Array of { employee_id, branch_head_id, senior_manager_id, manager_id, team_leader_id, hierarchy_level }
    
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ success: false, message: 'Assignments array is required' });
    }

    const assignedBy = req.user?.id || req.user?.userId || null;
    const results = [];
    const errors = [];

    // Sync designation mapping
    const mapDesg = { 'BRANCH_HEAD': 'Branch Head', 'SENIOR_MANAGER': 'Senior Manager', 'MANAGER': 'Manager', 'TEAM_LEADER': 'Team Leader', 'TL': 'Team Leader', 'TC': 'TC' };

    for (const assignment of assignments) {
      try {
        const { employee_id, branch_head_id, senior_manager_id, manager_id, team_leader_id, hierarchy_level } = assignment;
        
        if (!employee_id || !hierarchy_level) {
          errors.push({ employee_id, error: 'Missing required fields' });
          continue;
        }

        const cleanBhId = (branch_head_id && branch_head_id !== 'null' && branch_head_id !== 'undefined' && String(branch_head_id).trim() !== '') ? String(branch_head_id).trim() : null;
        const cleanSmId = (senior_manager_id && senior_manager_id !== 'null' && senior_manager_id !== 'undefined' && String(senior_manager_id).trim() !== '') ? String(senior_manager_id).trim() : null;
        const cleanMgrId = (manager_id && manager_id !== 'null' && manager_id !== 'undefined' && String(manager_id).trim() !== '') ? String(manager_id).trim() : null;
        const cleanTlId = (team_leader_id && team_leader_id !== 'null' && team_leader_id !== 'undefined' && String(team_leader_id).trim() !== '') ? String(team_leader_id).trim() : null;

        const levelUpper = hierarchy_level.toUpperCase();

        // Sync employee designation
        const desg = mapDesg[levelUpper] || hierarchy_level;
        await query(`UPDATE employees SET designation = $1, updated_at = NOW() WHERE id = $2`, [desg, employee_id]);

        // Deactivate previous active hierarchy
        await query(`UPDATE employee_hierarchy SET is_active = false WHERE employee_id = $1`, [employee_id]);

        // Insert new hierarchy
        const { rows } = await query(
          `INSERT INTO employee_hierarchy (employee_id, branch_head_id, senior_manager_id, manager_id, team_leader_id, hierarchy_level, assigned_by, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
          [employee_id, cleanBhId, cleanSmId, cleanMgrId, cleanTlId, levelUpper, assignedBy]
        );

        results.push({ employee_id, success: true, data: rows[0] });
      } catch (err) {
        errors.push({ employee_id: assignment.employee_id, error: err.message });
      }
    }

    res.json({ 
      success: true, 
      message: `Processed ${assignments.length} assignments, ${results.length} successful, ${errors.length} failed`,
      results,
      errors
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/employees/:id/unassign-hierarchy — Unassign / Remove employee from team hierarchy
router.post('/:id/unassign-hierarchy', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Deactivate active hierarchy for this employee
    await query(`UPDATE employee_hierarchy SET is_active = false WHERE employee_id = $1`, [id]);

    // Clear hierarchy assignment in active records where this employee was assigned as supervisor
    await query(`UPDATE employee_hierarchy SET branch_head_id = NULL WHERE branch_head_id = $1 AND is_active = true`, [id]);
    await query(`UPDATE employee_hierarchy SET senior_manager_id = NULL WHERE senior_manager_id = $1 AND is_active = true`, [id]);
    await query(`UPDATE employee_hierarchy SET manager_id = NULL WHERE manager_id = $1 AND is_active = true`, [id]);
    await query(`UPDATE employee_hierarchy SET team_leader_id = NULL WHERE team_leader_id = $1 AND is_active = true`, [id]);

    res.json({ success: true, message: 'Employee unassigned from team hierarchy successfully' });
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

// ── GET /api/v1/employees/incentives/overview — Super Admin Employee Incentives Dashboard Data ──
router.get('/incentives/overview', async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      employee_id,
      role,
      manager_id,
      team_leader_id,
      product_id,
      bank_id,
      status,
      search,
      page = 1,
      limit = 20
    } = req.query;

    let whereConditions = [];
    let params = [];

    if (startDate) {
      params.push(startDate);
      whereConditions.push(`it.created_at >= $${params.length}`);
    }
    if (endDate) {
      params.push(endDate + ' 23:59:59');
      whereConditions.push(`it.created_at <= $${params.length}`);
    }
    if (employee_id) {
      params.push(employee_id);
      whereConditions.push(`it.employee_id = $${params.length}`);
    }
    if (role) {
      params.push(role);
      whereConditions.push(`(e.designation ILIKE $${params.length} OR h.hierarchy_level = UPPER($${params.length}))`);
    }
    if (manager_id) {
      params.push(manager_id);
      whereConditions.push(`h.manager_id = $${params.length}`);
    }
    if (team_leader_id) {
      params.push(team_leader_id);
      whereConditions.push(`h.team_leader_id = $${params.length}`);
    }
    if (product_id) {
      params.push(product_id);
      whereConditions.push(`it.product_id = $${params.length}`);
    }
    if (bank_id) {
      params.push(bank_id);
      whereConditions.push(`p.bank_id = $${params.length}`);
    }
    if (status) {
      params.push(status.toUpperCase());
      whereConditions.push(`UPPER(it.status::text) = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      const sIdx = params.length;
      whereConditions.push(`(
        e.full_name ILIKE $${sIdx} OR 
        e.employee_id ILIKE $${sIdx} OR 
        a.app_number ILIKE $${sIdx} OR 
        it.customer_name ILIKE $${sIdx}
      )`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 1. KPI Cards Summary Query
    const kpiQuery = `
      SELECT 
        COALESCE(SUM(it.amount), 0) as total_earned,
        COALESCE(SUM(CASE WHEN UPPER(it.status::text) IN ('PAID', 'COMPLETED') THEN it.amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN UPPER(it.status::text) = 'PENDING' THEN it.amount ELSE 0 END), 0) as pending_payouts,
        COALESCE(SUM(CASE WHEN UPPER(it.status::text) = 'IN_REVIEW' THEN it.amount ELSE 0 END), 0) as in_review,
        COALESCE(SUM(CASE WHEN UPPER(it.status::text) IN ('ON_HOLD', 'HELD') THEN it.amount ELSE 0 END), 0) as on_hold,
        COALESCE(SUM(CASE WHEN UPPER(it.status::text) IN ('REJECTED', 'CANCELLED') THEN it.amount ELSE 0 END), 0) as rejected,
        COUNT(DISTINCT it.employee_id) as employees_earned,
        COUNT(it.id) as total_transactions,
        COUNT(CASE WHEN UPPER(it.status::text) IN ('PAID', 'COMPLETED') THEN 1 END) as approved_transactions,
        COUNT(CASE WHEN UPPER(it.status::text) IN ('REJECTED', 'CANCELLED') THEN 1 END) as rejected_transactions
      FROM employee_incentive_transactions it
      LEFT JOIN employees e ON e.id = it.employee_id
      LEFT JOIN employee_hierarchy h ON h.employee_id = e.id AND h.is_active = true
      LEFT JOIN products p ON p.id = it.product_id
      LEFT JOIN applications a ON a.id = it.application_id
      ${whereClause}
    `;

    const kpiRes = await query(kpiQuery, params);
    const kpi = kpiRes.rows[0] || {};
    const totalEarned = parseFloat(kpi.total_earned || 0);
    const employeesEarned = parseInt(kpi.employees_earned || 0);
    kpi.avg_incentive_per_employee = employeesEarned > 0 ? Math.round(totalEarned / employeesEarned) : 0;

    // 2. Incentive Trend Overview (Grouped by Date)
    const trendQuery = `
      SELECT 
        TO_CHAR(it.created_at, 'YYYY-MM-DD') as date,
        COALESCE(SUM(it.amount), 0) as earned,
        COALESCE(SUM(CASE WHEN UPPER(it.status::text) IN ('PAID', 'COMPLETED') THEN it.amount ELSE 0 END), 0) as paid,
        COALESCE(SUM(CASE WHEN UPPER(it.status::text) = 'PENDING' THEN it.amount ELSE 0 END), 0) as pending
      FROM employee_incentive_transactions it
      LEFT JOIN employees e ON e.id = it.employee_id
      LEFT JOIN employee_hierarchy h ON h.employee_id = e.id AND h.is_active = true
      LEFT JOIN products p ON p.id = it.product_id
      LEFT JOIN applications a ON a.id = it.application_id
      ${whereClause}
      GROUP BY TO_CHAR(it.created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
      LIMIT 30
    `;
    const trendRes = await query(trendQuery, params);

    // 3. Incentives by Role Breakdown
    const roleQuery = `
      SELECT 
        COALESCE(e.designation, h.hierarchy_level, 'Telecaller') as role,
        COALESCE(SUM(it.amount), 0) as earned,
        COALESCE(SUM(CASE WHEN UPPER(it.status::text) IN ('PAID', 'COMPLETED') THEN it.amount ELSE 0 END), 0) as paid,
        COALESCE(SUM(CASE WHEN UPPER(it.status::text) = 'PENDING' THEN it.amount ELSE 0 END), 0) as pending,
        COUNT(DISTINCT it.employee_id) as count
      FROM employee_incentive_transactions it
      LEFT JOIN employees e ON e.id = it.employee_id
      LEFT JOIN employee_hierarchy h ON h.employee_id = e.id AND h.is_active = true
      LEFT JOIN products p ON p.id = it.product_id
      LEFT JOIN applications a ON a.id = it.application_id
      ${whereClause}
      GROUP BY COALESCE(e.designation, h.hierarchy_level, 'Telecaller')
      ORDER BY earned DESC
    `;
    const roleRes = await query(roleQuery, params);

    // 4. Incentives by Status Breakdown
    const statusQuery = `
      SELECT 
        UPPER(it.status::text) as status,
        COALESCE(SUM(it.amount), 0) as amount,
        COUNT(it.id) as count
      FROM employee_incentive_transactions it
      LEFT JOIN employees e ON e.id = it.employee_id
      LEFT JOIN employee_hierarchy h ON h.employee_id = e.id AND h.is_active = true
      LEFT JOIN products p ON p.id = it.product_id
      LEFT JOIN applications a ON a.id = it.application_id
      ${whereClause}
      GROUP BY UPPER(it.status::text)
      ORDER BY amount DESC
    `;
    const statusRes = await query(statusQuery, params);

    // 5. Top Earning Employees Leaderboard
    const topEmployeesQuery = `
      SELECT 
        e.id as employee_uuid,
        e.employee_id as emp_code,
        e.full_name,
        COALESCE(e.designation, h.hierarchy_level, 'TC') as role,
        COUNT(DISTINCT it.application_id) as applications,
        COUNT(DISTINCT CASE WHEN UPPER(it.status::text) IN ('PAID', 'COMPLETED') THEN it.application_id END) as approved,
        COALESCE(SUM(it.amount), 0) as earned,
        COALESCE(SUM(CASE WHEN UPPER(it.status::text) IN ('PAID', 'COMPLETED') THEN it.amount ELSE 0 END), 0) as paid,
        COALESCE(SUM(CASE WHEN UPPER(it.status::text) = 'PENDING' THEN it.amount ELSE 0 END), 0) as pending
      FROM employee_incentive_transactions it
      JOIN employees e ON e.id = it.employee_id
      LEFT JOIN employee_hierarchy h ON h.employee_id = e.id AND h.is_active = true
      LEFT JOIN products p ON p.id = it.product_id
      LEFT JOIN applications a ON a.id = it.application_id
      ${whereClause}
      GROUP BY e.id, e.employee_id, e.full_name, e.designation, h.hierarchy_level
      ORDER BY earned DESC
      LIMIT 10
    `;
    const topEmployeesRes = await query(topEmployeesQuery, params);

    // 6. Incentives by Product
    const productQuery = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        b.name as bank_name,
        COALESCE(p.category_slug, 'credit_card') as category_slug,
        COUNT(DISTINCT it.application_id) as applications,
        COUNT(DISTINCT CASE WHEN UPPER(it.status::text) IN ('PAID', 'COMPLETED') THEN it.application_id END) as approved,
        COALESCE(SUM(it.amount), 0) as earned,
        COALESCE(SUM(CASE WHEN UPPER(it.status::text) IN ('PAID', 'COMPLETED') THEN it.amount ELSE 0 END), 0) as paid,
        COALESCE(SUM(CASE WHEN UPPER(it.status::text) = 'PENDING' THEN it.amount ELSE 0 END), 0) as pending
      FROM employee_incentive_transactions it
      JOIN products p ON p.id = it.product_id
      LEFT JOIN banks b ON b.id = p.bank_id
      LEFT JOIN employees e ON e.id = it.employee_id
      LEFT JOIN employee_hierarchy h ON h.employee_id = e.id AND h.is_active = true
      LEFT JOIN applications a ON a.id = it.application_id
      ${whereClause}
      GROUP BY p.id, p.name, b.name, p.category_slug
      ORDER BY earned DESC
      LIMIT 15
    `;
    const productRes = await query(productQuery, params);

    // 7. Recent Incentive Payouts
    const payoutsQuery = `
      SELECT 
        it.id as payout_id,
        e.full_name as employee_name,
        e.employee_id as emp_code,
        it.amount,
        COALESCE(it.paid_at, it.updated_at, it.created_at) as paid_date,
        COALESCE(it.payment_reference, 'N/A') as payment_reference,
        it.payment_method,
        it.status
      FROM employee_incentive_transactions it
      JOIN employees e ON e.id = it.employee_id
      LEFT JOIN employee_hierarchy h ON h.employee_id = e.id AND h.is_active = true
      LEFT JOIN products p ON p.id = it.product_id
      LEFT JOIN applications a ON a.id = it.application_id
      ${whereClause}
      ORDER BY it.created_at DESC
      LIMIT 10
    `;
    const payoutsRes = await query(payoutsQuery, params);

    // 8. Hierarchy Tree View (Managers -> TLs -> TCs)
    const hierarchyQuery = `
      SELECT 
        m.id as manager_id,
        m.full_name as manager_name,
        m.employee_id as manager_code,
        tl.id as tl_id,
        tl.full_name as tl_name,
        tl.employee_id as tl_code,
        e.id as emp_id,
        e.full_name as emp_name,
        e.employee_id as emp_code,
        e.designation,
        COALESCE(SUM(it.amount), 0) as total_incentives,
        COALESCE(SUM(CASE WHEN UPPER(it.status::text) IN ('PAID', 'COMPLETED') THEN it.amount ELSE 0 END), 0) as paid_incentives,
        COALESCE(SUM(CASE WHEN UPPER(it.status::text) = 'PENDING' THEN it.amount ELSE 0 END), 0) as pending_incentives,
        COUNT(DISTINCT it.application_id) as total_apps
      FROM employees e
      JOIN employee_hierarchy h ON h.employee_id = e.id AND h.is_active = true
      LEFT JOIN employees tl ON tl.id = h.team_leader_id
      LEFT JOIN employees m ON m.id = h.manager_id
      LEFT JOIN employee_incentive_transactions it ON it.employee_id = e.id
      GROUP BY m.id, m.full_name, m.employee_id, tl.id, tl.full_name, tl.employee_id, e.id, e.full_name, e.employee_id, e.designation
      ORDER BY m.full_name ASC, tl.full_name ASC, e.full_name ASC
    `;
    const hierarchyRes = await query(hierarchyQuery);

    // Group hierarchy into structured tree
    const hierarchyTree = [];
    const managerMap = {};
    (hierarchyRes.rows || []).forEach(row => {
      const mgrKey = row.manager_id || 'unassigned_mgr';
      if (!managerMap[mgrKey]) {
        managerMap[mgrKey] = {
          id: row.manager_id,
          name: row.manager_name || 'Direct / Unassigned Manager',
          code: row.manager_code || 'N/A',
          total_incentives: 0,
          paid_incentives: 0,
          pending_incentives: 0,
          total_apps: 0,
          team_leaders: {}
        };
        hierarchyTree.push(managerMap[mgrKey]);
      }

      managerMap[mgrKey].total_incentives += parseFloat(row.total_incentives || 0);
      managerMap[mgrKey].paid_incentives += parseFloat(row.paid_incentives || 0);
      managerMap[mgrKey].pending_incentives += parseFloat(row.pending_incentives || 0);
      managerMap[mgrKey].total_apps += parseInt(row.total_apps || 0);

      const tlKey = row.tl_id || 'unassigned_tl';
      if (!managerMap[mgrKey].team_leaders[tlKey]) {
        managerMap[mgrKey].team_leaders[tlKey] = {
          id: row.tl_id,
          name: row.tl_name || 'Direct / Unassigned TL',
          code: row.tl_code || 'N/A',
          total_incentives: 0,
          paid_incentives: 0,
          pending_incentives: 0,
          total_apps: 0,
          telecallers: []
        };
      }

      managerMap[mgrKey].team_leaders[tlKey].total_incentives += parseFloat(row.total_incentives || 0);
      managerMap[mgrKey].team_leaders[tlKey].paid_incentives += parseFloat(row.paid_incentives || 0);
      managerMap[mgrKey].team_leaders[tlKey].pending_incentives += parseFloat(row.pending_incentives || 0);
      managerMap[mgrKey].team_leaders[tlKey].total_apps += parseInt(row.total_apps || 0);

      managerMap[mgrKey].team_leaders[tlKey].telecallers.push({
        id: row.emp_id,
        name: row.emp_name,
        code: row.emp_code,
        designation: row.designation,
        total_incentives: parseFloat(row.total_incentives || 0),
        paid_incentives: parseFloat(row.paid_incentives || 0),
        pending_incentives: parseFloat(row.pending_incentives || 0),
        total_apps: parseInt(row.total_apps || 0)
      });
    });

    // Convert team_leaders dictionary to array for frontend
    hierarchyTree.forEach(m => {
      m.team_leaders = Object.values(m.team_leaders);
    });

    // 9. Paginated Main Incentive Details Table Query
    const pNum = Math.max(1, parseInt(page));
    const pLimit = Math.max(1, parseInt(limit));
    const offset = (pNum - 1) * pLimit;

    const countQuery = `
      SELECT COUNT(it.id) as total
      FROM employee_incentive_transactions it
      LEFT JOIN employees e ON e.id = it.employee_id
      LEFT JOIN employee_hierarchy h ON h.employee_id = e.id AND h.is_active = true
      LEFT JOIN products p ON p.id = it.product_id
      LEFT JOIN applications a ON a.id = it.application_id
      ${whereClause}
    `;
    const countRes = await query(countQuery, params);
    const totalRecords = parseInt(countRes.rows[0]?.total || 0);

    const mainTableParams = [...params, pLimit, offset];
    const mainTableQuery = `
      SELECT 
        it.id as incentive_id,
        it.employee_id,
        e.full_name as employee_name,
        e.employee_id as emp_code,
        COALESCE(e.designation, h.hierarchy_level, 'Telecaller') as role,
        p.id as product_id,
        p.name as product_name,
        p.category_slug,
        b.name as bank_name,
        a.id as application_id,
        a.app_number,
        a.status as application_status,
        a.created_at as approval_date,
        it.transaction_type,
        it.amount as incentive_earned,
        CASE WHEN UPPER(it.status::text) IN ('PAID', 'COMPLETED') THEN it.amount ELSE 0 END as incentive_paid,
        CASE WHEN UPPER(it.status::text) = 'PENDING' THEN it.amount ELSE 0 END as pending_amount,
        it.status,
        it.hold_until,
        it.hold_reason,
        it.payment_method,
        it.payment_reference,
        it.paid_at,
        it.customer_name,
        it.created_at,
        it.updated_at,
        mgr.full_name as manager_name,
        tl.full_name as team_leader_name
      FROM employee_incentive_transactions it
      JOIN employees e ON e.id = it.employee_id
      LEFT JOIN employee_hierarchy h ON h.employee_id = e.id AND h.is_active = true
      LEFT JOIN employees mgr ON mgr.id = h.manager_id
      LEFT JOIN employees tl ON tl.id = h.team_leader_id
      LEFT JOIN products p ON p.id = it.product_id
      LEFT JOIN banks b ON b.id = p.bank_id
      LEFT JOIN applications a ON a.id = it.application_id
      ${whereClause}
      ORDER BY it.created_at DESC
      LIMIT $${mainTableParams.length - 1} OFFSET $${mainTableParams.length}
    `;
    const tableRes = await query(mainTableQuery, mainTableParams);

    res.json({
      success: true,
      kpi,
      trend: trendRes.rows,
      by_role: roleRes.rows,
      by_status: statusRes.rows,
      top_employees: topEmployeesRes.rows,
      by_product: productRes.rows,
      recent_payouts: payoutsRes.rows,
      hierarchy: hierarchyTree,
      table: {
        data: tableRes.rows,
        pagination: {
          total: totalRecords,
          page: pNum,
          limit: pLimit,
          totalPages: Math.ceil(totalRecords / pLimit)
        }
      }
    });

  } catch (err) {
    next(err);
  }
});

// ── PUT /api/v1/employees/incentives/:id/status — Super Admin Update Payout/Incentive Status ──
router.post('/incentives/:id/update-status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, payment_reference, payment_method = 'BANK_TRANSFER', hold_reason } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const uppercaseStatus = status.toUpperCase();
    const isPaid = uppercaseStatus === 'PAID' || uppercaseStatus === 'COMPLETED';

    const { rows } = await query(
      `UPDATE employee_incentive_transactions
       SET status = $1,
           payment_reference = COALESCE($2, payment_reference),
           payment_method = COALESCE($3, payment_method),
           hold_reason = COALESCE($4, hold_reason),
           paid_at = CASE WHEN $5::boolean THEN NOW() ELSE paid_at END,
           updated_at = NOW(),
           processed_by = $6
       WHERE id = $7
       RETURNING *`,
      [uppercaseStatus, payment_reference || null, payment_method, hold_reason || null, isPaid, req.user?.id || null, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Incentive transaction not found' });
    }

    res.json({
      success: true,
      message: `Incentive transaction updated to ${uppercaseStatus}`,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// ── 1. GET /api/v1/employees/:id/departments — List assigned departments/banks for Employee ──
router.get('/:id/departments', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify employee
    const empRes = await query(`SELECT id, employee_id, full_name FROM employees WHERE id = $1`, [id]);
    if (empRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    const employee = empRes.rows[0];

    // Fetch all active banks and check assignment status
    const { rows } = await query(`
      SELECT 
        b.id as bank_id,
        b.name as bank_name,
        b.logo_url as bank_logo,
        CASE WHEN eba.id IS NOT NULL THEN true ELSE false END as is_assigned,
        eba.created_at as assigned_at
      FROM banks b
      LEFT JOIN employee_bank_assignments eba ON eba.bank_id = b.id AND eba.employee_id = $1
      WHERE b.is_active = true
      ORDER BY b.name ASC
    `, [id]);

    res.json({
      success: true,
      employee,
      assigned_banks: rows.filter(r => r.is_assigned),
      all_banks: rows
    });
  } catch (err) {
    next(err);
  }
});

// ── 2. POST /api/v1/employees/:id/departments — Assign Departments/Banks to Employee ──
router.post('/:id/departments', async (req, res, next) => {
  const { id } = req.params;
  const { bank_ids } = req.body;

  if (!Array.isArray(bank_ids)) {
    return res.status(400).json({ success: false, message: 'bank_ids must be an array of bank UUIDs' });
  }

  const client = await getClient();
  try {
    // Verify employee
    const empRes = await client.query(`SELECT id, employee_id, full_name FROM employees WHERE id = $1`, [id]);
    if (empRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    await client.query('BEGIN');
    await client.query(`DELETE FROM employee_bank_assignments WHERE employee_id = $1`, [id]);

    const assigned = [];
    for (const bId of bank_ids) {
      const insRes = await client.query(
        `INSERT INTO employee_bank_assignments (employee_id, bank_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (employee_id, bank_id) DO UPDATE SET updated_at = NOW()
         RETURNING *`,
        [id, bId, req.user.id]
      );
      if (insRes.rows[0]) assigned.push(insRes.rows[0]);
    }
    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Successfully assigned ${assigned.length} department(s)/bank(s) to ${empRes.rows[0].full_name}`,
      count: assigned.length,
      data: assigned
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// ── 3. GET /api/v1/employees/bonus-rules — List & Filter Employee Bonus Rules ──
router.get('/bonus-rules/all', async (req, res, next) => {
  try {
    const { employee_id, bank_id, status } = req.query;

    let whereConds = [];
    let params = [];

    if (employee_id) {
      params.push(employee_id);
      whereConds.push(`br.employee_id = $${params.length}`);
    }

    if (bank_id) {
      params.push(bank_id);
      whereConds.push(`br.bank_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      whereConds.push(`br.status = $${params.length}`);
    }

    const whereClause = whereConds.length > 0 ? `WHERE ${whereConds.join(' AND ')}` : '';

    const { rows } = await query(`
      SELECT 
        br.*,
        e.full_name as employee_name,
        e.employee_id as emp_code,
        e.designation as employee_designation,
        b.name as bank_name,
        b.logo_url as bank_logo,
        u.full_name as created_by_name
      FROM employee_bonus_rules br
      JOIN employees e ON e.id = br.employee_id
      JOIN banks b ON b.id = br.bank_id
      LEFT JOIN users u ON u.id = br.created_by
      ${whereClause}
      ORDER BY br.created_at DESC
    `, params);

    // Calculate real-time approved cards & bonus progress for each rule
    const enrichedRules = await Promise.all(rows.map(async (rule) => {
      const appCountRes = await query(`
        SELECT COUNT(*) as approved_count
        FROM applications app
        JOIN products p ON p.id = app.product_id
        WHERE (app.employee_id = $1 OR app.submitted_by IN (SELECT user_id FROM employees WHERE id = $1))
          AND p.bank_id = $2
          AND app.status::text IN ('approved', 'disbursed', 'sanctioned', 'super_admin_approved', 'commission_released', 'commission_received')
          AND DATE(COALESCE(app.approved_at, app.updated_at, app.created_at)) >= $3
          AND DATE(COALESCE(app.approved_at, app.updated_at, app.created_at)) <= $4
      `, [rule.employee_id, rule.bank_id, rule.start_date, rule.end_date]);

      const approvedCount = parseInt(appCountRes.rows[0]?.approved_count || 0);
      const targetCount = parseInt(rule.target_count || 0);
      const bonusPerCard = parseFloat(rule.bonus_per_card || 0);
      const targetAchieved = targetCount > 0 && approvedCount >= targetCount;
      const projectedBonus = approvedCount * bonusPerCard;
      // Bonus is unlocked & earned ONLY when approved cards >= targetCount
      const earnedBonus = targetAchieved ? projectedBonus : 0;
      const progressPercentage = targetCount > 0 ? Math.min(100, Math.round((approvedCount / targetCount) * 100)) : 0;

      // Auto-sync bonus transaction for this specific employee when target is achieved
      if (targetAchieved && earnedBonus > 0) {
        await query(`
          INSERT INTO employee_bonus_transactions (employee_id, bank_id, bonus_rule_id, bonus_amount, status)
          VALUES ($1, $2, $3, $4, 'EARNED')
          ON CONFLICT (application_id, bonus_rule_id) DO UPDATE SET bonus_amount = EXCLUDED.bonus_amount
        `, [rule.employee_id, rule.bank_id, rule.id, earnedBonus]).catch(() => {});
      }

      return {
        ...rule,
        approved_count: approvedCount,
        projected_bonus: projectedBonus,
        earned_bonus: earnedBonus,
        bonus_status: targetAchieved ? 'UNLOCKED' : 'LOCKED_TARGET_PENDING',
        target_achieved: targetAchieved,
        progress_percentage: progressPercentage,
        remaining_count: Math.max(0, targetCount - approvedCount),
        remaining_bonus: Math.max(0, (targetCount - approvedCount) * bonusPerCard)
      };
    }));

    res.json({
      success: true,
      count: enrichedRules.length,
      data: enrichedRules
    });
  } catch (err) {
    next(err);
  }
});

// ── 4. POST /api/v1/employees/bonus-rules — Create/Assign New Bonus Rule ──
router.post('/bonus-rules', async (req, res, next) => {
  try {
    const { employee_id, bank_id, start_date, end_date, target_count, bonus_per_card } = req.body;

    if (!employee_id || !bank_id || !start_date || !end_date || target_count === undefined || bonus_per_card === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, Bank ID, Start Date, End Date, Target Count, and Bonus Per Card are required'
      });
    }

    // Verify employee & bank assignment
    const empRes = await query(`SELECT id, full_name, employee_id FROM employees WHERE id = $1`, [employee_id]);
    if (empRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const bankRes = await query(`SELECT id, name FROM banks WHERE id = $1`, [bank_id]);
    if (bankRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bank not found' });
    }

    // Verify if bank is assigned to employee
    const assignCheck = await query(
      `SELECT id FROM employee_bank_assignments WHERE employee_id = $1 AND bank_id = $2`,
      [employee_id, bank_id]
    );

    // Auto-assign bank if not assigned yet
    if (assignCheck.rows.length === 0) {
      await query(
        `INSERT INTO employee_bank_assignments (employee_id, bank_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [employee_id, bank_id, req.user.id]
      ).catch(() => {});
    }

    const { rows } = await query(
      `INSERT INTO employee_bonus_rules (
        employee_id, bank_id, start_date, end_date, target_count, bonus_per_card, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7)
      RETURNING *`,
      [employee_id, bank_id, start_date, end_date, parseInt(target_count), parseFloat(bonus_per_card), req.user.id]
    );

    res.json({
      success: true,
      message: `Bonus rule created for ${empRes.rows[0].full_name} (${bankRes.rows[0].name})`,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// ── 5. DELETE /api/v1/employees/bonus-rules/:id — Delete/Deactivate Bonus Rule ──
router.delete('/bonus-rules/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(`DELETE FROM employee_bonus_rules WHERE id = $1 RETURNING *`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bonus rule not found' });
    }
    res.json({ success: true, message: 'Bonus rule deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

