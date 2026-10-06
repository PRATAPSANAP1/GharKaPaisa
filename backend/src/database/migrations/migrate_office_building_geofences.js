const { query } = require('../../config/database');
const logger = require('../../config/logger');

async function migrateOfficeBuildingGeofences() {
  logger.info('[MIGRATION] Running Office Building Geofences migration...');

  try {
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 1. Create office_building_geofences table
    await query(`
      CREATE TABLE IF NOT EXISTS office_building_geofences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        address TEXT,
        polygon_coordinates JSONB NOT NULL,
        tolerance_meters INTEGER NOT NULL DEFAULT 35,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Add indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_office_buildings_code ON office_building_geofences(code);
      CREATE INDEX IF NOT EXISTS idx_office_buildings_active ON office_building_geofences(is_active);
    `);

    // 3. Add location and building tracking columns to attendance_verification_sessions
    await query(`
      ALTER TABLE attendance_verification_sessions 
      ADD COLUMN IF NOT EXISTS location_lat NUMERIC,
      ADD COLUMN IF NOT EXISTS location_lng NUMERIC,
      ADD COLUMN IF NOT EXISTS location_accuracy NUMERIC,
      ADD COLUMN IF NOT EXISTS location_status VARCHAR(40) DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS matched_building_id UUID REFERENCES office_building_geofences(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS matched_building_name VARCHAR(150);
    `);

    // 4. Add matched_building columns to employee_attendance
    await query(`
      ALTER TABLE employee_attendance
      ADD COLUMN IF NOT EXISTS matched_building_name VARCHAR(150),
      ADD COLUMN IF NOT EXISTS location_status VARCHAR(40) DEFAULT 'PASSED';
    `);

    // 5. Seed Initial Building Geofence with the user's exact 4 corner coordinates
    const defaultCoordinates = [
      [18.619587, 73.874548],
      [18.619565, 73.874942],
      [18.619353, 73.874927],
      [18.619375, 73.874534]
    ];

    const { rows: existing } = await query(
      `SELECT id FROM office_building_geofences WHERE code = 'MAIN_OFFICE_HQ' LIMIT 1`
    );

    if (existing.length === 0) {
      await query(
        `INSERT INTO office_building_geofences (name, code, address, polygon_coordinates, tolerance_meters, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'Main Office Building (Pune)',
          'MAIN_OFFICE_HQ',
          'Primary Office Building Premises',
          JSON.stringify(defaultCoordinates),
          35,
          true
        ]
      );
      logger.info('[MIGRATION] Seeded default Main Office Building with 4-corner coordinates.');
    } else {
      // Update coordinates to make sure the latest 4 coordinates are active
      await query(
        `UPDATE office_building_geofences 
         SET polygon_coordinates = $1, tolerance_meters = 35, is_active = TRUE, updated_at = NOW()
         WHERE code = 'MAIN_OFFICE_HQ'`,
        [JSON.stringify(defaultCoordinates)]
      );
      logger.info('[MIGRATION] Updated Main Office Building coordinates.');
    }

    logger.info('[MIGRATION COMPLETE] Office building geofences table and columns created successfully.');
  } catch (err) {
    logger.error('Office Building Geofences Migration Error:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateOfficeBuildingGeofences()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateOfficeBuildingGeofences };
