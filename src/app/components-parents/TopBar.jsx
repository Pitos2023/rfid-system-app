"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, User, Loader2, Settings, LogOut } from "lucide-react";
import { createScopedClient } from "../supabaseClient";  // Import the role-based client
import { motion, AnimatePresence } from "framer-motion";

export default function TopBar({ currentView, setSidebarOpen }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState(null);
  const [showUpdateProfile, setShowUpdateProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    address: "",
    contact_number: "",
  });

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // ✅ Dynamically select the correct Supabase client based on the role
  const role = sessionStorage.getItem("role") || "parent";  // Example role, can be dynamically set
  const supabase = createScopedClient(role); // Use role-specific client

  // ✅ Fetch user info using the role-based client
  const fetchUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const { data, error } = await supabase
        .from("users")
        .select("first_name, last_name, email, address, contact_number")
        .eq("id", session.user.id)
        .single();

      if (!error) {
        setUser(data);
        setProfileData({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          address: data.address || "",
          contact_number: data.contact_number || "",
        });
      } else {
        console.error("❌ Error fetching user:", error);
      }
    }
  };

  useEffect(() => {
    fetchUser();  // Fetch user on mount
  }, [supabase]);

  // ✅ Fetch notifications
  const fetchNotifications = async () => {
    console.log("🔄 Starting fetchNotifications...");
    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("❌ Session fetch error:", sessionError);
        return;
      }

      const userId = session?.user?.id;
      if (!userId) {
        console.warn("⚠️ No user ID found in session.");
        return;
      }

      // Query notifications table
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Supabase query error:", error);
        return;
      }

      console.log("📬 Notifications fetched:", data);

      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error("💥 Fetch notifications failed:", err);
    } finally {
      setLoading(false);
      console.log("✅ fetchNotifications() finished.\n");
    }
  };

  // ✅ Fetch notifications on load and interval
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [supabase]); // Dependency array includes supabase

  // ✅ Handle update profile form submission
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        alert("User not authenticated.");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update(profileData)
        .eq("id", userId);

      if (error) {
        alert("Failed to update profile.");
        console.error("❌ Profile update error:", error);
      } else {
        alert("Profile updated successfully!");
        setShowUpdateProfile(false);  // Close the update form
        fetchUser();  // Refetch user data
      }
    } catch (err) {
      console.error("💥 Update profile failed:", err);
    }
  };

  // ✅ Handle consent response
  const handleConsentResponse = async (notif, response) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const parent_id = session?.user?.id;
      const log_id = notif?.log_id;

      if (!log_id || !parent_id) {
        alert("Invalid consent data.");
        return;
      }

      const res = await fetch("/api/consent-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: response,
          log_id,
          parent_id,
          notification_id: notif.id,
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert(result.message);
        fetchNotifications();
      } else {
        alert("❌ Failed to update consent: " + result.message);
      }
    } catch (err) {
      console.error("💥 Consent response failed:", err);
    }
  };

  // ✅ Mark all notifications as read
  const markAllAsRead = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId);
    fetchNotifications();
  };

  // ✅ Logout handling
  const confirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setTimeout(() => {
        setIsLoggingOut(false);
        setShowLogoutModal(false);
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      alert("Error logging out. Please try again.");
      console.error(err);
      setIsLoggingOut(false);
    }
  };

  // ✅ Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        (notifRef.current && notifRef.current.contains(e.target)) ||
        (profileRef.current && profileRef.current.contains(e.target))
      )
        return;
      setNotifOpen(false);
      setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              {currentView === "notifications" ? "Notifications" : "Dashboard"}
            </h1>
            <p className="text-sm text-gray-500">
              Welcome back, {user?.first_name} {user?.last_name}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* 🔔 Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
              className="relative p-2 rounded-full hover:bg-gray-100"
            >
              <Bell className="h-6 w-6 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
                >
                  <div className="flex justify-between items-center p-3 border-b">
                    <span className="font-semibold text-gray-700">
                      Notifications
                    </span>
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
                          <p className="text-gray-700 text-sm">
                            {notif.message}
                          </p>

                          {notif.type === "consent_request" &&
                            notif.status === "pending" && (
                              <div className="mt-2 flex gap-2">
                                <button
                                  onClick={() =>
                                    handleConsentResponse(notif, "yes")
                                  }
                                  className="flex-1 bg-green-500 text-white text-sm py-1 rounded-lg hover:bg-green-600"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() =>
                                    handleConsentResponse(notif, "no")
                                  }
                                  className="flex-1 bg-red-500 text-white text-sm py-1 rounded-lg hover:bg-red-600"
                                >
                                  No
                                </button>
                              </div>
                            )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 👤 Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full transition"
            >
              <User className="h-6 w-6 text-gray-700" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
                >
                  {/* User Info */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                    <div>
                      <span className="font-semibold text-gray-800">
                        {user
                          ? `${user.first_name} ${user.last_name}`
                          : "Parent"}
                      </span>
                      <p className="text-xs text-gray-500">Parent Account</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowUpdateProfile(true)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium transition flex items-center gap-2"
                  >
                    <Settings size={16} /> Update Profile
                  </button>

                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 font-medium transition flex items-center gap-2"
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Update Profile Modal */}
      <AnimatePresence>
        {showUpdateProfile && (
          <motion.div
            className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-sm text-center border border-gray-200"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-lg font-semibold mb-2 text-gray-800">
                Update Profile
              </h2>

              {/* Profile Form */}
              <form onSubmit={handleUpdateProfile}>
                <div className="mb-4">
                  <label
                    htmlFor="first_name"
                    className="block text-gray-700 text-sm font-semibold"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    className="mt-1 p-2 border w-full rounded-md"
                    value={profileData.first_name}
                    onChange={(e) =>
                      setProfileData((prevData) => ({
                        ...prevData,
                        first_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="last_name"
                    className="block text-gray-700 text-sm font-semibold"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    className="mt-1 p-2 border w-full rounded-md"
                    value={profileData.last_name}
                    onChange={(e) =>
                      setProfileData((prevData) => ({
                        ...prevData,
                        last_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="address"
                    className="block text-gray-700 text-sm font-semibold"
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    className="mt-1 p-2 border w-full rounded-md"
                    value={profileData.address}
                    onChange={(e) =>
                      setProfileData((prevData) => ({
                        ...prevData,
                        address: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="contact_number"
                    className="block text-gray-700 text-sm font-semibold"
                  >
                    Contact Number
                  </label>
                  <input
                    type="text"
                    id="contact_number"
                    className="mt-1 p-2 border w-full rounded-md"
                    value={profileData.contact_number}
                    onChange={(e) =>
                      setProfileData((prevData) => ({
                        ...prevData,
                        contact_number: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex justify-center gap-4 mt-6">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowUpdateProfile(false)}
                    className="px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-sm text-center border border-gray-200"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-10 h-10 mx-auto text-red-600 animate-spin mb-3" />
                  <p className="text-gray-700 font-medium">
                    Logging out, please wait...
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold mb-2 text-gray-800">
                    Confirm Logout
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to log out?
                  </p>

                  <div className="flex justify-center gap-4">
                    <button
                      onClick={confirmLogout}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setShowLogoutModal(false)}
                      className="px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition"
                    >
                      No
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}