"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserCircle,
  FaSignOutAlt,
  FaUsers,
  FaFileAlt,
} from "react-icons/fa";
import { MdDashboard, MdManageAccounts } from "react-icons/md";
import { HiOutlineBell, HiMenu, HiX } from "react-icons/hi";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";

// ✅ Navigation items without Reports
const navItems = [
  { icon: <MdDashboard />, label: "Dashboard", href: "/admin" },
  {
    icon: <MdManageAccounts />,
    label: "Student Management",
    href: "/admin/student-management",
  },
  {
    icon: <FaUsers />,
    label: "User Management",
    href: "/admin/parent-management",
  },
  { icon: <FaFileAlt />, label: "View Student Logs", href: "/admin/student-logs" },
];

const AdminLayout = ({ children }) => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  // ✅ Logout function
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/"); // redirect to login page
    } catch (err) {
      console.error("Logout failed:", err.message);
      alert("Error logging out. Please try again.");
    }
  };

  // ✅ Navigate to profile and settings
  const handleProfile = () => {
    router.push("/admin/profile");
  };

  const handleSettings = () => {
    router.push("/admin/settings");
  };

  // ✅ Close dropdown when clicking outside
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
      {/* ✅ Navbar */}
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
              <HiX className="w-6 h-6" />
            ) : (
              <HiMenu className="w-6 h-6" />
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

        {/* ✅ Right: Notification + User Dropdown */}
        <div className="flex items-center gap-4">
          <HiOutlineBell className="w-6 h-6 text-white cursor-pointer hover:text-gray-300 transition-transform duration-300 hover:scale-110" />

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpenDropdown(!openDropdown)}
              className="p-2 rounded-full bg-[#800000] text-white hover:bg-[#9c1c1c] transition"
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
                  <button
                    onClick={handleProfile}
                    className="w-full text-left block px-4 py-2 hover:bg-gray-100"
                  >
                    👤 Profile
                  </button>
                  <button
                    onClick={handleSettings}
                    className="w-full text-left block px-4 py-2 hover:bg-gray-100"
                  >
                    ⚙️ Settings
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-red-500 flex items-center gap-2 hover:bg-gray-100"
                  >
                    <FaSignOutAlt /> Log Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* ✅ Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white shadow-lg">
          <div className="flex flex-col gap-2 p-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition ${
                  pathname === item.href
                    ? "bg-[#800000] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
