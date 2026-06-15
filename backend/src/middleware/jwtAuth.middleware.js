const { authenticate, syncUser } = require('./auth.middleware');

/**
 * jwtAuth middleware wrapper
 * ─────────────────────────────────────────────
 * Combines JWT token authentication and PostgreSQL user mapping/syncing.
 */
const jwtAuth = async (req, res, next) => {
  try {
    await authenticate(req, res, async (err) => {
      if (err) return next(err);
      await syncUser(req, res, next);
    });
  } catch (err) {
    next(err);
  }
};

module.exports = jwtAuth;
