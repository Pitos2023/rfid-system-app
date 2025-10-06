"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  sampleStudents,
  filterToday,
  filterThisWeek,
  filterThisMonth,
} from "./utils";

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("today");

  useEffect(() => {
    // generate some fake logs
    const initial = Array.from({ length: 12 }).map((_, i) => {
      const student =
        sampleStudents[Math.floor(Math.random() * sampleStudents.length)];
      const action = Math.random() > 0.5 ? "entry" : "exit";
      const consent = Math.random() > 0.5 ? "Approved" : "Denied"; // ✅ add consent
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 10)); // random day within 10 days

      return {
        id: i,
        student,
        action,
        consent,
        date: date.toISOString().split("T")[0], // YYYY-MM-DD
        time: date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    });
    setLogs(initial);
  }, []);

  // ✅ Apply filter (keep your original)
  let filteredLogs = [];
  if (filter === "today") {
    filteredLogs = filterToday(logs);
  } else if (filter === "week") {
    filteredLogs = filterThisWeek(logs);
  } else if (filter === "month") {
    filteredLogs = filterThisMonth(logs);
  }

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
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                filter === f
                  ? "bg-[#58181F] text-white border-blue-500"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
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
        {filteredLogs.length === 0 ? (
          <p className="text-gray-500 text-sm">
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
                  {/* Student */}
                  <td className="px-4 py-3 flex items-center space-x-3">
                    <Image
                      src={log.student.avatar}
                      alt={log.student.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-black">
                        {log.student.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Grade {log.student.grade}
                      </p>
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-black">
                      {new Date(log.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-500">{log.time}</p>
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
                      {log.consent}
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
