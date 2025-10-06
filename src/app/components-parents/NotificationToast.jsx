"use client";
import { useEffect, useState } from "react";

export default function NotificationToast({ message, onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (message) {
      setShow(true);
      // Auto-hide after 15s
      const timer = setTimeout(() => {
        setShow(false);
        onClose();
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  const approveExit = () => {
    alert("Exit request approved! Student and staff will be notified.");
    setShow(false);
    onClose();
  };

  const denyExit = () => {
    const reason = prompt("Reason for denial:");
    if (reason) {
      alert("Exit request denied. Staff and student will be notified.");
      setShow(false);
      onClose();
    }
  };

  return (
    <div
      className={`notification-toast fixed top-5 right-5 bg-white rounded-xl shadow-lg border-l-4 border-amber-500 p-4 w-96 transition-transform ${
        show ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
          <span className="text-amber-600 text-xl">🚨</span>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800 text-lg">Exit Request Alert</h4>
          <p className="text-gray-600 mt-1 mb-3">{message}</p>
          <div className="flex space-x-3">
            <button
              onClick={approveExit}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg"
            >
              ✓ Approve
            </button>
            <button
              onClick={denyExit}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg"
            >
              ✗ Deny
            </button>
            <button
              onClick={() => {
                setShow(false);
                onClose();
              }}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm rounded-lg"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setShow(false);
            onClose();
          }}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
      </div>
    </div>
  );
}
