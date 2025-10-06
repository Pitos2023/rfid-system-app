import Header from "../components-guards/Header";
import NotificationToast from "../components-guards/NotificationToast";
import StatCard from "../components-guards/StatCards";
import ActivityLog from "../components-guards/ActivityLog";
import SchoolEvents from "../components-guards/SchoolEvents";
import SickLeaveList from "../components-guards/SickLeaveList";
import { stats } from "../components-guards/utils";


export default function Page() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Toast */}
      <NotificationToast />

      {/* Header */}
      <Header />

      <main className="p-6 pt-4">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} delay={i * 0.1} />
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activity Log (takes 2 cols) */}
          <ActivityLog />

          {/* Sidebar */}
          <div className="space-y-6">
            <SchoolEvents />
            <SickLeaveList />
          </div>
        </div>
      </main>
    </div>
  );
}
