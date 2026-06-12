const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/db');

const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// Store refresh token hash in DB
const storeRefreshToken = async (userId, token) => {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, hash, expiresAt]
  );
};

// Validate stored refresh token
const validateRefreshToken = async (userId, token) => {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const { rows } = await query(
    `SELECT id FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2 AND revoked = false AND expires_at > NOW()`,
    [userId, hash]
  );
  return rows.length > 0;
};

// Revoke refresh token
const revokeRefreshToken = async (userId, token) => {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  await query(
    `UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND token_hash = $2`,
    [userId, hash]
  );
};

// Revoke ALL tokens for user (on logout all devices)
const revokeAllUserTokens = async (userId) => {
  await query(`UPDATE refresh_tokens SET revoked = true WHERE user_id = $1`, [userId]);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};
