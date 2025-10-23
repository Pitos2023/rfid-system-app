// api/consent-response/route.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Helper: Manila ISO now
 */
function manilaNowISO() {
  const now = new Date();
  const manila = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return manila.toISOString();
}

/**
 * GET - Called when parent clicks Yes/No from the OneSignal notification (or opens the consent URL).
 * Query params expected: log_id, response (yes|no), parent_id (optional)
 *
 * Behavior:
 * - If response === "yes": update the provisional log (action="lunch-request") to action="time-out", consent=true, and update time_stamp/issue_at to now.
 * - If response === "no": update the provisional log to action="time-in" (or keep as time-in) and consent=false.
 *
 * Returns a small HTML page confirming the parent's choice (so clicking the push shows feedback).
 */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const log_id = url.searchParams.get("log_id");
    const response = (url.searchParams.get("response") || "").toLowerCase();
    const parent_id = url.searchParams.get("parent_id");

    if (!log_id || !["yes", "no"].includes(response)) {
      return new Response("Missing or invalid parameters.", { status: 400 });
    }

    // Fetch the provisional log
    const { data: log } = await supabase.from("log").select("*").eq("id", log_id).single();
    if (!log) {
      return new Response("Log not found.", { status: 404 });
    }

    const nowISO = manilaNowISO();

    if (response === "yes") {
      // Update the provisional 'lunch-request' log to time-out and consent=true
      const { error: updErr } = await supabase
        .from("log")
        .update({
          action: "time-out",
          consent: true,
          time_stamp: nowISO,
          issue_at: nowISO,
          updated_at: nowISO,
        })
        .eq("id", log_id);

      if (updErr) throw updErr;

      // Optionally: Insert a confirmation notification record for parent in-app
      if (parent_id) {
        await supabase.from("notifications").insert([
          {
            user_id: parent_id,
            title: "Lunch Permission: Confirmed (Yes)",
            message: "Thank you — permission recorded. Your child will be marked as time-out.",
            type: "info",
            is_read: false,
            created_at: nowISO,
          },
        ]);
      }

      const html = `<html><body style="font-family: Arial, sans-serif; text-align:center; padding:40px;">
        <h2>Permission recorded</h2>
        <p>You have allowed your child to go out for lunch. They have been recorded as <strong>time-out</strong>.</p>
        </body></html>`;
      return new Response(html, { status: 200, headers: { "Content-Type": "text/html" } });
    } else {
      // response === "no": update log to consent=false and action stays or becomes time-in
      const { error: updErr } = await supabase
        .from("log")
        .update({
          action: "time-in",
          consent: false,
          updated_at: nowISO,
        })
        .eq("id", log_id);

      if (updErr) throw updErr;

      if (parent_id) {
        await supabase.from("notifications").insert([
          {
            user_id: parent_id,
            title: "Lunch Permission: Denied (No)",
            message: "Permission denied. Your child remains marked as time-in.",
            type: "info",
            is_read: false,
            created_at: nowISO,
          },
        ]);
      }

      const html = `<html><body style="font-family: Arial, sans-serif; text-align:center; padding:40px;">
        <h2>Permission denied</h2>
        <p>You have denied permission for lunch. Your child will remain marked as <strong>time-in</strong>.</p>
        </body></html>`;
      return new Response(html, { status: 200, headers: { "Content-Type": "text/html" } });
    }
  } catch (err) {
    console.error("❌ consent-response error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
