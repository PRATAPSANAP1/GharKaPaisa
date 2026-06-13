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
  measurementId: "G-8XC4RR1113"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
