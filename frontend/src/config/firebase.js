import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth (IMPORTANT for OTP + login)
export const auth = getAuth(app);

// Analytics (optional, safe in production)
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;