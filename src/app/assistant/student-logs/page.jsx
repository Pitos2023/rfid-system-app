"use client";

import { useState, useEffect } from "react";
import BackButton from "../../components-assistant/BackButton";

const sampleLogs = [
  {
    id: 1,
    name: "Juan Santos",
    grade: "Grade 9-A",
    avatar: "https://i.pravatar.cc/50?img=1",
    date: "Sep 2, 2025",
    time: "10:15 AM",
    consent: "Approved",
  },
  {
    id: 2,
    name: "Ana Santos",
    grade: "Grade 7-B",
    avatar: "https://i.pravatar.cc/50?img=2",
    date: "Sep 2, 2025",
    time: "10:15 AM",
    consent: "Denied",
  },
  {
    id: 3,
    name: "Miguel Rodriguez",
    grade: "Grade 10-C",
    avatar: "https://i.pravatar.cc/50?img=3",
    date: "Sep 2, 2025",
    time: "10:15 AM",
    consent: "Approved",
  },
];

export default function StudentLogsPage() {
  const [filter, setFilter] = useState("today");
  const [time, setTime] = useState("--:--:--");
  const [date, setDate] = useState("Loading...");

  // real-time clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false }));
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = sampleLogs; // placeholder for future filtering

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔹 Header */}
      <header className="bg-[#58181F] p-3 shadow-md flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">My.SPC</h1>
        <div className="text-right">
          <p className="text-white text-2xl font-bold">{time}</p>
          <p className="text-white text-sm">{date}</p>
        </div>
      </header>

      <div className="mt-4 ml-4">
        <BackButton />
      </div>

      {/* 🔹 Content */}
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-md border border-gray-200">
          {/* Title + Filters */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-black">Complete Activity Log</h2>
            <div className="flex space-x-3">
              {["today", "week", "month"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium border ${
                    filter === f
                      ? "bg-[#58181F] text-white border-[#58181F]"
                      : "bg-white text-black border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {f === "today" ? "Today" : f === "week" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold text-black">Student</th>
                  <th className="px-6 py-4 font-semibold text-black">Date & Time</th>
                  <th className="px-6 py-4 font-semibold text-black">Consent</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 flex items-center space-x-4">
                      <img
                        src={log.avatar}
                        alt={log.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-bold text-black">{log.name}</p>
                        <p className="text-sm text-black">{log.grade}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-black">
                      <p className="text-black">{log.date}</p>
                      <p className="text-sm text-black">{log.time}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-bold ${
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
          </div>
        </div>
      </div>
    </div>
  );
}
