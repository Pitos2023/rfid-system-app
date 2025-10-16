import { createClient } from "@supabase/supabase-js";

// ✅ Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ✅ Firebase Cloud Messaging Server Key
const FIREBASE_SERVER_KEY = process.env.FIREBASE_SERVER_KEY;

// ✅ Utility: Send push notification to parent
async function sendPushNotification(token, title, body) {
  if (!token) {
    console.warn("⚠️ No FCM token provided, skipping notification.");
    return { success: false, message: "Missing FCM token" };
  }

  if (!FIREBASE_SERVER_KEY) {
    console.error("❌ FIREBASE_SERVER_KEY is missing in .env");
    return { success: false, message: "Missing Firebase server key" };
  }

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
          click_action: "/", // optional: open site on click
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ FCM failed:", errText);
      return { success: false, error: errText };
    }

    console.log(`📱 Push sent successfully to token: ${token}`);
    return { success: true };
  } catch (err) {
    console.error("❌ FCM send error:", err);
    return { success: false, error: err.message };
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

    // ✅ Step 1: Check or create RFID card record
    let { data: cardData, error: cardError } = await supabase
      .from("rfid_card")
      .select("id, student_id, card_number")
      .eq("card_number", cleanCard)
      .single();

    if (cardError && cardError.code !== "PGRST116") throw cardError;

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

    // ✅ Step 2: Determine time-in or time-out
    let action = "time-in";
    const { data: lastLog, error: lastLogError } = await supabase
      .from("log")
      .select("action, time_stamp")
      .eq("rfid_card_id", cardData.id)
      .order("time_stamp", { ascending: false })
      .limit(1)
      .single();

    if (lastLogError && lastLogError.code !== "PGRST116") throw lastLogError;
    if (lastLog?.action === "time-in") action = "time-out";

    // ✅ Step 3: Use Philippine Time (UTC+8)
    const now = new Date();
    const philippineTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const isoTime = philippineTime.toISOString();

    // ✅ Step 4: Insert log
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

    // ✅ Step 5: Fetch student info
    let student = null;
    if (cardData.student_id) {
      const { data: s, error: studentError } = await supabase
        .from("student")
        .select("id, first_name, last_name, grade_level, section, parent_id")
        .eq("id", cardData.student_id)
        .single();

      if (!studentError) student = s;
    }

    // ✅ Step 6: Fetch parent and send FCM
    if (student?.parent_id) {
      const { data: parent, error: parentError } = await supabase
        .from("users")
        .select("first_name, last_name, fcm_token")
        .eq("id", student.parent_id)
        .eq("role", "parent")
        .single();

      if (!parentError && parent?.fcm_token) {
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
    }

    console.log(`✅ Recorded ${action} for card ${cleanCard}`);

    return new Response(
      JSON.stringify({
        success: true,
        log: { ...newLog, student },
      }),
      { status: 200 }
    );
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
