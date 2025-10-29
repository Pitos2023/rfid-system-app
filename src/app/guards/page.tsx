"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseGuard as supabase } from "../supabaseClient";
import Header from "../components-guards/Header";
import NotificationToast from "../components-guards/NotificationToast";
import DynamicStatCards from "../components-guards/StatCards";
import ActivityLog from "../components-guards/ActivityLog";
import SchoolEvents from "../components-guards/SchoolEvents";

export default function GuardDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/"); // use replace instead of push to avoid back navigation
          return;
        }

        const { data } = await supabase
          .from("users")
          .select("id, first_name, last_name, email, role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!data || data.role !== "guard") {
          router.replace("/"); // replace to stay on home
          return;
        }

        setUser(data);
      } catch (error) {
        console.error("Error fetching user:", error);
        router.replace("/"); // fallback
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
      <Header />

      <main className="p-6 pt-4">
        <DynamicStatCards />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <ActivityLog user={user} /> {/* pass user as prop */}
          <div className="space-y-6">
            <SchoolEvents user={user} /> {/* pass user as prop */}
          </div>
        </div>
      </main>
    </div>
  );
}
