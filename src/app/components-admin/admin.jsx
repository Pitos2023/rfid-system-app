"use client";

import React, { useState } from "react";
import { FaUserGraduate, FaSignOutAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../components-admin/AdminLayout"; // adjust path if needed

// Dummy student management component
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

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");

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
                    <h2 className="text-2xl font-bold">5</h2>
                  </div>
                  <FaUserGraduate className="w-8 h-8 text-blue-600" />
                </div>
                <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Present Today</p>
                    <h2 className="text-2xl font-bold">0</h2>
                  </div>
                  <div className="w-8 h-8 bg-green-500 rounded" />
                </div>
                <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Late Entries</p>
                    <h2 className="text-2xl font-bold">0</h2>
                  </div>
                  <div className="w-8 h-8 bg-yellow-500 rounded" />
                </div>
                <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Early Exits</p>
                    <h2 className="text-2xl font-bold">0</h2>
                  </div>
                  <FaSignOutAlt className="w-8 h-8 text-red-500" />
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white shadow rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-700 mb-4">
                  Recent Student Activity
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between">
                    <span>John Smith - Entered at Main Gate</span>
                    <span className="text-gray-500">4:15:30 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Sarah Johnson - Entered at Main Gate</span>
                    <span className="text-gray-500">4:45:22 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>John Smith - Exited at Main Gate</span>
                    <span className="text-gray-500">11:30:15 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Emily Davis - Entered at Side Gate</span>
                    <span className="text-gray-500">3:55:45 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Michael Brown - Entered at Main Gate</span>
                    <span className="text-gray-500">5:10:30 PM</span>
                  </li>
                </ul>
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
