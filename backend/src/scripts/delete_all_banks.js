require('dotenv').config();
const { query } = require('../config/database');

async function run() {
  try {
    console.log("Starting deletion of all bank records on database...");

    // Make bank_id nullable in products
    await query('ALTER TABLE products ALTER COLUMN bank_id DROP NOT NULL');

    // Set bank_id to NULL in products
    await query('UPDATE products SET bank_id = NULL');

    // Set bank_id to NULL in lead_clicks if table exists
    try {
      await query('UPDATE lead_clicks SET bank_id = NULL');
    } catch (e) {
      console.log("lead_clicks table update skipped:", e.message);
    }

    // Delete all banks
    const { rowCount } = await query('DELETE FROM banks');
    console.log(`Successfully deleted ${rowCount} bank records!`);

  } catch (err) {
    console.error("Error executing bank cleanup:", err);
  } finally {
    process.exit(0);
  }
}

run();
