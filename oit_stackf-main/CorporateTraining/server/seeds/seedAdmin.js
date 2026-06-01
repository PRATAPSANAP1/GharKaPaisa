const mongoose = require('mongoose');
const User = require('../models/User');
const Leaderboard = require('../models/Leaderboard');
const config = require('../config/env');

const seedAdmin = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(config.mongoUri);
    console.log('Database connected successfully.');

    const adminData = {
      name: 'OIT_STACK Admin',
      email: 'admin@oitstack.com',
      password: 'Admin@123',
      role: 'admin',
      college: 'OIT_STACK',
      branch: 'Office of Placements',
      year: 'N/A',
      phone: '9999999999'
    };

    let admin = await User.findOne({ role: 'admin' });
    
    if (admin) {
      console.log(`Admin account found. Updating email and resetting password...`);
      admin.email = adminData.email;
      admin.password = adminData.password;
    } else {
      console.log('No admin found. Creating new admin account...');
      admin = new User(adminData);
    }

    await admin.save();
    console.log('Admin account setup successfully!');
    console.log('Credentials:');

    const leaderboardExists = await Leaderboard.findOne({ user: admin._id });
    if (!leaderboardExists) {
      await Leaderboard.create({ user: admin._id });
      console.log('Leaderboard entry created for Admin.');
    }

    mongoose.connection.close();
    console.log('Database connection closed. Seed complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedAdmin();

