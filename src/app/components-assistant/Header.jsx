export default function Header({ time, date }) {
  return (
<header className="bg-[#58181F] text-white shadow-md">
  <div className="px-8 py-2 flex flex-col md:flex-row items-center justify-between">
    <div className="flex items-center space-x-6">
      <div>
        <h1 className="text-2xl md:text-2xl font-bold">
          My.SPC
        </h1>
      </div>
    </div>

    <div className="flex items-center space-x-6 mt-4 md:mt-0">
      <div className="text-center">
        <div className="text-xl font-bold">{time}</div>
        <div className="text-sm text-gray-200">{date}</div>
      </div>
      <div className="text-center">
        <div className="text-sm text-gray-200">Assistant Principal</div>
        <div className="font-bold text-white text-lg">Martinez</div>
        <div className="flex items-center justify-center mt-1">
        </div>
      </div>
    </div>
  </div>
</header>
  );
}
