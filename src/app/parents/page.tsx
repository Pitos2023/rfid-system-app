"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components-parents/Sidebar";
import TopBar from "../components-parents/TopBar";
import NotificationToast from "../components-parents/NotificationToast";
import Dashboard from "../components-parents/Dashboard";
import Students from "../components-parents/Students";
import ActivityLog from "../components-parents/ActivityLog";
import Notifications from "../components-parents/Notifications";
import Profile from "../components-parents/Profile";
import { supabase } from "../supabaseClient";

// ✅ Type for user data
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

export default function ParentPage() {
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [toast, setToast] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // ✅ Fetch logged-in user's data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // 🟢 Step 1: Get session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("❌ Error fetching session:", sessionError.message);
          setLoading(false);
          return;
        }

        if (!session) {
          console.warn("⚠️ No active session found. Redirecting to login...");
          router.push("/");
          return;
        }

        console.log("👤 Logged in user ID:", session.user.id);

        // 🟢 Step 2: Fetch user profile from 'users' table
        const { data: profile, error: profileError, status } = await supabase
          .from("users")
          .select("id, first_name, last_name, email")
          .eq("id", session.user.id)
          .maybeSingle(); // ✅ safer than .single()

        if (profileError) {
          console.error("❌ Supabase fetch error:", profileError.message);
          console.log("📊 Status:", status);
          console.log("🧾 Full error object:", profileError);
        }

        if (!profile) {
          console.warn(
            "⚠️ No profile found for user ID:",
            session.user.id,
            "- You might need to insert it manually in the 'users' table."
          );
          setLoading(false);
          return;
        }

        console.log("✅ User profile fetched successfully:", profile);
        setUser(profile as User);
      } catch (err) {
        console.error("🚨 Unexpected error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // ✅ Render content based on current view
  const renderView = () => {
    if (!user) return null;

    switch (currentView) {
      case "dashboard":
        return <Dashboard key="dashboard" user={user} parentId={user.id} />;
      case "students":
        return <Students key="students" setView={setCurrentView} user={user} />;
      case "activity":
        return <ActivityLog key="activity" user={user} />;
      case "notifications":
        return <Notifications key="notifications" user={user} />;
      case "profile":
        return <Profile key="profile" user={user} />;
      default:
        return <Dashboard key="dashboard" user={user} parentId={user.id} />;
    }
  };

  // ✅ Loading states
  if (loading) return <p className="p-6">Loading...</p>;
  if (!user)
    return (
      <div className="p-6 text-center text-red-500">
        ⚠️ User profile not found in database.  
        <br />
        Please make sure your Supabase `users` table contains this ID:
        <br />
        <code className="text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded">
          (check console for actual ID)
        </code>
      </div>
    );

  // ✅ Main layout
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar currentView={currentView} setView={setCurrentView} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          currentView={currentView}
          setSidebarOpen={() => {}}
          users={user} // ✅ prop name matches your TopBar
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 fade-in">
          {renderView()}
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <NotificationToast message={toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
