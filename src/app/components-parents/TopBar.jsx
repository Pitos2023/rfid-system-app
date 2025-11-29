"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, User, Loader2, Settings, LogOut, Download, Eye, FileText, X, Menu } from "lucide-react";
import { createScopedClient } from "../supabaseClient";
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
  const [attachmentModal, setAttachmentModal] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const role = sessionStorage.getItem("role") || "parent";
  const supabase = createScopedClient(role);

  // ✅ FIXED: Function to check if current time is within consent hours (12-1 PM Manila Time)
  const isWithinConsentHours = () => {
    const now = new Date();
    const manilaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // ✅ FIXED: 8 hours, not 8 seconds
    const manilaHour = manilaTime.getUTCHours(); // Since we added 8 hours, use getUTCHours()
    
    console.log(`🕒 Current Manila Time: ${manilaTime.toISOString()}`);
    console.log(`🕒 Current Manila Hour: ${manilaHour}`);
    
    // Check if current time is between 12:00 PM and 12:59 PM (12-13 in 24-hour format)
    return manilaHour === 12; // 12 PM to 12:59 PM
  };

  // ✅ FIXED: Function to format date in Manila time
  const formatManilaTime = (dateString) => {
    if (!dateString) return "Unknown time";
    
    const date = new Date(dateString);
    
    // Format the date with Manila timezone
    return date.toLocaleString('en-US', { 
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true 
    });
  };

  // ✅ Fetch user info
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
    fetchUser();
  }, [supabase]);

  // ✅ Handle file download
  const handleDownloadAttachment = async (fileName) => {
    if (!fileName) {
      alert("No attachment available");
      return;
    }
    try {
      const { data, error } = await supabase.storage
        .from("leave-attachments")
        .download(fileName);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = fileName;
      downloadLink.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Download error:", err);
      alert("❌ Failed to download file");
    }
  };

  // ✅ Handle file view
  const handleViewAttachment = async (fileName) => {
    if (!fileName) {
      alert("No attachment available");
      return;
    }
    try {
      const { data } = supabase.storage
        .from("leave-attachments")
        .getPublicUrl(fileName);

      setSelectedAttachment(data.publicUrl);
      setAttachmentModal(true);
    } catch (err) {
      console.error("❌ View attachment error:", err);
      alert("❌ Failed to load file");
    }
  };

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

  // ✅ Fetch notifications on load only
  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscription for notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('🔔 Real-time notification update:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

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
        setShowUpdateProfile(false);
        fetchUser();
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
      <header className="w-full flex justify-between items-center px-6 py-4 bg-white shadow-md border-b border-gray-200">
        <div className="flex items-center gap-4 w-full">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Title */}
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-800">
              {currentView === "notifications" ? "Notifications" : "Dashboard"}
            </h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileOpen(false);
                }}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-6 w-6 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-12 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
                  >
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">Notifications</span>
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:underline font-medium"
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
                            className={`p-4 border-b border-gray-100 last:border-none ${
                              !notif.is_read ? "bg-blue-50" : "bg-white"
                            } hover:bg-gray-50 transition-colors`}
                          >
                            {/* Leave Notification */}
                            {notif.type === "leave" && (
                              <div className="space-y-2">
                                <p className="text-gray-700 font-medium">{notif.title}</p>
                                <p className="text-gray-600 text-sm">{notif.message}</p>
                                {notif.metadata?.reason && (
                                  <p className="text-sm text-blue-600">
                                    <strong>Reason:</strong> {notif.metadata.reason}
                                  </p>
                                )}
                                {notif.leave_files && (
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={() => handleViewAttachment(notif.leave_files)}
                                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                                    >
                                      <Eye size={14} />
                                      View
                                    </button>
                                    <button
                                      onClick={() => handleDownloadAttachment(notif.leave_files)}
                                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                                    >
                                      <Download size={14} />
                                      Download
                                    </button>
                                  </div>
                                )}
                                {notif.metadata?.signature && (
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-600 mb-1">
                                      <strong>Signature:</strong>
                                    </p>
                                    <img
                                      src={notif.metadata.signature}
                                      alt="Signature"
                                      className="h-8 border border-gray-300 rounded"
                                    />
                                  </div>
                                )}
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatManilaTime(notif.created_at)}
                                </p>
                              </div>
                            )}

                            {/* Consent Request Notification */}
                            {notif.type === "consent_request" && (
                              <>
                                <p className="text-gray-700 text-sm mb-3">
                                  {notif.message}
                                </p>
                                
                                {/* ✅ FIXED: Check if within consent hours and status is pending */}
                                {notif.status === "pending" && isWithinConsentHours() ? (
                                  <div className="mt-2 flex gap-2">
                                    <button
                                      onClick={() => handleConsentResponse(notif, "yes")}
                                      className="flex-1 bg-green-500 text-white text-sm py-2 rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      onClick={() => handleConsentResponse(notif, "no")}
                                      className="flex-1 bg-red-500 text-white text-sm py-2 rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : notif.status === "pending" ? (
                                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                                    ⏰ Consent responses are only available between 12:00 PM - 12:59 PM
                                  </div>
                                ) : null}
                                
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatManilaTime(notif.created_at)}
                                </p>
                              </>
                            )}

                            {/* Regular Notifications */}
                            {notif.type !== "leave" && notif.type !== "consent_request" && (
                              <div>
                                <p className="text-gray-700 font-medium">{notif.title}</p>
                                <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatManilaTime(notif.created_at)}
                                </p>
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

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full transition-all duration-200"
                aria-label="Profile menu"
              >
                <User className="h-6 w-6 text-gray-700" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-12 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800 block">
                          {user ? `${user.first_name} ${user.last_name}` : "Parent"}
                        </span>
                        <p className="text-xs text-gray-500">Parent Account</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowUpdateProfile(true)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 text-gray-700 font-medium transition flex items-center gap-2"
                    >
                      <Settings size={16} /> Update Profile
                    </button>

                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-600 font-medium transition flex items-center gap-2"
                    >
                      <LogOut size={16} /> Log Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Update Profile Modal */}
      <AnimatePresence>
        {showUpdateProfile && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Update Profile</h2>
                <button
                  onClick={() => setShowUpdateProfile(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label htmlFor="first_name" className="block text-gray-700 text-sm font-semibold mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-gray-700 text-sm font-semibold mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-gray-700 text-sm font-semibold mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="contact_number" className="block text-gray-700 text-sm font-semibold mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    id="contact_number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={profileData.contact_number}
                    onChange={(e) => setProfileData({ ...profileData, contact_number: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUpdateProfile(false)}
                    className="flex-1 px-4 py-3 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment Modal */}
      {attachmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Document Preview</h3>
              <button
                onClick={() => {
                  setAttachmentModal(false);
                  setSelectedAttachment(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-6 overflow-auto">
              {selectedAttachment && (
                <>
                  {selectedAttachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div className="flex justify-center">
                      <img
                        src={selectedAttachment}
                        alt="Attachment Preview"
                        className="max-w-full h-auto max-h-[60vh] rounded-lg border border-gray-300 object-contain"
                      />
                    </div>
                  ) : selectedAttachment.match(/\.(pdf)$/i) ? (
                    <div className="w-full h-[50vh]">
                      <iframe
                        src={selectedAttachment}
                        className="w-full h-full rounded-lg border border-gray-300"
                        title="PDF Preview"
                      />
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-gray-100 rounded-lg">
                      <FileText size={48} className="mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-700 mb-4">
                        Preview not available for this file type
                      </p>
                      <button
                        onClick={() => handleDownloadAttachment(selectedAttachment.split('/').pop())}
                        className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        <Download size={16} />
                        Download File
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-10 h-10 mx-auto text-red-600 animate-spin mb-3" />
                  <p className="text-gray-700 font-medium">Logging out, please wait...</p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold mb-3 text-gray-800">Confirm Logout</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Are you sure you want to log out?
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={confirmLogout}
                      className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-medium"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setShowLogoutModal(false)}
                      className="flex-1 px-4 py-3 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition font-medium"
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