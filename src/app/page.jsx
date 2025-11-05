"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  supabaseAdmin,
  supabaseAssistant,
  supabaseGuard,
  supabaseParent,
  supabaseTemp,
} from "./supabaseClient";
import { useRouter } from "next/navigation";

const images = ["/spc-image.png", "/spc-students.png", "/images.png"];

export default function LandingPage() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectLoading, setRedirectLoading] = useState(false); // ✅ for modal loading
  const [currentImage, setCurrentImage] = useState(0);

  // 🖼️ Background carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🔑 Handle login
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("⚠️ Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data: tempLogin, error: signInError } =
        await supabaseTemp.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError("❌ Invalid email or password.");
        setLoading(false);
        return;
      }

      const { data: userRow, error: fetchError } = await supabaseTemp
        .from("users")
        .select("id, role, first_name, email")
        .eq("email", email.trim())
        .single();

      if (fetchError || !userRow) {
        setError("⚠️ Unable to fetch user info.");
        setLoading(false);
        return;
      }

      const role = userRow.role?.toLowerCase();

      let supabaseClient;
      if (role === "admin") supabaseClient = supabaseAdmin;
      else if (role === "assistant_principal") supabaseClient = supabaseAssistant;
      else if (role === "guard") supabaseClient = supabaseGuard;
      else if (role === "parent") supabaseClient = supabaseParent;
      else {
        setError("⚠️ Invalid role detected.");
        setLoading(false);
        return;
      }

      await supabaseTemp.auth.signOut();
      sessionStorage.setItem("role", role);

      await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      localStorage.setItem(`${role}-user`, JSON.stringify(userRow));
      setSuccess(`✅ Welcome back, ${userRow?.first_name || "User"}!`);

      // 🕐 Show transparent modal loading
      setRedirectLoading(true);
      setShowLogin(false);

      setTimeout(() => {
        if (role === "admin") router.push("/admin");
        else if (role === "assistant_principal") router.push("/assistant");
        else if (role === "parent") router.push("/parents");
        else if (role === "guard") router.push("/guards");
        else router.push("/");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("⚠️ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${images[currentImage]})` }}
      ></div>
      <div className="absolute inset-0 bg-[#800000] opacity-60"></div>

      {/* Welcome screen */}
      {!showLogin && !redirectLoading && (
        <div className="relative z-10 flex flex-col items-center justify-center h-screen text-center px-6">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to School System
          </h1>
          <p className="text-white max-w-xl mb-8">
            Manage students, staff, and notifications seamlessly. 
            Our platform is designed to simplify the administrative
             workload, allowing you to focus more on fostering an engaging learning environment.
          </p>
          <motion.button
            onClick={() => setShowLogin(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#800000] text-white font-semibold px-6 py-3 rounded-lg shadow-lg"
          >
            Log In
          </motion.button>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && !redirectLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-20 px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white/95 shadow-lg rounded-2xl p-6 sm:p-8 w-full max-w-md relative z-30"
          >
            {!loading && (
              <button
                onClick={() => setShowLogin(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ✕
              </button>
            )}

            <div className="flex flex-col items-center mb-6">
              <img src="/spc-logo.png" alt="SPC Logo" className="w-24 h-24 mb-3" />
              <h2 className="text-2xl font-bold text-gray-800">Login</h2>
            </div>

            {error && <div className="text-red-500 text-center mb-3">{error}</div>}
            {success && <div className="text-green-600 text-center mb-3">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 text-black">
              {/* Email */}
              <div>
                <label className="block text-gray-600 text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  placeholder="Enter your email"
                  required
                  style={{ borderColor: "#800000" }}
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-gray-600 text-sm mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    placeholder="Enter your password"
                    required
                    style={{ borderColor: "#800000" }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-gray-500 hover:text-gray-700 text-sm"
                    disabled={loading}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                whileHover={!loading ? { scale: 1.05 } : {}}
                whileTap={!loading ? { scale: 0.95 } : {}}
                disabled={loading}
                className={`w-full text-white py-2 rounded-lg shadow transition-colors duration-300 flex justify-center items-center ${
                  loading ? "opacity-80 cursor-not-allowed" : ""
                }`}
                style={{ backgroundColor: "#800000" }}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 🔥 Transparent Modal Loading (after success) */}
      <AnimatePresence>
        {redirectLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white/95 p-8 rounded-2xl shadow-lg flex flex-col items-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                className="w-10 h-10 border-4 border-[#800000] border-t-transparent rounded-full mb-4"
              ></motion.div>
              <p className="text-[#800000] text-lg ">
                Loading your dashboard...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
