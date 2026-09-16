export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8 font-mono">
      {/* Top Header Skeleton */}
      <div className="relative border border-[hsl(45_40%_97%/0.12)] bg-black/60 p-6 backdrop-blur-md animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-[hsl(45_40%_97%/0.15)] rounded-none" />
            <div className="h-3 w-48 bg-[hsl(45_40%_97%/0.08)] rounded-none" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-[hsl(45_68%_47%)] animate-ping" />
            <span className="text-[10px] tracking-[0.2em] text-[hsl(45_68%_47%)] uppercase">
              DECRYPTING TELEMETRY...
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex flex-wrap gap-2 border-b border-[hsl(45_40%_97%/0.1)] pb-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-8 w-24 bg-[hsl(45_40%_97%/0.08)] animate-pulse" />
        ))}
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 border border-[hsl(45_40%_97%/0.08)] bg-black/40 p-6 space-y-3 animate-pulse">
            <div className="h-4 w-28 bg-[hsl(45_40%_97%/0.12)]" />
            <div className="h-8 w-16 bg-[hsl(45_40%_97%/0.2)]" />
            <div className="h-3 w-full bg-[hsl(45_40%_97%/0.06)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
