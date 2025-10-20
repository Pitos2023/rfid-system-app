import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET() {
  try {
    // ✅ Fetch all logs with relationships
    const { data: logs, error } = await supabase
      .from("log")
      .select(`
        id,
        rfid_card_id,
        student_id,
        action,
        consent,
        time_stamp,
        issue_at,
        student (
          id,
          first_name,
          last_name,
          grade_level,
          section,
          student_pic
        ),
        rfid_card (
          id,
          card_number
        )
      `)
      .order("time_stamp", { ascending: false });

    if (error) throw error;

    // ✅ Handle missing relations gracefully
    const safeLogs = (logs || []).map((log) => ({
      ...log,
      student: log.student || null,
      rfid_card: log.rfid_card || null,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        logs: safeLogs,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error fetching RFID logs:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Internal Server Error",
      }),
      { status: 500 }
    );
  }
}
