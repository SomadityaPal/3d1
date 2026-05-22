import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyATtXi5PYMgZfDEcKPgpMLiy480r_pe2V0",
  authDomain: "x-3d-2eab9.firebaseapp.com",
  projectId: "x-3d-2eab9",
  storageBucket: "x-3d-2eab9.firebasestorage.app",
  messagingSenderId: "761568391725",
  appId: "1:761568391725:web:80bee3b76081c8d5a7bea4",
  measurementId: "G-NECQ6Z2VG1"
};

export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const auth = getAuth(app);
