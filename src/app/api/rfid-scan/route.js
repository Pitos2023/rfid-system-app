import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(req) {
  try {
    const { card_number, consent = false } = await req.json();

    if (!card_number)
      return new Response(JSON.stringify({ error: "card_number is required" }), {
        status: 400,
      });

    // Find or create RFID card
    let { data: cardData, error: cardError } = await supabase
      .from("rfid_card")
      .select("id, student_id")
      .eq("card_number", card_number)
      .maybeSingle();

    if (cardError) throw cardError;

    if (!cardData) {
      const { data: newCard, error: newCardError } = await supabase
        .from("rfid_card")
        .insert({ card_number })
        .select("id, student_id")
        .maybeSingle();

      if (newCardError) throw newCardError;
      cardData = newCard;
    }

    // Determine action: time-in / time-out
    let action = "time-in";
    const { data: lastLog } = await supabase
      .from("log")
      .select("*")
      .eq("rfid_card_id", cardData.id)
      .order("time_stamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastLog && lastLog.action === "time-in") action = "time-out";

    // Insert log
    const now = new Date();
    const philippineTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const isoTime = philippineTime.toISOString();

    const { data: newLog, error: logError } = await supabase
      .from("log")
      .insert({
        rfid_card_id: cardData.id,
        action,
        consent,
        time_stamp: isoTime,
        issue_at: isoTime,
      })
      .select("*")
      .maybeSingle();

    if (logError) throw logError;

    // Fetch student info via the RFID card
    let student = null;
    if (cardData.student_id) {
      const { data: s, error: studentError } = await supabase
        .from("student")
        .select("id, first_name, last_name, grade_level, section")
        .eq("id", cardData.student_id)
        .maybeSingle();
      if (studentError) throw studentError;
      student = s;
    }

    // ✅ Attach student to log for frontend use
    const logWithStudent = { ...newLog, student };

    return new Response(JSON.stringify({ log: logWithStudent }), { status: 200 });
  } catch (err) {
    console.error("RFID scan error:", err);
    return new Response(
      JSON.stringify({ error: "Server error", details: err.message }),
      { status: 500 }
    );
  }
}
