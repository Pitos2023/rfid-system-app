// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCnX_tmI5vL9_UR7uU3gzg6vxspnoDmR9M",
  authDomain: "rfid-system-app-26c60.firebaseapp.com",
  projectId: "rfid-system-app-26c60",
  storageBucket: "rfid-system-app-26c60.firebasestorage.app",
  messagingSenderId: "560789047317",
  appId: "1:560789047317:web:a1951c44de4fcbcc45261c",
  measurementId: "G-0JHFZDZ5QW"
};

const app = initializeApp(firebaseConfig);

// FCM can only be initialized in the browser
export const initMessaging = () => {
  if (typeof window === "undefined") return null;
  try {
    return getMessaging(app);
  } catch (err) {
    console.error("Messaging not supported", err);
    return null;
  }
};
