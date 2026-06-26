require('dotenv').config();
const { query } = require('./src/config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function createPartner() {
  try {
    const email = 'testpartner@gharkapaisa.in';
    const mobile = '9998887776';
    const fullName = 'Test Partner';
    const rawPassword = 'Password@123';
    
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const partnerId = 'GKP-P' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const firebaseUid = 'mock-firebase-' + crypto.randomBytes(4).toString('hex');
    
    // Check if exists
    const existing = await query(`SELECT id FROM users WHERE email = $1 OR mobile = $2`, [email, mobile]);
    if (existing.rows.length > 0) {
      console.log('Test partner already exists in the database.');
      process.exit(0);
    }
    
    // Insert into users
    const result = await query(`
      INSERT INTO users (
        email, mobile, firebase_uid, role, status, full_name, password_hash, email_verified, employee_id
      ) VALUES (
        $1, $2, $3, 'PARTNER', 'active', $4, $5, TRUE, $6
      ) RETURNING id, email, full_name, employee_id, mobile
    `, [email, mobile, firebaseUid, fullName, hashedPassword, partnerId]);
    
    console.log('Partner created successfully!');
    console.log('----------------------------');
    console.log('Full Name:', result.rows[0].full_name);
    console.log('Email:', result.rows[0].email);
    console.log('Mobile:', result.rows[0].mobile);
    console.log('Partner ID:', result.rows[0].employee_id);
    console.log('Password:', rawPassword);
    console.log('Role: PARTNER');
    console.log('----------------------------');
    
    process.exit(0);
  } catch (err) {
    console.error('Failed to create test partner:', err);
    process.exit(1);
  }
}

createPartner();
