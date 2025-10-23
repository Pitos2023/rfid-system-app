"use client";

import React, { useState, useEffect } from "react";
import { FaUserGraduate, FaUsers, FaClipboardList } from "react-icons/fa";
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
      className="px-4 py-2 bg-[#800000] text-white rounded hover:bg-[#9c1c1c] transition"
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
        // Fetch counts
        const { count: studentCount, error: studentError } = await supabase
          .from("student")
          .select("*", { count: "exact", head: true });
        if (studentError) throw studentError;
        setTotalStudents(studentCount || 0);

        const { count: usersCount, error: usersError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });
        if (usersError) throw usersError;
        setTotalUsers(usersCount || 0);

        const { data: logsData, error: logsError } = await supabase
          .from("log")
          .select("id, time_stamp");
        if (logsError) throw logsError;
        setTotalActivity(logsData?.length || 0);
        setLogs(logsData || []);

        // Generate last 7 days for the line chart
        if (logsData && logsData.length > 0) {
          const today = new Date();
          const last7Days = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            last7Days.push(d);
          }

          const dailyCounts = last7Days.map(date => {
            const dateStr = date.toISOString().split("T")[0];
            const count = logsData.filter(log => log.time_stamp.startsWith(dateStr))
                                  .length;
            return {
              period: dateStr.slice(5), // MM-DD format
              count,
            };
          });

          setLineData(dailyCounts);
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
  const pieColors = ["#3b82f6", "#22c55e"];

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, type: "spring", stiffness: 80 },
    }),
  };

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
                {[
                  {
                    title: "Total Students",
                    value: totalStudents,
                    icon: <FaUserGraduate className="w-8 h-8 text-white" />,
                    bg: "#800000",
                  },
                  {
                    title: "Total Users",
                    value: totalUsers,
                    icon: <FaUsers className="w-8 h-8 text-white" />,
                    bg: "#9c1c1c",
                  },
                  {
                    title: "Total Activity",
                    value: totalActivity,
                    icon: <FaClipboardList className="w-8 h-8 text-white" />,
                    bg: "#b22222",
                  },
                ].map((card, index) => (
                  <motion.div
                    key={card.title}
                    className="shadow rounded-lg p-4 flex items-center justify-between"
                    style={{ backgroundColor: card.bg }}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                  >
                    <div>
                      <p className="text-white">{card.title}</p>
                      <h2 className="text-2xl font-bold text-white">{card.value}</h2>
                    </div>
                    {card.icon}
                  </motion.div>
                ))}
              </div>

              {/* Pie Chart */}
              <div className="bg-white shadow rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaClipboardList className="text-[#800000]" />
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

              {/* Line Chart */}
              <div className="bg-white shadow rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaClipboardList className="text-[#9c1c1c]" />
                  <h3 className="font-semibold text-gray-700">Daily Activity (Last 7 Days)</h3>
                </div>
                {lineData.length > 0 ? (
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#3b82f6"
                          strokeWidth={3}
                        />
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
