"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Send,
  Megaphone,
  AlertTriangle,
  Users,
  Calendar,
  FileText,
} from "lucide-react";

export default function AssistantPrincipalDashboard() {
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

  // ================= Fetch grades =================
  useEffect(() => {
    const fetchGrades = async () => {
      const { data, error } = await supabase
        .from("student")
        .select("grade_level")
        .order("grade_level", { ascending: true });
      if (!error && data) {
        const uniqueGrades = [...new Set(data.map((s) => s.grade_level))];
        setGrades(uniqueGrades);
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
            "Please be reminded of the upcoming examination schedule. Prepare accordingly."
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
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, role, email, full_name");
      if (usersError) throw usersError;

      let targetUsers = [];

      if (sendTo === "parents")
        targetUsers = usersData.filter((u) => u.role === "parent");
      else if (sendTo === "guards")
        targetUsers = usersData.filter((u) => u.role === "guard");
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

      if (notifications.length > 0) {
        const { error: insertError } = await supabase
          .from("notifications")
          .insert(notifications);
        if (insertError) throw insertError;
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

  // ================= Fetch Announcements (with pagination) =================
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
        urgency: item.type === "urgent" ? "URGENT" : "NORMAL",
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
          `
          id, action, consent, time_stamp,
          rfid_card(card_number),
          student(first_name, last_name)
        `,
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

  // ================= Stats Cards =================
  const statsCards = [
    { title: "Active Students", value: "1,247", icon: Users },
    { title: "Today's Entries", value: "342", icon: Calendar },
    { title: "Pending Leaves", value: "8", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans space-y-6 p-4">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-[#800000]">
        Assistant Principal Dashboard
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {statsCards.map((item, idx) => (
          <div
            key={idx}
            className="bg-[#800000] p-3 sm:p-4 rounded-2xl shadow-md flex items-center gap-3 border border-[#660000] hover:scale-105 transition-transform duration-200"
          >
            <item.icon className="text-white w-6 h-6 sm:w-8 sm:h-8" />
            <div>
              <p className="text-white text-xs sm:text-sm font-medium">
                {item.title}
              </p>
              <p className="text-white text-lg sm:text-xl font-bold">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Compose Notification Form */}
      <div className="bg-[#F4E4E4] p-4 sm:p-5 rounded-2xl shadow-md border border-[#800000] max-w-3xl mx-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 text-[#800000]">
          {type === "announcement" ? (
            <Megaphone color="#800000" />
          ) : (
            <AlertTriangle color="#800000" />
          )}
          Compose Notification
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setSubType("");
            }}
            className="w-full p-2 border border-[#800000] rounded-lg"
          >
            <option value="announcement">Announcement</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={subType}
            onChange={(e) => setSubType(e.target.value)}
            className="w-full p-2 border border-[#800000] rounded-lg"
          >
            <option value="">Select Subtype</option>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <select
            value={sendTo}
            onChange={(e) => setSendTo(e.target.value)}
            className="w-full p-2 border border-[#800000] rounded-lg"
          >
            <option value="parents">Parents</option>
            <option value="guards">Guards</option>
            <option value="both">Both</option>
          </select>

          {sendTo !== "guards" && (
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full p-2 border border-[#800000] rounded-lg"
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
          className="w-full p-2 mb-3 border border-[#800000] rounded-lg"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Message"
          rows={4}
          className="w-full p-2 mb-4 border border-[#800000] rounded-lg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-[#800000] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#660000] w-full"
        >
          <Send size={16} />
          {loading ? "Sending..." : "Send Notification"}
        </button>

        {status && <p className="mt-3 text-sm text-black">{status}</p>}
      </div>

      {/* Recent Announcements */}
      <div className="bg-[#F4E4E4] p-4 sm:p-5 rounded-2xl shadow-md border border-[#800000] max-w-3xl mx-auto">
        <h3 className="text-base sm:text-lg font-semibold mb-3 text-[#800000]">
          Recent Announcements
        </h3>
        {announcementsLoading ? (
          <p className="text-gray-700 text-sm">Loading announcements...</p>
        ) : recentAnnouncements.length === 0 ? (
          <p className="text-gray-700 text-sm">No announcements yet.</p>
        ) : (
          <>
            <ul className="space-y-2 text-black text-sm">
              {recentAnnouncements.map((item, idx) => (
                <li
                  key={idx}
                  className="p-3 border border-[#800000] rounded-lg hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-semibold text-[#800000] text-sm">
                      {item.title}
                    </h4>
                    <span
                      className={`text-xs font-semibold ${
                        item.urgency === "URGENT"
                          ? "text-red-600"
                          : "text-black"
                      }`}
                    >
                      {item.urgency}
                    </span>
                  </div>
                  <p className="text-xs mb-1">{item.message}</p>
                  <p className="text-[10px] text-gray-700">{item.date}</p>
                </li>
              ))}
            </ul>

            {/* Announcements Pagination */}
            <div className="flex justify-center items-center mt-4 space-x-2">
              <button
                onClick={() =>
                  setAnnouncementPage(Math.max(0, announcementPage - 1))
                }
                disabled={announcementPage === 0}
                className="px-3 py-1 bg-[#800000] text-white rounded-lg disabled:opacity-50"
              >
                Previous
              </button>

              {[...Array(totalAnnouncementPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnnouncementPageClick(idx)}
                  className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                    idx === announcementPage
                      ? "bg-[#800000] text-white font-semibold scale-105"
                      : "bg-[#F4E4E4] border border-[#800000] text-[#800000] hover:bg-[#ffd6d6]"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                onClick={() =>
                  setAnnouncementPage(
                    Math.min(totalAnnouncementPages - 1, announcementPage + 1)
                  )
                }
                disabled={announcementPage === totalAnnouncementPages - 1}
                className="px-3 py-1 bg-[#800000] text-white rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* History Viewer */}
      <div className="bg-[#F4E4E4] p-4 sm:p-5 rounded-2xl shadow-md border border-[#800000] max-w-3xl mx-auto">
        <h3 className="text-base sm:text-lg font-semibold mb-3 text-[#800000]">
          History Viewer
        </h3>
        {historyLoading ? (
          <p className="text-gray-700 text-sm">Loading logs...</p>
        ) : historyLogs.length === 0 ? (
          <p className="text-gray-700 text-sm">No logs available.</p>
        ) : (
          <ul className="space-y-2 text-black text-sm">
            {historyLogs.map((log, idx) => (
              <li
                key={idx}
                className="p-3 border border-[#800000] rounded-lg hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm text-[#800000]">{log.title}</p>
                  <span className="text-[10px] text-gray-700">{log.date}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-700">
                  <p>
                    RFID: {log.rfid} - {log.studentName}
                  </p>
                  <p>Consent: {log.consent}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* History Pagination */}
        <div className="flex justify-center items-center mt-4 space-x-2">
          <button
            onClick={() => setHistoryPage(Math.max(0, historyPage - 1))}
            disabled={historyPage === 0}
            className="px-3 py-1 bg-[#800000] text-white rounded-lg disabled:opacity-50"
          >
            Previous
          </button>

          {[...Array(totalHistoryPages)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleHistoryPageClick(idx)}
              className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                idx === historyPage
                  ? "bg-[#800000] text-white font-semibold scale-105"
                  : "bg-[#F4E4E4] border border-[#800000] text-[#800000] hover:bg-[#ffd6d6]"
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
            disabled={historyPage === totalHistoryPages - 1}
            className="px-3 py-1 bg-[#800000] text-white rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
