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
    if (!actualUserId) {
      const { rows: [emp] } = await safeQuery(
        `SELECT id, user_id FROM employees WHERE id::text = $1 OR user_id::text = $1 LIMIT 1`,
        [inputId]
      );
      if (emp) {
        actualEmployeeId = emp.id;
        actualUserId = emp.user_id || null;
      }
    }

    // 3. Check users
    if (!actualUserId) {
      const { rows: [userDirect] } = await safeQuery(
        `SELECT id, email, role, mobile, full_name FROM users WHERE id::text = $1`,
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
        `SELECT id, user_id FROM partner_profiles WHERE id::text = $1 OR user_id::text = $1 LIMIT 1`,
        [inputId]
      );
      if (partner) {
        actualPartnerId = partner.id;
        actualUserId = partner.user_id;
      }
    }

    // Resolve remaining IDs if user is found
    if (actualUserId) {
      if (!userRecord) {
        const { rows: [u] } = await safeQuery(
          `SELECT id, email, role, mobile, full_name FROM users WHERE id::text = $1`,
          [actualUserId]
        );
        userRecord = u || null;
      }
      if (!actualEmployeeId) {
        const { rows: [emp] } = await safeQuery(
          `SELECT id FROM employees WHERE user_id::text = $1 LIMIT 1`,
          [actualUserId]
        );
        if (emp) actualEmployeeId = emp.id;
      }
      if (!actualPartnerId) {
        const { rows: [partner] } = await safeQuery(
          `SELECT id FROM partner_profiles WHERE user_id::text = $1 LIMIT 1`,
          [actualUserId]
        );
        if (partner) actualPartnerId = partner.id;
      }
    }

    if (!actualUserId && !actualPartnerId && !actualEmployeeId) {
      throw new Error('User, employee, or partner account not found');
    }

    // Prevent deactivating Super Admin accounts
    if (userRecord?.role === 'SUPER_ADMIN') {
      throw new Error('Super Administrator accounts cannot be deleted or suspended.');
    }

    // 5. Deactivate partner and children if applicable
    if (actualPartnerId) {
      await safeExec(
        `UPDATE partner_profiles SET status = 'suspended', updated_at = NOW() WHERE parent_partner_id::text = $1`,
        [actualPartnerId]
      );
      await safeExec(
        `UPDATE wallet_withdrawals SET status = 'rejected', admin_note = 'Account suspended', updated_at = NOW() WHERE partner_id::text = $1 AND status = 'pending'`,
        [actualPartnerId]
      );
      await safeExec(
        `UPDATE partner_profiles SET status = 'suspended', updated_at = NOW() WHERE id::text = $1`,
        [actualPartnerId]
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

    // 7. Deactivate employee record if applicable
    if (actualEmployeeId || actualUserId) {
      await safeExec(
        `UPDATE employees SET employee_status = 'INACTIVE', updated_at = NOW() WHERE id::text = $1 OR user_id::text = $2`,
        [actualEmployeeId || '', actualUserId || '']
      );
    }

    // 8. Deactivate user account & terminate active tokens
    if (actualUserId) {
      await safeExec(
        `UPDATE users SET status = 'suspended', is_active = FALSE, updated_at = NOW() WHERE id::text = $1`,
        [actualUserId]
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
 * Unlinks all foreign key constraints, cleans associated records, and purges user from database.
 * @param {string} inputId - UUID of team_member, partner_profile, employee, or user
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

    const safeDelete = async (sql, params = []) => {
      try {
        await client.query('SAVEPOINT sp_del');
        await client.query(sql, params);
        await client.query('RELEASE SAVEPOINT sp_del');
      } catch (err) {
        logger.warn(`Savepoint statement skipped/rolled back: ${sql}`, err.message);
        await client.query('ROLLBACK TO SAVEPOINT sp_del');
      }
    };

    // ── 1. RESOLVE USER, EMPLOYEE, AND PARTNER IDENTITIES ─────────────────────
    let actualUserId = null;
    let actualPartnerId = null;
    let actualEmployeeId = null;
    let userRecord = null;

    // Check team relationships
    const { rows: tmRows } = await safeQuery(
      `SELECT * FROM partner_team_relationships WHERE id::text = $1 OR child_partner_id::text = $1 OR parent_partner_id::text = $1 LIMIT 1`,
      [inputId]
    );
    if (tmRows[0]) {
      actualPartnerId = tmRows[0].child_partner_id || tmRows[0].parent_partner_id;
      const { rows: [p] } = await safeQuery(`SELECT user_id FROM partner_profiles WHERE id::text = $1`, [actualPartnerId]);
      actualUserId = p?.user_id || null;
    }

    // Check employees
    if (!actualUserId) {
      const { rows: [empDirect] } = await safeQuery(
        `SELECT id, user_id, employee_id, full_name, email_id FROM employees WHERE id::text = $1 OR user_id::text = $1 LIMIT 1`,
        [inputId]
      );
      if (empDirect) {
        actualEmployeeId = empDirect.id;
        actualUserId = empDirect.user_id || null;
      }
    }

    // Check users
    if (!actualUserId) {
      const { rows: [userDirect] } = await safeQuery(
        `SELECT id, email, role, mobile, full_name FROM users WHERE id::text = $1`, 
        [inputId]
      );
      if (userDirect) {
        userRecord = userDirect;
        actualUserId = userDirect.id;
      }
    }

    // Check partner_profiles
    if (!actualUserId) {
      const { rows: [partner] } = await safeQuery(
        `SELECT id, user_id FROM partner_profiles WHERE id::text = $1 OR user_id::text = $1 LIMIT 1`,
        [inputId]
      );
      if (partner) {
        actualPartnerId = partner.id;
        actualUserId = partner.user_id || actualUserId;
      }
    }

    // Resolve cross-references
    if (actualUserId) {
      if (!userRecord) {
        const { rows: [u] } = await safeQuery(
          `SELECT id, email, role, mobile, full_name FROM users WHERE id::text = $1`,
          [actualUserId]
        );
        userRecord = u || null;
      }
      if (!actualEmployeeId) {
        const { rows: [emp] } = await safeQuery(
          `SELECT id FROM employees WHERE user_id::text = $1 LIMIT 1`,
          [actualUserId]
        );
        if (emp) actualEmployeeId = emp.id;
      }
      if (!actualPartnerId) {
        const { rows: [p] } = await safeQuery(
          `SELECT id FROM partner_profiles WHERE user_id::text = $1 LIMIT 1`,
          [actualUserId]
        );
        if (p) actualPartnerId = p.id;
      }
    }

    if (!actualUserId && !actualPartnerId && !actualEmployeeId) {
      throw new Error('User, employee, or partner account not found');
    }

    // Prevent permanent deletion of Super Admin accounts
    if (userRecord?.role === 'SUPER_ADMIN') {
      throw new Error('Super Administrator accounts cannot be permanently deleted.');
    }

    // ── 2. UNLINK FOREIGN KEYS IN SHARED TABLES ──────────────────────────────
    if (actualUserId) {
      await safeDelete(`UPDATE users SET created_by = NULL WHERE created_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE users SET activated_by = NULL WHERE activated_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE users SET deactivated_by = NULL WHERE deactivated_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE users SET scheduled_by = NULL WHERE scheduled_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE applications SET submitted_by = NULL WHERE submitted_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE applications SET remark_updated_by = NULL WHERE remark_updated_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE partner_profiles SET approved_by = NULL WHERE approved_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE partner_profiles SET kyc_reviewed_by = NULL WHERE kyc_reviewed_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE kyc_documents SET verified_by = NULL WHERE verified_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE wallet_transactions SET processed_by = NULL WHERE processed_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE wallet_withdrawals SET processed_by = NULL WHERE processed_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE products SET created_by = NULL, updated_by = NULL WHERE created_by::text = $1 OR updated_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE products SET last_updated_by = NULL WHERE last_updated_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE banks SET created_by = NULL WHERE created_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE lead_followups SET scheduled_by = NULL WHERE scheduled_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE leads SET assigned_to = NULL, created_by = NULL WHERE assigned_to::text = $1 OR created_by::text = $1`, [actualUserId, actualUserId]);
    }

    // ── 3. CLEAN EMPLOYEE TABLES ──────────────────────────────────────────────
    if (actualEmployeeId || actualUserId) {
      const empId = actualEmployeeId || '';
      
      if (empId) {
        // Hierarchy unlinking
        await safeDelete(`UPDATE employee_hierarchy SET team_leader_id = NULL WHERE team_leader_id::text = $1`, [empId]);
        await safeDelete(`UPDATE employee_hierarchy SET manager_id = NULL WHERE manager_id::text = $1`, [empId]);
        await safeDelete(`UPDATE employee_hierarchy SET senior_manager_id = NULL WHERE senior_manager_id::text = $1`, [empId]);
        await safeDelete(`UPDATE employee_hierarchy SET branch_head_id = NULL WHERE branch_head_id::text = $1`, [empId]);
        await safeDelete(`UPDATE attendance_logs SET verified_by = NULL WHERE verified_by::text = $1`, [empId]);
        await safeDelete(`UPDATE attendance_environment_bypasses SET approved_by = NULL WHERE approved_by::text = $1`, [empId]);
        await safeDelete(`UPDATE attendance_environment_bypasses SET requested_by = NULL WHERE requested_by::text = $1`, [empId]);
        await safeDelete(`UPDATE employee_biometric_templates SET admin_reviewed_by = NULL WHERE admin_reviewed_by::text = $1`, [empId]);
        await safeDelete(`UPDATE applications SET employee_id = NULL WHERE employee_id::text = $1`, [empId]);

        // Employee child tables
        await safeDelete(`DELETE FROM employee_hierarchy WHERE employee_id::text = $1`, [empId]);
        await safeDelete(`DELETE FROM employee_bank_assignments WHERE employee_id::text = $1`, [empId]);
        await safeDelete(`DELETE FROM employee_assigned_products WHERE employee_id::text = $1`, [empId]);
        await safeDelete(`DELETE FROM employee_assigned_product_links WHERE employee_id::text = $1`, [empId]);
        await safeDelete(`DELETE FROM employee_bonus_rules WHERE employee_id::text = $1`, [empId]);
        await safeDelete(`DELETE FROM employee_incentives WHERE employee_id::text = $1`, [empId]);
        await safeDelete(`DELETE FROM employee_sales_reports WHERE employee_id::text = $1`, [empId]);
        await safeDelete(`DELETE FROM employee_biometric_templates WHERE employee_id::text = $1`, [empId]);
        await safeDelete(`DELETE FROM employee_face_encodings WHERE employee_id::text = $1`, [empId]);
        await safeDelete(`DELETE FROM employee_face_verification_reminders WHERE employee_id::text = $1`, [empId]);
        await safeDelete(`DELETE FROM attendance_logs WHERE employee_id::text = $1`, [empId]);
        await safeDelete(`DELETE FROM employee_attendance WHERE employee_id::text = $1`, [empId]);
        await safeDelete(`DELETE FROM employee_bank_details WHERE employee_id::text = $1`, [empId]);
        await safeDelete(`DELETE FROM employee_documents WHERE employee_id::text = $1`, [empId]);
        await safeDelete(`DELETE FROM employee_verification_states WHERE employee_id::text = $1`, [empId]);
        await safeDelete(`DELETE FROM employee_working_hours WHERE employee_id::text = $1`, [empId]);
      }

      await safeDelete(`DELETE FROM employees WHERE id::text = $1 OR user_id::text = $2`, [actualEmployeeId || '', actualUserId || '']);
    }

    // ── 4. CLEAN PARTNER TABLES & WALLETS ────────────────────────────────────
    if (actualPartnerId) {
      await safeDelete(
        `UPDATE partner_profiles SET parent_partner_id = NULL WHERE parent_partner_id::text = $1`,
        [actualPartnerId]
      );
      await safeDelete(
        `DELETE FROM partner_team_relationships WHERE parent_partner_id::text = $1 OR child_partner_id::text = $1 OR id::text = $2`,
        [actualPartnerId, inputId]
      );
    }

    if (actualPartnerId || actualUserId) {
      await safeDelete(
        `DELETE FROM wallet_audit_logs WHERE wallet_id::text IN (SELECT id::text FROM partner_wallets WHERE partner_id::text = $1 OR user_id::text = $2) OR wallet_id::text IN (SELECT id::text FROM wallets WHERE partner_id::text = $1 OR user_id::text = $2)`,
        [actualPartnerId || '', actualUserId || '']
      );
      await safeDelete(`DELETE FROM wallet_withdrawals WHERE partner_id::text = $1`, [actualPartnerId || '']);
      await safeDelete(
        `DELETE FROM wallet_transactions WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
      await safeDelete(
        `DELETE FROM partner_wallets WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
      await safeDelete(
        `DELETE FROM wallets WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
      await safeDelete(`DELETE FROM lead_followups WHERE lead_id::text IN (SELECT id::text FROM leads WHERE partner_id::text = $1)`, [actualPartnerId || '']);
      await safeDelete(`DELETE FROM leads WHERE partner_id::text = $1 OR created_by::text = $2`, [actualPartnerId || '', actualUserId || '']);
      await safeDelete(`DELETE FROM partner_videos WHERE partner_id::text = $1`, [actualPartnerId || '']);
      await safeDelete(`DELETE FROM kyc_documents WHERE partner_id::text = $1 OR user_id::text = $2`, [actualPartnerId || '', actualUserId || '']);
      await safeDelete(`DELETE FROM partner_bank_details WHERE partner_id::text = $1 OR user_id::text = $2`, [actualPartnerId || '', actualUserId || '']);
      await safeDelete(`DELETE FROM bank_details WHERE partner_id::text = $1 OR user_id::text = $2`, [actualPartnerId || '', actualUserId || '']);
      await safeDelete(`DELETE FROM commission_structures WHERE partner_id::text = $1 OR created_by::text = $2`, [actualPartnerId || '', actualUserId || '']);
      await safeDelete(`DELETE FROM applications WHERE partner_id::text = $1 OR submitted_by::text = $2`, [actualPartnerId || '', actualUserId || '']);
      await safeDelete(
        `DELETE FROM partner_profiles WHERE id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
    }

    // ── 5. CLEAN USER TABLES & DELETE USER RECORD ─────────────────────────────
    if (actualUserId) {
      await safeDelete(`DELETE FROM customers WHERE created_by::text = $1`, [actualUserId]);
      await safeDelete(`DELETE FROM notifications WHERE user_id::text = $1`, [actualUserId]);
      await safeDelete(`DELETE FROM refresh_tokens WHERE user_id::text = $1`, [actualUserId]);
      await safeDelete(`DELETE FROM login_history WHERE user_id::text = $1`, [actualUserId]);
      await safeDelete(`DELETE FROM security_alerts WHERE user_id::text = $1`, [actualUserId]);
      await safeDelete(`DELETE FROM password_history WHERE user_id::text = $1`, [actualUserId]);
      await safeDelete(`DELETE FROM identity_change_challenges WHERE user_id::text = $1`, [actualUserId]);
      await safeDelete(`DELETE FROM audit_logs WHERE user_id::text = $1`, [actualUserId]);

      if (userRecord?.email) {
        await safeDelete(`DELETE FROM pre_verified_emails WHERE LOWER(email) = LOWER($1)`, [userRecord.email]);
      }

      await safeDelete(`DELETE FROM users WHERE id::text = $1`, [actualUserId]);
    }

    await client.query('COMMIT');
    logger.info(`Successfully executed permanent deletion for inputId: ${inputId} (User: ${actualUserId}, Employee: ${actualEmployeeId}, Partner: ${actualPartnerId})`);
    return userRecord || { id: actualUserId || inputId, mode: 'permanent', success: true };
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
