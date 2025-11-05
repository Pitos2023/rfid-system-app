"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, ShieldCheck, Bell } from "lucide-react";
import React, { useState } from "react";
import { supabaseAdmin } from "@/app/supabaseClient"; // adjust import path if needed

export default function AdminSettingsModal({ isOpen, onClose }) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = () => {
    alert("✅ Privacy settings have been updated.");
    onClose();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage("⚠️ Please fill out all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("❌ New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabaseAdmin.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      setMessage("✅ Password updated successfully!");
      setShowPasswordForm(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage("❌ Failed to update password. " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] px-3 sm:px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md md:max-w-lg border border-gray-200 relative max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* ❌ Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={22} />
            </button>

            {/* 🧠 Modal Title */}
            <div className="mb-4 sm:mb-6 mt-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">
                Settings & Privacy
              </h2>
              <p className="text-sm sm:text-base text-gray-500">
                Manage your privacy, security, and notifications.
              </p>
            </div>

            {/* ⚙️ Settings Options */}
            <div className="space-y-6 sm:space-y-8">
              {/* 🔐 Change Password */}
              <div className="border-b border-gray-200 pb-4 sm:pb-5">
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="text-[#800000]" size={20} />
                  <h3 className="font-semibold text-gray-800 text-base sm:text-lg">
                    Change Password
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Update your account password for better security.
                </p>

                {!showPasswordForm ? (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#a00000] text-sm transition w-full sm:w-auto"
                  >
                    Change Password
                  </button>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <input
                      type="password"
                      placeholder="Old password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 sm:p-3 text-sm focus:ring-2 focus:ring-[#800000] outline-none"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 sm:p-3 text-sm focus:ring-2 focus:ring-[#800000] outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 sm:p-3 text-sm focus:ring-2 focus:ring-[#800000] outline-none"
                    />

                    {message && (
                      <p className="text-xs sm:text-sm text-center text-gray-600">
                        {message}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(false)}
                        className="text-gray-600 hover:underline text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#a00000] text-sm transition"
                      >
                        {loading ? "Saving..." : "Save Password"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 🛡️ Two-Factor Authentication */}
              <div className="border-b border-gray-200 pb-4 sm:pb-5">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="text-[#800000]" size={20} />
                  <h3 className="font-semibold text-gray-800 text-base sm:text-lg">
                    Two-Factor Authentication
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Add an extra layer of protection to your account.
                </p>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                    className="accent-[#800000] w-4 h-4"
                  />
                  Enable 2FA
                </label>
              </div>

              {/* 🔔 Notifications */}
              <div className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <Bell className="text-[#800000]" size={20} />
                  <h3 className="font-semibold text-gray-800 text-base sm:text-lg">
                    Notifications
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Control how and when you receive alerts.
                </p>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="accent-[#800000] w-4 h-4"
                  />
                  Enable push notifications
                </label>
              </div>
            </div>

            {/* 💾 Save Button */}
            <button
              onClick={handleSave}
              className="w-full mt-6 bg-[#800000] text-white font-medium py-2 sm:py-3 rounded-lg hover:bg-[#a00000] transition text-sm sm:text-base"
            >
              Save Changes
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
