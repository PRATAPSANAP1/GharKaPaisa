/**
 * auth.api.js — Firebase Auth (Phase 8 / 9 Final)
 * ─────────────────────────────────────────────────────────────────────────
 * ✔ Firebase handles: Email login, Phone OTP login, token management
 * ✔ Backend handles: Profile storage (PostgreSQL), commission, wallets
 *
 * LOGIN FLOW:
 *  1. User signs in via Firebase (phone OTP or email/password)
 *  2. Firebase returns an ID token
 *  3. Frontend sends token to GET /auth/me → backend returns DB profile
 *  4. Session is stored in sessionStorage
 */
import { auth } from '../config/firebase';
import {
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  linkWithCredential,
  EmailAuthProvider,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import api, { saveSession, clearSession } from './api';

// ── Utility: format Indian phone numbers ───────────────────────────────────
export function formatMobile(mobile) {
  const clean = mobile.replace(/\D/g, '');
  if (clean.length === 10) return `+91${clean}`;
  if (clean.length === 12 && clean.startsWith('91')) return `+${clean}`;
  return mobile.startsWith('+') ? mobile : `+${mobile}`;
}

// ── Firebase error → friendly message ─────────────────────────────────────
function normalizeFirebaseError(err, defaultMsg = 'An error occurred') {
  const map = {
    'auth/invalid-phone-number':       'Invalid phone number. Enter a valid 10-digit number.',
    'auth/invalid-verification-code':  'Invalid OTP. Please check and try again.',
    'auth/code-expired':               'OTP expired. Please request a new one.',
    'auth/user-not-found':             'No account found with these credentials.',
    'auth/wrong-password':             'Incorrect password.',
    'auth/invalid-credential':         'Invalid credentials. Please try again.',
    'auth/invalid-email':              'Invalid email address. Please enter a valid email.',
    'auth/email-already-in-use':       'This email is already in use.',
    'auth/credential-already-in-use':  'This phone/email is already linked to another account.',
    'auth/too-many-requests':          'Too many attempts. Please wait and try again.',
    'auth/network-request-failed':     'Network error. Check your connection.',
    'auth/email-not-verified':         'Please verify your email before logging in. Check your inbox.',
  };
  const message = map[err.code] || err.message || defaultMsg;
  return { message, code: err.code, status: 400, raw: err };
}

// ── Profile cache ──────────────────────────────────────────────────────────
let cachedUser    = null;
let lastFetched   = 0;
const CACHE_MS    = 5 * 60 * 1000;

// ── Sync Firebase session with backend profile ─────────────────────────────
// Called automatically on every Firebase auth state change.
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const idToken = await firebaseUser.getIdToken(true);

        // Store token immediately (optimistic session)
        saveSession({
          access_token:  idToken,
          refresh_token: firebaseUser.refreshToken || idToken,
          user: {
            id:           firebaseUser.uid,
            email:        firebaseUser.email        || '',
            mobile:       firebaseUser.phoneNumber  || '',
            role:         'Partner',
            status:       'pending',
            first_name:   '',
            last_name:    '',
            Partner_code: '',
            Partner_id:   '',
            kyc_status:   'pending',
          },
        });

        // Enrich from Express backend (/auth/me)
        try {
          const { data } = await api.get('/auth/me');
          // Response: { success, user, firebase }
          if (data.success && data.user) {
            const p = data.user;
            saveSession({
              access_token:  idToken,
              refresh_token: firebaseUser.refreshToken || idToken,
              user: {
                id:           p.id           || firebaseUser.uid,
                email:        p.email        || firebaseUser.email  || '',
                mobile:       p.mobile       || firebaseUser.phoneNumber || '',
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
        } catch (backendErr) {
          // 401 = new user who hasn't registered yet — perfectly normal
          if (backendErr?.response?.status !== 401) {
            console.warn('Backend /auth/me error:', backendErr?.response?.status);
          }
        }
      } catch (err) {
        console.error('Auth state change error:', err);
      }
    } else {
      if (sessionStorage.getItem('gkp_access_token')) clearSession();
    }
  });
}

// ── PHONE OTP — SEND ───────────────────────────────────────────────────────
/**
 * Send OTP to mobile using Firebase Phone Auth.
 * @returns {ConfirmationResult} — pass to verifyOtpLogin()
 */
export async function sendOtp(mobile, appVerifier) {
  try {
    const formatted = formatMobile(mobile);
    return await signInWithPhoneNumber(auth, formatted, appVerifier);
  } catch (err) {
    throw normalizeFirebaseError(err, 'Failed to send OTP. Please try again.');
  }
}

export const sendRegisterOtp = (mobile, appVerifier) => sendOtp(mobile, appVerifier);

// ── PHONE OTP — VERIFY & LOGIN ─────────────────────────────────────────────
/**
 * Confirm OTP code. Returns Firebase user + ID token.
 */
export async function verifyOtpLogin(confirmationResult, otp) {
  try {
    const userCredential = await confirmationResult.confirm(otp);
    const user  = userCredential.user;
    const idToken = await user.getIdToken();
    return { success: true, user, idToken };
  } catch (err) {
    throw normalizeFirebaseError(err, 'Invalid OTP or verification failed.');
  }
}

// ── EMAIL — LOGIN ──────────────────────────────────────────────────────────
/**
 * Sign in with email + password via Firebase.
 * Part 3: Checks emailVerified before returning — unverified users get
 * a resend prompt instead of a broken session.
 */
export async function loginWithPassword(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Part 3 — check email verified
    if (!user.emailVerified) {
      // Resend verification email automatically
      await sendEmailVerification(user);
      await signOut(auth); // sign them out so no broken session
      throw {
        code:    'auth/email-not-verified',
        message: 'Email not verified. A new verification link has been sent to your inbox.',
      };
    }

    const idToken = await user.getIdToken();
    return { success: true, user, idToken };
  } catch (err) {
    if (err.code === 'auth/email-not-verified') throw err;
    throw normalizeFirebaseError(err, 'Login failed. Check your credentials.');
  }
}

// ── REGISTRATION ────────────────────────────────────────────────────────────
/**
 * Full partner registration.
 * Flow:
 *  1. Firebase: create account (email/pass) OR link email to phone-verified user
 *  2. Get ID token
 *  3. POST to Express /auth/register with business/bank profile data
 */
export async function registerPartner(formData) {
  try {
    let user = auth.currentUser;

    if (!user) {
      // No phone OTP step — create fresh Firebase email/password account
      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      user = cred.user;
    } else {
      // Phone already verified — link email/password credential
      try {
        const credential = EmailAuthProvider.credential(formData.email, formData.password);
        await linkWithCredential(user, credential);
      } catch (linkErr) {
        if (linkErr.code !== 'auth/provider-already-linked') {
          console.warn('Link credential warning:', linkErr.code);
        }
      }
    }

    await updateProfile(user, {
      displayName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
    });

    // Part 3 — send email verification after account creation
    if (user && !user.emailVerified) {
      try {
        await sendEmailVerification(user);
      } catch (verifyErr) {
        // Non-fatal — log and continue
        console.warn('sendEmailVerification failed:', verifyErr.code);
      }
    }

    const idToken = await user.getIdToken(true);

    // POST profile to Express backend
    const { data } = await api.post('/auth/register', {
      email:                formData.email        || user.email || '',
      mobile:               formData.mobile ? formData.mobile.replace(/\D/g, '').slice(-10) : (user.phoneNumber || '').replace('+91', ''),
      first_name:           formData.firstName    || '',
      last_name:            formData.lastName     || '',
      current_address:      formData.address      || '',
      company_name:         formData.shopName     || '',
      company_type:         formData.companyType  || 'proprietorship',
      gst_number:           formData.gst          || '',
      business_location:    formData.businessCity || '',
      bank_name:            formData.bankName     || '',
      account_number:       formData.accountNumber || '',
      ifsc_code:            formData.ifsc         || '',
      account_holder_name:  formData.accountHolderName || '',
    }, {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (!data.success) throw new Error(data.message || 'Registration failed on server');

    return {
      success: true,
      message: data.message || 'Registration successful',
      data:    { Partner_code: data.data?.Partner_code },
    };
  } catch (err) {
    if (err.response?.data?.message) {
      throw { message: err.response.data.message, status: err.response.status, raw: err };
    }
    throw normalizeFirebaseError(err, 'Registration failed. Check your details.');
  }
}

// ── GET ME ─────────────────────────────────────────────────────────────────
/**
 * Fetch full profile from Express backend (/auth/me).
 * Response: { success, user, firebase }
 */
export async function getMe(bypassCache = false) {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) throw { message: 'Not authenticated', status: 401 };

  if (!bypassCache && cachedUser && Date.now() - lastFetched < CACHE_MS) {
    return cachedUser;
  }
  try {
    const idToken = await firebaseUser.getIdToken();
    const { data } = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!data.success) throw new Error(data.message);
    // Return the DB user record (data.user)
    cachedUser   = data.user;
    lastFetched  = Date.now();
    return data.user;
  } catch (err) {
    if (err.response?.data?.message) {
      throw { message: err.response.data.message, status: err.response.status, raw: err };
    }
    throw normalizeFirebaseError(err, 'Failed to retrieve profile.');
  }
}

// ── LOGOUT ─────────────────────────────────────────────────────────────────
export async function logout() {
  try {
    await signOut(auth);
  } catch (_) {
    // ignore Firebase errors on logout
  } finally {
    cachedUser  = null;
    lastFetched = 0;
    clearSession();
  }
}

// ── RESEND OTP ─────────────────────────────────────────────────────────────
export async function resendOtp(mobile, appVerifier) {
  const lastSent = sessionStorage.getItem(`otp_sent_${mobile}`);
  if (lastSent && Date.now() - parseInt(lastSent) < 30000) {
    throw { message: 'Please wait 30 seconds before resending OTP', status: 429 };
  }
  const result = await sendOtp(mobile, appVerifier);
  sessionStorage.setItem(`otp_sent_${mobile}`, Date.now().toString());
  return result;
}

// ── LOOKUP USER ────────────────────────────────────────────────────────────
export async function lookupUser(identity) {
  try {
    const { data } = await api.post('/auth/lookup', { identity });
    return data;
  } catch (err) {
    if (err.response?.data?.message) {
      throw { message: err.response.data.message, status: err.response.status, raw: err };
    }
    throw { message: 'Failed to lookup user account.' };
  }
}
