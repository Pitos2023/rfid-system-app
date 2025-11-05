"use client";

import { useState, useEffect, useRef } from "react";
import { createScopedClient } from "../supabaseClient";

export default function Students({ user }) {
  const role = (typeof window !== "undefined" && sessionStorage.getItem("role")) || "parent";
  const supabase = createScopedClient(role);
  const [students, setStudents] = useState([]);
  const [studentLogs, setStudentLogs] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const intervalRef = useRef(null);

  // ✅ Initialize OneSignal v16 and save player ID to Supabase
  useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return;

    const existingScript = document.querySelector(
      'script[src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => initOneSignal();
    } else {
      initOneSignal();
    }

    async function initOneSignal() {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal) {
        if (OneSignal.initialized) return;

        await OneSignal.init({
          appId: "4bdfec2a-071e-4173-a4ba-09f512c2227a",
          allowLocalhostAsSecureOrigin: true,
        });

        OneSignal.initialized = true;
        console.log("✅ OneSignal initialized");

        // 🔔 When permission changes to granted, save the player ID
        OneSignal.Notifications.addEventListener("permissionChange", async (event) => {
          console.log("🔔 Permission changed:", event.to);
          if (event.to === "granted") {
            await savePlayerId(OneSignal);
          }
        });

        // Also try saving if already subscribed
        await savePlayerId(OneSignal);
      });
    }

    async function savePlayerId(OneSignal, retries = 0) {
      try {
        const playerId = await OneSignal.User.PushSubscription.id;

        if (!playerId) {
          if (retries < 5) {
            console.warn(`⚠️ Player ID not yet available — retrying (${retries + 1}/5)...`);
            setTimeout(() => savePlayerId(OneSignal, retries + 1), 3000);
          } else {
            console.error("❌ Failed to get OneSignal Player ID after multiple retries.");
          }
          return;
        }

        console.log("✅ OneSignal Player ID:", playerId);

        const { error } = await supabase
          .from("users")
          .update({ onesignal_player_id: playerId })
          .eq("id", user.id);

        if (error) console.error("❌ Failed to save OneSignal ID:", error);
        else console.log("✅ OneSignal ID saved successfully to Supabase!");
      } catch (err) {
        console.error("❌ Error getting OneSignal Player ID:", err);
      }
    }
  }, [user?.id]);

  // ✅ Ensure that user role is persisted correctly without overwriting
  useEffect(() => {
    if (user?.id && !sessionStorage.getItem("role")) {
      const fetchUserRole = async () => {
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user role:", error);
        } else {
          const role = data?.role || "parent";  // Default to 'parent' if no role found
          sessionStorage.setItem("role", role); // Persist role in sessionStorage if not already set
          console.log("User role:", role);
        }
      };

      fetchUserRole();
    }
  }, [user?.id]);

  // 🎓 Fetch parent's students
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

  // 🧾 Fetch logs for one student
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

  // 🪟 Modal open + auto refresh
  const handleViewLogs = async (student) => {
    setSelectedStudent(student);
    await fetchStudentLogs(student.id);
    setShowModal(true);

    intervalRef.current = setInterval(() => {
      fetchStudentLogs(student.id);
    }, 5000);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    clearInterval(intervalRef.current);
  };

  // 🌀 Loading states
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
    <div id="studentsView" className="p-4">
      {/* 👩‍🎓 Student cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
          >
            <div className="p-4 text-center border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
              <div className="w-16 h-16 bg-gradient-to-br from-[#800000] to-[#9c1c1c] rounded-full flex items-center justify-center mx-auto mb-2 shadow overflow-hidden text-xs">
                {s.student_pic ? (
                  <img
                    src={s.student_pic}
                    alt={`${s.first_name} ${s.last_name}`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200 bg-gray-100">
                    No Image
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-800 truncate">
                {s.first_name} {s.last_name}
              </h3>
              <p className="text-gray-600 text-sm truncate">
                {s.grade_level} - {s.section}
              </p>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div>
                  <label className="font-medium px-5 text-gray-500">Student ID</label>
                  <p className="text-gray-800 px-4 font-semibold truncate">{s.school_id}</p>
                </div>
                <div>
                  <label className="font-medium px-8 text-gray-500">Birthdate</label>
                  <p className="text-gray-800 px-7 font-semibold">
                    {s.birthdate ? new Date(s.birthdate).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleViewLogs(s)}
                className="w-full bg-[#800000] text-white py-2 rounded-lg font-semibold shadow hover:bg-[#9c1c1c] transition-colors text-sm"
              >
                View Activity Log
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 📜 Modal for student logs */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-2xl p-4 relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-3 text-center text-gray-800">
              {selectedStudent.first_name} {selectedStudent.last_name} — Logs
            </h2>

            {loadingLogs ? (
              <p className="text-center text-gray-500 text-sm">Loading logs...</p>
            ) : studentLogs.length === 0 ? (
              <p className="text-center text-gray-500 text-sm">
                No logs found for this student.
              </p>
            ) : (
              <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-100 text-sm">
                {studentLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center py-1.5">
                    <div>
                      <p className="font-semibold text-gray-800 capitalize">
                        {log.action.replace("_", " ")}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(log.time_stamp).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold text-xs ${
                        log.action.includes("in")
                          ? "bg-green-100 text-green-700"
                          : "bg-[#f2dede] text-[#800000]"
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
    </div>
  );
}