"use client";
import { useState } from "react";
import Sidebar from "../components-parents/Sidebar";
import TopBar from "../components-parents/TopBar";
import NotificationToast from "../components-parents/NotificationToast";
import Dashboard from "../components-parents/Dashboard";
import Students from "../components-parents/Students";
import ActivityLog from "../components-parents/ActivityLog";
import Notifications from "../components-parents/Notifications";
import Profile from "../components-parents/Profile";

export default function ParentPage() {
  const [currentView, setView] = useState("dashboard");
  const [toast, setToast] = useState(null);

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "students":
        return <Students setView={setView} />;
      case "activity":
        return <ActivityLog />;
      case "notifications":
        return <Notifications />;
      case "profile":
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar currentView={currentView} setView={setView} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar setToast={setToast} currentView={currentView} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 fade-in">
          {renderView()}
        </main>
      </div>

      {/* Notification Toast */}
      {toast && (
        <NotificationToast message={toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
