export default function Header({ date }) {
  return (
    <header className="bg-[#800000] text-white shadow-md">
      <div className="px-4 sm:px-6 md:px-8 py-3 flex flex-row justify-between items-center">
        {/* Left Side - School Info */}
        <div className="flex flex-col">
          <p className="text-sm sm:text-base font-semibold">SPC Assistant Principal</p>
        </div>

        {/* Right Side - Role, Name, Date */}
        <div className="flex flex-col items-end text-right">
          <div className="text-xs sm:text-sm text-gray-200">Assistant Principal</div>
          <div className="font-semibold text-white text-base sm:text-lg">Martinez</div>
      
        </div>
      </div>
    </header>
  );
}
