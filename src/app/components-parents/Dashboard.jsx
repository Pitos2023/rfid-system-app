"use client";
import { useState } from "react";
import Image from "next/image"; // ✅ Next.js optimized image

export default function Dashboard() {
  const [selectedStudent, setSelectedStudent] = useState(null);

  const students = [
    {
      id: "2024-09-001",
      name: "Juan Santos",
      section: "Grade 9 - Section A",
      rfid: "RF001234567",
      dob: "March 15, 2009",
      email: "juansantos@spc.edu.ph",
      img: "/inoske.jpg", // ✅ placed inside /public
      color: "from-blue-400 to-blue-600",
      contact: "Maria Santos – +63 917 123 4567",
      activities: [
        { time: "7:45 AM", icon: "✅", color: "bg-green-100", textColor: "text-green-600" },
        { time: "12:15 PM", icon: "✅", color: "bg-green-100", textColor: "text-green-600" },
      ],
    },
    {
      id: "2024-07-002",
      name: "Ana Santos",
      section: "Grade 7 - Section B",
      rfid: "RF001234568",
      dob: "August 22, 2011",
      email: "anasantos@spc.edu.ph",
      img: "/halloween fuyutsi.png", // ✅ placed inside /public
      color: "from-pink-400 to-pink-600",
      contact: "Maria Santos – +63 917 123 4567",
      activities: [
        { time: "7:52 AM", icon: "✅", color: "bg-green-100", textColor: "text-green-600" },
        { time: "11:30 AM", icon: "✅", color: "bg-green-100", textColor: "text-green-600" },
      ],
    },
  ];

  return (
    <div id="dashboardView" className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">Total Children</p>
          <p className="text-3xl font-bold text-gray-800">2</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">Today's Entries</p>
          <p className="text-3xl font-bold text-green-600">2</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">This Week</p>
          <p className="text-3xl font-bold text-purple-600">14</p>
        </div>
      </div>

      {/* Student Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {students.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center bg-gray-100">
                  <Image
                    src={s.img}
                    alt={s.name}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{s.name}</h3>
                  <p className="text-gray-600">{s.section}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(s)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                View Details
              </button>
            </div>

            <div className="p-6 space-y-3">
              {s.activities.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 ${a.color} rounded-full flex items-center justify-center`}
                    >
                      <span className={`${a.textColor} text-sm`}>{a.icon}</span>
                    </div>
                    <p className="text-sm text-gray-600">{a.time}</p>
                  </div>
                  <span className="text-xs text-gray-500">Today</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative text-gray-800">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>

            {/* Header */}
            <div className="text-center border-b border-gray-100 pb-6">
              <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-gray-100">
                <Image
                  src={selectedStudent.img}
                  alt={selectedStudent.name}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
              <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
              <p className="text-gray-600">{selectedStudent.section}</p>
            </div>

            {/* Info */}
            <div className="mt-6 grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Student ID</label>
                <p className="text-gray-800 font-semibold">{selectedStudent.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">RFID Tag</label>
                <p className="text-gray-800 font-semibold">{selectedStudent.rfid}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                <p className="text-gray-800 font-semibold">{selectedStudent.dob}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-800 font-semibold">{selectedStudent.email}</p>
              </div>
            </div>

            <div className="mb-6 border-t border-gray-100 pt-4">
              <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
              <p className="text-gray-800 font-semibold">{selectedStudent.contact}</p>
            </div>

            <button
              onClick={() => setSelectedStudent(null)}
              className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
