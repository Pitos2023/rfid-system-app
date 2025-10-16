// public/firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCnX_tmI5vL9_UR7uU3gzg6vxspnoDmR9M",
  authDomain: "rfid-system-app-26c60.firebaseapp.com",
  projectId: "rfid-system-app-26c60",
  storageBucket: "rfid-system-app-26c60.firebasestorage.app",
  messagingSenderId: "560789047317",
  appId: "1:560789047317:web:a1951c44de4fcbcc45261c",
  measurementId: "G-0JHFZDZ5QW",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📦 Background message:", payload);
  const notificationTitle = payload.notification?.title || "Notification";
  const notificationOptions = {
    body: payload.notification?.body,
    icon: "/icon.png",
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
