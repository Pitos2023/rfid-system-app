"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle, User, Loader2, X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// ✅ Initialize Supabase client
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
  const [waitingNotifs, setWaitingNotifs] = useState({}); // ✅ Track waiting timers

  const dropdownRef = useRef(null);
  const profileButtonRef = useRef(null);
  const profileModalRef = useRef(null);

  const [formData, setFormData] = useState({
    first_name: users?.first_name || "",
    last_name: users?.last_name || "",
    email: users?.email || "",
    contact_number: users?.contact_number || "",
    address: users?.address || "",
  });

  useEffect(() => {
    setFormData({
      first_name: users?.first_name || "",
      last_name: users?.last_name || "",
      email: users?.email || "",
      contact_number: users?.contact_number || "",
      address: users?.address || "",
    });
  }, [users]);

  // ✅ Fetch notifications with announcements on top
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const { data: student } = await supabase
        .from("student")
        .select("grade_level")
        .eq("users_id", userId)
        .maybeSingle();

      const gradeLevel = student?.grade_level || null;

      let { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(
          gradeLevel
            ? `user_id.eq.${userId},type.eq.announcement,grade_level.eq.${gradeLevel}`
            : `user_id.eq.${userId},type.eq.announcement`
        );

      if (error) throw error;

      // ✅ Separate announcements and personal notifications
      const announcements = data.filter((n) => n.type === "announcement");
      const personal = data.filter((n) => n.type !== "announcement");

      // ✅ Sort each group by created_at descending
      announcements.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      personal.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // ✅ Merge: announcements first
      const sortedData = [...announcements, ...personal];

      setNotifications(sortedData);
      setUnreadCount(sortedData.filter((n) => !n.is_read).length || 0);

      // Start waiting timer if consent_request appears
      sortedData.forEach((notif) => {
        if (
          notif.type === "consent_request" &&
          !waitingNotifs[notif.id] &&
          notif.status !== "responded"
        ) {
          const timer = setTimeout(() => {
            autoDenyConsent(notif);
          }, 60000);
          setWaitingNotifs((prev) => ({ ...prev, [notif.id]: timer }));
        }
      });
    } catch (err) {
      console.error("❌ Fetch notifications error:", err.message || err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => {
      clearInterval(interval);
      Object.values(waitingNotifs).forEach(clearTimeout);
    };
  }, []);

  // ✅ Auto-deny handler
  const autoDenyConsent = async (notif) => {
    try {
      console.log("⏰ Auto-denying:", notif.id);
      await handleConsentResponse(notif, "no");
    } catch (err) {
      console.error("Auto deny failed:", err);
    }
  };

  // ✅ Check if lunch time (12–1 PM Manila)
  const isLunchTime = () => {
    const now = new Date();
    const manila = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const hour = manila.getHours();
    return hour >= 12 && hour < 13;
  };

  // ✅ Parent consent response
  const handleConsentResponse = async (notif, response) => {
    try {
      const logId = notif?.data?.log_id || notif?.message?.match(/log_id:(\\d+)/)?.[1];
      const parentId = notif.user_id;
      if (!logId || !parentId) return;

      // clear waiting timer if any
      if (waitingNotifs[notif.id]) {
        clearTimeout(waitingNotifs[notif.id]);
        setWaitingNotifs((prev) => {
          const updated = { ...prev };
          delete updated[notif.id];
          return updated;
        });
      }

      const res = await fetch(
        `/api/consent-response?log_id=${logId}&response=${response}&parent_id=${parentId}`,
        { method: "GET" }
      );

      if (res.ok) {
        await supabase
          .from("notifications")
          .update({ is_read: true, status: "responded" })
          .eq("id", notif.id);
        fetchNotifications();
      }
    } catch (err) {
      console.error("Consent response error:", err);
    }
  };

  // ✅ Close dropdowns outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
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

  const handleSaveProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
          updated_at: new Date().toISOString(),
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
      <header className="w-full flex justify-between items-center px-6 py-4 bg-white shadow-md relative z-30">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="text-gray-600 hover:text-gray-900 focus:outline-none lg:hidden"
          >
            ☰
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              {titles[currentView] || "Dashboard"}
            </h1>
            <p className="text-sm text-gray-500">{getSubtitle()}</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="relative p-2 rounded-full hover:bg-gray-100"
            >
              <Bell className="h-6 w-6 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="flex justify-between items-center p-3 border-b">
                  <span className="font-semibold text-gray-700">Notifications</span>
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin h-4 w-4" /> Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 border-b last:border-none ${
                          !notif.is_read ? "bg-gray-50" : "bg-white"
                        }`}
                      >
                        <p className="text-gray-700 text-sm">{notif.message}</p>

                        {isLunchTime() && notif.type === "consent_request" && (
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => handleConsentResponse(notif, "yes")}
                              className="flex-1 bg-green-500 text-white text-sm py-1 rounded-lg hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleConsentResponse(notif, "no")}
                              className="flex-1 bg-red-500 text-white text-sm py-1 rounded-lg hover:bg-red-600"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <button
            ref={profileButtonRef}
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100"
          >
            <User className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </header>

      {/* ✅ Profile Modal */}
      {profileOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div
            ref={profileModalRef}
            className="bg-white rounded-2xl shadow-2xl p-6 w-11/12 max-w-md relative animate-fadeIn"
          >
            <button
              onClick={() => setProfileOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Edit Profile
            </h2>

            <div className="space-y-3">
              {["first_name", "last_name", "email", "contact_number", "address"].map(
                (field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-600 capitalize">
                      {field.replace("_", " ")}
                    </label>
                    <input
                      type="text"
                      value={formData[field]}
                      onChange={(e) =>
                        setFormData({ ...formData, [field]: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-gray-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )
              )}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setProfileOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
