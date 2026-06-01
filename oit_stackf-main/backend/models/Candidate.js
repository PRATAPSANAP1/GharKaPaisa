const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  constituency_number: { type: Number, required: true },
  candidate_name: { type: String, required: true },
  sex: { type: String },
  age: { type: Number },
  category: { type: String },
  party: { type: String },
  symbol: { type: String },
  general: { type: Number, default: 0 },
  postal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  votes_percentage: { type: Number },
  votes_polled_valid_nota: { type: Number }, // For 2024 records
  year: { type: Number }
}, {
  strict: false // Allow for variations in collection schemas
});

// Helper to get a model for a specific collection dynamically
const getCandidateModel = (collectionName) => {
  // Check if model already exists to avoid OverwriteModelError
  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName];
  }
  return mongoose.model(collectionName, CandidateSchema, collectionName);
};

module.exports = {
  CandidateSchema,
  getCandidateModel
};
