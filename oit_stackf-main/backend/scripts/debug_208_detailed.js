require('dotenv').config();
const mongoose = require('mongoose');

async function debugConstituency208Detailed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const id = 208;
    const years = [2014, 2019, 2024];

    for (const year of years) {
      console.log(`\n--- YEAR ${year} ---`);
      for (let i = 1; i <= 15; i++) {
        const collName = `oit_stack_mh_mla_${year}_00${i}`;
        const coll = mongoose.connection.db.collection(collName);
        const records = await coll.find({ constituency_number: id }).toArray();
        if (records.length > 0) {
          console.log(`Collection ${collName}:`);
          records.forEach(r => {
            console.log(`  - Name: "${r.candidate_name}", Total Votes: ${r.total}, Rank: ${r.rank_no || r.rank}`);
          });
        }
      }
    }
    await mongoose.connection.close();
  } catch (error) {
    console.error('Debug Error:', error);
  }
}

debugConstituency208Detailed();
