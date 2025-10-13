"use client";

import React, { useState, useEffect } from "react";
import { FaUserGraduate, FaSignOutAlt, FaClipboardList } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../components-admin/AdminLayout";
import { supabase } from "../supabaseClient";

// Subcomponent: Student Management Page
const StudentManagement = ({ onBack }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-lg shadow-lg"
    >
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        👩‍🎓 Student Management
      </h2>
      <p className="text-gray-600 mb-6">
        This is where you can manage student records, attendance, and related
        data.
      </p>
      <button
        onClick={onBack}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        ← Back to Dashboard
      </button>
    </motion.div>
  );
};

// Main Component: Admin Dashboard
const AdminDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");

  // Dashboard stats
  const [totalStudents, setTotalStudents] = useState(0);
  const [presentToday, setPresentToday] = useState(0);
  const [lateEntries, setLateEntries] = useState(0);
  const [earlyExits, setEarlyExits] = useState(0);

  // Logs data
  const [logs, setLogs] = useState([]);

  // Fetch dashboard stats + logs
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Total students
        const { count: studentCount, error: studentError } = await supabase
          .from("student")
          .select("*", { count: "exact", head: true });
        if (studentError) throw studentError;
        setTotalStudents(studentCount || 0);

        // Attendance simulation (if you have attendance table)
        const today = new Date().toISOString().split("T")[0];
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select("*")
          .eq("date", today);

        if (!attendanceError && attendanceData) {
          const presentCount = attendanceData.filter(
            (a) => a.status === "present"
          ).length;
          const lateCount = attendanceData.filter(
            (a) => a.status === "late"
          ).length;
          const earlyCount = attendanceData.filter(
            (a) => a.status === "early_exit"
          ).length;

          setPresentToday(presentCount);
          setLateEntries(lateCount);
          setEarlyExits(earlyCount);
        }

        // Fetch logs from your 'log' table
        const { data: logsData, error: logsError } = await supabase
          .from("log")
          .select("*, student:student_id(id)")
          .order("time_stamp", { ascending: false })
          .limit(5);

        if (logsError) throw logsError;
        setLogs(logsData || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err.message);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <AdminLayout>
      <div className="flex flex-col h-full bg-gray-100 p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activePage === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.3 }}
            >
              {/* Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Total Students */}
                <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Total Students</p>
                    <h2 className="text-2xl font-bold">{totalStudents}</h2>
                  </div>
                  <FaUserGraduate className="w-8 h-8 text-blue-600" />
                </div>

                {/* Present Today */}
                <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Present Today</p>
                    <h2 className="text-2xl font-bold">{presentToday}</h2>
                  </div>
                  <div className="w-8 h-8 bg-green-500 rounded" />
                </div>

                {/* Late Entries */}
                <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Late Entries</p>
                    <h2 className="text-2xl font-bold">{lateEntries}</h2>
                  </div>
                  <div className="w-8 h-8 bg-yellow-500 rounded" />
                </div>

                {/* Early Exits */}
                <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Early Exits</p>
                    <h2 className="text-2xl font-bold">{earlyExits}</h2>
                  </div>
                  <FaSignOutAlt className="w-8 h-8 text-red-500" />
                </div>
              </div>

              {/* Recent Student Activity */}
              <div className="bg-white shadow rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaClipboardList className="text-blue-600" />
                  <h3 className="font-semibold text-gray-700">
                    Recent Student Activity
                  </h3>
                </div>

                {logs.length > 0 ? (
                  <ul className="space-y-3 text-sm">
                    {logs.map((log) => (
                      <li
                        key={log.id}
                        className="flex justify-between border-b border-gray-100 pb-2"
                      >
                        <span>
                          <span className="font-semibold">
                            {log.student?.name || "Unknown Student"}
                          </span>{" "}
                          — logged at{" "}
                          {new Date(log.time_stamp).toLocaleString()}
                        </span>
                        <span
                          className={`${
                            log.consent ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {log.consent ? "✓ Consented" : "✗ No Consent"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No recent activity found.
                  </p>
                )}
              </div>

              {/* System Status */}
              <div className="bg-white shadow rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-4">
                  System Status
                </h3>
                <div className="flex flex-wrap gap-6 text-sm">
                  <span className="flex items-center gap-2 text-green-600">
                    🟢 RFID System: Online
                  </span>
                  <span className="flex items-center gap-2 text-green-600">
                    🟢 Database: Connected
                  </span>
                  <span className="flex items-center gap-2 text-yellow-500">
                    🟡 Notifications: Limited
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Student Management Page */}
          {activePage === "studentManagement" && (
            <StudentManagement
              key="studentManagement"
              onBack={() => setActivePage("dashboard")}
            />
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
