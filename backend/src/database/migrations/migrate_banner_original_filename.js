const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');
const logger = require('../../config/logger');

const migrateBannerOriginalFilename = async () => {
  try {
    logger.info('Running Banner Original Filename Migration...');

    // Add original_filename column to banners table
    await query(`
      ALTER TABLE banners
      ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255)
    `);

    logger.info('Banner original_filename column added successfully');

    // Log completion
    logger.info('Banner Original Filename Migration completed successfully');
  } catch (err) {
    logger.error('Failed to run Banner Original Filename Migration:', err);
    throw err;
  }
};

// Run migration if executed directly
if (require.main === module) {
  migrateBannerOriginalFilename()
    .then(() => {
      logger.info('Migration completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = migrateBannerOriginalFilename;
