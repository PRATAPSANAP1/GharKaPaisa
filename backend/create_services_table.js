require('dotenv').config();
const { query } = require('./src/config/database');

async function run() {
  try {
    console.log('Creating services_catalog table...');
    await query(`
      CREATE TABLE IF NOT EXISTS services_catalog (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(255),
        route VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        display_order INTEGER DEFAULT 1,
        clicks INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log('Checking for existing data...');
    const { rows: catalogCheck } = await query(`SELECT COUNT(*) FROM services_catalog`);
    if (parseInt(catalogCheck[0].count) === 0) {
      console.log('Inserting initial data...');
      const initialServices = [
        ['Recharge', '📱', '/recharge', 'active', 1],
        ['Electricity', '⚡', '/electricity', 'active', 2],
        ['Loan Repay', '💰', '/loan-repay', 'active', 3],
        ['FASTag', '🚗', '/fastag', 'active', 4],
        ['Bus', '🚍', '/travel-transit/bus-booking', 'active', 5],
        ['Flight', '✈️', '/travel-transit/flight-booking', 'active', 6],
        ['Train', '🎛️', '/travel-transit/train-booking', 'active', 7],
        ['Hotel', '🏨', '/travel-transit/hotel-booking', 'active', 8]
      ];
      for (const s of initialServices) {
        await query(`
          INSERT INTO services_catalog (name, icon, route, status, display_order)
          VALUES ($1, $2, $3, $4, $5)
        `, s);
      }
      console.log('Initial services catalog seeded successfully');
    } else {
      console.log('Data already exists, skipping seed.');
    }
    
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
