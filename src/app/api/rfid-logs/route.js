import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    // Join through RFID card → student
    const { data: logs, error } = await supabase
      .from("log")
      .select(`
        id,
        time_stamp,
        action,
        consent,
        rfid_card:rfid_card_id (
          id,
          card_number,
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

    if (error) {
      console.error("🔴 Supabase error:", error);
      return NextResponse.json({ logs: [], error: error.message }, { status: 500 });
    }

    // ✅ Flatten nested structure for frontend compatibility
    const flattenedLogs = logs.map((log) => ({
      ...log,
      student: log.rfid_card?.student || null,
    }));

    return NextResponse.json({ logs: flattenedLogs });
  } catch (err) {
    console.error("🔴 Server error:", err);
    return NextResponse.json({ logs: [], error: err.message }, { status: 500 });
  }
}
