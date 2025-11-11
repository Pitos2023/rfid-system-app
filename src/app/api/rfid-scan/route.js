// ✅ FILE: src/app/api/rfid-scan/route.js
// ✅ PURPOSE: Handles RFID scans and sends notifications for time-in/out events.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ✅ Updated OneSignal Environment Variables
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_KEY = process.env.ONE_SIGNAL_REST_KEY;

// ✅ OneSignal Notification Function (updated)
async function sendOneSignalNotification(playerId, title, body, data = {}) {
  if (!playerId) {
    console.warn("⚠️ No OneSignal Player ID provided — skipping notification.");
    return;
  }

  console.log("📤 Sending OneSignal notification...");
  console.log("   ▶️ Player ID:", playerId);
  console.log("   ▶️ Title:", title);
  console.log("   ▶️ Body:", body);
  console.log("   ▶️ Extra Data:", data);

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${ONESIGNAL_REST_KEY}`, // ✅ REST API Key
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: [playerId],
        headings: { en: title },
        contents: { en: body },
        data,
        url: "https://mastoparietal-besottingly-dann.ngrok-free.dev/parents?view=dashboard",
        web_push_topic: "rfid-scan",
        chrome_web_icon: "https://cdn-icons-png.flaticon.com/512/1828/1828640.png",
        ttl: 30,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ OneSignal notification successfully sent!");
      console.log("   ▶️ Notification ID:", result.id);
    } else {
      console.error("❌ OneSignal error response:", result.errors || result);
      console.error("Raw response:", result);
    }
  } catch (err) {
    console.error("❌ OneSignal fetch error:", err);
  }
}

export async function POST(req) {
  try {
    const { card_number } = await req.json();
    const cleanCard = String(card_number || "").trim();

    if (!cleanCard)
      return new Response(
        JSON.stringify({ success: false, error: "card_number required" }),
        { status: 400 }
      );

    console.log("🔹 Scanned card:", cleanCard);

    // ✅ Find RFID card
    let { data: cardData, error: cardError } = await supabase
      .from("rfid_card")
      .select("id, student_id, card_number")
      .eq("card_number", cleanCard)
      .single();

    if (cardError && cardError.code !== "PGRST116") throw cardError;
    if (!cardData)
      return new Response(
        JSON.stringify({ success: false, error: "RFID not found" }),
        { status: 404 }
      );

    if (!cardData.student_id)
      return new Response(
        JSON.stringify({ success: false, error: "Card not linked to student" }),
        { status: 404 }
      );

    // ✅ Determine action
    const { data: lastLog } = await supabase
      .from("log")
      .select("action")
      .eq("rfid_card_id", cardData.id)
      .order("time_stamp", { ascending: false })
      .limit(1)
      .single();

    let action = "time-in";
    if (lastLog?.action === "time-in") action = "time-out";

    const now = new Date();
    const manilaISO = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();

    // ✅ Insert log entry
    const { data: newLog, error: logErr } = await supabase
      .from("log")
      .insert([
        {
          rfid_card_id: cardData.id,
          student_id: cardData.student_id,
          action,
          consent: false,
          time_stamp: manilaISO,
          issue_at: manilaISO,
          metadata: { via: "rfid-scan" },
        },
      ])
      .select("*")
      .single();

    if (logErr) throw logErr;

    // ✅ Fetch student + parent info
    const { data: student } = await supabase
      .from("student")
      .select("id, first_name, last_name, users_id")
      .eq("id", cardData.student_id)
      .single();

    if (student?.users_id) {
      const { data: parent } = await supabase
        .from("users")
        .select("id, onesignal_player_id")
        .eq("id", student.users_id)
        .eq("role", "parent")
        .single();

      if (parent) {
        let title, body, type = "info";

        if (action === "time-in") {
          title = `${student.first_name} ${student.last_name} has checked in`;
          body = `Has entered the school at ${new Date(manilaISO).toLocaleTimeString()}`;
          type = "checkin";
        } else if (action === "time-out") {
          title = `${student.first_name} ${student.last_name} has checked out`;
          body = `Has exited the school at ${new Date(manilaISO).toLocaleTimeString()}`;
          type = "checkout";
        }

        // ✅ Store notification in database
        await supabase.from("notifications").insert([
          {
            user_id: parent.id,
            title,
            message: body,
            type,
            is_read: false,
            created_at: manilaISO,
            status: "pending",
            log_id: newLog.id,
          },
        ]);

        // ✅ Send push notification
        if (parent.onesignal_player_id) {
          await sendOneSignalNotification(parent.onesignal_player_id, title, body, {
            log_id: newLog.id,
            student_id: student.id,
            action,
          });
        }

        // ✅ ONLY create consent request on time-out
        if (action === "time-out") {
          const consentTitle = `Consent Request: ${student.first_name} ${student.last_name}`;
          const consentMessage = `Do you allow pick-up for ${student.first_name}?`;

          await supabase.from("notifications").insert([
            {
              user_id: parent.id,
              title: consentTitle,
              message: consentMessage,
              type: "consent_request",
              is_read: false,
              created_at: manilaISO,
              status: "pending",
              log_id: newLog.id,
            },
          ]);
        }
      }
    }

    console.log(`✅ RFID scan processed successfully for ${cleanCard} (${action})`);

    return new Response(
      JSON.stringify({ success: true, action, log: newLog }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ RFID error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
