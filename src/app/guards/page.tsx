"use client";

import React from "react";
import Header from "../components-guards/Header";
import NotificationToast from "../components-guards/NotificationToast";
import DynamicStatCards from "../components-guards/StatCards"; // ✅ dynamic version
import ActivityLog from "../components-guards/ActivityLog";
import SchoolEvents from "../components-guards/SchoolEvents";

export default function GuardDashboard() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Top notifications */}
      <NotificationToast />
      <Header />

      <main className="p-6 pt-4">
        {/* ✅ Dynamic Stats Section */}
        <DynamicStatCards />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <ActivityLog />

          <div className="space-y-6">
            <SchoolEvents />
          </div>
        </div>
      </main>
    </div>
  );
}
