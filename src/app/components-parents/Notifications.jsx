"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle, Loader2 } from "lucide-react"; // ✅ Removed Bell icon

// ✅ Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Notifications({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch notifications from Supabase
  const fetchNotifications = async () => {
    try {
      setLoading(true);

      let targetUserId = userId;
      if (!targetUserId) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        targetUserId = session?.user?.id;
      }

      if (!targetUserId) {
        console.warn("⚠️ No userId or active session found.");
        setNotifications([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching notifications:", error);
        setNotifications([]);
      } else {
        setNotifications(data || []);
      }
    } catch (err) {
      console.error("⚠️ Unexpected fetch error:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Auto-refresh every 5 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className="p-4">
      {/* 🔄 Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Loader2 className="animate-spin mr-2" /> Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          No notifications yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notif) => (
            <li
              key={notif.id}
              className={`flex flex-col p-3 rounded-xl shadow-sm border transition-all 
                ${
                  notif.is_read
                    ? "bg-gray-50 border-gray-200"
                    : "bg-white border-blue-100"
                }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-800">{notif.title}</p>
                {!notif.is_read && (
                  <CheckCircle className="text-green-500" size={18} />
                )}
              </div>

              <p className="text-sm text-gray-600">{notif.message}</p>

              {/* ✅ Philippine Time */}
              <p className="text-xs text-gray-400 mt-1">
                {new Intl.DateTimeFormat("en-PH", {
                  timeZone: "Asia/Manila",
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(notif.created_at))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
