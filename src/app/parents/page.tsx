"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components-parents/Sidebar";
import TopBar from "../components-parents/TopBar";
import Dashboard from "../components-parents/Dashboard";
import Students from "../components-parents/Students";
import ActivityLog from "../components-parents/ActivityLog";
import Notifications from "../components-parents/Notifications";
import { supabaseParent as supabase } from "../supabaseClient";


export default function ParentPage() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .eq("id", session.user.id)
        .maybeSingle();

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
      case "notifications":
        return <Notifications user={user} />;
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
