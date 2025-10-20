"use client";

import { useState, useEffect } from "react";

export default function ActivityLog({ user }) {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/rfid-logs");
        const data = await res.json();
        console.log("✅ Logs fetched:", data);

        if (Array.isArray(data.logs)) {
          const filtered = data.logs.filter(
            (log) => log.student?.users_id === user?.id
          );
          setLogs(filtered);
        } else {
          console.error("Unexpected logs format:", data);
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user?.id]);

  if (loading)
    return <p className="p-6 text-gray-500">Loading student activity...</p>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">


      <div className="flex gap-2 mb-4">
        {["today", "week", "month"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md border text-sm font-medium ${
              filter === f
                ? "bg-[#541212] text-white"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {f === "today" ? "Today" : f === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Date & Time</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Grade & Section</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Consent</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="py-6 text-center text-gray-500 italic"
                >
                  No activity found for {filter === "today" ? "today" : filter}.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                // ✅ Normalize value to handle "time_in", "time-in", "Time In"
                const actionValue = log.action?.toLowerCase().replace("_", "-");

                return (
                  <tr
                    key={log.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-gray-800">
                      {`${log.student?.first_name || ""} ${
                        log.student?.last_name || ""
                      }`}
                    </td>

                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {new Date(log.time_stamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(log.time_stamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-gray-700">
                      Grade {log.student?.grade_level} - {log.student?.section}
                    </td>

                    <td
                      className={`py-3 px-4 font-semibold ${
                        actionValue === "time-in"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {actionValue === "time-in" ? "Time In" : "Time Out"}
                    </td>

                    <td className="py-3 px-4 font-semibold flex items-center gap-1">
                      {log.consent ? (
                        <span className="text-green-600">✔ Yes</span>
                      ) : (
                        <span className="text-red-600">✘ No</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
