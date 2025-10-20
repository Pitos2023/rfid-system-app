import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // use service key on server to bypass RLS for inserts
);

const ONESIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID;
const ONESIGNAL_REST_KEY = process.env.ONE_SIGNAL_REST_KEY;

// send OneSignal notification to a single player id
async function sendOneSignalNotification(playerId, title, body, data = {}) {
  if (!playerId || !ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) return { success: false };

  try {
    const res = await fetch("https://onesignal.com/api/v1/notifications", {
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

    const json = await res.json();
    if (!res.ok) {
      console.error("OneSignal error:", json);
      return { success: false, error: json };
    }
    return { success: true, result: json };
  } catch (err) {
    console.error("OneSignal send error:", err);
    return { success: false, error: err.message };
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
            users_id,
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

    // find parent id (support both users_id and parent_id fields)
    const student = newLog.rfid_card?.student || null;
    const parentId = student?.users_id || student?.parent_id || null;

    if (parentId) {
      // Insert notification row targeted to the parent
      try {
        const title = action === "time_in" || action === "time-in" ? `Time In: ${student.first_name}` : `Time Out: ${student.first_name}`;
        const body = action === "time_in" || action === "time-in"
          ? `${student.first_name} ${student.last_name} has entered school.`
          : `${student.first_name} ${student.last_name} has left school.`;

        const { error: notifError } = await supabase.from("notifications").insert([
          {
            user_id: parentId,
            title,
            message: body,
            type: "info",
            is_read: false,
            metadata: {
              student_id: student.id,
              action,
              rfid_card_id,
            },
          },
        ]);

        if (notifError) {
          console.error("Failed to insert notification row:", notifError);
        }
      } catch (err) {
        console.error("Error inserting notification row:", err);
      }

      // Attempt OneSignal push if parent has player id
      try {
        const { data: parent } = await supabase
          .from("users")
          .select("onesignal_player_id")
          .eq("id", parentId)
          .maybeSingle();

        if (parent?.onesignal_player_id) {
          const title = action === "time_in" || action === "time-in" ? `Time In: ${student.first_name}` : `Time Out: ${student.first_name}`;
          const body = action === "time_in" || action === "time-in"
            ? `${student.first_name} ${student.last_name} has entered school.`
            : `${student.first_name} ${student.last_name} has left school.`;

          await sendOneSignalNotification(parent.onesignal_player_id, title, body, {
            student_id: student.id,
            action,
          });
        } else {
          console.log("Parent has no OneSignal player id; only DB notification inserted.");
        }
      } catch (err) {
        console.error("Error fetching parent/OneSignal id:", err);
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

// ✅ GET — Fetch logs for frontend (kept using service key here)
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
            users_id,
            first_name,
            last_name,
            grade_level,
            section
          )
        )
      `)
      .order("time_stamp", { ascending: false });

    if (error) throw error;

    const logs = (data || []).map((log) => ({
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
