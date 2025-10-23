"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Send, Megaphone, AlertTriangle } from "lucide-react";

export default function NotificationComposer() {
  const [type, setType] = useState("announcement");
  const [subType, setSubType] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendTo, setSendTo] = useState("parents");
  const [gradeLevel, setGradeLevel] = useState("All");
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // 🔹 Fetch available grade levels
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

  // 🔹 Subtype options
  const announcementSubtypes = ["School Event", "Exam", "Holiday", "General"];
  const urgentSubtypes = ["Parent Meeting", "Disaster", "Emergency"];

  // 🔹 Auto-fill templates
  useEffect(() => {
    if (type === "announcement") {
      switch (subType) {
        case "School Event":
          setTitle("Upcoming School Event");
          setMessage("We are excited to announce an upcoming school event. Stay tuned for details!");
          break;
        case "Exam":
          setTitle("Upcoming Examination");
          setMessage("Please be reminded of the upcoming examination schedule. Prepare accordingly.");
          break;
        case "Holiday":
          setTitle("School Holiday Notice");
          setMessage("Classes will be suspended in observance of the upcoming holiday.");
          break;
        case "General":
          setTitle("");
          setMessage("");
          break;
      }
    } else if (type === "urgent") {
      switch (subType) {
        case "Parent Meeting":
          setTitle("Urgent Parent Meeting");
          setMessage("An important parent meeting will be held soon. Attendance is required.");
          break;
        case "Disaster":
          setTitle("Emergency Alert: Disaster");
          setMessage("Please stay safe. School operations are temporarily suspended due to current conditions.");
          break;
        case "Emergency":
          setTitle("Immediate Action Required");
          setMessage("This is an urgent notice. Please follow safety instructions immediately.");
          break;
      }
    }
  }, [type, subType]);

  // 🔹 Send handler
  const handleSend = async () => {
    if (!title || !message) {
      alert("Please fill in both title and message fields.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      let { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, role, student_id");

      if (usersError) throw usersError;

      let targetUsers = [];

      // ✅ Determine recipients
      if (sendTo === "parents") {
        targetUsers = users.filter((u) => u.role === "parent");
      } else if (sendTo === "guards") {
        targetUsers = users.filter((u) => u.role === "guard");
      } else if (sendTo === "both") {
        targetUsers = users.filter((u) => u.role === "parent" || u.role === "guard");
      }

      // ✅ Filter parents by grade level if selected
      if (sendTo !== "guards" && gradeLevel !== "All") {
        const { data: students } = await supabase
          .from("student")
          .select("id, grade_level")
          .eq("grade_level", gradeLevel);

        const gradeStudentIds = students.map((s) => s.id);
        targetUsers = targetUsers.filter((u) => gradeStudentIds.includes(u.student_id));
      }

      // ✅ Insert notifications
      const notifications = targetUsers.map((user) => ({
        user_id: user.id,
        title,
        message,
        type,
        is_read: false,
        created_at: new Date(),
      }));

      if (notifications.length > 0) {
        const { error: insertError } = await supabase.from("notifications").insert(notifications);
        if (insertError) throw insertError;
        setStatus("✅ Notifications sent successfully!");
      } else {
        setStatus("⚠️ No target users found for this selection.");
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to send notifications.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        {type === "announcement" ? <Megaphone /> : <AlertTriangle />}
        Compose Notification
      </h2>

      {/* Type */}
      <div className="mb-3">
        <label className="font-semibold">Type:</label>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setSubType("");
          }}
          className="ml-2 border rounded px-2 py-1"
        >
          <option value="announcement">Announcement</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Subtype */}
      <div className="mb-3">
        <label className="font-semibold">Subtype:</label>
        <select
          value={subType}
          onChange={(e) => setSubType(e.target.value)}
          className="ml-2 border rounded px-2 py-1"
        >
          <option value="">Select Subtype</option>
          {(type === "announcement" ? announcementSubtypes : urgentSubtypes).map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      {/* Send to */}
      <div className="mb-3">
        <label className="font-semibold">Send To:</label>
        <select
          value={sendTo}
          onChange={(e) => setSendTo(e.target.value)}
          className="ml-2 border rounded px-2 py-1"
        >
          <option value="parents">Parents</option>
          <option value="guards">Guards</option>
          <option value="both">Both</option>
        </select>
      </div>

      {/* Grade level */}
      {sendTo !== "guards" && (
        <div className="mb-3">
          <label className="font-semibold">Grade Level:</label>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="ml-2 border rounded px-2 py-1"
          >
            <option value="All">All</option>
            {grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Title + Message */}
      <input
        type="text"
        placeholder="Title"
        className="w-full border rounded px-3 py-2 mb-3"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Message"
        className="w-full border rounded px-3 py-2 mb-4 h-32"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        onClick={handleSend}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
      >
        <Send size={16} />
        {loading ? "Sending..." : "Send Notification"}
      </button>

      {status && <p className="mt-3 text-sm">{status}</p>}
    </div>
  );
}
