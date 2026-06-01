require('dotenv').config();
const mongoose = require('mongoose');

async function debugConstituency208Fields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const id = 208;
    const year = 2024; // Checking 2024 as it was explicitly mentioned

    console.log(`\n--- Checking 2024 Fields for Constituency ${id} ---`);
    for (let i = 1; i <= 10; i++) {
      const collName = `oit_stack_mh_mla_${year}_00${i}`;
      const coll = mongoose.connection.db.collection(collName);
      const records = await coll.find({ constituency_number: id }).toArray();
      if (records.length > 0) {
        console.log(`Collection ${collName}:`);
        records.forEach(r => {
          console.log(`  - Name: "${r.candidate_name}"`);
          console.log(`    general: ${r.general} (${typeof r.general})`);
          console.log(`    postal: ${r.postal} (${typeof r.postal})`);
          console.log(`    total: ${r.total} (${typeof r.total})`);
        });
      }
    }
    await mongoose.connection.close();
  } catch (error) {
    console.error('Debug Error:', error);
  }
}

debugConstituency208Fields();
