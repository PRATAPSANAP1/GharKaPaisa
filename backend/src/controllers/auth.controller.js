/**
 * auth.controller.js — Firebase Auth Only
 * ─────────────────────────────────────────────────────────────────────────
 * PHASE 1–7 cleanup: Removed OTP, password, Twilio, and legacy login.
 * Only getMe + register (profile data) remain.
 */
const { query, getClient } = require('../config/db');
const { generatePartnerCode } = require('../utils/helpers');
const { success, created, error, notFound } = require('../utils/response');
const logger = require('../utils/logger');
const { ensureWallet } = require('../services/wallet.service');
const admin = require('../config/firebase');

// ── POST /auth/register ────────────────────────────────────────────────────
// Called after Firebase signup to save business/bank profile in PostgreSQL.
// firebaseAuth middleware already verified the token and provisioned the user.
const register = async (req, res, next) => {
  try {
    const firebaseUid = req.user?.firebase_uid || req.firebase?.uid;
    if (!firebaseUid) {
      return error(res, 'Firebase token required', 401);
    }

    const {
      email, mobile, first_name, last_name,
      current_address, business_location, company_name, company_type, gst_number,
      bank_name, account_number, ifsc_code, account_holder_name,
    } = req.body;

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Check if a partner profile already exists for this user
      const { rows: existing } = await client.query(
        `SELECT id FROM Partner_profiles WHERE user_id = $1`,
        [req.user.id]
      );
      if (existing.length) {
        await client.query('ROLLBACK');
        return error(res, 'Profile already registered', 409);
      }

      // Generate Partner code using atomic sequence
      const { rows: [{ nextval }] } = await client.query(`SELECT nextval('partner_code_seq')`);
      const PartnerCode = generatePartnerCode(parseInt(nextval));

      // Update user email/mobile if they came in from phone-only Firebase auth
      await client.query(
        `UPDATE users SET email = COALESCE(NULLIF($1,''), email),
                          mobile = COALESCE(NULLIF($2,''), mobile),
                          status = 'pending'
         WHERE id = $3`,
        [email, mobile, req.user.id]
      );

        // Create Partner profile
        const { rows: [Partner] } = await client.query(`
          INSERT INTO Partner_profiles (
            user_id, Partner_code, first_name, last_name, current_address,
            business_location, company_name, company_type, gst_number,
            aadhar_url, pan_url, gst_cert_url, cancel_cheque_url
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, NULL, NULL, NULL) RETURNING id
        `, [
          req.user.id, PartnerCode, first_name, last_name, current_address,
          business_location || '', company_name, company_type, gst_number || null
        ]);

        // Create bank details
        await client.query(`
          INSERT INTO Partner_bank_details (Partner_id, bank_name, account_number, ifsc_code, account_holder_name)
          VALUES ($1, $2, $3, $4, $5)
        `, [Partner.id, bank_name, account_number, ifsc_code, account_holder_name]);

        // Create wallet inside transaction
        await client.query(`
          INSERT INTO wallets (Partner_id) VALUES ($1)
          ON CONFLICT (Partner_id) DO NOTHING
        `, [Partner.id]);

        await client.query('COMMIT');

        logger.info(`Partner profile created: ${email} (${PartnerCode})`);
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

// ── GET /auth/me ────────────────────────────────────────────────────────────
// Returns full DB user profile + Firebase decoded token.
// As per the guide: { success, user, firebase }
const getMe = async (req, res, next) => {
  try {
      const { rows: [user] } = await query(`
        SELECT u.id, u.email, u.mobile, u.role, u.status, u.last_login, u.firebase_uid,
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
      user,
      firebase: {
        uid:            req.firebase?.uid  || req.firebaseUser?.uid,
        email:          req.firebase?.email           || req.firebaseUser?.email           || null,
        phone_number:   req.firebase?.phone_number    || req.firebaseUser?.phone_number    || null,
        email_verified: req.firebase?.email_verified  || req.firebaseUser?.email_verified  || false,
      }
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/logout ───────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const firebaseUid = req.firebase?.uid || req.user?.firebase_uid;
    if (firebaseUid) {
      await admin.auth().revokeRefreshTokens(firebaseUid);
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ── PUT /auth/admin/set-role ────────────────────────────────────────────────
const setRole = async (req, res, next) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return error(res, 'userId and role are required', 400);
    }

    const validRoles = ['super_admin', 'admin', 'employee', 'Partner'];
    if (!validRoles.includes(role)) {
      return error(res, 'Invalid role', 400);
    }

    const { rowCount } = await query(
      `UPDATE users SET role = $1, status = 'active' WHERE id = $2`,
      [role, userId]
    );

    if (!rowCount) return error(res, 'User not found', 404);

    return success(res, {}, `Role updated to ${role} successfully`);
  } catch (err) {
    next(err);
  }
};

const lookupUser = async (req, res, next) => {
  try {
    const { identity, identifier } = req.body;
    const key = identity || identifier;
    if (!key) {
      return error(res, 'Email or mobile is required', 400);
    }

    const trimmed = key.trim();
    const cleanMobile = trimmed.replace(/\D/g, '').slice(-10);

    const { rows: [user] } = await query(
      `SELECT email, mobile FROM users WHERE email = $1 OR mobile = $2 OR RIGHT(mobile, 10) = $3`,
      [trimmed, trimmed, cleanMobile]
    );

    if (!user) {
      return notFound(res, 'Account not found');
    }

    return success(res, { email: user.email, mobile: user.mobile });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  getMe,
  logout,
  setRole,
  lookupUser
};
