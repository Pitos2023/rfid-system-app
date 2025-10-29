"use client";

import { createClient } from "@supabase/supabase-js";

// ✅ Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ✅ Dashboard stats (maroon theme)
export const stats = [
  { title: "Students Present", value: 247, icon: "👥", color: "bg-[#800000]", note: "Currently In School" },
  { title: "Total Activity", value: 331, icon: "📊", color: "bg-[#9c1c1c]", note: "↗️ +15 in last hour" },
  { title: "Sick Leave", value: 8, icon: "🏥", color: "bg-[#b22222]", note: "Absent Today" },
];

// ✅ Helper to get start/end of day
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * ✅ Filter entries by "today"
 */
export function filterToday(data) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  return data.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= todayStart && itemDate <= todayEnd;
  });
}

/**
 * ✅ Filter entries by "this week"
 */
export function filterThisWeek(data) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay()); // Sunday
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Saturday
  end.setHours(23, 59, 59, 999);

  return data.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= start && itemDate <= end;
  });
}

/**
 * ✅ Filter entries by "this month"
 */
export function filterThisMonth(data) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return data.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= start && itemDate <= end;
  });
}

/**
 * ✅ Dynamic School Events Fetcher
 * Fetch notifications created by NotificationComposer.jsx
 * - Shows only type = "announcement" or "urgent"
 * - Skips duplicates and invalid entries
 */
export async function fetchSchoolEvents(userRole = "guard", page = 1, limit = 10) {
  try {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("notifications")
      .select("id, title, message, created_at, type", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const filtered = (data || [])
      .filter(
        (n) =>
          n.type &&
          ["announcement", "urgent"].includes(n.type.toLowerCase()) &&
          n.title &&
          n.message
      )
      .reduce((acc, curr) => {
        if (!acc.find((x) => x.id === curr.id)) acc.push(curr);
        return acc;
      }, []);

    const formatted = filtered.map((n) => ({
      date: new Date(n.created_at).toISOString().split("T")[0],
      time: new Date(n.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      title: n.title,
      message: n.message,
      author:
        n.type === "urgent"
          ? "School Admin (Urgent)"
          : "School Administration",
    }));

    return {
      events: formatted,
      totalPages: Math.ceil((count || 0) / limit),
    };
  } catch (err) {
    console.error("❌ Error fetching school events:", err.message || err);
    return { events: [], totalPages: 1 };
  }
}

