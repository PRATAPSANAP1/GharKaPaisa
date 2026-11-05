/**
 * Script: Update Super Admin Password to Gharkapaisa@8087
 * 
 * Usage:
 *   node backend/src/database/scripts/update_super_admin_password.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const bcrypt = require('bcryptjs');
const { query } = require('../../config/database');
const logger = require('../../config/logger');

const NEW_PASSWORD = 'Gharkapaisa@8087';

async function updatePassword() {
  try {
    logger.info('Updating Super Admin password...');
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    const { rows: updatedUsers } = await query(`
      UPDATE users 
      SET password_hash = $1,
          failed_login_attempts = 0,
          locked_until = NULL,
          must_change_password = FALSE,
          updated_at = NOW()
      WHERE role = 'SUPER_ADMIN'
      RETURNING id, email, mobile, role, full_name
    `, [hashedPassword]);

    logger.info(`Successfully updated password for ${updatedUsers.length} Super Admin account(s):`);
    updatedUsers.forEach(u => {
      logger.info(` - ${u.email} (${u.mobile || 'No mobile'}) - ${u.full_name}`);
    });

    // Revoke active sessions so login with the new password is required
    const { rowCount: revokedSessions } = await query(`
      UPDATE refresh_tokens 
      SET revoked = TRUE, revoked_at = NOW() 
      WHERE user_id IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN') AND revoked = FALSE
    `);
    logger.info(`Revoked ${revokedSessions || 0} active refresh token session(s).`);

    console.log('✅ Super admin password updated to Gharkapaisa@8087 successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to update Super Admin password:', error);
    console.error('❌ Error updating Super Admin password:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  updatePassword();
}

module.exports = { updatePassword };

