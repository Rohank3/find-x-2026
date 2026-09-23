export default function LeaderboardLoading() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
      <div className="text-center mb-12">
        <div className="h-12 w-64 bg-amber-500/20 rounded mx-auto animate-pulse mb-4" />
        <div className="h-6 w-96 bg-amber-100/10 rounded mx-auto animate-pulse" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-20 bg-[#2a1810]/20 border-2 border-amber-500/10 rounded-lg flex items-center p-4 gap-4 animate-pulse"
          >
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-amber-500/20 rounded w-1/3" />
              <div className="h-4 bg-amber-100/10 rounded w-1/4" />
            </div>
            <div className="w-24 h-8 bg-amber-500/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
