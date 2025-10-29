"use client";
import { useState, useEffect } from "react";
import Header from "../../components-assistant/Header";
import NotificationComposer from "../../components-assistant/NotificationComposer";
import RecentNotifications from "../../components-assistant/RecentNotifications";
import Toast from "../../components-assistant/Toast";
import BackButton from "../../components-assistant/BackButton";

export default function AnnouncementsPage() {
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header time={time} date={date} />
            <BackButton />

      <main className="p-4 md:p-6 max-w-7xl mx-auto">

        {/* Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <NotificationComposer onSend={handleSend} />
          </div>
          <RecentNotifications notifications={notifications} />
        </div>
      </main>

      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ show: false, message: "" })}
      />
    </div>
  );
}
