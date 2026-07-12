const crypto = require('crypto');
const logger = require('../../config/logger');

const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY || (process.env.NODE_ENV === 'production' ? null : 'gharkapaisa-encryption-key-fallback');
if (!ENCRYPTION_KEY_RAW) {
  logger.error('FATAL ERROR: ENCRYPTION_KEY environment variable is not defined in production.');
  process.exit(1);
}
const ENCRYPTION_KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY_RAW).digest();

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

const decrypt = (text) => {
  if (!text) return null;
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return text; // If not in iv:encrypted format, return as-is
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return text; // Return as-is if decryption fails
  }
};

module.exports = { encrypt, decrypt };
