import { sickLeaveStudents } from "./utils";

export default function SickLeaveList() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-black">🏥 Medical Leave</h3>
      </div>
      <div className="p-6 space-y-3">
        {sickLeaveStudents.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-red-50"
          >
            <div>
              <p className="font-bold text-black">{s.name}</p>
              <p className="text-sm text-gray-600">
                {s.grade} • {s.reason}
              </p>
            </div>
            <span className="text-xs text-gray-500">{s.reported}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
