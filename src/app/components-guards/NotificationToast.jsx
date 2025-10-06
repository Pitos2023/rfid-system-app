"use client";
import { useState } from "react";

export default function NotificationToast() {
  const [show, setShow] = useState(false);
  const [notification, setNotification] = useState({
    title: "Assistant Principal Alert",
    message: "New notification from administration.",
    type: "info",
  });

  const hide = () => setShow(false);
  const acknowledge = () => {
    console.log("Acknowledged");
    hide();
  };

  if (!show) return null;

  return (
    <div
      className={`notification-toast ${show ? "show" : ""} ${
        notification.type === "urgent" ? "urgent" : ""
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          {notification.type === "urgent" ? "🚨" : "📢"}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800 text-lg">{notification.title}</h4>
          <p className="text-gray-600 mt-1 mb-3">{notification.message}</p>
          <div className="flex space-x-3">
            <button
              onClick={acknowledge}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg font-medium"
            >
              ✓ Acknowledge
            </button>
            <button
              onClick={hide}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm rounded-lg font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button onClick={hide} className="text-gray-400 hover:text-gray-600 text-xl">
          ×
        </button>
      </div>
    </div>
  );
}
