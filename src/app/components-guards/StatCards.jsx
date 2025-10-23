"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Users, Activity, HeartPulse } from "lucide-react";

// ✅ Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- Stat Card UI Component
const StatCard = ({ title, value, note, color, Icon }) => (
  <motion.div
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.97 }}
    transition={{ type: "spring", stiffness: 200, damping: 15 }}
    className={`relative overflow-hidden p-4 rounded-2xl shadow-md bg-gradient-to-br ${color} flex flex-col justify-between text-white`}
  >
    {/* Floating Accent */}
    <div className="absolute inset-0 bg-white/10 opacity-20 blur-2xl pointer-events-none" />

    {/* Icon */}
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 bg-white/20 rounded-xl shadow-sm backdrop-blur-md">
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>

    {/* Title & Value */}
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide opacity-90">
        {title}
      </h3>
      <p className="text-3xl font-bold mt-1 drop-shadow-sm">{value}</p>
      <p className="text-[10px] opacity-80 mt-1">{note}</p>
    </div>
  </motion.div>
);

export default function StatCards() {
  const [studentsPresent, setStudentsPresent] = useState(0);
  const [totalActivity, setTotalActivity] = useState(0);
  const [sickLeave, setSickLeave] = useState(0);
  const [officer, setOfficer] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch logged-in user (officer)
  const fetchOfficer = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      setOfficer("Unknown Officer");
      return;
    }

    const meta = data.user.user_metadata || {};
    const email = data.user.email || "";
    let fullName = "";

    if (meta.first_name || meta.last_name) {
      fullName = `${meta.first_name || ""} ${meta.last_name || ""}`.trim();
    } else {
      fullName = email;
    }

    // avoid duplicate email display
    setOfficer(fullName === email ? email : `${fullName} (${email})`);
  };

  // ✅ Fetch stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      const today = new Date().toDateString();

      const res = await fetch("/api/rfid-logs");
      const { logs } = await res.json();
      if (!logs) return;

      const todayLogs = logs.filter(
        (log) => new Date(log.time_stamp).toDateString() === today
      );
      setTotalActivity(todayLogs.length);

      const latestByStudent = new Map();
      for (const log of todayLogs) {
        const studentId = log.student?.id || log.rfid_card?.student?.id;
        if (!studentId) continue;

        const existing = latestByStudent.get(studentId);
        if (
          !existing ||
          new Date(log.time_stamp) > new Date(existing.time_stamp)
        ) {
          latestByStudent.set(studentId, log);
        }
      }

      const insideCount = Array.from(latestByStudent.values()).filter(
        (log) => log.action === "time-in"
      ).length;
      setStudentsPresent(insideCount);

      const { data: sickData } = await supabase
        .from("sick_leave")
        .select("id, date, status");

      const todaySick =
        sickData?.filter(
          (leave) =>
            new Date(leave.date).toDateString() === today &&
            leave.status === "approved"
        ) || [];

      setSickLeave(todaySick.length);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ useEffect hooks
  useEffect(() => {
    fetchOfficer();
    fetchStats();

    const logChannel = supabase
      .channel("realtime-log-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "log" },
        fetchStats
      )
      .subscribe();

    const sickChannel = supabase
      .channel("realtime-sick-leave-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sick_leave" },
        fetchStats
      )
      .subscribe();

    return () => {
      supabase.removeChannel(logChannel);
      supabase.removeChannel(sickChannel);
    };
  }, []);

  if (loading)
    return (
      <div className="text-center py-6 text-gray-400 animate-pulse">
        Loading stats ✨
      </div>
    );

  return (
    <div className="mt-6 px-4 sm:px-6 lg:px-8">
      {/* Officer Info (outside cards) */}
      <div className="mb-4">
        <h3 className="text-gray-700 font-semibold text-sm">Security Officer</h3>
        <p className="text-[#800000] font-bold text-base break-all">{officer}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          title="Students Present"
          value={studentsPresent}
          note="Currently in school"
          color="from-[#800000] via-[#9c1c1c] to-[#b22222]"
          Icon={Users}
        />
        <StatCard
          title="Total Activity"
          value={totalActivity}
          note="Today's attendance logs"
          color="from-[#7b1113] via-[#a82c2c] to-[#c43e3e]"
          Icon={Activity}
        />
        <StatCard
          title="Sick Leave"
          value={sickLeave}
          note="Approved today"
          color="from-[#922b21] via-[#b93a3a] to-[#d94f4f]"
          Icon={HeartPulse}
        />
      </div>
    </div>
  );
}
