"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [cardNumber, setCardNumber] = useState("");
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState("today");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch logs safely
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rfid-logs");
      const text = await res.text();

      if (!text) throw new Error("Empty response from server");

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON from /api/rfid-logs");
      }

      if (!res.ok) throw new Error(data.error || "Failed to fetch logs");
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Subscribe to realtime updates
  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel("realtime-log")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "log" },
        fetchLogs
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ Handle RFID Scan
  const handleScan = async (e) => {
    e.preventDefault();
    if (!cardNumber) return;

    setScanning(true);
    try {
      const res = await fetch("/api/rfid-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_number: cardNumber }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (data.success && data.log) {
        setLogs((prev) => [data.log, ...prev]);

        // ✅ Get parent user from Supabase
        const { data: parent } = await supabase
          .from("users")
          .select("id, name, fcm_token")
          .eq("role", "parent")
          .eq("child_id", data.log.student_id) // Adjust if your relation field is different
          .single();

        if (parent) {
          const title = `${data.log.student?.first_name || "A student"} just ${
            data.log.action
          }`;
          const message = `${
            data.log.student?.first_name || "The student"
          } ${data.log.student?.last_name || ""} has ${
            data.log.action
          } at ${new Date(data.log.time_stamp).toLocaleTimeString()}.`;

          // ✅ Store notification in Supabase
          await supabase.from("notifications").insert([
            {
              user_id: parent.id,
              log_id: data.log.id,
              title,
              message,
              type: "info",
            },
          ]);

          // ✅ Send Firebase Push Notification
          await fetch("/api/send-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: parent.fcm_token,
              title,
              message,
            }),
          });
        }
      } else if (data.error) {
        alert(data.error);
      }

      setCardNumber("");
    } catch (err) {
      console.error("Error scanning:", err);
      alert("Error scanning: " + err.message);
    } finally {
      setScanning(false);
    }
  };

  // ✅ Filter logs for Today / Week / Month
  const now = new Date();
  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.time_stamp);
    if (filter === "today") {
      return logDate.toDateString() === now.toDateString();
    } else if (filter === "week") {
      const diff = (now - logDate) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    } else if (filter === "month") {
      return (
        logDate.getMonth() === now.getMonth() &&
        logDate.getFullYear() === now.getFullYear()
      );
    }
    return true;
  });

  // ✅ Component UI
  return (
    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-2xl font-bold text-black">RFID Activity Log</h3>
        <div className="flex space-x-2">
          {["today", "week", "month"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                filter === f
                  ? "bg-[#58181F] text-white border-[#58181F]"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {f === "today"
                ? "Today"
                : f === "week"
                ? "This Week"
                : "This Month"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 border-b border-gray-200">
        <form onSubmit={handleScan} className="flex gap-3">
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="Scan RFID..."
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#58181F]"
          />
          <button
            type="submit"
            disabled={scanning}
            className="bg-[#58181F] text-white px-5 py-2 rounded-lg hover:bg-[#702029] transition disabled:bg-gray-400"
          >
            {scanning ? "Scanning..." : "Submit"}
          </button>
        </form>
      </div>

      <div className="p-6 overflow-x-auto">
        {loading ? (
          <p className="text-gray-500 text-sm text-center py-6">
            Loading logs...
          </p>
        ) : filteredLogs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">
            No activity found for {filter}.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Date & Time
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Grade & Section
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Consent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-black">
                      {log.student
                        ? `${log.student.first_name} ${log.student.last_name}`
                        : "Unknown Student"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-black">
                      {new Date(log.time_stamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.time_stamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {log.student
                      ? `${log.student.grade_level || "-"} - ${
                          log.student.section || "-"
                        }`
                      : "-"}
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${
                      log.action === "time-in"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {log.action || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        log.consent ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {log.consent ? "✔ Yes" : "❌ No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
