// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnX_tmI5vL9_UR7uU3gzg6vxspnoDmR9M",
  authDomain: "rfid-system-app-26c60.firebaseapp.com",
  projectId: "rfid-system-app-26c60",
  storageBucket: "rfid-system-app-26c60.firebasestorage.app",
  messagingSenderId: "560789047317",
  appId: "1:560789047317:web:a1951c44de4fcbcc45261c",
  measurementId: "G-0JHFZDZ5QW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Messaging
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

// Function to request permission and get FCM token
export const requestPermissionAndGetToken = async () => {
  if (!messaging) return null;

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("❌ Notifications denied");
      return null;
    }

    // Get FCM token using VAPID public key
    const token = await getToken(messaging, {
      vapidKey: "BMMV1bJAL0w9fPhDiic6EgmszRbekZkUED3UcfYtcL-Jotissq2wJt4aLrP2S6AHaBE4_zddlRehY2sReeN3yRZA", // Your VAPID key from Firebase Console
    });

    console.log("✅ FCM token:", token);
    return token;
  } catch (error) {
    console.error("❌ Error getting FCM token:", error);
    return null;
  }
};
