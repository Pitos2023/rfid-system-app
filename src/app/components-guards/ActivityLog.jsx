"use client";

import { useState, useEffect } from "react";

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [cardNumber, setCardNumber] = useState("");
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState("today");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);

  // ✅ Fetch logs from API
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rfid-logs");
      const json = await res.json();
      setLogs(json.logs || []);
    } catch (err) {
      console.error("❌ Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load logs when page loads
  useEffect(() => {
    fetchLogs();
  }, []);

  // ✅ Handle RFID scan
  const handleScan = async (e) => {
    e.preventDefault();
    if (!cardNumber.trim()) return;

    setScanning(true);
    try {
      const res = await fetch("/api/rfid-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_number: cardNumber }),
      });

      const data = await res.json();

      if (data.success) {
        // Wait briefly for database updates
        await new Promise((r) => setTimeout(r, 300));
        await fetchLogs();

        // ✅ Fetch student details (based on log student_id)
        const log = data.log;
        if (log?.student_id) {
          const studentRes = await fetch(`/api/get-student?id=${log.student_id}`);
          if (!studentRes.ok) {
            console.error("❌ Failed to fetch student:", studentRes.status);
            return;
          }

          const studentJson = await studentRes.json();
          if (studentJson?.student) {
            setScannedStudent(studentJson.student);
            setShowModal(true);
            setTimeout(() => setShowModal(false), 4000); // Auto-close in 4s
          }
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

  // ✅ Apply filters
  const now = new Date();
  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.time_stamp);
    if (filter === "today") return logDate.toDateString() === now.toDateString();
    if (filter === "week") return (now - logDate) / (1000 * 60 * 60 * 24) <= 7;
    if (filter === "month")
      return (
        logDate.getMonth() === now.getMonth() &&
        logDate.getFullYear() === now.getFullYear()
      );
    return true;
  });

  return (
    <div className="relative lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* ✅ MODAL: Enlarged student info */}
      {showModal && scannedStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-[420px] sm:w-[500px] text-center transform transition-all animate-fadeIn scale-105">
            <img
              src={scannedStudent.student_pic || "/default-avatar.png"}
              alt="Student"
              className="w-36 h-36 mx-auto rounded-full object-cover mb-4 border-4 border-[#58181F]"
            />
            <h2 className="text-2xl font-bold text-gray-900">
              {scannedStudent.first_name} {scannedStudent.last_name}
            </h2>
            <p className="text-gray-600 text-base mt-1">
              {scannedStudent.grade_level} - {scannedStudent.section}
            </p>
            <p className="text-gray-700 mt-4 font-medium text-lg">
              ✅ Successfully Scanned!
            </p>
          </div>
        </div>
      )}

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

      {/* RFID Scan Input */}
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

      {/* Logs Table */}
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
                  <td className="px-4 py-3 flex items-center gap-3">
                    {log.student?.student_pic ? (
                      <img
                        src={log.student.student_pic}
                        alt="Student"
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                        N/A
                      </div>
                    )}
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
                      log.action === "time-in" ? "text-green-600" : "text-red-600"
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
