"use client";
import Header from "./Header";
import React, { useState, useEffect, useRef } from "react";
import { createScopedClient } from "../supabaseClient";
import {
  Send,
  Megaphone,
  AlertTriangle,
  Users,
  Calendar,
  FileText,
  Paperclip,
  X,
  Download,
  Eye,
  Search,
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

  // ================= Leave Notification States =================
  const [leaveParents, setLeaveParents] = useState([]);
  const [leaveParentsFiltered, setLeaveParentsFiltered] = useState([]);
  const [leaveSearchQuery, setLeaveSearchQuery] = useState("");
  const [selectedLeaveParents, setSelectedLeaveParents] = useState([]);
  const [leaveAttachment, setLeaveAttachment] = useState(null);
  const [leaveAttachmentName, setLeaveAttachmentName] = useState("");
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState(null);

  // ================= Student Search States =================
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [searchedStudents, setSearchedStudents] = useState([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

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

  // ================= State for modal =================
  const [attachmentModal, setAttachmentModal] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);

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

  // ================= Search Students =================
  const searchStudents = async (query) => {
    if (!query.trim()) {
      setSearchedStudents([]);
      return;
    }

    setStudentSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from("student")
        .select(`
          *,
          user:users_id (
            first_name,
            last_name,
            email
          )
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      const formattedStudents = data.map(student => ({
        id: student.id,
        users_id: student.users_id,
        first_name: student.first_name,
        last_name: student.last_name,
        grade_level: student.grade_level,
        parent_name: student.user ? `${student.user.first_name} ${student.user.last_name}` : "Unknown Parent",
        parent_email: student.user?.email || "No email"
      }));

      setSearchedStudents(formattedStudents);
    } catch (err) {
      console.error("❌ Student search error:", err);
      setSearchedStudents([]);
    } finally {
      setStudentSearchLoading(false);
    }
  };

  // ================= Handle Student Selection =================
  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setStudentSearchQuery(`${student.first_name} ${student.last_name}`);
    setSearchedStudents([]);

    // Auto-generate the message with student name
    const studentMessage = `A leave notice has been submitted for ${student.first_name} ${student.last_name} (${student.grade_level}).`;
    setMessage(studentMessage);

    // Fetch parent for the selected student
    try {
      const { data: parentData, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .eq("role", "parent")
        .eq("id", student.users_id)
        .single();

      if (!error && parentData) {
        // Add the parent to selected parents if not already selected
        if (!selectedLeaveParents.includes(parentData.id)) {
          setSelectedLeaveParents([...selectedLeaveParents, parentData.id]);
        }
        // Update the leave parents list to show only this parent
        setLeaveParents([parentData]);
        setLeaveParentsFiltered([parentData]);
      }
    } catch (err) {
      console.error("❌ Error fetching parent:", err);
    }
  };

  // ================= Clear Student Search =================
  const clearStudentSearch = () => {
    setStudentSearchQuery("");
    setSearchedStudents([]);
    setSelectedStudent(null);
    // Reset message when student is cleared
    setMessage("A leave notice has been submitted.");
    // Reset to show all parents
    fetchLeaveParents();
  };

  // ================= Fetch Leave Parents =================
  const fetchLeaveParents = async () => {
    // Always fetch all parents for leave notifications (no grade level filtering)
    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .eq("role", "parent");

    if (!error && data) {
      setLeaveParents(data);
      setLeaveParentsFiltered(data);
    }
  };

  useEffect(() => {
    if (type === "leave") {
      fetchLeaveParents();
      // Set default message for leave notifications
      setMessage("A leave notice has been submitted.");
    }
  }, [type]); // Removed gradeLevel dependency

  // ================= Leave Search Filter =================
  useEffect(() => {
    const filtered = leaveParents.filter(
      (parent) =>
        parent.first_name.toLowerCase().includes(leaveSearchQuery.toLowerCase()) ||
        parent.last_name.toLowerCase().includes(leaveSearchQuery.toLowerCase()) ||
        parent.email.toLowerCase().includes(leaveSearchQuery.toLowerCase())
    );
    setLeaveParentsFiltered(filtered);
  }, [leaveSearchQuery, leaveParents]);

  // ================= Student Search Effect =================
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (studentSearchQuery.trim()) {
        searchStudents(studentSearchQuery);
      } else {
        setSearchedStudents([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [studentSearchQuery]);

  // ================= Canvas Signature Handler =================
  const handleCanvasMouseDown = () => {
    setIsDrawing(true);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignature(canvasRef.current.toDataURL());
    }
  };

  const initializeCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#000";
      setSignature(null);
    }
  };

  const clearSignature = () => {
    initializeCanvas();
  };

  // ================= Handle File Upload =================
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const fileName = `${Date.now()}_${file.name}`;
        
        // Upload file directly to the bucket
        const { data, error } = await supabase.storage
          .from("leave-attachments")
          .upload(fileName, file);

        if (error) {
          console.error("❌ Storage upload error:", error);
          throw error;
        }

        setLeaveAttachment(file);
        setLeaveAttachmentName(fileName);
        alert("✅ File uploaded successfully!");
      } catch (err) {
        console.error("❌ File upload error:", err);
        alert("❌ Failed to upload file. Please ensure the 'leave-attachments' bucket exists and is properly configured in Supabase Storage.");
      }
    }
  };

  // ================= Handle Download Attachment =================
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

      // Create download link
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

  // ================= Handle View Attachment =================
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

  // ================= Subtypes =================
  const announcementSubtypes = ["School Event", "Exam", "Holiday", "General"];
  const urgentSubtypes = ["Parent Meeting", "Disaster", "Emergency"];
  const leaveSubtypes = ["Sick Leave", "Parental Leave", "Medical Leave"];

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
    } else if (type === "leave") {
      setTitle("");
      // Don't reset message here to preserve any student-specific message
    }
  }, [type, subType]);

  // ================= UPDATED: Handle Send with OneSignal Integration =================
  const handleSend = async () => {
    if (type === "leave") {
      if (!subType || selectedLeaveParents.length === 0) {
        alert("Please select a reason and at least one parent.");
        return;
      }
      if (!signature) {
        alert("Please provide an e-signature.");
        return;
      }
      setLoading(true);
      setStatus("");

      try {
        // Create custom message based on selected student
        let customMessage = message;
        if (selectedStudent) {
          customMessage = `A leave notice has been submitted for ${selectedStudent.first_name} ${selectedStudent.last_name} (${selectedStudent.grade_level}).`;
        }

        const notifications = selectedLeaveParents.map((parentId) => ({
          user_id: parentId,
          title: `Leave Notice: ${subType}`,
          message: customMessage,
          type: "leave",
          is_read: false,
          created_at: new Date(),
          leave_files: leaveAttachmentName, // Store in leave_files column
          metadata: {
            reason: subType,
            signature: signature,
            student_name: selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : null,
            student_grade: selectedStudent ? selectedStudent.grade_level : null,
            // attachment is now stored in leave_files column instead of metadata
          },
        }));

        if (notifications.length > 0) {
          const { error: insertError } = await supabase
            .from("notifications")
            .insert(notifications);
          if (insertError) throw insertError;

          // ✅ Send OneSignal push notifications for leave notices
          console.log("📡 Sending push notifications for leave notices...");
          try {
            const response = await fetch("/api/send-notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: `Leave Notice: ${subType}`,
                message: customMessage,
                type: "leave",
                targetUserIds: selectedLeaveParents,
              }),
            });
            const result = await response.json();
            console.log("✅ OneSignal Response:", result);
          } catch (pushError) {
            console.error("❌ OneSignal push failed:", pushError);
          }

          setStatus("✅ Leave notification sent successfully!");
          setSelectedLeaveParents([]);
          clearSignature();
          setLeaveAttachment(null);
          setLeaveAttachmentName("");
          setSelectedStudent(null);
          setStudentSearchQuery("");
          setMessage("A leave notice has been submitted."); // Reset to default message
          setAnnouncementPage(0);
          fetchAnnouncements();
        }
      } catch (err) {
        console.error("❌ Leave notification error:", err.message || err);
        setStatus("❌ Failed to send leave notification.");
      } finally {
        setLoading(false);
      }
    } else {
      if (!title || !message) {
        alert("Please fill in both title and message fields.");
        return;
      }
      setLoading(true);
      setStatus("");

      try {
        // Build the base query for target users
        let targetUserIds = [];

        if (sendTo === "parents" || sendTo === "both") {
          let parentQuery = supabase
            .from("users")
            .select("id")
            .eq("role", "parent");

          // If grade level is specified, we need to filter parents by their students' grade level
          if (gradeLevel !== "All" && sendTo !== "guards") {
            // First get student user_ids for the specified grade level
            const { data: studentData, error: studentError } = await supabase
              .from("student")
              .select("users_id")
              .eq("grade_level", gradeLevel);

            if (studentError) throw studentError;

            const studentUserIds = studentData.map(s => s.users_id);
            
            // Now get parents that match these user_ids
            if (studentUserIds.length > 0) {
              parentQuery = parentQuery.in("id", studentUserIds);
            } else {
              // No students found for this grade level
              parentQuery = null;
            }
          }

          if (parentQuery) {
            const { data: parentData, error: parentError } = await parentQuery;
            if (parentError) throw parentError;
            if (parentData) {
              targetUserIds.push(...parentData.map(p => p.id));
            }
          }
        }

        if (sendTo === "guards" || sendTo === "both") {
          const { data: guardData, error: guardError } = await supabase
            .from("users")
            .select("id")
            .eq("role", "guard");

          if (guardError) throw guardError;
          if (guardData) {
            targetUserIds.push(...guardData.map(g => g.id));
          }
        }

        // Remove duplicates
        const uniqueTargetUserIds = [...new Set(targetUserIds)];

        console.log("Target user IDs:", uniqueTargetUserIds); // Debug log

        if (uniqueTargetUserIds.length > 0) {
          const notifications = uniqueTargetUserIds.map((userId) => ({
            user_id: userId,
            title,
            message,
            type,
            is_read: false,
            created_at: new Date(),
          }));

          const { error: insertError } = await supabase
            .from("notifications")
            .insert(notifications);

          if (insertError) throw insertError;

          // ✅ Send OneSignal push notifications (similar to RFID scan)
          console.log("📡 Sending push notification to OneSignal...");
          try {
            const response = await fetch("/api/send-notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                message,
                type,
                targetUserIds: uniqueTargetUserIds,
              }),
            });
            const result = await response.json();
            console.log("✅ OneSignal Response:", result);
          } catch (pushError) {
            console.error("❌ OneSignal push failed:", pushError);
          }

          setStatus(`✅ ${uniqueTargetUserIds.length} notification(s) sent successfully!`);
          setAnnouncementPage(0);
          fetchAnnouncements();
          
          // Clear form after successful send
          setTitle("");
          setMessage("");
          setSubType("");
        } else {
          setStatus("⚠️ No target users found for this selection.");
        }
      } catch (err) {
        console.error("❌ Notification send error:", err.message || err);
        setStatus("❌ Failed to send notifications.");
      } finally {
        setLoading(false);
      }
    }
  };

  // ================= Fetch Announcements =================
  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      const { data, count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .in("type", ["announcement", "urgent", "leave"])
        .order("created_at", { ascending: false })
        .range(
          announcementPage * ANNOUNCEMENT_PAGE_SIZE,
          (announcementPage + 1) * ANNOUNCEMENT_PAGE_SIZE - 1
        );
      if (error) throw error;

      const mapped = data.map((item) => ({
        title: item.title || "No Title",
        message: item.message || "",
        urgency: item.type === "urgent" ? "URGENT" : item.type === "leave" ? "LEAVE" : "ANNOUNCEMENT",
        reason: item.metadata?.reason || null,
        signature: item.metadata?.signature || null,
        attachment: item.leave_files || null, // Now getting from leave_files column
        student_name: item.metadata?.student_name || null,
        student_grade: item.metadata?.student_grade || null,
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
              ) : type === "urgent" ? (
                <AlertTriangle color="#800000" />
              ) : (
                <FileText color="#800000" />
              )}
              Compose Notification
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setSubType("");
                  setSelectedLeaveParents([]);
                  setSelectedStudent(null);
                  setStudentSearchQuery("");
                  setMessage(""); // Reset message when type changes
                }}
                className="w-full p-3 border border-[#800000] rounded-lg focus:ring-2 focus:ring-[#660000] transition"
              >
                <option value="announcement">Announcement</option>
                <option value="urgent">Urgent</option>
                <option value="leave">Leave</option>
              </select>

              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                className="w-full p-3 border border-[#800000] rounded-lg focus:ring-2 focus:ring-[#660000] transition"
              >
                <option value="">
                  {type === "leave" ? "Reason" : "Type of Notification"}
                </option>
                {(type === "announcement"
                  ? announcementSubtypes
                  : type === "urgent"
                  ? urgentSubtypes
                  : leaveSubtypes
                ).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {type !== "leave" && (
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
            )}

            {type === "leave" && (
              <>
                {/* Student Search - Now at the top of leave section */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2 text-[#800000]">
                    Search Student
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by student first name or last name..."
                      className="w-full p-3 border border-[#800000] rounded-lg focus:ring-2 focus:ring-[#660000] transition pr-10"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                    />
                    <Search className="absolute right-3 top-3.5 h-4 w-4 text-gray-500" />
                    
                    {/* Student Search Results */}
                    {searchedStudents.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-[#800000] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {searchedStudents.map((student) => (
                          <div
                            key={student.id}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-0"
                            onClick={() => handleStudentSelect(student)}
                          >
                            <div className="font-medium text-sm">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-xs text-gray-600">
                              Grade: {student.grade_level} | Parent: {student.parent_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {studentSearchLoading && (
                      <div className="absolute right-3 top-3.5">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#800000]"></div>
                      </div>
                    )}
                  </div>
                  
                  {selectedStudent && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Selected: {selectedStudent.first_name} {selectedStudent.last_name}
                          </p>
                          <p className="text-xs text-green-600">
                            Grade {selectedStudent.grade_level} • Parent: {selectedStudent.parent_name}
                          </p>
                        </div>
                        <button
                          onClick={clearStudentSearch}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2 text-[#800000]">
                    Search & Select Parents
                  </label>
                  <input
                    type="text"
                    placeholder="Search by parent name or email..."
                    className="w-full p-3 border border-[#800000] rounded-lg focus:ring-2 focus:ring-[#660000] transition mb-2"
                    value={leaveSearchQuery}
                    onChange={(e) => setLeaveSearchQuery(e.target.value)}
                  />
                  <div className="border border-[#800000] rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                    {leaveParentsFiltered.length === 0 ? (
                      <p className="text-sm text-gray-600">No parents found</p>
                    ) : (
                      leaveParentsFiltered.map((parent) => (
                        <div key={parent.id} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id={`parent-${parent.id}`}
                            checked={selectedLeaveParents.includes(parent.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLeaveParents([
                                  ...selectedLeaveParents,
                                  parent.id,
                                ]);
                              } else {
                                setSelectedLeaveParents(
                                  selectedLeaveParents.filter(
                                    (id) => id !== parent.id
                                  )
                                );
                              }
                            }}
                            className="mr-2"
                          />
                          <label
                            htmlFor={`parent-${parent.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {parent.first_name} {parent.last_name} ({parent.email})
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedLeaveParents.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      {selectedLeaveParents.length} parent(s) selected
                    </p>
                  )}
                </div>

                {/* Leave Message Display */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2 text-[#800000]">
                    Preview Message
                  </label>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">
                      {message || "A leave notice has been submitted."}
                    </p>
                    {selectedStudent && (
                      <p className="text-xs text-blue-600 mt-1">
                        This message includes {selectedStudent.first_name}'s name and will be sent to parents.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2 text-[#800000]">
                    Attachment
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-input"
                    />
                    <label
                      htmlFor="file-input"
                      className="flex items-center gap-2 px-4 py-2 bg-[#800000] text-white rounded-lg cursor-pointer hover:bg-[#660000] transition"
                    >
                      <Paperclip size={18} />
                      Choose File
                    </label>
                    {leaveAttachmentName && (
                      <span className="text-sm text-gray-700">
                        {leaveAttachmentName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2 text-[#800000]">
                    E-Signature (Draw Below)
                  </label>
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    className="border-2 border-[#800000] rounded-lg bg-white cursor-crosshair w-full"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={clearSignature}
                      className="flex-1 px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition text-sm"
                    >
                      Clear Signature
                    </button>
                    <button
                      onClick={initializeCanvas}
                      className="flex-1 px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition text-sm"
                    >
                      Reset Canvas
                    </button>
                  </div>
                </div>
              </>
            )}

            {type !== "leave" && (
              <>
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
              </>
            )}

            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-[#800000] text-white px-5 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#660000] w-full font-semibold transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              {loading ? "Sending..." : "Send Notification"}
            </button>

            {status && <p className="mt-4 text-sm text-black">{status}</p>}
          </div>

          {/* Recent Announcements */}
          <div className="bg-[#F4E4E4] p-6 rounded-2xl shadow-lg border border-[#800000]">
            <h3 className="text-base md:text-lg font-semibold mb-4 text-[#800000]">
              Recent Announcements & Leave Notices
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
                              : item.urgency === "LEAVE"
                              ? "text-blue-600"
                              : "text-gray-800"
                          }`}
                        >
                          {item.urgency}
                        </span>
                      </div>
                      <p className="text-xs mb-2">{item.message}</p>
                      
                      {item.urgency === "LEAVE" && (
                        <div className="bg-blue-50 p-3 rounded mb-2 border-l-2 border-blue-600">
                          {/* Show student name if available */}
                          {item.student_name && (
                            <p className="text-xs text-blue-800 mb-2">
                              <strong>Student:</strong> {item.student_name} (Grade {item.student_grade})
                            </p>
                          )}
                          {item.reason && (
                            <p className="text-xs text-blue-800 mb-2">
                              <strong>Reason:</strong> {item.reason}
                            </p>
                          )}
                          {item.attachment && (
                            <div className="mb-2">
                              <p className="text-xs text-blue-800 mb-1">
                                <strong>Attachment:</strong> {item.attachment}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleViewAttachment(item.attachment)}
                                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition"
                                >
                                  <Eye size={14} />
                                  View
                                </button>
                                <button
                                  onClick={() => handleDownloadAttachment(item.attachment)}
                                  className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition"
                                >
                                  <Download size={14} />
                                  Download
                                </button>
                              </div>
                            </div>
                          )}
                          {item.signature && (
                            <div>
                              <p className="text-xs text-blue-800 mb-1">
                                <strong>E-Signature:</strong>
                              </p>
                              <img
                                src={item.signature}
                                alt="Signature"
                                className="h-12 border border-blue-300 rounded"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
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

        {/* Attachment Modal */}
        {attachmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-96 overflow-auto">
              <div className="flex justify-between items-center p-4 border-b border-[#800000]">
                <h3 className="text-lg font-bold text-[#800000]">
                  Document Preview
                </h3>
                <button
                  onClick={() => {
                    setAttachmentModal(false);
                    setSelectedAttachment(null);
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition"
                >
                  <X size={20} color="#800000" />
                </button>
              </div>
              <div className="p-6">
                {selectedAttachment && (
                  <>
                    {selectedAttachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={selectedAttachment}
                        alt="Attachment Preview"
                        className="w-full rounded-lg border border-[#800000]"
                      />
                    ) : selectedAttachment.match(/\.(pdf)$/i) ? (
                      <iframe
                        src={selectedAttachment}
                        className="w-full h-96 rounded-lg border border-[#800000]"
                        title="PDF Preview"
                      />
                    ) : (
                      <div className="text-center p-6 bg-gray-100 rounded-lg">
                        <FileText size={48} color="#800000" className="mx-auto mb-2" />
                        <p className="text-gray-700 mb-4">
                          Preview not available for this file type
                        </p>
                        <button
                          onClick={() => handleDownloadAttachment(selectedAttachment.split('/').pop())}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#660000] transition mx-auto"
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
      </div>
    </div>
  );
}