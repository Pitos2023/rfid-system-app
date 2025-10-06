"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FaUserGraduate,
  FaUserPlus,
  FaUsers,
  FaFileAlt,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";
import { MdDashboard,MdSettings, MdManageAccounts } from "react-icons/md";
import { HiOutlineBell, HiMenu, HiX } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { icon: <MdDashboard />, label: "Dashboard", href: "#" },
  { icon: <MdManageAccounts />, label: "Student Management", href: "#" },
  { icon: <FaUsers />, label: "Parent Management", href: "#" },
  { icon: <FaFileAlt />, label: "Student Logs", href: "#" },
  { icon: <FaFileAlt />, label: "Reports", href: "#" },
   { icon: <MdSettings />, label: "System Settings", href: "#" },
];

const AdminDashboard = () => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Navbar */}
      <nav
        className="w-full text-white flex items-center justify-between px-6 py-4 shadow relative"
        style={{ backgroundColor: "#800000" }}
      >
        {/* Left: Hamburger + Title */}
        <div className="flex items-center gap-6">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/20 transition"
            onClick={() => setOpenMobileMenu(!openMobileMenu)}
          >
            {openMobileMenu ? (
              <HiX className="w-6 h-6 text-white" />
            ) : (
              <HiMenu className="w-6 h-6 text-white" />
            )}
          </button>
          <motion.span
            className="text-lg font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            School Admin
          </motion.span>
        </div>

        {/* Right: Desktop Nav Links + Notifications + Admin */}
        <div className="flex items-center gap-4">
          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item, i) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="relative flex items-center gap-2 text-white transition-colors duration-300"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                {item.icon} {item.label}
                <motion.span
                  className="absolute left-0 -bottom-1 h-[2px] w-full bg-blue-400 origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            ))}
          </div>

          {/* Notifications */}
          <HiOutlineBell className="w-6 h-6 text-gray-300 cursor-pointer hover:text-white transition-transform duration-300 hover:scale-110" />

          {/* Admin Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpenDropdown(!openDropdown)}
              className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300"
            >
              <FaUserCircle className="w-6 h-6" />
            </button>
            <AnimatePresence>
              {openDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-white text-gray-700 rounded-lg shadow-lg z-50"
                >
                  <a href="#profile" className="block px-4 py-2 hover:bg-gray-100">
                    👤 Profile
                  </a>
                  <a href="#settings" className="block px-4 py-2 hover:bg-gray-100">
                    ⚙️ Settings
                  </a>
                  <hr className="my-1" />
                  <a
                    href="#logout"
                    className="block px-4 py-2 text-red-500 flex items-center gap-2 hover:bg-gray-100"
                  >
                    <FaSignOutAlt /> Log Out
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {openMobileMenu && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3 }}
              className="absolute top-full left-0 w-64 bg-white text-gray-800 shadow-lg md:hidden z-50 p-4 rounded-br-lg"
            >
              <div className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600"
                  >
                    {item.icon} {item.label}
                  </a>
                ))}
                <hr />
                <button className="w-full text-left flex items-center gap-2 text-red-500 hover:text-red-600">
                  <FaSignOutAlt /> Log Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Recent Activity + Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-4">Recent Student Activity</h3>
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

          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-blue-100 text-blue-700 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-200 transition-colors duration-300">
                <FaUserPlus /> Add Student
              </button>
              <button className="bg-green-100 text-green-700 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-200 transition-colors duration-300">
                <FaUsers /> Add Parent
              </button>
              <button className="bg-purple-100 text-purple-700 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-200 transition-colors duration-300">
                <FaFileAlt /> View Logs
              </button>
              <button className="bg-orange-100 text-orange-700 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-200 transition-colors duration-300">
                📊 Generate Report
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-4">System Status</h3>
          <div className="flex flex-wrap gap-6 text-sm">
            <span className="flex items-center gap-2 text-green-600">🟢 RFID System: Online</span>
            <span className="flex items-center gap-2 text-green-600">🟢 Database: Connected</span>
            <span className="flex items-center gap-2 text-yellow-500">🟡 Notifications: Limited</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
