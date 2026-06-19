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
const { success, created, error } = require('../utils/response');
const logger = require('../utils/logger');
const { sendOtpEmail, sendVerificationEmail, sendEmail } = require('../services/email.service');
const { encrypt } = require('../utils/crypto');
const { JWT_SECRET, OTP_PEPPER } = require('../config/jwt.config');

const normalizeIdentity = (value) => {
  const identity = String(value || '').trim();
  return identity.includes('@') ? identity.toLowerCase() : identity;
};

const buildVerificationLink = (token) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'https://gharkapaisa.in')
    .split(',')[0]
    .trim()
    .replace(/\/+$/, '');
  return `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
};

// ── GET /auth/me ────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
      const { rows: [user] } = await query(`
        SELECT u.id, u.email, u.mobile, u.role, u.status, u.last_login,
          ap.id as Partner_id, ap.Partner_code, ap.first_name, ap.last_name,
          ap.kyc_status, ap.company_name, ap.profile_photo_url, ap.current_address,
          ap.business_location, ap.gst_number, ap.company_type,
          pbd.bank_name, pbd.account_number, pbd.ifsc_code, pbd.account_holder_name,
          w.available_balance, w.hold_balance as pending_amount, w.total_earned, w.total_withdrawn
        FROM users u
        LEFT JOIN Partner_profiles ap ON ap.user_id = u.id
        LEFT JOIN Partner_bank_details pbd ON pbd.Partner_id = ap.id
        LEFT JOIN wallets w ON w.Partner_id = ap.id
        WHERE u.id = $1
      `, [req.user.id]);

    if (!user) return error(res, 'User not found', 404);

    if (user.account_number) {
      const { decrypt } = require('../utils/crypto');
      const decrypted = decrypt(user.account_number);
      user.account_number_last4 = decrypted.slice(-4);
      user.account_number = 'XXXX' + decrypted.slice(-4);
    }

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
    const identity = normalizeIdentity(req.body.identity);
    if (!identity) return error(res, 'Identity required', 400);

    const { rows: [user] } = await query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR mobile = $2`,
      [identity, identity]
    );

    if (!user) {
      return res.json({ success: true, exists: false, data: { exists: false } });
    }

    return res.json({ success: true, exists: true, data: { exists: true } });
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
    const identity = normalizeIdentity(req.body.identity);
    if (!identity) return error(res, 'Email or mobile number required', 400);

    // Look up the user to get their email address
    const { rows: [user] } = await query(
      `SELECT email, mobile, email_verified FROM users WHERE LOWER(email) = LOWER($1) OR mobile = $2`,
      [identity, identity]
    );

    if (!user || !user.email) {
      return error(res, 'No account found with this email or mobile number', 404);
    }

    if (!user.email_verified) {
      return error(res, 'Please verify your email address before logging in. Check your inbox for the verification link.', 403);
    }

    const emailIdentity = normalizeIdentity(user.email);

    // Generate random 6-digit OTP
    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = crypto.createHmac('sha256', OTP_PEPPER).update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Store OTP hash (keyed by email for email-based verification)
    await query(`
      INSERT INTO otp_verifications (identity, otp_hash, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (identity) DO UPDATE SET otp_hash = EXCLUDED.otp_hash, expires_at = EXCLUDED.expires_at
    `, [emailIdentity, otpHash, expiresAt]);

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
      await sendOtpEmail(emailIdentity, otp);
      logger.info(`[OTP] Email OTP sent to ${emailIdentity}`);
    } catch (emailErr) {
      logger.error(`[OTP] Failed to send OTP email to ${emailIdentity}: ${emailErr.message}`);
      await query(
        `DELETE FROM otp_verifications WHERE identity = $1 OR identity = $2`,
        [emailIdentity, user.mobile || emailIdentity]
      );
      // In development, log the OTP so developers can still test
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`[OTP-DEV] OTP for ${emailIdentity}: ${otp}`);
      }
      return error(res, 'Failed to send OTP email. Please try again later.', 500);
    }

    // Mask email for display: p****p@gmail.com
    const maskedEmail = emailIdentity.replace(/^(.{1})(.*)(@.*)$/, (_, first, middle, domain) => {
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

// ── POST /auth/send-registration-otp ─────────────────────────────────────────
const sendRegistrationOtp = async (req, res, next) => {
  try {
    const email = normalizeIdentity(req.body.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error(res, 'A valid email is required', 400);

    // Generate OTP and store hash
    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = crypto.createHmac('sha256', OTP_PEPPER).update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await query(`
      INSERT INTO otp_verifications (identity, otp_hash, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (identity) DO UPDATE SET otp_hash = EXCLUDED.otp_hash, expires_at = EXCLUDED.expires_at
    `, [email, otpHash, expiresAt]);

    try {
      await sendOtpEmail(email, otp);
      logger.info(`[Registration-OTP] Sent OTP to ${email}`);
    } catch (err) {
      logger.error(`[Registration-OTP] Failed to send OTP to ${email}: ${err.message}`);
      return error(res, 'Failed to send OTP. Please try again later.', 500);
    }

    const masked = email.replace(/^(.{1})(.*)(@.*)$/, (_, first, middle, domain) => first + '*'.repeat(Math.min(middle.length, 6)) + domain);
    return res.json({ success: true, message: `OTP sent to ${masked}`, email: masked });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/verify-registration-otp ───────────────────────────────────────
const verifyRegistrationOtp = async (req, res, next) => {
  try {
    const email = normalizeIdentity(req.body.email);
    const { otp } = req.body;
    if (!email || !otp) return error(res, 'Email and OTP are required', 400);

    const otpHash = crypto.createHmac('sha256', OTP_PEPPER).update(String(otp)).digest('hex');
    const { rows: [record] } = await query(`SELECT * FROM otp_verifications WHERE identity = $1 AND otp_hash = $2 AND expires_at > NOW()`, [email, otpHash]);
    if (!record) return error(res, 'Invalid or expired OTP', 400);

    // Remove OTP and mark email as pre-verified
    await query(`DELETE FROM otp_verifications WHERE id = $1`, [record.id]);
    await query(`INSERT INTO pre_verified_emails (email, verified_at) VALUES ($1, NOW()) ON CONFLICT (email) DO UPDATE SET verified_at = NOW()`, [email]);

    return res.json({ success: true, message: 'Email verified for registration' });
  } catch (err) {
    next(err);
  }
};



// ── POST /auth/login ──────────────────────────────────────────────────────────
// Email OTP-only login. No password authentication.
const login = async (req, res, next) => {
  try {
    const identity = normalizeIdentity(req.body.identity);
    const { otp } = req.body;
    if (!identity) return error(res, 'Identity is required', 400);
    if (!otp) return error(res, 'OTP is required. Please request an OTP first.', 400);

    const { rows: [user] } = await query(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR mobile = $2`,
      [identity, identity]
    );

    if (!user) return error(res, 'No account found with this email or mobile', 401);

    if (!user.email_verified) {
      return error(res, 'Please verify your email address before logging in. Check your inbox for the verification link.', 403);
    }
    if (user.status === 'suspended') return error(res, 'Account suspended', 403);
    if (user.status === 'rejected') return error(res, 'Account rejected', 403);

    // Validate OTP
    const otpHash = crypto.createHmac('sha256', OTP_PEPPER).update(otp).digest('hex');
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
      const emailIdentity = normalizeIdentity(user.email);
      const otherIdentity = identity === emailIdentity ? user.mobile : emailIdentity;
      await query(`DELETE FROM otp_verifications WHERE identity = $1`, [otherIdentity]);
    }

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
      password, first_name, last_name,
      current_address, business_location, company_name, company_type, gst_number,
      bank_name, account_number, ifsc_code, account_holder_name
    } = req.body;
    const email = normalizeIdentity(req.body.email);
    const mobile = normalizeIdentity(req.body.mobile);
    const role = 'PARTNER';

    if (!email || !mobile) {
      return error(res, 'Email and mobile are required', 400);
    }

    const client = await getClient();
    let committed = false;
    try {
      await client.query('BEGIN');

      // Check if user exists
      const { rows: existingUser } = await client.query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR mobile = $2`,
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

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

      // Insert User
      // Check if email was pre-verified via registration OTP
      const { rows: [pre] } = await client.query(`SELECT email FROM pre_verified_emails WHERE LOWER(email) = LOWER($1)`, [email]);
      const emailVerified = !!pre;

      const { rows: [user] } = await client.query(
        `INSERT INTO users (email, mobile, password_hash, role, status, email_verified, verification_token, verification_token_expires_at)
         VALUES ($1, $2, $3, $4, 'pending', $7, $5, $6) RETURNING id`,
        [email, mobile, passwordHash, role, verificationToken, verificationTokenExpiresAt, emailVerified]
      );

      if (emailVerified) {
        // Remove pre-verified marker
        await client.query(`DELETE FROM pre_verified_emails WHERE LOWER(email) = LOWER($1)`, [email]);
      }

      let PartnerCode = null;

      if (role === 'PARTNER' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
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
        const encryptedAccountNumber = encrypt(account_number);
        await client.query(`
          INSERT INTO Partner_bank_details (Partner_id, bank_name, account_number, ifsc_code, account_holder_name)
          VALUES ($1, $2, $3, $4, $5)
        `, [Partner.id, bank_name, encryptedAccountNumber, ifsc_code, account_holder_name]);

        // Create wallet
        await client.query(`
          INSERT INTO wallets (Partner_id) VALUES ($1)
        `, [Partner.id]);
      }

      await client.query('COMMIT');
      committed = true;

      // Send after commit so a delivered link always points to a saved account.
      try {
        const verificationLink = buildVerificationLink(verificationToken);
        await sendVerificationEmail(email, verificationLink);
        logger.info(`[Verification] Sent verification email to ${email}`);
      } catch (emailErr) {
        logger.error(`[Verification] Failed to send verification email to ${email}: ${emailErr.message}`);
        return created(
          res,
          { partner_code: PartnerCode, email, email_sent: false },
          'Registration completed, but the verification email could not be sent. Please use resend verification.'
        );
      }

      logger.info(`User registered: ${email} (${PartnerCode || role})`);
      return created(res, { partner_code: PartnerCode, email, email_sent: true }, 'Registration successful. A verification email has been sent. Please check your inbox.');
    } catch (err) {
      if (!committed) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackErr) {
          logger.error(`Registration rollback failed: ${rollbackErr.message}`);
        }
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/verify-email ──────────────────────────────────────────────────
// Add password-based login, forgot/reset password endpoints
// ── POST /auth/login-password ─────────────────────────────────────────────────
const loginPassword = async (req, res, next) => {
  try {
    const { identity, password } = req.body;
    if (!identity || !password) return error(res, 'Identity and password required', 400);

    const { rows: [user] } = await query(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR mobile = $2`,
      [identity, identity]
    );

    if (!user) return error(res, 'No account found with this email or mobile', 401);

    const bcrypt = require('bcryptjs');
    if (!user.password_hash) return error(res, 'Password login not enabled for this account', 401);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return error(res, 'Invalid credentials', 401);

    if (!user.email_verified) {
      return error(res, 'Please verify your email address before logging in. Check your inbox for the verification link.', 403);
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

// ── POST /auth/forgot-password ───────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email required', 400);

    const { rows: [user] } = await query(`SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)`, [email]);

    // Always return success to avoid account enumeration
    if (!user) return res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(`UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3`, [token, expiresAt, user.id]);

    // Send reset email
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://gharkapaisa.in';
      const resetLink = `${frontendUrl}/reset-password?token=${token}`;
      const html = `<p>Please click the link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`;
      await sendEmail({ to: user.email, subject: 'Reset your GharKaPaisa password', html, text: `Reset link: ${resetLink}` });
      logger.info(`[Password] Sent reset link to ${user.email}`);
    } catch (emailErr) {
      logger.error(`[Password] Failed to send reset email to ${user.email}: ${emailErr.message}`);
      // still respond with generic message
    }

    return res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/reset-password ────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return error(res, 'Token and new password required', 400);

    const { rows: [user] } = await query(`SELECT id, reset_token_expires_at FROM users WHERE reset_token = $1`, [token]);
    if (!user) return error(res, 'Invalid or expired token', 400);
    if (user.reset_token_expires_at && new Date() > new Date(user.reset_token_expires_at)) {
      return error(res, 'Reset token has expired', 400);
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    await query(`UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE id = $2`, [passwordHash, user.id]);

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/verify-email ──────────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return error(res, 'Verification token is required', 400);
    }

    const { rows: [user] } = await query(
      `SELECT id, email, email_verified, verification_token_expires_at FROM users WHERE verification_token = $1`,
      [token]
    );

    if (!user) {
      return error(res, 'Invalid or expired verification token', 400);
    }

    if (user.verification_token_expires_at && new Date() > new Date(user.verification_token_expires_at)) {
      return error(res, 'Verification token has expired', 400);
    }

    await query(
      `UPDATE users 
       SET email_verified = TRUE, 
           status = CASE WHEN status = 'pending' THEN 'active' ELSE status END,
           verification_token = NULL,
           verification_token_expires_at = NULL
       WHERE id = $1`,
      [user.id]
    );

    logger.info(`[Verification] Email verified successfully for user: ${user.email}`);

    return res.json({
      success: true,
      message: 'Your email has been verified successfully!'
    });
  } catch (err) {
    next(err);
  }
};

const resendVerificationEmail = async (req, res, next) => {
  try {
    const email = normalizeIdentity(req.body.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return error(res, 'A valid email address is required', 400);
    }

    const { rows: [user] } = await query(
      `SELECT id, email, email_verified FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    // Keep this generic so the endpoint does not reveal registered addresses.
    if (!user || user.email_verified) {
      return res.json({
        success: true,
        message: 'If this address has an unverified account, a new verification email has been sent.'
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await query(
      `UPDATE users
       SET verification_token = $1, verification_token_expires_at = $2
       WHERE id = $3`,
      [verificationToken, verificationTokenExpiresAt, user.id]
    );

    await sendVerificationEmail(user.email, buildVerificationLink(verificationToken));
    logger.info(`[Verification] Resent verification email to ${user.email}`);

    return res.json({
      success: true,
      message: 'If this address has an unverified account, a new verification email has been sent.'
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/logout ───────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await query(`UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1`, [tokenHash]);
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ── PUT /auth/admin/set-role ────────────────────────────────────────────────
const setRole = async (req, res, next) => {
  try {
    const { userId, newRole } = req.body;
    if (!['PARTNER', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'].includes(newRole)) {
      return error(res, 'Invalid role', 400);
    }

    // RBAC: Admin cannot promote users to admin or super_admin
    if (req.user.role === 'ADMIN' && (newRole === 'SUPER_ADMIN' || newRole === 'ADMIN')) {
      return error(res, 'Admins are not allowed to promote users to administrative roles', 403);
    }

    // Check target user's current role
    const { rows: [targetUser] } = await query(`SELECT role FROM users WHERE id = $1`, [userId]);
    if (!targetUser) return error(res, 'Target user not found', 404);

    // Admin cannot demote or modify other admin/super_admin accounts
    if (req.user.role === 'ADMIN' && (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN')) {
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
  login,
  loginPassword,
  register,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
  logout,
  setRole,
  refresh
};
