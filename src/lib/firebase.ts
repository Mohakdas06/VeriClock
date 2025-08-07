
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "vericlock-u5hfp",
  "appId": "1:590255097704:web:0715f3860d3c2506def8dd",
  "storageBucket": "vericlock-u5hfp.firebasestorage.app",
  "apiKey": "AIzaSyBoDffG0AxM0g3p776kPby9Wa6IgSB4R8M",
  "authDomain": "vericlock-u5hfp.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "590255097704"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
