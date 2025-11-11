// ✅ FILE: src/app/api/send-push/route.js
// ✅ PURPOSE: Sends push notifications via OneSignal REST API

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { title, message } = await request.json();

    // ✅ Must match your OneSignal App ID and REST API Key
    const ONESIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID;
    const ONESIGNAL_REST_API_KEY = process.env.ONE_SIGNAL_REST_API_KEY;

    // ✅ Log for debugging (don't expose this in production)
    console.log("🔑 OneSignal App ID:", ONESIGNAL_APP_ID);
    console.log("🚀 Sending push notification...");

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`, // ✅ REQUIRED
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ["All"], // or specify filters if needed
        headings: { en: title },
        contents: { en: message },
      }),
    });

    const data = await response.json();
    console.log("✅ OneSignal API Response:", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Push send failed:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
