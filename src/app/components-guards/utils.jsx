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
 * - Does NOT fetch logs at all
 */
export async function fetchSchoolEvents(userRole = "guard", page = 1, limit = 10) {
  try {
    const offset = (page - 1) * limit;

    // ✅ Fetch only "announcement" or "urgent" directly from Supabase
    const { data, error, count } = await supabase
      .from("notifications")
      .select("id, title, message, created_at, type", { count: "exact" })
      .in("type", ["announcement", "urgent"]) // ✅ Only include valid types
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const formatted = (data || []).map((n) => ({
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

/**
 * ✅ Fetch Leave Notifications for Guards
 */
export async function fetchLeaveNotifications(page = 1, limit = 10) {
  try {
    const offset = (page - 1) * limit;

    // ✅ Fetch only "leave" type notifications with user data
    const { data, error, count } = await supabase
      .from("notifications")
      .select(`
        *,
        user:user_id (
          first_name,
          last_name,
          email
        )
      `, { count: "exact" })
      .eq("type", "leave")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const formatted = (data || []).map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      reason: notification.metadata?.reason || "Not specified",
      signature: notification.metadata?.signature || null,
      attachment: notification.leave_files || null,
      parentName: notification.user 
        ? `${notification.user.first_name} ${notification.user.last_name}`
        : "Unknown Parent",
      parentEmail: notification.user?.email || "No email",
      date: new Date(notification.created_at).toLocaleString("en-US", {
        timeZone: "Asia/Manila",
        dateStyle: "short",
        timeStyle: "short",
      }),
      created_at: notification.created_at,
    }));

    return {
      leaveNotifications: formatted,
      totalPages: Math.ceil((count || 0) / limit),
      totalCount: count || 0,
    };
  } catch (err) {
    console.error("❌ Error fetching leave notifications:", err.message || err);
    return { leaveNotifications: [], totalPages: 1, totalCount: 0 };
  }
}