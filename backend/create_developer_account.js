require('dotenv').config();
const { pool } = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function createDeveloperAccount() {
  const email = 'babditambe@gmail.com';
  const password = 'Pratap@123';
  const mobile = '9999999999'; // Dummy mobile number

  try {
    console.log('Creating developer partner account...');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 1. Create user
    const { rows: existingUser } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    let userId;
    if (existingUser.length > 0) {
      console.log('User already exists, updating password and setting active...');
      userId = existingUser[0].id;
      await pool.query(
        `UPDATE users SET password_hash = $1, status = 'active', email_verified = true, role = 'PARTNER' WHERE id = $2`,
        [passwordHash, userId]
      );
    } else {
      console.log('Inserting into users table...');
      const { rows: [newUser] } = await pool.query(
        `INSERT INTO users (email, mobile, password_hash, role, status, email_verified)
         VALUES ($1, $2, $3, 'PARTNER', 'active', true) RETURNING id`,
        [email, mobile, passwordHash]
      );
      userId = newUser.id;
    }

    // 2. Create partner profile if missing
    const { rows: existingProfile } = await pool.query('SELECT id FROM Partner_profiles WHERE user_id = $1', [userId]);
    let partnerId;
    if (existingProfile.length > 0) {
      console.log('Partner profile already exists.');
      partnerId = existingProfile[0].id;
    } else {
      console.log('Inserting into Partner_profiles...');
      const { rows: [newProfile] } = await pool.query(
        `INSERT INTO Partner_profiles (user_id, Partner_code, first_name, last_name, kyc_status)
         VALUES ($1, $2, $3, $4, 'approved') RETURNING id`,
        [userId, 'GKP-DEV', 'Developer', 'Account']
      );
      partnerId = newProfile.id;
    }

    // 3. Create wallet if missing
    const { rows: existingWallet } = await pool.query('SELECT id FROM wallets WHERE "Partner_id" = $1', [partnerId]);
    if (existingWallet.length === 0) {
      console.log('Creating wallet...');
      await pool.query(`INSERT INTO wallets ("Partner_id") VALUES ($1)`, [partnerId]);
    } else {
      console.log('Wallet already exists.');
    }

    console.log('Developer account successfully created!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (err) {
    console.error('Error creating developer account:', err);
  } finally {
    await pool.end();
  }
}

createDeveloperAccount();
