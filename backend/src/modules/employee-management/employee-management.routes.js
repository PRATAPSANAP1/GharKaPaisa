const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware');
const roleCheck = require('../../middleware/authorization/role.middleware');
const logger = require('../../config/logger');

// Protect routes: Super Admin and Admin only
router.use(jwtAuth);
router.use(roleCheck('SUPER_ADMIN', 'ADMIN'));

// GET /api/v1/employees — List all employees with rich search and filtering
router.get('/', async (req, res, next) => {
  try {
    const { status, activation_status, designation, search, limit = 50, offset = 0 } = req.query;
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
    const empRes = await query(`SELECT * FROM employees WHERE id = $1`, [id]);
    if (empRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    const employee = empRes.rows[0];

    // 2. Joining details
    const joiningRes = await query(`SELECT * FROM employee_joining_details WHERE employee_id = $1`, [id]);
    // 3. KYC details
    const kycRes = await query(`SELECT * FROM employee_kyc WHERE employee_id = $1`, [id]);
    // 4. Documents
    const docsRes = await query(`SELECT * FROM employee_documents WHERE employee_id = $1`, [id]);
    // 5. Terms acceptance
    const termsRes = await query(`SELECT * FROM employee_terms_acceptance WHERE employee_id = $1`, [id]);
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
        kyc: kycRes.rows[0] || null,
        documents: docsRes.rows,
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
