"use client";

import OneSignal from "react-onesignal";

/**
 * Initializes OneSignal globally.
 * ✅ Works with web, PWA, or mobile
 * ✅ Automatically requests notification permissions
 * ✅ Saves player ID to Supabase for push targeting
 * ✅ Displays notification even when app is open
 */
export default async function initOneSignal(userId, supabase) {
  if (typeof window === "undefined" || !userId) return;

  try {
    // Initialize OneSignal
    await OneSignal.init({
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_ID || undefined,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: true },
    });

    console.log("✅ OneSignal initialized successfully");

    // Ask for permission
    const permission = await OneSignal.Notifications.requestPermission();
    console.log("🔔 Notification permission:", permission);

    // Get Player ID (unique identifier for the user)
    const playerId = await OneSignal.User.PushSubscription.id;
    console.log("🎯 OneSignal Player ID:", playerId);

    // Save player ID to Supabase
    if (playerId) {
      const { error } = await supabase
        .from("users")
        .update({ onesignal_player_id: playerId })
        .eq("id", userId);

      if (error) {
        console.error("❌ Failed to save OneSignal ID:", error);
      } else {
        console.log("✅ OneSignal ID saved successfully to Supabase");
      }
    } else {
      console.warn("⚠️ No OneSignal Player ID yet, will retry later.");
    }

    // Show notifications even if app is open (like Messenger style)
    OneSignal.Notifications.addEventListener("foregroundWillDisplay", (event) => {
      console.log("📩 Notification received in foreground:", event.notification);
      event.preventDefault();
      event.notification.display(); // Force show popup
    });

  } catch (err) {
    console.error("❌ OneSignal initialization error:", err);
  }
}
