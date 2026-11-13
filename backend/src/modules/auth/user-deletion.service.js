const { getClient } = require('../../config/database');
const logger = require('../../config/logger');

const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

/**
 * Temporary Deletion (Soft Delete / Deactivate / Suspend Account)
 * Follows flow for all user roles: Super Admin safety check -> Check user/employee/partner -> Deactivate profile -> Deactivate wallet/tokens -> Mark inactive
 * @param {string} inputId - UUID of user or employee or partner_profile or team_member
 * @returns {Promise<Object>} Updated user record
 */
const softDeleteUserAccount = async (inputId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const safeQuery = async (sql, params = []) => {
      try {
        await client.query('SAVEPOINT sp_sq');
        const res = await client.query(sql, params);
        await client.query('RELEASE SAVEPOINT sp_sq');
        return res;
      } catch (err) {
        logger.warn(`Savepoint query skipped: ${sql}`, err.message);
        await client.query('ROLLBACK TO SAVEPOINT sp_sq');
        return { rows: [] };
      }
    };

    const safeExec = async (sql, params = []) => {
      try {
        await client.query('SAVEPOINT sp_se');
        await client.query(sql, params);
        await client.query('RELEASE SAVEPOINT sp_se');
      } catch (err) {
        logger.warn(`Savepoint statement skipped: ${sql}`, err.message);
        await client.query('ROLLBACK TO SAVEPOINT sp_se');
      }
    };

    let actualUserId = null;
    let actualPartnerId = null;
    let actualEmployeeId = null;
    let userRecord = null;
    let empRecord = null;

    // 1. Check partner_team_relationships
    const { rows: tmRows } = await safeQuery(
      `SELECT child_partner_id, parent_partner_id FROM partner_team_relationships WHERE id::text = $1 OR child_partner_id::text = $1 OR parent_partner_id::text = $1 LIMIT 1`,
      [inputId]
    );
    if (tmRows[0]) {
      actualPartnerId = tmRows[0].child_partner_id || tmRows[0].parent_partner_id;
      const { rows: [p] } = await safeQuery(`SELECT user_id FROM partner_profiles WHERE id::text = $1`, [actualPartnerId]);
      actualUserId = p?.user_id || null;
    }

    // 2. Check employees
    const { rows: [emp] } = await safeQuery(
      `SELECT id, user_id, employee_id, email_id, mobile_number, full_name FROM employees WHERE id::text = $1 OR user_id::text = $1 OR employee_id::text = $1 OR email_id ILIKE $1 OR mobile_number = $1 LIMIT 1`,
      [inputId]
    );
    if (emp) {
      actualEmployeeId = emp.id;
      empRecord = emp;
      if (emp.user_id) actualUserId = emp.user_id;
    }

    // 3. Check users
    if (!actualUserId) {
      const { rows: [userDirect] } = await safeQuery(
        `SELECT id, email, role, mobile, full_name, employee_id FROM users WHERE id::text = $1 OR email ILIKE $1 OR mobile = $1 OR employee_id::text = $1 LIMIT 1`,
        [inputId]
      );
      if (userDirect) {
        actualUserId = userDirect.id;
        userRecord = userDirect;
      }
    }

    // 4. Check partner_profiles
    if (!actualUserId) {
      const { rows: [partner] } = await safeQuery(
        `SELECT id, user_id FROM partner_profiles WHERE id::text = $1 OR user_id::text = $1 OR partner_code::text = $1 LIMIT 1`,
        [inputId]
      );
      if (partner) {
        actualPartnerId = partner.id;
        actualUserId = partner.user_id;
      }
    }

    // If empRecord found but actualUserId not found yet, check users by mobile or email
    if (!actualUserId && empRecord) {
      const { rows: [uByContact] } = await safeQuery(
        `SELECT id, email, role, mobile, full_name FROM users WHERE (mobile = $1 AND $1 IS NOT NULL) OR (email ILIKE $2 AND $2 IS NOT NULL) LIMIT 1`,
        [empRecord.mobile_number || null, empRecord.email_id || null]
      );
      if (uByContact) {
        actualUserId = uByContact.id;
        userRecord = uByContact;
      }
    }

    // Resolve userRecord if actualUserId is known
    if (actualUserId && !userRecord) {
      const { rows: [u] } = await safeQuery(
        `SELECT id, email, role, mobile, full_name, employee_id FROM users WHERE id::text = $1`,
        [actualUserId]
      );
      userRecord = u || null;
    }

    // If actualUserId found but empRecord not found yet, find empRecord
    if (actualUserId && !empRecord) {
      const { rows: [eByUser] } = await safeQuery(
        `SELECT id, user_id, employee_id, email_id, mobile_number, full_name FROM employees WHERE user_id::text = $1 OR (email_id ILIKE $2 AND $2 IS NOT NULL) OR (mobile_number = $3 AND $3 IS NOT NULL) LIMIT 1`,
        [actualUserId, userRecord?.email || null, userRecord?.mobile || null]
      );
      if (eByUser) {
        actualEmployeeId = eByUser.id;
        empRecord = eByUser;
      }
    }

    if (actualUserId && !actualPartnerId) {
      const { rows: [partner] } = await safeQuery(
        `SELECT id FROM partner_profiles WHERE user_id::text = $1 LIMIT 1`,
        [actualUserId]
      );
      if (partner) actualPartnerId = partner.id;
    }

    if (!actualUserId && !actualPartnerId && !actualEmployeeId) {
      throw new Error('User, employee, or partner account not found');
    }

    // Prevent deactivating Super Admin accounts
    if (userRecord?.role === 'SUPER_ADMIN') {
      throw new Error('Super Administrator accounts cannot be deleted or suspended.');
    }

    // 5. Deactivate partner and children if applicable
    if (actualPartnerId || actualUserId) {
      if (actualPartnerId) {
        await safeExec(
          `UPDATE partner_profiles SET status = 'suspended', updated_at = NOW() WHERE parent_partner_id::text = $1`,
          [actualPartnerId]
        );
        await safeExec(
          `UPDATE wallet_withdrawals SET status = 'rejected', admin_note = 'Account suspended', updated_at = NOW() WHERE partner_id::text = $1 AND status = 'pending'`,
          [actualPartnerId]
        );
      }
      await safeExec(
        `UPDATE partner_profiles SET status = 'suspended', updated_at = NOW() WHERE id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
    }

    // 6. Deactivate wallets
    if (actualPartnerId || actualUserId) {
      await safeExec(
        `UPDATE partner_wallets SET status = 'inactive', updated_at = NOW() WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
      await safeExec(
        `UPDATE wallets SET status = 'inactive', updated_at = NOW() WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
    }

    const finalEmail = userRecord?.email || empRecord?.email_id || null;
    const finalMobile = userRecord?.mobile || empRecord?.mobile_number || null;
    const finalEmpCode = empRecord?.employee_id || userRecord?.employee_id || null;

    // 7. Deactivate employee record & onboarding checklist if applicable
    await safeExec(
      `UPDATE employees 
       SET employee_status = 'INACTIVE', 
           activation_status = 'SUSPENDED', 
           deactivated_at = NOW(), 
           updated_at = NOW() 
       WHERE id::text = $1 
          OR user_id::text = $2 
          OR employee_id::text = $1
          OR (employee_id::text = $3 AND $3 IS NOT NULL)
          OR (email_id ILIKE $4 AND $4 IS NOT NULL)
          OR (mobile_number = $5 AND $5 IS NOT NULL)`,
      [actualEmployeeId || inputId, actualUserId || '', finalEmpCode, finalEmail, finalMobile]
    );

    if (actualEmployeeId) {
      await safeExec(
        `UPDATE employee_onboarding_checklist SET current_stage = 'SUSPENDED', updated_at = NOW() WHERE employee_id::text = $1`,
        [actualEmployeeId]
      );
    }

    // 8. Deactivate candidate entry if applicable
    if (finalEmpCode || finalMobile || finalEmail) {
      await safeExec(
        `UPDATE employee_candidates 
         SET interview_status = 'SUSPENDED', updated_at = NOW() 
         WHERE (reference_code::text = $1 AND $1 IS NOT NULL)
            OR (mobile_number = $2 AND $2 IS NOT NULL)
            OR (email_id ILIKE $3 AND $3 IS NOT NULL)`,
        [finalEmpCode, finalMobile, finalEmail]
      );
    }

    // 9. Deactivate user account & terminate active tokens
    if (actualUserId) {
      await safeExec(
        `UPDATE users 
         SET status = 'suspended', 
             is_active = FALSE, 
             deactivated_at = NOW(), 
             updated_at = NOW() 
         WHERE id::text = $1 
            OR (email ILIKE $2 AND $2 IS NOT NULL) 
            OR (mobile = $3 AND $3 IS NOT NULL)
            OR (employee_id::text = $4 AND $4 IS NOT NULL)`,
        [actualUserId, finalEmail, finalMobile, finalEmpCode]
      );
      await safeExec(`DELETE FROM refresh_tokens WHERE user_id::text = $1`, [actualUserId]);
    }

    await client.query('COMMIT');
    logger.info(`Successfully soft-deleted (deactivated) account: ${inputId} (User: ${actualUserId})`);
    return { id: actualUserId || inputId, mode: 'temporary', status: 'suspended', success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Error soft-deleting account ${inputId}:`, err);
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Permanent Deletion (Hard Delete User, Employee, Partner, or Admin Account)
 * Unlinks all foreign key constraints, thoroughly purges all records associated with that account across all database tables.
 * @param {string} inputId - UUID, employee_id, email, or mobile of team_member, partner_profile, employee, or user
 * @returns {Promise<Object>} Deleted user record info
 */
const deleteUserAccount = async (inputId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const safeQuery = async (sql, params = []) => {
      try {
        await client.query('SAVEPOINT sp_q');
        const res = await client.query(sql, params);
        await client.query('RELEASE SAVEPOINT sp_q');
        return res;
      } catch (err) {
        logger.warn(`Savepoint query skipped: ${sql}`, err.message);
        await client.query('ROLLBACK TO SAVEPOINT sp_q');
        return { rows: [] };
      }
    };

    const safeExec = async (sql, params = []) => {
      try {
        await client.query('SAVEPOINT sp_del');
        await client.query(sql, params);
        await client.query('RELEASE SAVEPOINT sp_del');
      } catch (err) {
        logger.warn(`Savepoint statement skipped/rolled back: ${sql}`, err.message);
        await client.query('ROLLBACK TO SAVEPOINT sp_del');
      }
    };

    // ── 1. COMPREHENSIVE IDENTITY RESOLUTION ──────────────────────────────────
    let actualUserId = null;
    let userRecord = null;
    const allEmployeeIds = new Set();
    const allPartnerIds = new Set();
    const emails = new Set();
    const mobiles = new Set();
    const empCodes = new Set();

    if (typeof inputId === 'string' && !isUuid(inputId)) {
      if (inputId.includes('@')) {
        emails.add(inputId.trim().toLowerCase());
      } else if (/^\+?\d{8,15}$/.test(inputId.trim())) {
        mobiles.add(inputId.trim());
      } else {
        empCodes.add(inputId.trim());
      }
    }

    // Check team relationships
    const { rows: tmRows } = await safeQuery(
      `SELECT * FROM partner_team_relationships WHERE id::text = $1 OR child_partner_id::text = $1 OR parent_partner_id::text = $1 LIMIT 1`,
      [inputId]
    );
    if (tmRows[0]) {
      const pId = tmRows[0].child_partner_id || tmRows[0].parent_partner_id;
      if (pId) allPartnerIds.add(pId);
      const { rows: [p] } = await safeQuery(`SELECT user_id FROM partner_profiles WHERE id::text = $1`, [pId]);
      if (p?.user_id) actualUserId = p.user_id;
    }

    // Check employees table
    const { rows: empRows } = await safeQuery(
      `SELECT id, user_id, employee_id, full_name, email_id, mobile_number FROM employees WHERE id::text = $1 OR user_id::text = $1 OR employee_id::text = $1 OR email_id ILIKE $1 OR mobile_number = $1`,
      [inputId]
    );
    for (const emp of empRows) {
      allEmployeeIds.add(emp.id);
      if (emp.employee_id) empCodes.add(emp.employee_id.trim());
      if (emp.user_id) actualUserId = emp.user_id;
      if (emp.email_id) emails.add(emp.email_id.trim().toLowerCase());
      if (emp.mobile_number) mobiles.add(emp.mobile_number.trim());
    }

    // Check partner_profiles table
    const { rows: partnerRows } = await safeQuery(
      `SELECT id, user_id, email, mobile, partner_code FROM partner_profiles WHERE id::text = $1 OR user_id::text = $1 OR partner_code::text = $1 OR email ILIKE $1 OR mobile = $1`,
      [inputId]
    );
    for (const p of partnerRows) {
      allPartnerIds.add(p.id);
      if (p.user_id) actualUserId = p.user_id;
      if (p.email) emails.add(p.email.trim().toLowerCase());
      if (p.mobile) mobiles.add(p.mobile.trim());
    }

    // Check users table (UUID, employee_id, email, or mobile)
    if (!actualUserId) {
      const { rows: [uDirect] } = await safeQuery(
        `SELECT id, email, role, mobile, full_name, employee_id FROM users 
         WHERE id::text = $1 
            OR employee_id::text = $1 
            OR email ILIKE $1 
            OR mobile = $1`,
        [inputId]
      );
      if (uDirect) {
        actualUserId = uDirect.id;
        userRecord = uDirect;
        if (uDirect.employee_id) empCodes.add(uDirect.employee_id.trim());
        if (uDirect.email) emails.add(uDirect.email.trim().toLowerCase());
        if (uDirect.mobile) mobiles.add(uDirect.mobile.trim());
      }
    }

    // If still no actualUserId, check by collected empCodes
    if (!actualUserId && empCodes.size > 0) {
      const codes = Array.from(empCodes);
      const { rows: [uByCode] } = await safeQuery(
        `SELECT id, email, role, mobile, full_name, employee_id FROM users WHERE employee_id = ANY($1::text[]) LIMIT 1`,
        [codes]
      );
      if (uByCode) {
        actualUserId = uByCode.id;
        userRecord = uByCode;
        if (uByCode.email) emails.add(uByCode.email.trim().toLowerCase());
        if (uByCode.mobile) mobiles.add(uByCode.mobile.trim());
      }
    }

    // If actualUserId is found, load full user record and all cross-linked identities
    if (actualUserId) {
      if (!userRecord) {
        const { rows: [u] } = await safeQuery(
          `SELECT id, email, role, mobile, full_name, employee_id FROM users WHERE id::text = $1`,
          [actualUserId]
        );
        userRecord = u || null;
      }
      if (userRecord?.email) emails.add(userRecord.email.trim().toLowerCase());
      if (userRecord?.mobile) mobiles.add(userRecord.mobile.trim());
      if (userRecord?.employee_id) empCodes.add(userRecord.employee_id.trim());

      // Fetch all employees for this user
      const { rows: linkedEmps } = await safeQuery(
        `SELECT id, employee_id, email_id, mobile_number FROM employees WHERE user_id::text = $1`,
        [actualUserId]
      );
      for (const e of linkedEmps) {
        allEmployeeIds.add(e.id);
        if (e.employee_id) empCodes.add(e.employee_id.trim());
        if (e.email_id) emails.add(e.email_id.trim().toLowerCase());
        if (e.mobile_number) mobiles.add(e.mobile_number.trim());
      }

      // Fetch all partner profiles for this user
      const { rows: linkedPartners } = await safeQuery(
        `SELECT id, email, mobile FROM partner_profiles WHERE user_id::text = $1`,
        [actualUserId]
      );
      for (const p of linkedPartners) {
        allPartnerIds.add(p.id);
        if (p.email) emails.add(p.email.trim().toLowerCase());
        if (p.mobile) mobiles.add(p.mobile.trim());
      }
    }

    // Convert sets to arrays & filter valid UUIDs
    const empIds = Array.from(allEmployeeIds).filter(Boolean);
    const partnerIds = Array.from(allPartnerIds).filter(Boolean);
    const emailList = Array.from(emails).filter(Boolean);
    const mobileList = Array.from(mobiles).filter(Boolean);
    const codeList = Array.from(empCodes).filter(Boolean);

    const empUuids = empIds.filter(id => isUuid(id));
    const partnerUuids = partnerIds.filter(id => isUuid(id));

    if (!actualUserId && empIds.length === 0 && partnerIds.length === 0 && codeList.length === 0) {
      throw new Error('User, employee, or partner account not found');
    }

    // Prevent permanent deletion of Super Admin accounts
    if (userRecord?.role === 'SUPER_ADMIN') {
      throw new Error('Super Administrator accounts cannot be permanently deleted.');
    }

    logger.info(`Beginning permanent account deletion for inputId: ${inputId}`, {
      userId: actualUserId,
      empUuids,
      partnerUuids,
      codeList,
      emailList,
      mobileList
    });

    // Find a fallback active Super Admin for necessary NOT NULL foreign key reassignments
    let fallbackId = null;
    if (actualUserId) {
      const { rows: [fallbackAdmin] } = await safeQuery(
        `SELECT id FROM users WHERE role = 'SUPER_ADMIN' AND id <> $1 ORDER BY created_at ASC LIMIT 1`,
        [actualUserId]
      );
      fallbackId = fallbackAdmin?.id || null;
    }

    // ── 2. PURGE APPLICATIONS & APPLICATION CHILD RECORDS ─────────────────────
    let targetAppIds = [];
    {
      const conds = [];
      const p = [];
      if (partnerUuids.length > 0) {
        p.push(partnerUuids);
        conds.push(`partner_id = ANY($${p.length}::uuid[])`);
      }
      if (actualUserId) {
        p.push(actualUserId);
        conds.push(`submitted_by = $${p.length} OR customer_id = $${p.length}`);
      }
      if (empUuids.length > 0) {
        p.push(empUuids);
        conds.push(`employee_id = ANY($${p.length}::uuid[])`);
      }
      if (conds.length > 0) {
        const { rows } = await safeQuery(`SELECT id FROM applications WHERE ${conds.join(' OR ')}`, p);
        targetAppIds = rows.map(r => r.id);
      }
    }

    if (targetAppIds.length > 0) {
      await safeExec(`DELETE FROM application_timeline WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM application_notes WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM application_documents WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM application_admin_assignments WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM application_audit_logs WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM application_links WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM application_click_logs WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM physical_application_details WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM bank_card_application_timeline WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM bank_card_applications WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM sbi_cc_application_timeline WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM sbi_credit_card_applications WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM loan_applications WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM insurance_applications WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM direct_card_applications WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM application_operator_history WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM application_employee_assignments WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM commission_ledger WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM employee_bonus_departments WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`UPDATE leads SET application_id = NULL WHERE application_id = ANY($1::uuid[])`, [targetAppIds]);
      await safeExec(`DELETE FROM applications WHERE id = ANY($1::uuid[])`, [targetAppIds]);
    }

    // Clean remaining application child tables where this user or partner has records
    if (actualUserId) {
      await safeExec(`DELETE FROM application_notes WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM application_admin_assignments WHERE admin_user_id = $1 OR assigned_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM application_audit_logs WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM application_links WHERE created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM application_operator_history WHERE operator_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM application_employee_assignments WHERE assigned_to_user_id = $1 OR assigned_by_user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM bank_card_applications WHERE created_by = $1 OR process_by = $1 OR updated_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM sbi_credit_card_applications WHERE created_by = $1 OR process_by = $1 OR updated_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM direct_card_applications WHERE created_by = $1`, [actualUserId]);
    }

    if (partnerUuids.length > 0) {
      await safeExec(`DELETE FROM bank_card_applications WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM sbi_credit_card_applications WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM loan_applications WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM insurance_applications WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM application_click_logs WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`UPDATE applications SET parent_partner_id = NULL WHERE parent_partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`UPDATE applications SET team_member_id = NULL WHERE team_member_id = ANY($1::uuid[])`, [partnerUuids]);
    }

    if (empUuids.length > 0) {
      await safeExec(`UPDATE applications SET employee_id = NULL, assigned_to_employee_id = NULL WHERE employee_id = ANY($1::uuid[]) OR assigned_to_employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`UPDATE applications SET employee_link_id = NULL WHERE employee_link_id IN (SELECT id FROM employee_product_links WHERE employee_id = ANY($1::uuid[]))`, [empUuids]);
      await safeExec(`UPDATE physical_application_details SET assigned_to_employee_id = NULL WHERE assigned_to_employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM application_employee_assignments WHERE assigned_to_employee_id = ANY($1::uuid[])`, [empUuids]);
    }

    // Unlink shared applications where this user was merely assigned, operator, or reviewer
    if (actualUserId) {
      if (fallbackId) {
        await safeExec(`UPDATE applications SET submitted_by = $2 WHERE submitted_by = $1`, [actualUserId, fallbackId]);
        await safeExec(`UPDATE applications SET created_by = $2 WHERE created_by = $1`, [actualUserId, fallbackId]);
      } else {
        await safeExec(`DELETE FROM applications WHERE submitted_by = $1 OR created_by = $1`, [actualUserId]);
      }

      await safeExec(`
        UPDATE applications 
        SET remark_updated_by = NULL,
            approved_by = NULL,
            rejected_by = NULL,
            verified_by = NULL,
            super_admin_verified_by = NULL,
            operator_id = NULL,
            assigned_operator_id = NULL,
            last_operator_id = NULL,
            assigned_admin_id = NULL,
            loan_operator_id = NULL,
            credit_card_operator_id = NULL,
            curable_operator_id = NULL,
            status_updated_by = NULL,
            updated_by = NULL
        WHERE remark_updated_by = $1 
           OR approved_by = $1 
           OR rejected_by = $1 
           OR verified_by = $1 
           OR super_admin_verified_by = $1 
           OR operator_id = $1 
           OR assigned_operator_id = $1 
           OR last_operator_id = $1 
           OR assigned_admin_id = $1 
           OR loan_operator_id = $1 
           OR credit_card_operator_id = $1 
           OR curable_operator_id = $1 
           OR status_updated_by = $1 
           OR updated_by = $1
      `, [actualUserId]);
    }

    // ── 3. PURGE LEADS & CRM RECORDS ──────────────────────────────────────────
    let targetLeadIds = [];
    {
      const conds = [];
      const p = [];
      if (partnerUuids.length > 0) {
        p.push(partnerUuids);
        conds.push(`partner_id = ANY($${p.length}::uuid[]) OR parent_partner_id = ANY($${p.length}::uuid[])`);
      }
      if (actualUserId) {
        p.push(actualUserId);
        conds.push(`created_by = $${p.length} OR assigned_to = $${p.length}`);
      }
      if (conds.length > 0) {
        const { rows } = await safeQuery(`SELECT id FROM leads WHERE ${conds.join(' OR ')}`, p);
        targetLeadIds = rows.map(r => r.id);
      }
    }

    if (targetLeadIds.length > 0) {
      await safeExec(`DELETE FROM lead_followups WHERE lead_id = ANY($1::uuid[])`, [targetLeadIds]);
      await safeExec(`DELETE FROM lead_documents WHERE lead_id = ANY($1::uuid[])`, [targetLeadIds]);
      await safeExec(`DELETE FROM lead_timeline WHERE lead_id = ANY($1::uuid[])`, [targetLeadIds]);
      await safeExec(`DELETE FROM lead_notes WHERE lead_id = ANY($1::uuid[])`, [targetLeadIds]);
      await safeExec(`DELETE FROM lead_assignments WHERE lead_id = ANY($1::uuid[])`, [targetLeadIds]);
      await safeExec(`DELETE FROM lead_activity_logs WHERE lead_id = ANY($1::uuid[])`, [targetLeadIds]);
      await safeExec(`DELETE FROM lead_status_history WHERE lead_id = ANY($1::uuid[])`, [targetLeadIds]);
      await safeExec(`DELETE FROM lead_checklist WHERE lead_id = ANY($1::uuid[])`, [targetLeadIds]);
      await safeExec(`DELETE FROM lead_sla WHERE lead_id = ANY($1::uuid[])`, [targetLeadIds]);
      await safeExec(`UPDATE applications SET lead_id = NULL WHERE lead_id = ANY($1::uuid[])`, [targetLeadIds]);
      await safeExec(`DELETE FROM leads WHERE id = ANY($1::uuid[])`, [targetLeadIds]);
    }

    if (actualUserId) {
      await safeExec(`DELETE FROM lead_followups WHERE scheduled_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM lead_documents WHERE uploaded_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM lead_timeline WHERE created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM lead_notes WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM lead_assignments WHERE assigned_to = $1 OR assigned_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM lead_activity_logs WHERE performed_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM lead_status_history WHERE changed_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM lead_checklist WHERE verified_by = $1`, [actualUserId]);

      if (fallbackId) {
        await safeExec(`UPDATE leads SET scheduled_by = $2 WHERE scheduled_by = $1`, [actualUserId, fallbackId]);
      } else {
        await safeExec(`DELETE FROM leads WHERE scheduled_by = $1`, [actualUserId]);
      }

      await safeExec(`
        UPDATE leads 
        SET assigned_to = NULL, 
            operator_id = NULL, 
            closed_by = NULL, 
            created_by = NULL, 
            updated_by = NULL 
        WHERE assigned_to = $1 
           OR operator_id = $1 
           OR closed_by = $1 
           OR created_by = $1 
           OR updated_by = $1
      `, [actualUserId]);
    }

    // ── 4. PURGE CUSTOMERS ────────────────────────────────────────────────────
    let targetCustIds = [];
    {
      const conds = [];
      const p = [];
      if (actualUserId) {
        p.push(actualUserId);
        conds.push(`created_by = $${p.length}`);
      }
      if (emailList.length > 0) {
        p.push(emailList);
        conds.push(`LOWER(email) = ANY($${p.length}::text[])`);
      }
      if (mobileList.length > 0) {
        p.push(mobileList);
        conds.push(`mobile = ANY($${p.length}::text[])`);
      }
      if (conds.length > 0) {
        const { rows } = await safeQuery(`SELECT id FROM customers WHERE ${conds.join(' OR ')}`, p);
        targetCustIds = rows.map(r => r.id);
      }
    }

    if (targetCustIds.length > 0) {
      await safeExec(`DELETE FROM customer_notes WHERE customer_id = ANY($1::uuid[])`, [targetCustIds]);
      await safeExec(`DELETE FROM customer_documents WHERE customer_id = ANY($1::uuid[])`, [targetCustIds]);
      await safeExec(`DELETE FROM customer_timeline WHERE customer_id = ANY($1::uuid[])`, [targetCustIds]);
      await safeExec(`DELETE FROM customer_followups WHERE customer_id = ANY($1::uuid[])`, [targetCustIds]);
      await safeExec(`DELETE FROM customer_tags WHERE customer_id = ANY($1::uuid[])`, [targetCustIds]);
      await safeExec(`DELETE FROM customer_activity_logs WHERE customer_id = ANY($1::uuid[])`, [targetCustIds]);
      await safeExec(`DELETE FROM customer_communications WHERE customer_id = ANY($1::uuid[])`, [targetCustIds]);
      await safeExec(`DELETE FROM customer_access_tokens WHERE customer_id = ANY($1::uuid[])`, [targetCustIds]);
      await safeExec(`UPDATE leads SET customer_id = NULL WHERE customer_id = ANY($1::uuid[])`, [targetCustIds]);
      await safeExec(`DELETE FROM customers WHERE id = ANY($1::uuid[])`, [targetCustIds]);
    }

    if (actualUserId) {
      if (fallbackId) {
        await safeExec(`UPDATE customers SET created_by = $2 WHERE created_by = $1`, [actualUserId, fallbackId]);
      }
      await safeExec(`DELETE FROM customer_notes WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM customer_documents WHERE verified_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM customer_timeline WHERE created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM customer_followups WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM customer_activity_logs WHERE performed_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM customer_communications WHERE sent_by = $1`, [actualUserId]);
    }
    if (partnerUuids.length > 0) {
      await safeExec(`DELETE FROM customer_notes WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM customer_followups WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
    }

    // ── 5. PURGE WALLETS, TRANSACTIONS, LEDGER & WITHDRAWALS ──────────────────
    let targetWalletIds = [];
    {
      const p = [];
      const conds = [];
      if (partnerUuids.length > 0) {
        p.push(partnerUuids);
        conds.push(`partner_id = ANY($${p.length}::uuid[])`);
      }
      if (actualUserId) {
        p.push(actualUserId);
        conds.push(`user_id = $${p.length}`);
      }
      if (conds.length > 0) {
        const { rows } = await safeQuery(`
          SELECT id FROM partner_wallets WHERE ${conds.join(' OR ')}
          UNION
          SELECT id FROM wallets WHERE ${conds.join(' OR ')}
        `, p);
        targetWalletIds = rows.map(r => r.id);
      }
    }

    if (targetWalletIds.length > 0) {
      await safeExec(`DELETE FROM wallet_audit_logs WHERE wallet_id = ANY($1::uuid[])`, [targetWalletIds]);
      await safeExec(`DELETE FROM wallet_withdrawal_events WHERE withdrawal_id IN (SELECT id FROM wallet_withdrawals WHERE wallet_id = ANY($1::uuid[]))`, [targetWalletIds]);
      await safeExec(`DELETE FROM withdrawal_audit_logs WHERE withdrawal_id IN (SELECT id FROM wallet_withdrawals WHERE wallet_id = ANY($1::uuid[]))`, [targetWalletIds]);
      await safeExec(`DELETE FROM wallet_withdrawals WHERE wallet_id = ANY($1::uuid[])`, [targetWalletIds]);
      await safeExec(`DELETE FROM partner_wallets WHERE id = ANY($1::uuid[])`, [targetWalletIds]);
      await safeExec(`DELETE FROM wallets WHERE id = ANY($1::uuid[])`, [targetWalletIds]);
    }

    if (partnerUuids.length > 0) {
      await safeExec(`DELETE FROM wallet_withdrawal_events WHERE withdrawal_id IN (SELECT id FROM wallet_withdrawals WHERE partner_id = ANY($1::uuid[]))`, [partnerUuids]);
      await safeExec(`DELETE FROM withdrawal_audit_logs WHERE withdrawal_id IN (SELECT id FROM wallet_withdrawals WHERE partner_id = ANY($1::uuid[]))`, [partnerUuids]);
      await safeExec(`DELETE FROM wallet_withdrawals WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM withdrawal_requests WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM wallet_transactions WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM wallet_ledger WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM wallet_reconciliation WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM wallet_bonus WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM wallet_adjustments WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM commission_release_jobs WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM commission_decisions WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM commission_rules WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM commission_structures WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM partner_settlements WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM payout_logs WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM fund_requests WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM razorpay_processed_payments WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM partner_wallets WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM wallets WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
    }

    if (actualUserId) {
      await safeExec(`UPDATE wallet_withdrawals SET approved_by = NULL, processed_by = NULL, transferred_by = NULL WHERE approved_by = $1 OR processed_by = $1 OR transferred_by = $1`, [actualUserId]);
      await safeExec(`UPDATE wallet_transactions SET created_by = NULL, approved_by = NULL, processed_by = NULL WHERE created_by = $1 OR approved_by = $1 OR processed_by = $1`, [actualUserId]);
      await safeExec(`UPDATE wallet_ledger SET created_by = NULL WHERE created_by = $1`, [actualUserId]);
      await safeExec(`UPDATE wallet_adjustments SET adjusted_by = NULL WHERE adjusted_by = $1`, [actualUserId]);
      await safeExec(`UPDATE withdrawal_requests SET processed_by = NULL WHERE processed_by = $1`, [actualUserId]);
      await safeExec(`UPDATE fund_requests SET processed_by = NULL WHERE processed_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM razorpay_fund_requests WHERE requested_by = $1 OR reconciled_by = $1`, [actualUserId]);
      await safeExec(`UPDATE commission_decisions SET decided_by = NULL WHERE decided_by = $1`, [actualUserId]);

      if (fallbackId) {
        await safeExec(`UPDATE commission_structures SET created_by = $2 WHERE created_by = $1`, [actualUserId, fallbackId]);
        await safeExec(`UPDATE commission_rules SET created_by = $2 WHERE created_by = $1`, [actualUserId, fallbackId]);
      } else {
        await safeExec(`DELETE FROM commission_structures WHERE created_by = $1`, [actualUserId]);
        await safeExec(`DELETE FROM commission_rules WHERE created_by = $1`, [actualUserId]);
      }
      await safeExec(`DELETE FROM partner_wallets WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM wallets WHERE user_id = $1`, [actualUserId]);
    }

    // ── 6. PURGE PARTNER PROFILES, TEAMS, REFERRALS & ASSETS ──────────────────
    if (partnerUuids.length > 0) {
      await safeExec(`UPDATE partner_profiles SET parent_partner_id = NULL WHERE parent_partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`UPDATE partner_profiles SET partner_id = NULL WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM partner_team_relationships WHERE parent_partner_id = ANY($1::uuid[]) OR child_partner_id = ANY($1::uuid[]) OR member_partner_id = ANY($1::uuid[]) OR sponsor_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM team_activity WHERE partner_id = ANY($1::uuid[]) OR parent_partner_id = ANY($1::uuid[]) OR child_partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM team_commissions WHERE partner_id = ANY($1::uuid[]) OR parent_partner_id = ANY($1::uuid[]) OR child_partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM team_goals WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM team_notifications WHERE partner_id = ANY($1::uuid[]) OR child_partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM partner_teams WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM partner_referrals WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM referral_clicks WHERE partner_id = ANY($1::uuid[]) OR converted_partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM referral_campaigns WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM invitation_history WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM registration_logs WHERE parent_partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM partner_upgrade_requests WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM partner_saved_products WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM partner_recent_products WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM partner_preferences WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM product_ratings WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM product_share_logs WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM product_views WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM partner_training_progress WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM partner_share_links WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM click_tracking WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM partner_videos WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM kyc_documents WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM partner_bank_details WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM bank_details_history WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM bank_details WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM partner_profiles WHERE id = ANY($1::uuid[])`, [partnerUuids]);
    }

    if (empUuids.length > 0) {
      await safeExec(`UPDATE partner_profiles SET referred_by_employee_id = NULL WHERE referred_by_employee_id = ANY($1::uuid[])`, [empUuids]);
    }

    if (actualUserId) {
      await safeExec(`
        UPDATE partner_profiles 
        SET approved_by = NULL, 
            created_by = NULL, 
            kyc_reviewed_by = NULL 
        WHERE approved_by = $1 
           OR created_by = $1 
           OR kyc_reviewed_by = $1
      `, [actualUserId]);
      await safeExec(`DELETE FROM referral_campaigns WHERE created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM partner_upgrade_requests WHERE user_id = $1 OR reviewed_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM kyc_documents WHERE user_id = $1 OR verified_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM partner_bank_details WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM bank_details_history WHERE changed_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM bank_details WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM partner_profiles WHERE user_id = $1`, [actualUserId]);
    }

    // ── 7. PURGE EMPLOYEES, ATTENDANCE, BIOMETRICS & INCENTIVES ────────────────
    if (empUuids.length > 0) {
      await safeExec(`UPDATE employee_hierarchy SET team_leader_id = NULL WHERE team_leader_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`UPDATE employee_hierarchy SET manager_id = NULL WHERE manager_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`UPDATE employee_hierarchy SET senior_manager_id = NULL WHERE senior_manager_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`UPDATE employee_hierarchy SET branch_head_id = NULL WHERE branch_head_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_hierarchy WHERE employee_id = ANY($1::uuid[])`, [empUuids]);

      await safeExec(`DELETE FROM attendance_logs WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM attendance_verification_queue WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM attendance_verification_sessions WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM attendance_rate_limits WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM attendance_offline_queue WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_attendance_pins WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM device_integrity_logs WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM environment_bypass_approvals WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM attendance_environment_bypasses WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_attendance WHERE employee_id = ANY($1::uuid[])`, [empUuids]);

      await safeExec(`DELETE FROM employee_biometric_templates WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_face_encodings WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM face_verification_reminders WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_face_verification_reminders WHERE employee_id = ANY($1::uuid[])`, [empUuids]);

      await safeExec(`DELETE FROM employee_documents WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_bank_details WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_bank_assignments WHERE employee_id = ANY($1::uuid[])`, [empUuids]);

      await safeExec(`DELETE FROM employee_assigned_products WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_assigned_product_links WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_product_links WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_bonus_rules WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_bonus_transactions WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_incentives WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_incentive_rules WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_incentive_monthly_records WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_incentive_transactions WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_sales_reports WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM sales_reports WHERE employee_id = ANY($1::uuid[])`, [empUuids]);

      await safeExec(`DELETE FROM employee_joining_details WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_kyc WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_terms_acceptance WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_onboarding_checklist WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_verification_states WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_working_hours WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM contest_participants WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM hr_profiles WHERE employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employee_candidates WHERE converted_to_employee_id = ANY($1::uuid[])`, [empUuids]);
      await safeExec(`DELETE FROM employees WHERE id = ANY($1::uuid[])`, [empUuids]);
    }

    if (actualUserId) {
      await safeExec(`DELETE FROM employee_hierarchy WHERE assigned_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM attendance_logs WHERE verified_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM environment_bypass_approvals WHERE requested_by = $1 OR approved_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM attendance_environment_bypasses WHERE requested_by = $1 OR approved_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM attendance_environment_references WHERE created_by = $1`, [actualUserId]);

      await safeExec(`DELETE FROM employee_biometric_templates WHERE enrolled_by = $1 OR revoked_by = $1 OR admin_reviewed_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM face_verification_reminders WHERE sent_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM employee_face_verification_reminders WHERE sent_by = $1`, [actualUserId]);

      await safeExec(`UPDATE employee_documents SET verified_by = NULL WHERE verified_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM employee_bank_assignments WHERE assigned_by = $1`, [actualUserId]);

      // Admin bank assignments: Purge both by admin_id and created_by
      await safeExec(`DELETE FROM admin_bank_assignments WHERE admin_id = $1 OR created_by = $1`, [actualUserId]);

      await safeExec(`UPDATE employee_product_links SET assigned_by = NULL WHERE assigned_by = $1`, [actualUserId]);
      await safeExec(`UPDATE employee_bonus_rules SET created_by = NULL WHERE created_by = $1`, [actualUserId]);
      await safeExec(`UPDATE employee_incentive_rules SET created_by = NULL WHERE created_by = $1`, [actualUserId]);
      await safeExec(`UPDATE employee_incentive_transactions SET processed_by = NULL WHERE processed_by = $1`, [actualUserId]);
      await safeExec(`UPDATE employee_sales_reports SET reviewed_by = NULL WHERE reviewed_by = $1`, [actualUserId]);
      await safeExec(`UPDATE sales_reports SET reviewed_by = NULL WHERE reviewed_by = $1`, [actualUserId]);

      await safeExec(`DELETE FROM operator_claims WHERE operator_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM sales_operator_claims WHERE operator_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM operator_history WHERE operator_id = $1`, [actualUserId]);
      await safeExec(`UPDATE employee_joining_details SET reviewed_by = NULL WHERE reviewed_by = $1`, [actualUserId]);
      await safeExec(`UPDATE employee_kyc SET reviewed_by = NULL WHERE reviewed_by = $1`, [actualUserId]);
      await safeExec(`UPDATE employee_terms_acceptance SET verified_by = NULL WHERE verified_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM contest_participants WHERE employee_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM hr_profiles WHERE user_id = $1`, [actualUserId]);

      await safeExec(
        `UPDATE employee_candidates 
         SET interviewer_id = NULL, created_by = NULL, updated_by = NULL 
         WHERE interviewer_id = $1 OR created_by = $1 OR updated_by = $1`,
        [actualUserId]
      );

      await safeExec(
        `UPDATE employees 
         SET interviewer_id = NULL, created_by = NULL, updated_by = NULL, activated_by = NULL 
         WHERE interviewer_id = $1 OR created_by = $1 OR updated_by = $1 OR activated_by = $1`,
        [actualUserId]
      );

      await safeExec(`DELETE FROM employees WHERE user_id = $1`, [actualUserId]);
    }

    // Clean up admin bank assignments and candidate records by employee codes or emails
    if (codeList.length > 0 || emailList.length > 0) {
      const p = [];
      const conds = [];
      if (codeList.length > 0) {
        p.push(codeList);
        conds.push(`employee_id = ANY($${p.length}::text[])`);
      }
      if (emailList.length > 0) {
        p.push(emailList);
        conds.push(`email ILIKE ANY($${p.length}::text[])`);
      }
      await safeExec(`
        DELETE FROM admin_bank_assignments 
        WHERE admin_id IN (SELECT id FROM users WHERE ${conds.join(' OR ')})
      `, p);

      await safeExec(`
        DELETE FROM employees 
        WHERE ${conds.join(' OR ')}
      `, p);
    }

    // ── 8. PURGE COMMUNICATIONS, MESSENGER, CHATBOT & BULK SMS ───────────────
    if (actualUserId) {
      await safeExec(`DELETE FROM message_reads WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM messages WHERE sender_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM conversation_participants WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM blocked_users WHERE user_id = $1 OR blocked_user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM messenger_assignments WHERE account_user_id = $1 OR assigned_messenger_user_id = $1 OR assigned_by = $1 OR removed_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM chatbot_conversations WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM chatbot_analytics WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM whatsapp_messages WHERE sender_user_id = $1 OR recipient_user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM whatsapp_templates WHERE created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM bulk_sms_recipients WHERE campaign_id IN (SELECT id FROM bulk_sms_campaigns WHERE created_by = $1::text)`, [actualUserId]);
      await safeExec(`DELETE FROM bulk_sms_campaigns WHERE created_by = $1::text`, [actualUserId]);
    }

    // ── 9. PURGE ADMIN WORKING HOURS, NOTIFICATIONS, TICKETS & SESSIONS ───────
    if (actualUserId) {
      await safeExec(`DELETE FROM admin_working_hours WHERE user_id = $1 OR created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM admin_working_hour_policies WHERE user_id = $1 OR created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM admin_working_hour_extensions WHERE user_id = $1 OR created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM admin_working_hour_holidays WHERE user_id = $1 OR created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM device_tokens WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM notification_preferences WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM notifications WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM broadcast_notifications WHERE created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM announcement_recipients WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM announcement_reads WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM announcement_audit_logs WHERE performed_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM announcements WHERE created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM support_tickets WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM report_cache WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM report_exports WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM scheduled_reports WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM activity_logs WHERE performed_by = $1 OR user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM audit_logs WHERE user_id = $1 OR target_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM login_activity WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM login_history WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM security_alerts WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM password_history WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM identity_change_challenges WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM refresh_tokens WHERE user_id = $1`, [actualUserId]);
    }

    if (partnerUuids.length > 0) {
      await safeExec(`DELETE FROM notifications WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM support_tickets WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM report_cache WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM report_exports WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM scheduled_reports WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
      await safeExec(`DELETE FROM activity_logs WHERE partner_id = ANY($1::uuid[])`, [partnerUuids]);
    }

    // Purge email/mobile tokens & verification records
    if (emailList.length > 0) {
      await safeExec(`DELETE FROM pre_verified_emails WHERE LOWER(email) = ANY($1::text[])`, [emailList]);
      await safeExec(`DELETE FROM blacklist WHERE LOWER(value) = ANY($1::text[])`, [emailList]);
    }
    if (mobileList.length > 0) {
      await safeExec(`DELETE FROM msg91_verified_tokens WHERE mobile = ANY($1::text[])`, [mobileList]);
      await safeExec(`DELETE FROM blacklist WHERE value = ANY($1::text[])`, [mobileList]);
    }
    if (mobileList.length > 0 || emailList.length > 0) {
      const p = [];
      const conds = [];
      if (mobileList.length > 0) {
        p.push(mobileList);
        conds.push(`identifier = ANY($${p.length}::text[])`);
      }
      if (emailList.length > 0) {
        p.push(emailList);
        conds.push(`LOWER(identifier) = ANY($${p.length}::text[])`);
      }
      await safeExec(`DELETE FROM otp_verifications WHERE ${conds.join(' OR ')}`, p);
    }

    // ── 10. UNLINK SHARED CATALOG / CONFIG TABLES ─────────────────────────────
    if (actualUserId) {
      await safeExec(`UPDATE users SET created_by = NULL WHERE created_by = $1`, [actualUserId]);
      await safeExec(`UPDATE users SET activated_by = NULL WHERE activated_by = $1`, [actualUserId]);
      await safeExec(`UPDATE users SET deactivated_by = NULL WHERE deactivated_by = $1`, [actualUserId]);
      await safeExec(`UPDATE users SET scheduled_by = NULL WHERE scheduled_by = $1`, [actualUserId]);
      await safeExec(`UPDATE products SET created_by = NULL, updated_by = NULL, last_updated_by = NULL, operation_head_id = NULL WHERE created_by = $1 OR updated_by = $1 OR last_updated_by = $1 OR operation_head_id = $1`, [actualUserId]);
      await safeExec(`UPDATE product_application_settings SET created_by = NULL, updated_by = NULL WHERE created_by = $1 OR updated_by = $1`, [actualUserId]);
      await safeExec(`UPDATE product_documents SET uploaded_by = NULL WHERE uploaded_by = $1`, [actualUserId]);
      await safeExec(`UPDATE product_offers SET created_by = NULL WHERE created_by = $1`, [actualUserId]);
      await safeExec(`UPDATE product_link_audits SET updated_by = NULL WHERE updated_by = $1`, [actualUserId]);
      await safeExec(`UPDATE banks SET created_by = NULL, operation_head_id = NULL WHERE created_by = $1 OR operation_head_id = $1`, [actualUserId]);
      await safeExec(`UPDATE bank_direct_process_links SET created_by = NULL, updated_by = NULL WHERE created_by = $1 OR updated_by = $1`, [actualUserId]);
      await safeExec(`UPDATE contests SET created_by = NULL, updated_by = NULL WHERE created_by = $1 OR updated_by = $1`, [actualUserId]);
      await safeExec(`UPDATE whatsapp_settings SET updated_by = NULL WHERE updated_by = $1`, [actualUserId]);
    }

    // ── 11. FINAL PURGE: DELETE USER RECORD ─────────────────────────────────
    let deletedCount = 0;
    if (actualUserId) {
      const delRes = await client.query(`DELETE FROM users WHERE id = $1`, [actualUserId]);
      deletedCount = delRes.rowCount || 0;
    }

    if (deletedCount === 0 && (codeList.length > 0 || emailList.length > 0 || mobileList.length > 0)) {
      const p = [];
      const conds = [];
      if (codeList.length > 0) {
        p.push(codeList);
        conds.push(`employee_id = ANY($${p.length}::text[])`);
      }
      if (emailList.length > 0) {
        p.push(emailList);
        conds.push(`email ILIKE ANY($${p.length}::text[])`);
      }
      if (mobileList.length > 0) {
        p.push(mobileList);
        conds.push(`mobile = ANY($${p.length}::text[])`);
      }
      if (conds.length > 0) {
        const altDel = await client.query(`DELETE FROM users WHERE ${conds.join(' OR ')}`, p);
        deletedCount = altDel.rowCount || 0;
      }
    }

    // Verify deletion
    if (actualUserId) {
      const { rows: verifyRows } = await client.query(`SELECT id FROM users WHERE id = $1`, [actualUserId]);
      if (verifyRows.length > 0) {
        throw new Error(`Permanent purge verification failed: User ${actualUserId} is still present in users table.`);
      }
    }

    await client.query('COMMIT');
    logger.info(`Successfully executed comprehensive permanent deletion for: ${inputId}`, {
      purgedUserId: actualUserId,
      purgedEmployees: empUuids,
      purgedPartners: partnerUuids,
      purgedApplications: targetAppIds.length,
      purgedLeads: targetLeadIds.length,
      purgedCustomers: targetCustIds.length
    });

    return userRecord || { 
      id: actualUserId || inputId, 
      mode: 'permanent', 
      success: true,
      purgedSummary: {
        userId: actualUserId,
        employeeCount: empUuids.length,
        partnerCount: partnerUuids.length,
        applicationCount: targetAppIds.length,
        leadCount: targetLeadIds.length,
        customerCount: targetCustIds.length
      }
    };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Error executing permanent deletion for ${inputId}:`, err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  softDeleteUserAccount,
  deleteUserAccount
};
