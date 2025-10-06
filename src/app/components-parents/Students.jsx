"use client";
import Image from "next/image";

export default function Students({ setView }) {
  const students = [
    {
      id: "2024-09-001",
      name: "Juan Santos",
      section: "Grade 9 - Section A",
      rfid: "RF001234567",
      dob: "March 15, 2009",
      email: "juansantos@spc.edu.ph",
      img: "/inoske.jpg", // ✅ Replace 👦 with image
      color: "from-blue-400 to-blue-600",
    },
    {
      id: "2024-07-002",
      name: "Ana Santos",
      section: "Grade 7 - Section B",
      rfid: "RF001234568",
      dob: "August 22, 2011",
      email: "anasantos@spc.edu.ph",
      img: "/halloween fuyutsi.png", // ✅ Replace 👧 with image
      color: "from-pink-400 to-pink-600",
    },
  ];

  return (
    <div id="studentsView" className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {students.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
          >
            {/* Header */}
            <div className="p-8 text-center border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
              <div
                className={`w-24 h-24 bg-gradient-to-br ${s.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow overflow-hidden`}
              >
                {/* ✅ Student Image */}
                <Image
                  src={s.img}
                  alt={s.name}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{s.name}</h3>
              <p className="text-gray-600">{s.section}</p>
            </div>

            {/* Info */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Student ID
                  </label>
                  <p className="text-gray-800 font-semibold">{s.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    RFID Tag
                  </label>
                  <p className="text-gray-800 font-semibold">{s.rfid}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Date of Birth
                  </label>
                  <p className="text-gray-800 font-semibold">{s.dob}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="text-gray-800 font-semibold">{s.email}</p>
                </div>
              </div>

              <div className="mb-6 border-t border-gray-100 pt-4">
                <label className="text-sm font-medium text-gray-500">
                  Emergency Contact
                </label>
                <p className="text-gray-800 font-semibold">
                  Maria Santos – +63 917 123 4567
                </p>
              </div>

              {/* Button with function */}
              <button
                onClick={() => setView("activity")}
                className="w-full bg-[#58181F] text-white py-3 rounded-lg font-semibold shadow hover:bg-[#6d2029] transition-colors"
              >
                View Full Activity Log
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
