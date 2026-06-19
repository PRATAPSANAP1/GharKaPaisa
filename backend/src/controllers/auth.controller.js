/**
 * auth.controller.js — Email OTP Authentication
 * ─────────────────────────────────────────────────────────────────────────
 * All login is via email OTP. No password-based login.
 * OTP is sent to the user's registered email via AWS SES.
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, getClient } = require('../config/db');
const { generatePartnerCode } = require('../utils/helpers');
const { success, created, error, notFound } = require('../utils/response');
const logger = require('../utils/logger');
const { sendOtpEmail } = require('../services/email.service');

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

// Helper to generate and hash refresh token in db
const generateAndSaveRefreshToken = async (userId) => {
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days expiry

  await query(`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
  `, [userId, tokenHash, expiresAt]);

  return refreshToken;
};

// ── POST /auth/send-otp ──────────────────────────────────────────────────────────
// Sends a 6-digit OTP to the user's registered email via AWS SES.
const sendOtp = async (req, res, next) => {
  try {
    const { identity } = req.body;
    if (!identity) return error(res, 'Email or mobile number required', 400);

    // Look up the user to get their email address
    const { rows: [user] } = await query(
      `SELECT email, mobile FROM users WHERE email = $1 OR mobile = $2`,
      [identity, identity]
    );

    if (!user || !user.email) {
      return error(res, 'No account found with this email or mobile number', 404);
    }

    // Generate random 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Store OTP hash (keyed by email for email-based verification)
    await query(`
      INSERT INTO otp_verifications (identity, otp_hash, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (identity) DO UPDATE SET otp_hash = EXCLUDED.otp_hash, expires_at = EXCLUDED.expires_at
    `, [user.email, otpHash, expiresAt]);

    // Also store by mobile if identity was mobile (so login can verify by either)
    if (user.mobile && user.mobile !== user.email) {
      await query(`
        INSERT INTO otp_verifications (identity, otp_hash, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (identity) DO UPDATE SET otp_hash = EXCLUDED.otp_hash, expires_at = EXCLUDED.expires_at
      `, [user.mobile, otpHash, expiresAt]);
    }

    // Send OTP via AWS SES email
    try {
      await sendOtpEmail(user.email, otp);
      logger.info(`[OTP] Email OTP sent to ${user.email}`);
    } catch (emailErr) {
      logger.error(`[OTP] Failed to send OTP email to ${user.email}: ${emailErr.message}`);
      // In development, log the OTP so developers can still test
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`[OTP-DEV] OTP for ${user.email}: ${otp}`);
      }
      return error(res, 'Failed to send OTP email. Please try again later.', 500);
    }

    // Mask email for display: p****p@gmail.com
    const maskedEmail = user.email.replace(/^(.{1})(.*)(@.*)$/, (_, first, middle, domain) => {
      return first + '*'.repeat(Math.min(middle.length, 6)) + domain;
    });

    return res.json({
      success: true,
      message: `OTP sent to ${maskedEmail}`,
      email: maskedEmail
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/verify-otp ──────────────────────────────────────────────────────────
const verifyOtpLogin = async (req, res, next) => {
  try {
    const { identity, otp } = req.body;
    if (!identity || !otp) return error(res, 'Identity and OTP required', 400);

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const { rows: [record] } = await query(`
      SELECT * FROM otp_verifications 
      WHERE identity = $1 AND otp_hash = $2 AND expires_at > NOW()
    `, [identity, otpHash]);

    if (!record) {
      return error(res, 'Invalid or expired OTP code', 400);
    }

    await query(`DELETE FROM otp_verifications WHERE id = $1`, [record.id]);

    return res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/login ──────────────────────────────────────────────────────────
// Email OTP-only login. No password authentication.
const login = async (req, res, next) => {
  try {
    const { identity, otp } = req.body;
    if (!identity) return error(res, 'Identity is required', 400);
    if (!otp) return error(res, 'OTP is required. Please request an OTP first.', 400);

    const { rows: [user] } = await query(
      `SELECT * FROM users WHERE email = $1 OR mobile = $2`,
      [identity, identity]
    );

    if (!user) return error(res, 'No account found with this email or mobile', 401);

    // Validate OTP
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const { rows: [record] } = await query(`
      SELECT * FROM otp_verifications 
      WHERE identity = $1 AND otp_hash = $2 AND expires_at > NOW()
    `, [identity, otpHash]);

    if (!record) {
      return error(res, 'Invalid or expired OTP code', 400);
    }
    await query(`DELETE FROM otp_verifications WHERE id = $1`, [record.id]);

    // Also clean up matching OTP for the other identity (email/mobile)
    if (user.email && user.mobile) {
      const otherIdentity = identity === user.email ? user.mobile : user.email;
      await query(`DELETE FROM otp_verifications WHERE identity = $1`, [otherIdentity]);
    }

    if (user.status === 'suspended') return error(res, 'Account suspended', 403);
    if (user.status === 'rejected') return error(res, 'Account rejected', 403);

    // Generate JWT (15-minute access token)
    const token = jwt.sign(
      { id: user.id, email: user.email, phone: user.mobile, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Generate Refresh Token
    const refreshToken = await generateAndSaveRefreshToken(user.id);

    return res.json({ success: true, token, refreshToken });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/refresh ───────────────────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Refresh token required', 400);

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Check if token exists, is not expired, and is not revoked
    const { rows: [tokenRecord] } = await query(`
      SELECT rt.*, u.email, u.mobile, u.role 
      FROM refresh_tokens rt
      JOIN users u ON u.id = rt.user_id
      WHERE rt.token_hash = $1 AND rt.revoked = false AND rt.expires_at > NOW()
    `, [tokenHash]);

    if (!tokenRecord) {
      return error(res, 'Invalid or expired refresh token', 401);
    }

    // Revoke the old refresh token (Rotation)
    await query(`UPDATE refresh_tokens SET revoked = true WHERE id = $1`, [tokenRecord.id]);

    // Generate new tokens
    const newToken = jwt.sign(
      { id: tokenRecord.user_id, email: tokenRecord.email, phone: tokenRecord.mobile, role: tokenRecord.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = await generateAndSaveRefreshToken(tokenRecord.user_id);

    return res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/register ────────────────────────────────────────────────────
// Registration still creates password_hash for backward compat, but login is OTP-only.
const register = async (req, res, next) => {
  try {
    const {
      email, mobile, password, first_name, last_name,
      current_address, business_location, company_name, company_type, gst_number,
      bank_name, account_number, ifsc_code, account_holder_name, role = 'Partner'
    } = req.body;

    if (!email || !mobile) {
      return error(res, 'Email and mobile are required', 400);
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

      // Hash password if provided (for backward compat); otherwise set null
      let passwordHash = null;
      if (password) {
        const bcrypt = require('bcrypt');
        const salt = await bcrypt.genSalt(10);
        passwordHash = await bcrypt.hash(password, salt);
      }

      // Insert User
      const { rows: [user] } = await client.query(
        `INSERT INTO users (email, mobile, password_hash, role, status)
         VALUES ($1, $2, $3, $4, 'pending') RETURNING id`,
        [email, mobile, passwordHash, role]
      );

      let PartnerCode = null;

      if (role === 'Partner' || role === 'admin' || role === 'super_admin') {
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
    if (!['Partner', 'admin', 'super_admin', 'employee'].includes(newRole)) {
      return error(res, 'Invalid role', 400);
    }

    // RBAC: Admin cannot promote users to admin or super_admin
    if (req.user.role === 'admin' && (newRole === 'super_admin' || newRole === 'admin')) {
      return error(res, 'Admins are not allowed to promote users to administrative roles', 403);
    }

    // Check target user's current role
    const { rows: [targetUser] } = await query(`SELECT role FROM users WHERE id = $1`, [userId]);
    if (!targetUser) return error(res, 'Target user not found', 404);

    // Admin cannot demote or modify other admin/super_admin accounts
    if (req.user.role === 'admin' && (targetUser.role === 'super_admin' || targetUser.role === 'admin')) {
      return error(res, 'Admins are not allowed to modify administrative accounts', 403);
    }

    await query(`UPDATE users SET role = $1 WHERE id = $2`, [newRole, userId]);
    logger.info(`Admin ${req.user.id} (${req.user.role}) changed role of User ${userId} to ${newRole}`);
    return success(res, `Role updated to ${newRole}`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe,
  lookupUser,
  sendOtp,
  verifyOtpLogin,
  login,
  register,
  logout,
  setRole,
  refresh
};
