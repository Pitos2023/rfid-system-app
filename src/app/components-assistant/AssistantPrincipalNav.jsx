"use client";
import Header from "./Header";
import React, { useState, useEffect } from "react";
import { createScopedClient } from "../supabaseClient";
import {
  Send,
  Megaphone,
  AlertTriangle,
  Users,
  Calendar,
  FileText,
} from "lucide-react";

export default function AssistantPrincipalDashboard() {
  const role =
    (typeof window !== "undefined" && sessionStorage.getItem("role")) ||
    "assistant_principal";
  const supabase = createScopedClient(role);

  // ================= Compose Notification States =================
  const [type, setType] = useState("announcement");
  const [subType, setSubType] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendTo, setSendTo] = useState("parents");
  const [gradeLevel, setGradeLevel] = useState("All");
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // ================= Recent Announcements & Pagination =================
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementPage, setAnnouncementPage] = useState(0);
  const [totalAnnouncementPages, setTotalAnnouncementPages] = useState(1);
  const ANNOUNCEMENT_PAGE_SIZE = 5;

  // ================= History Logs & Pagination =================
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(0);
  const [totalHistoryPages, setTotalHistoryPages] = useState(1);
  const HISTORY_PAGE_SIZE = 5;

  // ================= Stats =================
  const [stats, setStats] = useState({
    activeStudents: 0,
    todaysEntries: 0,
    totalActivity: 0,
  });

  // ================= Fetch grades =================
  useEffect(() => {
    const fetchGrades = async () => {
      const { data, error } = await supabase
        .from("student")
        .select("grade_level")
        .order("grade_level", { ascending: true });

      if (!error && data) {
        const sortedGrades = [
          "Grade 7",
          "Grade 8",
          "Grade 9",
          "Grade 10",
          "Grade 11",
          "Grade 12",
        ];
        const uniqueGrades = [...new Set(data.map((s) => s.grade_level))];
        const organizedGrades = uniqueGrades
          .filter((grade) => sortedGrades.includes(grade))
          .sort((a, b) => sortedGrades.indexOf(a) - sortedGrades.indexOf(b));
        setGrades(organizedGrades);
      }
    };
    fetchGrades();
  }, []);

  // ================= Subtypes =================
  const announcementSubtypes = ["School Event", "Exam", "Holiday", "General"];
  const urgentSubtypes = ["Parent Meeting", "Disaster", "Emergency"];

  // ================= Auto-fill templates =================
  useEffect(() => {
    if (type === "announcement") {
      switch (subType) {
        case "School Event":
          setTitle("Upcoming School Event");
          setMessage(
            "We are excited to announce an upcoming school event. Stay tuned for details!"
          );
          break;
        case "Exam":
          setTitle("Upcoming Examination");
          setMessage(
            "Please remind your students to take the exam today. Prepare accordingly."
          );
          break;
        case "Holiday":
          setTitle("School Holiday Notice");
          setMessage(
            "Classes will be suspended in observance of the upcoming holiday."
          );
          break;
        default:
          setTitle("");
          setMessage("");
      }
    } else if (type === "urgent") {
      switch (subType) {
        case "Parent Meeting":
          setTitle("Urgent Parent Meeting");
          setMessage(
            "An important parent meeting will be held soon. Attendance is required."
          );
          break;
        case "Disaster":
          setTitle("Emergency Alert: Disaster");
          setMessage(
            "Please stay safe. School operations are temporarily suspended due to current conditions."
          );
          break;
        case "Emergency":
          setTitle("Immediate Action Required");
          setMessage(
            "This is an urgent notice. Please follow safety instructions immediately."
          );
          break;
      }
    }
  }, [type, subType]);

  // ================= Handle Send =================
  const handleSend = async () => {
    if (!title || !message) {
      alert("Please fill in both title and message fields.");
      return;
    }
    setLoading(true);
    setStatus("");

    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, role, email, full_name");
      if (usersError) throw usersError;

      let targetUsers = [];
      if (sendTo === "parents") targetUsers = usersData.filter((u) => u.role === "parent");
      else if (sendTo === "guards") targetUsers = usersData.filter((u) => u.role === "guard");
      else if (sendTo === "both")
        targetUsers = usersData.filter(
          (u) => u.role === "parent" || u.role === "guard"
        );

      if (sendTo !== "guards" && gradeLevel !== "All") {
        const { data: studentData, error: studentError } = await supabase
          .from("student")
          .select("users_id, grade_level")
          .eq("grade_level", gradeLevel);
        if (studentError) throw studentError;
        const studentUserIds = studentData.map((s) => s.users_id);
        targetUsers = targetUsers.filter((u) => studentUserIds.includes(u.id));
      }

      const notifications = targetUsers.map((user) => ({
        user_id: user.id,
        title,
        message,
        type,
        is_read: false,
        created_at: new Date(),
      }));

      // ✅ Insert notifications and send OneSignal push
      if (notifications.length > 0) {
        const { error: insertError } = await supabase
          .from("notifications")
          .insert(notifications);
        if (insertError) throw insertError;

        // 🔥 Send push notification to OneSignal
        console.log("📡 Sending push notification to OneSignal...");
        debugger; // ✅ Breakpoint to debug OneSignal push
        try {
          const response = await fetch("/api/send-push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, message }),
          });
          const result = await response.json();
          console.log("✅ OneSignal Response:", result);
        } catch (pushError) {
          console.error("❌ OneSignal push failed:", pushError);
        }

        setStatus("✅ Notifications sent successfully!");
        setAnnouncementPage(0);
        fetchAnnouncements();
      } else {
        setStatus("⚠️ No target users found for this selection.");
      }
    } catch (err) {
      console.error("❌ Notification send error:", err.message || err);
      setStatus("❌ Failed to send notifications.");
    } finally {
      setLoading(false);
    }
  };

  // ================= Fetch Announcements =================
  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      const { data, count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .in("type", ["announcement", "urgent"])
        .order("created_at", { ascending: false })
        .range(
          announcementPage * ANNOUNCEMENT_PAGE_SIZE,
          (announcementPage + 1) * ANNOUNCEMENT_PAGE_SIZE - 1
        );
      if (error) throw error;

      const mapped = data.map((item) => ({
        title: item.title || "No Title",
        message: item.message || "",
        urgency: item.type === "urgent" ? "URGENT" : "ANNOUNCEMENT",
        date: new Date(item.created_at).toLocaleString("en-US", {
          timeZone: "Asia/Manila",
          dateStyle: "short",
          timeStyle: "short",
        }),
      }));

      setRecentAnnouncements(mapped);
      setTotalAnnouncementPages(Math.ceil(count / ANNOUNCEMENT_PAGE_SIZE));
    } catch (err) {
      console.error("❌ Failed to fetch announcements:", err.message || err);
      setRecentAnnouncements([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [announcementPage]);

  const handleAnnouncementPageClick = (pageNum) => {
    setAnnouncementPage(pageNum);
  };

  // ================= Fetch History Logs =================
  const fetchHistoryLogs = async () => {
    try {
      setHistoryLoading(true);
      const { data, count, error } = await supabase
        .from("log")
        .select(
          `id, action, consent, time_stamp, rfid_card(card_number), student(first_name, last_name)`,
          { count: "exact" }
        )
        .order("time_stamp", { ascending: false })
        .range(
          historyPage * HISTORY_PAGE_SIZE,
          (historyPage + 1) * HISTORY_PAGE_SIZE - 1
        );

      if (error) throw error;

      const mappedLogs = data.map((item) => ({
        title: item.action || "No Action",
        rfid: item.rfid_card?.card_number || "N/A",
        studentName: item.student
          ? `${item.student.first_name} ${item.student.last_name}`
          : "Unknown Student",
        consent: item.consent ? "✅ Yes" : "❌ No",
        date: new Date(item.time_stamp).toLocaleString("en-PH", {
          hour12: true,
          dateStyle: "short",
          timeStyle: "short",
        }),
      }));

      setHistoryLogs(mappedLogs);
      setTotalHistoryPages(Math.ceil(count / HISTORY_PAGE_SIZE));
    } catch (err) {
      console.error("❌ Fetch history logs error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryLogs();
  }, [historyPage]);

  const handleHistoryPageClick = (pageNum) => {
    setHistoryPage(pageNum);
  };

  // ================= Fetch Stats =================
  const fetchStats = async () => {
    try {
      const { count: studentCount } = await supabase
        .from("student")
        .select("id", { count: "exact", head: true });

      const { count: totalLogs } = await supabase
        .from("log")
        .select("id", { count: "exact", head: true });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const { count: todaysLogs } = await supabase
        .from("log")
        .select("id", { count: "exact", head: true })
        .gte("time_stamp", today.toISOString())
        .lt("time_stamp", tomorrow.toISOString());

      setStats({
        activeStudents: studentCount || 0,
        todaysEntries: todaysLogs || 0,
        totalActivity: totalLogs || 0,
      });
    } catch (err) {
      console.error("❌ Failed to fetch stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // ================= Stats Cards =================
  const statsCards = [
    { title: "Active Students", value: stats.activeStudents, icon: Users },
    { title: "Today's Entries", value: stats.todaysEntries, icon: Calendar },
    { title: "Total Activity", value: stats.totalActivity, icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans">
      <Header date={new Date().toLocaleDateString()} />
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {statsCards.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#800000] p-5 rounded-2xl shadow-lg flex items-center gap-4 border border-[#660000] hover:scale-105 hover:shadow-2xl transition-transform duration-200"
            >
              <item.icon className="text-white w-10 h-10" />
              <div>
                <p className="text-white text-sm font-medium">{item.title}</p>
                <p className="text-white text-2xl font-bold">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compose Notification */}
          <div className="bg-[#F4E4E4] p-6 rounded-2xl shadow-lg border border-[#800000]">
            <h2 className="text-lg md:text-xl font-bold mb-5 flex items-center gap-3 text-[#800000]">
              {type === "announcement" ? (
                <Megaphone color="#800000" />
              ) : (
                <AlertTriangle color="#800000" />
              )}
              Compose Notification
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setSubType("");
                }}
                className="w-full p-3 border border-[#800000] rounded-lg focus:ring-2 focus:ring-[#660000] transition"
              >
                <option value="announcement">Announcement</option>
                <option value="urgent">Urgent</option>
              </select>

              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                className="w-full p-3 border border-[#800000] rounded-lg focus:ring-2 focus:ring-[#660000] transition"
              >
                <option value="">Type of Notification</option>
                {(type === "announcement"
                  ? announcementSubtypes
                  : urgentSubtypes
                ).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <select
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                className="w-full p-3 border border-[#800000] rounded-lg focus:ring-2 focus:ring-[#660000] transition"
              >
                <option value="parents">Parents</option>
                <option value="guards">Guards</option>
                <option value="both">Both</option>
              </select>

              {sendTo !== "guards" && (
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full p-3 border border-[#800000] rounded-lg focus:ring-2 focus:ring-[#660000] transition"
                >
                  <option value="All">All</option>
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <input
              type="text"
              placeholder="Title"
              className="w-full p-3 mb-4 border border-[#800000] rounded-lg focus:ring-2 focus:ring-[#660000] transition"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              placeholder="Message"
              rows={4}
              className="w-full p-3 mb-5 border border-[#800000] rounded-lg focus:ring-2 focus:ring-[#660000] transition"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-[#800000] text-white px-5 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#660000] w-full font-semibold transition"
            >
              <Send size={18} />
              {loading ? "Sending..." : "Send Notification"}
            </button>

            {status && <p className="mt-4 text-sm text-black">{status}</p>}
          </div>

          {/* Recent Announcements */}
          <div className="bg-[#F4E4E4] p-6 rounded-2xl shadow-lg border border-[#800000]">
            <h3 className="text-base md:text-lg font-semibold mb-4 text-[#800000]">
              Recent Announcements
            </h3>
            {announcementsLoading ? (
              <p className="text-gray-700 text-sm">Loading announcements...</p>
            ) : recentAnnouncements.length === 0 ? (
              <p className="text-gray-700 text-sm">No announcements yet.</p>
            ) : (
              <>
                <ul className="space-y-3 text-black text-sm">
                  {recentAnnouncements.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-4 border border-[#800000] rounded-lg hover:shadow-xl transition-shadow duration-200 bg-white"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-semibold text-[#800000] text-sm">
                          {item.title}
                        </h4>
                        <span
                          className={`text-xs font-semibold ${
                            item.urgency === "URGENT"
                              ? "text-red-600"
                              : "text-gray-800"
                          }`}
                        >
                          {item.urgency}
                        </span>
                      </div>
                      <p className="text-xs mb-1">{item.message}</p>
                      <p className="text-[10px] text-gray-500">{item.date}</p>
                    </li>
                  ))}
                </ul>

                {/* Pagination */}
                <div className="flex justify-center items-center mt-5 space-x-2 flex-wrap gap-1">
                  <button
                    onClick={() =>
                      setAnnouncementPage(Math.max(0, announcementPage - 1))
                    }
                    disabled={announcementPage === 0}
                    className="px-3 py-1 bg-[#800000] text-white rounded-md hover:bg-[#660000] disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                  >
                    Prev
                  </button>

                  {[...Array(totalAnnouncementPages)].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnnouncementPageClick(idx)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        announcementPage === idx
                          ? "bg-[#660000] text-white"
                          : "bg-gray-300 text-black hover:bg-gray-400"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setAnnouncementPage(
                        Math.min(
                          totalAnnouncementPages - 1,
                          announcementPage + 1
                        )
                      )
                    }
                    disabled={announcementPage >= totalAnnouncementPages - 1}
                    className="px-3 py-1 bg-[#800000] text-white rounded-md hover:bg-[#660000] disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* History Logs */}
        <div className="bg-[#F4E4E4] p-6 rounded-2xl shadow-lg border border-[#800000]">
          <h3 className="text-base md:text-lg font-semibold mb-4 text-[#800000]">
            History Logs
          </h3>
          {historyLoading ? (
            <p className="text-gray-700 text-sm">Loading history logs...</p>
          ) : historyLogs.length === 0 ? (
            <p className="text-gray-700 text-sm">No history logs found.</p>
          ) : (
            <>
              <ul className="space-y-3 text-black text-sm">
                {historyLogs.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-4 border border-[#800000] rounded-lg bg-white hover:shadow-xl transition-shadow duration-200"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-semibold text-[#800000] text-sm">
                        {item.title}
                      </h4>
                      <span className="text-xs text-gray-600">{item.date}</span>
                    </div>
                    <p className="text-xs mb-1">
                      <strong>Student:</strong> {item.studentName}
                    </p>
                    <p className="text-xs mb-1">
                      <strong>RFID:</strong> {item.rfid}
                    </p>
                    <p className="text-xs">
                      <strong>Consent:</strong> {item.consent}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              <div className="flex justify-center items-center mt-5 space-x-2 flex-wrap gap-1">
                <button
                  onClick={() =>
                    setHistoryPage(Math.max(0, historyPage - 1))
                  }
                  disabled={historyPage === 0}
                  className="px-3 py-1 bg-[#800000] text-white rounded-md hover:bg-[#660000] disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  Prev
                </button>

                {[...Array(totalHistoryPages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleHistoryPageClick(idx)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      historyPage === idx
                        ? "bg-[#660000] text-white"
                        : "bg-gray-300 text-black hover:bg-gray-400"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setHistoryPage(
                      Math.min(totalHistoryPages - 1, historyPage + 1)
                    )
                  }
                  disabled={historyPage >= totalHistoryPages - 1}
                  className="px-3 py-1 bg-[#800000] text-white rounded-md hover:bg-[#660000] disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
