// ✅ FILE: src/app/api/send-notifications/route.js
// ✅ PURPOSE: Send OneSignal notifications for assistant principal notifications

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ✅ OneSignal Environment Variables
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_KEY = process.env.ONE_SIGNAL_REST_KEY;

// ✅ OneSignal Notification Function (similar to RFID scan)
async function sendOneSignalNotification(playerIds, title, body, data = {}) {
  if (!playerIds || playerIds.length === 0) {
    console.warn("⚠️ No OneSignal Player IDs provided — skipping notification.");
    return;
  }

  console.log("📤 Sending OneSignal notification...");
  console.log("   ▶️ Player IDs:", playerIds.length);
  console.log("   ▶️ Title:", title);
  console.log("   ▶️ Body:", body);
  console.log("   ▶️ Extra Data:", data);

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${ONESIGNAL_REST_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { en: title },
        contents: { en: body },
        data,
        // Use the same URL pattern as your RFID scan for consistency
        url: "https://sarahi-recriminatory-liane.ngrok-free.dev/parents?view=dashboard",
        web_push_topic: "assistant-principal-notifications",
        chrome_web_icon: "https://cdn-icons-png.flaticon.com/512/1828/1828640.png",
        ttl: 30,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ OneSignal notification successfully sent!");
      console.log("   ▶️ Notification ID:", result.id);
      console.log("   ▶️ Recipients:", result.recipients);
      return result;
    } else {
      console.error("❌ OneSignal error response:", result.errors || result);
      throw new Error(result.errors?.[0] || "OneSignal API error");
    }
  } catch (err) {
    console.error("❌ OneSignal fetch error:", err);
    throw err;
  }
}

export async function POST(req) {
  try {
    const { title, message, type, targetUserIds = [] } = await req.json();

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: "Title and message are required" },
        { status: 400 }
      );
    }

    console.log("🔹 Sending notification:", { title, message, type, targetUserIds: targetUserIds.length });

    // If targetUserIds are provided, fetch their OneSignal player IDs
    let playerIds = [];
    
    if (targetUserIds.length > 0) {
      // Fetch OneSignal player IDs for the target users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("onesignal_player_id")
        .in("id", targetUserIds)
        .not("onesignal_player_id", "is", null);

      if (usersError) {
        console.error("❌ Error fetching user player IDs:", usersError);
      } else {
        playerIds = usersData.map(user => user.onesignal_player_id).filter(Boolean);
        console.log(`📱 Found ${playerIds.length} player IDs for notification`);
      }
    }

    // ✅ FIXED: Use Manila time for timestamp
    const now = new Date();
    const manilaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);

    // Send OneSignal notification if we have player IDs
    let oneSignalResult = null;
    if (playerIds.length > 0) {
      oneSignalResult = await sendOneSignalNotification(playerIds, title, message, {
        type: type || "announcement",
        source: "assistant_principal",
        timestamp: manilaTime.toISOString(), // ✅ FIXED: Use Manila time
      });
    } else {
      console.log("ℹ️ No player IDs found - notification will only be stored in database");
    }

    return NextResponse.json({
      success: true,
      message: `Notification processed successfully`,
      oneSignal: oneSignalResult,
      players_notified: playerIds.length,
    });

  } catch (err) {
    console.error("❌ Send notification error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}