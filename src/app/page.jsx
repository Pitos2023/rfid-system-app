"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaUserCircle } from "react-icons/fa";
import { supabase } from "./supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  /* =========================================================
     🔹 Load OneSignal SDK safely (fixed for Next.js)
  ========================================================= */
  useEffect(() => {
    const loadOneSignal = () => {
      if (window.OneSignalLoaded) return;
      window.OneSignalLoaded = true;

      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;

      script.onload = async () => {
        console.log("✅ OneSignal SDK Loaded");

        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async (OneSignal) => {
          try {
            await OneSignal.init({
              appId: "4bdfec2a-071e-4173-a4ba-09f512c2227a",
              notifyButton: { enable: true },
              serviceWorkerParam: { scope: "/" },
              serviceWorkerPath: "/OneSignalSDKWorker.js",
              serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
            });
            console.log("✅ OneSignal initialized successfully");
          } catch (err) {
            console.error("❌ OneSignal init error:", err);
          }
        });
      };

      script.onerror = (e) => {
        console.error("❌ Failed to load OneSignal script:", e);
      };

      document.body.appendChild(script);
    };

    loadOneSignal();
  }, []);

  /* =========================================================
     🔹 Protect Routes for Admin & Assistant Principal
  ========================================================= */
  useEffect(() => {
    const protectRoutes = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;

      // no session → always redirect to login
      if (!user) {
        router.push("/");
        return;
      }

      // get user role from table
      const { data: userRow } = await supabase
        .from("users")
        .select("role")
        .eq("email", user.email)
        .single();

      const role = userRow?.role?.toLowerCase();

      // protect /admin route
      if (window.location.pathname.startsWith("/admin") && role !== "admin") {
        router.push("/");
        return;
      }

      // protect /assistant route
      if (
        window.location.pathname.startsWith("/assistant") &&
        role !== "assistant_principal"
      ) {
        router.push("/");
        return;
      }
    };

    protectRoutes();
  }, [router]);

  /* =========================================================
     🔹 Handle Login & Trigger Notification Permission
  ========================================================= */
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

      // Save user to localStorage
      localStorage.setItem("user", JSON.stringify(userRow));

      const role = userRow?.role?.toLowerCase() || "user";
      setSuccess(`✅ Welcome back, ${userRow?.first_name || "User"}!`);

      // 🔔 Ask OneSignal permission AFTER successful login
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async (OneSignal) => {
          try {
            const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
            if (!isOptedIn) {
              const permission = await OneSignal.Notifications.requestPermission();
              console.log("🔔 Notification permission:", permission);
              if (permission === "granted") {
                await OneSignal.User.PushSubscription.optIn();
                console.log("✅ User subscribed to notifications");
              }
            }
          } catch (err) {
            console.error("❌ Notification setup error:", err);
          }
        });
      }

      // Redirect user by role
      setLoading(false);
      setTimeout(() => {
        if (role === "admin") router.push("/admin");
        else if (role === "assistant_principal") router.push("/assistant");
        else if (role === "critique") router.push("/critique");
        else if (role === "parent") router.push("/parents");
        else if (role === "guard") router.push("/guards");
        else router.push("/");
      }, 800);
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      setError("⚠️ Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  /* =========================================================
     🔹 UI
  ========================================================= */
  return (
    <div className="flex flex-col h-screen bg-gray-100">
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
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-gray-600 text-sm mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter your password"
                  required
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
              className="w-full bg-blue-600 text-white py-2 rounded-lg shadow hover:bg-blue-700 transition-colors duration-300"
            >
              {loading ? "Logging in..." : "Log In"}
            </motion.button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
