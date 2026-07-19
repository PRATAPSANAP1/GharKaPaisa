const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('../../config/database');
const { sendEmail } = require('../../services/email/email.service');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 30;

const clientContext = (req) => {
  const userAgent = String(req.get('user-agent') || 'Unknown device');
  const browser = /edg\//i.test(userAgent) ? 'Microsoft Edge' : /firefox/i.test(userAgent) ? 'Firefox' : /chrome|crios/i.test(userAgent) ? 'Chrome' : /safari/i.test(userAgent) ? 'Safari' : 'Unknown browser';
  const device = /android/i.test(userAgent) ? 'Android device' : /iphone/i.test(userAgent) ? 'iPhone' : /ipad/i.test(userAgent) ? 'iPad' : /windows/i.test(userAgent) ? 'Windows computer' : /macintosh/i.test(userAgent) ? 'Mac computer' : 'Unknown device';
  return { deviceId: String(req.get('x-device-id') || crypto.randomUUID()), device, browser, ip: req.ip || req.socket?.remoteAddress || null, city: req.get('x-city') || null, country: req.get('x-country') || null };
};

const audit = async (userId, action, req, metadata = {}) => {
  const ctx = clientContext(req);
  await query(`INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1,$2,$3,$4)`, [userId || null, action, JSON.stringify(metadata), ctx.ip]).catch(() => {});
};

const loginRecord = (userId, req, status, failureReason = null) => {
  const c = clientContext(req);
  return query(`INSERT INTO login_history (user_id,device,browser,ip_address,city,country,status,failure_reason) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [userId || null, c.device, c.browser, c.ip, c.city, c.country, status, failureReason]);
};

const detectSuspiciousLogin = async (userId, req) => {
  const c = clientContext(req);
  const { rows } = await query(`SELECT device, country FROM login_history WHERE user_id=$1 AND status='success' ORDER BY login_time DESC LIMIT 20`, [userId]);
  const knownDevice = rows.some(row => row.device === c.device);
  const knownCountry = !c.country || rows.some(row => row.country === c.country);
  const alerts = [];
  if (rows.length && !knownDevice) alerts.push(['new_device', `New sign-in from ${c.device}.`]);
  if (rows.length && !knownCountry) alerts.push(['new_country', `New sign-in from ${c.country}.`]);
  await Promise.all(alerts.map(([type, message]) => query(`INSERT INTO security_alerts (user_id,type,message,metadata) VALUES ($1,$2,$3,$4)`, [userId, type, message, JSON.stringify({ device: c.device, browser: c.browser, ip: c.ip, country: c.country })])));
  if (alerts.length) {
    const { rows: [user] } = await query(`SELECT email FROM users WHERE id=$1`, [userId]);
    if (user?.email) {
      await sendEmail({ to: user.email, subject: 'New GharKaPaisa sign-in detected', text: `We detected a sign-in from ${c.device} using ${c.browser}${c.country ? ` in ${c.country}` : ''}. If this was not you, change your password immediately.` }).catch(() => {});
    }
  }
  return alerts.length;
};

const assertPasswordPolicy = (password) => {
  if (typeof password !== 'string' || password.length < 8) {
    const err = new Error('Password must be at least 8 characters long.'); err.status = 400; throw err;
  }
  if (password.length > 128) {
    const err = new Error('Password cannot exceed 128 characters.'); err.status = 400; throw err;
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    const err = new Error('Password must include uppercase, lowercase, number, and special character.'); err.status = 400; throw err;
  }
};

const assertNotReused = async (userId, password, currentHash) => {
  const { rows } = await query(`SELECT password_hash FROM password_history WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5`, [userId]);
  const hashes = [currentHash, ...rows.map(r => r.password_hash)].filter(Boolean);
  if (await Promise.all(hashes.map(hash => bcrypt.compare(password, hash))).then(x => x.some(Boolean))) { const err = new Error('You cannot reuse any of your last 5 passwords.'); err.status = 400; throw err; }
};

const savePassword = async (userId, password, currentHash, clearMustChange = false) => {
  assertPasswordPolicy(password); await assertNotReused(userId, password, currentHash);
  if (currentHash) await query(`INSERT INTO password_history (user_id,password_hash) VALUES ($1,$2)`, [userId, currentHash]);
  const passwordHash = await bcrypt.hash(password, 12);
  await query(`UPDATE users SET password_hash=$1, must_change_password=CASE WHEN $2 THEN false ELSE must_change_password END, updated_at=NOW() WHERE id=$3`, [passwordHash, clearMustChange, userId]);
  await query(`DELETE FROM password_history WHERE id IN (SELECT id FROM password_history WHERE user_id=$1 ORDER BY created_at DESC OFFSET 5)`, [userId]);
  return passwordHash;
};

const resetFailures = (userId) => query(`UPDATE users SET failed_login_attempts=0, locked_until=NULL WHERE id=$1`, [userId]);
const recordFailedLogin = async (user, req, reason) => {
  await loginRecord(user?.id, req, 'failed', reason);
  if (!user) return;
  const { rows: [updated] } = await query(`UPDATE users SET failed_login_attempts=failed_login_attempts+1, locked_until=CASE WHEN failed_login_attempts+1 >= $1 THEN NOW()+INTERVAL '${LOCK_MINUTES} minutes' ELSE locked_until END WHERE id=$2 RETURNING failed_login_attempts,locked_until`, [MAX_FAILED_ATTEMPTS, user.id]);
  if (updated?.locked_until) await query(`INSERT INTO security_alerts (user_id,type,message) VALUES ($1,'account_locked',$2)`, [user.id, `Account locked for ${LOCK_MINUTES} minutes after repeated failed sign-in attempts.`]);
};

module.exports = { clientContext, audit, loginRecord, detectSuspiciousLogin, assertPasswordPolicy, savePassword, resetFailures, recordFailedLogin };
