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

    for (let i = 1; i <= count; i++) {
      const collectionName = `oit_stack_mh_mla_${year}_00${i}`;
      const Model = getCandidateModel(collectionName);
      const records = await Model.find({ constituency_number: id }).lean();
      records.forEach(r => {
        if (r.candidate_name === "NULL" || r.candidate_name === null) {
          console.log(`Found NULL record in ${collectionName}: ID ${r._id}`);
        }
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();
