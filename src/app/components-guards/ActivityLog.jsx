"use client";

import { useState, useEffect } from "react";

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [cardNumber, setCardNumber] = useState("");
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState("today");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch logs with joined student data
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rfid-logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // ✅ Handle RFID scanning
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

      const data = await res.json();
      if (data.log) {
        setLogs((prev) => [data.log, ...prev]);
      }
      setCardNumber("");
    } catch (err) {
      alert("Error scanning: " + err.message);
    } finally {
      setScanning(false);
    }
  };

  // ✅ Filter logic
  const now = new Date();
  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.time_stamp);
    if (filter === "today") {
      return logDate.toDateString() === now.toDateString();
    } else if (filter === "week") {
      const diff = (now - logDate) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    } else if (filter === "month") {
      return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  return (
    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header */}
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
              {f === "today" ? "Today" : f === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {/* Scan Form */}
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

      {/* Table */}
      <div className="p-6 overflow-x-auto">
        {loading ? (
          <p className="text-gray-500 text-sm text-center py-6">Loading logs...</p>
        ) : filteredLogs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">
            No activity found for {filter}.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Grade & Section</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Consent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  {/* Student Name */}
                  <td className="px-4 py-3">
                    <p className="font-semibold text-black">
                      {log.student?.first_name && log.student?.last_name
                        ? `${log.student.first_name} ${log.student.last_name}`
                        : "Unknown Student"}
                    </p>
                  </td>

                  {/* Date & Time */}
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

                  {/* Grade & Section */}
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {log.student
                      ? `${log.student.grade_level || "-"} - ${log.student.section || "-"}`
                      : "-"}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 font-semibold text-green-600">{log.action || "-"}</td>

                  {/* Consent */}
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
