"use client";
import { useEffect, useState } from "react";

export default function RecentNotifications({ notifications }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    setList((notifications || []).slice(0, 10));
  }, [notifications]);

  const typeIcon = (type) => {
    switch (type) {
      case "urgent":
        return "🚨";
      case "sick":
        return "🏥";
      case "announcement":
        return "📢";
      default:
        return "ℹ️";
    }
  };

  const typeStyle = (type) => {
    switch (type) {
      case "urgent":
        return "bg-[#FFEBEB] text-[#800000]"; // light red bg with maroon text
      case "sick":
        return "bg-[#FFF0E0] text-[#800000]"; // light orange bg with maroon text
      case "announcement":
        return "bg-[#FDECEF] text-[#800000]"; // light pink bg with maroon text
      default:
        return "bg-[#E8EAF6] text-[#800000]"; // light blue bg with maroon text
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-bold text-black">📋 Recent Notifications</h3>
        <p className="text-black text-sm">Last 10 sent messages</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {list.length ? (
          list.map((n, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeStyle(n.type)}`}>
                  <span>{typeIcon(n.type)}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-black text-sm mb-1">{n.title}</h4>
                  <p className="text-black text-xs mb-2">{n.content}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-black">{n.recipients}</p>
                    <span className="text-xs text-[#800000] font-semibold">✓ delivered</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-black text-sm text-center">No notifications yet</p>
        )}
      </div>
    </div>
  );
}
