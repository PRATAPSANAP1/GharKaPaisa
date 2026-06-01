require('dotenv').config();
const mongoose = require('mongoose');

async function debugDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));

    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      console.log(`Collection "${coll.name}" has ${count} documents.`);
      
      if (count > 0) {
        const sample = await mongoose.connection.db.collection(coll.name).findOne();
        console.log(`Sample document from "${coll.name}":`, JSON.stringify(sample).substring(0, 200));
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Debug Error:', error);
  }
}

debugDB();
