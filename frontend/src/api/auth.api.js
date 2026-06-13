/**
 * auth.api.js — All authentication API calls
 *
 * Base prefix: /api/v1/auth
 *
 * Endpoints used:
 *  POST /auth/otp/send      → Send OTP to mobile
 *  POST /auth/otp/verify    → Verify OTP and get tokens (OTP login)
 *  POST /auth/login         → Password login (identifier + password)
 *  POST /auth/register      → Partner self-registration
 *  POST /auth/logout        → Revoke refresh token
 *  GET  /auth/me            → Get current user profile
 */
import api, { clearSession } from './api';

// ── DEV OTP Bypass ─────────────────────────────────────────────────────────────
// Guard with NODE_ENV/DEV check so it gets tree-shaken in production builds
const DEV_BYPASS = import.meta.env.DEV && import.meta.env.VITE_DEV_OTP_BYPASS === 'true';
const DEV_CODE = import.meta.env.DEV ? (import.meta.env.VITE_DEV_OTP_CODE || '111111') : '';

export { DEV_BYPASS, DEV_CODE };

// Cache settings for getMe profile fetch
const USER_CACHE_MS = 5 * 60 * 1000; // 5 minutes
let lastFetched = 0;
let cachedUser = null;

// Error normalization helper
function normalizeError(err, defaultMsg = 'An error occurred') {
  const message = err.response?.data?.message || err.message || defaultMsg;
  const status = err.response?.status || 0;
  return { message, status, raw: err };
}

// ── OTP ───────────────────────────────────────────────────────────────────────

/**
 * Send OTP to a mobile number.
 * In DEV_BYPASS mode: skips the API call — backend will accept DEV_CODE anyway.
 * @param {string} mobile
 * @param {'login'|'register'} purpose
 */
export async function sendOtp(mobile, purpose = 'login') {
  if (DEV_BYPASS) {
    console.warn(`[DEV] OTP bypass active — use "${DEV_CODE}" for any number`);
    return { success: true, message: `[DEV] Use OTP: ${DEV_CODE}`, dev: true };
  }
  try {
    const { data } = await api.post('/auth/otp/send', { mobile, purpose });
    return data;
  } catch (err) {
    throw normalizeError(err, 'Failed to send OTP. Please try again.');
  }
}

/**
 * Verify OTP and login — returns tokens + user profile.
 * Storage handling decoupled (responsibility of store/calling component).
 * @param {string} mobile
 * @param {string} otp   - 6-digit string
 */
export async function verifyOtpLogin(mobile, otp) {
  try {
    const { data } = await api.post('/auth/otp/verify', { mobile, otp });
    return data;
  } catch (err) {
    throw normalizeError(err, 'Invalid OTP or verification failed.');
  }
}

/**
 * Password-based login.
 * Storage handling decoupled (responsibility of store/calling component).
 * @param {string} identifier  - mobile or email
 * @param {string} password
 */
export async function loginWithPassword(identifier, password) {
  try {
    const { data } = await api.post('/auth/login', { identifier, password });
    return data;
  } catch (err) {
    throw normalizeError(err, 'Invalid credentials or login failed.');
  }
}

// ── Register ──────────────────────────────────────────────────────────────────

/**
 * Full partner registration using FormData for file uploads.
 * Maps the form data into FormData, ensuring company_type is aligned with enums.
 */
export async function registerPartner(formData) {
  try {
    const form = new FormData();

    // Step 0 — Personal
    form.append('first_name',       formData.firstName || '');
    form.append('last_name',        formData.lastName || '');
    form.append('mobile',           formData.mobile || '');
    form.append('email',            formData.email || '');
    form.append('password',         formData.password || '');
    form.append('otp',              formData.otp || '');
    form.append('current_address',  formData.address || '');

    // Step 1 — Business
    form.append('company_name',     formData.shopName || '');
    
    // Normalize sole_proprietor -> proprietorship to match backend ENUM
    let companyType = formData.companyType || 'proprietorship';
    if (companyType === 'sole_proprietor' || companyType === 'individual') {
      companyType = 'proprietorship';
    }
    form.append('company_type',     companyType);
    
    form.append('gst_number',       formData.gst || '');
    form.append('business_location',formData.businessCity || '');

    // Step 2 — Bank
    form.append('bank_name',           formData.bankName || '');
    form.append('account_number',      formData.accountNumber || '');
    form.append('ifsc_code',           formData.ifsc || '');
    form.append('account_holder_name', formData.accountHolderName || '');

    // Step 3 — KYC Documents (File objects from input)
    if (formData.aadharFile)       form.append('aadhaar',           formData.aadharFile);
    if (formData.panFile)          form.append('pan',               formData.panFile);
    if (formData.gstCertFile)      form.append('gst_cert',          formData.gstCertFile);
    if (formData.cancelChequeFile) form.append('cancelled_cheque',  formData.cancelChequeFile);
    
    if (formData.aadhaar)          form.append('aadhaar_number',    formData.aadhaar);
    if (formData.pan)              form.append('pan_number',        formData.pan);

    const { data } = await api.post('/auth/register', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (err) {
    throw normalizeError(err, 'Registration failed. Check details.');
  }
}

// ── Session & Account ─────────────────────────────────────────────────────────

/**
 * Get current user from server (cached with a 5-minute TTL).
 */
export async function getMe(bypassCache = false) {
  if (!bypassCache && cachedUser && (Date.now() - lastFetched < USER_CACHE_MS)) {
    return cachedUser;
  }
  try {
    const { data } = await api.get('/auth/me');
    cachedUser = data;
    lastFetched = Date.now();
    return data;
  } catch (err) {
    throw normalizeError(err, 'Failed to retrieve profile.');
  }
}

/**
 * Logout — revokes refresh token on server and clears session internally.
 */
export async function logout() {
  const refreshToken = localStorage.getItem('gkp_refresh_token');
  try {
    if (refreshToken) {
      await api.post('/auth/logout', { refresh_token: refreshToken });
    }
  } catch (err) {
    // Ignore error to ensure local session is cleared regardless
  } finally {
    clearSession();
  }
}

/**
 * Send OTP specifically for registration.
 */
export const sendRegisterOtp = (mobile) => sendOtp(mobile, 'register');

/**
 * Change user password.
 */
export async function changePassword(oldPassword, newPassword) {
  try {
    const { data } = await api.post('/auth/change-password', { oldPassword, newPassword });
    return data;
  } catch (err) {
    throw normalizeError(err, 'Failed to update password.');
  }
}

/**
 * Resend OTP with cooldown tracking.
 */
export async function resendOtp(mobile, purpose) {
  const lastSent = sessionStorage.getItem(`otp_sent_${mobile}`);
  if (lastSent && Date.now() - parseInt(lastSent) < 30000) {
    throw { message: 'Please wait 30 seconds before resending OTP', status: 429 };
  }
  try {
    const result = await sendOtp(mobile, purpose);
    sessionStorage.setItem(`otp_sent_${mobile}`, Date.now().toString());
    return result;
  } catch (err) {
    throw normalizeError(err, 'Resending OTP failed.');
  }
}
