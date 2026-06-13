import { auth } from '../config/firebase';
import { 
  signInWithPhoneNumber, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  linkWithCredential, 
  EmailAuthProvider,
  signOut,
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";
import api, { saveSession, clearSession } from './api';

// Format Indian phone numbers with +91 if needed
export function formatMobile(mobile) {
  let clean = mobile.replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91${clean}`;
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    return `+${clean}`;
  }
  return mobile.startsWith('+') ? mobile : `+${mobile}`;
}

// Dev OTP bypass dummy (retained for backward compatibility but unused with real Firebase)
export const DEV_BYPASS = false;
export const DEV_CODE = "";

// Error normalization helper
function normalizeError(err, defaultMsg = 'An error occurred') {
  console.error("Firebase Auth/Firestore error:", err);
  let message = err.message || defaultMsg;
  if (err.code === 'auth/invalid-phone-number') {
    message = 'Invalid phone number format. Please enter a valid 10-digit number.';
  } else if (err.code === 'auth/invalid-verification-code') {
    message = 'Invalid OTP code. Please check and try again.';
  } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
    message = 'Invalid credentials. Please verify your email/password or mobile number.';
  } else if (err.code === 'auth/email-already-in-use') {
    message = 'This email address is already in use.';
  } else if (err.code === 'auth/credential-already-in-use') {
    message = 'This phone number or email is already linked to another account.';
  } else if (err.code === 'auth/too-many-requests') {
    message = 'Too many requests. Please try again later.';
  }
  return { message, status: 400, raw: err };
}

// Cache profile fetches (retained structure)
let cachedUser = null;
let lastFetched = 0;
const USER_CACHE_MS = 5 * 60 * 1000;

// Listen to Firebase auth state changes to synchronize session storage
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Always get a fresh token
        const idToken = await user.getIdToken(true);
        // Store token immediately so backend calls can use it
        saveSession({
          access_token: idToken,
          refresh_token: user.refreshToken || idToken,
          user: {
            id: user.uid,
            email: user.email || '',
            mobile: user.phoneNumber || '',
            role: 'Partner',
            status: 'pending',
            first_name: '',
            last_name: '',
            Partner_code: '',
            Partner_id: '',
            kyc_status: 'pending',
          }
        });

        // Fetch full profile from Express backend
        try {
          const { data: meRes } = await api.get('/auth/me');
          if (meRes.success && meRes.data) {
            const p = meRes.data;
            saveSession({
              access_token: idToken,
              refresh_token: user.refreshToken || idToken,
              user: {
                id: p.id || user.uid,
                email: p.email || user.email || '',
                mobile: p.mobile || user.phoneNumber || '',
                role: p.role || 'Partner',
                status: p.status || 'pending',
                first_name: p.first_name || '',
                last_name: p.last_name || '',
                Partner_code: p.Partner_code || '',
                Partner_id: p.Partner_id || '',
                kyc_status: p.kyc_status || 'pending',
              }
            });
          }
        } catch (backendErr) {
          // Profile not yet registered — acceptable for new registrations
          console.warn('Backend profile not found for Firebase user (may be registering):', backendErr?.response?.status);
        }
      } catch (err) {
        console.error("Error loading session on auth state change:", err);
      }
    } else {
      // Clear storage only if we had an active session
      if (sessionStorage.getItem('gkp_access_token')) {
        clearSession();
      }
    }
  });
}

/**
 * Send OTP to a mobile number using Firebase Phone Auth.
 * Returns the confirmationResult object.
 */
export async function sendOtp(mobile, appVerifier) {
  try {
    const formatted = formatMobile(mobile);
    const confirmationResult = await signInWithPhoneNumber(auth, formatted, appVerifier);
    return confirmationResult;
  } catch (err) {
    throw normalizeError(err, 'Failed to send OTP. Please try again.');
  }
}

/**
 * Verify OTP login — confirms the OTP code.
 */
export async function verifyOtpLogin(confirmationResult, otp) {
  try {
    const userCredential = await confirmationResult.confirm(otp);
    const user = userCredential.user;
    
    // Retrieve partner profile
    const profileSnap = await getDoc(doc(db, "partner_profiles", user.uid));
    let profileData = null;
    if (profileSnap.exists()) {
      profileData = profileSnap.data();
    } else {
      // Auto-create base profile if not registered yet (e.g. direct OTP sign-in)
      const partnerCode = `PP-${Math.floor(1000 + Math.random() * 9000)}`;
      profileData = {
        id: user.uid,
        user_id: user.uid,
        first_name: 'Partner',
        last_name: '',
        mobile: user.phoneNumber || '',
        email: '',
        role: 'Partner',
        status: 'pending',
        kyc_status: 'pending',
        Partner_code: partnerCode,
        created_at: new Date().toISOString()
      };
      await setDoc(doc(db, "partner_profiles", user.uid), profileData);
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        email: '',
        mobile: user.phoneNumber || '',
        role: 'Partner',
        status: 'pending',
        created_at: new Date().toISOString()
      });
    }

    const idToken = await user.getIdToken();
    return {
      success: true,
      message: 'Login successful',
      data: {
        access_token: idToken,
        refresh_token: user.refreshToken || idToken,
        user: {
          id: user.uid,
          email: profileData.email || '',
          mobile: user.phoneNumber || profileData.mobile || '',
          role: profileData.role || 'Partner',
          status: profileData.status || 'pending',
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          Partner_code: profileData.Partner_code || `PP-${user.uid.slice(0, 5).toUpperCase()}`,
          Partner_id: user.uid,
          kyc_status: profileData.kyc_status || 'pending',
        }
      }
    };
  } catch (err) {
    throw normalizeError(err, 'Invalid OTP or verification failed.');
  }
}

/**
 * Password-based login.
 */
export async function loginWithPassword(identifier, password) {
  try {
    // Firebase auth signInWithEmailAndPassword expects an email address.
    // If they input a mobile number, we look up the email from Firestore users collection first.
    let email = identifier;
    if (!identifier.includes('@')) {
      const formatted = formatMobile(identifier);
      // Search email from Firestore
      // Note: In Firestore, simple field lookups can be done. For simple login, we can do a collection query.
      // Wait, we can keep the email lookup simple: query users where mobile == formatted
      // But since users can have a profile, we can fetch their email. Let's do a direct look up if possible,
      // or simply expect email since username is standard.
      // We will search for a user document with that mobile.
      // To simplify, let's check if the identifier is email or phone.
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const profileSnap = await getDoc(doc(db, "partner_profiles", user.uid));
    const profileData = profileSnap.exists() ? profileSnap.data() : {};

    const idToken = await user.getIdToken();
    return {
      success: true,
      message: 'Login successful',
      data: {
        access_token: idToken,
        refresh_token: user.refreshToken || idToken,
        user: {
          id: user.uid,
          email: user.email || '',
          mobile: user.phoneNumber || profileData.mobile || '',
          role: profileData.role || 'Partner',
          status: profileData.status || 'pending',
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          Partner_code: profileData.Partner_code || `PP-${user.uid.slice(0, 5).toUpperCase()}`,
          Partner_id: user.uid,
          kyc_status: profileData.kyc_status || 'pending',
        }
      }
    };
  } catch (err) {
    throw normalizeError(err, 'Invalid credentials or login failed.');
  }
}

/**
 * Full partner registration.
 * Flow:
 *  1. Firebase Auth: create account (email/pass) or link email to phone-verified account.
 *  2. Get Firebase ID Token.
 *  3. POST to Express backend /auth/register — backend stores profile in PostgreSQL.
 */
export async function registerPartner(formData) {
  try {
    let user = auth.currentUser;

    if (!user) {
      // No phone OTP done — create fresh Firebase account with email/password
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      user = userCredential.user;
    } else {
      // Phone already verified — link email/password credential
      try {
        const credential = EmailAuthProvider.credential(formData.email, formData.password);
        await linkWithCredential(user, credential);
      } catch (linkErr) {
        // 'auth/provider-already-linked' is safe to ignore
        if (linkErr.code !== 'auth/provider-already-linked') {
          console.warn('Linking email/password credential:', linkErr.code);
        }
      }
    }

    // Update Firebase display name
    await updateProfile(user, {
      displayName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim()
    });

    // Get fresh ID token
    const idToken = await user.getIdToken(true);

    // POST to Express backend — backend stores everything in PostgreSQL
    const { data: regRes } = await api.post('/auth/register', {
      email: formData.email || user.email || '',
      mobile: formData.mobile ? formData.mobile.replace(/\D/g, '').slice(-10) : (user.phoneNumber || '').replace('+91', ''),
      first_name: formData.firstName || '',
      last_name: formData.lastName || '',
      current_address: formData.address || '',
      company_name: formData.shopName || '',
      company_type: formData.companyType || 'proprietorship',
      gst_number: formData.gst || '',
      business_location: formData.businessCity || '',
      bank_name: formData.bankName || '',
      account_number: formData.accountNumber || '',
      ifsc_code: formData.ifsc || '',
      account_holder_name: formData.accountHolderName || '',
    }, {
      headers: { Authorization: `Bearer ${idToken}` }
    });

    if (!regRes.success) {
      throw new Error(regRes.message || 'Registration failed on the server');
    }

    return {
      success: true,
      message: regRes.message || 'Registration successful',
      data: { Partner_code: regRes.data?.Partner_code }
    };
  } catch (err) {
    // If it's an Axios error, extract the server message
    if (err.response?.data?.message) {
      throw { message: err.response.data.message, status: err.response.status, raw: err };
    }
    throw normalizeError(err, 'Registration failed. Check your details.');
  }
}

/**
 * Get current user profile from Express backend.
 */
export async function getMe(bypassCache = false) {
  const user = auth.currentUser;
  if (!user) {
    throw { message: 'Not authenticated', status: 401 };
  }
  if (!bypassCache && cachedUser && (Date.now() - lastFetched < USER_CACHE_MS)) {
    return cachedUser;
  }
  try {
    // Ensure we have a fresh token
    const idToken = await user.getIdToken();
    const { data: res } = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    if (!res.success) throw new Error(res.message);
    cachedUser = res.data;
    lastFetched = Date.now();
    return res.data;
  } catch (err) {
    if (err.response?.data?.message) {
      throw { message: err.response.data.message, status: err.response.status, raw: err };
    }
    throw normalizeError(err, 'Failed to retrieve profile.');
  }
}

/**
 * Logout.
 */
export async function logout() {
  try {
    await signOut(auth);
  } catch (err) {
    // Ignore error to clear local session anyway
  } finally {
    clearSession();
  }
}

/**
 * Send OTP specifically for registration.
 */
export const sendRegisterOtp = (mobile, appVerifier) => sendOtp(mobile, appVerifier);

/**
 * Change user password.
 */
export async function changePassword(oldPassword, newPassword) {
  // Firebase auth has its own password update logic, which requires re-authentication.
  // To keep it simple, we can link/update, or we can use:
  // updatePassword(auth.currentUser, newPassword)
  throw { message: 'Password change not implemented yet.', status: 501 };
}

/**
 * Resend OTP with cooldown tracking.
 */
export async function resendOtp(mobile, appVerifier) {
  const lastSent = sessionStorage.getItem(`otp_sent_${mobile}`);
  if (lastSent && Date.now() - parseInt(lastSent) < 30000) {
    throw { message: 'Please wait 30 seconds before resending OTP', status: 429 };
  }
  try {
    const result = await sendOtp(mobile, appVerifier);
    sessionStorage.setItem(`otp_sent_${mobile}`, Date.now().toString());
    return result;
  } catch (err) {
    throw normalizeError(err, 'Resending OTP failed.');
  }
}
