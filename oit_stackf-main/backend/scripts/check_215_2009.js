const mongoose = require('mongoose');
require('dotenv').config();
const { getCandidateModel } = require('./models/Candidate');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const id = 215;
    const year = 2009;
    const count = 10;

    let allRecords = [];
    for (let i = 1; i <= count; i++) {
      const collectionName = `oit_stack_mh_mla_${year}_00${i}`;
      const Model = getCandidateModel(collectionName);
      const records = await Model.find({ constituency_number: id }).lean();
      if (records.length > 0) {
        console.log(`Found ${records.length} records in ${collectionName}`);
        records.forEach(r => {
          allRecords.push({ ...r, source: collectionName });
        });
      }
    }

    console.log('\n--- All Records for 215 in 2009 ---');
    allRecords.forEach((r, idx) => {
      console.log(`${idx + 1}. Name: "${r.candidate_name}", Party: "${r.party}", Total: ${r.total}, ID: ${r._id}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();
