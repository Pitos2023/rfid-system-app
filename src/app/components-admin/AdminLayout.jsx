"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUsers, FaFileAlt } from "react-icons/fa";
import { MdDashboard, MdManageAccounts } from "react-icons/md";
import { HiOutlineBell, HiMenu, HiX } from "react-icons/hi";
import { User, Settings, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";

// ✅ Navigation items
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
  {
    icon: <FaFileAlt />,
    label: "View Student Logs",
    href: "/admin/student-logs",
  },
];

export default function AdminLayout({ children }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  // ✅ Logout function
  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setTimeout(() => {
        setIsLoggingOut(false);
        setShowLogoutModal(false);
        router.push("/");
      }, 1500);
    } catch (err) {
      console.error("Logout failed:", err.message);
      alert("Error logging out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  // ✅ Dropdown toggle
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100 relative">
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
        <div className="flex items-center gap-4" ref={dropdownRef}>
          <HiOutlineBell className="w-6 h-6 text-white cursor-pointer hover:text-gray-300 transition-transform duration-300 hover:scale-110" />

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-full transition"
            >
              <User size={20} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
                >
                  {/* User Info */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                    <img
                      src="/profile.jpg"
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="font-semibold text-gray-800">
                      Chris Manuel Pitos
                    </span>
                  </div>

                  {/* See All Profiles */}
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium border-b border-gray-200 transition">
                    See all profiles
                  </button>

                  {/* Menu Items */}
                  <button
                    onClick={() => router.push("/admin/settings")}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium transition flex items-center gap-2"
                  >
                    <Settings size={16} /> Settings & privacy
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 font-medium transition flex items-center gap-2"
                  >
                    <LogOut size={16} /> Log Out
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
        <aside
          className={`${
            openMobileMenu ? "flex" : "hidden"
          } md:flex flex-col w-64 bg-white shadow-lg absolute md:static z-40 md:z-auto h-full`}
        >
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
                onClick={() => setOpenMobileMenu(false)}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* ✅ Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-[999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-sm text-center border border-gray-200 animate-fadeIn"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-10 h-10 mx-auto text-[#800000] animate-spin mb-3" />
                  <p className="text-gray-700 font-medium">
                    Logging out, please wait...
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    Confirm Logout
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to log out?
                  </p>
                  <div className="flex justify-center gap-4">
                      <button
                      onClick={confirmLogout}
                      className="px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#a00000] transition"
                    >
                      Yes
                    </button> 
                    <button
                      onClick={() => setShowLogoutModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                    >
                      No
                    </button>
                 
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
