"use client";

import { useState, useEffect, useRef } from "react";

export default function ActivityLog({ user, setView }) {
  const [students, setStudents] = useState([]);
  const [studentLogs, setStudentLogs] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  // Fetch students for parent
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/student?select=id,first_name,last_name,grade_level,section,users_id&users_id=eq.${user.id}`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
          }
        );
        const data = await res.json();
        setStudents(data || []);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };

    if (user?.id) fetchStudents();
  }, [user]);

  // Fetch logs from API
  const fetchStudentLogs = async (studentId) => {
    setLoading(true);
    try {
      const res = await fetch("/api/rfid-logs");
      const { logs, error } = await res.json();

      if (error) {
        console.error("Error fetching logs:", error);
        setStudentLogs([]);
      } else {
        const filtered = logs.filter(
          (log) => log.student && log.student.id === studentId
        );
        setStudentLogs(filtered);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      setStudentLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    await fetchStudentLogs(student.id);
    setShowModal(true);

    // 🌀 Start polling every 5 seconds to auto-update logs
    intervalRef.current = setInterval(() => {
      fetchStudentLogs(student.id);
    }, 5000);
  };

  // 🧹 Cleanup interval when modal closes
  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    clearInterval(intervalRef.current);
  };

  return (
    <div id="activityView" className="p-6">
      <button
        onClick={() => setView("dashboard")}
        className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
      >
        ← Back to Students
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Activity Log</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  Grade & Section
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => handleStudentClick(s)}
                  className="hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {s.first_name} {s.last_name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {s.grade_level} - {s.section}
                  </td>
                  <td className="px-6 py-4 text-blue-600 font-semibold">
                    View Logs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between border-b pb-3">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedStudent?.first_name}'s Activity Log
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-800 text-xl"
              >
                &times;
              </button>
            </div>

            {loading ? (
              <p className="text-center text-gray-500 py-6">Loading logs...</p>
            ) : studentLogs.length > 0 ? (
              <table className="w-full mt-4 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Date & Time
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Action
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Consent
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      RFID Card #
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {studentLogs.map((log) => (
                    <tr key={log.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">
                        {new Date(log.time_stamp).toLocaleString()}
                      </td>
                      <td
                        className={`px-4 py-2 text-sm font-medium ${
                          log.action === "Time In"
                            ? "text-green-600"
                            : log.action === "Time Out"
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      >
                        {log.action}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {log.consent ? (
                          <span className="text-green-600">Approved</span>
                        ) : (
                          <span className="text-red-600">Denied</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {log.rfid_card?.card_number || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-600 mt-4 text-center">No logs found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
