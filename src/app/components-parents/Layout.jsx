"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function Layout() {
  const [currentView, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setView={setView}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}  // ✅ importante
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        <TopBar
          currentView={currentView}
          setSidebarOpen={setSidebarOpen} // ✅ importante
        />
        <main className="flex-1 bg-gray-50 p-6">
          <h1 className="text-gray-700">Current View: {currentView}</h1>
        </main>
      </div>
    </div>
  );
}
