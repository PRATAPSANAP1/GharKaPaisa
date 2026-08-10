const { getClient } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Temporary Deletion (Soft Delete / Deactivate / Suspend Account)
 * Keeps all data intact in the database while disabling access.
 * @param {string} inputId - UUID of user or partner_profile or team_member
 * @returns {Promise<Object>} Updated user record
 */
const softDeleteUserAccount = async (inputId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    let actualUserId = null;
    let actualPartnerId = null;

    // Search team_members first
    const { rows: [tmDirect] } = await client.query(
      `SELECT user_id, partner_id FROM team_members WHERE id::text = $1 OR user_id::text = $1 OR partner_id::text = $1 LIMIT 1`,
      [inputId]
    );

    if (tmDirect) {
      actualUserId = tmDirect.user_id;
      actualPartnerId = tmDirect.partner_id;
    }

    if (!actualUserId) {
      const { rows: [userDirect] } = await client.query(
        `SELECT id, email, role, mobile FROM users WHERE id::text = $1`,
        [inputId]
      );

      if (userDirect) {
        actualUserId = userDirect.id;
        const { rows: [partner] } = await client.query(
          `SELECT id FROM partner_profiles WHERE user_id::text = $1 OR id::text = $1 LIMIT 1`,
          [actualUserId]
        );
        actualPartnerId = partner?.id || null;
      } else {
        const { rows: [partner] } = await client.query(
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

    // Suspend user account (keep data in DB, disable active access)
    if (actualUserId) {
      await client.query(
        `UPDATE users SET status = 'suspended', is_active = FALSE, updated_at = NOW() WHERE id::text = $1`,
        [actualUserId]
      );
      await client.query(`DELETE FROM refresh_tokens WHERE user_id::text = $1`, [actualUserId]).catch(() => {});
    }

    // Suspend partner profile if applicable
    if (actualPartnerId) {
      await client.query(
        `UPDATE partner_profiles SET status = 'suspended', updated_at = NOW() WHERE id::text = $1`,
        [actualPartnerId]
      ).catch(() => {});
    }

    // Update team member record status if present
    await client.query(
      `UPDATE team_members SET status = 'inactive', updated_at = NOW() WHERE user_id::text = $1 OR partner_id::text = $2 OR id::text = $3`,
      [actualUserId || '', actualPartnerId || '', inputId]
    ).catch(() => {});

    await client.query('COMMIT');
    logger.info(`Successfully soft-deleted (deactivated) account: ${inputId} (User: ${actualUserId})`);
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
 * Permanent Deletion (Hard Delete Account & Team Member)
 * Follows explicit sequence:
 * BEGIN -> Find team member -> Find partner profile -> Find wallet -> Delete dependent records -> Delete wallet -> Delete profile -> Delete user -> COMMIT
 * @param {string} inputId - UUID of team_member, partner_profile, or user
 * @returns {Promise<Object>} Deleted user record info
 */
const deleteUserAccount = async (inputId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Helper for executing safe queries using PostgreSQL SAVEPOINTs inside transaction
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

    // ── STEP 1: Find Team Member Record ──────────────────────────────────────
    let teamMemberRecord = null;
    let actualUserId = null;
    let actualPartnerId = null;
    let userRecord = null;

    const { rows: [tmDirect] } = await client.query(
      `SELECT * FROM team_members WHERE id::text = $1 OR user_id::text = $1 OR partner_id::text = $1 LIMIT 1`,
      [inputId]
    );

    if (tmDirect) {
      teamMemberRecord = tmDirect;
      actualUserId = tmDirect.user_id || null;
      actualPartnerId = tmDirect.partner_id || null;
    }

    // ── STEP 2: Find Partner Profile ──────────────────────────────────────────
    if (!actualUserId || !actualPartnerId) {
      const { rows: [userDirect] } = await client.query(
        `SELECT id, email, role, mobile FROM users WHERE id::text = $1`, 
        [inputId]
      );

      if (userDirect) {
        userRecord = userDirect;
        actualUserId = userDirect.id;
        const { rows: [partner] } = await client.query(
          `SELECT id FROM partner_profiles WHERE user_id::text = $1 OR id::text = $1 LIMIT 1`,
          [actualUserId]
        );
        actualPartnerId = partner?.id || actualPartnerId;
      } else {
        const { rows: [partner] } = await client.query(
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
      const { rows: [u] } = await client.query(
        `SELECT id, email, role, mobile FROM users WHERE id::text = $1`,
        [actualUserId]
      );
      userRecord = u || null;
    }

    if (!actualUserId && !actualPartnerId && !teamMemberRecord) {
      throw new Error('Team member, partner profile, or user record not found');
    }

    // ── STEP 3: Find Wallet ───────────────────────────────────────────────────
    let walletIds = [];
    if (actualPartnerId || actualUserId) {
      const { rows: pwRows } = await client.query(
        `SELECT id FROM partner_wallets WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
      const { rows: wRows } = await client.query(
        `SELECT id FROM wallets WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
      walletIds = [...pwRows.map(r => r.id), ...wRows.map(r => r.id)];
    }

    // ── STEP 4: Delete Dependent Records ─────────────────────────────────────
    // 4.1 Unlink foreign key references
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

    if (actualPartnerId) {
      await safeDelete(
        `UPDATE partner_profiles SET parent_partner_id = NULL, partner_id = NULL WHERE parent_partner_id::text = $1 OR partner_id::text = $1`,
        [actualPartnerId]
      );
    }

    // 4.2 Delete child dependent records
    if (actualPartnerId || actualUserId) {
      // Lead followups & leads
      await safeDelete(
        `DELETE FROM lead_followups WHERE lead_id::text IN (SELECT id::text FROM leads WHERE partner_id::text = $1)`,
        [actualPartnerId || '']
      );
      await safeDelete(`DELETE FROM leads WHERE partner_id::text = $1`, [actualPartnerId || '']);

      // Wallet audit logs, transactions, ledger & withdrawal requests
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

      // Media, KYC & Bank details
      await safeDelete(`DELETE FROM partner_videos WHERE partner_id::text = $1`, [actualPartnerId || '']);
      await safeDelete(
        `DELETE FROM kyc_documents WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
      await safeDelete(
        `DELETE FROM partner_bank_details WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
      await safeDelete(
        `DELETE FROM bank_details WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );

      // Team members & Commissions
      await safeDelete(
        `DELETE FROM team_members WHERE partner_id::text = $1 OR user_id::text = $2 OR parent_partner_id::text = $1 OR id::text = $3`,
        [actualPartnerId || '', actualUserId || '', inputId]
      );
      await safeDelete(
        `DELETE FROM commission_structures WHERE partner_id::text = $1 OR created_by::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );

      // Applications
      await safeDelete(
        `DELETE FROM applications WHERE partner_id::text = $1 OR submitted_by::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      );
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

    // ── STEP 5: Delete Wallet ─────────────────────────────────────────────────
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

    // ── STEP 6: Delete Profile ────────────────────────────────────────────────
    if (actualPartnerId || actualUserId) {
      await client.query(
        `DELETE FROM partner_profiles WHERE id::text = $1 OR user_id::text = $2`,
        [actualPartnerId || '', actualUserId || '']
      ).catch(async () => {
        await safeDelete(
          `DELETE FROM partner_profiles WHERE id::text = $1 OR user_id::text = $2`,
          [actualPartnerId || '', actualUserId || '']
        );
      });
    }

    // ── STEP 7: Delete User ───────────────────────────────────────────────────
    if (actualUserId) {
      await client.query(`DELETE FROM users WHERE id::text = $1`, [actualUserId]).catch(async () => {
        await safeDelete(`DELETE FROM users WHERE id::text = $1`, [actualUserId]);
      });
    }

    await client.query('COMMIT');
    logger.info(`Successfully executed team member deletion sequence for inputId: ${inputId} (User: ${actualUserId}, Partner: ${actualPartnerId})`);
    return userRecord || { id: actualUserId || inputId, mode: 'permanent' };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Error executing team member deletion sequence for ${inputId}:`, err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  softDeleteUserAccount,
  deleteUserAccount
};
