/**
 * auth.api.js — Custom JWT Auth
 * ─────────────────────────────────────────────────────────────────────────
 * ✔ Backend handles: Profile storage (PostgreSQL), session management
 * ✔ Replaced Firebase with custom JWT authentication.
 */
import api, { saveSession, clearSession } from './api';

// ── Profile cache ──────────────────────────────────────────────────────────
let cachedUser    = null;
let lastFetched   = 0;
const CACHE_MS    = 5 * 60 * 1000;

// ── Sync session with backend profile ─────────────────────────────
export const syncSession = async () => {
  try {
    const { data } = await api.get('/auth/me');
    if (data.success && data.user) {
      const p = data.user;
      const currentToken = sessionStorage.getItem('gkp_access_token');
      saveSession({
        access_token: currentToken,
        user: {
          id:           p.id,
          email:        p.email        || '',
          mobile:       p.mobile       || '',
          role:         p.role         || 'Partner',
          status:       p.status       || 'pending',
          first_name:   p.first_name   || '',
          last_name:    p.last_name    || '',
          Partner_code: p.Partner_code || '',
          Partner_id:   p.Partner_id   || '',
          kyc_status:   p.kyc_status   || 'pending',
        },
      });
    }
  } catch (err) {
    if (err?.response?.status !== 401) {
      console.warn('Backend /auth/me error:', err?.response?.status);
    } else {
      clearSession();
    }
  }
};

// ── OTP — SEND ───────────────────────────────────────────────────────
export async function sendOtp(mobile) {
  try {
    const res = await api.post('/auth/send-otp', { mobile });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to send OTP. Please try again.');
  }
}

export const sendRegisterOtp = (mobile) => sendOtp(mobile);

// ── OTP — VERIFY & LOGIN ─────────────────────────────────────────────
export async function verifyOtpLogin(mobile, otp) {
  try {
    const res = await api.post('/auth/verify-otp', { mobile, otp });
    return { success: true, idToken: res.data.token };
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Invalid OTP code.');
  }
}

// ── EMAIL / PASSWORD LOGIN ───────────────────────────────────────────────
export async function loginWithPassword(email, password) {
  try {
    const res = await api.post('/auth/login', { identity: email, password });
    return { success: true, idToken: res.data.token };
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Invalid credentials.');
  }
}

// ── OTP-ONLY LOGIN ───────────────────────────────────────────────────────
export async function loginWithOtp(identity, otp) {
  try {
    const res = await api.post('/auth/login', { identity, otp });
    return { success: true, idToken: res.data.token };
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Invalid OTP or credentials.');
  }
}

// ── REGISTER PARTNER ────────────────────────────────────────────────────────
export async function registerPartner(formData) {
  try {
    const res = await api.post('/auth/register', formData);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Registration failed.');
  }
}

// ── LOOKUP USER ────────────────────────────────────────────────────────
export async function lookupUser(identity) {
  try {
    const res = await api.post('/auth/lookup', { identity });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'User lookup failed.');
  }
}

// ── GET ME ──────────────────────────────────────────────────────────────────
export async function getMe(force = false) {
  if (!force && cachedUser && Date.now() - lastFetched < CACHE_MS) {
    return cachedUser;
  }
  const { data } = await api.get('/auth/me');
  if (data.success && data.user) {
    cachedUser = data.user;
    lastFetched = Date.now();
    return cachedUser;
  }
  throw new Error(data.message || 'Failed to fetch profile');
}

export function clearProfileCache() {
  cachedUser = null;
  lastFetched = 0;
}
