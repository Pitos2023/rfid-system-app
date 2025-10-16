"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Check, X, AlertTriangle, Info, CheckSquare } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Notifications({ user }) {
  const [notifications, setNotifications] = useState([]);

  // ✅ Fetch notifications
  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setNotifications(data);
  };

  // ✅ Realtime updates
  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case "info":
        return <Info className="w-6 h-6 text-blue-600" />;
      case "success":
        return <CheckSquare className="w-6 h-6 text-green-600" />;
      case "danger":
        return <X className="w-6 h-6 text-red-600" />;
      default:
        return <Info className="w-6 h-6 text-gray-600" />;
    }
  };

  const getBg = (type) => {
    switch (type) {
      case "warning":
        return "bg-yellow-100";
      case "info":
        return "bg-blue-100";
      case "success":
        return "bg-green-100";
      case "danger":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div id="notificationsView" className="p-6 space-y-6">
      {notifications.length === 0 ? (
        <p className="text-gray-500 text-center py-10">No notifications yet.</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start space-x-4">
              <div
                className={`w-12 h-12 ${getBg(
                  n.type
                )} rounded-full flex items-center justify-center flex-shrink-0`}
              >
                {getIcon(n.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-800">{n.title}</h4>
                  <span className="text-sm text-gray-500">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{n.message}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
