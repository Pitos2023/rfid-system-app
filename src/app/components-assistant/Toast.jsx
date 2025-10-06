"use client";
import { useEffect } from "react";

export default function Toast({ show, message, onClose }) {
  useEffect(() => {
    if (!show) return;
    const id = setTimeout(onClose, 4000);
    return () => clearTimeout(id);
  }, [show, onClose]);

  return (
    <div
      className={`fixed top-6 right-6 transition-transform duration-500 ${
        show ? "translate-x-0" : "translate-x-[400px]"
      }`}
    >
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <h4 className="font-bold">Notification Sent</h4>
          <p className="text-sm opacity-90">{message}</p>
        </div>
      </div>
    </div>
  );
}
