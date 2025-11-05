"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createScopedClient } from "../supabaseClient"; // ✅ role-based client

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const dropdownRef = useRef(null);
  const [assistantName, setAssistantName] = useState("Loading...");
  const router = useRouter();

  // ✅ Get role-based Supabase client
  const role = sessionStorage.getItem("role") || "assistant_principal";
  const supabase = createScopedClient(role);

const fetchUser = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log("🟢 Current session:", session);

    if (!session?.user) {
      console.log("⚠️ No session user found");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("") // 🔧 select all columns temporarily
      .eq("id", session.user.id)
      .single();

    console.log("🟢 Query result:", data);
    console.log("🟡 Query error:", error);

    if (error) {
      console.error("❌ Error fetching assistant principal name:", error);
    } else if (data) {
      // Try both column name versions
      setAssistantName(data.Full_name || data.full_name || "Unknown");
    } else {
      console.warn("⚠️ No data found for assistant principal");
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
  }
};

  useEffect(() => {
    fetchUser(); // ✅ run once on mount
  }, [supabase]);

  // ✅ Toggle dropdown
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

  // ✅ Logout
  const handleLogout = async () => {
    setLoading(true);
    setConfirmLogout(false);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      sessionStorage.removeItem("role");

      setTimeout(() => {
        setLoading(false);
        router.push("/");
      }, 1500);
    } catch (err) {
      console.error("Logout failed:", err.message);
      setLoading(false);
      alert("Error logging out. Please try again.");
    }
  };

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 shadow bg-[#800000] text-white">
      <motion.h1
        className="text-lg font-bold tracking-wide"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Assistant Principal Dashboard
      </motion.h1>

      <div className="relative" ref={dropdownRef}>
        {/* User Button */}
        <button
          onClick={toggleDropdown}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-full transition"
        >
          <User size={20} />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 text-gray-800"
            >
              {/* 👤 Profile Info */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                <span className="font-semibold text-gray-800">
                  {assistantName}
                </span>
              </div>

              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 transition">
                See all profiles
              </button>

              <button
                onClick={() => router.push("/assistant-principal/settings")}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 border-b border-gray-200"
              >
                <Settings size={16} /> Settings & privacy
              </button>

              <button
                onClick={() => setConfirmLogout(true)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center gap-2"
              >
                <LogOut size={16} /> Log Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {confirmLogout && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-200 text-center"
              >
                <p className="text-gray-800 font-medium mb-5">
                  Are you sure you want to log out?
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleLogout}
                    className="bg-[#800000] text-white px-5 py-2 rounded-lg hover:bg-[#660000] font-semibold transition"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmLogout(false)}
                    className="bg-gray-200 text-gray-800 px-5 py-2 rounded-lg hover:bg-gray-300 font-semibold transition"
                  >
                    No
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Modal */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-200 text-center"
              >
                <div className="w-6 h-6 border-4 border-[#800000] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-800 font-medium">Logging out...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
