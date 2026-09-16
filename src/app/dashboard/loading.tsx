export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8 font-mono">
      <div className="border border-[hsl(45_40%_97%/0.12)] bg-black/60 p-6 backdrop-blur-md animate-pulse">
        <div className="h-8 w-60 bg-[hsl(45_40%_97%/0.15)] mb-2" />
        <div className="h-4 w-40 bg-[hsl(45_40%_97%/0.08)]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 border border-[hsl(45_40%_97%/0.08)] bg-black/40 p-6 space-y-3 animate-pulse">
            <div className="h-4 w-32 bg-[hsl(45_40%_97%/0.12)]" />
            <div className="h-8 w-20 bg-[hsl(45_40%_97%/0.2)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
