/**
 * auth.controller.js — Custom JWT Auth
 * ─────────────────────────────────────────────────────────────────────────
 * Replaced Firebase with custom JWT authentication.
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, getClient } = require('../config/db');
const { generatePartnerCode } = require('../utils/helpers');
const { success, created, error, notFound } = require('../utils/response');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'gharkapaisa-secret-key-fallback';

// ── GET /auth/me ────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
      const { rows: [user] } = await query(`
        SELECT u.id, u.email, u.mobile, u.role, u.status, u.last_login,
          ap.id as Partner_id, ap.Partner_code, ap.first_name, ap.last_name,
          ap.kyc_status, ap.company_name, ap.profile_photo_url, ap.current_address,
          ap.business_location, ap.gst_number, ap.company_type,
          pbd.bank_name, RIGHT(pbd.account_number, 4) as account_number_last4, CONCAT('XXXX', RIGHT(pbd.account_number, 4)) as account_number, pbd.ifsc_code, pbd.account_holder_name,
          w.available_balance, w.hold_balance as pending_amount, w.total_earned, w.total_withdrawn
        FROM users u
        LEFT JOIN Partner_profiles ap ON ap.user_id = u.id
        LEFT JOIN Partner_bank_details pbd ON pbd.Partner_id = ap.id
        LEFT JOIN wallets w ON w.Partner_id = ap.id
        WHERE u.id = $1
      `, [req.user.id]);

    if (!user) return error(res, 'User not found', 404);

    await query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [req.user.id]);

    return res.json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/lookup ────────────────────────────────────────────────────────────
const lookupUser = async (req, res, next) => {
  try {
    const { identity } = req.body;
    if (!identity) return error(res, 'Identity required', 400);

    const { rows: [user] } = await query(
      `SELECT email, mobile FROM users WHERE email = $1 OR mobile = $2`,
      [identity, identity]
    );

    if (!user) return error(res, 'User not found', 404);

    return res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/reset-password ───────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { identity, otp, newPassword } = req.body;
    if (!identity || !otp || !newPassword) {
      return error(res, 'Identity, OTP, and new password are required', 400);
    }

    if (newPassword.length < 8) {
      return error(res, 'Password must be at least 8 characters long', 400);
    }

    // Verify OTP
    if (otp !== '123456') {
      return error(res, 'Invalid OTP code', 400);
    }

    const { rows: [user] } = await query(
      `SELECT id FROM users WHERE email = $1 OR mobile = $2`,
      [identity, identity]
    );

    if (!user) return error(res, 'User not found', 404);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hashedPassword, user.id]);

    logger.info(`Password reset successfully for user ID: ${user.id}`);
    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/send-otp ──────────────────────────────────────────────────────────
const sendOtp = async (req, res, next) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return error(res, 'Mobile number required', 400);

    // Mock sending OTP - in production, integrate Twilio/Fast2SMS here
    logger.info(`Sending mock OTP 123456 to ${mobile}`);

    return res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/verify-otp ──────────────────────────────────────────────────────────
const verifyOtpLogin = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) return error(res, 'Mobile and OTP required', 400);

    // Mock OTP verification
    if (otp !== '123456') {
      return error(res, 'Invalid OTP code', 400);
    }

    // OTP verified - check if user exists to generate a provisional token (if needed by frontend)
    // Actually, frontend uses OTP just as a 2FA step, then calls /auth/login with password to get token.
    // So we can just return success here.
    return res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/login ──────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { identity, password, otp } = req.body;
    if (!identity) return error(res, 'Identity is required', 400);

    const { rows: [user] } = await query(
      `SELECT * FROM users WHERE email = $1 OR mobile = $2`,
      [identity, identity]
    );

    if (!user) return error(res, 'Invalid credentials', 401);

    // Validate using OTP or Password
    if (otp) {
      if (otp !== '123456') {
        return error(res, 'Invalid OTP code', 400);
      }
    } else if (password) {
      const isMatch = await bcrypt.compare(password, user.password_hash || '');
      if (!isMatch) return error(res, 'Invalid credentials', 401);
    } else {
      return error(res, 'OTP or Password is required', 400);
    }

    if (user.status === 'suspended') return error(res, 'Account suspended', 403);
    if (user.status === 'rejected') return error(res, 'Account rejected', 403);

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, phone: user.mobile, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/register ────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const {
      email, mobile, password, first_name, last_name,
      current_address, business_location, company_name, company_type, gst_number,
      bank_name, account_number, ifsc_code, account_holder_name, role = 'Partner'
    } = req.body;

    if (!email || !mobile || !password) {
      return error(res, 'Email, mobile, and password are required', 400);
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Check if user exists
      const { rows: existingUser } = await client.query(
        `SELECT id FROM users WHERE email = $1 OR mobile = $2`,
        [email, mobile]
      );

      if (existingUser.length) {
        await client.query('ROLLBACK');
        return error(res, 'User with this email or mobile already exists', 409);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Insert User
      const { rows: [user] } = await client.query(
        `INSERT INTO users (email, mobile, password_hash, role, status)
         VALUES ($1, $2, $3, $4, 'pending') RETURNING id`,
        [email, mobile, passwordHash, role]
      );

      let PartnerCode = null;

      if (role === 'Partner' || role === 'admin' || role === 'superadmin') {
        // Generate Partner code using atomic sequence
        const { rows: [{ nextval }] } = await client.query(`SELECT nextval('partner_code_seq')`);
        PartnerCode = generatePartnerCode(parseInt(nextval));

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

        // Create wallet
        await client.query(`
          INSERT INTO wallets (Partner_id) VALUES ($1)
        `, [Partner.id]);
      }

      await client.query('COMMIT');

      logger.info(`User registered: ${email} (${PartnerCode || role})`);
      return created(res, { partner_code: PartnerCode }, 'Registration successful. Awaiting KYC verification.');
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

// ── POST /auth/logout ───────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  return res.json({ success: true, message: 'Logged out successfully' });
};

// ── PUT /auth/admin/set-role ────────────────────────────────────────────────
const setRole = async (req, res, next) => {
  try {
    const { userId, newRole } = req.body;
    if (!['Partner', 'admin', 'superadmin', 'employee'].includes(newRole)) {
      return error(res, 'Invalid role', 400);
    }
    await query(`UPDATE users SET role = $1 WHERE id = $2`, [newRole, userId]);
    logger.info(`Admin ${req.user.id} changed role of User ${userId} to ${newRole}`);
    return success(res, `Role updated to ${newRole}`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe,
  lookupUser,
  resetPassword,
  sendOtp,
  verifyOtpLogin,
  login,
  register,
  logout,
  setRole
};
