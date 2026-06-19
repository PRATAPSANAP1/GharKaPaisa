/**
 * auth.api.js — Email OTP Auth
 * ─────────────────────────────────────────────────────────────────────────
 * All login is via email OTP. No password-based authentication.
 * OTP is sent to the user's registered email via AWS SES.
 */
import api, { saveSession, clearSession, setAccessToken } from './api';

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

// ── OTP — SEND (via email) ─────────────────────────────────────────────
// Sends OTP to the user's registered email address.
// Accepts identity = email or mobile number.
export async function sendOtp(identity) {
  try {
    const res = await api.post('/auth/send-otp', { identity });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to send OTP. Please try again.');
  }
}

export async function sendRegisterOtp(mobile) {
  try {
    const res = await api.post('/auth/send-register-otp', { mobile });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to send verification OTP.');
  }
}

// ── OTP — VERIFY ─────────────────────────────────────────────────────
export async function verifyOtpLogin(identity, otp) {
  try {
    const res = await api.post('/auth/verify-otp', { identity, otp });
    return { success: true, idToken: res.data.token };
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Invalid OTP code.');
  }
}

// ── OTP LOGIN (the only login method) ───────────────────────────────────
export async function loginWithOtp(identity, otp) {
  try {
    const res = await api.post('/auth/login', { identity, otp });
    if (res.data && res.data.token) {
      setAccessToken(res.data.token);
      if (res.data.refreshToken) {
        localStorage.setItem('gkp_refresh_token', res.data.refreshToken);
      }
    }
    return { success: true, idToken: res.data.token, refreshToken: res.data.refreshToken };
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

// ── VERIFY EMAIL ────────────────────────────────────────────────────────
export async function verifyEmail(token) {
  try {
    const res = await api.post('/auth/verify-email', { token });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Email verification failed.');
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
