require('dotenv').config();
const { query } = require('./src/config/database');

async function migrate() {
  try {
    console.log('Adding parent_partner_id to partner_profiles...');
    await query(`ALTER TABLE partner_profiles ADD COLUMN IF NOT EXISTS parent_partner_id UUID REFERENCES partner_profiles(id) ON DELETE SET NULL;`);
    
    console.log('Adding must_change_password to users...');
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;`);
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
