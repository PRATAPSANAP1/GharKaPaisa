const { getClient } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Permanently deletes a user account and all associated data across the system safely.
 * @param {string} inputId - UUID of user or partner_profile to delete
 * @returns {Promise<Object>} Deleted user record
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

    // 2. Clean up partner-specific resources safely
    if (actualPartnerId) {
      await safeDelete(`DELETE FROM wallet_ledger WHERE partner_id::text = $1 OR wallet_id::text IN (SELECT id::text FROM partner_wallets WHERE partner_id::text = $1)`, [actualPartnerId]);
      await safeDelete(`DELETE FROM wallet_withdrawals WHERE partner_id::text = $1`, [actualPartnerId]);
      await safeDelete(`DELETE FROM wallet_transactions WHERE partner_id::text = $1 OR user_id::text = $2`, [actualPartnerId, actualUserId]);
      await safeDelete(`DELETE FROM partner_wallets WHERE partner_id::text = $1 OR user_id::text = $2`, [actualPartnerId, actualUserId]);
      await safeDelete(`DELETE FROM wallets WHERE partner_id::text = $1 OR user_id::text = $2`, [actualPartnerId, actualUserId]);
      await safeDelete(`DELETE FROM partner_videos WHERE partner_id::text = $1`, [actualPartnerId]);
      await safeDelete(`DELETE FROM kyc_documents WHERE partner_id::text = $1 OR user_id::text = $2`, [actualPartnerId, actualUserId]);
      await safeDelete(`DELETE FROM partner_bank_details WHERE partner_id::text = $1 OR user_id::text = $2`, [actualPartnerId, actualUserId]);
      await safeDelete(`DELETE FROM bank_details WHERE partner_id::text = $1 OR user_id::text = $2`, [actualPartnerId, actualUserId]);
      await safeDelete(`DELETE FROM team_members WHERE partner_id::text = $1 OR user_id::text = $2 OR parent_partner_id::text = $1`, [actualPartnerId, actualUserId]);
      await safeDelete(`DELETE FROM applications WHERE partner_id::text = $1 OR user_id::text = $2`, [actualPartnerId, actualUserId]);
      await safeDelete(`DELETE FROM partner_profiles WHERE id::text = $1 OR user_id::text = $2`, [actualPartnerId, actualUserId]);
    }

    // 3. Clean up user core reference tables safely
    if (actualUserId) {
      await safeDelete(`DELETE FROM notifications WHERE user_id::text = $1`, [actualUserId]);
      await safeDelete(`DELETE FROM login_history WHERE user_id::text = $1`, [actualUserId]);
      await safeDelete(`DELETE FROM security_alerts WHERE user_id::text = $1`, [actualUserId]);
      await safeDelete(`DELETE FROM password_history WHERE user_id::text = $1`, [actualUserId]);
      await safeDelete(`DELETE FROM identity_change_challenges WHERE user_id::text = $1`, [actualUserId]);
      await safeDelete(`DELETE FROM audit_logs WHERE user_id::text = $1`, [actualUserId]);
      
      if (userRecord?.email) {
        await safeDelete(`DELETE FROM pre_verified_emails WHERE LOWER(email) = LOWER($1)`, [userRecord.email]);
      }

      // 4. Delete user record
      await client.query(`DELETE FROM users WHERE id::text = $1`, [actualUserId]);
    }

    await client.query('COMMIT');
    logger.info(`Successfully deleted user account: ${inputId} (User: ${actualUserId}, Partner: ${actualPartnerId})`);
    return userRecord || { id: actualUserId || inputId };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Error deleting user account ${inputId}:`, err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  deleteUserAccount
};
