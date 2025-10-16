"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ✅ Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- Stat card UI
const StatCard = ({ title, value, note, color, icon }) => (
  <div
    className={`p-6 rounded-2xl shadow-md ${color} flex flex-col items-start justify-center transition-all hover:scale-[1.02]`}
  >
    <div className="text-4xl mb-2">{icon}</div>
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-3xl font-bold">{value}</p>
    <p className="text-sm text-gray-600 mt-1">{note}</p>
  </div>
);

export default function StatCards() {
  const [studentsPresent, setStudentsPresent] = useState(0);
  const [totalActivity, setTotalActivity] = useState(0);
  const [sickLeave, setSickLeave] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch live stats using your /api/rfid-logs
  const fetchStats = async () => {
    try {
      setLoading(true);
      const today = new Date().toDateString();

      // Fetch logs (joined with student info)
      const res = await fetch("/api/rfid-logs");
      const { logs } = await res.json();

      if (!logs) return;

      const todayLogs = logs.filter(
        (log) => new Date(log.time_stamp).toDateString() === today
      );

      // Total activity = all logs for today
      setTotalActivity(todayLogs.length);

      // Group latest log per student
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

      // Count students currently "time-in"
      const insideCount = Array.from(latestByStudent.values()).filter(
        (log) => log.action === "time-in"
      ).length;

      setStudentsPresent(insideCount);

      // Fetch sick leave data
      const { data: sickData, error: sickError } = await supabase
        .from("sick_leave")
        .select("id, date, status");

      if (!sickError && sickData) {
        const todaySick = sickData.filter(
          (leave) =>
            new Date(leave.date).toDateString() === today &&
            leave.status === "approved"
        );
        setSickLeave(todaySick.length);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Setup realtime updates
  useEffect(() => {
    fetchStats(); // initial load

    // Listen to "log" changes
    const logChannel = supabase
      .channel("realtime-log-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "log" },
        async () => {
          console.log("🔁 Log changed — refreshing stats...");
          await fetchStats();
        }
      )
      .subscribe();

    // Listen to "sick_leave" changes
    const sickChannel = supabase
      .channel("realtime-sick-leave-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sick_leave" },
        async () => {
          console.log("🤒 Sick leave changed — refreshing stats...");
          await fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(logChannel);
      supabase.removeChannel(sickChannel);
    };
  }, []);

  if (loading)
    return (
      <div className="text-center text-gray-500 py-10 text-sm">
        Loading stats...
      </div>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      <StatCard
        title="Students Present"
        value={studentsPresent}
        note="Currently In School"
        color="bg-green-100"
        icon="👥"
      />
      <StatCard
        title="Total Activity"
        value={totalActivity}
        note="Today's Logs"
        color="bg-blue-100"
        icon="📊"
      />
      <StatCard
        title="Sick Leave"
        value={sickLeave}
        note="Approved Today"
        color="bg-red-100"
        icon="🤒"
      />
    </div>
  );
}
