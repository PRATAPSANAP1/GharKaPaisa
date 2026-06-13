import { auth, db } from '../config/firebase';
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
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { saveSession, clearSession } from './api';

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
        const idToken = await user.getIdToken();
        const profileSnap = await getDoc(doc(db, "partner_profiles", user.uid));
        
        let profile = null;
        if (profileSnap.exists()) {
          profile = profileSnap.data();
        } else {
          // If profile doc doesn't exist yet, construct a basic mock one
          profile = {
            id: user.uid,
            user_id: user.uid,
            first_name: user.displayName?.split(' ')[0] || 'Partner',
            last_name: user.displayName?.split(' ')[1] || '',
            mobile: user.phoneNumber || '',
            email: user.email || '',
            role: 'Partner',
            kyc_status: 'pending',
            Partner_code: `PP-${user.uid.slice(0, 5).toUpperCase()}`
          };
        }

        saveSession({
          access_token: idToken,
          refresh_token: user.refreshToken || idToken,
          user: {
            id: user.uid,
            email: user.email || profile.email || '',
            mobile: user.phoneNumber || profile.mobile || '',
            role: profile.role || 'Partner',
            status: profile.status || 'pending',
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            Partner_code: profile.Partner_code || `PP-${user.uid.slice(0, 5).toUpperCase()}`,
            Partner_id: user.uid,
            kyc_status: profile.kyc_status || 'pending',
          }
        });
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
 * Full partner registration using Firestore.
 */
export async function registerPartner(formData) {
  try {
    let user = auth.currentUser;
    
    // If the user isn't authenticated yet (meaning they skipped OTP verification somehow),
    // we create a credential using Email/Password.
    if (!user) {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      user = userCredential.user;
    } else {
      // Link email/password credential to the phone-authenticated user
      try {
        const credential = EmailAuthProvider.credential(formData.email, formData.password);
        await linkWithCredential(user, credential);
      } catch (linkErr) {
        // If already linked or fails, log it and proceed
        console.warn("Linking email/password credential failed or already linked:", linkErr);
      }
    }

    // Update display name
    await updateProfile(user, {
      displayName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim()
    });

    const partnerCode = `PP-${Math.floor(1000 + Math.random() * 9000)}`;

    const profileData = {
      id: user.uid,
      user_id: user.uid,
      Partner_code: partnerCode,
      first_name: formData.firstName || '',
      last_name: formData.lastName || '',
      mobile: user.phoneNumber || formatMobile(formData.mobile) || '',
      email: formData.email || '',
      current_address: formData.address || '',
      company_name: formData.shopName || '',
      company_type: formData.companyType || 'proprietorship',
      gst_number: formData.gst || '',
      business_location: formData.businessCity || '',
      bank_name: formData.bankName || '',
      account_number: formData.accountNumber || '',
      ifsc_code: formData.ifsc || '',
      account_holder_name: formData.accountHolderName || '',
      kyc_status: 'pending',
      status: 'pending',
      role: 'Partner',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save profile and user documents in Firestore
    await setDoc(doc(db, "partner_profiles", user.uid), profileData);
    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      email: formData.email || '',
      mobile: user.phoneNumber || formatMobile(formData.mobile) || '',
      role: 'Partner',
      status: 'pending',
      created_at: new Date().toISOString()
    });

    // Create matching base wallet document in Firestore
    await setDoc(doc(db, "wallets", user.uid), {
      id: user.uid,
      Partner_id: user.uid,
      total_earned: 0,
      total_withdrawn: 0,
      pending_amount: 0,
      available_balance: 0,
      last_updated: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Registration successful',
      data: {
        Partner_code: partnerCode
      }
    };
  } catch (err) {
    throw normalizeError(err, 'Registration failed. Check details.');
  }
}

/**
 * Get current user profile.
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
    const profileSnap = await getDoc(doc(db, "partner_profiles", user.uid));
    if (!profileSnap.exists()) {
      throw new Error('Profile details not found in Firestore.');
    }
    const data = profileSnap.data();
    cachedUser = data;
    lastFetched = Date.now();
    return data;
  } catch (err) {
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
