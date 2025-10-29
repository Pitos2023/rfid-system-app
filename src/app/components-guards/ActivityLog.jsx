"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [cardNumber, setCardNumber] = useState("");
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState("today");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const filters = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
  ];

  // ✅ Fetch logs from API
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rfid-logs");
      const json = await res.json();
      setLogs(json.logs || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // ✅ Realtime subscription to Supabase "log" table + broadcast listener
  useEffect(() => {
    console.log("🔌 Subscribing to Realtime changes in log table and broadcasts...");

    const channel = supabase
      .channel("log-updates")
      // When any row changes in 'log'
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "log" },
        (payload) => {
          console.log("🪄 Realtime log update received:", payload);
          fetchLogs();
        }
      )
      // Listen for broadcast messages (from consent-response or others)
      .on("broadcast", { event: "log_refresh" }, (payload) => {
        console.log("📡 Broadcast received:", payload);
        fetchLogs();
      })
      .subscribe();

    return () => {
      console.log("❌ Unsubscribing from Realtime log-updates channel...");
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ Legacy fallback (still works with window event)
  useEffect(() => {
    const handleRefresh = () => {
      console.log("🔄 Manual refresh triggered by window event");
      fetchLogs();
    };
    window.addEventListener("refreshLogs", handleRefresh);
    return () => window.removeEventListener("refreshLogs", handleRefresh);
  }, []);

  // ✅ Handle RFID Scan
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
        await new Promise((r) => setTimeout(r, 300));
        await fetchLogs();

        const log = data.log;
        if (log?.student_id) {
          const studentRes = await fetch(`/api/get-student?id=${log.student_id}`);
          if (!studentRes.ok) return;

          const studentJson = await studentRes.json();
          if (studentJson?.student) {
            setScannedStudent(studentJson.student);
            setShowModal(true);
            setTimeout(() => setShowModal(false), 4000);
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

  // Filtering logic
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

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const displayedLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageClick = (page) => setCurrentPage(page);
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 0));

  useEffect(() => {
    setCurrentPage(0);
  }, [filter, logs]);

  return (
    <div className="relative lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-md">
      {/* Modal */}
      {showModal && scannedStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-[420px] sm:w-[500px] text-center transform transition-all animate-fadeIn scale-105">
            <img
              src={scannedStudent.student_pic || "/default-avatar.png"}
              alt="Student"
              className="w-36 h-36 mx-auto rounded-full object-cover mb-4 border-4 border-[#9c1c1c]"
            />
            <h2 className="text-2xl font-bold text-[#800000]">
              {scannedStudent.first_name} {scannedStudent.last_name}
            </h2>
            <p className="text-gray-600 text-base mt-1">
              {scannedStudent.grade_level} - {scannedStudent.section}
            </p>
            <p className="text-[#58181F] mt-4 font-medium text-lg">
              ✅ Successfully Scanned!
            </p>
          </div>
        </div>
      )}

      {/* Header / Filter */}
      <div className="p-6 border-b border-[#9c1c1c] flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
        <h3 className="text-2xl font-bold text-[#800000]">RFID Activity Log</h3>

        {/* Desktop buttons */}
        <div className="hidden sm:flex space-x-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                filter === f.key
                  ? "bg-[#800000] text-white border-[#800000]"
                  : "bg-white text-[#800000] border-[#9c1c1c] hover:bg-[#f5dada]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Mobile dropdown */}
        <div className="sm:hidden relative w-full max-w-xs">
          <button
            onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
            className="w-full text-left px-4 py-2 border rounded-lg bg-white border-[#9c1c1c] text-[#800000] font-medium focus:outline-none"
          >
            {filters.find((f) => f.key === filter)?.label}
          </button>
          {mobileDropdownOpen && (
            <div className="absolute mt-1 w-full bg-white border border-[#9c1c1c] rounded-lg shadow-lg z-50">
              {filters
                .filter((f) => f.key !== filter)
                .map((f) => (
                  <button
                    key={f.key}
                    onClick={() => {
                      setFilter(f.key);
                      setMobileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[#800000] hover:bg-[#f5dada] transition"
                  >
                    {f.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Scan Input */}
      <div className="p-6 border-b border-[#9c1c1c]">
        <form onSubmit={handleScan} className="flex gap-3 flex-col sm:flex-row">
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="Scan RFID..."
            autoFocus
            className="w-full border border-[#9c1c1c] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000]"
          />
          <button
            type="submit"
            disabled={scanning}
            className="bg-[#800000] text-white px-5 py-2 rounded-lg hover:bg-[#9c1c1c] transition disabled:bg-gray-400"
          >
            {scanning ? "Scanning..." : "Submit"}
          </button>
        </form>
      </div>

      {/* Logs Table */}
      <div className="p-6 overflow-x-auto">
        {loading ? (
          <p className="text-gray-500 text-sm text-center py-6">Loading logs...</p>
        ) : displayedLogs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">
            No activity found for {filter}.
          </p>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#f5dada]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#800000]">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#800000]">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#800000]">
                    Grade & Section
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#800000]">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#800000]">
                    Consent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {displayedLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 flex items-center gap-3">
                      {log.student?.student_pic ? (
                        <img
                          src={log.student.student_pic}
                          alt="Student"
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#9c1c1c]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                          N/A
                        </div>
                      )}
                      <p className="font-semibold text-[#58181F]">
                        {log.student
                          ? `${log.student.first_name} ${log.student.last_name}`
                          : "Unknown Student"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[#58181F]">
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
                    <td className="px-4 py-3 text-sm text-[#58181F]">
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
                    <td className="px-4 py-3 font-semibold">
                      <span
                        className={`${
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

            {/* Pagination */}
            <div className="flex justify-center items-center mt-4 space-x-2">
              <button
                onClick={handlePrev}
                disabled={currentPage === 0}
                className="px-3 py-1 bg-[#800000] text-white rounded-lg disabled:opacity-50"
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePageClick(idx)}
                  className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                    idx === currentPage
                      ? "bg-[#800000] text-white font-semibold scale-105"
                      : "bg-[#F4E4E4] border border-[#800000] text-[#800000] hover:bg-[#ffd6d6]"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-1 bg-[#800000] text-white rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-in-out;
        }
      `}</style>
    </div>
  );
}
