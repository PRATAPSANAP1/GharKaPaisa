require('dotenv').config();
const mongoose = require('mongoose');

async function debugDB() {
  try {
    const voterDbUri = (process.env.MONGODB_URI || '').includes('/oit_stack')
      ? process.env.MONGODB_URI.replace('/oit_stack', '/electionDB')
      : process.env.MONGODB_URI;

    console.log('Connecting to:', voterDbUri);
    await mongoose.connect(voterDbUri);
    console.log('Connected to electionDB');

    const voters = await mongoose.connection.db.collection('voters').find({}).toArray();
    console.log('All documents in voters collection:');
    console.log(JSON.stringify(voters, null, 2));

    await mongoose.connection.close();
  } catch (error) {
    console.error('Debug Error:', error);
  }
}

debugDB();
