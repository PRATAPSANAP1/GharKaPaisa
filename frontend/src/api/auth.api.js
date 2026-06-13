/**
 * auth.api.js — All authentication API calls
 *
 * Base prefix: /api/v1/auth
 *
 * Endpoints used:
 *  POST /auth/otp/send      → Send OTP to mobile
 *  POST /auth/otp/verify    → Verify OTP and get tokens (OTP login)
 *  POST /auth/login         → Password login (identifier + password)
 *  POST /auth/register      → Agent self-registration
 *  POST /auth/logout        → Revoke refresh token
 *  GET  /auth/me            → Get current user profile
 */
import api, { saveSession } from './api';

// ── OTP ───────────────────────────────────────────────────────────────────────

/**
 * Send OTP to a mobile number.
 * @param {string} mobile   - e.g. "+919876543210" or "9876543210"
 * @param {'login'|'register'} purpose
 */
export async function sendOtp(mobile, purpose = 'login') {
  const { data } = await api.post('/auth/otp/send', { mobile, purpose });
  return data; // { success, message, data }
}

/**
 * Verify OTP and login — returns tokens + user profile.
 * Automatically saves session to localStorage.
 * @param {string} mobile
 * @param {string} otp   - 6-digit string
 */
export async function verifyOtpLogin(mobile, otp) {
  const { data } = await api.post('/auth/otp/verify', { mobile, otp });
  if (data.success && data.data?.access_token) {
    saveSession(data.data);
  }
  return data;
}

/**
 * Password-based login.
 * Automatically saves session to localStorage.
 * @param {string} identifier  - mobile or email
 * @param {string} password
 */
export async function loginWithPassword(identifier, password) {
  const { data } = await api.post('/auth/login', { identifier, password });
  if (data.success && data.data?.access_token) {
    saveSession(data.data);
  }
  return data;
}

// ── Register ──────────────────────────────────────────────────────────────────

/**
 * Full agent registration.
 * Maps the 4-step form data into the API body shape.
 */
export async function registerAgent(formData) {
  const body = {
    // Step 0 – Personal
    first_name:    formData.firstName,
    last_name:     formData.lastName,
    mobile:        formData.mobile,
    email:         formData.email,
    password:      formData.password,
    current_address: formData.address || '',

    // Step 1 – Business
    company_name:      formData.shopName    || '',
    company_type:      formData.companyType || 'sole_proprietor',
    gst_number:        formData.gst         || '',
    business_location: formData.businessCity || '',

    // Step 2 – Bank
    bank_name:            formData.bankName          || '',
    account_number:       formData.accountNumber     || '',
    ifsc_code:            formData.ifsc              || '',
    account_holder_name:  formData.accountHolderName || '',
  };

  const { data } = await api.post('/auth/register', body);
  return data; // { success, message, data: { agent_code } }
}

// ── Session ───────────────────────────────────────────────────────────────────

/**
 * Get current user from server (requires valid access token).
 */
export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

/**
 * Logout — revokes refresh token on server.
 */
export async function logout(refreshToken) {
  const { data } = await api.post('/auth/logout', { refresh_token: refreshToken });
  return data;
}
