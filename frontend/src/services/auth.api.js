/**
 * auth.api.js — Email OTP Auth
 * ─────────────────────────────────────────────────────────────────────────
 * All login is via email OTP. No password-based authentication.
 * OTP is sent to the user's registered email via AWS SES.
 */
import api, { setAccessToken, getAccessToken } from './api';

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
export async function getMe() {
  const { data } = await api.get('/auth/me');
  if (data.success && data.user) {
    return data.user;
  }
  throw new Error(data.message || 'Failed to fetch profile');
}
