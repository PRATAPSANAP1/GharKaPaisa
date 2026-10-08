const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query, getClient } = require('../../config/database');
const { logAction } = require('../admin/audit.service.js');
const { getPaginationParams, sanitizeMobile } = require('../../utils/helpers/helpers');
const { success, created, error, paginate, notFound } = require('../../utils/response/response');
const logger = require('../../config/logger');

const resolveBankId = async (bId) => {
  if (!bId) return null;
  const str = String(bId).trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  if (isUuid) return str;

  if (str.toUpperCase() === 'LOC_EOC' || /loc[\s/_]*eoc|loan\s+on\s+card/i.test(str)) {
    const { rows } = await query(`
      SELECT id FROM banks 
      WHERE UPPER(short_code) = 'LOC_EOC' 
         OR LOWER(name) LIKE '%loc/eoc%' 
         OR LOWER(name) LIKE '%loan on card%' 
      LIMIT 1
    `);
    if (rows.length > 0) return rows[0].id;
    const { rows: created } = await query(`
      INSERT INTO banks (name, short_code, is_active, status)
      VALUES ('LOC/EOC (Loan on Card & Smart EMI)', 'LOC_EOC', true, 'Active')
      ON CONFLICT (short_code) DO UPDATE SET 
        name = 'LOC/EOC (Loan on Card & Smart EMI)',
        is_active = true,
        status = 'Active'
      RETURNING id
    `);
    return created[0]?.id || null;
  }

  // Look up bank by id, short_code, or name if not a direct UUID
  const { rows } = await query(`
    SELECT id FROM banks 
    WHERE id::text = $1 
       OR UPPER(short_code) = UPPER($1) 
       OR LOWER(name) = LOWER($1) 
    LIMIT 1
  `, [str]).catch(() => ({ rows: [] }));
  if (rows.length > 0) return rows[0].id;

  return null;
};

const insertBankAssignment = async (adminId, bankId, category, createdById) => {
  const cat = (category || 'credit_card').toLowerCase() === 'loc_eoc' ? 'loc_eoc' : 'credit_card';
  try {
    await query(
      `INSERT INTO admin_bank_assignments (admin_id, bank_id, category, created_by) VALUES ($1, $2, $3, $4) ON CONFLICT (admin_id, bank_id, category) DO NOTHING`,
      [adminId, bankId, cat, createdById]
    );
  } catch (err1) {
    try {
      await query(
        `INSERT INTO admin_bank_assignments (admin_id, bank_id, category, created_by) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [adminId, bankId, cat, createdById]
      );
    } catch (err2) {
      try {
        await query(
          `INSERT INTO admin_bank_assignments (admin_id, bank_id, created_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [adminId, bankId, createdById]
        );
      } catch (err3) {
        await query(
          `INSERT INTO admin_bank_assignments (admin_id, bank_id) VALUES ($1, $2)`,
          [adminId, bankId]
        ).catch(() => {});
      }
    }
  }
};

const parseAssignmentPairsFromBody = (body) => {
  if (!body) return null;
  let assignmentPairs = [];
  if (Array.isArray(body.category_assignments)) {
    assignmentPairs = body.category_assignments;
  } else if (Array.isArray(body.assignments)) {
    assignmentPairs = body.assignments;
  } else if (body.category_assignments && typeof body.category_assignments === 'object') {
    Object.keys(body.category_assignments).forEach(cat => {
      const arr = body.category_assignments[cat];
      if (Array.isArray(arr)) {
        arr.forEach(bId => assignmentPairs.push({ category: cat, bank_id: bId }));
      }
    });
  } else if (body.categoryAssignments && typeof body.categoryAssignments === 'object') {
    Object.keys(body.categoryAssignments).forEach(cat => {
      const arr = body.categoryAssignments[cat];
      if (Array.isArray(arr)) {
        arr.forEach(bId => assignmentPairs.push({ category: cat, bank_id: bId }));
      }
    });
  } else {
    const rawBankIds = Array.isArray(body.bank_ids) ? body.bank_ids : (Array.isArray(body.bankIds) ? body.bankIds : null);
    if (rawBankIds) {
      rawBankIds.forEach(rawBId => {
        if (String(rawBId).toUpperCase() === 'LOC_EOC') {
          assignmentPairs.push({ category: 'loc_eoc', bank_id: rawBId });
        } else {
          assignmentPairs.push({ category: 'credit_card', bank_id: rawBId });
        }
      });
    } else {
      return null;
    }
  }
  return assignmentPairs;
};

/**
 * POST /api/v1/superadmin/create-admin
 * Provision a new admin or employee in Firebase Auth and PostgreSQL.
 */
const createAdmin = async (req, res, next) => {
  try {
    let { 
      fullName, email, mobile, role,
      password, confirmPassword, department, designation 
    } = req.body;

    role = role || 'ADMIN';
    department = department || 'Operations';

    console.log("CREATE ADMIN REQUEST:", req.body);
    console.log("ROLE:", role);

    if (!fullName || !email || !mobile || !password || !confirmPassword || !designation) {
      console.log("FAILED: Missing required fields");
      return error(res, 'All required fields must be provided', 400);
    }

    if (String(designation || '').toUpperCase().includes('KYC OPERATOR') || String(designation || '').toUpperCase() === 'KYC_OPERATOR') {
      role = 'KYC_OPERATOR';
    }

    if (!['ADMIN', 'EMPLOYEE', 'HR', 'KYC_OPERATOR'].includes(role)) {
      return error(res, 'Role must be either ADMIN, EMPLOYEE, HR, or KYC_OPERATOR', 400);
    }

    if (password !== confirmPassword) {
      console.log("FAILED: Password mismatch");
      return error(res, 'Passwords do not match', 400);
    }

    const formattedMobile = sanitizeMobile(mobile);

    // Check if email already exists
    const { rows: [existingEmail] } = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existingEmail) {
      return error(res, 'A user with this email address already exists', 400);
    }

    // Check if mobile already exists
    const { rows: [existingMobile] } = await query(`SELECT id FROM users WHERE mobile = $1`, [formattedMobile]);
    if (existingMobile) {
      return error(res, 'A user with this mobile number already exists', 400);
    }

    // Check bank assignment requirement BEFORE user insert
    const bankIds = Array.isArray(req.body.bank_ids) ? req.body.bank_ids : (req.body.bank_id ? [req.body.bank_id] : []);
    const desigUpper = String(designation || '').toUpperCase();
    const isOpHead = ['OPERATIONAL_HEAD', 'OPERATIONAL HEAD', 'BACKEND', 'BACKEND OPERATION', 'BACKEND_OPERATION', 'ADMINISTRATIVE_OPERATOR', 'ADMINISTRATIVE OPERATOR', 'ADMINISTRATIVE_SALES_EXECUTIVE', 'ADMINISTRATIVE SALES EXECUTIVE', 'PAN_CHECKER', 'PAN CHECKER', 'REMARK_OPERATOR', 'REMARK OPERATOR', 'QD_OPERATOR', 'QD OPERATOR', 'FINAL_STATUS_OPERATOR', 'FINAL STATUS OPERATOR', 'QUERABLE_OPERATOR', 'QUERABLE OPERATOR', 'QUERYABLE_OPERATOR', 'QUERYABLE OPERATOR'].includes(desigUpper);
    if (isOpHead && bankIds.length === 0) {
      return error(res, 'At least one assigned bank is required for Operational Head, Administrative Operator, Administrative Sales Executive, PAN Checker, Remark Operator, QD Operator, Final Status Operator, or Querable Operator designation', 400);
    }

    let uniqueEmployeeId = req.body.employeeId || req.body.employee_id || '';
    if (!uniqueEmployeeId || !/^CAND\d+$/.test(uniqueEmployeeId)) {
      try {
        const { rows } = await query(`SELECT nextval('candidate_reference_seq') AS seq`);
        if (rows[0]?.seq) {
          uniqueEmployeeId = `CAND${rows[0].seq}`;
        }
      } catch (e) {}
      if (!uniqueEmployeeId) {
        let isUnique = false;
        while (!isUnique) {
          const num = Math.floor(10000 + Math.random() * 90000);
          uniqueEmployeeId = `CAND${num}`;
          const { rows: [existingEmployee] } = await query(`SELECT id FROM users WHERE employee_id = $1`, [uniqueEmployeeId]);
          if (!existingEmployee) isUnique = true;
        }
      }
    }

    // Ensure HR, EMPLOYEE, and KYC_OPERATOR enum values exist safely
    try {
      await query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'HR'`);
      await query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'EMPLOYEE'`);
      await query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'KYC_OPERATOR'`);
    } catch (e) {}

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new User
    const { rows: [dbUser] } = await query(
      `INSERT INTO users (
        email, mobile, password_hash, role, status, 
        full_name, employee_id, department, designation, created_by, is_active, email_verified
      )
      VALUES ($1, $2, $3, $9::user_role, 'active'::user_status, $4, $5, $6, $7, $8, true, true)
      RETURNING id, email, role, status`,
      [email, formattedMobile, hashedPassword, fullName, uniqueEmployeeId, department, designation, req.user?.id || null, role]
    );

    logger.info(`Super admin ${req.user.email} created new user: ${email} with role: ${role}`);

    if (role === 'EMPLOYEE') {
      await query(`
        INSERT INTO employees (
          employee_id, user_id, full_name, mobile_number, email_id, designation, department, joining_date, employment_type, employee_status, activation_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, 'Full-time', 'ACTIVE', 'APPROVED')
        ON CONFLICT (mobile_number) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          employee_id = EXCLUDED.employee_id,
          full_name = EXCLUDED.full_name,
          designation = EXCLUDED.designation,
          department = EXCLUDED.department,
          employee_status = 'ACTIVE',
          activation_status = 'APPROVED'
      `, [uniqueEmployeeId, dbUser.id, fullName, formattedMobile, email, designation, department]).catch(e => logger.warn('Employees sync note:', e.message));
    } else if (role === 'HR') {
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
        )
      `).catch(() => {});

      await query(`
        INSERT INTO hr_profiles (
          user_id, employee_id, full_name, email, mobile_number, designation, department, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
        ON CONFLICT (employee_id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          mobile_number = EXCLUDED.mobile_number,
          designation = EXCLUDED.designation,
          department = EXCLUDED.department,
          status = 'active'
      `, [dbUser.id, uniqueEmployeeId, fullName, email, formattedMobile, designation || 'HR Manager', department || 'Human Resources']).catch(e => logger.warn('HR profile sync note:', e.message));

      // Ensure HR is removed from employees table (and clean up child FK records)
      const targetEmpSubquery = `SELECT id FROM employees WHERE user_id = $1 OR mobile_number = $2`;
      await query(`DELETE FROM employee_onboarding_checklist WHERE employee_id IN (${targetEmpSubquery})`, [dbUser.id, formattedMobile]).catch(() => {});
      await query(`DELETE FROM employee_hierarchy WHERE employee_id IN (${targetEmpSubquery})`, [dbUser.id, formattedMobile]).catch(() => {});
      await query(`DELETE FROM employee_joining_details WHERE employee_id IN (${targetEmpSubquery})`, [dbUser.id, formattedMobile]).catch(() => {});
      await query(`DELETE FROM employee_kyc WHERE employee_id IN (${targetEmpSubquery})`, [dbUser.id, formattedMobile]).catch(() => {});
      await query(`DELETE FROM employee_documents WHERE employee_id IN (${targetEmpSubquery})`, [dbUser.id, formattedMobile]).catch(() => {});
      await query(`DELETE FROM employee_terms_acceptance WHERE employee_id IN (${targetEmpSubquery})`, [dbUser.id, formattedMobile]).catch(() => {});
      await query(`DELETE FROM employee_product_links WHERE employee_id IN (${targetEmpSubquery})`, [dbUser.id, formattedMobile]).catch(() => {});
      await query(`DELETE FROM employee_incentive_transactions WHERE employee_id IN (${targetEmpSubquery})`, [dbUser.id, formattedMobile]).catch(() => {});
      await query(`DELETE FROM employees WHERE user_id = $1 OR mobile_number = $2`, [dbUser.id, formattedMobile]).catch(() => {});
    }

    const isNewUserOpHead = ['Operational Head', 'OPERATIONAL_HEAD', 'OPERATIONAL HEAD', 'OPERATIONS HEAD', 'OPERATIONS_HEAD'].includes(dbUser.designation)
      || ['OPERATIONAL_HEAD', 'OPERATIONAL HEAD', 'OPERATIONS_HEAD', 'OPERATIONS HEAD'].includes(dbUser.role);

    let assignmentPairs = [];
    if (Array.isArray(req.body.category_assignments)) {
      assignmentPairs = req.body.category_assignments;
    } else if (Array.isArray(req.body.assignments)) {
      assignmentPairs = req.body.assignments;
    } else if (req.body.category_assignments && typeof req.body.category_assignments === 'object') {
      Object.keys(req.body.category_assignments).forEach(cat => {
        const arr = req.body.category_assignments[cat];
        if (Array.isArray(arr)) {
          arr.forEach(bId => assignmentPairs.push({ category: cat, bank_id: bId }));
        }
      });
    } else if (req.body.categoryAssignments && typeof req.body.categoryAssignments === 'object') {
      Object.keys(req.body.categoryAssignments).forEach(cat => {
        const arr = req.body.categoryAssignments[cat];
        if (Array.isArray(arr)) {
          arr.forEach(bId => assignmentPairs.push({ category: cat, bank_id: bId }));
        }
      });
    } else if (bankIds && bankIds.length > 0) {
      bankIds.forEach(rawBId => {
        if (String(rawBId).toUpperCase() === 'LOC_EOC') {
          assignmentPairs.push({ category: 'loc_eoc', bank_id: rawBId });
        } else {
          assignmentPairs.push({ category: 'credit_card', bank_id: rawBId });
        }
      });
    }

    if (assignmentPairs.length > 0) {
      for (const pair of assignmentPairs) {
        const bId = await resolveBankId(pair.bank_id || pair.id);
        if (!bId) continue;
        const cat = (pair.category || 'credit_card').toLowerCase() === 'loc_eoc' ? 'loc_eoc' : 'credit_card';
        await insertBankAssignment(dbUser.id, bId, cat, req.user.id);
        if (isNewUserOpHead) {
          await query(`UPDATE banks SET operation_head_id = $1 WHERE id = $2`, [dbUser.id, bId]);
          await query(`UPDATE products SET operation_head_id = $1 WHERE bank_id = $2`, [dbUser.id, bId]);
          const { rows: bRows } = await query(`SELECT short_code, name FROM banks WHERE id = $1`, [bId]);
          if (bRows.length > 0 && ((bRows[0].short_code || '').toUpperCase() === 'LOC_EOC' || /loc[\s/_]*eoc|loan\s+on\s+card/i.test(bRows[0].name || '') || cat === 'loc_eoc')) {
            await query(`UPDATE products SET operation_head_id = $1 WHERE category = 'loc_eoc' OR category::text IN ('loan_on_credit_card', 'smart_emi')`, [dbUser.id]);
          }
        }
      }
    }
    const hasLocEocInput = req.body.has_loc_eoc !== undefined ? Boolean(req.body.has_loc_eoc) : (req.body.hasLocEoc !== undefined ? Boolean(req.body.hasLocEoc) : assignmentPairs.some(p => (p.category || '').toLowerCase() === 'loc_eoc' || String(p.bank_id).toUpperCase() === 'LOC_EOC'));
    if (hasLocEocInput) {
      await query(`UPDATE users SET has_loc_eoc = TRUE WHERE id = $1`, [dbUser.id]);
    }
    await logAction(req, 'CREATE_USER', dbUser.id, { email, role: dbUser.role, bankIds, assignmentPairs });

    return created(res, {
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      status: dbUser.status
    }, `Administrative user provisioned successfully.`);
  } catch (err) {
    next(err);
  }
};

const listAdmins = async (req, res, next) => {
  try {
    const roleFilter = req.query.role ? String(req.query.role).trim().toUpperCase() : null;
    let whereClause = `WHERE role::text IN ('ADMIN', 'SUPER_ADMIN', 'KYC_OPERATOR', 'HR') OR designation IN ('Operational Head', 'Administrative Operator', 'Administrative Sales Executive', 'PAN Checker', 'Remark Operator', 'QD Operator', 'KYC Operator', 'Final Status Operator', 'Querable Operator', 'Queryable Operator', 'Backend', 'Super Admin')`;
    const params = [];
    if (roleFilter && roleFilter !== 'ALL' && roleFilter !== 'ADMIN') {
      whereClause = `WHERE role::text = $1`;
      params.push(roleFilter);
    }

    const { rows: admins } = await query(`
      SELECT 
        id as _id, 
        email, 
        mobile, 
        role, 
        status, 
        full_name as "fullName", 
        employee_id as "employeeId", 
        department, 
        designation, 
        is_active as "isActive", 
        COALESCE((to_jsonb(users)->>'has_loc_eoc')::boolean, FALSE) as has_loc_eoc,
        created_by as "createdBy", 
        created_at as "createdAt"
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
    `, params);
    let assignments = [];
    try {
      const { rows } = await query(`
        SELECT aba.admin_id, COALESCE(aba.category, 'credit_card') as category, b.id as bank_id, b.name as bank_name, b.short_code, b.short_code as code, b.logo_url 
        FROM admin_bank_assignments aba 
        JOIN banks b ON b.id = aba.bank_id
      `);
      assignments = rows;
    } catch (abaErr) {
      const { rows } = await query(`
        SELECT aba.admin_id, 'credit_card' as category, b.id as bank_id, b.name as bank_name, b.short_code, b.short_code as code, b.logo_url 
        FROM admin_bank_assignments aba 
        JOIN banks b ON b.id = aba.bank_id
      `);
      assignments = rows;
    }
    const adminBankMap = {};
    const adminBankIdMap = {};
    const adminCategoryMap = {};
    assignments.forEach(a => {
      if (!adminBankMap[a.admin_id]) {
        adminBankMap[a.admin_id] = [];
        adminBankIdMap[a.admin_id] = [];
        adminCategoryMap[a.admin_id] = { credit_card: [], loc_eoc: [] };
      }
      const cat = a.category || 'credit_card';
      const isLocEoc = cat === 'loc_eoc' || (a.short_code || '').toUpperCase() === 'LOC_EOC' || /loc[\s/_]*eoc|loan\s+on\s+card/i.test(a.bank_name || '');
      const bankItem = { id: a.bank_id, bank_id: a.bank_id, name: a.bank_name, category: cat, short_code: a.short_code || a.code, logo_url: a.logo_url, is_loc_eoc: isLocEoc };
      adminBankMap[a.admin_id].push(bankItem);
      adminBankIdMap[a.admin_id].push(a.bank_id);
      if (!adminCategoryMap[a.admin_id][cat]) adminCategoryMap[a.admin_id][cat] = [];
      adminCategoryMap[a.admin_id][cat].push(a.bank_id);
    });
    const result = admins.map(a => {
      const assigned = adminBankMap[a._id] || [];
      const hasLocEoc = Boolean(a.has_loc_eoc) || assigned.some(b => b.is_loc_eoc);
      return {
        ...a,
        id: a._id,
        has_loc_eoc: hasLocEoc,
        hasLocEoc: hasLocEoc,
        assigned_banks: assigned,
        category_assignments: adminCategoryMap[a._id] || { credit_card: [], loc_eoc: [] },
        bank_ids: adminBankIdMap[a._id] || []
      };
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, email, mobile, designation, role, status, password, bank_ids, bankIds } = req.body;

    const targetBankIds = Array.isArray(bank_ids) ? bank_ids : (Array.isArray(bankIds) ? bankIds : null);

    const { rows: [existing] } = await query(`SELECT id, role, designation, full_name, email, mobile, employee_id FROM users WHERE id::text = $1`, [id]);
    if (!existing) {
      return notFound(res, 'Administrator user not found.');
    }

    const updates = [];
    const params = [];
    let pIdx = 1;

    if (fullName !== undefined) {
      updates.push(`full_name = $${pIdx++}`);
      params.push(fullName.trim());
    }
    if (email !== undefined) {
      updates.push(`email = $${pIdx++}`);
      params.push(email.trim().toLowerCase());
    }
    if (mobile !== undefined) {
      updates.push(`mobile = $${pIdx++}`);
      params.push(mobile.trim());
    }
    let normRole = null;
    if (role !== undefined && role.trim()) {
      normRole = role.trim().toUpperCase();
      await query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'HR'`).catch(() => {});
      await query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'EMPLOYEE'`).catch(() => {});
      await query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN'`).catch(() => {});
      await query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PARTNER'`).catch(() => {});
      await query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN'`).catch(() => {});
      updates.push(`role = $${pIdx++}::user_role`);
      params.push(normRole);
    }
    if (designation !== undefined) {
      updates.push(`designation = $${pIdx++}`);
      params.push(designation.trim());
    }
    if (status !== undefined) {
      updates.push(`status = $${pIdx++}::user_status`);
      params.push(status.trim().toLowerCase());
    }
    if (password && password.trim().length >= 6) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(password.trim(), 10);
      updates.push(`password_hash = $${pIdx++}`);
      params.push(hash);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      params.push(existing.id);
      await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${pIdx}`, params);
    }

    if (normRole) {
      await query(`UPDATE users SET user_role = $1 WHERE id = $2`, [normRole, existing.id]).catch(() => {});
      if (normRole === 'HR') {
        const fullNameVal = fullName !== undefined ? fullName.trim() : (existing.full_name || 'HR Manager');
        const emailVal = email !== undefined ? email.trim().toLowerCase() : existing.email;
        const mobileVal = mobile !== undefined ? mobile.trim() : existing.mobile;
        const designationVal = designation !== undefined ? designation.trim() : (existing.designation || 'HR Manager');
        
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
          )
        `).catch(() => {});

        await query(`
          INSERT INTO hr_profiles (
            user_id, employee_id, full_name, email, mobile_number, designation, department, status
          ) VALUES ($1, $2, $3, $4, $5, $6, 'Human Resources', 'active')
          ON CONFLICT (employee_id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            mobile_number = EXCLUDED.mobile_number,
            designation = EXCLUDED.designation,
            status = 'active'
        `, [existing.id, existing.employee_id || `HR-${Date.now()}`, fullNameVal, emailVal, mobileVal, designationVal]).catch(() => {});
      }
    }

    // Handle bank assignments
    let assignmentPairs = parseAssignmentPairsFromBody(req.body);
    if (assignmentPairs !== null) {
      await query(`DELETE FROM admin_bank_assignments WHERE admin_id = $1`, [existing.id]);
      await query(`UPDATE banks SET operation_head_id = NULL WHERE operation_head_id = $1`, [existing.id]);
      await query(`UPDATE products SET operation_head_id = NULL WHERE operation_head_id = $1`, [existing.id]);

      const currentDesig = designation !== undefined ? designation.trim() : existing.designation;
      const currentRole = role !== undefined ? role.trim() : existing.role;
      const isTargetOpHead = ['Operational Head', 'OPERATIONAL_HEAD', 'OPERATIONAL HEAD', 'OPERATIONS HEAD', 'OPERATIONS_HEAD'].includes(currentDesig)
        || ['OPERATIONAL_HEAD', 'OPERATIONAL HEAD', 'OPERATIONS_HEAD', 'OPERATIONS HEAD'].includes(currentRole);

      for (const pair of assignmentPairs) {
        const bId = await resolveBankId(pair.bank_id || pair.id);
        if (!bId) continue;
        const cat = (pair.category || 'credit_card').toLowerCase() === 'loc_eoc' ? 'loc_eoc' : 'credit_card';
        await insertBankAssignment(existing.id, bId, cat, req.user.id);
        if (isTargetOpHead) {
          await query(`UPDATE banks SET operation_head_id = $1 WHERE id = $2`, [existing.id, bId]);
          await query(`UPDATE products SET operation_head_id = $1 WHERE bank_id = $2`, [existing.id, bId]);
          const { rows: bRows } = await query(`SELECT short_code, name FROM banks WHERE id = $1`, [bId]);
          if (bRows.length > 0 && ((bRows[0].short_code || '').toUpperCase() === 'LOC_EOC' || /loc[\s/_]*eoc|loan\s+on\s+card/i.test(bRows[0].name || '') || cat === 'loc_eoc')) {
            await query(`UPDATE products SET operation_head_id = $1 WHERE category = 'loc_eoc' OR category::text IN ('loan_on_credit_card', 'smart_emi')`, [existing.id]);
          }
        }
      }

      if (req.body.has_loc_eoc !== undefined || req.body.hasLocEoc !== undefined) {
        const val = req.body.has_loc_eoc !== undefined ? Boolean(req.body.has_loc_eoc) : Boolean(req.body.hasLocEoc);
        await query(`UPDATE users SET has_loc_eoc = $1 WHERE id = $2`, [val, existing.id]);
      } else {
        let locCheckRows = [];
        try {
          const resLoc = await query(`
            SELECT 1 FROM admin_bank_assignments aba
            JOIN banks b ON b.id = aba.bank_id
            WHERE aba.admin_id = $1 AND (aba.category = 'loc_eoc' OR UPPER(COALESCE(b.short_code, '')) = 'LOC_EOC' OR b.name ~* 'loc|loan on card|smart emi')
          `, [existing.id]);
          locCheckRows = resLoc.rows;
        } catch (abaErr) {
          const resLoc = await query(`
            SELECT 1 FROM admin_bank_assignments aba
            JOIN banks b ON b.id = aba.bank_id
            WHERE aba.admin_id = $1 AND (UPPER(COALESCE(b.short_code, '')) = 'LOC_EOC' OR b.name ~* 'loc|loan on card|smart emi')
          `, [existing.id]);
          locCheckRows = resLoc.rows;
        }
        const hasLoc = locCheckRows.length > 0;
        await query(`UPDATE users SET has_loc_eoc = $1 WHERE id = $2`, [hasLoc, existing.id]);
      }
    }

    await logAction(req, 'UPDATE_USER', existing.id, { email, designation, role, assignmentPairs });

    return success(res, { id: existing.id }, 'Administrator updated successfully.');
  } catch (err) {
    next(err);
  }
};

const getAdminBanks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [userRec] } = await query(`SELECT COALESCE(has_loc_eoc, FALSE) as has_loc_eoc FROM users WHERE id::text = $1`, [id]);
    let rows = [];
    try {
      const resBanks = await query(`
        SELECT aba.bank_id as id, aba.bank_id, COALESCE(aba.category, 'credit_card') as category, b.name, b.short_code, b.logo_url 
        FROM admin_bank_assignments aba
        JOIN banks b ON b.id = aba.bank_id
        WHERE aba.admin_id::text = $1
      `, [id]);
      rows = resBanks.rows;
    } catch (abaErr) {
      const resBanks = await query(`
        SELECT aba.bank_id as id, aba.bank_id, 'credit_card' as category, b.name, b.short_code, b.logo_url 
        FROM admin_bank_assignments aba
        JOIN banks b ON b.id = aba.bank_id
        WHERE aba.admin_id::text = $1
      `, [id]);
      rows = resBanks.rows;
    }
    const mapped = rows.map(b => ({
      ...b,
      category: b.category || 'credit_card',
      is_loc_eoc: b.category === 'loc_eoc' || (b.short_code || '').toUpperCase() === 'LOC_EOC' || /loc[\s/_]*eoc|loan\s+on\s+card/i.test(b.name || '')
    }));
    return success(res, mapped);
  } catch (err) {
    next(err);
  }
};

const updateAdminBanks = async (req, res, next) => {
  try {
    const { id } = req.params;
    let assignmentPairs = parseAssignmentPairsFromBody(req.body);
    if (!assignmentPairs) assignmentPairs = [];

    const { rows: [userRec] } = await query(`SELECT id, role, designation FROM users WHERE id::text = $1`, [id]);
    if (!userRec) return notFound(res, 'Admin not found');

    await query(`DELETE FROM admin_bank_assignments WHERE admin_id = $1`, [userRec.id]);
    await query(`UPDATE banks SET operation_head_id = NULL WHERE operation_head_id = $1`, [userRec.id]);
    await query(`UPDATE products SET operation_head_id = NULL WHERE operation_head_id = $1`, [userRec.id]);

    const isTargetOpHead = ['Operational Head', 'OPERATIONAL_HEAD', 'OPERATIONAL HEAD', 'OPERATIONS HEAD', 'OPERATIONS_HEAD'].includes(userRec.designation)
      || ['OPERATIONAL_HEAD', 'OPERATIONAL HEAD', 'OPERATIONS_HEAD', 'OPERATIONS HEAD'].includes(userRec.role);

    for (const pair of assignmentPairs) {
      const bId = await resolveBankId(pair.bank_id || pair.id);
      if (!bId) continue;
      const cat = (pair.category || 'credit_card').toLowerCase() === 'loc_eoc' ? 'loc_eoc' : 'credit_card';
      await insertBankAssignment(userRec.id, bId, cat, req.user.id);
      if (isTargetOpHead) {
        await query(`UPDATE banks SET operation_head_id = $1 WHERE id = $2`, [userRec.id, bId]);
        await query(`UPDATE products SET operation_head_id = $1 WHERE bank_id = $2`, [userRec.id, bId]);
        const { rows: bRows } = await query(`SELECT short_code, name FROM banks WHERE id = $1`, [bId]);
        if (bRows.length > 0 && ((bRows[0].short_code || '').toUpperCase() === 'LOC_EOC' || /loc[\s/_]*eoc|loan\s+on\s+card/i.test(bRows[0].name || '') || cat === 'loc_eoc')) {
          await query(`UPDATE products SET operation_head_id = $1 WHERE category = 'loc_eoc' OR category::text IN ('loan_on_credit_card', 'smart_emi')`, [userRec.id]);
        }
      }
    }

    if (req.body.has_loc_eoc !== undefined || req.body.hasLocEoc !== undefined) {
      const val = req.body.has_loc_eoc !== undefined ? Boolean(req.body.has_loc_eoc) : Boolean(req.body.hasLocEoc);
      await query(`UPDATE users SET has_loc_eoc = $1 WHERE id = $2`, [val, userRec.id]);
    } else {
      let locCheckRows = [];
      try {
        const resLoc = await query(`
          SELECT 1 FROM admin_bank_assignments aba
          JOIN banks b ON b.id = aba.bank_id
          WHERE aba.admin_id = $1 AND (aba.category = 'loc_eoc' OR UPPER(COALESCE(b.short_code, '')) = 'LOC_EOC' OR b.name ~* 'loc|loan on card|smart emi')
        `, [userRec.id]);
        locCheckRows = resLoc.rows;
      } catch (abaErr) {
        const resLoc = await query(`
          SELECT 1 FROM admin_bank_assignments aba
          JOIN banks b ON b.id = aba.bank_id
          WHERE aba.admin_id = $1 AND (UPPER(COALESCE(b.short_code, '')) = 'LOC_EOC' OR b.name ~* 'loc|loan on card|smart emi')
        `, [userRec.id]);
        locCheckRows = resLoc.rows;
      }
      const hasLoc = locCheckRows.length > 0;
      await query(`UPDATE users SET has_loc_eoc = $1 WHERE id = $2`, [hasLoc, userRec.id]);
    }

    return success(res, { adminId: userRec.id, assignedPairs: assignmentPairs }, 'Bank assignments updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/superadmin/block-user
 * Suspend/unsuspend a user in the database and revoke Firebase session tokens if blocked.
 */
const blockUser = async (req, res, next) => {
  try {
    const { userId, block } = req.body;

    if (userId === undefined || block === undefined) {
      return error(res, 'userId and block parameters are required', 400);
    }

    // Prevent blocking oneself
    if (userId === req.user.id) {
      return error(res, 'You are not permitted to block yourself.', 400);
    }

    // 1. Check if user exists in database
    const { rows: [targetUser] } = await query(
      `SELECT id, email, role, status FROM users WHERE id::text = $1`,
      [userId]
    );

    if (!targetUser) {
      return error(res, 'User not found', 404);
    }

    const newStatus = block ? 'suspended' : 'active';
    const actionName = block ? 'BLOCK_USER' : 'UNBLOCK_USER';

    // 2. Update status in PostgreSQL
    await query(
      `UPDATE users SET status = $1::user_status, updated_at = NOW() WHERE id = $2`,
      [newStatus, targetUser.id]
    );

    // 3. Removed Firebase token revocation

    // 4. Log to audit logs
    await logAction(req, actionName, targetUser.id, { email: targetUser.email, role: targetUser.role });

    return success(res, {}, `User status updated to ${newStatus} successfully.`);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/superadmin/unlock-user
 * Unlock a user account that was temporarily locked due to failed login attempts.
 */
const unlockUser = async (req, res, next) => {
  try {
    const { userId, identity } = req.body;
    if (!userId && !identity) {
      return error(res, 'userId or identity (email/mobile) parameter is required', 400);
    }

    let targetUser;
    if (userId) {
      const { rows: [user] } = await query(`SELECT id, email, role FROM users WHERE id::text = $1`, [userId]);
      targetUser = user;
    } else {
      const clean = String(identity).trim().toLowerCase();
      const { rows: [user] } = await query(`SELECT id, email, role FROM users WHERE LOWER(email) = $1 OR mobile = $1`, [clean]);
      targetUser = user;
    }

    if (!targetUser) {
      return error(res, 'User not found', 404);
    }

    await query(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = $1`, [targetUser.id]);
    await logAction(req, 'UNLOCK_USER', targetUser.id, { email: targetUser.email, role: targetUser.role });

    return success(res, { userId: targetUser.id }, 'User account has been unlocked successfully.');
  } catch (err) {
    next(err);
  }
};


/**
 * GET /api/v1/superadmin/audit-logs
 * Fetch system audit logs with pagination and filters.
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { action, admin_user, start_date, end_date } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let idx = 1;

    if (action) {
      whereClause += ` AND al.action = $${idx++}`;
      values.push(action);
    }

    if (admin_user) {
      whereClause += ` AND (u.email ILIKE $${idx} OR u.id::text = $${idx} OR u.firebase_uid = $${idx})`;
      values.push(admin_user.includes('@') ? `%${admin_user}%` : admin_user);
      idx++;
    }

    if (start_date) {
      whereClause += ` AND al.created_at >= $${idx++}`;
      values.push(new Date(start_date));
    }

    if (end_date) {
      whereClause += ` AND al.created_at <= $${idx++}`;
      values.push(new Date(end_date));
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ${whereClause}
    `;

    const dataQuery = `
      SELECT al.id, al.action, al.target_id, al.details, al.created_at,
             u.id as admin_id, u.email as admin_email, u.role as admin_role
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const [countResult, dataResult] = await Promise.all([
      query(countQuery, values),
      query(dataQuery, [...values, limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count);
    return paginate(res, dataResult.rows, total, page, limit);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/superadmin/admins/:id
 * Delete an administrator user permanently.
 */
const deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting oneself
    if (id === req.user.id) {
      return error(res, 'You are not permitted to delete your own account.', 400);
    }

    // Check if user exists and is admin/employee
    let { rows: [targetUser] } = await query(
      `SELECT id, email, role FROM users WHERE id::text = $1`,
      [id]
    );

    if (!targetUser) {
      const { rows: [partner] } = await query(
        `SELECT user_id FROM partner_profiles WHERE id::text = $1`,
        [id]
      );
      if (partner?.user_id) {
        const { rows: [userByPartner] } = await query(
          `SELECT id, email, role FROM users WHERE id::text = $1`,
          [partner.user_id]
        );
        targetUser = userByPartner;
      }
    }

    // Delete user
    const mode = req.query.mode || req.body?.mode || 'permanent';
    const { softDeleteUserAccount, deleteUserAccount } = require('../auth/user-deletion.service.js');
    if (mode === 'temporary') {
      await softDeleteUserAccount(targetUser ? targetUser.id : id);
    } else {
      await deleteUserAccount(targetUser ? targetUser.id : id);
    }

    // Record action in audit logs
    if (targetUser) {
      await logAction(req, 'DELETE_USER', targetUser.id, { email: targetUser.email, role: targetUser.role }).catch(() => {});
    }

    return success(res, {}, 'Administrator account deleted successfully.');
  } catch (err) {
    next(err);
  }
};

const updatePartnerStatus = async (req, res, next) => {
  try {
    const { userId, status } = req.body;

    if (!userId || !status) {
      return error(res, 'userId and status are required', 400);
    }

    let checkStatus = status.toLowerCase();
    if (checkStatus === 'pending_verification') {
      checkStatus = 'pending';
    }

    const validStatuses = ['active', 'inactive', 'pending', 'suspended', 'rejected', 'blocked'];
    if (!validStatuses.includes(checkStatus)) {
      return error(res, `Invalid status value. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Resolve user: either it is direct user_id, or it is partner profile ID
    let targetUser;
    const { rows: [userById] } = await query(`SELECT id, email, role, status FROM users WHERE id::text = $1`, [userId]);
    if (userById) {
      targetUser = userById;
    } else {
      const { rows: [userByPartnerId] } = await query(`
        SELECT u.id, u.email, u.role, u.status 
        FROM users u 
        JOIN partner_profiles ap ON ap.user_id = u.id 
        WHERE ap.id::text = $1
      `, [userId]);
      if (userByPartnerId) {
        targetUser = userByPartnerId;
      }
    }

    if (!targetUser) {
      return error(res, 'User or Partner Profile not found', 404);
    }

    // Prevent changing oneself
    if (targetUser.id === req.user.id) {
      return error(res, 'You are not permitted to change your own status.', 400);
    }

    const oldStatus = targetUser.status;
    const newStatus = checkStatus;

    // Update in database
    await query(
      `UPDATE users SET status = $1::user_status, updated_at = NOW() WHERE id = $2`,
      [newStatus, targetUser.id]
    );

    // Fetch partner details for status email
    try {
      const { rows: [partnerProfile] } = await query(`
        SELECT first_name, last_name, kyc_status, rejection_reason 
        FROM partner_profiles 
        WHERE user_id = $1
      `, [targetUser.id]);

      if (partnerProfile && targetUser.email) {
        const { sendPartnerStatusUpdateEmail } = require('../../services/email/email.service.js');
        await sendPartnerStatusUpdateEmail(
          targetUser.email,
          partnerProfile.first_name,
          partnerProfile.last_name,
          newStatus,
          partnerProfile.kyc_status,
          partnerProfile.rejection_reason
        );
      }
    } catch (mailErr) {
      logger.error('Failed to send status update email in updatePartnerStatus:', mailErr.message);
    }

    // Log to audit logs
    await logAction(req, 'UPDATE_PARTNER_STATUS', targetUser.id, { 
      email: targetUser.email, 
      role: targetUser.role, 
      oldStatus, 
      newStatus 
    });

    return success(res, {}, `Partner status updated from ${oldStatus} to ${newStatus} successfully.`);
  } catch (err) {
    logger.error('updatePartnerStatus failed:', { error: err.message, stack: err.stack, body: req.body });
    next(err);
  }
};


/**
 * Commission Rules CRUD
 */
const createCommissionRule = async (req, res, next) => {
  try {
    const { productId, partnerPercentage, parentPercentage, campaignBonus, status } = req.body;
    
    if (!productId) {
      return error(res, 'Product ID is required', 400);
    }

    const { rows: [rule] } = await query(`
      INSERT INTO commission_rules (product_id, partner_percentage, parent_percentage, campaign_bonus, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [productId, partnerPercentage || 90, parentPercentage || 10, campaignBonus || 0, status || 'active']);

    await logAction(req, 'CREATE_COMMISSION_RULE', rule.id, { productId, partnerPercentage });

    return created(res, rule, 'Commission rule created successfully');
  } catch (err) {
    next(err);
  }
};

const getCommissionRules = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT cr.*, p.name as product_name
      FROM commission_rules cr
      LEFT JOIN products p ON p.id = cr.product_id
      ORDER BY cr.created_at DESC
    `);
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

const approveKYC = async (req, res, next) => {
  const { partnerId } = req.body;
  if (!partnerId) return error(res, 'partnerId is required', 400);

  const client = await getClient();
  try {
    const { rows: [partner] } = await client.query(`SELECT user_id, first_name, last_name FROM partner_profiles WHERE id = $1`, [partnerId]);
    if (!partner) return notFound(res, 'Partner profile not found');

    const { rows: [user] } = await client.query(`SELECT email FROM users WHERE id = $1`, [partner.user_id]);

    await client.query('BEGIN');

    // 1. Update partner profile
    await client.query(`
      UPDATE partner_profiles 
      SET kyc_status = 'approved', 
          kyc_reviewed_at = NOW(), 
          kyc_reviewed_by = $1,
          rejection_reason = NULL,
          kyc_rejection_reason = NULL
      WHERE id = $2
    `, [req.user.id, partnerId]);

    // 2. Update user status to active
    await client.query(`UPDATE users SET status = 'active' WHERE id = $1`, [partner.user_id]);

    // 3. Mark all documents as approved
    await client.query(`
      UPDATE kyc_documents 
      SET verified = true, 
          verification_status = 'approved',
          verified_by = $1,
          verified_at = NOW()
      WHERE partner_id = $2
    `, [req.user.id, partnerId]);

    // 4. Mark video as approved
    await client.query(`
      UPDATE partner_videos 
      SET verification_status = 'approved'
      WHERE partner_id = $1
    `, [partnerId]);

    // 5. Ensure wallet exists
    const { ensureWallet } = require('../wallet/service.js');
    await ensureWallet(partnerId, client);

    await client.query('COMMIT');

    // Send notifications
    try {
      const { notify } = require('../notifications/service.js');
      const { sendPartnerStatusUpdateEmail } = require('../../services/email/email.service.js');
      await notify.kycApproved(partner.user_id);
      if (user?.email) {
        await sendPartnerStatusUpdateEmail(user.email, partner.first_name, partner.last_name, 'active', 'approved', null);
      }
    } catch (notifErr) {
      logger.error('Failed to send KYC approval notifications:', notifErr.message);
    }

    await logAction(req, 'APPROVE_KYC', partnerId, { userId: partner.user_id });

    return success(res, {}, 'Partner KYC approved and profile activated successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const rejectKYC = async (req, res, next) => {
  const { partnerId, rejection_reason } = req.body;
  if (!partnerId) return error(res, 'partnerId is required', 400);
  if (!rejection_reason) return error(res, 'rejection_reason is required', 400);

  const client = await getClient();
  try {
    const { rows: [partner] } = await client.query(`SELECT user_id, first_name, last_name FROM partner_profiles WHERE id = $1`, [partnerId]);
    if (!partner) return notFound(res, 'Partner profile not found');

    const { rows: [user] } = await client.query(`SELECT email FROM users WHERE id = $1`, [partner.user_id]);

    await client.query('BEGIN');

    // 1. Update partner profile
    await client.query(`
      UPDATE partner_profiles 
      SET kyc_status = 'rejected', 
          kyc_reviewed_at = NOW(), 
          kyc_reviewed_by = $1,
          rejection_reason = $2,
          kyc_rejection_reason = $2
      WHERE id = $3
    `, [req.user.id, rejection_reason, partnerId]);

    // 2. Update user status
    // await client.query(`UPDATE users SET status = 'inactive'::user_status WHERE id = $1`, [partner.user_id]);

    // 3. Mark all unverified documents as rejected
    await client.query(`
      UPDATE kyc_documents 
      SET verification_status = 'rejected'
      WHERE partner_id = $1 AND verified = false
    `, [partnerId]);

    // 4. Mark video as rejected
    await client.query(`
      UPDATE partner_videos 
      SET verification_status = 'rejected'
      WHERE partner_id = $1
    `, [partnerId]);

    await client.query('COMMIT');

    // Send notifications
    try {
      const { notify } = require('../notifications/service.js');
      const { sendPartnerStatusUpdateEmail } = require('../../services/email/email.service.js');
      await notify.kycRejected(partner.user_id, rejection_reason);
      if (user?.email) {
        await sendPartnerStatusUpdateEmail(user.email, partner.first_name, partner.last_name, 'rejected', 'rejected', rejection_reason);
      }
    } catch (notifErr) {
      logger.error('Failed to send KYC rejection notifications:', notifErr.message);
    }

    await logAction(req, 'REJECT_KYC', partnerId, { userId: partner.user_id, rejection_reason });

    return success(res, {}, 'Partner KYC rejected successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const requestChangesKYC = async (req, res, next) => {
  const { partnerId, rejection_reason, rejected_documents } = req.body;
  if (!partnerId) return error(res, 'partnerId is required', 400);
  if (!rejection_reason) return error(res, 'rejection_reason is required', 400);
  if (!Array.isArray(rejected_documents) || rejected_documents.length === 0) {
    return error(res, 'rejected_documents list is required and must contain document types', 400);
  }

  const client = await getClient();
  try {
    const { rows: [partner] } = await client.query(`SELECT user_id, first_name, last_name FROM partner_profiles WHERE id = $1`, [partnerId]);
    if (!partner) return notFound(res, 'Partner profile not found');

    const { rows: [user] } = await client.query(`SELECT email FROM users WHERE id = $1`, [partner.user_id]);

    await client.query('BEGIN');

    // 1. Update partner profile status to rejected
    await client.query(`
      UPDATE partner_profiles 
      SET kyc_status = 'rejected', 
          kyc_reviewed_at = NOW(), 
          kyc_reviewed_by = $1,
          rejection_reason = $2,
          kyc_rejection_reason = $2
      WHERE id = $3
    `, [req.user.id, rejection_reason, partnerId]);

    // 2. Set user status to inactive so they correct documents
    // await client.query(`UPDATE users SET status = 'inactive'::user_status WHERE id = $1`, [partner.user_id]);

    // 3. Mark selected documents as rejected
    for (const docType of rejected_documents) {
      if (docType === 'video') {
        await client.query(`
          UPDATE partner_videos 
          SET verification_status = 'rejected'
          WHERE partner_id = $1
        `, [partnerId]);
      } else {
        await client.query(`
          UPDATE kyc_documents 
          SET verification_status = 'rejected',
              verified = false
          WHERE partner_id = $1 AND doc_type = $2
        `, [partnerId, docType]);
      }
    }

    // 4. Mark non-rejected documents as approved/verified
    await client.query(`
      UPDATE kyc_documents
      SET verification_status = 'approved',
          verified = true,
          verified_by = $1,
          verified_at = NOW()
      WHERE partner_id = $2 AND NOT (doc_type = ANY($3))
    `, [req.user.id, partnerId, rejected_documents]);

    if (!rejected_documents.includes('video')) {
      await client.query(`
        UPDATE partner_videos 
        SET verification_status = 'approved'
        WHERE partner_id = $1
      `, [partnerId]);
    }

    await client.query('COMMIT');

    // Send notifications
    try {
      const { notify } = require('../notifications/service.js');
      const { sendPartnerStatusUpdateEmail } = require('../../services/email/email.service.js');
      await notify.kycRejected(partner.user_id, rejection_reason);
      if (user?.email) {
        await sendPartnerStatusUpdateEmail(user.email, partner.first_name, partner.last_name, 'rejected', 'rejected', rejection_reason);
      }
    } catch (notifErr) {
      logger.error('Failed to send KYC request-changes notifications:', notifErr.message);
    }

    await logAction(req, 'REQUEST_KYC_CHANGES', partnerId, { userId: partner.user_id, rejected_documents, rejection_reason });

    return success(res, {}, 'KYC correction requested successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const verifyDocument = async (req, res, next) => {
  const { partnerId, docType, status, rejectionReason } = req.body;
  if (!partnerId) return error(res, 'partnerId is required', 400);
  if (!docType) return error(res, 'docType is required', 400);
  if (!status || !['approved', 'rejected'].includes(status)) {
    return error(res, 'status must be approved or rejected', 400);
  }
  if (status === 'rejected' && !rejectionReason) {
    return error(res, 'rejectionReason is required when status is rejected', 400);
  }

  const client = await getClient();
  try {

    await client.query('BEGIN');

    // 1. Update document status
    if (docType === 'video') {
      await client.query(`
        UPDATE partner_videos 
        SET verification_status = $1, rejection_reason = $2
        WHERE partner_id = $3
      `, [status, status === 'rejected' ? rejectionReason : null, partnerId]);
    } else {
      const isVerified = status === 'approved';
      await client.query(`
        UPDATE kyc_documents 
        SET verification_status = $1, 
            verified = $2, 
            verified_by = $3, 
            verified_at = NOW(),
            rejection_reason = $4
        WHERE partner_id = $5 AND doc_type = $6
      `, [status, isVerified, req.user.id, status === 'rejected' ? rejectionReason : null, partnerId, docType]);
    }

    // 2. Fetch partner profile
    const { rows: [partner] } = await client.query(`
      SELECT user_id, first_name, last_name, gst_number 
      FROM partner_profiles 
      WHERE id = $1
    `, [partnerId]);
    if (!partner) {
      await client.query('ROLLBACK');
      return notFound(res, 'Partner profile not found');
    }

    const { rows: [user] } = await client.query(`SELECT email FROM users WHERE id = $1`, [partner.user_id]);

    // 3. Fetch all document statuses for recalculation
    const { rows: documents } = await client.query(`
      SELECT doc_type, verification_status, rejection_reason 
      FROM kyc_documents 
      WHERE partner_id = $1
    `, [partnerId]);

    const { rows: [video] } = await client.query(`
      SELECT verification_status, rejection_reason 
      FROM partner_videos 
      WHERE partner_id = $1
    `, [partnerId]);

    // 4. Required documents logic — only consider docs the partner has actually uploaded
    const uploadedDocTypes = documents.map(d => d.doc_type);
    const hasVideo = !!video;

    // Build the list of required docs from what was actually uploaded
    // Always require pan, aadhaar, cancelled_cheque if uploaded
    const coreRequired = ['pan', 'cancelled_cheque'];
    const uploadedRequired = coreRequired.filter(d => uploadedDocTypes.includes(d));
    if (hasVideo) uploadedRequired.push('video');
    if (partner.gst_number && partner.gst_number.trim() !== '' && uploadedDocTypes.includes('gst_cert')) {
      uploadedRequired.push('gst_cert');
    }

    // Must have at least pan, aadhaar, cancelled_cheque and video to be approvable
    const minimumRequired = ['pan', 'cancelled_cheque'];
    const hasMinimum = minimumRequired.every(d => uploadedDocTypes.includes(d)) && hasVideo;

    const docStatusMap = {};
    const docReasonMap = {};
    documents.forEach(d => {
      docStatusMap[d.doc_type] = d.verification_status;
      docReasonMap[d.doc_type] = d.rejection_reason;
    });
    docStatusMap['video'] = video ? video.verification_status : null;
    docReasonMap['video'] = video ? video.rejection_reason : null;

    const rejectedReqDocs = uploadedRequired.filter(d => docStatusMap[d] === 'rejected');
    const approvedReqDocs = uploadedRequired.filter(d => docStatusMap[d] === 'approved');
    const requiredDocs = uploadedRequired;

    let newKycStatus = 'pending';
    let combinedRejectionReason = null;

    if (rejectedReqDocs.length > 0) {
      newKycStatus = 'rejected';
      const reasonsList = rejectedReqDocs.map(d => {
        const docName = d.replace('_', ' ').toUpperCase();
        return `${docName}: ${docReasonMap[d] || 'Verification failed'}`;
      });
      combinedRejectionReason = reasonsList.join('; ');

      await client.query(`
        UPDATE partner_profiles 
        SET kyc_status = 'rejected', 
            rejection_reason = $1,
            kyc_rejection_reason = $1,
            approved_by = NULL,
            approved_at = NULL,
            kyc_reviewed_at = NOW(),
            kyc_reviewed_by = $2
        WHERE id = $3
      `, [combinedRejectionReason, req.user.id, partnerId]);

      // await client.query(`UPDATE users SET status = 'inactive'::user_status WHERE id = $1`, [partner.user_id]);

    } else if (hasMinimum && approvedReqDocs.length === requiredDocs.length) {
      newKycStatus = 'approved';

      await client.query(`
        UPDATE partner_profiles 
        SET kyc_status = 'approved', 
            rejection_reason = NULL,
            kyc_rejection_reason = NULL,
            approved_by = $1,
            approved_at = NOW(),
            kyc_reviewed_at = NOW(),
            kyc_reviewed_by = $1
        WHERE id = $2
      `, [req.user.id, partnerId]);

      await client.query(`UPDATE users SET status = 'active' WHERE id = $1`, [partner.user_id]);

      const { ensureWallet } = require('../wallet/service.js');
      await ensureWallet(partnerId, client);

    } else {
      newKycStatus = 'under_review';

      await client.query(`
        UPDATE partner_profiles 
        SET kyc_status = 'under_review', 
            rejection_reason = NULL,
            kyc_rejection_reason = NULL,
            approved_by = NULL,
            approved_at = NULL,
            kyc_reviewed_at = NULL,
            kyc_reviewed_by = NULL
        WHERE id = $1
      `, [partnerId]);

      // await client.query(`UPDATE users SET status = 'pending' WHERE id = $1`, [partner.user_id]);
    }

    await client.query('COMMIT');

    // Send notifications
    try {
      const { notify } = require('../notifications/service.js');
      const { sendPartnerStatusUpdateEmail } = require('../../services/email/email.service.js');

      if (newKycStatus === 'approved') {
        await notify.kycApproved(partner.user_id);
        if (user?.email) {
          await sendPartnerStatusUpdateEmail(user.email, partner.first_name, partner.last_name, 'active', 'approved', null);
        }
      } else if (newKycStatus === 'rejected') {
        await notify.kycRejected(partner.user_id, combinedRejectionReason);
        if (user?.email) {
          await sendPartnerStatusUpdateEmail(user.email, partner.first_name, partner.last_name, 'rejected', 'rejected', combinedRejectionReason);
        }
      }
    } catch (notifErr) {
      logger.error('Failed to send KYC verification notifications:', notifErr.message);
    }
    await logAction(req, 'VERIFY_DOCUMENT', partnerId, { 
      docType, 
      status, 
      overallStatus: newKycStatus,
      rejectionReason 
    });

    return success(res, { overallStatus: newKycStatus }, 'Document verification updated successfully');

  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ── Referral & Team Analytics ──────────────────────────────────────────────────────────────────
const getReferralAnalytics = async (req, res, next) => {
  try {
    const { getReferralAnalytics: fetchAnalytics } = require('../admin/analytics.service.js');
    const analytics = await fetchAnalytics();
    return success(res, analytics, 'Referral and team analytics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const isUuid = (str) => typeof str === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

const getOperationHeads = async (req, res, next) => {
  try {
    const { rows: users } = await query(`
      SELECT 
        u.id, u.email, u.mobile, u.role, u.status, u.full_name, u.employee_id, u.department, u.designation, u.is_active
      FROM users u
      WHERE u.role IN ('ADMIN', 'EMPLOYEE', 'SUPER_ADMIN')
      ORDER BY u.full_name ASC
    `);

    const { rows: banks } = await query(`
      SELECT b.id, b.name, b.short_code, b.logo_url, b.operation_head_id
      FROM banks b
      WHERE b.operation_head_id IS NOT NULL
    `);

    const bankMap = {};
    banks.forEach(b => {
      if (!bankMap[b.operation_head_id]) bankMap[b.operation_head_id] = [];
      bankMap[b.operation_head_id].push(b);
    });

    const result = users.map(u => ({
      ...u,
      assigned_banks: bankMap[u.id] || []
    }));

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const assignBankOperationHead = async (req, res, next) => {
  try {
    const { bankId, operationHeadId } = req.body;
    if (!bankId) return error(res, 'bankId is required', 400);

    const validHeadId = isUuid(operationHeadId) ? operationHeadId : null;

    await query(`UPDATE banks SET operation_head_id = $1, updated_at = NOW() WHERE id = $2`, [validHeadId, bankId]);
    await query(`UPDATE products SET operation_head_id = $1, updated_at = NOW() WHERE bank_id = $2`, [validHeadId, bankId]);

    return success(res, {}, 'Bank assigned to Operation Head successfully.');
  } catch (err) {
    next(err);
  }
};

const getPartnersCommissionOverview = async (req, res, next) => {
  try {
    const { rows: partners } = await query(`
      SELECT 
        p.id, p.user_id, p.partner_code, p.first_name, p.last_name, p.profile_photo_url, p.rank,
        u.email, u.mobile, u.status,
        (SELECT COUNT(*)::int FROM partner_team_relationships WHERE parent_partner_id = p.id AND level = 1) AS team_count
      FROM partner_profiles p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
    `);

    const { rows: teamMembers } = await query(`
      SELECT 
        cp.id, cp.user_id, cp.parent_partner_id, cp.partner_code, cp.first_name, cp.last_name, 
        COALESCE(cp.commission_rate, 90.00) AS commission_rate,
        u.email, u.mobile, u.status, r.level
      FROM partner_team_relationships r
      JOIN partner_profiles cp ON cp.id = r.child_partner_id
      JOIN users u ON u.id = cp.user_id
      WHERE r.level = 1
      ORDER BY cp.created_at DESC
    `);

    const teamMap = {};
    teamMembers.forEach(m => {
      if (!teamMap[m.parent_partner_id]) {
        teamMap[m.parent_partner_id] = [];
      }
      teamMap[m.parent_partner_id].push({
        id: m.id,
        user_id: m.user_id,
        partner_code: m.partner_code,
        full_name: `${m.first_name || ''} ${m.last_name || ''}`.trim(),
        email: m.email,
        mobile: m.mobile,
        status: m.status,
        level: m.level,
        commission_rate: parseFloat(m.commission_rate || 90.00),
        parent_share: parseFloat((100 - parseFloat(m.commission_rate || 90.00)).toFixed(2))
      });
    });

    const result = partners.map(p => ({
      id: p.id,
      user_id: p.user_id,
      partner_code: p.partner_code,
      full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      email: p.email,
      mobile: p.mobile,
      rank: p.rank || 'Partner',
      status: p.status,
      team_count: parseInt(p.team_count) || 0,
      team_members: teamMap[p.id] || []
    }));

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCommissionRule,
  getCommissionRules,
  getPartnersCommissionOverview,
  createAdmin,
  listAdmins,
  updateAdmin,
  getAdminBanks,
  updateAdminBanks,
  blockUser,
  unlockUser,
  getAuditLogs,
  deleteAdmin,
  updatePartnerStatus,
  approveKYC,
  rejectKYC,
  requestChangesKYC,
  verifyDocument,
  getReferralAnalytics,
  getOperationHeads,
  assignBankOperationHead
};
