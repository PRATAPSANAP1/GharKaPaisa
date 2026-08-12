const { getClient } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Temporary Deletion (Soft Delete / Deactivate / Suspend Account)
 * Follows flow: Check role -> Find partner_profile -> Check/deactivate child team members -> Find wallet -> Freeze withdrawals/ledger -> Deactivate wallet -> Deactivate partner_profile -> Deactivate users
 * @param {string} inputId - UUID of user or partner_profile or team_member
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

    // 1. Search partner_team_relationships / user / partner_profile
    const { rows: tmRows } = await safeQuery(
      `SELECT child_partner_id, parent_partner_id FROM partner_team_relationships WHERE id::text = $1 OR child_partner_id::text = $1 OR parent_partner_id::text = $1 LIMIT 1`,
      [inputId]
    );
    const tmDirect = tmRows[0];

    if (tmDirect) {
      actualPartnerId = tmDirect.child_partner_id || tmDirect.parent_partner_id;
      const { rows: [p] } = await safeQuery(`SELECT user_id FROM partner_profiles WHERE id::text = $1`, [actualPartnerId]);
      actualUserId = p?.user_id || null;
    }

    if (!actualUserId) {
      const { rows: [userDirect] } = await safeQuery(
        `SELECT id, email, role, mobile FROM users WHERE id::text = $1`,
        [inputId]
      );

      if (userDirect) {
        actualUserId = userDirect.id;
        const { rows: [partner] } = await safeQuery(
          `SELECT id FROM partner_profiles WHERE user_id::text = $1 OR id::text = $1 LIMIT 1`,
          [actualUserId]
        );
        actualPartnerId = partner?.id || null;
      } else {
        const { rows: [partner] } = await safeQuery(
          `SELECT id, user_id FROM partner_profiles WHERE id::text = $1 LIMIT 1`,
          [inputId]
        );
        if (partner) {
          actualPartnerId = partner.id;
          actualUserId = partner.user_id;
        }
      }
    }

    if (!actualUserId && !actualPartnerId) {
      throw new Error('User account or partner profile not found');
    }

    // 2. Check and deactivate child/team members
    if (actualPartnerId) {
      await safeExec(
        `UPDATE partner_profiles SET status = 'suspended', updated_at = NOW() WHERE parent_partner_id::text = $1`,
        [actualPartnerId]
      );
    }

    // 3. Freeze pending withdrawal requests
    if (actualPartnerId) {
      await safeExec(
        `UPDATE wallet_withdrawals SET status = 'rejected', admin_note = 'Account suspended', updated_at = NOW() WHERE partner_id::text = $1 AND status = 'pending'`,
        [actualPartnerId]
      );
      await safeExec(
        `UPDATE withdrawal_requests SET status = 'rejected', admin_notes = 'Account suspended' WHERE partner_id::text = $1 AND status = 'pending'`,
        [actualPartnerId]
      );
    }

    // 4. Deactivate wallets
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

    // 5. Deactivate partner profile
    if (actualPartnerId) {
      await safeExec(
        `UPDATE partner_profiles SET status = 'suspended', updated_at = NOW() WHERE id::text = $1`,
        [actualPartnerId]
      );
    }

    // 6. Deactivate user account & terminate active tokens
    if (actualUserId) {
      await safeExec(
        `UPDATE users SET status = 'suspended', is_active = FALSE, updated_at = NOW() WHERE id::text = $1`,
        [actualUserId]
      );
      await safeExec(`DELETE FROM refresh_tokens WHERE user_id::text = $1`, [actualUserId]);
    }

    await client.query('COMMIT');
    logger.info(`Successfully soft-deleted (deactivated) partner/user account: ${inputId} (User: ${actualUserId})`);
    return { id: actualUserId || inputId, mode: 'temporary', status: 'suspended' };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Error soft-deleting user account ${inputId}:`, err);
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Permanent Deletion (Hard Delete Partner & User Account)
 * Follows flowchart sequence:
 * BEGIN -> Partner Account / Check Role -> Find partner_profile -> Check child/team members -> Find partner_wallet -> Handle withdrawals -> Handle wallet ledger -> Delete wallet -> Delete partner_profile -> Delete users -> COMMIT
 * @param {string} inputId - UUID of team_member, partner_profile, or user
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

    // ── 1. CHECK ROLE & FIND TEAM MEMBER ──────────────────────────────────────
    let teamMemberRecord = null;
    let actualUserId = null;
    let actualPartnerId = null;
    let userRecord = null;

    const { rows: tmRows } = await safeQuery(
      `SELECT * FROM partner_team_relationships WHERE id::text = $1 OR child_partner_id::text = $1 OR parent_partner_id::text = $1 LIMIT 1`,
      [inputId]
    );
    const tmDirect = tmRows[0];

    if (tmDirect) {
      teamMemberRecord = tmDirect;
      actualPartnerId = tmDirect.child_partner_id || tmDirect.parent_partner_id;
      const { rows: [p] } = await safeQuery(`SELECT user_id FROM partner_profiles WHERE id::text = $1`, [actualPartnerId]);
      actualUserId = p?.user_id || null;
    }

    // ── 2. FIND PARTNER_PROFILE & USER ──────────────────────────────────────
    if (!actualUserId || !actualPartnerId) {
      const { rows: [userDirect] } = await safeQuery(
        `SELECT id, email, role, mobile FROM users WHERE id::text = $1`, 
        [inputId]
      );

      if (userDirect) {
        userRecord = userDirect;
        actualUserId = userDirect.id;
        const { rows: [partner] } = await safeQuery(
          `SELECT id FROM partner_profiles WHERE user_id::text = $1 OR id::text = $1 LIMIT 1`,
          [actualUserId]
        );
        actualPartnerId = partner?.id || actualPartnerId;
      } else {
        const { rows: [partner] } = await safeQuery(
          `SELECT id, user_id FROM partner_profiles WHERE id::text = $1 OR user_id::text = $1 LIMIT 1`,
          [inputId]
        );
        if (partner) {
          actualPartnerId = partner.id;
          actualUserId = partner.user_id || actualUserId;
        }
      }
    }

    if (actualUserId && !userRecord) {
      const { rows: [u] } = await safeQuery(
        `SELECT id, email, role, mobile FROM users WHERE id::text = $1`,
        [actualUserId]
      );
      userRecord = u || null;
    }

    if (!actualUserId && !actualPartnerId && !teamMemberRecord) {
      throw new Error('Team member, partner profile, or user record not found');
    }

    // ── 3. CHECK CHILD / TEAM MEMBERS (REASSIGN OR CLEANUP) ──────────────────
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

    // ── 4. HANDLE WITHDRAWALS & WALLET LEDGER ─────────────────────────────────
    if (actualPartnerId || actualUserId) {
      await safeDelete(
        `DELETE FROM wallet_audit_logs WHERE wallet_id::text IN (SELECT id::text FROM partner_wallets WHERE partner_id::text = $1 OR user_id::text = $2) OR wallet_id::text IN (SELECT id::text FROM wallets WHERE partner_id::text = $1 OR user_id::text = $2)`,
        [actualPartnerId || '', actualUserId || '']
      );
      await safeDelete(
        `DELETE FROM wallet_ledger WHERE partner_id::text = $1 OR wallet_id::text IN (SELECT id::text FROM partner_wallets WHERE partner_id::text = $1 OR user_id::text = $2) OR wallet_id::text IN (SELECT id::text FROM wallets WHERE partner_id::text = $1 OR user_id::text = $2)`,
        [actualPartnerId || '', actualUserId || '']
      );
      await safeDelete(`DELETE FROM wallet_withdrawals WHERE partner_id::text = $1`, [actualPartnerId || '']);
      await safeDelete(`DELETE FROM withdrawal_requests WHERE partner_id::text = $1`, [actualPartnerId || '']);
      await safeDelete(
        `DELETE FROM wallet_transactions WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
    }

    // Unlink foreign key references in related tables
    if (actualUserId) {
      await safeDelete(`UPDATE users SET created_by = NULL WHERE created_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE partner_profiles SET approved_by = NULL WHERE approved_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE kyc_documents SET verified_by = NULL WHERE verified_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE wallet_transactions SET processed_by = NULL WHERE processed_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE withdrawal_requests SET processed_by = NULL WHERE processed_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE products SET created_by = NULL, updated_by = NULL WHERE created_by::text = $1 OR updated_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE banks SET created_by = NULL WHERE created_by::text = $1`, [actualUserId]);
      await safeDelete(`UPDATE lead_followups SET scheduled_by = NULL WHERE scheduled_by::text = $1`, [actualUserId]);
    }

    // Clean up media, KYC, bank details, leads & applications
    if (actualPartnerId || actualUserId) {
      await safeDelete(`DELETE FROM lead_followups WHERE lead_id::text IN (SELECT id::text FROM leads WHERE partner_id::text = $1)`, [actualPartnerId || '']);
      await safeDelete(`DELETE FROM leads WHERE partner_id::text = $1 OR created_by::text = $2`, [actualPartnerId || '', actualUserId || '']);
      await safeDelete(`DELETE FROM partner_videos WHERE partner_id::text = $1`, [actualPartnerId || '']);
      await safeDelete(`DELETE FROM kyc_documents WHERE partner_id::text = $1 OR user_id::text = $2`, [actualPartnerId || '', actualUserId || '']);
      await safeDelete(`DELETE FROM partner_bank_details WHERE partner_id::text = $1 OR user_id::text = $2`, [actualPartnerId || '', actualUserId || '']);
      await safeDelete(`DELETE FROM bank_details WHERE partner_id::text = $1 OR user_id::text = $2`, [actualPartnerId || '', actualUserId || '']);
      await safeDelete(`DELETE FROM commission_structures WHERE partner_id::text = $1 OR created_by::text = $2`, [actualPartnerId || '', actualUserId || '']);
      await safeDelete(`DELETE FROM applications WHERE partner_id::text = $1 OR submitted_by::text = $2`, [actualPartnerId || '', actualUserId || '']);
    }

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
    }

    // ── 5. DELETE WALLET ──────────────────────────────────────────────────────
    if (actualPartnerId || actualUserId) {
      await safeDelete(
        `DELETE FROM partner_wallets WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
      await safeDelete(
        `DELETE FROM wallets WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
    }

    // ── 6. DELETE PARTNER_PROFILE ─────────────────────────────────────────────
    if (actualPartnerId || actualUserId) {
      await safeDelete(
        `DELETE FROM partner_profiles WHERE id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
    }

    // ── 7. DELETE USERS ───────────────────────────────────────────────────────
    if (actualUserId) {
      await safeDelete(`DELETE FROM users WHERE id::text = $1`, [actualUserId]);
    }

    await client.query('COMMIT');
    logger.info(`Successfully executed partner deletion flowchart for inputId: ${inputId} (User: ${actualUserId}, Partner: ${actualPartnerId})`);
    return userRecord || { id: actualUserId || inputId, mode: 'permanent' };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Error executing partner deletion flowchart for ${inputId}:`, err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  softDeleteUserAccount,
  deleteUserAccount
};
