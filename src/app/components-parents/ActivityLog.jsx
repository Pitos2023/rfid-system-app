"use client";

import { useState, useEffect } from "react";

export default function ActivityLog({ user }) {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]); // New state for filtered logs
  const [filter, setFilter] = useState("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/rfid-logs");
        const data = await res.json();
        console.log("✅ Logs fetched:", data);

        if (data?.success && Array.isArray(data.logs)) {
          // Filter logs belonging to this parent’s student(s)
          const filtered = data.logs.filter(
            (log) => log.student?.users_id === user?.id
          );
          setLogs(filtered); // Save the full logs to state
        } else {
          console.error("Unexpected logs format:", data);
        }
      } catch (err) {
        console.error("❌ Error fetching logs:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchLogs();
  }, [user?.id]);

  useEffect(() => {
    if (logs.length > 0) {
      const filterLogs = () => {
        const now = new Date();
        let filteredLogs;

        switch (filter) {
          case "today":
            filteredLogs = logs.filter((log) => {
              const logDate = new Date(log.time_stamp);
              return logDate.toDateString() === now.toDateString();
            });
            break;
          case "week":
            filteredLogs = logs.filter((log) => {
              const logDate = new Date(log.time_stamp);
              const diffTime = now - logDate;
              const diffDays = diffTime / (1000 * 3600 * 24);
              return diffDays <= 7;
            });
            break;
          case "month":
            filteredLogs = logs.filter((log) => {
              const logDate = new Date(log.time_stamp);
              return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
            });
            break;
          default:
            filteredLogs = logs;
        }

        setFilteredLogs(filteredLogs); // Apply filter and update the filteredLogs state
      };

      filterLogs();
    }
  }, [filter, logs]); // Depend on filter and logs, but only update filteredLogs

  if (loading)
    return <p className="p-6 text-gray-500">Loading student activity...</p>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      {/* Filter Buttons */}
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

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Student
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Date & Time
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Grade & Section
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Action
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Consent
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-6 text-center text-gray-500 italic">
                  No activity found for {filter === "today" ? "today" : filter}.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const actionValue = log.action?.toLowerCase().replace("_", "-");

                return (
                  <tr
                    key={log.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    {/* ✅ Student with Image */}
                    <td className="py-3 px-4 flex items-center gap-3">
                      {log.student?.student_pic ? (
                        <img
                          src={log.student.student_pic}
                          alt={`${log.student.first_name} ${log.student.last_name}`}
                          className="w-10 h-10 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                          {log.student?.first_name?.[0] || "?"}
                        </div>
                      )}
                      <div className="font-bold text-gray-800">
                        {`${log.student?.first_name || ""} ${
                          log.student?.last_name || ""
                        }`}
                      </div>
                    </td>

                    {/* Date & Time */}
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

                    {/* Grade & Section */}
                    <td className="py-3 px-4 text-gray-700">
                      {log.student?.grade_level} - {log.student?.section}
                    </td>

                    {/* Action */}
                    <td
                      className={`py-3 px-4 font-semibold ${
                        actionValue === "time-in"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {actionValue === "time-in" ? "Time In" : "Time Out"}
                    </td>

                    {/* Consent */}
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
