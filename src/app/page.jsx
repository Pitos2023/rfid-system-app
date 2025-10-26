"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaUserCircle } from "react-icons/fa";
import { supabase } from "./supabaseClient";
import { useRouter } from "next/navigation";

const images = [
  "/spc-image.png",
  "/spc-students.png",
  "/images.png",
];

export default function LandingPage() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  // Carousel effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError("❌ Invalid email or password.");
        setLoading(false);
        return;
      }

      const { data: userRow, error: fetchError } = await supabase
        .from("users")
        .select("id, role, first_name, email")
        .eq("email", email.trim())
        .single();

      if (fetchError) {
        setError("⚠️ Unable to fetch user info.");
        setLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(userRow));
      setSuccess(`✅ Welcome back, ${userRow?.first_name || "User"}!`);

      const role = userRow?.role?.toLowerCase() || "user";

      setTimeout(() => {
        if (role === "admin") router.push("/admin");
        else if (role === "assistant_principal") router.push("/assistant");
        else if (role === "critique") router.push("/critique");
        else if (role === "parent") router.push("/parents");
        else if (role === "guard") router.push("/guards");
        else router.push("/");
      }, 800);
    } catch (err) {
      console.error(err);
      setError("⚠️ Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${images[currentImage]})` }}
      ></div>

      {/* Maroon transparent overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "#800000", opacity: 0.6 }}
      ></div>

      {/* Landing Content (hidden when modal is open) */}
      {!showLogin && (
        <div className="relative z-10 flex flex-col items-center justify-center h-screen text-center px-6 sm:px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to School System
          </h1>
          <p className="text-white max-w-xl text-sm sm:text-base md:text-lg mb-8">
            Manage students, staff, and notifications seamlessly. Our system keeps your
            school organized and connected.
          </p>
          <motion.button
            onClick={() => setShowLogin(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-white font-semibold px-6 py-3 rounded-lg shadow transition-colors duration-300"
            style={{ backgroundColor: "#800000" }}
          >
            Log In Users
          </motion.button>
        </div>
      )}
{/* Login Modal */}
{showLogin && (
  <div className="fixed inset-0 flex items-center justify-center z-20 px-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white/90 shadow-lg rounded-2xl p-6 sm:p-8 w-full max-w-md relative backdrop-blur-sm"
      // bg-white/90 makes it semi-transparent
      // backdrop-blur-sm adds a subtle blur behind modal
    >
      {/* ❌ Close Button */}
      <button
        onClick={() => setShowLogin(false)}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
        aria-label="Close Login Modal"
      >
        ✕
      </button>

      {/* Image instead of icon */}
      <div className="flex flex-col items-center mb-6">
        <img
          src="/spc-logo.png"
          alt="Login"
          className="w-24 h-24 sm:w-28 sm:h-28 mb-2 object-contain"
        />
        <h2 className="text-2xl font-bold text-gray-800">Login</h2>
      </div>

      {error && (
        <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
      )}
      {success && (
        <div className="mb-4 text-green-600 text-sm text-center">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div>
          <label className="block text-gray-600 text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
            placeholder="Enter your email"
            required
            style={{ borderColor: "#800000", focusBorderColor: "#800000" }}
          />
        </div>

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
              style={{ borderColor: "#800000", focusBorderColor: "#800000" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="w-full text-white py-2 rounded-lg shadow transition-colors duration-300"
          style={{ backgroundColor: "#800000" }}
        >
          {loading ? "Logging in..." : "Log In"}
        </motion.button>
      </form>
    </motion.div>
  </div>
)}


    </div>
  );
}
