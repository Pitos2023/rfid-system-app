"use client";
import { useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function OneSignalRegister({ user }) {
  useEffect(() => {
    if (!user?.id) return;

    async function init() {
      if (!window.OneSignal) {
        const s = document.createElement("script");
        s.src = "https://cdn.onesignal.com/sdks/OneSignalSDK.js";
        s.async = true;
        document.head.appendChild(s);
        await new Promise((res) => (s.onload = res));
      }

      window.OneSignal = window.OneSignal || [];
      window.OneSignal.push(function () {
        window.OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONE_SIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
        });

        window.OneSignal.getUserId(async function (playerId) {
          if (!playerId) return;
          try {
            const { error } = await supabase
              .from("users")
              .update({ onesignal_player_id: playerId })
              .eq("id", user.id);
            if (error) console.error("❌ Failed to save OneSignal player id:", error);
          } catch (err) {
            console.error("❌ Error saving player id:", err);
          }
        });
      });
    }

    init();
  }, [user?.id]);

  return null;
}