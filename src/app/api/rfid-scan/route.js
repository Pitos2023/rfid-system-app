import { createClient } from "@supabase/supabase-js";

// ✅ Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ✅ Firebase Cloud Messaging Server Key
const FIREBASE_SERVER_KEY = process.env.FIREBASE_SERVER_KEY;

// ✅ Send push notification to parent
async function sendPushNotification(token, title, body) {
  if (!token) return;

  try {
    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
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

    if (!res.ok) {
      console.error("❌ FCM failed:", await res.text());
    } else {
      console.log(`📱 Push sent to token: ${token}`);
    }
  } catch (err) {
    console.error("❌ FCM send error:", err);
  }
}

export async function POST(req) {
  try {
    const { card_number, consent = false } = await req.json();

    const cleanCard = String(card_number).trim();
    if (!cleanCard)
      return new Response(
        JSON.stringify({ success: false, error: "card_number is required" }),
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

    // 🆕 Create new RFID card if not found
    if (!cardData) {
      console.log("🆕 Creating new RFID card:", cleanCard);
      const { data: newCard, error: newCardError } = await supabase
        .from("rfid_card")
        .insert([{ card_number: cleanCard }])
        .select("id, student_id, card_number")
        .single();

      if (newCardError) throw newCardError;
      cardData = newCard;
    }

    // 🔄 Determine time-in or time-out
    let action = "time-in";
    const { data: lastLog, error: lastLogError } = await supabase
      .from("log")
      .select("id, action, time_stamp")
      .eq("rfid_card_id", cardData.id)
      .order("time_stamp", { ascending: false })
      .limit(1)
      .single();

    if (lastLogError && lastLogError.code !== "PGRST116") throw lastLogError;
    if (lastLog?.action === "time-in") action = "time-out";

    // 🕒 Philippine Time (UTC+8)
    const now = new Date();
    const philippineTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const isoTime = philippineTime.toISOString();

    // 🧾 Insert new log
    const { data: newLog, error: logError } = await supabase
      .from("log")
      .insert([
        {
          rfid_card_id: cardData.id,
          action,
          consent,
          time_stamp: isoTime,
          issue_at: isoTime,
        },
      ])
      .select("*")
      .single();

    if (logError) throw logError;

    // 👩‍🎓 Fetch student info
    let student = null;
    if (cardData.student_id) {
      const { data: s, error: studentError } = await supabase
        .from("student")
        .select("id, first_name, last_name, grade_level, section, parent_id")
        .eq("id", cardData.student_id)
        .single();

      if (!studentError) student = s;
    }

    // 👨‍👩‍👧 Fetch parent FCM token
    let parent = null;
    if (student?.parent_id) {
      const { data: p, error: parentError } = await supabase
        .from("users")
        .select("id, first_name, last_name, fcm_token")
        .eq("id", student.parent_id)
        .eq("role", "parent")
        .single();

      if (!parentError) parent = p;
    }

    // 📢 Send push notification
    if (parent?.fcm_token && student) {
      const title =
        action === "time-in"
          ? `Time In: ${student.first_name} ${student.last_name}`
          : `Time Out: ${student.first_name} ${student.last_name}`;
      const body =
        action === "time-in"
          ? `${student.first_name} has entered the school.`
          : `${student.first_name} has left the school.`;

      await sendPushNotification(parent.fcm_token, title, body);
    }

    const logWithStudent = { ...newLog, student };
    console.log(`✅ Recorded ${action} for card ${cleanCard}`);

    return new Response(JSON.stringify({ success: true, log: logWithStudent }), {
      status: 200,
    });
  } catch (err) {
    console.error("❌ RFID scan error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Server error",
      }),
      { status: 500 }
    );
  }
}
