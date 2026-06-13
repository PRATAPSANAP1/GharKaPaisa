const { authenticate, syncUser } = require('./auth.middleware');

/**
 * firebaseAuth middleware wrapper
 * ─────────────────────────────────────────────
 * Combines Firebase token authentication and PostgreSQL user mapping/syncing.
 */
const firebaseAuth = async (req, res, next) => {
  try {
    await authenticate(req, res, async (err) => {
      if (err) return next(err);
      await syncUser(req, res, next);
    });
  } catch (err) {
    next(err);
  }
};

module.exports = firebaseAuth;
