"use client";

import React, { useState, useEffect } from "react";
import { FaUserGraduate, FaClipboardList } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../components-admin/AdminLayout";
import { supabase } from "../supabaseClient";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// Subcomponent: Student Management Page
const StudentManagement = ({ onBack }) => (
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
      This is where you can manage student records, attendance, and related data.
    </p>
    <button
      onClick={onBack}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
    >
      ← Back to Dashboard
    </button>
  </motion.div>
);

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");

  // Dashboard stats
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalActivity, setTotalActivity] = useState(0);

  // Logs and chart data
  const [logs, setLogs] = useState([]);
  const [lineData, setLineData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Total students
        const { count: studentCount, error: studentError } = await supabase
          .from("student")
          .select("*", { count: "exact", head: true });
        if (studentError) throw studentError;
        setTotalStudents(studentCount || 0);

        // Total users
        const { count: usersCount, error: usersError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });
        if (usersError) throw usersError;
        setTotalUsers(usersCount || 0);

        // Fetch all logs
        const { count: logsCount, data: logsData, error: logsError } =
          await supabase.from("log").select("id, time_stamp", { count: "exact" });
        if (logsError) throw logsError;
        setTotalActivity(logsCount || 0);
        setLogs(logsData || []);

        // Prepare line chart data: Today / This Week / This Month
        if (logsData && logsData.length > 0) {
          const todayStr = new Date().toISOString().split("T")[0];

          const todayCount = logsData.filter(log => log.time_stamp.startsWith(todayStr)).length;

          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          const weekCount = logsData.filter(
            log => new Date(log.time_stamp) >= startOfWeek
          ).length;

          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          const monthCount = logsData.filter(
            log => new Date(log.time_stamp) >= startOfMonth
          ).length;

          setLineData([
            { period: "Today", count: todayCount },
            { period: "This Week", count: weekCount },
            { period: "This Month", count: monthCount },
          ]);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err.message);
      }
    };

    fetchDashboardData();
  }, []);

  // Pie chart data
  const pieData = [
    { name: "Total Students", value: totalStudents },
    { name: "Total Users", value: totalUsers },
    
  ];
  const pieColors = ["#3b82f6", "#22c55e", "#facc15"];

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
                <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Total Students</p>
                    <h2 className="text-2xl font-bold">{totalStudents}</h2>
                  </div>
                  <FaUserGraduate className="w-8 h-8 text-blue-600" />
                </div>

                <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Total Users</p>
                    <h2 className="text-2xl font-bold">{totalUsers}</h2>
                  </div>
                  <div className="w-8 h-8 bg-green-500 rounded" />
                </div>

                <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Total Activity</p>
                    <h2 className="text-2xl font-bold">{totalActivity}</h2>
                  </div>
                  <div className="w-8 h-8 bg-yellow-500 rounded" />
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white shadow rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaClipboardList className="text-blue-600" />
                  <h3 className="font-semibold text-gray-700">Dashboard Overview</h3>
                </div>
                {(totalStudents + totalUsers + totalActivity) > 0 ? (
                  <div style={{ width: "100%", height: 250 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={pieColors[index % pieColors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">No data available.</p>
                )}
              </div>

              {/* Line Chart for Activity Today / This Week / This Month */}
              <div className="bg-white shadow rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaClipboardList className="text-yellow-600" />
                  <h3 className="font-semibold text-gray-700">Total Activity</h3>
                </div>
                {lineData.length > 0 ? (
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#facc15" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">No activity data.</p>
                )}
              </div>
            </motion.div>
          )}

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
