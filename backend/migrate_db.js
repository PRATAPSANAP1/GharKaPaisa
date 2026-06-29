require('dotenv').config();
const { pool } = require('./src/config/database');

async function migrate() {
  try {
    console.log('Adding must_change_password column to users table...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
    `);
    console.log('Successfully added must_change_password column.');
    
    // We should also check if employee_id exists on users just in case
    console.log('Checking employee_id, department, designation, full_name, is_active...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50) UNIQUE,
      ADD COLUMN IF NOT EXISTS department VARCHAR(100),
      ADD COLUMN IF NOT EXISTS designation VARCHAR(100),
      ADD COLUMN IF NOT EXISTS full_name VARCHAR(150),
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS created_by UUID;
    `);
    console.log('Successfully added other missing columns to users.');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();
