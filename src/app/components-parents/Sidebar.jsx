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
    { id: "notifications", label: "🔔 Notifications", badge: 3 },
    { id: "profile", label: "👤 Profile" },
  ];

  // Load current view from URL (?view=dashboard)
  useEffect(() => {
    const viewFromUrl = searchParams.get("view");
    if (viewFromUrl) {
      setView(viewFromUrl);
    } else {
      // Default to dashboard if no view in URL
      setView("dashboard");
      router.replace("?view=dashboard");
    }
  }, [searchParams, setView, router]);

  // When view changes, update URL
  useEffect(() => {
    if (currentView) {
      const newUrl = `?view=${currentView}`;
      router.replace(newUrl); // replace() so it won't stack history
    }
  }, [currentView, router]);

  // Logout function
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      router.push("/");
    }
  };

  return (
    <>
      {/* Sidebar overlay for small screens */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div
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
            onClick={() => setSidebarOpen(false)}
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
                    router.replace(`?view=${item.id}`);
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

        {/* User Info + Logout */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              👩
            </div>
            <div>
              <p className="font-medium">Maria Santos</p>
              <p className="text-gray-200 text-sm">Parent Account</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Toggle button for small screens */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#58181F] text-white p-2 rounded-md"
        onClick={() => setSidebarOpen(true)}
      >
        ☰
      </button>
    </>
  );
}
