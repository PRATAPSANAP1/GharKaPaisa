/**
 * Migration: Add matched_building columns to attendance_verification_sessions
 * 
 * This migration adds the geofence-related columns that were added in migrate_office_building_geofences.js
 * but may not have been run on production yet.
 */

const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrate() {
  try {
    logger.info('Adding matched_building columns to attendance_verification_sessions...');

    // Check if columns already exist
    const { rows: [columnCheck] } = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attendance_verification_sessions' 
      AND column_name = 'matched_building_id'
    `);

    if (columnCheck) {
      logger.info('matched_building_id column already exists, skipping migration');
      return;
    }

    // Add the columns
    await query(`
      ALTER TABLE attendance_verification_sessions
      ADD COLUMN IF NOT EXISTS location_lat NUMERIC,
      ADD COLUMN IF NOT EXISTS location_lng NUMERIC,
      ADD COLUMN IF NOT EXISTS location_accuracy NUMERIC,
      ADD COLUMN IF NOT EXISTS location_status VARCHAR(40) DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS matched_building_id UUID REFERENCES office_building_geofences(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS matched_building_name VARCHAR(150)
    `);

    logger.info('✅ Successfully added matched_building columns to attendance_verification_sessions');
  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrate()
    .then(() => {
      logger.info('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrate };
