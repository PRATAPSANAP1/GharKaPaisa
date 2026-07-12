/**
 * auth.api.js — Email OTP Auth
 * ─────────────────────────────────────────────────────────────────────────
 * All login is via email OTP. No password-based authentication.
 * OTP is sent to the user's registered email via AWS SES.
 */
import api, { saveSession, clearSession, setAccessToken, getAccessToken } from './api';

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
      const currentToken = getAccessToken();
      saveSession({
        access_token: currentToken,
        user: {
          id:           p.id,
          email:        p.email        || '',
          mobile:       p.mobile       || '',
          role:         p.role         || 'PARTNER',
          status:       p.status       || 'pending',
          first_name:   p.first_name   || '',
          last_name:    p.last_name    || '',
          Partner_code: p.partner_code || p.Partner_code || '',
          Partner_id:   p.partner_id   || p.Partner_id   || '',
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
export async function sendOtp(identity, role) {
  try {
    const res = await api.post('/auth/send-otp', { identity, role });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to send OTP. Please try again.');
  }
}


// ── OTP — VERIFY ─────────────────────────────────────────────────────
export async function verifyOtpLogin(identity, otp) {
  try {
    const res = await api.post('/auth/verify-otp', { identity, otp });
    if (res.data?.token) {
      setAccessToken(res.data.token);
    }
    return { success: true, idToken: res.data.token, refreshToken: res.data.refreshToken };
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Invalid OTP code.');
  }
}

// ── OTP LOGIN (the only login method) ───────────────────────────────────
export async function loginWithOtp(identity, otp, role) {
  try {
    const res = await api.post('/auth/login', { identity, otp, role });
    if (res.data && res.data.token) {
      setAccessToken(res.data.token);
    }
    return { success: true, idToken: res.data.token, refreshToken: res.data.refreshToken, redirect: res.data.redirect };
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Invalid OTP or credentials.');
  }
}

// ── MSG91 Mobile Login ──────────────────────────────────────────────────
export async function loginWithMsg91(mobile, accessToken, role) {
  try {
    const res = await api.post('/auth/login-msg91', { mobile, accessToken, role });
    if (res.data && res.data.token) {
      setAccessToken(res.data.token);
    }
    return { success: true, idToken: res.data.token, refreshToken: res.data.refreshToken, redirect: res.data.redirect };
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Invalid SMS verification token.');
  }
}

// ── Password Login ───────────────────────────────────────────────────────
export async function loginWithPassword(identity, password, role) {
  try {
    const res = await api.post('/auth/login-password', { identity, password, role });
    if (res.data && res.data.token) {
      setAccessToken(res.data.token);
    }
    return { success: true, idToken: res.data.token, refreshToken: res.data.refreshToken, redirect: res.data.redirect };
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Invalid credentials.');
  }
}

// ── Forgot / Reset Password ─────────────────────────────────────────────
export async function forgotPassword(email) {
  try {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to request password reset.');
  }
}

export async function forgotMobile(email, role) {
  try {
    const res = await api.post('/auth/forgot-mobile', { email, role });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to request mobile retrieve.');
  }
}

export async function resetPassword(token, password) {
  try {
    const res = await api.post('/auth/reset-password', { token, password });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to reset password.');
  }
}

// ── REGISTER PARTNER ────────────────────────────────────────────────────────
export async function registerPartner(formData) {
  try {
    const res = await api.post('/auth/register', formData);
    return res.data;
  } catch (err) {
    const errorObj = new Error(err.response?.data?.message || 'Registration failed.');
    errorObj.response = err.response; // Attach response for validation error access
    throw errorObj;
  }
}

// ── LOOKUP USER ────────────────────────────────────────────────────────
export async function lookupUser(identity, role) {
  try {
    const res = await api.post('/auth/lookup', { identity, role });
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

// ── Registration OTP (pre-verify email) ───────────────────────────────────
export async function sendRegistrationOtp(email) {
  try {
    const res = await api.post('/auth/send-registration-otp', { email });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to send registration OTP.');
  }
}

export async function verifyRegistrationOtp(email, otp) {
  try {
    const res = await api.post('/auth/verify-registration-otp', { email, otp });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Failed to verify registration OTP.');
  }
}

export async function resendVerificationEmail(email) {
  try {
    const res = await api.post('/auth/resend-verification', { email });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Could not resend the verification email.');
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
