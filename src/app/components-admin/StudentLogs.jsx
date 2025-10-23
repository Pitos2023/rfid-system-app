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
      <h1 className="text-2xl font-bold mb-4 text-[#800000]">View Student Logs</h1>

      <table className="w-full border border-[#800000] text-left text-black">
        <thead>
          <tr className="bg-[#f5e6e6] text-[#800000]">
            <th className="p-2 border border-[#800000]">Timestamp</th>
            <th className="p-2 border border-[#800000]">RFID Card</th>
            <th className="p-2 border border-[#800000]">Action</th>
            <th className="p-2 border border-[#800000]">Consent</th>
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
            logs.map((log) => {
              // Normalize action
              const actionNormalized =
                log.action?.toLowerCase().replace("_", "-") || "";

              return (
                <tr key={log.id} className="hover:bg-[#fbe6e6] transition-colors">
                  <td className="p-2 border border-[#800000]">{formatTime(log.time_stamp)}</td>
                  <td className="p-2 border border-[#800000]">{log.rfid_card?.card_number || "N/A"}</td>
                  <td
                    className={`p-2 border border-[#800000] font-semibold ${
                      actionNormalized === "time-in"
                        ? "text-green-600"
                        : actionNormalized === "time-out"
                        ? "text-[#800000]"
                        : "text-gray-700"
                    }`}
                  >
                    {actionNormalized === "time-in"
                      ? "Time In"
                      : actionNormalized === "time-out"
                      ? "Time Out"
                      : log.action}
                  </td>
                  <td className="p-2 border border-[#800000]">
                    {log.consent ? "✅ Yes" : "❌ No"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
