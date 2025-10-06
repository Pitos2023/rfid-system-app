import { schoolEvents } from "./utils";

export default function SchoolEvents() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-black">📅 Announcements</h3>
      </div>
      <div className="p-6 space-y-4">
        {schoolEvents.map((event, i) => (
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
              <p className="text-sm text-gray-500 capitalize font-medium">{event.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
