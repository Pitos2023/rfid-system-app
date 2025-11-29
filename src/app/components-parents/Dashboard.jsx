"use client";

import { useState, useEffect, useRef } from "react";
import { createScopedClient } from "../supabaseClient";

export default function Students({ user }) {
  const role =
    (typeof window !== "undefined" && sessionStorage.getItem("role")) || "parent";
  const supabase = createScopedClient(role);

  const [students, setStudents] = useState([]);
  const [studentLogs, setStudentLogs] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const intervalRef = useRef(null);

  // ✅ Initialize OneSignal and store Player ID
  useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return;

    const existingScript = document.querySelector(
      'script[src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src =
        "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => initOneSignal();
    } else {
      initOneSignal();
    }

    async function initOneSignal() {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal) {
        if (OneSignal.initialized) return;

        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: true },
        });

        OneSignal.initialized = true;
        console.log("✅ OneSignal initialized successfully");

        // Request permission only when it's sensible, handle rejects and fallbacks.
        try {
          // Only prompt if browser permission is "default" (not granted/denied)
          if (Notification.permission === "default") {
            // requestPermission can throw when user dismisses — catch below
            await OneSignal.Notifications.requestPermission();
          } else {
            console.log("🔔 Skipping prompt, Notification.permission:", Notification.permission);
          }
        } catch (err) {
          // OneSignal may throw when the user dismisses the native prompt.
          console.warn("⚠️ OneSignal.requestPermission threw:", err);
        }

        // Read final permission from browser (more reliable than relying on what requestPermission returned)
        const finalPermission = (typeof Notification !== "undefined" && Notification.permission) || "default";
        console.log("🔔 Permission status:", finalPermission);

        if (finalPermission === "granted") {
          await savePlayerId(OneSignal);
        } else {
          console.warn("🔔 Notification permission not granted; will not save player id.");
        }

        // --- DEBUG: log OneSignal internals, SW & Push subscription ---
        async function debugOneSignal() {
          try {
            console.log("🔍 OneSignal object:", OneSignal);
            // Player ID (web SDK v16+) — read safely
            try {
              const playerId = (OneSignal?.User?.PushSubscription && OneSignal.User.PushSubscription.id) || (OneSignal.getUserId && (await OneSignal.getUserId?.()));
              console.log("🎯 OneSignal Player ID (from SDK):", playerId);
            } catch (e) {
              console.warn("⚠️ Error reading OneSignal Player ID:", e);
            }

            // Notification permission
            console.log("🔔 Notification.permission:", Notification.permission);

            // Service worker registration & push subscription
            if ("serviceWorker" in navigator) {
              const reg = await navigator.serviceWorker.getRegistration();
              console.log("🧾 Service Worker registration:", reg);
              if (reg) {
                try {
                  const sub = await reg.pushManager.getSubscription();
                  console.log("🔑 PushManager subscription:", sub);
                } catch (e) {
                  console.warn("⚠️ pushManager.getSubscription() failed:", e);
                }
              } else {
                console.warn("⚠️ No service worker registration found at page scope");
              }
            } else {
              console.warn("⚠️ serviceWorker not supported in this browser");
            }

            // OneSignal Notifications event hooks (more logging)
            try {
              OneSignal.Notifications.addEventListener("permissionChange", (ev) =>
                console.log("OneSignal.permissionChange ->", ev)
              );

              // Safe foreground logger — do NOT call event.notification.display() here
              OneSignal.Notifications.addEventListener("foregroundWillDisplay", (event) => {
                console.log("OneSignal.foregroundWillDisplay ->", event);
              });

              OneSignal.Notifications.addEventListener("notificationDisplay", (ev) =>
                console.log("OneSignal.notificationDisplay ->", ev)
              );
              OneSignal.Notifications.addEventListener("notificationClick", (ev) =>
                console.log("OneSignal.notificationClick ->", ev)
              );
            } catch (e) {
              console.warn("⚠️ Unable to attach OneSignal event listeners:", e);
            }
          } catch (err) {
            console.error("❌ debugOneSignal error:", err);
          }
        }

        // call debug helper
        debugOneSignal();

        // Robust foreground handler: only prevent default if supported,
        // otherwise let the SDK/browser show the notification.
        OneSignal.Notifications.addEventListener(
          "foregroundWillDisplay",
          (event) => {
            console.log("OneSignal.foregroundWillDisplay ->", event);
            if (typeof event.preventDefault === "function") {
              try {
                event.preventDefault();

                const n = event.notification || {};
                const title = n.title || (n.headings && n.headings.en) || "Notification";
                const body =
                  n.body || (n.contents && n.contents.en) || n.message || "";
                const icon = n.icon || "/icon.png";

                if (Notification.permission === "granted") {
                  new Notification(title, {
                    body,
                    icon,
                    data: n.data || {},
                  });
                } else {
                  console.warn("Notification permission not granted for manual display");
                }
              } catch (err) {
                console.warn("⚠️ Failed to prevent/display notification:", err);
              }
            } else {
              console.log("⤷ Cannot prevent SDK display on this browser; allowing default display");
            }
          }
        );

        // Background / permission change
        OneSignal.Notifications.addEventListener("permissionChange", async (event) => {
          console.log("🔄 Notification permission changed:", event.to);
          // After permission becomes granted, try to save player id
          if (event.to === "granted") await savePlayerId(OneSignal);
        });

        // Handle notification click - redirect to dashboard
        OneSignal.Notifications.addEventListener("notificationClick", (event) => {
          console.log("Notification clicked:", event);
          window.location.href = "https://sarahi-recriminatory-liane.ngrok-free.dev/parents?view=dashboard";
        });
      });
    }

    // 🔹 Save OneSignal Player ID to Supabase (with retries & fallbacks)
    async function savePlayerId(OneSignal, retries = 0) {
      try {
        // Try multiple ways to get a stable player id
        let playerId =
          (OneSignal?.User?.PushSubscription && OneSignal.User.PushSubscription.id) ||
          (OneSignal.getUserId && (await OneSignal.getUserId?.())) ||
          (OneSignal.getUser && (await OneSignal.getUser?.())?.id) ||
          null;

        if (!playerId) {
          // if browser permission is granted we may need to wait a bit for the SDK to register
          if (retries < 6) {
            console.warn(`⚠️ No Player ID found, retrying... (${retries + 1}/6)`);
            setTimeout(() => savePlayerId(OneSignal, retries + 1), 2000);
          } else {
            console.error("❌ Failed to retrieve OneSignal Player ID after multiple attempts.");
          }
          return;
        }

        // Save to Supabase only when we have a valid string id
        if (typeof playerId === "string" && playerId.length > 0) {
          const { error } = await supabase
            .from("users")
            .update({ onesignal_player_id: playerId })
            .eq("id", user.id);

          if (error) {
            console.error("❌ Failed to save OneSignal ID:", error);
          } else {
            console.log("✅ OneSignal ID saved successfully to Supabase!", playerId);
          }
        } else {
          console.warn("⚠️ Player ID is not a valid string, not saving:", playerId);
        }
      } catch (err) {
        console.error("❌ Error getting OneSignal Player ID:", err);
      }
    }
  }, [user?.id]);

  // ✅ Ensure role persistence
  useEffect(() => {
    if (user?.id && !sessionStorage.getItem("role")) {
      const fetchUserRole = async () => {
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) console.error("Error fetching user role:", error);
        else {
          const role = data?.role || "parent";
          sessionStorage.setItem("role", role);
          console.log("User role:", role);
        }
      };
      fetchUserRole();
    }
  }, [user?.id]);

  // 🎓 Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.id) return;
      setLoadingStudents(true);

      const { data, error } = await supabase
        .from("student")
        .select(
          "id, first_name, last_name, school_id, grade_level, section, birthdate, student_pic"
        )
        .eq("users_id", user.id);

      if (error) {
        console.error("Error fetching students:", error.message);
        setStudents([]);
      } else {
        setStudents(data || []);
      }

      setLoadingStudents(false);
    };

    fetchStudents();
  }, [user]);

  // 🧾 Fetch student logs
  const fetchStudentLogs = async (studentId) => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/rfid-logs");
      const { logs, error } = await res.json();

      if (error) {
        console.error("Error fetching logs:", error);
        setStudentLogs([]);
      } else {
        const filtered = logs.filter(
          (log) => log.student && log.student.id === studentId
        );
        setStudentLogs(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch student logs:", err);
      setStudentLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  // 🪟 Modal logic
  const handleViewLogs = async (student) => {
    setSelectedStudent(student);
    await fetchStudentLogs(student.id);
    setShowModal(true);

    intervalRef.current = setInterval(() => {
      fetchStudentLogs(student.id);
    }, 5000);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    clearInterval(intervalRef.current);
  };

  // 🔔 Realtime notifications from Supabase
  useEffect(() => {
    if (!user?.id) return;
    Notification.requestPermission();

    const channel = supabase
      .channel("realtime:notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const notif = payload.new;
          console.log("📢 New notification received:", notif);

          // Use service worker to show notification (required when SW is active)
          if ("serviceWorker" in navigator && Notification.permission === "granted") {
            try {
              const reg = await navigator.serviceWorker.getRegistration();
              if (reg) {
                await reg.showNotification(notif.title || "New Alert", {
                  body: notif.message || "You have a new notification!",
                  icon: "/icon.png",
                  badge: "/icon.png",
                  data: notif,
                });
              } else {
                console.warn("⚠️ No service worker registration found");
              }
            } catch (err) {
              console.error("❌ Failed to show notification:", err);
            }
          } else {
            // Fallback: alert if no service worker or permission denied
            console.warn("Service worker unavailable or permission denied");
            alert(`📢 ${notif.title}: ${notif.message}`);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  // 🌀 Loading states
  if (loadingStudents)
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <p className="text-gray-600 text-lg">Loading your students...</p>
      </div>
    );

  if (students.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <p className="text-gray-500 text-lg">
          No students assigned to your account yet.
        </p>
      </div>
    );

  // Add this helper at the top of the component (before return statement)
  const convertToPhilippineTime = (isoString) => {
    const date = new Date(isoString);
    const formatter = new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return formatter.format(date);
  };

  // 🎓 Display student list and logs modal
  return (
    <div id="studentsView" className="p-4">
      {/* 👩‍🎓 Student cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
          >
            <div className="p-4 text-center border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
              <div className="w-16 h-16 bg-gradient-to-br from-[#800000] to-[#9c1c1c] rounded-full flex items-center justify-center mx-auto mb-2 shadow overflow-hidden">
                {s.student_pic ? (
                  <img
                    src={s.student_pic}
                    alt={`${s.first_name} ${s.last_name}`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-800 truncate">
                {s.first_name} {s.last_name}
              </h3>
              <p className="text-gray-600 text-sm truncate">
                {s.grade_level} - {s.section}
              </p>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div>
                  <label className="font-medium text-gray-500">Student ID</label>
                  <p className="text-gray-800 font-semibold truncate">
                    {s.school_id}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Birthdate</label>
                  <p className="text-gray-800 font-semibold">
                    {s.birthdate
                      ? new Date(s.birthdate).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleViewLogs(s)}
                className="w-full bg-[#800000] text-white py-2 rounded-lg font-semibold shadow hover:bg-[#9c1c1c] transition-colors text-sm"
              >
                View Activity Log
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 📜 Modal for student logs */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-2xl p-4 relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-3 text-center text-gray-800">
              {selectedStudent.first_name} {selectedStudent.last_name} — Logs
            </h2>

            {loadingLogs ? (
              <p className="text-center text-gray-500 text-sm">Loading logs...</p>
            ) : studentLogs.length === 0 ? (
              <p className="text-center text-gray-500 text-sm">
                No logs found for this student.
              </p>
            ) : (
              <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-100 text-sm">
                {studentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex justify-between items-center py-1.5"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 capitalize">
                        {log.action.replace("_", " ")}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {convertToPhilippineTime(log.time_stamp)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold text-xs ${
                        log.action.includes("in")
                          ? "bg-green-100 text-green-700"
                          : "bg-[#f2dede] text-[#800000]"
                      }`}
                    >
                      {log.action.includes("in") ? "IN" : "OUT"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
