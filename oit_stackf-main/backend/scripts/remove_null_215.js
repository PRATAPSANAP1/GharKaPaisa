const mongoose = require('mongoose');
require('dotenv').config();
const { getCandidateModel } = require('./models/Candidate');

async function removeNullRecord() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const collectionName = 'oit_stack_mh_mla_2009_004';
    const Model = getCandidateModel(collectionName);
    
    const result = await Model.deleteMany({
      constituency_number: 215,
      $or: [
        { candidate_name: "NULL" },
        { candidate_name: null }
      ]
    });

    console.log(`Deleted ${result.deletedCount} record(s) from ${collectionName}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

removeNullRecord();
