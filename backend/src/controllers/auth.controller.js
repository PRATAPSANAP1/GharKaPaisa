const bcrypt = require('bcryptjs');
const { query, getClient } = require('../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken, storeRefreshToken, validateRefreshToken, revokeRefreshToken, revokeAllUserTokens } = require('../utils/jwt');
const { sendOTP, verifyOTP } = require('../services/otp.service');
const { ensureWallet } = require('../services/wallet.service');
const { generatePartnerCode } = require('../utils/helpers');
const { success, created, error, unauthorized } = require('../utils/response');
const logger = require('../utils/logger');

// POST /auth/register (Partner self-registration)
const register = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const {
      email, mobile, password, first_name, last_name,
      current_address, business_location, company_name, company_type, gst_number,
      bank_name, account_number, ifsc_code, account_holder_name,
      otp, aadhar_url, pan_url, gst_cert_url, cancel_cheque_url,
    } = req.body;

    // Check duplicates
    const { rows: exist } = await client.query(
      `SELECT id FROM users WHERE email = $1 OR mobile = $2`, [email, mobile]
    );
    if (exist.length) return error(res, 'Email or mobile already registered', 409);

    // Verify OTP
    const valid = await verifyOTP(mobile, otp, 'register');
    if (!valid) return error(res, 'Invalid or expired OTP', 401);

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const { rows: [user] } = await client.query(`
      INSERT INTO users (email, mobile, password_hash, role, status)
      VALUES ($1, $2, $3, 'Partner', 'pending') RETURNING id
    `, [email, mobile, password_hash]);

    // Generate Partner code
    const { rows: [{ count }] } = await client.query(`SELECT COUNT(*) FROM Partner_profiles`);
    const PartnerCode = generatePartnerCode(parseInt(count) + 1);

    // Create Partner profile
    const { rows: [Partner] } = await client.query(`
      INSERT INTO Partner_profiles (
        user_id, Partner_code, first_name, last_name, current_address, 
        business_location, company_name, company_type, gst_number,
        aadhar_url, pan_url, gst_cert_url, cancel_cheque_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id
    `, [
      user.id, PartnerCode, first_name, last_name, current_address, 
      business_location, company_name, company_type, gst_number,
      aadhar_url || '', pan_url || '', gst_cert_url || '', cancel_cheque_url || ''
    ]);

    // Create bank details
    await client.query(`
      INSERT INTO Partner_bank_details (Partner_id, bank_name, account_number, ifsc_code, account_holder_name)
      VALUES ($1, $2, $3, $4, $5)
    `, [Partner.id, bank_name, account_number, ifsc_code, account_holder_name]);

    await client.query('COMMIT');
    logger.info(`New partner registered: ${email} (${PartnerCode})`);
    return created(res, { Partner_code: PartnerCode }, 'Registration successful. Awaiting KYC verification.');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// POST /auth/login (Password)
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    // Find by email or mobile
    const { rows: [user] } = await query(`
      SELECT u.*, ap.id as Partner_id, ap.first_name, ap.last_name, ap.Partner_code, ap.kyc_status
      FROM users u
      LEFT JOIN Partner_profiles ap ON ap.user_id = u.id
      WHERE u.email = $1 OR u.mobile = $1
    `, [identifier]);

    if (!user) return unauthorized(res, 'Invalid credentials');
    if (user.status === 'suspended') return unauthorized(res, 'Account suspended. Contact support.');
    if (user.status === 'rejected') return unauthorized(res, 'Account rejected. Contact support.');

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return unauthorized(res, 'Invalid credentials');

    // Update last login
    await query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [user.id]);

    const payload = { id: user.id, role: user.role, PartnerId: user.Partner_id };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await storeRefreshToken(user.id, refreshToken);

    return success(res, {
      access_token: accessToken,
      refresh_token: refreshToken,
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

// POST /auth/otp/send
const sendOTPHandler = async (req, res, next) => {
  try {
    const { mobile, purpose = 'login' } = req.body;
    if (!mobile) return error(res, 'Mobile required', 400);
    // For login, check user exists
    if (purpose === 'login') {
      const { rows: [user] } = await query(`SELECT id FROM users WHERE mobile = $1`, [mobile]);
      if (!user) return error(res, 'Mobile number not registered', 404);
    }
    await sendOTP(mobile, purpose);
    return success(res, {}, 'OTP sent successfully');
  } catch (err) {
    next(err);
  }
};

// POST /auth/otp/verify (OTP Login)
const verifyOTPLogin = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;
    const valid = await verifyOTP(mobile, otp, 'login');
    if (!valid) return error(res, 'Invalid or expired OTP', 401);

    const { rows: [user] } = await query(`
      SELECT u.*, ap.id as Partner_id, ap.first_name, ap.last_name, ap.Partner_code, ap.kyc_status
      FROM users u LEFT JOIN Partner_profiles ap ON ap.user_id = u.id
      WHERE u.mobile = $1
    `, [mobile]);

    if (!user) return error(res, 'User not found', 404);
    await query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [user.id]);

    const payload = { id: user.id, role: user.role, PartnerId: user.Partner_id };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await storeRefreshToken(user.id, refreshToken);

    return success(res, {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id, email: user.email, mobile: user.mobile, role: user.role,
        first_name: user.first_name, last_name: user.last_name,
        Partner_code: user.Partner_code, kyc_status: user.kyc_status,
      },
    }, 'OTP login successful');
  } catch (err) {
    next(err);
  }
};

// POST /auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return unauthorized(res, 'Refresh token required');

    const decoded = verifyRefreshToken(refresh_token);
    const valid = await validateRefreshToken(decoded.id, refresh_token);
    if (!valid) return unauthorized(res, 'Invalid or expired refresh token');

    // Rotate tokens
    await revokeRefreshToken(decoded.id, refresh_token);
    const payload = { id: decoded.id, role: decoded.role, PartnerId: decoded.PartnerId };
    const newAccess = signAccessToken(payload);
    const newRefresh = signRefreshToken(payload);
    await storeRefreshToken(decoded.id, newRefresh);

    return success(res, { access_token: newAccess, refresh_token: newRefresh });
  } catch (err) {
    if (err.name === 'TokenExpiredError') return unauthorized(res, 'Refresh token expired. Please login again.');
    next(err);
  }
};

// POST /auth/logout
const logout = async (req, res, next) => {
  try {
    const { refresh_token, all_devices = false } = req.body;
    if (all_devices) {
      await revokeAllUserTokens(req.user.id);
    } else if (refresh_token) {
      await revokeRefreshToken(req.user.id, refresh_token);
    }
    return success(res, {}, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

// GET /auth/me
const getMe = async (req, res, next) => {
  try {
    const { rows: [user] } = await query(`
      SELECT u.id, u.email, u.mobile, u.role, u.status, u.last_login,
        ap.id as Partner_id, ap.Partner_code, ap.first_name, ap.last_name,
        ap.kyc_status, ap.company_name, ap.profile_photo_url,
        w.available_balance, w.pending_amount
      FROM users u
      LEFT JOIN Partner_profiles ap ON ap.user_id = u.id
      LEFT JOIN wallets w ON w.Partner_id = ap.id
      WHERE u.id = $1
    `, [req.user.id]);
    return success(res, user);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, sendOTPHandler, verifyOTPLogin, refreshToken, logout, getMe };
