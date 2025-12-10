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
  const [newLeaveCount, setNewLeaveCount] = useState(0); // New state for notification count
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
        
        // Fetch new leave notifications count
        await fetchNewLeaveCount();
      } catch (error) {
        console.error("Error fetching user:", error);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    
    // Set up real-time subscription for new leave notifications
    const setupRealtimeSubscription = () => {
      const channel = supabase
        .channel('leave-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'leave_notifications'
          },
          () => {
            fetchNewLeaveCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, [router]);

  // Function to fetch new leave notifications count
  const fetchNewLeaveCount = async () => {
    try {
      // Adjust this query based on your actual table structure
      // This example assumes you have a 'status' field or 'created_at' field
      const { count, error } = await supabase
        .from('leave_notifications')
        .select('*', { count: 'exact', head: true })
        // You might want to filter by date (e.g., today) or by 'unread' status
        // .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .maybeSingle();

      if (error) throw error;
      
      // For demo purposes, let's assume we want to show total count
      // In production, you might want to filter by unread or recent notifications
      const { count: totalCount } = await supabase
        .from('leave_notifications')
        .select('*', { count: 'exact', head: true });

      setNewLeaveCount(totalCount || 0);
    } catch (error) {
      console.error('Error fetching new leave count:', error);
    }
  };

  // Reset count when user views leave notifications
  const handleLeaveClick = () => {
    setActiveView("leave");
    // Reset count when user views the notifications
    setNewLeaveCount(0);
  };

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
            onClick={handleLeaveClick}
            className={`px-6 py-2 rounded-lg font-medium transition relative ${
              activeView === "leave"
                ? "bg-[#800000] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Leave Notifications
            {newLeaveCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                {newLeaveCount > 99 ? '99+' : newLeaveCount}
              </span>
            )}
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