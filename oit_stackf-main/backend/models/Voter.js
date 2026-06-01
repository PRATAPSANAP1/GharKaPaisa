const mongoose = require('mongoose');

// We use strict: false so that it will flexibly accept whatever fields are in the existing MongoDB Atlas collection.
const voterSchema = new mongoose.Schema({
    // We let MongoDB handle the flexible schema
}, { strict: false, collection: 'voters' });

// Create a separate connection specifically pointing to 'electionDB' database where the user actually added the records
const voterDbUri = (process.env.MONGODB_URI || '').includes('/oit_stack')
    ? process.env.MONGODB_URI.replace('/oit_stack', '/electionDB')
    : process.env.MONGODB_URI;

console.log(`[Voter Model] Initializing Voters collection on electionDB database...`);
const connection = mongoose.createConnection(voterDbUri);

connection.on('connected', () => {
    console.log('[Voter Model] MongoDB Connected successfully to database: electionDB');
});

connection.on('error', (err) => {
    console.error('[Voter Model] MongoDB connection error for database electionDB:', err);
});

module.exports = connection.model('Voter', voterSchema);
