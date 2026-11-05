-- ============================================================================
-- SQL Script: Update Super Admin Password to Gharkapaisa@8087
-- Password Plaintext: Gharkapaisa@8087
-- Bcrypt Hash (Salt Rounds 10): $2b$10$b6d.SY1iAhCptWGtKoaUceybGxYqd9PDxZBQSLIEdV0qz4t7qpKf.
-- ============================================================================

BEGIN;

UPDATE users
SET password_hash = '$2b$10$b6d.SY1iAhCptWGtKoaUceybGxYqd9PDxZBQSLIEdV0qz4t7qpKf.',
    failed_login_attempts = 0,
    locked_until = NULL,
    must_change_password = FALSE,
    updated_at = NOW()
WHERE role = 'SUPER_ADMIN';

-- Revoke active refresh token sessions to require fresh authentication
UPDATE refresh_tokens
SET revoked = TRUE,
    revoked_at = NOW()
WHERE user_id IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN')
  AND revoked = FALSE;

COMMIT;

