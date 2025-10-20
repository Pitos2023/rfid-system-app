"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle, User, Loader2, X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function TopBar({ currentView, setSidebarOpen, users, setUsers }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const profileButtonRef = useRef(null);
  const profileModalRef = useRef(null);

  // Editable form state
  const [formData, setFormData] = useState({
    first_name: users?.first_name || "",
    last_name: users?.last_name || "",
    email: users?.email || "",
    contact_number: users?.contact_number || "",
    address: users?.address || "",
  });

  useEffect(() => {
    // Sync formData when users prop changes
    setFormData({
      first_name: users?.first_name || "",
      last_name: users?.last_name || "",
      email: users?.email || "",
      contact_number: users?.contact_number || "",
      address: users?.address || "",
    });
  }, [users]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Notifications dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }

      // Profile modal
      if (profileOpen) {
        const clickedInsideModal =
          profileModalRef.current && profileModalRef.current.contains(event.target);
        const clickedProfileBtn =
          profileButtonRef.current && profileButtonRef.current.contains(event.target);
        if (!clickedInsideModal && !clickedProfileBtn) {
          setProfileOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const markAllAsRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      fetchNotifications();
    } catch (err) {
      console.error("❌ Error marking as read:", err);
    }
  };

  // ✅ FIXED handleSaveProfile (with updated_at)
  const handleSaveProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        alert("No authenticated user found.");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          contact_number: formData.contact_number,
          address: formData.address,
          updated_at: new Date().toISOString(), // ✅ Fixed column update
        })
        .eq("id", userId);

      if (error) throw error;

      setUsers({ ...users, ...formData });
      alert("✅ Profile updated successfully!");
      setProfileOpen(false);
    } catch (err) {
      console.error("❌ Error saving profile:", err);
      alert("Failed to save profile.");
    }
  };

  const titles = {
    dashboard: "Dashboard",
    students: "My Children",
    activity: "Activity Log",
    notifications: "Notifications",
    profile: "My Profile",
  };

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

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3 flex justify-between items-center sticky top-0 z-40">
        {/* LEFT */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-800"
          >
            ☰
          </button>
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
              {titles[currentView]}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">{getSubtitle()}</p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Notification */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                if (!dropdownOpen) markAllAsRead();
              }}
              className="relative p-2 rounded-full hover:bg-gray-100 text-gray-700"
            >
              <Bell className="w-5 sm:w-6 h-5 sm:h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white shadow-lg rounded-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
                <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Notifications</span>
                  <button
                    onClick={markAllAsRead}
                    className="text-xs sm:text-sm text-blue-600 hover:underline"
                  >
                    Mark all as read
                  </button>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-6 text-gray-500">
                    <Loader2 className="animate-spin mr-2" /> Loading...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center text-gray-400 py-6">No notifications yet.</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 border-b border-gray-100 ${
                        notif.is_read ? "bg-gray-50" : "bg-white"
                      } hover:bg-gray-50`}
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-800">{notif.title}</p>
                        {!notif.is_read && <CheckCircle className="text-green-500" size={16} />}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Intl.DateTimeFormat("en-PH", {
                          timeZone: "Asia/Manila",
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(notif.created_at))}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileButtonRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
            >
              <User className="w-5 sm:w-6 h-5 sm:h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setProfileOpen(false)}
          ></div>

          <div
            ref={profileModalRef}
            className="relative z-50 bg-white rounded-xl shadow-lg w-full max-w-md sm:max-w-2xl p-4 sm:p-6 mx-4 sm:mx-0 overflow-auto"
          >
            <button
              onClick={() => setProfileOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                <span className="text-white text-2xl sm:text-3xl font-bold">👩</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-800">
                {users ? `${users.first_name} ${users.last_name}` : "Parent"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">Parent Account</p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={formData.contact_number}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_number: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-[#58181F] text-white font-semibold rounded-xl hover:bg-red-800 transition"
              >
                Save
              </button>
              <button
                onClick={() => setProfileOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
