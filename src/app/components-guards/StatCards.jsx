"use client";
import React from "react";

/**
 * @param {{
 *   title: string,
 *   value: number,
 *   icon: string,
 *   color: string,
 *   note: string,
 *   delay?: number
 * }} props
 */
export default function StatCard({
  title,
  value,
  icon,
  color,
  note,
  delay = 0,
}) {
  return (
    <div
      className={`p-6 rounded-2xl shadow-md ${color} transition-all duration-300 hover:scale-105`}
      style={{
        animationDelay: `${delay}s`,
        animation: "fadeInUp 0.6s ease forwards",
        opacity: 0,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-semibold">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <p className="text-sm text-gray-600">{note}</p>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
