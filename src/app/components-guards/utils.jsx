"use client";

import { createClient } from "@supabase/supabase-js";

// ✅ Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ... (keep all your existing stats and filter functions) ...

/**
 * ✅ Dynamic School Events Fetcher for Guards
 * Fetch notifications for users with "guard" role
 */
export async function fetchSchoolEvents(userRole = "guard", page = 1, limit = 5) {
  try {
    const offset = (page - 1) * limit;

    // ✅ First, get all user IDs with role = "guard"
    const { data: guardUsers, error: usersError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "guard");

    if (usersError) throw usersError;

    const guardUserIds = guardUsers.map(user => user.id);

    // ✅ If no guard users found, return empty
    if (guardUserIds.length === 0) {
      return {
        events: [],
        totalPages: 1,
      };
    }

    // ✅ Fetch notifications only for guard users
    const { data, error, count } = await supabase
      .from("notifications")
      .select("id, title, message, created_at, type", { count: "exact" })
      .in("type", ["announcement", "urgent"])
      .in("user_id", guardUserIds) // ✅ Only notifications for guard users
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
export async function fetchLeaveNotifications(page = 1, limit = 5) {
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