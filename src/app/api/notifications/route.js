import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 📨 GET - Fetch notifications for a specific parent (no duplicates)
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

    // Get user's student info to determine grade_level
    const { data: student, error: studentError } = await supabase
      .from("student")
      .select("grade_level")
      .eq("users_id", userId)
      .maybeSingle();

    if (studentError) throw studentError;

    const gradeLevel = student?.grade_level || null;

    // Fetch notifications for userId or gradeLevel or general
    const { data: notifications, error: notifError } = await supabase
      .from("notifications")
      .select("*")
      .or(
        `user_id.eq.${userId},and(grade_level.eq.${gradeLevel}),grade_level.is.null`
      )
      .order("created_at", { ascending: false });

    if (notifError) throw notifError;

    // Remove duplicates
    const uniqueNotifications = [];
    const seen = new Set();

    for (const n of notifications) {
      const key = `${n.title}-${n.message}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueNotifications.push(n);
      }
    }

    return new Response(
      JSON.stringify({ success: true, notifications: uniqueNotifications }),
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

// 📨 POST - Send notifications (including Yes/No actions)
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, message, targetGradeLevel, targetParents, actionType, referenceId } = body;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing title or message" }),
        { status: 400 }
      );
    }

    let targets = [];
    if (targetParents && targetParents.length > 0) {
      targets = targetParents;
    } else if (targetGradeLevel && targetGradeLevel !== "All") {
      const { data: students, error: studentError } = await supabase
        .from("student")
        .select("users_id")
        .eq("grade_level", targetGradeLevel);
      if (studentError) throw studentError;
      targets = students.map((s) => s.users_id);
    } else {
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

    // Fetch grade level for each target user
    const { data: studentInfo, error: gradeError } = await supabase
      .from("student")
      .select("users_id, grade_level")
      .in("users_id", targets);
    if (gradeError) throw gradeError;

    // Prepare notifications
    const notifications = studentInfo.map((s) => ({
      user_id: s.users_id,
      title,
      message,
      grade_level: s.grade_level || null,
      type: actionType ? "action" : "normal", // mark as action if needed
      action_type: actionType || null, // e.g., "yes_no"
      reference_id: referenceId || null, // optional link
      created_at: new Date().toISOString(),
      is_read: false,
      response: null, // store yes/no later
    }));

    // Insert notifications
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

// 📨 POST - Respond to Yes/No notifications
export async function handleResponse(request) {
  try {
    const { notificationId, response } = await request.json();
    if (!notificationId || !response) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing parameters" }),
        { status: 400 }
      );
    }

    // Update the notification with user response
    const { error } = await supabase
      .from("notifications")
      .update({ response, is_read: true })
      .eq("id", notificationId);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("❌ POST /api/notification-response error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
