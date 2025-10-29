// ✅ FILE: src/app/api/rfid-scan/route.js
// ✅ PURPOSE: Handles RFID scans and sends notifications for time-in/out events.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ONESIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID;
const ONESIGNAL_REST_KEY = process.env.ONE_SIGNAL_REST_KEY;

async function sendOneSignalNotification(playerId, title, body, data = {}) {
  if (!playerId) return;
  try {
    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${ONESIGNAL_REST_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: [playerId],
        headings: { en: title },
        contents: { en: body },
        data,
      }),
    });
  } catch (err) {
    console.error("❌ OneSignal send error:", err);
  }
}

export async function POST(req) {
  try {
    const { card_number } = await req.json();
    const cleanCard = String(card_number || "").trim();

    if (!cleanCard)
      return new Response(JSON.stringify({ success: false, error: "card_number required" }), { status: 400 });

    console.log("🔹 Scanned card:", cleanCard);

    // ✅ Find RFID card
    let { data: cardData, error: cardError } = await supabase
      .from("rfid_card")
      .select("id, student_id, card_number")
      .eq("card_number", cleanCard)
      .single();

    if (cardError && cardError.code !== "PGRST116") throw cardError;
    if (!cardData)
      return new Response(JSON.stringify({ success: false, error: "RFID not found" }), { status: 404 });

    if (!cardData.student_id)
      return new Response(JSON.stringify({ success: false, error: "Card not linked to student" }), { status: 404 });

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
          title = `Time In: ${student.first_name}`;
          body = `${student.first_name} has entered the school.`;
        } else {
          // ✅ TIME-OUT triggers consent request
          title = `Confirm Time-Out: ${student.first_name}`;
          body = `Confirm if you want ${student.first_name} to leave the school? Please confirm.`;
          type = "consent_request";
        }

        // ✅ Store notification (log_id added here)
        await supabase.from("notifications").insert([
          {
            user_id: parent.id,
            title,
            message: body,
            type,
            is_read: false,
            created_at: manilaISO,
            status: "pending",
            log_id: newLog.id, // ✅ Added FK reference
          },
        ]);

        // ✅ Push notification
        if (parent.onesignal_player_id) {
          await sendOneSignalNotification(parent.onesignal_player_id, title, body, {
            student_id: student.id,
            log_id: newLog.id,
            type,
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, action, log: newLog }), { status: 200 });
  } catch (err) {
    console.error("❌ RFID error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
