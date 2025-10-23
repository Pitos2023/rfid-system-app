"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import { Settings, LogOut, Menu, X } from "lucide-react";

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const toggleDropdown = (e) => {
    e.preventDefault(); // prevent default link behavior
    setDropdownOpen((prev) => !prev);
  };

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);

  // Close dropdown/menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        setDropdownOpen(false);
      }
      if (!event.target.closest(".mobile-menu")) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header className="bg-gradient-to-r from-[#800000] via-[#9c1c1c] to-[#b22222] shadow-md border-b border-[#5a0a0a] z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        {/* --- Logo / Title --- */}
        <div className="text-white">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            SPC BED Security Command
          </h1>
          <p className="text-white/80 text-xs sm:text-sm">
            Advanced Monitoring & Control Center
          </p>
        </div>

        {/* --- Desktop Settings Dropdown --- */}
        <div className="hidden sm:flex items-center gap-4 sm:gap-6">
          <div className="relative dropdown-container">
            <a
              href="#"
              onClick={toggleDropdown}
              className="flex items-center gap-2 bg-white text-[#800000] font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 active:scale-95 transition text-sm"
            >
              <Settings size={18} />
              <span>Settings</span>
            </a>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-fadeIn z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-[#800000] hover:bg-gray-100 text-sm font-medium transition"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- Mobile Hamburger --- */}
        <div className="sm:hidden">
          <button
            onClick={toggleMobileMenu}
            className="text-white focus:outline-none"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* --- Mobile Menu --- */}
      {mobileMenuOpen && (
        <div className="sm:hidden mobile-menu bg-white border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 text-[#800000] hover:bg-gray-100 text-sm font-medium transition"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}

      {/* Animation for dropdown */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-in-out;
        }
      `}</style>
    </header>
  );
}
