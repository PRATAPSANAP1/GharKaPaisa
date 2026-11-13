const { getClient } = require('../../config/database');
const logger = require('../../config/logger');

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

    // Check users table
    if (!actualUserId) {
      const { rows: [uDirect] } = await safeQuery(
        `SELECT id, email, role, mobile, full_name FROM users WHERE id::text = $1 OR email ILIKE $1 OR mobile = $1`,
        [inputId]
      );
      if (uDirect) {
        actualUserId = uDirect.id;
        userRecord = uDirect;
      }
    }

    // If actualUserId is found, load full user record and all cross-linked identities
    if (actualUserId) {
      if (!userRecord) {
        const { rows: [u] } = await safeQuery(
          `SELECT id, email, role, mobile, full_name FROM users WHERE id::text = $1`,
          [actualUserId]
        );
        userRecord = u || null;
      }
      if (userRecord?.email) emails.add(userRecord.email.trim().toLowerCase());
      if (userRecord?.mobile) mobiles.add(userRecord.mobile.trim());

      // Fetch all employees for this user
      const { rows: linkedEmps } = await safeQuery(
        `SELECT id, email_id, mobile_number FROM employees WHERE user_id::text = $1`,
        [actualUserId]
      );
      for (const e of linkedEmps) {
        allEmployeeIds.add(e.id);
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

    // Convert sets to arrays
    const empIds = Array.from(allEmployeeIds).filter(Boolean);
    const partnerIds = Array.from(allPartnerIds).filter(Boolean);
    const emailList = Array.from(emails).filter(Boolean);
    const mobileList = Array.from(mobiles).filter(Boolean);

    if (!actualUserId && empIds.length === 0 && partnerIds.length === 0) {
      throw new Error('User, employee, or partner account not found');
    }

    // Prevent permanent deletion of Super Admin accounts
    if (userRecord?.role === 'SUPER_ADMIN') {
      throw new Error('Super Administrator accounts cannot be permanently deleted.');
    }

    logger.info(`Beginning permanent account deletion for inputId: ${inputId}`, {
      userId: actualUserId,
      empIds,
      partnerIds,
      emailList,
      mobileList
    });

    // ── 2. PURGE APPLICATIONS & APPLICATION CHILD RECORDS ─────────────────────
    // Identify all applications directly owned, submitted by, or created for this account
    const { rows: targetAppRows } = await safeQuery(`
      SELECT id FROM applications 
      WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}')
         OR (submitted_by = $2 AND $2 IS NOT NULL)
         OR (customer_id = $2 AND $2 IS NOT NULL)
         OR (employee_id = ANY($3::uuid[]) AND $3::text[] <> '{}' AND submitted_by = $2)
    `, [partnerIds, actualUserId, empIds]);

    const targetAppIds = targetAppRows.map(r => r.id);

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
    if (actualUserId || partnerIds.length > 0) {
      await safeExec(`DELETE FROM bank_card_applications WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR created_by = $2 OR process_by = $2 OR updated_by = $2`, [partnerIds, actualUserId]);
      await safeExec(`DELETE FROM sbi_credit_card_applications WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR created_by = $2 OR process_by = $2 OR updated_by = $2`, [partnerIds, actualUserId]);
      await safeExec(`DELETE FROM loan_applications WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}')`, [partnerIds]);
      await safeExec(`DELETE FROM insurance_applications WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}')`, [partnerIds]);
      await safeExec(`DELETE FROM application_notes WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM application_admin_assignments WHERE admin_user_id = $1 OR assigned_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM application_audit_logs WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM application_links WHERE created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM application_click_logs WHERE customer_id = $1 OR (partner_id = ANY($2::uuid[]) AND $2::text[] <> '{}')`, [actualUserId, partnerIds]);
      await safeExec(`DELETE FROM application_operator_history WHERE operator_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM application_employee_assignments WHERE assigned_to_user_id = $1 OR assigned_by_user_id = $1 OR (assigned_to_employee_id = ANY($2::uuid[]) AND $2::text[] <> '{}')`, [actualUserId, empIds]);
    }

    // Unlink shared applications where this user was merely assigned or referenced
    if (empIds.length > 0) {
      await safeExec(`UPDATE applications SET employee_id = NULL, assigned_to_employee_id = NULL WHERE employee_id = ANY($1::uuid[]) OR assigned_to_employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`UPDATE applications SET employee_link_id = NULL WHERE employee_link_id IN (SELECT id FROM employee_product_links WHERE employee_id = ANY($1::uuid[]))`, [empIds]);
      await safeExec(`UPDATE physical_application_details SET assigned_to_employee_id = NULL WHERE assigned_to_employee_id = ANY($1::uuid[])`, [empIds]);
    }
    if (actualUserId) {
      await safeExec(`UPDATE applications SET submitted_by = NULL, remark_updated_by = NULL WHERE submitted_by = $1 OR remark_updated_by = $1`, [actualUserId]);
    }
    if (partnerIds.length > 0) {
      await safeExec(`UPDATE applications SET parent_partner_id = NULL WHERE parent_partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`UPDATE applications SET team_member_id = NULL WHERE team_member_id = ANY($1::uuid[])`, [partnerIds]);
    }

    // ── 3. PURGE LEADS & CRM RECORDS ──────────────────────────────────────────
    const { rows: targetLeadRows } = await safeQuery(`
      SELECT id FROM leads 
      WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}')
         OR (parent_partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}')
         OR created_by = $2 
         OR assigned_to = $2
    `, [partnerIds, actualUserId]);

    const targetLeadIds = targetLeadRows.map(r => r.id);

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
      await safeExec(`UPDATE leads SET assigned_to = NULL, created_by = NULL WHERE assigned_to = $1 OR created_by = $1`, [actualUserId]);
    }

    // ── 4. PURGE CUSTOMERS ────────────────────────────────────────────────────
    const { rows: targetCustRows } = await safeQuery(`
      SELECT id FROM customers 
      WHERE (created_by = $1 AND $1 IS NOT NULL)
         OR (LOWER(email) = ANY($2::text[]) AND $2::text[] <> '{}')
         OR (mobile = ANY($3::text[]) AND $3::text[] <> '{}')
    `, [actualUserId, emailList, mobileList]);

    const targetCustIds = targetCustRows.map(r => r.id);

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

    if (actualUserId || partnerIds.length > 0) {
      await safeExec(`DELETE FROM customer_notes WHERE user_id = $1 OR (partner_id = ANY($2::uuid[]) AND $2::text[] <> '{}')`, [actualUserId, partnerIds]);
      await safeExec(`DELETE FROM customer_documents WHERE verified_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM customer_timeline WHERE created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM customer_followups WHERE user_id = $1 OR (partner_id = ANY($2::uuid[]) AND $2::text[] <> '{}')`, [actualUserId, partnerIds]);
      await safeExec(`DELETE FROM customer_activity_logs WHERE performed_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM customer_communications WHERE sent_by = $1`, [actualUserId]);
    }

    // ── 5. PURGE WALLETS, TRANSACTIONS, LEDGER & WITHDRAWALS ──────────────────
    const { rows: targetWalletRows } = await safeQuery(`
      SELECT id FROM partner_wallets WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR (user_id = $2 AND $2 IS NOT NULL)
      UNION
      SELECT id FROM wallets WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR (user_id = $2 AND $2 IS NOT NULL)
    `, [partnerIds, actualUserId]);

    const targetWalletIds = targetWalletRows.map(r => r.id);

    if (targetWalletIds.length > 0 || partnerIds.length > 0 || actualUserId) {
      await safeExec(`DELETE FROM wallet_audit_logs WHERE wallet_id = ANY($1::uuid[])`, [targetWalletIds]);
      await safeExec(`DELETE FROM wallet_withdrawal_events WHERE withdrawal_id IN (SELECT id FROM wallet_withdrawals WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR wallet_id = ANY($2::uuid[])) OR changed_by = $3`, [partnerIds, targetWalletIds, actualUserId]);
      await safeExec(`DELETE FROM withdrawal_audit_logs WHERE withdrawal_id IN (SELECT id FROM wallet_withdrawals WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR wallet_id = ANY($2::uuid[])) OR performed_by = $3`, [partnerIds, targetWalletIds, actualUserId]);
      await safeExec(`DELETE FROM wallet_withdrawals WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR wallet_id = ANY($2::uuid[]) OR processed_by = $3 OR approved_by = $3 OR transferred_by = $3`, [partnerIds, targetWalletIds, actualUserId]);
      await safeExec(`DELETE FROM withdrawal_requests WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR processed_by = $2`, [partnerIds, actualUserId]);
      await safeExec(`DELETE FROM wallet_transactions WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR user_id = $2 OR processed_by = $2`, [partnerIds, actualUserId]);
      await safeExec(`DELETE FROM wallet_ledger WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR created_by = $2`, [partnerIds, actualUserId]);
      await safeExec(`DELETE FROM wallet_reconciliation WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}')`, [partnerIds]);
      await safeExec(`DELETE FROM wallet_bonus WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}')`, [partnerIds]);
      await safeExec(`DELETE FROM wallet_adjustments WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR adjusted_by = $2`, [partnerIds, actualUserId]);
      await safeExec(`DELETE FROM commission_release_jobs WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}')`, [partnerIds]);
      await safeExec(`DELETE FROM commission_decisions WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR decided_by = $2`, [partnerIds, actualUserId]);
      await safeExec(`DELETE FROM commission_rules WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}')`, [partnerIds]);
      await safeExec(`DELETE FROM commission_structures WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR created_by = $2`, [partnerIds, actualUserId]);
      await safeExec(`DELETE FROM partner_settlements WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}')`, [partnerIds]);
      await safeExec(`DELETE FROM payout_logs WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}')`, [partnerIds]);
      await safeExec(`DELETE FROM fund_requests WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR processed_by = $2`, [partnerIds, actualUserId]);
      await safeExec(`DELETE FROM razorpay_fund_requests WHERE requested_by = $1 OR reconciled_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM razorpay_processed_payments WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}')`, [partnerIds]);
      await safeExec(`DELETE FROM partner_wallets WHERE id = ANY($1::uuid[]) OR (partner_id = ANY($2::uuid[]) AND $2::text[] <> '{}') OR user_id = $3`, [targetWalletIds, partnerIds, actualUserId]);
      await safeExec(`DELETE FROM wallets WHERE id = ANY($1::uuid[]) OR (partner_id = ANY($2::uuid[]) AND $2::text[] <> '{}') OR user_id = $3`, [targetWalletIds, partnerIds, actualUserId]);
    }

    // ── 6. PURGE PARTNER PROFILES, TEAMS, REFERRALS & ASSETS ──────────────────
    if (partnerIds.length > 0 || actualUserId) {
      await safeExec(`UPDATE partner_profiles SET parent_partner_id = NULL WHERE parent_partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`UPDATE partner_profiles SET partner_id = NULL WHERE partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`UPDATE partner_profiles SET referred_by_employee_id = NULL WHERE referred_by_employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM partner_team_relationships WHERE parent_partner_id = ANY($1::uuid[]) OR child_partner_id = ANY($1::uuid[]) OR member_partner_id = ANY($1::uuid[]) OR sponsor_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM team_activity WHERE partner_id = ANY($1::uuid[]) OR parent_partner_id = ANY($1::uuid[]) OR child_partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM team_commissions WHERE partner_id = ANY($1::uuid[]) OR parent_partner_id = ANY($1::uuid[]) OR child_partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM team_goals WHERE partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM team_notifications WHERE partner_id = ANY($1::uuid[]) OR child_partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM partner_teams WHERE partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM partner_referrals WHERE partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM referral_clicks WHERE partner_id = ANY($1::uuid[]) OR converted_partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM referral_campaigns WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR created_by = $2`, [partnerIds, actualUserId]);
      await safeExec(`DELETE FROM invitation_history WHERE partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM registration_logs WHERE parent_partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM partner_upgrade_requests WHERE partner_id = ANY($1::uuid[]) OR user_id = $2 OR reviewed_by = $2`, [partnerIds, actualUserId]);
      await safeExec(`DELETE FROM partner_saved_products WHERE partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM partner_recent_products WHERE partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM partner_preferences WHERE partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM product_ratings WHERE partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM product_share_logs WHERE partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM product_views WHERE partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM partner_training_progress WHERE partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM partner_share_links WHERE partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM click_tracking WHERE partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM partner_videos WHERE partner_id = ANY($1::uuid[])`, [partnerIds]);
      await safeExec(`DELETE FROM kyc_documents WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR user_id = $2 OR verified_by = $2`, [partnerIds, actualUserId]);
      await safeExec(`DELETE FROM partner_bank_details WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR user_id = $2`, [partnerIds, actualUserId]);
      await safeExec(`DELETE FROM bank_details_history WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR changed_by = $2`, [partnerIds, actualUserId]);
      await safeExec(`DELETE FROM bank_details WHERE (partner_id = ANY($1::uuid[]) AND $1::text[] <> '{}') OR user_id = $2`, [partnerIds, actualUserId]);
      await safeExec(`DELETE FROM partner_profiles WHERE id = ANY($1::uuid[]) OR user_id = $2`, [partnerIds, actualUserId]);
    }

    // ── 7. PURGE EMPLOYEES, ATTENDANCE, BIOMETRICS & INCENTIVES ────────────────
    if (empIds.length > 0 || actualUserId) {
      await safeExec(`UPDATE employee_hierarchy SET team_leader_id = NULL WHERE team_leader_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`UPDATE employee_hierarchy SET manager_id = NULL WHERE manager_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`UPDATE employee_hierarchy SET senior_manager_id = NULL WHERE senior_manager_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`UPDATE employee_hierarchy SET branch_head_id = NULL WHERE branch_head_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM employee_hierarchy WHERE employee_id = ANY($1::uuid[]) OR assigned_by = $2`, [empIds, actualUserId]);

      await safeExec(`DELETE FROM attendance_logs WHERE employee_id = ANY($1::uuid[]) OR verified_by = ANY($1::uuid[]) OR verified_by = $2`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM attendance_verification_queue WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM attendance_verification_sessions WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM attendance_rate_limits WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM attendance_offline_queue WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM employee_attendance_pins WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM device_integrity_logs WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM environment_bypass_approvals WHERE employee_id = ANY($1::uuid[]) OR requested_by = ANY($1::uuid[]) OR approved_by = ANY($1::uuid[]) OR approved_by = $2`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM attendance_environment_bypasses WHERE employee_id = ANY($1::uuid[]) OR requested_by = ANY($1::uuid[]) OR approved_by = ANY($1::uuid[]) OR approved_by = $2`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM attendance_environment_references WHERE created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM employee_attendance WHERE employee_id = ANY($1::uuid[])`, [empIds]);

      await safeExec(`DELETE FROM employee_biometric_templates WHERE employee_id = ANY($1::uuid[]) OR enrolled_by = $2 OR revoked_by = $2 OR admin_reviewed_by = ANY($1::uuid[])`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM employee_face_encodings WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM face_verification_reminders WHERE employee_id = ANY($1::uuid[]) OR sent_by = $2`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM employee_face_verification_reminders WHERE employee_id = ANY($1::uuid[])`, [empIds]);

      await safeExec(`DELETE FROM employee_documents WHERE employee_id = ANY($1::uuid[]) OR verified_by = $2`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM employee_bank_details WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM employee_bank_assignments WHERE employee_id = ANY($1::uuid[]) OR assigned_by = $2`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM admin_bank_assignments WHERE admin_id = $1 OR created_by = $1`, [actualUserId]);

      await safeExec(`DELETE FROM employee_assigned_products WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM employee_assigned_product_links WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM employee_product_links WHERE employee_id = ANY($1::uuid[]) OR assigned_by = $2`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM employee_bonus_rules WHERE employee_id = ANY($1::uuid[]) OR created_by = $2`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM employee_bonus_transactions WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM employee_incentives WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM employee_incentive_rules WHERE employee_id = ANY($1::uuid[]) OR created_by = $2`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM employee_incentive_monthly_records WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM employee_incentive_transactions WHERE employee_id = ANY($1::uuid[]) OR processed_by = $2`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM employee_sales_reports WHERE employee_id = ANY($1::uuid[]) OR reviewed_by = $2`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM sales_reports WHERE employee_id = ANY($1::uuid[]) OR reviewed_by = $2`, [empIds, actualUserId]);

      await safeExec(`DELETE FROM operator_claims WHERE operator_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM sales_operator_claims WHERE operator_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM operator_history WHERE operator_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM employee_joining_details WHERE employee_id = ANY($1::uuid[]) OR reviewed_by = $2`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM employee_kyc WHERE employee_id = ANY($1::uuid[]) OR reviewed_by = $2`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM employee_terms_acceptance WHERE employee_id = ANY($1::uuid[]) OR verified_by = $2`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM employee_onboarding_checklist WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM employee_verification_states WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM employee_working_hours WHERE employee_id = ANY($1::uuid[])`, [empIds]);
      await safeExec(`DELETE FROM contest_participants WHERE employee_id = ANY($1::uuid[]) OR employee_id = $2`, [empIds, actualUserId]);
      await safeExec(`DELETE FROM hr_profiles WHERE user_id = $1 OR (employee_id = ANY($2::uuid[]) AND $2::text[] <> '{}')`, [actualUserId, empIds]);
      await safeExec(
        `DELETE FROM employee_candidates 
         WHERE (converted_to_employee_id = ANY($1::uuid[]) AND $1::text[] <> '{}') 
            OR interviewer_id = $2 
            OR created_by = $2 
            OR updated_by = $2
            OR (mobile_number = ANY($3::text[]) AND $3::text[] <> '{}')
            OR (email_id ILIKE ANY($4::text[]) AND $4::text[] <> '{}')`,
        [empIds, actualUserId, Array.from(mobiles), Array.from(emails)]
      );

      await safeExec(`DELETE FROM employees WHERE id = ANY($1::uuid[]) OR user_id = $2`, [empIds, actualUserId]);
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
      await safeExec(`DELETE FROM whatsapp_messages WHERE sender_user_id = $1 OR recipient_user_id = $1 OR (partner_id = ANY($2::uuid[]) AND $2::text[] <> '{}') OR (employee_id = ANY($3::uuid[]) AND $3::text[] <> '{}')`, [actualUserId, partnerIds, empIds]);
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
      await safeExec(`DELETE FROM notifications WHERE user_id = $1 OR (partner_id = ANY($2::uuid[]) AND $2::text[] <> '{}')`, [actualUserId, partnerIds]);
      await safeExec(`DELETE FROM broadcast_notifications WHERE created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM announcement_recipients WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM announcement_reads WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM announcement_audit_logs WHERE performed_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM announcements WHERE created_by = $1`, [actualUserId]);
      await safeExec(`DELETE FROM support_tickets WHERE user_id = $1 OR (partner_id = ANY($2::uuid[]) AND $2::text[] <> '{}')`, [actualUserId, partnerIds]);
      await safeExec(`DELETE FROM report_cache WHERE user_id = $1 OR (partner_id = ANY($2::uuid[]) AND $2::text[] <> '{}')`, [actualUserId, partnerIds]);
      await safeExec(`DELETE FROM report_exports WHERE user_id = $1 OR (partner_id = ANY($2::uuid[]) AND $2::text[] <> '{}')`, [actualUserId, partnerIds]);
      await safeExec(`DELETE FROM scheduled_reports WHERE user_id = $1 OR (partner_id = ANY($2::uuid[]) AND $2::text[] <> '{}')`, [actualUserId, partnerIds]);
      await safeExec(`DELETE FROM activity_logs WHERE performed_by = $1 OR user_id = $1 OR (partner_id = ANY($2::uuid[]) AND $2::text[] <> '{}')`, [actualUserId, partnerIds]);
      await safeExec(`DELETE FROM audit_logs WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM login_activity WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM login_history WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM security_alerts WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM password_history WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM identity_change_challenges WHERE user_id = $1`, [actualUserId]);
      await safeExec(`DELETE FROM refresh_tokens WHERE user_id = $1`, [actualUserId]);
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
      await safeExec(`DELETE FROM otp_verifications WHERE identifier = ANY($1::text[]) OR LOWER(identifier) = ANY($2::text[])`, [mobileList, emailList]);
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

      // ── 11. FINAL PURGE: DELETE USER RECORD ─────────────────────────────────
      await safeExec(`DELETE FROM users WHERE id = $1`, [actualUserId]);
    }

    await client.query('COMMIT');
    logger.info(`Successfully executed comprehensive permanent deletion for: ${inputId}`, {
      purgedUserId: actualUserId,
      purgedEmployees: empIds,
      purgedPartners: partnerIds,
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
        employeeCount: empIds.length,
        partnerCount: partnerIds.length,
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
