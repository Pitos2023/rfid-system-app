"use client";
import Image from "next/image";

export default function ActivityLog() {
  const logs = [
    {
      student: "Juan Santos",
      section: "Grade 9-A",
      img: "/inoske.jpg", // ✅ replace 👦 with image
      color: "from-blue-400 to-blue-600",
      date: "Nov 15, 2024",
      time: "1:05 PM",
      status: "Approved",
    },
    {
      student: "Juan Santos",
      section: "Grade 9-A",
      img: "/inoske.jpg",
      color: "from-blue-400 to-blue-600",
      date: "Nov 15, 2024",
      time: "12:15 PM",
      status: "Approved",
    },
    {
      student: "Ana Santos",
      section: "Grade 7-B",
      img: "/halloween fuyutsi.png", // ✅ replace 👧 with image
      color: "from-pink-400 to-pink-600",
      date: "Nov 15, 2024",
      time: "7:52 AM",
      status: "Denied",
    },
    {
      student: "Ana Santos",
      section: "Grade 7-B",
      img: "/halloween fuyutsi.png",
      color: "from-pink-400 to-pink-600",
      date: "Nov 13, 2024",
      time: "11:30 AM",
      status: "Denied",
    },
  ];

  return (
    <div id="activityView" className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Complete Activity Log</h3>
          <div className="text-black-600 flex space-x-3">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spc-blue text-gray-800">
              <option>All Students</option>
              <option>Juan Santos</option>
              <option>Ana Santos</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spc-blue text-gray-800">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Month</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  Consent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 bg-gradient-to-br ${log.color} rounded-full flex items-center justify-center overflow-hidden`}
                      >
                        {/* ✅ Student Image */}
                        <Image
                          src={log.img}
                          alt={log.student}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{log.student}</p>
                        <p className="text-sm text-gray-600">{log.section}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{log.date}</p>
                    <p className="text-sm text-gray-600">{log.time}</p>
                  </td>
                  <td
                    className={`px-6 py-4 font-semibold ${
                      log.status === "Approved" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {log.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
