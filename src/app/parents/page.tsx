"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components-parents/Sidebar";
import TopBar from "../components-parents/TopBar";
import Dashboard from "../components-parents/Dashboard";
import Students from "../components-parents/Students";
import ActivityLog from "../components-parents/ActivityLog";
import { supabaseParent as supabase } from "../supabaseClient";

export default function ParentPage() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      console.log("🟡 [ParentPage] Initializing parent dashboard...");

      // ✅ Force role isolation
      sessionStorage.setItem("role", "parent");
      console.log("🟢 [ParentPage] sessionStorage role set to:", sessionStorage.getItem("role"));

      // ✅ Check if the supabaseParent client has its own session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) console.error("❌ [ParentPage] Error getting session:", sessionError);
      console.log("🟢 [ParentPage] Supabase Parent Session:", session);

      // 🚨 No parent session? redirect
      if (!session) {
        console.warn("⚠️ [ParentPage] No parent session found — redirecting to login.");
        router.push("/");
        return;
      }

      // ✅ Fetch user info from 'users' table
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("❌ [ParentPage] Error fetching user data:", error);
      } else {
        console.log("🟢 [ParentPage] User data loaded:", data);
      }

      // 🔍 Check localStorage to confirm unique key isolation
      const allLocalStorageKeys = { ...localStorage };
      console.log("📦 [ParentPage] localStorage snapshot:", allLocalStorageKeys);

      setUser(data);
      setLoading(false);
    };

    fetchUser();
  }, [router]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!user) return <p className="p-6 text-red-500">User not found.</p>;

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard user={user} parentId={user.id} />;
      case "students":
        return <Students setView={setCurrentView} user={user} />;
      case "activity":
        return <ActivityLog setView={setCurrentView} user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentView={currentView} setView={setCurrentView} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar currentView={currentView} users={user} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 fade-in">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
