const { getClient } = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Permanently deletes a user account and all associated data across the system.
 * @param {string} userId - UUID of the user to delete
 * @returns {Promise<Object>} Deleted user record
 */
const deleteUserAccount = async (userId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Fetch user info
    const { rows: [user] } = await client.query(
      `SELECT id, email, role, mobile FROM users WHERE id::text = $1`, 
      [userId]
    );

    if (!user) {
      throw new Error('User account not found');
    }

    // 2. Locate associated partner profile if applicable
    const { rows: [partner] } = await client.query(
      `SELECT id FROM partner_profiles WHERE user_id::text = $1 OR id::text = $1`, 
      [userId]
    );
    const partnerId = partner?.id;

    // 3. Clean up partner-specific resources
    if (partnerId) {
      await client.query(`DELETE FROM partner_videos WHERE partner_id::text = $1`, [partnerId]).catch(() => {});
      await client.query(`DELETE FROM kyc_documents WHERE partner_id::text = $1`, [partnerId]).catch(() => {});
      await client.query(`DELETE FROM bank_details WHERE partner_id::text = $1 OR user_id::text = $2`, [partnerId, userId]).catch(() => {});
      await client.query(`DELETE FROM wallet_transactions WHERE partner_id::text = $1 OR user_id::text = $2`, [partnerId, userId]).catch(() => {});
      await client.query(`DELETE FROM wallets WHERE partner_id::text = $1 OR user_id::text = $2`, [partnerId, userId]).catch(() => {});
      await client.query(`DELETE FROM team_members WHERE partner_id::text = $1 OR user_id::text = $2 OR parent_partner_id::text = $1`, [partnerId, userId]).catch(() => {});
      await client.query(`DELETE FROM partner_profiles WHERE id::text = $1 OR user_id::text = $2`, [partnerId, userId]).catch(() => {});
    }

    // 4. Clean up user core reference tables
    await client.query(`DELETE FROM login_history WHERE user_id::text = $1`, [userId]).catch(() => {});
    await client.query(`DELETE FROM security_alerts WHERE user_id::text = $1`, [userId]).catch(() => {});
    await client.query(`DELETE FROM password_history WHERE user_id::text = $1`, [userId]).catch(() => {});
    await client.query(`DELETE FROM identity_change_challenges WHERE user_id::text = $1`, [userId]).catch(() => {});
    await client.query(`DELETE FROM audit_logs WHERE user_id::text = $1`, [userId]).catch(() => {});
    
    if (user.email) {
      await client.query(`DELETE FROM pre_verified_emails WHERE LOWER(email) = LOWER($1)`, [user.email]).catch(() => {});
    }

    // 5. Delete user record
    await client.query(`DELETE FROM users WHERE id::text = $1`, [userId]);

    await client.query('COMMIT');
    logger.info(`Successfully deleted user account: ${userId} (${user.email || user.mobile || 'No contact'})`);
    return user;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Error deleting user account ${userId}:`, err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  deleteUserAccount
};
