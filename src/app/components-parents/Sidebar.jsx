"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

export default function Sidebar({ currentView, setView }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const navItems = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "activity", label: "📜 View All Activity" },
  ];

  // ✅ Handle view switching via URL
  useEffect(() => {
    const viewFromUrl = searchParams.get("view");
    if (viewFromUrl) setView(viewFromUrl);
    else {
      setView("dashboard");
      router.replace("?view=dashboard");
    }
  }, [searchParams, setView, router]);

  useEffect(() => {
    if (currentView) router.replace(`?view=${currentView}`);
  }, [currentView, router]);

  return (
    <>
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static top-0 left-0 h-full w-64 bg-[#800000] text-white flex flex-col
        transform transition-transform duration-300 z-50
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        pt-6 lg:pt-0`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-xl">
              🎓
            </div>
            <div>
              <h1 className="text-xl font-bold">My.SPC</h1>
              <p className="text-gray-200 text-sm">Parent Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setView(item.id);
                    setSidebarOpen(false);
                    router.replace(`?view=${item.id}`);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    currentView === item.id
                      ? "bg-[#9c1c1c] font-semibold"
                      : "hover:bg-[#9c1c1c]/70"
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Hamburger toggle for mobile */}
      {!sidebarOpen && (
        <button
          className="fixed top-4 left-4 z-50 lg:hidden bg-[#800000] text-white p-2 rounded-md shadow-md"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>
      )}
    </>
  );
}
