"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient"; // adjust the path if needed

export default function Header() {
  const [time, setTime] = useState("--:--:--");
  const [date, setDate] = useState("Loading...");
  const [officer, setOfficer] = useState("Loading...");
  const router = useRouter();

  // 🕒 Update time & date every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 👮‍♂️ Fetch logged-in user's first & last name
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.push("/"); // redirect if not logged in
      } else {
        const metadata = data.user.user_metadata || {};

        // Combine first and last name if available
        const firstName = metadata.first_name || "";
        const lastName = metadata.last_name || "";
        const fullName =
          (firstName || lastName)
            ? `${firstName} ${lastName}`.trim()
            : data.user.email || "Officer";

        setOfficer(fullName);
      }
    };

    getUser();
  }, [router]);

  // 🚪 Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="bg-[#58181F] border-b border-gray-200">
      <div className="px-8 flex items-center justify-between w-full py-4">
        {/* Left side */}
        <div>
          <h1 className="text-3xl font-bold text-white">
            SPC BED Security Command
          </h1>
          <p className="text-white/80 text-sm">
            Advanced Monitoring & Control Center
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-9">
          {/* Time + Date */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{time}</div>
            <div className="text-sm text-white">{date}</div>
          </div>

          {/* Officer Info */}
          <div className="text-right">
            <div className="text-sm text-white">Security Officer</div>
            <div className="font-bold text-white text-lg">{officer}</div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
