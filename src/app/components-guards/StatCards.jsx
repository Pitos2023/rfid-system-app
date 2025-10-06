export default function StatCard({ title, value, icon, color, note, delay }) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 transition-all hover:shadow-md"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-extrabold text-black">{value}</p>
        </div>
        <div className={`w-16 h-16 ${color} rounded-xl flex items-center justify-center`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      {note && <span className="text-sm text-gray-600">{note}</span>}
    </div>
  );
}
