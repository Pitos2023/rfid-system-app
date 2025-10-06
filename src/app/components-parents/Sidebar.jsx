"use client";
import { useState, useEffect } from "react";

export default function Sidebar({ currentView, setView, sidebarOpen, setSidebarOpen }) {
  const navItems = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "students", label: "👨‍👩‍👧 My Children" },
    { id: "activity", label: "📜 Activity Log" },
    { id: "notifications", label: "🔔 Notifications", badge: 3 },
    { id: "profile", label: "👤 Profile" },
  ];

  return (
    <div
      id="sidebar"
      className={`fixed lg:static top-0 left-0 h-full w-64 bg-[#58181F] text-white flex flex-col 
        transform transition-transform duration-300 z-50
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
    >
      {/* Logo + Close button */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            🎓
          </div>
          <div>
            <h1 className="text-xl font-bold">My.SPC</h1>
            <p className="text-gray-200 text-sm">Parent Portal</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)} // ✅ close works now
          className="lg:hidden text-white text-2xl"
        >
          ×
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  setView(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? "bg-white/20 font-semibold"
                    : "hover:bg-white/10"
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
            👩
          </div>
          <div>
            <p className="font-medium">Maria Santos</p>
            <p className="text-gray-200 text-sm">Parent Account</p>
          </div>
        </div>
      </div>
    </div>
  );
}
