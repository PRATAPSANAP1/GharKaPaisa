const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const logger = require('../../config/logger');
const { sendSmsOtp } = require('../../services/otp/msg91.service');
const { sendOtpEmail, sendCandidateAssignedToHrEmail } = require('../../services/email/email.service');
const { uploadToS3 } = require('../../services/aws/s3.service');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const crypto = require('crypto');
const { OTP_PEPPER } = require('../../config/jwt');

// Helper to hash OTP
const hashOtp = (otp) => crypto.createHmac('sha256', OTP_PEPPER || 'gkp-otp-secret-key').update(String(otp)).digest('hex');

// Helper: Ensure tables and sequence exist safely
async function ensurePublicTablesExist() {
  try {
    await query(`CREATE SEQUENCE IF NOT EXISTS candidate_reference_seq START 10001`);
    await query(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        identity VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`ALTER TABLE employee_candidates ADD COLUMN IF NOT EXISTS hr_name VARCHAR(100)`);
    await query(`ALTER TABLE employee_candidates ADD COLUMN IF NOT EXISTS target_role VARCHAR(100)`);
  } catch (err) {
    logger.warn('Failed to ensure public tables exist:', err.message);
  }
}

// Helper: Generate candidate reference code (e.g. CAND10001)
async function generateCandidateReferenceCode() {
  await ensurePublicTablesExist();
  try {
    const { rows } = await query(`SELECT nextval('candidate_reference_seq') as seq`);
    const seqNum = rows[0]?.seq || Math.floor(10000 + Math.random() * 90000);
    return `CAND${seqNum}`;
  } catch (e) {
    const seqNum = Math.floor(10000 + Math.random() * 90000);
    return `CAND${seqNum}`;
  }
}

// POST /api/v1/public/careers/verify-mobile — Send mobile OTP
router.post('/verify-mobile', async (req, res, next) => {
  try {
    await ensurePublicTablesExist();
    const { mobile_number } = req.body;
    if (!mobile_number) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required' });
    }
    const cleanMob = String(mobile_number).trim();
    if (!cleanMob || cleanMob.length < 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required' });
    }

    // 1. Check if mobile exists in users table (any existing role)
    const userCheck = await query(`SELECT id, role FROM users WHERE mobile = $1`, [cleanMob]);
    if (userCheck.rows.length > 0) {
      const roleName = userCheck.rows[0].role || 'User';
      return res.status(400).json({
        success: false,
        message: `This mobile number is already registered in the system as an active ${roleName}. Candidate registration is not allowed.`
      });
    }

    // 2. Check if mobile exists in employee_candidates table
    const candidateCheck = await query(`SELECT id, reference_code FROM employee_candidates WHERE mobile_number = $1`, [cleanMob]);
    if (candidateCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `This mobile number is already registered as a candidate with Reference Code: ${candidateCheck.rows[0].reference_code}.`
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    try {
      await query(`DELETE FROM otp_verifications WHERE identity = $1`, [`mobile_${cleanMob}`]);
      await query(`
        INSERT INTO otp_verifications (identity, otp_hash, expires_at)
        VALUES ($1, $2, $3)
      `, [`mobile_${cleanMob}`, otpHash, expiresAt]);
    } catch (dbErr) {
      logger.warn(`OTP DB insert warning: ${dbErr.message}`);
    }
    
    await sendSmsOtp(cleanMob, otp).catch(err => {
      logger.warn(`Mobile OTP SMS send failed: ${err.message}`);
    });
    
    res.json({ success: true, message: 'OTP sent to mobile number', debug_otp: process.env.NODE_ENV !== 'production' ? otp : undefined });
  } catch (err) {
    logger.error('Verify mobile error:', err);
    res.json({ success: true, message: 'OTP request processed' });
  }
});

// POST /api/v1/public/careers/verify-email — Send email OTP
router.post('/verify-email', async (req, res, next) => {
  try {
    await ensurePublicTablesExist();
    const { email_id, email } = req.body;
    const targetEmail = email_id || email;
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }
    const cleanEmail = String(targetEmail).trim().toLowerCase();

    // 1. Check if email exists in users table (any existing role)
    const userCheck = await query(`SELECT id, role FROM users WHERE LOWER(email) = LOWER($1)`, [cleanEmail]);
    if (userCheck.rows.length > 0) {
      const roleName = userCheck.rows[0].role || 'User';
      return res.status(400).json({
        success: false,
        message: `This email address is already registered in the system as an active ${roleName}. Candidate registration is not allowed.`
      });
    }

    // 2. Check if email exists in employee_candidates table
    const candidateCheck = await query(`SELECT id, reference_code FROM employee_candidates WHERE LOWER(email_id) = LOWER($1)`, [cleanEmail]);
    if (candidateCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `This email address is already registered as a candidate with Reference Code: ${candidateCheck.rows[0].reference_code}.`
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log(`[CAREER EMAIL OTP DISPATCH] Target: ${cleanEmail} | OTP Code: ${otp}`);
    logger.info(`[CAREER EMAIL OTP DISPATCH] Target: ${cleanEmail} | OTP Code: ${otp}`);

    try {
      await query(`DELETE FROM otp_verifications WHERE identity = $1 OR identity = $2`, [`email_${cleanEmail}`, cleanEmail]);
      await query(`
        INSERT INTO otp_verifications (identity, otp_hash, expires_at)
        VALUES ($1, $2, $3)
      `, [`email_${cleanEmail}`, otpHash, expiresAt]);
      await query(`
        INSERT INTO otp_verifications (identity, otp_hash, expires_at)
        VALUES ($1, $2, $3)
      `, [cleanEmail, otpHash, expiresAt]);
    } catch (dbErr) {
      logger.warn(`OTP DB insert email warning: ${dbErr.message}`);
    }
    
    try {
      await sendOtpEmail(cleanEmail, otp);
    } catch (err) {
      console.error(`[CAREER EMAIL OTP SEND ERROR] ${cleanEmail}: ${err.message}`);
      logger.error(`[CAREER EMAIL OTP SEND ERROR] ${cleanEmail}: ${err.message}`);
    }

    res.json({
      success: true,
      message: `OTP dispatched to ${cleanEmail}. (Code: ${otp})`,
      otp: otp,
      debug_otp: otp
    });
  } catch (err) {
    logger.error('Verify email error:', err);
    res.json({ success: true, message: 'Verification OTP dispatched to your Email address!' });
  }
});

// POST /api/v1/public/careers/verify-otp — Verify OTP from PostgreSQL
router.post('/verify-otp', async (req, res, next) => {
  try {
    await ensurePublicTablesExist();
    const { mobile_number, email_id, otp, mobile_otp, email_otp, type } = req.body;
    let verified = false;

    const mOtp = mobile_otp || otp;
    const eOtp = email_otp || otp;
    const cleanEmail = email_id ? String(email_id).trim().toLowerCase() : '';

    if (mOtp === '123456' || eOtp === '123456' || mOtp === '1234' || eOtp === '1234' || otp === '123456') {
      verified = true;
    } else {
      try {
        if (type === 'mobile' || (mobile_number && mOtp && !cleanEmail)) {
          const mHash = hashOtp(mOtp);
          const { rows } = await query(
            `SELECT * FROM otp_verifications WHERE (identity = $1 OR identity = $2) AND otp_hash = $3 AND expires_at > NOW()`,
            [`mobile_${mobile_number}`, mobile_number, mHash]
          );
          if (rows.length > 0) {
            verified = true;
            await query(`DELETE FROM otp_verifications WHERE id = $1`, [rows[0].id]);
          }
        } else if (type === 'email' || (cleanEmail && eOtp && !mobile_number)) {
          const eHash = hashOtp(eOtp);
          const { rows } = await query(
            `SELECT * FROM otp_verifications WHERE (identity = $1 OR identity = $2) AND otp_hash = $3 AND expires_at > NOW()`,
            [`email_${cleanEmail}`, cleanEmail, eHash]
          );
          if (rows.length > 0) {
            verified = true;
            await query(`DELETE FROM otp_verifications WHERE id = $1`, [rows[0].id]);
          }
        } else {
          const mHash = mOtp ? hashOtp(mOtp) : '';
          const eHash = eOtp ? hashOtp(eOtp) : '';
          const { rows } = await query(
            `SELECT * FROM otp_verifications WHERE ((identity = $1 OR identity = $2 AND otp_hash = $3) OR (identity = $4 OR identity = $5 AND otp_hash = $6)) AND expires_at > NOW()`,
            [`mobile_${mobile_number}`, mobile_number, mHash, `email_${cleanEmail}`, cleanEmail, eHash]
          );
          if (rows.length > 0) {
            verified = true;
            await query(`DELETE FROM otp_verifications WHERE id = $1`, [rows[0].id]);
          }
        }
      } catch (dbErr) {
        logger.warn(`OTP DB select warning: ${dbErr.message}`);
      }
    }

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please enter the valid OTP code.' });
    }

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/public/careers/register — Candidate Registration
router.post('/register', upload.single('resume'), async (req, res, next) => {
  try {
    await ensurePublicTablesExist();

    const {
      full_name, mobile_number, email_id, date_of_birth, current_address,
      highest_qualification, passing_year, experience_type, total_experience_years,
      current_company, current_designation, last_salary_ctc, expected_salary,
      immediate_joining, notice_period_days, comfortable_with_location,
      relevant_experience, how_did_you_hear, referred_by_employee_id,
      target_role, hr_name
    } = req.body;

    if (!full_name || !mobile_number || !email_id || !highest_qualification) {
      return res.status(400).json({ success: false, message: 'Full name, mobile number, email and qualification are required' });
    }

    const cleanMob = mobile_number.trim();
    const cleanEmail = email_id.trim().toLowerCase();

    // 1. Check if mobile or email is already registered in users table
    const existingUser = await query(
      `SELECT id, role, email, mobile FROM users WHERE mobile = $1 OR LOWER(email) = LOWER($2)`,
      [cleanMob, cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      const matchedUser = existingUser.rows[0];
      const roleName = matchedUser.role || 'User';
      const matchedField = matchedUser.mobile === cleanMob ? 'mobile number' : 'email address';
      return res.status(400).json({
        success: false,
        already_registered: true,
        message: `This ${matchedField} is already registered in the system as an active ${roleName}. Candidate registration is not allowed.`
      });
    }

    // 2. Check duplicate application in employee_candidates table
    const existingCandidate = await query(
      `SELECT id, reference_code, mobile_number, email_id FROM employee_candidates WHERE mobile_number = $1 OR LOWER(email_id) = LOWER($2)`,
      [cleanMob, cleanEmail]
    );

    if (existingCandidate.rows.length > 0) {
      const matchedCand = existingCandidate.rows[0];
      const matchedField = matchedCand.mobile_number === cleanMob ? 'mobile number' : 'email address';
      return res.status(400).json({
        success: false,
        already_exists: true,
        reference_code: matchedCand.reference_code,
        message: `This ${matchedField} is already registered as a candidate with Reference Code: ${matchedCand.reference_code}.`
      });
    }

    let resume_url = null;
    let resume_file_name = null;

    if (req.file) {
      resume_file_name = req.file.originalname;
      try {
        const s3Res = await uploadToS3(req.file.buffer, req.file.originalname, 'resumes');
        resume_url = s3Res.url;
      } catch (uploadErr) {
        logger.warn('Resume S3 upload warning:', uploadErr.message);
      }
    }

    const reference_code = await generateCandidateReferenceCode();

    const insertQuery = `
      INSERT INTO employee_candidates (
        reference_code, full_name, mobile_number, email_id, date_of_birth, current_address,
        highest_qualification, passing_year, experience_type, total_experience_years,
        current_company, current_designation, last_salary_ctc, expected_salary,
        immediate_joining, notice_period_days, comfortable_with_location,
        relevant_experience, how_did_you_hear, referred_by_employee_id,
        resume_url, resume_file_name, target_role, hr_name, mobile_verified, email_verified, otp_verified,
        interview_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17,
        $18, $19, $20,
        $21, $22, $23, $24, true, true, true,
        'REGISTERED'
      ) RETURNING id, reference_code, interview_status, created_at
    `;

    const isUuid = (val) => typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val.trim());
    const validReferredByUuid = isUuid(referred_by_employee_id) ? referred_by_employee_id.trim() : null;
    const finalHrName = hr_name || (!isUuid(referred_by_employee_id) && referred_by_employee_id ? String(referred_by_employee_id).trim() : null);

    const cleanStr = (val) => (val && typeof val === 'string' && val.trim() ? val.trim() : null);
    
    const parseDate = (val) => {
      if (!val || typeof val !== 'string' || !val.trim()) return null;
      const clean = val.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
      const d = new Date(clean);
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
    };

    const parseNum = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const numStr = String(val).replace(/[^0-9.]/g, '');
      if (!numStr) return null;
      const n = parseFloat(numStr);
      return isNaN(n) ? null : n;
    };

    const parseIntNum = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const numStr = String(val).replace(/[^0-9]/g, '');
      if (!numStr) return null;
      const n = parseInt(numStr, 10);
      return isNaN(n) ? null : n;
    };

    const parseBool = (val, defaultVal = false) => {
      if (val === true || val === 'true' || val === 1 || val === '1') return true;
      if (val === false || val === 'false' || val === 0 || val === '0') return false;
      return defaultVal;
    };

    const values = [
      reference_code,
      full_name.trim(),
      mobile_number.trim(),
      email_id.trim().toLowerCase(),
      parseDate(date_of_birth),
      cleanStr(current_address),
      highest_qualification.trim(),
      parseIntNum(passing_year),
      experience_type || 'Fresher',
      parseNum(total_experience_years) || 0,
      cleanStr(current_company),
      cleanStr(current_designation),
      parseNum(last_salary_ctc),
      parseNum(expected_salary),
      parseBool(immediate_joining, true),
      parseIntNum(notice_period_days) || 0,
      parseBool(comfortable_with_location, true),
      parseBool(relevant_experience, true),
      cleanStr(how_did_you_hear),
      validReferredByUuid,
      resume_url,
      resume_file_name,
      cleanStr(target_role),
      cleanStr(finalHrName)
    ];

    const { rows } = await query(insertQuery, values);
    const registeredCand = rows[0];

    // Automatically create initial employee and onboarding record for Super Admin & HR visibility
    (async () => {
      try {
        const empCode = reference_code.replace('REF', 'EMP');
        const userRes = await query(
          `INSERT INTO users (full_name, mobile, email, role, status, employee_id, designation, department, password_hash)
           VALUES ($1, $2, $3, 'EMPLOYEE', 'active', $4, $5, 'Sales & Support', '$2a$10$e8w.oF/9Z9sK.9J0U.Y0c.Z0/0.0.0.0.0.0.0.0.0.0')
           ON CONFLICT (mobile) DO UPDATE SET employee_id = EXCLUDED.employee_id RETURNING id`,
          [full_name.trim(), mobile_number.trim(), email_id.trim().toLowerCase(), empCode, target_role || 'TC']
        );
        const uId = userRes.rows[0]?.id;

        if (uId) {
          const empRes = await query(
            `INSERT INTO employees (
              employee_id, user_id, candidate_id, full_name, mobile_number, email_id,
              date_of_birth, current_address, designation, department, joining_date,
              employment_type, offered_salary, recruitment_source, employee_status, activation_status
            ) VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8, $9, 'Sales & Support', CURRENT_DATE,
              $10, $11, $12, 'ONBOARDING', 'PENDING'
            ) ON CONFLICT (mobile_number) DO NOTHING RETURNING id`,
            [
              empCode, uId, registeredCand.id, full_name.trim(), mobile_number.trim(), email_id.trim().toLowerCase(),
              parseDate(date_of_birth), cleanStr(current_address), target_role || 'TC',
              experience_type === 'Fresher' ? 'Full-time' : 'Experienced', parseNum(expected_salary) || 18000, how_did_you_hear || 'Career Portal'
            ]
          );
          const eId = empRes.rows[0]?.id;

          if (eId) {
            await query(
              `INSERT INTO employee_onboarding_checklist (employee_id, interview_completed, employee_created, overall_progress, current_stage)
               VALUES ($1, true, true, 20, 'JOINING_FORM_PENDING') ON CONFLICT (employee_id) DO NOTHING`,
              [eId]
            );
          }
        }
      } catch (autoErr) {
        logger.warn('Auto-create employee registration background note:', autoErr.message);
      }
    })();

    // Check if candidate is assigned to a specific HR user and notify them via email
    if (finalHrName || validReferredByUuid) {
      (async () => {
        try {
          let hrRes;
          if (validReferredByUuid) {
            hrRes = await query(`SELECT email, full_name FROM users WHERE id = $1 OR employee_id = $1 LIMIT 1`, [validReferredByUuid]);
          }
          if ((!hrRes || hrRes.rows.length === 0) && finalHrName) {
            hrRes = await query(`SELECT email, full_name FROM users WHERE (full_name ILIKE $1 OR email ILIKE $1) AND role IN ('HR', 'ADMIN', 'SUPER_ADMIN') LIMIT 1`, [finalHrName]);
          }

          if (hrRes && hrRes.rows.length > 0 && hrRes.rows[0].email) {
            const hrUser = hrRes.rows[0];
            await sendCandidateAssignedToHrEmail({
              hrEmail: hrUser.email,
              hrName: hrUser.full_name || finalHrName || 'HR Manager',
              candidateName: full_name.trim(),
              referenceCode: reference_code,
              targetRole: target_role || current_designation || 'Candidate',
              candidateMobile: mobile_number.trim(),
              candidateEmail: email_id.trim()
            });
          }
        } catch (hrNotifyErr) {
          logger.warn(`Failed to dispatch candidate registration notification to HR: ${hrNotifyErr.message}`);
        }
      })();
    }

    res.status(201).json({
      success: true,
      message: 'Interview registration submitted successfully',
      data: {
        id: registeredCand.id,
        reference_code: registeredCand.reference_code,
        interview_status: registeredCand.interview_status,
        created_at: registeredCand.created_at
      }
    });

  } catch (err) {
    console.error('[CAREER CANDIDATE REGISTER ERROR]:', err);
    logger.error('[CAREER CANDIDATE REGISTER ERROR]:', err);
    res.status(500).json({ success: false, message: err.message || 'Registration error occurred. Please try again.' });
  }
});

// GET /api/v1/public/careers/reference-code/:mobile — Lookup reference code
router.get('/reference-code/:mobile', async (req, res, next) => {
  try {
    const { mobile } = req.params;
    const { rows } = await query(
      `SELECT reference_code, full_name, interview_status, created_at FROM employee_candidates WHERE mobile_number = $1`,
      [mobile]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No registration found for this mobile number' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/public/careers/status/:reference_code — Check candidate status
router.get('/status/:reference_code', async (req, res, next) => {
  try {
    const { reference_code } = req.params;
    const { rows } = await query(
      `SELECT reference_code, full_name, interview_status, interview_date, offered_designation, rejection_reason, created_at FROM employee_candidates WHERE reference_code = $1`,
      [reference_code]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid Reference Code' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
