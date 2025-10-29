"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAssistant as supabase } from "../supabaseClient";

import AssistantPrincipalNav from "../components-assistant/AssistantPrincipalNav.jsx";

export default function AssistantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/"); // redirect if not logged in
      } else {
        setLoading(false); // user is authenticated
      }
    };

    checkAuth();
  }, [router]);

  if (loading) return <div>Loading...</div>; // show while checking auth

  return (
    <div className="min-h-screen bg-gray-100">
      <AssistantPrincipalNav />
    </div>
  );
}
