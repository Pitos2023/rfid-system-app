"use client";
import { useState } from "react";
import { Check, X, AlertTriangle, Info, CheckSquare } from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Exit Request - Ana Santos",
      msg: "Ana Santos is requesting to exit school for a medical appointment at 11:30 AM.",
      time: "2 hours ago",
      type: "warning",
      actions: true,
    },
    {
      id: 2,
      title: "System Update",
      msg: "The parent portal has been updated with new features for better tracking and notifications.",
      time: "1 day ago",
      type: "info",
      actions: false,
    },
    {
      id: 3,
      title: "Exit Approved - Juan Santos",
      msg: "Juan Santos' lunch exit request has been approved. He exited at 12:15 PM and returned at 1:05 PM.",
      time: "2 days ago",
      type: "success",
      actions: false,
    },
  ]);

  const handleApprove = (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              title: `Exit Approved - Ana Santos`,
              msg: "Ana Santos' exit request has been approved successfully.",
              type: "success",
              actions: false,
            }
          : n
      )
    );
  };

  const handleDeny = (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              title: `Exit Denied - Ana Santos`,
              msg: "Ana Santos' exit request has been denied.",
              type: "danger",
              actions: false,
            }
          : n
      )
    );
  };

  const getIcon = (type) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case "info":
        return <Info className="w-6 h-6 text-blue-600" />;
      case "success":
        return <CheckSquare className="w-6 h-6 text-green-600" />;
      case "danger":
        return <X className="w-6 h-6 text-red-600" />;
      default:
        return <Info className="w-6 h-6 text-gray-600" />;
    }
  };

  const getBg = (type) => {
    switch (type) {
      case "warning":
        return "bg-yellow-100";
      case "info":
        return "bg-blue-100";
      case "success":
        return "bg-green-100";
      case "danger":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div id="notificationsView" className="p-6 space-y-6">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div
              className={`w-12 h-12 ${getBg(
                n.type
              )} rounded-full flex items-center justify-center flex-shrink-0`}
            >
              {getIcon(n.type)}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-800">{n.title}</h4>
                <span className="text-sm text-gray-500">{n.time}</span>
              </div>
              <p className="text-gray-600 mb-4">{n.msg}</p>

              {/* Approve / Deny Buttons */}
              {n.actions && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleApprove(n.id)}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </button>
                  <button
                    onClick={() => handleDeny(n.id)}
                    className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    <X className="w-4 h-4 mr-2" /> Deny
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
