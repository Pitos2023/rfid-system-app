import { createClient } from "@supabase/supabase-js";

// ✅ Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ✅ OneSignal config
const ONESIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID;
const ONESIGNAL_REST_KEY = process.env.ONE_SIGNAL_REST_KEY;

// ✅ Utility: Send OneSignal push to a specific player id
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
    const { card_number, consent = false } = await req.json();
    const cleanCard = String(card_number).trim();
    if (!cleanCard) {
      return new Response(
        JSON.stringify({ success: false, error: "card_number is required" }),
        { status: 400 }
      );
    }

    console.log("🔹 Scanned card:", cleanCard);

    // ✅ Step 1: Get RFID card
    let { data: cardData, error: cardError } = await supabase
      .from("rfid_card")
      .select("id, student_id, card_number")
      .eq("card_number", cleanCard)
      .single();

    if (cardError && cardError.code !== "PGRST116") throw cardError;

    if (!cardData) {
      const { data: newCard } = await supabase
        .from("rfid_card")
        .insert([{ card_number: cleanCard }])
        .select("id, student_id, card_number")
        .single();
      cardData = newCard;
    }

    // ✅ Step 2: Determine time-in / time-out
    let action = "time-in";
    const { data: lastLog } = await supabase
      .from("log")
      .select("action")
      .eq("rfid_card_id", cardData.id)
      .order("time_stamp", { ascending: false })
      .limit(1)
      .single();

    if (lastLog?.action === "time-in") action = "time-out";

    // ✅ Step 3: Insert log
    const now = new Date();
    const philippineTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const isoTime = philippineTime.toISOString();

    const { data: newLog } = await supabase
      .from("log")
      .insert([
        {
          rfid_card_id: cardData.id,
          action,
          consent,
          time_stamp: isoTime,
          issue_at: isoTime,
          student_id: cardData.student_id,
        },
      ])
      .select("*")
      .single();

    // ✅ Step 4: Get student + parent info
    const { data: student } = await supabase
      .from("student")
      .select("id, first_name, last_name, users_id")
      .eq("id", cardData.student_id)
      .single();

    if (student?.users_id) {
      const { data: parent } = await supabase
        .from("users")
        .select("id, first_name, onesignal_player_id")
        .eq("id", student.users_id)
        .eq("role", "parent")
        .single();

      if (parent) {
        const title =
          action === "time-in"
            ? `Time In: ${student.first_name} ${student.last_name}`
            : `Time Out: ${student.first_name} ${student.last_name}`;

        const body =
          action === "time-in"
            ? `${student.first_name} has entered the school.`
            : `${student.first_name} has left the school.`;

        // ✅ Step 5: Insert into notifications table
        await supabase.from("notifications").insert([
          {
            user_id: parent.id,
            title,
            message: body,
            type: "info",
            is_read: false,
            created_at: isoTime,
          },
        ]);

        console.log("✅ Notification inserted for parent", parent.id);

        // ✅ Step 6: Send OneSignal push
        if (parent.onesignal_player_id) {
          await sendOneSignalNotification(
            parent.onesignal_player_id,
            title,
            body,
            { student_id: student.id, action }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, log: newLog }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ RFID scan error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
