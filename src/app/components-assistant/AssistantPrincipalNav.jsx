"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import StatsCard from "../components-assistant/StatsCard";

export default function AssistantPrincipalNav() {
    const [time, setTime] = useState("--:--:--");
    const [date, setDate] = useState("Loading...");
    const [notificationsSent, setNotificationsSent] = useState(42);
    const [toast, setToast] = useState({ show: false, message: "" });
    const [notifications, setNotifications] = useState([]);
  
    useEffect(() => {
      const update = () => {
        const now = new Date();
        setTime(now.toLocaleTimeString("en-US", { hour12: false }));
        setDate(
          now.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        );
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }, []);
  
    const handleSend = ({ title, type, content, recipients }) => {
      setNotificationsSent((n) => n + 1);
      const newNotification = { type, title, content, recipients };
      setNotifications([newNotification, ...notifications]);
      setToast({
        show: true,
        message: `Notification "${title}" sent to ${recipients}.`,
      });
    };
  
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-maroon text-white px-8 py-4 shadow-md" style={{ backgroundColor: "#800000" }}>
          <h1 className="text-2xl font-bold">My.SPC</h1>
        </header>

        <h2 className="text-2xl font-semibold text-maroon mb-8 mt-6 px-8" style={{ color: "#800000" }}>
          Assistant Principal Dashboard
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Students" value="1,247" icon="👥" />
          <StatsCard title="Notifications Sent" value={notificationsSent} icon="📢" />
          <StatsCard title="Active Parents" value="1,089" icon="👨‍👩‍👧‍👦" />
          <StatsCard title="Security Guards" value="6" icon="🛡️" />
        </div>

        {/* Navigation Grid */}
        <main className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Announcements */}
            <Link href="/assistant/announcements">
              <div
                className="flex flex-col justify-between h-40 p-8 bg-white rounded-2xl shadow-md 
                hover:shadow-xl transition cursor-pointer border border-gray-200"
              >
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center" style={{ color: "#800000" }}>
                    📢 <span className="ml-2">Announcements</span>
                  </h3>
                  <p className="text-gray-600">
                    Manage and send important announcements to parents and security.
                  </p>
                </div>
              </div>
            </Link>

            {/* Student Logs */}
            <Link href="/assistant/student-logs">
              <div
                className="flex flex-col justify-between h-40 p-8 bg-white rounded-2xl shadow-md 
                hover:shadow-xl transition cursor-pointer border border-gray-200"
              >
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center" style={{ color: "#800000" }}>
                    📝 <span className="ml-2">Student Logs</span>
                  </h3>
                  <p className="text-gray-600">
                    View and monitor student activity logs in real time.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </main>
      </div>
    );
}
