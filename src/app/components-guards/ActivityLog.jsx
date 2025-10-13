"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

// ✅ initialize Supabase client (client-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("today");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch logs from Supabase (including student info)
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("log")
          .select(
            `
            id,
            created_at,
            type,
            consent,
            student:student_id (
              name,
              grade_level,
              section,
              profile_pic
            )
          `
          )
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error("Error fetching logs:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // ✅ Filtering logic
  const now = new Date();
  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.created_at);
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

  return (
    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-2xl font-bold text-black">
          Complete Activity Log
        </h3>
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

      {/* Table */}
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
                  Consent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  {/* Student info */}
                  <td className="px-4 py-3 flex items-center space-x-3">
                    <Image
                      src={
                        log.student?.profile_pic ||
                        "/default-avatar.png"
                      }
                      alt={log.student?.name || "Student"}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-black">
                        {log.student?.name || "Unknown Student"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Grade {log.student?.grade_level || "?"} -{" "}
                        {log.student?.section || "?"}
                      </p>
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-black">
                      {new Date(log.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </td>

                  {/* Consent */}
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        log.consent === "Approved"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {log.consent || "Pending"}
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
