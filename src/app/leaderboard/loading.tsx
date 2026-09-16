export default function LeaderboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8 font-mono">
      <div className="border border-[hsl(45_40%_97%/0.12)] bg-black/60 p-6 backdrop-blur-md animate-pulse">
        <div className="h-8 w-64 bg-[hsl(45_40%_97%/0.15)]" />
      </div>
      <div className="border border-[hsl(45_40%_97%/0.08)] bg-black/40 p-6 animate-pulse space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-12 w-full bg-[hsl(45_40%_97%/0.05)]" />
        ))}
      </div>
    </div>
  );
}
