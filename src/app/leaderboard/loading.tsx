export default function LeaderboardLoading() {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-44 rounded-3xl bg-black/60 border border-white/10 p-8 flex flex-col items-center justify-center space-y-3">
        <div className="h-6 w-40 bg-amber-400/20 rounded-full" />
        <div className="h-10 w-72 bg-white/20 rounded-xl" />
        <div className="h-4 w-96 max-w-full bg-white/10 rounded" />
      </div>

      {/* Tabs Skeleton */}
      <div className="h-10 w-72 bg-black/60 border border-white/10 rounded-full mx-auto" />

      {/* Rows Skeleton */}
      <div className="rounded-3xl bg-black/60 border border-white/10 p-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between p-4 gap-4"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/20 rounded w-1/4" />
              <div className="h-3 bg-white/10 rounded w-1/6" />
            </div>
            <div className="w-20 h-6 bg-amber-400/20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
