import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("id");

    if (!studentId)
      return new Response(
        JSON.stringify({ success: false, error: "Missing student ID" }),
        { status: 400 }
      );

    // ✅ Fetch student details by ID
    const { data: student, error } = await supabase
      .from("student")
      .select("id, first_name, last_name, grade_level, section, student_pic")
      .eq("id", studentId)
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        student,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error fetching student:", err.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Internal Server Error",
      }),
      { status: 500 }
    );
  }
}
