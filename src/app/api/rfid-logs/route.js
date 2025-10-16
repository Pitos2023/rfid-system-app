import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const FIREBASE_SERVER_KEY = process.env.FIREBASE_SERVER_KEY;

// ✅ Function to send push notification via Firebase Cloud Messaging
async function sendPushNotification(token, title, body) {
  try {
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${FIREBASE_SERVER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title,
          body,
          icon: "/icon.png",
        },
      }),
    });

    if (!response.ok) {
      console.error("Failed to send FCM:", await response.text());
    }
  } catch (err) {
    console.error("FCM Error:", err);
  }
}

// ✅ POST — when RFID is scanned and log is inserted
export async function POST(req) {
  try {
    const { rfid_card_id, action, consent } = await req.json();

    const { data: newLog, error } = await supabase
      .from("log")
      .insert([{ rfid_card_id, action, consent }])
      .select(`
        id,
        time_stamp,
        action,
        consent,
        rfid_card:rfid_card_id (
          student:student_id (
            id,
            first_name,
            last_name,
            grade_level,
            section,
            parent_id
          )
        )
      `)
      .single();

    if (error) throw error;

    // 🔹 Send FCM to parent
    const parentId = newLog.rfid_card?.student?.parent_id;
    if (parentId) {
      const { data: parentToken } = await supabase
        .from("parent_tokens")
        .select("fcm_token")
        .eq("parent_id", parentId)
        .maybeSingle();

      if (parentToken?.fcm_token) {
        const student = newLog.rfid_card.student;
        const title = `RFID Scan - ${
          action === "time_in" ? "Time In" : "Time Out"
        }`;
        const body = `${student.first_name} ${student.last_name} has ${
          action === "time_in" ? "entered" : "left"
        } school.`;

        await sendPushNotification(parentToken.fcm_token, title, body);
      }
    }

    return NextResponse.json({ success: true, log: newLog });
  } catch (err) {
    console.error("🔴 Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

// ✅ GET — Fetch logs for frontend
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("log")
      .select(`
        id,
        time_stamp,
        action,
        consent,
        rfid_card:rfid_card_id (
          student:student_id (
            id,
            first_name,
            last_name,
            grade_level,
            section
          )
        )
      `)
      .order("time_stamp", { ascending: false });

    if (error) throw error;

    // Flatten for frontend
    const logs = data.map((log) => ({
      id: log.id,
      time_stamp: log.time_stamp,
      action: log.action,
      consent: log.consent,
      student: log.rfid_card?.student || null,
    }));

    return NextResponse.json({ logs });
  } catch (err) {
    console.error("🔴 Error fetching logs:", err);
    return NextResponse.json(
      { logs: [], error: err.message || "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
