import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from("log")
    .select("*, students(first_name, last_name, grade_level)")
    .order("time_stamp", { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ logs: data });
}
