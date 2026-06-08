
function PetLoader() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
      
      <div className="relative mb-6">
        <span className="text-7xl animate-pulse inline-block">🐾</span>
        
        <div className="w-12 h-2 bg-gray-200 rounded-full mx-auto mt-2 blur-sm"></div>
      </div>
      
      <div className="text-center">
        <h2 className="text-2xl font-bold text-amber-700 animate-bounce">
          Fetching...
        </h2>
        <p className="text-gray-500 italic">
          Sniffing out the data 🐶
        </p>
      </div>

      <div className="mt-8 w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="w-1/2 h-full bg-amber-500 rounded-full animate-[shimmer_1.5s_infinite] origin-left"></div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

export default PetLoader;
