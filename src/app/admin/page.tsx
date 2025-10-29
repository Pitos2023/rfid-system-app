"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAdmin as supabase } from "../supabaseClient";

import AdminDashboard from "../components-admin/admin";


export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // Redirect if no session
      if (!session) {
        router.replace("/");
      } else {
        setLoading(false); // user authenticated
      }
    };

    checkAuth();
  }, [router]);

  if (loading) return <div>Loading...</div>; // show while checking auth

  return <AdminDashboard />;
}
