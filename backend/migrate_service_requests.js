require('dotenv').config();
const { query, pool } = require('./src/config/database');

async function migrate() {
  try {
    console.log('Running migration to create service_requests table...');
    await query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id SERIAL PRIMARY KEY,
        service_type VARCHAR(50) NOT NULL,
        mobile VARCHAR(20),
        operator VARCHAR(50),
        consumer_number VARCHAR(100),
        provider VARCHAR(100),
        loan_number VARCHAR(100),
        vehicle_number VARCHAR(100),
        amount NUMERIC(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}

migrate();
