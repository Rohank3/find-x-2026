import { Compass, Anchor } from "@/components/icons";

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        {/* Neutral Command Deck Header Skeleton */}
        <div className="relative rounded-3xl bg-black/60 backdrop-blur-md border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
                <Compass className="w-7 h-7 animate-spin [animation-duration:8s]" />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <div className="h-6 w-48 sm:w-64 rounded-xl bg-white/20" />
                <div className="h-3.5 w-32 rounded-lg bg-white/10" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-9 w-28 rounded-full bg-amber-400/20 border border-amber-400/30" />
              <div className="h-9 w-24 rounded-full bg-white/10 border border-white/15" />
            </div>
          </div>
        </div>

        {/* Modular Content Panels Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-black/50 backdrop-blur-md border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Anchor className="w-4 h-4 text-amber-400/60" />
                <div className="h-5 w-32 rounded bg-white/20" />
              </div>
              <div className="h-4 w-16 rounded bg-amber-400/20" />
            </div>
            <div className="h-10 rounded-xl bg-white/[0.04] border border-white/5" />
            <div className="h-28 rounded-2xl bg-white/[0.02] border border-white/5" />
          </div>

          <div className="rounded-3xl bg-black/50 backdrop-blur-md border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400/60" />
                <div className="h-5 w-36 rounded bg-white/20" />
              </div>
              <div className="h-4 w-16 rounded bg-white/10" />
            </div>
            <div className="h-10 rounded-xl bg-white/[0.04] border border-white/5" />
            <div className="h-28 rounded-2xl bg-white/[0.02] border border-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
