"use client";
import { useEffect, useState } from "react";
import { fetchSchoolEvents } from "./utils";

export default function SchoolEvents() {
  const [schoolEvents, setSchoolEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadEvents = async (page = 1) => {
    try {
      setLoading(true);
      const { events, totalPages } = await fetchSchoolEvents("guard", page);
      setSchoolEvents(events);
      setTotalPages(totalPages);
      setCurrentPage(page);
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents(1);
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-black">📅 Announcements</h3>
      </div>

      {/* Announcements List */}
      <div className="p-6 space-y-4">
        {loading ? (
          <p className="text-gray-500">Loading announcements...</p>
        ) : schoolEvents.length > 0 ? (
          schoolEvents.map((event, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50"
            >
              <div>
                <p className="font-bold text-black">{event.title}</p>
                <p className="text-sm text-gray-600">{event.date}</p>
                <p className="text-sm text-gray-600">{event.message}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-black">{event.time}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No announcements available.</p>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center p-4 border-t border-gray-200">
        <button
          onClick={() => loadEvents(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-lg font-semibold ${
            currentPage === 1
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-[#800000] text-white hover:bg-[#a52a2a]"
          }`}
        >
          Previous
        </button>

        <p className="text-gray-700 font-semibold">
          Page {currentPage} of {totalPages}
        </p>

        <button
          onClick={() => loadEvents(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-lg font-semibold ${
            currentPage === totalPages
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-[#800000] text-white hover:bg-[#a52a2a]"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
