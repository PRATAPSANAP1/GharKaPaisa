const admin = require('../config/firebase');
const { query } = require('../config/db');
const logger = require('../utils/logger');

/**
 * firebaseAuth middleware
 * ─────────────────────────────────────────────
 * 1. Reads Bearer token from Authorization header
 * 2. Verifies it with Firebase Admin SDK
 * 3. Finds OR auto-creates user row in PostgreSQL
 * 4. Attaches req.user and req.firebaseUser
 */
const firebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify Firebase ID Token
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch (firebaseErr) {
      logger.warn('Firebase token verification failed:', firebaseErr.code);
      if (firebaseErr.code === 'auth/id-token-expired') {
        return res.status(401).json({ success: false, message: 'Token expired. Please sign in again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid Firebase token' });
    }

    const firebaseUid = decoded.uid;
    const email      = decoded.email       || null;
    const phone      = decoded.phone_number || null;

    // Find user by firebase_uid, email, or mobile
    let { rows: [user] } = await query(
      `SELECT * FROM users WHERE firebase_uid = $1 OR email = $2 OR mobile = $3`,
      [firebaseUid, email, phone]
    );

    // Auto-provision: create user on first login
    if (!user) {
      logger.info(`Auto-provisioning new user for Firebase UID: ${firebaseUid}`);
      const result = await query(
        `INSERT INTO users (firebase_uid, email, mobile, role, status)
         VALUES ($1, $2, $3, 'Partner', 'pending')
         RETURNING *`,
        [firebaseUid, email, phone]
      );
      user = result.rows[0];
    } else if (!user.firebase_uid) {
      // Existing user without firebase_uid — link them
      await query(
        `UPDATE users SET firebase_uid = $1 WHERE id = $2`,
        [firebaseUid, user.id]
      );
      user.firebase_uid = firebaseUid;
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ success: false, message: 'Account rejected. Contact support.' });
    }

    req.user = user;
    req.firebaseUser = decoded;

    // Attach partner profile if Partner role
    if (user.role === 'Partner') {
      const { rows: [partner] } = await query(
        `SELECT id, kyc_status, first_name, last_name, Partner_code FROM Partner_profiles WHERE user_id = $1`,
        [user.id]
      );
      req.partner = partner || null;
    }

    next();
  } catch (err) {
    logger.error('firebaseAuth middleware error:', err.message);
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

module.exports = firebaseAuth;
