import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCCLCUz5bN3F7SZZ30Qc_o0xyYTJ70Vz5I",
  authDomain: "yohesa-d313a.firebaseapp.com",
  projectId: "yohesa-d313a",
  storageBucket: "yohesa-d313a.firebasestorage.app",
  messagingSenderId: "626910326089",
  appId: "1:626910326089:web:5634ec69735d9746617e98",
  // measurementId removed — prevents auto-init of Firebase Analytics
  // which was triggering the feature_collector.js deprecation warning
};

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
auth.settings.appVerificationDisabledForTesting = true;
export const db      = getFirestore(app);
export const storage = getStorage(app);

export default app;
