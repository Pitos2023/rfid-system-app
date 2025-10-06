"use client";
import { useState } from "react";

// Example parents dataset (expand as needed)
const parentsData = {
  "7": [
    { id: "p7001", parentName: "Maria Santos", studentName: "Juan Santos" },
    { id: "p7002", parentName: "Roberto Cruz", studentName: "Ana Cruz" },
  ],
  "8": [
    { id: "p8001", parentName: "Gloria Reyes", studentName: "Antonio Reyes" },
    { id: "p8002", parentName: "Luis Ramos", studentName: "Karla Ramos" },
  ],
  "9": [{ id: "p9001", parentName: "Chen Yu", studentName: "Liu Yu" }],
  "10": [],
  "11": [],
  "12": [],
};

export default function NotificationComposer({ onSend }) {
  const [type, setType] = useState("info");
  const [grades, setGrades] = useState(["all"]);
  const [sendToParents, setSendToParents] = useState(true);
  const [sendToGuards, setSendToGuards] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Sick-letter specific
  const [currentSickGrade, setCurrentSickGrade] = useState("7");
  const [search, setSearch] = useState("");
  const [selectedParents, setSelectedParents] = useState([]);

  const types = [
    { id: "info", icon: "📢", label: "Announcement" },
    { id: "sick", icon: "🏥", label: "Sick Letter" },
    { id: "urgent", icon: "🚨", label: "Urgent" },
  ];

  const toggleGrade = (grade) => {
    if (grade === "all") {
      setGrades(["all"]);
      return;
    }
    let next = grades.includes("all") ? [] : [...grades];
    if (next.includes(grade)) next = next.filter((g) => g !== grade);
    else next.push(grade);
    if (next.length === 0) next = ["all"];
    setGrades(next);
  };

  const filteredParents =
    type === "sick" && currentSickGrade && parentsData[currentSickGrade]
      ? parentsData[currentSickGrade].filter(
          (p) =>
            p.parentName.toLowerCase().includes(search.toLowerCase()) ||
            p.studentName.toLowerCase().includes(search.toLowerCase())
        )
      : [];

  const toggleParent = (parent) => {
    setSelectedParents((prev) =>
      prev.some((p) => p.id === parent.id)
        ? prev.filter((p) => p.id !== parent.id)
        : [...prev, parent]
    );
  };

  const buildRecipients = () => {
    if (type === "sick") {
      if (selectedParents.length === 0) return "";
      return `${selectedParents.length} Selected Parents`;
    }
    const parts = [];
    if (sendToParents) {
      parts.push(
        grades.includes("all") ? "All Parents" : `Grades ${grades.join(", ")}`
      );
    }
    if (sendToGuards) parts.push("Security Guards");
    return parts.join(", ");
  };

  const handleSend = () => {
    if (!title || !content) {
      alert("Please fill out the title and content.");
      return;
    }
    if (!sendToParents && !sendToGuards && type !== "sick") {
      alert("Please choose at least one recipient group.");
      return;
    }
    if (type === "sick" && selectedParents.length === 0) {
      alert("Please select at least one parent for the sick letter.");
      return;
    }

    const recipients =
      type === "sick"
        ? selectedParents.map((p) => p.parentName).join(", ")
        : buildRecipients();

    onSend({ title, type, content, recipients });

    setType("info");
    setGrades(["all"]);
    setSendToParents(true);
    setSendToGuards(false);
    setTitle("");
    setContent("");
    setSelectedParents([]);
    setSearch("");
    setCurrentSickGrade("7");
  };

  const onPickType = (id) => {
    setType(id);
    if (id === "sick") {
      setTitle("Sick Leave Notification");
      setContent(
        "Your child has been marked absent due to illness. Please ensure they get proper rest and medical attention if needed. Contact the school if you have any questions."
      );
    } else if (id === "urgent") {
      setTitle("Urgent School Advisory");
      setContent("");
    } else if (id === "announcement") {
      setTitle("School Announcement");
      setContent("");
    } else {
      setTitle("");
      setContent("");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden text-black">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold flex items-center">
          📝 Compose Announcement
        </h3>
        <p className="text-sm mt-1">
          Send targeted notifications to parents and security guards
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* Type */}
        <div>
          <label className="block text-sm font-semibold mb-3">
            Notification Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => onPickType(t.id)}
                className={`p-3 rounded-lg border-2 transition text-sm font-semibold ${
                  type === t.id
                    ? "border-white-600 bg-[#58181F] text-white"
                    : "border-gray-200 bg-gray-50 hover:border-blue-300 text-black"
                }`}
              >
                <div className="text-2xl mb-1">{t.icon}</div>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recipients */}
        {type !== "sick" && (
          <div>
            <label className="block text-sm font-semibold mb-3">
              Send To
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2 border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-300">
                <input
                  type="checkbox"
                  checked={sendToParents}
                  onChange={(e) => setSendToParents(e.target.checked)}
                />
                <span className="font-medium">👨‍👩‍👧‍👦 Parents</span>
              </label>
              <label className="flex items-center space-x-2 border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-300">
                <input
                  type="checkbox"
                  checked={sendToGuards}
                  onChange={(e) => setSendToGuards(e.target.checked)}
                />
                <span className="font-medium">🛡️ Security Guards</span>
              </label>
            </div>
          </div>
        )}

        {/* Grade selector */}
        {type !== "sick" && sendToParents && (
          <div>
            <label className="block text-sm font-semibold mb-3">
              Target Grade Levels (Parents)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {["all", "7", "8", "9", "10", "11", "12"].map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGrade(g)}
                  className={`p-3 rounded-lg border-2 text-sm font-semibold transition ${
                    grades.includes(g)
                      ? "border-gray-600 bg-[#58181F] text-white"
                      : "border-gray-200 hover:border-purple-300 text-black"
                  }`}
                >
                  {g === "all" ? "🎯 All" : `Grade ${g}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sick-letter parent list */}
        {type === "sick" && (
          <div>
            <label className="block text-sm font-semibold mb-3">
              Select Parents for Sick Leave
            </label>
            <div className="flex gap-2 mb-3">
              {["7", "8", "9", "10", "11", "12"].map((g) => (
                <button
                  key={g}
                  onClick={() => setCurrentSickGrade(g)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition ${
                    currentSickGrade === g
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 text-black"
                  }`}
                >
                  Grade {g}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by parent or student name..."
              className="w-full p-3 border-2 border-gray-200 rounded-lg mb-3 text-black"
            />
            <div className="max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg p-3">
              {filteredParents.length > 0 ? (
                filteredParents.map((p) => {
                  const isSel = selectedParents.some((sp) => sp.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleParent(p)}
                      className={`w-full text-left p-3 rounded-lg border-2 mb-2 transition ${
                        isSel
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300 text-black"
                      }`}
                    >
                      <div className="font-semibold">{p.parentName}</div>
                      <div className="text-sm">{`Student: ${p.studentName}`}</div>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm">No parents found</p>
              )}
            </div>
          </div>
        )}

        {/* Title + Content */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Message Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-lg text-black"
            placeholder="Enter message title..."
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            Message Content
          </label>
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-lg text-black"
            placeholder="Enter message content..."
          />
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Notification Preview
          </label>
          <div className="p-4 border-2 border-[#58181F] rounded-lg bg-red-50 text-black">
            {title || content ? (
              <>
                <div className="flex items-center gap-2 text-sm mb-2">
                  <span>🔔</span>
                  <span className="font-semibold uppercase">{type}</span>
                </div>
                <h4 className="font-bold">{title || "Title"}</h4>
                <p>{content || "Message preview..."}</p>
                <div className="text-xs mt-2">
                  Recipients: {buildRecipients() || "(not selected yet)"}
                </div>
              </>
            ) : (
              <p className="text-center text-sm">📱 Your preview will appear here</p>
            )}
          </div>
        </div>

        {/* Send */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSend}
            className="bg-[#58181F] hover:bg-red-900 text-white px-6 py-3 rounded-lg font-semibold shadow-md flex items-center gap-2"
          >
            <span>📤</span>
            <span>Send Notification</span>
          </button>
        </div>
      </div>
    </div>
  );
}
