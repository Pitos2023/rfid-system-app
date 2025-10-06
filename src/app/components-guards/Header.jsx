"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [time, setTime] = useState("--:--:--");
  const [date, setDate] = useState("Loading...");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#58181F] border-b border-gray-200">
      <div className="px-8 flex items-center justify-between w-full py-4">
        {/* Left side */}
        <div>
          <h1 className="text-3xl font-bold text-white">
            SPC BED Security Command
          </h1>
          <p className="text-white/80 text-sm">
            Advanced Monitoring & Control Center
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-9">
          {/* Time + Date */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{time}</div>
            <div className="text-sm text-white">{date}</div>
          </div>

          {/* Officer */}
          <div className="text-right">
            <div className="text-sm text-white">Security Officer</div>
            <div className="font-bold text-white text-lg">Rodriguez</div>
          </div>
        </div>
      </div>
    </header>
  );
}
