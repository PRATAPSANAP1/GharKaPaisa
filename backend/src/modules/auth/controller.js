
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, getClient } = require('../../config/database');
const { generatePartnerCode } = require('../../utils/helpers/helpers');
const { success, created, error } = require('../../utils/response/response');
const logger = require('../../config/logger');
const { sendOtpEmail, sendVerificationEmail, sendEmail } = require('../../services/email/email.service.js');
const { encrypt, decrypt } = require('../../utils/helpers/crypto');
const { JWT_SECRET, OTP_PEPPER } = require('../../config/jwt.js');
const { normalizeIndianMobile, verifyAccessToken, sendSmsOtp } = require('../../services/otp/msg91.service.js');

const maskEmail = (email) => {
  const at = email.indexOf('@');
  if (at <= 1) return email;
  return email[0] + '*'.repeat(Math.min(at - 1, 6)) + email.slice(at);
};

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

const isProd = process.env.NODE_ENV === 'production';

const setRefreshTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  };

  if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }

  res.cookie('refreshToken', token, cookieOptions);
};

const clearRefreshTokenCookie = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  };

  if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }

  res.clearCookie('refreshToken', cookieOptions);
};

// ── GET /auth/me ────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
      const { rows: [user] } = await query(`
        SELECT u.id, u.email, u.mobile, u.role, u.status, u.last_login, u.must_change_password,
          ap.id as partner_id, ap.partner_code, ap.first_name, ap.last_name,
          ap.kyc_status, ap.company_name, ap.profile_photo_url, ap.current_address,
          ap.business_location, ap.gst_number, ap.company_type, ap.pincode,
          pbd.bank_name, pbd.account_number, pbd.ifsc_code, pbd.account_holder_name,
          w.available_balance, w.hold_balance as pending_amount, w.total_earned, w.total_withdrawn
        FROM users u
        LEFT JOIN partner_profiles ap ON ap.user_id = u.id
        LEFT JOIN partner_bank_details pbd ON pbd.partner_id = ap.id
        LEFT JOIN wallets w ON w.partner_id = ap.id
        WHERE u.id = $1
      `, [req.user.id]);

    if (!user) return error(res, 'User not found', 404);

    if (user.account_number) {
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
    console.error("GET_ME_ERROR", err);
    return res.status(500).json({ success: false, message: 'Server Error in /me: ' + err.message, stack: err.stack });
  }
};

// ── POST /auth/lookup ────────────────────────────────────────────────────────────
const lookupUser = async (req, res, next) => {
  try {
    const identity = normalizeIdentity(req.body.identity);
    if (!identity) return error(res, 'Identity required', 400);

    let reqRole = String(req.body.role || '').toUpperCase().trim();
    if (reqRole === 'SUPERADMIN') reqRole = 'SUPER_ADMIN';

    let userQuery = `SELECT id FROM users WHERE (LOWER(email) = LOWER($1) OR mobile = $2)`;
    let queryParams = [identity, identity];
    if (reqRole) {
      userQuery += ` AND role = $3`;
      queryParams.push(reqRole);
    }

    const { rows: [user] } = await query(userQuery, queryParams);

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

    let reqRole = String(req.body.role || '').toUpperCase().trim();
    if (reqRole === 'SUPERADMIN') reqRole = 'SUPER_ADMIN';

    // Look up the user to get their email address
    let userQuery = `SELECT email, mobile, email_verified FROM users WHERE (LOWER(email) = LOWER($1) OR mobile = $2)`;
    let queryParams = [identity, identity];
    if (reqRole) {
      userQuery += ` AND role = $3`;
      queryParams.push(reqRole);
    }
    const { rows: [user] } = await query(userQuery, queryParams);

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

    // Send OTP via SMS or Email based on input identity
    const isMobileInput = /^\+?91?\d{10}$/.test(identity) || /^[6-9]\d{9}$/.test(identity);
    let targetMasked = '';

    try {
      if (isMobileInput && user.mobile) {
        await sendSmsOtp(user.mobile, otp);
        logger.info(`[OTP] SMS OTP sent to ${user.mobile}`);
        targetMasked = '******' + user.mobile.slice(-4);
      } else {
        await sendOtpEmail(emailIdentity, otp);
        logger.info(`[OTP] Email OTP sent to ${emailIdentity}`);
        targetMasked = maskEmail(emailIdentity);
      }
    } catch (sendErr) {
      logger.error(`[OTP] Failed to send OTP to ${identity}: ${sendErr.message}`);
      // In development, log the OTP so developers can still test and return success
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`[OTP-DEV] OTP for ${identity}: ${otp}`);
        targetMasked = isMobileInput ? '******' + (user.mobile || '').slice(-4) : maskEmail(emailIdentity);
        return res.json({
          success: true,
          message: `[DEV ONLY] OTP logged. OTP sent to ${targetMasked}`,
          identity: targetMasked
        });
      }
      await query(
        `DELETE FROM otp_verifications WHERE identity = $1 OR identity = $2`,
        [emailIdentity, user.mobile || emailIdentity]
      );
      return error(res, 'Failed to send OTP. Please try again later.', 500);
    }

    return res.json({
      success: true,
      message: `OTP sent to ${targetMasked}`,
      identity: targetMasked
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

    // Check if user already exists
    const { rows: [existing] } = await query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    if (existing) {
      return error(res, 'This email address is already registered', 409);
    }

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
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`[Registration-OTP-DEV] OTP for ${email}: ${otp}`);
        const masked = maskEmail(email);
        return res.json({ success: true, message: `[DEV ONLY] OTP logged. OTP sent to ${masked}`, email: masked });
      }
      await query(`DELETE FROM otp_verifications WHERE identity = $1`, [email]);
      return error(res, 'Failed to send OTP. Please try again later.', 500);
    }

    const masked = maskEmail(email);
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

    let reqRole = String(req.body.role || '').toUpperCase().trim();
    if (reqRole === 'SUPERADMIN') reqRole = 'SUPER_ADMIN';

    let userQuery = `SELECT * FROM users WHERE (LOWER(email) = LOWER($1) OR mobile = $2)`;
    let queryParams = [identity, identity];
    if (reqRole) {
      userQuery += ` AND role = $3`;
      queryParams.push(reqRole);
    }
    const { rows: [user] } = await query(userQuery, queryParams);

    if (!user) return error(res, 'No account found with this email or mobile', 401);

    if (!user.email_verified) {
      return error(res, 'Please verify your email address before logging in. Check your inbox for the verification link.', 403);
    }
    if (user.status === 'suspended') return error(res, 'Your account has been suspended. Please contact support.', 403);
    if (user.status === 'blocked') return error(res, 'Your account has been blocked by the administrator. Please contact support.', 403);

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

    // Fetch KYC status for partner users
    let kycStatus = null;
    let rejectionReason = null;
    if ((user.role || '').toUpperCase() === 'PARTNER') {
      const { rows: [partner] } = await query(
        `SELECT kyc_status, rejection_reason FROM Partner_profiles WHERE user_id = $1`, [user.id]
      );
      if (partner) {
        kycStatus = partner.kyc_status;
        rejectionReason = partner.rejection_reason;
      }
    }

    const redirectUrl = user.role === 'SUPER_ADMIN' ? '/superadmin/dashboard' :
                        user.role === 'ADMIN' ? '/admin/dashboard' :
                        user.role === 'EMPLOYEE' ? 'https://yohesa-test-three.vercel.app/dashboard' :
                        '/partner/dashboard';

    setRefreshTokenCookie(res, refreshToken);
    return res.json({ success: true, token, refreshToken, role: user.role, status: user.status, kyc_status: kycStatus, rejection_reason: rejectionReason, redirect: redirectUrl });
  } catch (err) {
    next(err);
  }
};

// Mobile app login: MSG91 sends/verifies the SMS OTP, then the backend verifies
// the resulting access token before issuing GharKaPaisa session tokens.
const loginWithMsg91 = async (req, res, next) => {
  try {
    const mobile = normalizeIndianMobile(req.body.mobile);
    const accessToken = String(req.body.accessToken || '').trim();

    if (!mobile) return error(res, 'A valid 10-digit Indian mobile number is required', 400);
    if (!accessToken) return error(res, 'MSG91 verification token is required', 400);

    let reqRole = String(req.body.role || '').toUpperCase().trim();
    if (reqRole === 'SUPERADMIN') reqRole = 'SUPER_ADMIN';

    let userQuery = `SELECT * FROM users WHERE mobile = $1`;
    let queryParams = [mobile];
    if (reqRole) {
      userQuery += ` AND role = $2`;
      queryParams.push(reqRole);
    }
    const { rows: [user] } = await query(userQuery, queryParams);

    if (!user) return error(res, 'No account found with this mobile number', 401);
    if (user.status === 'suspended') return error(res, 'Your account has been suspended. Please contact support.', 403);
    if (user.status === 'blocked') return error(res, 'Your account has been blocked by the administrator. Please contact support.', 403);

    try {
      await verifyAccessToken({ accessToken, expectedMobile: mobile });
    } catch (msg91Err) {
      logger.warn(`[MSG91] Mobile token verification failed for ${mobile}: ${msg91Err.message}`);
      return error(res, 'Invalid or expired SMS verification token', 401);
    }

    const msg91TokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    const { rowCount } = await query(
      `INSERT INTO msg91_verified_tokens (token_hash, user_id)
       VALUES ($1, $2)
       ON CONFLICT (token_hash) DO NOTHING`,
      [msg91TokenHash, user.id]
    );
    if (rowCount !== 1) {
      return error(res, 'This SMS verification token has already been used', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, phone: user.mobile, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = await generateAndSaveRefreshToken(user.id);

    // Fetch KYC status for partner users
    let kycStatus = null;
    let rejectionReason = null;
    if ((user.role || '').toUpperCase() === 'PARTNER') {
      const { rows: [partner] } = await query(
        `SELECT kyc_status, rejection_reason FROM Partner_profiles WHERE user_id = $1`, [user.id]
      );
      if (partner) {
        kycStatus = partner.kyc_status;
        rejectionReason = partner.rejection_reason;
      }
    }

    const redirectUrl = user.role === 'SUPER_ADMIN' ? '/superadmin/dashboard' :
                        user.role === 'ADMIN' ? '/admin/dashboard' :
                        user.role === 'EMPLOYEE' ? 'https://yohesa-test-three.vercel.app/dashboard' :
                        '/partner/dashboard';

    setRefreshTokenCookie(res, refreshToken);
    logger.info(`[MSG91] Mobile login completed for user ${user.id}`);
    return res.json({ success: true, token, refreshToken, role: user.role, status: user.status, kyc_status: kycStatus, rejection_reason: rejectionReason, redirect: redirectUrl });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/refresh ───────────────────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) return error(res, 'Refresh token required', 401);

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

    setRefreshTokenCookie(res, newRefreshToken);
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
      current_address, business_location, company_name, company_type, gst_number, pincode,
      bank_name, account_number, ifsc_code, account_holder_name, referral_code
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
         VALUES ($1, $2, $3, $4::user_role, CASE WHEN $4 = 'PARTNER' THEN 'inactive'::user_status WHEN $7 THEN 'active'::user_status ELSE 'pending'::user_status END, $7, $5, $6) RETURNING id`,
        [email, mobile, passwordHash, role, verificationToken, verificationTokenExpiresAt, emailVerified]
      );

      if (emailVerified) {
        // Remove pre-verified marker
        await client.query(`DELETE FROM pre_verified_emails WHERE LOWER(email) = LOWER($1)`, [email]);
      }

      let parentPartnerId = null;
      let parentTeamLevel = 0;

      if (referral_code && role === 'PARTNER') {
        const { rows: [parentPartner] } = await client.query(`
          SELECT id, team_level, allow_team_creation, team_status FROM partner_profiles WHERE partner_code = $1
        `, [referral_code]);
        if (parentPartner) {
          if (parentPartner.allow_team_creation === false || parentPartner.team_status === 'INACTIVE') {
            await client.query('ROLLBACK');
            return error(res, 'The referring partner is currently not accepting new team members.', 403);
          }
          parentPartnerId = parentPartner.id;
          parentTeamLevel = parseInt(parentPartner.team_level || 1);
        }
      }

      let PartnerCode = null;

      if (role === 'PARTNER' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
        // Generate Partner code using atomic sequence
        const { rows: [{ nextval }] } = await client.query(`SELECT nextval('partner_code_seq')`);
        PartnerCode = generatePartnerCode(parseInt(nextval));

        // Create Partner profile
        const { rows: [Partner] } = await client.query(`
          INSERT INTO partner_profiles (
            user_id, partner_code, first_name, last_name, current_address,
            business_location, company_name, company_type, gst_number, pincode,
            parent_partner_id, team_level, team_joined_at, kyc_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::uuid, $12, CASE WHEN $11::uuid IS NOT NULL THEN NOW() ELSE NULL END, 'pending') RETURNING id
        `, [
          user.id, PartnerCode, first_name, last_name, current_address,
          business_location || '', company_name, company_type, gst_number || null, pincode || null,
          parentPartnerId, parentTeamLevel + 1
        ]);

        // Create team relationships recursively
        if (parentPartnerId) {
          let currentParentId = parentPartnerId;
          let currentLevel = 1;
          while (currentParentId) {
            await client.query(`
              INSERT INTO partner_team_relationships (parent_partner_id, child_partner_id, level)
              VALUES ($1, $2, $3)
            `, [currentParentId, Partner.id, currentLevel]);

            // Update parent's children count
            if (currentLevel === 1) {
              await client.query(`
                UPDATE partner_profiles SET children_count = children_count + 1 WHERE id = $1
              `, [currentParentId]);
              
              // Increment total_registered on partner_referrals for parent
              await client.query(`
                UPDATE partner_referrals SET total_registered = total_registered + 1 WHERE partner_id = $1
              `, [currentParentId]);
            }

            const { rows: [nextParent] } = await client.query(`
              SELECT parent_partner_id FROM partner_profiles WHERE id = $1
            `, [currentParentId]);
            currentParentId = nextParent?.parent_partner_id || null;
            currentLevel++;
          }
        }

        // Create referrals record
        const referralLink = `${process.env.FRONTEND_URL || 'https://gharkapaisa.in'}/register?ref=${PartnerCode}`;
        await client.query(`
          INSERT INTO partner_referrals (partner_id, referral_code, referral_link)
          VALUES ($1, $2, $3)
        `, [Partner.id, PartnerCode, referralLink]);

        // Create bank details
        const encryptedAccountNumber = encrypt(account_number);
        await client.query(`
          INSERT INTO partner_bank_details (partner_id, bank_name, account_number, ifsc_code, account_holder_name)
          VALUES ($1, $2, $3, $4, $5)
        `, [Partner.id, bank_name, encryptedAccountNumber, ifsc_code, account_holder_name]);

        // Create wallet
        await client.query(`
          INSERT INTO partner_wallets (partner_id) VALUES ($1)
        `, [Partner.id]);
      }

      await client.query('COMMIT');
      committed = true;

      // Send after commit so a delivered link always points to a saved account.
      if (!emailVerified) {
        try {
          const verificationLink = buildVerificationLink(verificationToken);
          await sendVerificationEmail(email, verificationLink);
          logger.info(`[Verification] Sent verification email to ${email}`);
        } catch (emailErr) {
          logger.error(`[Verification] Failed to send verification email to ${email}: ${emailErr.message}`);
          if (process.env.NODE_ENV !== 'production') {
            logger.info(`[Verification-DEV] Verification Link for ${email}: ${buildVerificationLink(verificationToken)}`);
            return created(
              res,
              { partner_code: PartnerCode, email, email_sent: true, email_verified: false },
              'Registration completed. Verification link logged in console.'
            );
          }
          return created(
            res,
            { partner_code: PartnerCode, email, email_sent: false, email_verified: false },
            'Registration completed, but the verification email could not be sent. Please use resend verification.'
          );
        }
      }

      logger.info(`User registered: ${email} (${PartnerCode || role})`);
      return created(
        res,
        { partner_code: PartnerCode, email, email_sent: !emailVerified, email_verified: emailVerified },
        emailVerified ? 'Registration successful. Your email has been verified.' : 'Registration successful. A verification email has been sent. Please check your inbox.'
      );
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

    let reqRole = String(req.body.role || '').toUpperCase().trim();
    if (reqRole === 'SUPERADMIN') reqRole = 'SUPER_ADMIN';

    let userQuery = `SELECT * FROM users WHERE (LOWER(email) = LOWER($1) OR mobile = $2)`;
    let queryParams = [identity, identity];
    if (reqRole) {
      userQuery += ` AND role = $3`;
      queryParams.push(reqRole);
    }
    const { rows: [user] } = await query(userQuery, queryParams);

    if (!user) return error(res, 'No account found with this email or mobile', 401);

    if (!user.password_hash) return error(res, 'Password login not enabled for this account', 401);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return error(res, 'Invalid credentials', 401);

    if (!user.email_verified) {
      return error(res, 'Please verify your email address before logging in. Check your inbox for the verification link.', 403);
    }
    if (user.status === 'suspended') return error(res, 'Your account has been suspended. Please contact support.', 403);
    if (user.status === 'blocked') return error(res, 'Your account has been blocked by the administrator. Please contact support.', 403);

    // Generate JWT (15-minute access token)
    const token = jwt.sign(
      { id: user.id, email: user.email, phone: user.mobile, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Generate Refresh Token
    const refreshToken = await generateAndSaveRefreshToken(user.id);

    // Fetch KYC status for partner users
    let kycStatus = null;
    let rejectionReason = null;
    if ((user.role || '').toUpperCase() === 'PARTNER') {
      const { rows: [partner] } = await query(
        `SELECT kyc_status, rejection_reason FROM Partner_profiles WHERE user_id = $1`, [user.id]
      );
      if (partner) {
        kycStatus = partner.kyc_status;
        rejectionReason = partner.rejection_reason;
      }
    }

    const redirectUrl = user.role === 'SUPER_ADMIN' ? '/superadmin/dashboard' :
                        user.role === 'ADMIN' ? '/admin/dashboard' :
                        user.role === 'EMPLOYEE' ? 'https://yohesa-test-three.vercel.app/dashboard' :
                        '/partner/dashboard';

    setRefreshTokenCookie(res, refreshToken);
    return res.json({ success: true, token, refreshToken, role: user.role, status: user.status, kyc_status: kycStatus, rejection_reason: rejectionReason, redirect: redirectUrl });
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

// ── POST /auth/forgot-mobile ──────────────────────────────────────────────────
const forgotMobile = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email required', 400);

    let reqRole = String(req.body.role || '').toUpperCase().trim();
    if (reqRole === 'SUPERADMIN') reqRole = 'SUPER_ADMIN';

    let userQuery = `SELECT id, email, mobile, role FROM users WHERE LOWER(email) = LOWER($1)`;
    let queryParams = [email];
    if (reqRole) {
      userQuery += ` AND role = $2`;
      queryParams.push(reqRole);
    }

    const { rows: [user] } = await query(userQuery, queryParams);

    // Return generic success to avoid enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a retrieval email has been sent.' });
    }

    // Send email with mobile number
    try {
      const html = `<p>You requested your registered mobile number for GharKaPaisa.</p><p>Your registered mobile number is: <strong>${user.mobile}</strong></p>`;
      await sendEmail({
        to: user.email,
        subject: 'Retrieve your GharKaPaisa mobile number',
        html,
        text: `Your registered mobile number is: ${user.mobile}`
      });
      logger.info(`[Forgot Mobile] Sent mobile number retrieval to ${user.email}`);
    } catch (emailErr) {
      logger.error(`[Forgot Mobile] Failed to send email to ${user.email}: ${emailErr.message}`);
    }

    return res.json({ success: true, message: 'If an account exists, a retrieval email has been sent.' });
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
           status = CASE WHEN status = 'pending'::user_status THEN 'active'::user_status ELSE status END,
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
    if (!email || email.indexOf('@') < 1 || email.lastIndexOf('.') <= email.indexOf('@')) {
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

    try {
      await sendVerificationEmail(user.email, buildVerificationLink(verificationToken));
      logger.info(`[Verification] Resent verification email to ${user.email}`);
    } catch (emailErr) {
      logger.error(`[Verification] Failed to send verification email: ${emailErr.message}`);
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`[Verification-DEV] Verification Link: ${buildVerificationLink(verificationToken)}`);
        return res.json({
          success: true,
          message: '[DEV ONLY] Verification link logged. If this address has an unverified account, a new verification email has been sent.'
        });
      }
      return error(res, 'Failed to send verification email. Please try again later.', 500);
    }

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
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await query(`UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1`, [tokenHash]);
    }
    clearRefreshTokenCookie(res);
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

    await query(`UPDATE users SET role = $1::user_role WHERE id = $2`, [newRole, userId]);
    logger.info(`Admin ${req.user.id} (${req.user.role}) changed role of User ${userId} to ${newRole}`);
    return success(res, `Role updated to ${newRole}`);
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/update-password-with-otp ───────────────────────────────────────
const updatePasswordWithOtp = async (req, res, next) => {
  try {
    const { otp, newPassword } = req.body;
    if (!otp || !newPassword) return error(res, 'OTP and new password are required', 400);

    const identity = req.user.email; // Default to email, but can fallback to mobile if needed

    // Validate OTP
    const otpHash = crypto.createHmac('sha256', OTP_PEPPER).update(otp).digest('hex');
    
    const { rows: [record] } = await query(`
      SELECT * FROM otp_verifications 
      WHERE (identity = $1 OR identity = $2) AND otp_hash = $3 AND expires_at > NOW()
    `, [req.user.email, req.user.phone, otpHash]);

    if (!record) {
      return error(res, 'Invalid or expired OTP code', 400);
    }
    await query(`DELETE FROM otp_verifications WHERE id = $1`, [record.id]);

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user password and clear must_change_password
    await query(`
      UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2
    `, [passwordHash, req.user.id]);

    return success(res, {}, 'Password updated successfully');
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { fullName, mobile } = req.body;
    if (!fullName) return error(res, 'Full Name is required', 400);

    await query(
      `UPDATE users SET full_name = $1, mobile = $2, updated_at = NOW() WHERE id = $3`,
      [fullName, mobile || null, req.user.id]
    );

    // Fetch updated user
    const { rows: [updatedUser] } = await query(
      `SELECT id, email, mobile, role, status, full_name FROM users WHERE id = $1`,
      [req.user.id]
    );

    return success(res, updatedUser, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return error(res, 'Old password and new password are required', 400);
    }

    const { rows: [user] } = await query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (!user || !user.password_hash) {
      return error(res, 'Password login is not enabled for this account', 400);
    }

    const valid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!valid) {
      return error(res, 'Invalid old password', 400);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, req.user.id]
    );

    return success(res, {}, 'Password updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe,
  lookupUser,
  sendOtp,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  login,
  loginWithMsg91,
  loginPassword,
  register,
  verifyEmail,
  forgotPassword,
  forgotMobile,
  resetPassword,
  resendVerificationEmail,
  logout,
  setRole,
  refresh,
  updatePasswordWithOtp,
  updateProfile,
  changePassword
};
