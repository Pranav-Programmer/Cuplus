// src/lib/firebase.ts (full, to avoid multi-init issues)
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCspvUkgDjmC4yuF6IZOMPNdc_aF8jzL8M",
  authDomain: "cuplus-dev.firebaseapp.com",
  projectId: "cuplus-dev",
  storageBucket: "cuplus-dev.firebasestorage.app",
  messagingSenderId: "185281260970",
  appId: "1:185281260970:web:b34b1ccc733cfe085c8fd3",
  measurementId: "G-M4GP8VGG03",
};

// Avoid multi-init
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };