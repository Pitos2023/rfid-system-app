import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client with service key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { card_number, consent = false } = body;

    if (!card_number) {
      return new Response(
        JSON.stringify({ error: "card_number is required" }),
        { status: 400 }
      );
    }

    // ✅ Find card by card_number
    let { data: cardData, error: cardError } = await supabase
      .from("rfid_card")
      .select("id, student_id")
      .eq("card_number", card_number)
      .maybeSingle();

    if (cardError) throw cardError;

    // ✅ If card not found, create it
    if (!cardData) {
      const { data: newCard, error: newCardErr } = await supabase
        .from("rfid_card")
        .insert({ card_number })
        .select("id, student_id")
        .maybeSingle();

      if (newCardErr) throw newCardErr;
      cardData = newCard;
    }

    // ✅ Determine action: time-in or time-out
    let action = "time-in";

    const { data: lastLog, error: lastLogErr } = await supabase
      .from("log")
      .select("*")
      .eq("rfid_card_id", cardData.id)
      .order("time_stamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastLogErr) throw lastLogErr;
    if (lastLog && lastLog.action === "time-in") action = "time-out";

    // ✅ Timestamp in Philippine timezone
    const now = new Date();
    const philippineTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // UTC+8
    const isoTime = philippineTime.toISOString();

    // ✅ Insert log
    const { data: log, error: logErr } = await supabase
      .from("log")
      .insert({
        rfid_card_id: cardData.id,
        action,
        consent,
        time_stamp: isoTime,
        issue_at: isoTime, // satisfies NOT NULL
      })
      .select("*")
      .maybeSingle();

    if (logErr) throw logErr;

    // ✅ Fetch student info
    let student = null;
    if (cardData.student_id) {
      const { data: s, error: sErr } = await supabase
        .from("student")
        .select("id, first_name, last_name, grade_level, section")
        .eq("id", cardData.student_id)
        .maybeSingle();
      if (!sErr) student = s;
    }

    // ✅ Fetch full log with rfid_card relation
    const { data: fullLog, error: fullLogErr } = await supabase
      .from("log")
      .select("id, action, consent, time_stamp, rfid_card(card_number)")
      .eq("id", log.id)
      .maybeSingle();

    if (fullLogErr) throw fullLogErr;

    return new Response(
      JSON.stringify({ log: fullLog, student }),
      { status: 200 }
    );
  } catch (err) {
    console.error("RFID scan error:", err);
    return new Response(
      JSON.stringify({
        error: "Server error",
        details: err.message || JSON.stringify(err),
      }),
      { status: 500 }
    );
  }
}
