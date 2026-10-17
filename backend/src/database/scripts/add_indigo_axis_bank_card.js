/**
 * Standalone Script: Insert / Upsert Indigo Axis Bank Credit Card
 * Usage: node backend/src/database/scripts/add_indigo_axis_bank_card.js
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { query } = require('../../config/database');

async function run() {
  console.log('🚀 Executing Indigo Axis Bank Credit Card insertion...');
  const sql = fs.readFileSync(path.join(__dirname, 'add_indigo_axis_bank_card.sql'), 'utf-8');
  try {
    await query(sql);
    console.log('✅ Indigo Axis Bank Credit Card successfully inserted/updated in the database!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to insert into database:', err.message);
    if (err.message.includes('timeout')) {
      console.log('\n💡 Note: Remote database connection timed out from this network.');
      console.log('You can run this query directly in pgAdmin/DBeaver using:');
      console.log('backend/src/database/scripts/add_indigo_axis_bank_card.sql');
    }
    process.exit(1);
  }
}

run();
