"use client";

import React, { useState } from "react";
import {
  FaDownload,
  FaUserGraduate,
  FaDoorOpen,
  FaUsers,
} from "react-icons/fa";
import { BsDatabaseFill } from "react-icons/bs";
import AdminLayout from "./AdminLayout";

export default function StudentLogsPage() {
  const [filter, setFilter] = useState({
    search: "",
    action: "all",
    date: "",
    location: "all",
  });

  const logs = [
    {
      name: "John Smith",
      rfid: "RFID001234",
      action: "Entry",
      time: "1/15/2024 4:15:30 PM",
      location: "Main Gate",
      grade: "Grade 10",
      section: "Section A",
    },
    {
      name: "Sarah Johnson",
      rfid: "RFID001235",
      action: "Entry",
      time: "1/15/2024 4:45:22 PM",
      location: "Main Gate",
      grade: "Grade 9",
      section: "Section B",
    },
    {
      name: "John Smith",
      rfid: "RFID001234",
      action: "Exit",
      time: "1/15/2024 11:30:15 PM",
      location: "Main Gate",
      grade: "Grade 10",
      section: "Section A",
    },
    {
      name: "Emily Davis",
      rfid: "RFID001236",
      action: "Entry",
      time: "1/15/2024 3:55:45 PM",
      location: "Side Gate",
      grade: "Grade 11",
      section: "Section A",
    },
    {
      name: "Michael Brown",
      rfid: "RFID001237",
      action: "Entry",
      time: "1/15/2024 5:10:30 PM",
      location: "Main Gate",
      grade: "Grade 12",
      section: "Section C",
    },
    {
      name: "Sarah Johnson",
      rfid: "RFID001235",
      action: "Exit",
      time: "1/16/2024 12:45:55 AM",
      location: "Main Gate",
      grade: "Grade 9",
      section: "Section B",
    },
  ];

  const handleFilterChange = (e, type) => {
    setFilter((prev) => ({ ...prev, [type]: e.target.value }));
  };

  const filteredLogs = logs.filter((log) => {
    const search = filter.search.toLowerCase();
    return (
      (filter.search === "" ||
        log.name.toLowerCase().includes(search) ||
        log.rfid.toLowerCase().includes(search)) &&
      (filter.action === "all" ||
        log.action.toLowerCase() === filter.action.toLowerCase()) &&
      (filter.location === "all" || log.location === filter.location)
    );
  });

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6 relative">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">
          Student Log Viewer
        </h1>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <input
            type="text"
            placeholder="Search student, ID, or RFID..."
            className="border border-gray-300 rounded-xl p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            value={filter.search}
            onChange={(e) => handleFilterChange(e, "search")}
          />
          <select
            className="border border-gray-300 rounded-xl p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            value={filter.action}
            onChange={(e) => handleFilterChange(e, "action")}
          >
            <option value="all">All Actions</option>
            <option value="Entry">Entry</option>
            <option value="Exit">Exit</option>
          </select>
          <input
            type="date"
            className="border border-gray-300 rounded-xl p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            value={filter.date}
            onChange={(e) => handleFilterChange(e, "date")}
          />
          <select
            className="border border-gray-300 rounded-xl p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            value={filter.location}
            onChange={(e) => handleFilterChange(e, "location")}
          >
            <option value="all">All Locations</option>
            <option value="Main Gate">Main Gate</option>
            <option value="Side Gate">Side Gate</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
          {[
            {
              title: "Total Logs",
              value: logs.length,
              icon: <BsDatabaseFill className="text-blue-600 text-3xl" />,
            },
            {
              title: "Entries Today",
              value: logs.filter((log) => log.action === "Entry").length,
              icon: <FaUserGraduate className="text-green-500 text-3xl" />,
            },
            {
              title: "Exits Today",
              value: logs.filter((log) => log.action === "Exit").length,
              icon: <FaDoorOpen className="text-red-500 text-3xl" />,
            },
            {
              title: "Unique Students",
              value: [...new Set(logs.map((l) => l.name))].length,
              icon: <FaUsers className="text-purple-600 text-3xl" />,
            },
          ].map((card, index) => (
            <div
              key={index}
              className="bg-white p-5 rounded-2xl shadow-md flex items-center justify-between hover:shadow-xl transition"
            >
              <div>
                <p className="text-gray-400">{card.title}</p>
                <h2 className="text-2xl font-bold text-gray-900">{card.value}</h2>
              </div>
              {card.icon}
            </div>
          ))}
        </div>

        {/* Floating Export Button */}
        <button className="fixed bottom-8 right-8 flex items-center gap-2 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition z-50">
          <FaDownload /> Export CSV
        </button>

        {/* Data Table */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                {[
                  "Student",
                  "RFID Tag",
                  "Action",
                  "Date & Time",
                  "Location",
                  "Grade & Section",
                ].map((header, index) => (
                  <th key={index} className="p-4 text-gray-600 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr
                  key={index}
                  className={`border-b transition-colors ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-gray-100`}
                >
                  <td className="p-4 font-medium text-gray-800">{log.name}</td>
                  <td className="p-4 text-blue-600 underline">{log.rfid}</td>
                  <td className="p-4">
                    <span
                      className={`px-4 py-1 text-sm font-semibold rounded-full ${
                        log.action === "Entry"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{log.time}</td>
                  <td className="p-4 text-gray-600">{log.location}</td>
                  <td className="p-4 text-gray-600">
                    {log.grade}
                    <br />
                    {log.section}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
