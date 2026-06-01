require('dotenv').config();
const mongoose = require('mongoose');

async function find2019Nota() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const id = 208;
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log(`Searching for 2019 records (including NOTA) for constituency ${id}...`);
    
    for (const collInfo of collections) {
      const collName = collInfo.name;
      if (!collName.includes('2019')) continue;
      
      const coll = mongoose.connection.db.collection(collName);
      const records = await coll.find({ constituency_number: id }).toArray();
      
      if (records.length > 0) {
        console.log(`Found in "${collName}":`);
        records.forEach(r => {
          console.log(`  - Candidate: "${r.candidate_name}", Party: "${r.party}", Total: ${r.total}`);
        });
      }
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Debug Error:', error);
  }
}

find2019Nota();
