"use client";

export default function TopBar({ currentView, setSidebarOpen, users }) {
  const getSubtitle = () => {
    if (currentView === "dashboard") {
      return users
        ? `Welcome back, ${users.first_name} ${users.last_name}`
        : "Welcome back...";
    }

    const subtitles = {
      students: "Student profiles and information",
      activity: "Complete entry and exit history",
      notifications: "Recent alerts and updates",
      profile: "Account settings and information",
    };

    return subtitles[currentView] || "";
  };

  const titles = {
    dashboard: "Dashboard",
    students: "My Children",
    activity: "Activity Log",
    notifications: "Notifications",
    profile: "My Profile",
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-800"
          >
            ☰
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {titles[currentView]}
            </h2>
            <p className="text-gray-600">{getSubtitle()}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
