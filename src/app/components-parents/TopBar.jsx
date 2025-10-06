"use client";

export default function TopBar({ currentView, setSidebarOpen }) {
  const titles = {
    dashboard: { title: "Dashboard", subtitle: "Welcome back, Maria Santos" },
    students: { title: "My Children", subtitle: "Student profiles and information" },
    activity: { title: "Activity Log", subtitle: "Complete entry and exit history" },
    notifications: { title: "Notifications", subtitle: "Recent alerts and updates" },
    profile: { title: "My Profile", subtitle: "Account settings and information" },
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)} // ✅ mo work na karon
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-800"
          >
            ☰
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {titles[currentView].title}
            </h2>
            <p className="text-gray-600">{titles[currentView].subtitle}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
