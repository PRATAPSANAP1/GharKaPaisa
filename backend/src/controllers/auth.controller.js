const bcrypt = require('bcryptjs');
const { query, getClient } = require('../config/db');
const admin = require('../config/firebase');
const { generatePartnerCode } = require('../utils/helpers');
const { success, created, error, unauthorized } = require('../utils/response');
const logger = require('../utils/logger');
const { ensureWallet } = require('../services/wallet.service');

// POST /auth/register (Partner self-registration via Firebase Auth)
// Expects: Authorization: Bearer <Firebase ID Token>
// Body: Personal, business, bank details
const register = async (req, res, next) => {
  try {
    // Extract and verify Firebase ID token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Firebase ID Token required in Authorization header', 401);
    }
    const idToken = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (firebaseErr) {
      logger.warn('Firebase token verification failed during register:', firebaseErr.code);
      return error(res, 'Invalid or expired Firebase token. Please re-authenticate.', 401);
    }

    const firebaseUid = decoded.uid;

    const {
      email, mobile, first_name, last_name,
      current_address, business_location, company_name, company_type, gst_number,
      bank_name, account_number, ifsc_code, account_holder_name,
    } = req.body;

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Check duplicates by email, mobile, or firebase_uid
      const { rows: exist } = await client.query(
        `SELECT id FROM users WHERE email = $1 OR mobile = $2 OR firebase_uid = $3`,
        [email, mobile, firebaseUid]
      );
      if (exist.length) {
        await client.query('ROLLBACK');
        return error(res, 'Email, mobile or Firebase account already registered', 409);
      }

      // Use a placeholder password_hash for Firebase-authenticated users
      const password_hash = await bcrypt.hash(`firebase_${firebaseUid}`, 10);

      // Create user record
      const { rows: [user] } = await client.query(`
        INSERT INTO users (email, mobile, password_hash, role, status, firebase_uid)
        VALUES ($1, $2, $3, 'Partner', 'pending', $4) RETURNING id
      `, [email, mobile, password_hash, firebaseUid]);

      // Generate Partner code using atomic database sequence
      const { rows: [{ nextval }] } = await client.query(`SELECT nextval('partner_code_seq')`);
      const PartnerCode = generatePartnerCode(parseInt(nextval));

      // Create Partner profile
      const { rows: [Partner] } = await client.query(`
        INSERT INTO Partner_profiles (
          user_id, Partner_code, first_name, last_name, current_address,
          business_location, company_name, company_type, gst_number
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `, [
        user.id, PartnerCode, first_name, last_name, current_address,
        business_location || '', company_name, company_type, gst_number || null
      ]);

      // Create bank details
      await client.query(`
        INSERT INTO Partner_bank_details (Partner_id, bank_name, account_number, ifsc_code, account_holder_name)
        VALUES ($1, $2, $3, $4, $5)
      `, [Partner.id, bank_name, account_number, ifsc_code, account_holder_name]);

      await client.query('COMMIT');

      // Create wallet for the partner
      await ensureWallet(Partner.id);

      logger.info(`New partner registered via Firebase: ${email} (${PartnerCode})`);
      return created(res, { Partner_code: PartnerCode }, 'Registration successful. Awaiting KYC verification.');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

// POST /auth/login — kept for legacy password-based admin access
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const { rows: [user] } = await query(`
      SELECT u.*, ap.id as Partner_id, ap.first_name, ap.last_name, ap.Partner_code, ap.kyc_status
      FROM users u
      LEFT JOIN Partner_profiles ap ON ap.user_id = u.id
      WHERE u.email = $1 OR u.mobile = $1
    `, [identifier]);

    if (!user) return unauthorized(res, 'Invalid credentials');
    if (user.status === 'suspended') return unauthorized(res, 'Account suspended. Contact support.');
    if (user.status === 'rejected') return unauthorized(res, 'Account rejected. Contact support.');
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Account pending KYC approval.',
        status: 'pending',
        kyc_status: user.kyc_status
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return unauthorized(res, 'Invalid credentials');

    await query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [user.id]);

    // For legacy admin users, return a custom token or just user data
    // (Frontend should use Firebase for token generation)
    return success(res, {
      user: {
        id: user.id, email: user.email, mobile: user.mobile, role: user.role,
        status: user.status, first_name: user.first_name, last_name: user.last_name,
        Partner_code: user.Partner_code, kyc_status: user.kyc_status,
      },
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// POST /auth/otp/send — retained for legacy, OTP is now managed by Firebase client-side
const sendOTPHandler = async (req, res, next) => {
  try {
    return success(res, {}, 'OTP is now handled by Firebase client-side. Use Firebase Auth.');
  } catch (err) {
    next(err);
  }
};

// POST /auth/otp/verify — retained for legacy, OTP is now managed by Firebase client-side
const verifyOTPLogin = async (req, res, next) => {
  try {
    return success(res, {}, 'OTP verification is now handled by Firebase client-side. Use Firebase ID Token.');
  } catch (err) {
    next(err);
  }
};

// POST /auth/refresh — legacy endpoint, not used with Firebase tokens
const refreshToken = async (req, res, next) => {
  return success(res, {}, 'Token refresh is managed by Firebase. Use getIdToken() on the client.');
};

// POST /auth/logout
const logout = async (req, res, next) => {
  try {
    // Firebase tokens expire automatically. We just signal success.
    return success(res, {}, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

// GET /auth/me — returns full user + firebase decoded token
const getMe = async (req, res, next) => {
  try {
    const { rows: [user] } = await query(`
      SELECT u.id, u.email, u.mobile, u.role, u.status, u.last_login, u.firebase_uid,
        ap.id as Partner_id, ap.Partner_code, ap.first_name, ap.last_name,
        ap.kyc_status, ap.company_name, ap.profile_photo_url, ap.current_address,
        ap.business_location, ap.gst_number, ap.company_type,
        pbd.bank_name, pbd.account_number, pbd.ifsc_code, pbd.account_holder_name,
        w.available_balance, w.pending_amount, w.total_earned, w.total_withdrawn
      FROM users u
      LEFT JOIN Partner_profiles ap ON ap.user_id = u.id
      LEFT JOIN Partner_bank_details pbd ON pbd.Partner_id = ap.id
      LEFT JOIN wallets w ON w.Partner_id = ap.id
      WHERE u.id = $1
    `, [req.user.id]);

    if (!user) return error(res, 'User not found', 404);

    // Update last_login timestamp
    await query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [req.user.id]);

    return success(res, {
      user,
      firebase: {
        uid:          req.firebaseUser.uid,
        email:        req.firebaseUser.email        || null,
        phone_number: req.firebaseUser.phone_number || null,
        email_verified: req.firebaseUser.email_verified || false,
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, sendOTPHandler, verifyOTPLogin, refreshToken, logout, getMe };
