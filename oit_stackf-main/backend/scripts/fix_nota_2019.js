require('dotenv').config();
const mongoose = require('mongoose');

async function fix2019Nota() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const collName = 'oit_stack_mh_mla_2019_005';
    const coll = mongoose.connection.db.collection(collName);
    
    // Find the NOTA record that is missing constituency_number
    // We use the ID found in the previous step
    const result = await coll.updateOne(
      { _id: new mongoose.Types.ObjectId('6a0612f66f94ced2cea6a3d4') },
      { $set: { constituency_number: 208 } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('Successfully updated 2019 NOTA record with constituency_number: 208');
    } else {
      console.log('No record was updated. It might already have the number or the ID is different.');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Fix Error:', error);
  }
}

fix2019Nota();
