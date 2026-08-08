const crypto = require('crypto');

const SECRET_KEY = process.env.INVITE_SECRET_KEY || 'GharKaPaisa_Secure_Invite_Secret_2026';
const ALGORITHM = 'aes-256-cbc';
const KEY = crypto.createHash('sha256').update(SECRET_KEY).digest();

/**
 * Encrypt partnerCode and role into a unique, tamper-proof URL token.
 * Example output: "inv_YTY4NDllYjFkZGY2M2Q1MDphYjE0YWY1..."
 */
function generateInviteToken(payload) {
  try {
    const partnerCode = typeof payload === 'string' ? payload : (payload.partnerCode || payload.ref);
    const role = typeof payload === 'object' ? (payload.role || 'TEAM_MEMBER') : 'TEAM_MEMBER';
    
    const iv = crypto.randomBytes(16);
    const dataStr = JSON.stringify({
      ref: partnerCode,
      role: role,
      ts: Date.now()
    });
    
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(dataStr, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tokenBuffer = Buffer.from(`${iv.toString('hex')}:${encrypted}`);
    const token = tokenBuffer.toString('base64url');
    return `inv_${token}`;
  } catch (err) {
    console.error('[generateInviteToken] Error:', err.message);
    return payload.partnerCode || payload.ref || payload;
  }
}

/**
 * Decrypt secure invitation token back to { ref, role, ts }.
 */
function decodeInviteToken(tokenStr) {
  if (!tokenStr) return null;
  try {
    const rawToken = tokenStr.startsWith('inv_') ? tokenStr.slice(4) : tokenStr;
    const decodedStr = Buffer.from(rawToken, 'base64url').toString('utf8');
    const [ivHex, encryptedHex] = decodedStr.split(':');
    if (!ivHex || !encryptedHex) return null;

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateInviteToken,
  decodeInviteToken
};
