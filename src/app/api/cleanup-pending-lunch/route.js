// api/cleanup-pending-lunch/route.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function manilaNowISO() {
  const now = new Date();
  return new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();
}

export async function GET() {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();

    // Find all lunch requests older than 1 minute with consent still null
    const { data: pending, error } = await supabase
      .from("log")
      .select("*")
      .eq("action", "lunch-request")
      .is("consent", null)
      .lt("time_stamp", oneMinuteAgo);

    if (error) throw error;

    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ updated: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    for (const log of pending) {
      await supabase
        .from("log")
        .update({
          consent: false,
          action: "time-in",
          updated_at: manilaNowISO(),
        })
        .eq("id", log.id);

      await supabase.from("notifications").insert([
        {
          user_id: log.student_id,
          title: "Lunch Request Auto-Denied",
          message: "No response within 1 minute. Automatically marked as time-in.",
          type: "warning",
          is_read: false,
          created_at: manilaNowISO(),
        },
      ]);
    }

    return new Response(
      JSON.stringify({ updated: pending.length }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ cleanup error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
