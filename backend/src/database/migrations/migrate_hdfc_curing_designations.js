const { query } = require('../../config/database');
const logger = require('../../config/logger');

const migrateHdfcCuringDesignations = async () => {
  logger.info('Running HDFC Curing Designations & Decline Code Schema Migration...');

  try {
    // 1. Ensure columns on applications table
    await query(`
      ALTER TABLE applications 
        ADD COLUMN IF NOT EXISTS decline_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS decline_description TEXT,
        ADD COLUMN IF NOT EXISTS curing_designation VARCHAR(100),
        ADD COLUMN IF NOT EXISTS primary_decline_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS primary_decline_description TEXT,
        ADD COLUMN IF NOT EXISTS primary_curing_designation VARCHAR(100),
        ADD COLUMN IF NOT EXISTS secondary_decline_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS secondary_decline_description TEXT,
        ADD COLUMN IF NOT EXISTS secondary_curing_designation VARCHAR(100)
    `);

    // 2. Ensure columns on physical_application_details table
    await query(`
      ALTER TABLE physical_application_details 
        ADD COLUMN IF NOT EXISTS decline_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS decline_description TEXT,
        ADD COLUMN IF NOT EXISTS curing_designation VARCHAR(100),
        ADD COLUMN IF NOT EXISTS primary_decline_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS primary_decline_description TEXT,
        ADD COLUMN IF NOT EXISTS primary_curing_designation VARCHAR(100),
        ADD COLUMN IF NOT EXISTS secondary_decline_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS secondary_decline_description TEXT,
        ADD COLUMN IF NOT EXISTS secondary_curing_designation VARCHAR(100)
    `);

    // 3. Create indexes for efficient filtering in listApplications
    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_curing_designation 
        ON applications (curing_designation) 
        WHERE curing_designation IS NOT NULL;
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_decline_code 
        ON applications (decline_code) 
        WHERE decline_code IS NOT NULL;
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_applications_primary_decline_code 
        ON applications (primary_decline_code) 
        WHERE primary_decline_code IS NOT NULL;
    `);

    // 4. Backfill primary columns from decline_code if primary is null
    await query(`
      UPDATE applications 
      SET primary_decline_code = decline_code,
          primary_decline_description = decline_description,
          primary_curing_designation = curing_designation
      WHERE primary_decline_code IS NULL AND decline_code IS NOT NULL;
    `);

    await query(`
      UPDATE physical_application_details 
      SET primary_decline_code = decline_code,
          primary_decline_description = decline_description,
          primary_curing_designation = curing_designation
      WHERE primary_decline_code IS NULL AND decline_code IS NOT NULL;
    `);

    // 5. Backfill any existing applications where decline_code exists but curing_designation is missing
    const { HDFC_DECLINE_CODES_MAP } = require('../../constants/hdfcDeclineCodes');
    
    // For every known code in mapping, backfill curing_designation if decline_code matches
    for (const [code, info] of Object.entries(HDFC_DECLINE_CODES_MAP)) {
      await query(`
        UPDATE applications 
        SET curing_designation = $1,
            decline_description = COALESCE(decline_description, $2)
        WHERE (UPPER(TRIM(decline_code)) = $3)
          AND (curing_designation IS NULL OR curing_designation = '')
      `, [info.designation, info.type, code]);

      await query(`
        UPDATE physical_application_details 
        SET curing_designation = $1,
            decline_description = COALESCE(decline_description, $2)
        WHERE (UPPER(TRIM(decline_code)) = $3)
          AND (curing_designation IS NULL OR curing_designation = '')
      `, [info.designation, info.type, code]);
    }

    logger.info('HDFC Curing Designations & Decline Code Schema Migration completed successfully.');
  } catch (err) {
    logger.error('Error during HDFC Curing Designations Migration:', err.message);
    throw err;
  }
};

module.exports = { migrateHdfcCuringDesignations };
