// ✅ FILE: src/app/api/consent-response/route.js
// ✅ PURPOSE: Handles parent consent (Yes/No) for student time-out confirmation.
// Updates log.consent, logs confirmation notifications, and sends optional OneSignal alerts.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ONESIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID;
const ONESIGNAL_REST_KEY = process.env.ONE_SIGNAL_REST_KEY;

// ✅ Utility: Send OneSignal push notification
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
    console.log(`📲 OneSignal sent to ${playerId}: ${title}`);
  } catch (err) {
    console.error("❌ OneSignal error:", err);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("📩 Received consent payload:", body);

    const { action, log_id, parent_id, notification_id } = body;

    if (!log_id || !parent_id || !action) {
      console.error("❌ Invalid consent data received:", body);
      return NextResponse.json(
        { success: false, message: "Invalid consent data. Missing or incorrect fields." },
        { status: 400 }
      );
    }

    const consent = action === "yes";
    const manilaTime = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

    // ✅ Update log consent
    const { error: updateError } = await supabase
      .from("log")
      .update({ consent })
      .eq("id", log_id);

    if (updateError) throw updateError;
    console.log(`📝 Log ${log_id} updated with consent=${consent}`);

    // ✅ If parent clicked "No", revert to time-in and do NOT record as time-out
    if (!consent) {
      const { error: revertError } = await supabase
        .from("log")
        .update({
          action: "time-in", // 🔁 use 'action' instead of 'type'
          consent: false,
        })
        .eq("id", log_id);

      if (revertError) throw revertError;
      console.log(`↩️ Log ${log_id} reverted to time-in (parent denied time-out).`);
    }

    // ✅ Fetch student info
    const { data: logData, error: logError } = await supabase
      .from("log")
      .select("student_id")
      .eq("id", log_id)
      .single();

    if (logError || !logData) throw new Error("Student not found from log.");

    const { data: student, error: studentError } = await supabase
      .from("student")
      .select("first_name, last_name")
      .eq("id", logData.student_id)
      .single();

    if (studentError) throw studentError;

    const studentName = `${student.first_name} ${student.last_name}`;

    // ✅ Insert parent confirmation notification
    const title = consent ? "Time-Out Confirmed" : "Time-Out Denied";
    const message = consent
      ? `You approved ${studentName}’s time-out.`
      : `You denied ${studentName}’s time-out — marked as time-in instead.`;

    const { error: notifError } = await supabase.from("notifications").insert([
      {
        user_id: parent_id,
        title,
        message,
        type: "info",
        is_read: false,
        created_at: manilaTime,
        status: "responded",
        log_id, // ✅ FK reference
      },
    ]);

    if (notifError) throw notifError;
    console.log("🔔 Parent confirmation notification inserted.");

    // ✅ Mark original consent request as responded
    if (notification_id) {
      const { error: markError } = await supabase
        .from("notifications")
        .update({ is_read: true, status: "responded" })
        .eq("id", notification_id);

      if (markError) throw markError;
      console.log("📬 Original consent request marked as responded.");
    }

    // ✅ Notify admins/teachers
    const { data: staffList, error: staffError } = await supabase
      .from("users")
      .select("onesignal_player_id, role")
      .in("role", ["admin", "teacher"]);

    if (staffError) throw staffError;

    const playerIds = staffList.map((s) => s.onesignal_player_id).filter(Boolean);

    for (const pid of playerIds) {
      await sendOneSignalNotification(
        pid,
        `Parent ${consent ? "Approved" : "Denied"} Time-Out`,
        `${studentName}’s parent ${consent ? "confirmed" : "denied"} the time-out.`,
        { log_id, parent_id, consent }
      );
    }

    console.log(`✅ Consent ${consent ? "approved" : "denied"} for log ${log_id}`);

    return NextResponse.json({
      success: true,
      message: consent
        ? "Time-out approved and recorded."
        : "Time-out denied — student status reverted to time-in.",
    });
  } catch (err) {
    console.error("❌ Consent response error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
