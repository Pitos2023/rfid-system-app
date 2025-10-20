"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

export default function Students({ user }) {
  const [students, setStudents] = useState([]);
  const [studentLogs, setStudentLogs] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const intervalRef = useRef(null);

  // ✅ Show custom popup for notifications on first login
  useEffect(() => {
    if (typeof window !== "undefined" && user?.id) {
      const alreadyAsked = localStorage.getItem("notifPromptShown");
      if (!alreadyAsked) {
        setShowNotifPrompt(true);
      }
    }
  }, [user?.id]);

  // ✅ Register OneSignal and save player ID
  const registerOneSignal = async () => {
    if (typeof window === "undefined" || !user?.id) return;

    if (!window.OneSignal) {
      const s = document.createElement("script");
      s.src = "https://cdn.onesignal.com/sdks/OneSignalSDK.js";
      s.async = true;
      document.head.appendChild(s);
      await new Promise((res) => (s.onload = res));
    }

    window.OneSignal = window.OneSignal || [];
    window.OneSignal.push(function () {
      window.OneSignal.init({
        appId: process.env.NEXT_PUBLIC_ONE_SIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
      });

      if (window.OneSignal.showNativePrompt) window.OneSignal.showNativePrompt();

      window.OneSignal.getUserId(async function (playerId) {
        if (!playerId) return;
        try {
          const { error } = await supabase
            .from("users")
            .update({ onesignal_player_id: playerId })
            .eq("id", user.id);
          if (error)
            console.error("❌ Failed to save OneSignal player id:", error);
          else console.log("✅ Saved OneSignal player id:", playerId);
        } catch (err) {
          console.error("❌ Error saving player id:", err);
        }
      });
    });
  };

  // ✅ Handle user click on “Allow Notifications”
  const handleAllowNotifications = async () => {
    setShowNotifPrompt(false);
    localStorage.setItem("notifPromptShown", "true");
    await registerOneSignal();
  };

  const handleIgnoreNotifications = () => {
    setShowNotifPrompt(false);
    localStorage.setItem("notifPromptShown", "true");
  };

  // ✅ Fetch all students (updated: now includes student_pic)
  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.id) return;
      setLoadingStudents(true);

      const { data, error } = await supabase
        .from("student")
        .select(
          "id, first_name, last_name, school_id, grade_level, section, birthdate, student_pic"
        )
        .eq("users_id", user.id);

      if (error) {
        console.error("Error fetching students:", error.message);
        setStudents([]);
      } else {
        setStudents(data || []);
      }

      setLoadingStudents(false);
    };

    fetchStudents();
  }, [user]);

  // ✅ Fetch logs for selected student
  const fetchStudentLogs = async (studentId) => {
    setLoadingLogs(true);
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
      console.error("Failed to fetch student logs:", err);
      setStudentLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleViewLogs = async (student) => {
    setSelectedStudent(student);
    await fetchStudentLogs(student.id);
    setShowModal(true);

    // auto-refresh logs every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchStudentLogs(student.id);
    }, 5000);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    clearInterval(intervalRef.current);
  };

  // ✅ UI
  if (loadingStudents)
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <p className="text-gray-600 text-lg">Loading your students...</p>
      </div>
    );

  if (students.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <p className="text-gray-500 text-lg">
          No students assigned to your account yet.
        </p>
      </div>
    );

  return (
    <div id="studentsView" className="p-6">
      {/* 🧩 Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {students.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
          >
            <div className="p-8 text-center border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow overflow-hidden">
                {s.student_pic ? (
                  <img
                    src={s.student_pic}
                    alt={`${s.first_name} ${s.last_name}`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm bg-gray-100">
                    No Image
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                {s.first_name} {s.last_name}
              </h3>
              <p className="text-gray-600">
                Grade {s.grade_level} - {s.section}
              </p>
            </div>

            <div className="p-7">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Student ID
                  </label>
                  <p className="text-gray-800 font-semibold">{s.school_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Birthdate
                  </label>
                  <p className="text-gray-800 font-semibold">
                    {s.birthdate
                      ? new Date(s.birthdate).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleViewLogs(s)}
                className="w-full bg-[#58181F] text-white py-3 rounded-lg font-semibold shadow hover:bg-[#6d2029] transition-colors"
              >
                View Activity Log
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 🧩 Modal for logs */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-2xl p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
              {selectedStudent.first_name} {selectedStudent.last_name} — Logs
            </h2>

            {loadingLogs ? (
              <p className="text-center text-gray-500">Loading logs...</p>
            ) : studentLogs.length === 0 ? (
              <p className="text-center text-gray-500">
                No logs found for this student.
              </p>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
                {studentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex justify-between items-center py-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 capitalize">
                        {log.action.replace("_", " ")}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {new Date(log.time_stamp).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        log.action.includes("in")
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {log.action.includes("in") ? "IN" : "OUT"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🧩 Notification popup */}
      {showNotifPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-[90%] max-w-md text-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Enable Notifications?
            </h2>
            <p className="text-gray-600 mb-6">
              Would you like to receive notifications when your student scans in
              or out?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleAllowNotifications}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Allow Notifications
              </button>
              <button
                onClick={handleIgnoreNotifications}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
