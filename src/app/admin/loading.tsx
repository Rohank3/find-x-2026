import { Compass } from "@/components/icons";

export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8 font-sans">
      {/* Top Header Skeleton — Royal Mahogany & Brass */}
      <div className="relative border-2 border-amber-500/30 bg-gradient-to-b from-[#1c130c]/95 to-[#100b07]/95 p-6 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.85)] animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-44 bg-amber-500/20 rounded-full" />
            <div className="h-9 w-72 bg-amber-400/25 rounded-lg" />
            <div className="h-3 w-56 bg-amber-500/15 rounded-md" />
          </div>
          <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full border border-amber-500/40 bg-amber-950/30">
            <Compass className="h-4 w-4 text-amber-400 animate-spin" />
            <span className="text-[11px] font-mono tracking-widest text-amber-300 font-bold uppercase">
              CHARTING GRAND LINE TELEMETRY...
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex flex-wrap gap-2.5 border-b border-amber-500/20 pb-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-10 w-32 bg-[#1c130c] border border-amber-500/20 rounded-xl animate-pulse"
          />
        ))}
      </div>

      {/* Treasury Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 border border-amber-500/25 bg-[#18110a]/90 rounded-2xl p-5 space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-amber-500/20 rounded-md" />
              <div className="h-8 w-8 rounded-xl bg-amber-500/20" />
            </div>
            <div className="h-8 w-20 bg-amber-400/30 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
