"use client";
import { useEffect, useState } from "react";
import { fetchSchoolEvents } from "./utils";

export default function SchoolEvents() {
  const [schoolEvents, setSchoolEvents] = useState([]);

  useEffect(() => {
    const loadEvents = async () => {
      const events = await fetchSchoolEvents("guard");
      setSchoolEvents(events);
    };
    loadEvents();
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-black">📅 Announcements</h3>
      </div>

      <div className="p-6 space-y-4">
        {schoolEvents.length > 0 ? (
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
    </div>
  );
}
