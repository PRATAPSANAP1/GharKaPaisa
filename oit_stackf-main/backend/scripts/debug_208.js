require('dotenv').config();
const mongoose = require('mongoose');

async function debugConstituency208() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const id = 208;
    const years = [2009, 2014, 2019, 2024];

    for (const year of years) {
      console.log(`\n--- YEAR ${year} ---`);
      let foundAny = false;
      for (let i = 1; i <= 20; i++) {
        const collName = `oit_stack_mh_mla_${year}_00${i}`;
        const coll = mongoose.connection.db.collection(collName);
        const count = await coll.countDocuments();
        if (count === 0) continue;

        const records = await coll.find({ constituency_number: id }).toArray();
        if (records.length > 0) {
          foundAny = true;
          console.log(`Collection ${collName} has ${records.length} records for 208:`);
          records.forEach(r => {
            console.log(`  - ${r.candidate_name} (Rank: ${r.rank_no || r.rank}, Party: ${r.party})`);
          });
        }
      }
      if (!foundAny) console.log("No records found for any shard.");
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Debug Error:', error);
  }
}

debugConstituency208();
