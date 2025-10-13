"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Client-side Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function StudentLogsPage() {
  const [logs, setLogs] = useState([]);

  // Format timestamp
  const formatTime = (ts) =>
    new Date(ts).toLocaleString("en-PH", { hour12: true });

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data: logsData, error } = await supabase
          .from("log")
          .select("id, action, consent, time_stamp, rfid_card(card_number)")
          .order("time_stamp", { ascending: false })
          .limit(10);

        if (!error && logsData) setLogs(logsData);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      }
    };

    fetchLogs();

    // ✅ Realtime subscription
    const subscription = supabase
      .channel("public:log")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "log" },
        async (payload) => {
          try {
            const { data: newLog } = await supabase
              .from("log")
              .select("id, action, consent, time_stamp, rfid_card(card_number)")
              .eq("id", payload.new.id)
              .maybeSingle();

            if (newLog) setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
          } catch (err) {
            console.error("Failed to fetch new log:", err);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  return (
    <div className="p-6 text-black">
      <h1 className="text-2xl font-bold mb-4">View Student Logs</h1>

      <table className="w-full border border-gray-300 text-left text-black">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Timestamp</th>
            <th className="p-2 border">RFID Card</th>
            <th className="p-2 border">Action</th>
            <th className="p-2 border">Consent</th>
          </tr>
        </thead>
        <tbody>
  {logs.length === 0 ? (
    <tr>
      <td colSpan="4" className="text-center p-3 text-gray-500">
        No scans yet
      </td>
    </tr>
  ) : (
    logs.map((log) => (
      <tr key={log.id}>
        <td className="p-2 border">{formatTime(log.time_stamp)}</td>
        <td className="p-2 border">{log.rfid_card?.card_number || "N/A"}</td>
        <td
          className={`p-2 border font-semibold ${
            log.action === "time-in"
              ? "text-green-600"
              : log.action === "time-out"
              ? "text-red-600"
              : ""
          }`}
        >
          {log.action}
        </td>
        <td className="p-2 border">{log.consent ? "✅ Yes" : "❌ No"}</td>
      </tr>
    ))
  )}
</tbody>

      </table>
    </div>
  );
}
