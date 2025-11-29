"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseGuard as supabase } from "../supabaseClient";
import Header from "../components-guards/Header";
import NotificationToast from "../components-guards/NotificationToast";
import DynamicStatCards from "../components-guards/StatCards";
import ActivityLog from "../components-guards/ActivityLog";
import SchoolEvents from "../components-guards/SchoolEvents";
import LeaveNotifications from "../components-guards/LeaveNotifcations";

export default function GuardDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard" or "leave"
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/");
          return;
        }

        const { data } = await supabase
          .from("users")
          .select("id, first_name, last_name, email, role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!data || data.role !== "guard") {
          router.replace("/");
          return;
        }

        setUser(data);
      } catch (error) {
        console.error("Error fetching user:", error);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!user) return <p className="p-6 text-red-500">User not authorized.</p>;

  return (
    <div className="min-h-screen bg-white text-black">
      <NotificationToast />
      <Header currentView={activeView} setSidebarOpen={() => {}} />

      <main className="p-6 pt-4">
        {/* View Toggle Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveView("dashboard")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeView === "dashboard"
                ? "bg-[#800000] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveView("leave")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeView === "leave"
                ? "bg-[#800000] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Leave Notifications
          </button>
        </div>

        {activeView === "dashboard" ? (
          <>
            <DynamicStatCards />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              <ActivityLog user={user} />
              <div className="space-y-6">
                <SchoolEvents user={user} />
              </div>
            </div>
          </>
        ) : (
          <LeaveNotifications />
        )}
      </main>
    </div>
  );
}