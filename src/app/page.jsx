"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaUserCircle } from "react-icons/fa";
import { supabase } from "./supabaseClient";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // ✅ Authenticate using Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        console.error("Supabase Auth Error:", signInError.message);
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      setSuccess("✅ Login successful!");
      console.log("User:", data.user);

      // ✅ Fetch role from 'users' table (fixed table name)
      const { data: userRow, error: fetchError } = await supabase
        .from("users")
        .select("role")
        .eq("email", email.trim())
        .single();

      if (fetchError) console.error("Fetch role error:", fetchError.message);

      // Prefer table role; fallback to metadata
      const role = userRow?.role || data.user?.user_metadata?.role || "user";
      console.log("User role:", role);

      // ✅ Redirect based on role
      setTimeout(() => {
        if (role === "admin") router.push("/admin");
        else if (role === "assistant_principal") router.push("/assistant");
        else if (role === "critique") router.push("/critique");
        else if (role === "parent") router.push("/parent");
        else router.push("/");
      }, 1000);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Navbar */}
      <nav
        className="w-full text-white flex items-center justify-between px-6 py-4 shadow"
        style={{ backgroundColor: "#800000" }}
      >
        <motion.span
          className="text-lg font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          School Admin
        </motion.span>
      </nav>

      {/* Main Login Form */}
      <main className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md"
        >
          <div className="flex flex-col items-center mb-6">
            <FaUserCircle className="w-16 h-16 text-blue-600 mb-2" />
            <h2 className="text-2xl font-bold text-gray-800">System Login</h2>
            <p className="text-gray-500 text-sm">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Error / Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-red-500 text-sm text-center"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-green-600 text-sm text-center"
            >
              {success}
            </motion.div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-gray-600 text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-600 text-sm mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter your password"
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

            {/* Login Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg shadow hover:bg-blue-700 transition-colors duration-300"
            >
              {loading ? "Logging in..." : "Log In"}
            </motion.button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            <a href="#" className="hover:text-blue-600">
              Forgot Password?
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LoginPage;
