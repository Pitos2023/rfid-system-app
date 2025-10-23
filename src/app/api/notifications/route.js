import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 📨 GET - Fetch notifications for a specific parent (with grade-level filter)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing userId" }),
        { status: 400 }
      );
    }

    // 1️⃣ Get user's student info to determine grade_level
    const { data: student, error: studentError } = await supabase
      .from("student")
      .select("grade_level")
      .eq("users_id", userId)
      .maybeSingle();

    if (studentError) throw studentError;

    const gradeLevel = student?.grade_level || null;

    // 2️⃣ Fetch notifications (general or specific to grade_level or user)
    const { data: notifications, error: notifError } = await supabase
      .from("notifications")
      .select("*")
      .or(
        `user_id.eq.${userId},and(grade_level.eq.${gradeLevel}),grade_level.is.null`
      )
      .order("created_at", { ascending: false });

    if (notifError) throw notifError;

    return new Response(
      JSON.stringify({ success: true, notifications }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ GET /api/notifications error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}

// 📨 POST - Send notifications (used by NotificationComposer.jsx)
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, message, targetGradeLevel, targetParents } = body;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing title or message" }),
        { status: 400 }
      );
    }

    let targets = [];

    // 1️⃣ Determine recipients
    if (targetParents && targetParents.length > 0) {
      // Specific parent(s)
      targets = targetParents;
    } else if (targetGradeLevel && targetGradeLevel !== "All") {
      // Parents whose children belong to a specific grade level
      const { data: students, error: studentError } = await supabase
        .from("student")
        .select("users_id")
        .eq("grade_level", targetGradeLevel);

      if (studentError) throw studentError;
      targets = students.map((s) => s.users_id);
    } else {
      // All parents (fetch all student->users_id)
      const { data: allStudents, error: allError } = await supabase
        .from("student")
        .select("users_id");

      if (allError) throw allError;
      targets = allStudents.map((s) => s.users_id);
    }

    if (targets.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No valid recipients found" }),
        { status: 404 }
      );
    }

    // 2️⃣ Fetch grade level for each target user
    const { data: studentInfo, error: gradeError } = await supabase
      .from("student")
      .select("users_id, grade_level")
      .in("users_id", targets);

    if (gradeError) throw gradeError;

    // 3️⃣ Prepare and insert notifications
    const notifications = studentInfo.map((s) => ({
      user_id: s.users_id,
      title,
      message,
      grade_level: s.grade_level || null,
      created_at: new Date().toISOString(),
      is_read: false,
    }));

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notifications sent successfully",
        count: notifications.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ POST /api/notifications error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
