import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client with service key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET() {
  try {
    // Fetch last 50 logs along with student info
    const { data: logs, error } = await supabase
      .from("log")
      .select("id, action, consent, time_stamp, rfid_card(student(*))")
      .order("time_stamp", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching logs:", error);
      return new Response(JSON.stringify({ logs: [] }), { status: 500 });
    }

    return new Response(JSON.stringify({ logs }), { status: 200 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ logs: [] }), { status: 500 });
  }
}
