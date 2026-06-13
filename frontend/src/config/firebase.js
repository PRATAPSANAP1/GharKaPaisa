import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCCLCUz5bN3F7SZZ30Qc_o0xyYTJ70Vz5I",
  authDomain: "gharkapaisa.in",
  projectId: "yohesa-d313a",
  storageBucket: "yohesa-d313a.appspot.com",
  messagingSenderId: "626910326089",
  appId: "1:626910326089:web:5634ec69735d9746617e98",
  measurementId: "G-8XC4RR1113"
};

// App Check Debug Token (Valid for 7 days)
self.FIREBASE_APPCHECK_DEBUG_TOKEN = "AdpetEaBqDxTWXdTK5w1949UZTzG3fLu7R6NPzNbmk5wtSzXSX-VvIn_daiZ_tCWv7E3PQPjL04anN7KGDpvpm3-OXfYQSAA7CYOt13vKacghi2RHY0nh2ubEtdrT3R2m2mCxZ4U4AOVU7sIPb7rada_jA";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check with reCAPTCHA Enterprise
export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider('6LcKdR0tAAAAADPWJWea62b4RcXG8hclvJN2Nr6q'),
  isTokenAutoRefreshEnabled: true // Set to true to allow auto-refresh
});

// Auth (IMPORTANT for OTP + login)
export const auth = getAuth(app);

// Analytics (optional, safe in production)
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;