"use client";

export default function StatsCard({ title, value, icon }) {
  return (
    <div className="bg-maroon rounded-xl shadow-md p-6 flex items-center justify-between"
         style={{ backgroundColor: "#800000" }}>
      <div>
        <p className="text-white text-xs font-semibold uppercase tracking-wide">
          {title}
        </p>
        <p className="text-white text-3xl font-bold">{value}</p>
      </div>
      <div className="w-14 h-14 bg-maroon-dark rounded-xl flex items-center justify-center"
           style={{ backgroundColor: "#660000" }}>
        <span className="text-white text-xl">{icon}</span>
      </div>
    </div>
  );
}
