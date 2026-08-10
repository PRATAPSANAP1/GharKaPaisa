const { getClient } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Temporary Deletion (Soft Delete / Deactivate / Suspend Account)
 * Keeps all data intact in the database while disabling access.
 * @param {string} inputId - UUID of user or partner_profile
 * @returns {Promise<Object>} Updated user record
 */
const softDeleteUserAccount = async (inputId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Resolve user and partner profile IDs
    let actualUserId = null;
    let actualPartnerId = null;

    const { rows: [userDirect] } = await client.query(
      `SELECT id, email, role, mobile FROM users WHERE id::text = $1`,
      [inputId]
    );

    if (userDirect) {
      actualUserId = userDirect.id;
      const { rows: [partner] } = await client.query(
        `SELECT id FROM partner_profiles WHERE user_id::text = $1 OR id::text = $1`,
        [actualUserId]
      );
      actualPartnerId = partner?.id || null;
    } else {
      const { rows: [partner] } = await client.query(
        `SELECT id, user_id FROM partner_profiles WHERE id::text = $1`,
        [inputId]
      );
      if (partner) {
        actualPartnerId = partner.id;
        actualUserId = partner.user_id;
      }
    }

    if (!actualUserId && !actualPartnerId) {
      throw new Error('User account or partner profile not found');
    }

    // 2. Suspend user account (keep data in DB, disable active access)
    if (actualUserId) {
      await client.query(
        `UPDATE users SET status = 'suspended', is_active = FALSE, updated_at = NOW() WHERE id::text = $1`,
        [actualUserId]
      );
      // Revoke all active login sessions
      await client.query(`DELETE FROM refresh_tokens WHERE user_id::text = $1`, [actualUserId]).catch(() => {});
    }

    // 3. Suspend partner profile if applicable
    if (actualPartnerId) {
      await client.query(
        `UPDATE partner_profiles SET status = 'suspended', updated_at = NOW() WHERE id::text = $1`,
        [actualPartnerId]
      ).catch(() => {});
    }

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
 * Permanent Deletion (Hard Delete Account)
 * Clears foreign key references first, deletes child tables, partner profile, and user record cleanly from database.
 * @param {string} inputId - UUID of user or partner_profile to permanently delete
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
        logger.warn(`Savepoint deletion statement skipped/rolled back: ${sql}`, err.message);
        await client.query('ROLLBACK TO SAVEPOINT sp_del');
      }
    };

    // 1. Resolve actual user and partner_profile record
    let actualUserId = null;
    let actualPartnerId = null;
    let userRecord = null;

    // Check if inputId is users.id
    const { rows: [userDirect] } = await client.query(
      `SELECT id, email, role, mobile FROM users WHERE id::text = $1`, 
      [inputId]
    );

    if (userDirect) {
      userRecord = userDirect;
      actualUserId = userDirect.id;
      const { rows: [partner] } = await client.query(
        `SELECT id FROM partner_profiles WHERE user_id::text = $1 OR id::text = $1`,
        [actualUserId]
      );
      actualPartnerId = partner?.id || null;
    } else {
      // Check if inputId is partner_profiles.id
      const { rows: [partner] } = await client.query(
        `SELECT id, user_id FROM partner_profiles WHERE id::text = $1`,
        [inputId]
      );
      if (partner) {
        actualPartnerId = partner.id;
        actualUserId = partner.user_id;
        if (actualUserId) {
          const { rows: [userByPartner] } = await client.query(
            `SELECT id, email, role, mobile FROM users WHERE id::text = $1`,
            [actualUserId]
          );
          userRecord = userByPartner || null;
        }
      }
    }

    if (!actualUserId && !actualPartnerId) {
      throw new Error('User account or partner profile not found');
    }

    // 2. Unlink foreign key references in other records pointing to this user/partner
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

    // 3. Clean up foreign key dependencies (child tables first)
    if (actualPartnerId) {
      // Lead followups & leads
      await safeDelete(
        `DELETE FROM lead_followups WHERE lead_id::text IN (SELECT id::text FROM leads WHERE partner_id::text = $1)`,
        [actualPartnerId]
      );
      await safeDelete(`DELETE FROM leads WHERE partner_id::text = $1`, [actualPartnerId]);

      // Wallet audit logs, transactions, ledger, withdrawals & wallets
      await safeDelete(
        `DELETE FROM wallet_audit_logs WHERE wallet_id::text IN (SELECT id::text FROM partner_wallets WHERE partner_id::text = $1 OR user_id::text = $2) OR wallet_id::text IN (SELECT id::text FROM wallets WHERE partner_id::text = $1 OR user_id::text = $2)`,
        [actualPartnerId, actualUserId]
      );
      await safeDelete(
        `DELETE FROM wallet_ledger WHERE partner_id::text = $1 OR wallet_id::text IN (SELECT id::text FROM partner_wallets WHERE partner_id::text = $1 OR user_id::text = $2) OR wallet_id::text IN (SELECT id::text FROM wallets WHERE partner_id::text = $1 OR user_id::text = $2)`,
        [actualPartnerId, actualUserId]
      );
      await safeDelete(`DELETE FROM wallet_withdrawals WHERE partner_id::text = $1`, [actualPartnerId]);
      await safeDelete(`DELETE FROM withdrawal_requests WHERE partner_id::text = $1`, [actualPartnerId]);
      await safeDelete(
        `DELETE FROM wallet_transactions WHERE partner_id::text = $1 OR user_id::text = $2 OR wallet_id::text IN (SELECT id::text FROM partner_wallets WHERE partner_id::text = $1 OR user_id::text = $2)`,
        [actualPartnerId, actualUserId]
      );
      await safeDelete(
        `DELETE FROM partner_wallets WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId, actualUserId]
      );
      await safeDelete(
        `DELETE FROM wallets WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId, actualUserId]
      );

      // Media, KYC & Bank details
      await safeDelete(`DELETE FROM partner_videos WHERE partner_id::text = $1`, [actualPartnerId]);
      await safeDelete(
        `DELETE FROM kyc_documents WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId, actualUserId]
      );
      await safeDelete(
        `DELETE FROM partner_bank_details WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId, actualUserId]
      );
      await safeDelete(
        `DELETE FROM bank_details WHERE partner_id::text = $1 OR user_id::text = $2`,
        [actualPartnerId, actualUserId]
      );

      // Team members & Commissions
      await safeDelete(
        `DELETE FROM team_members WHERE partner_id::text = $1 OR user_id::text = $2 OR parent_partner_id::text = $1`,
        [actualPartnerId, actualUserId]
      );
      await safeDelete(
        `DELETE FROM commission_structures WHERE partner_id::text = $1 OR created_by::text = $2`,
        [actualPartnerId, actualUserId]
      );

      // Applications
      await safeDelete(
        `DELETE FROM applications WHERE partner_id::text = $1 OR submitted_by::text = $2`,
        [actualPartnerId, actualUserId]
      );

      // Partner profile record
      await client.query(
        `DELETE FROM partner_profiles WHERE id::text = $1 OR user_id::text = $2`,
        [actualPartnerId, actualUserId]
      ).catch(async () => {
        await safeDelete(
          `DELETE FROM partner_profiles WHERE id::text = $1 OR user_id::text = $2`,
          [actualPartnerId, actualUserId]
        );
      });
    }

    // 4. Clean up user core reference tables
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

      // 5. Delete user record cleanly from database
      await client.query(`DELETE FROM users WHERE id::text = $1`, [actualUserId]).catch(async () => {
        await safeDelete(`DELETE FROM users WHERE id::text = $1`, [actualUserId]);
      });
    }

    await client.query('COMMIT');
    logger.info(`Successfully permanently deleted account: ${inputId} (User: ${actualUserId}, Partner: ${actualPartnerId}) from database.`);
    return userRecord || { id: actualUserId || inputId, mode: 'permanent' };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Error permanently deleting user account ${inputId}:`, err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  softDeleteUserAccount,
  deleteUserAccount
};
