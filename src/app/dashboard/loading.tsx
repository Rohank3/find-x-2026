"use client";

import {
  Skull,
  Coins,
  Swords,
  Compass,
  Users,
  Scroll,
} from "@/components/icons";

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        {/* Unified Anime Flagship Command Banner Skeleton */}
        <div className="relative rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden">
          {/* Subtle Ambient Light Shimmer */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

          <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 sm:gap-8">
            {/* Left: Big Jolly Roger Avatar Crest Skeleton */}
            <div className="relative group shrink-0 self-center md:self-stretch flex items-center justify-center">
              <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-full md:min-h-[190px] aspect-square rounded-2xl overflow-hidden border-2 border-amber-400/30 bg-black/70 shadow-[0_0_25px_rgba(251,191,36,0.15)] flex items-center justify-center">
                <Skull className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400/20" />
              </div>
            </div>

            {/* Right: Identity Header + Bounty + Points Stats Grid Skeleton */}
            <div className="flex-1 flex flex-col justify-between gap-5 min-w-0 w-full">
              {/* Top Row: Ship Name & Level + Fleet Bounty */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
                {/* Ship Titles & Level */}
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5 flex-wrap">
                    <span className="w-24 h-5 rounded-full bg-amber-400/20 border border-amber-400/30 inline-block" />
                    <span className="w-28 h-5 rounded-full bg-white/10 border border-white/15 inline-block" />
                  </div>

                  <div className="h-9 sm:h-11 w-56 sm:w-72 rounded-xl bg-white/20" />
                  <div className="h-4 w-28 rounded bg-white/10 mt-1" />
                </div>

                {/* Big Anime Bounty Badge */}
                <div className="flex flex-col items-center sm:items-end text-center sm:text-right shrink-0 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-400/40" />
                    <span className="h-3 w-20 rounded bg-amber-400/20 inline-block" />
                  </div>
                  <div className="h-9 sm:h-12 w-36 sm:w-44 rounded-xl bg-amber-400/20" />
                </div>
              </div>

              {/* Bottom Row: Points Stats Shifted Right alongside Avatar */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 border-t border-white/10 w-full">
                {/* Points Earned */}
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] border border-white/5 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400/40 shrink-0">
                    <Swords className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="h-2.5 w-14 rounded bg-white/20" />
                    <div className="h-5 w-12 rounded bg-emerald-400/20" />
                  </div>
                </div>

                {/* Penalties */}
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] border border-white/5 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400/40 shrink-0">
                    <Skull className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="h-2.5 w-14 rounded bg-white/20" />
                    <div className="h-5 w-12 rounded bg-red-400/20" />
                  </div>
                </div>

                {/* Adjustments */}
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] border border-white/5 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400/40 shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="h-2.5 w-14 rounded bg-white/20" />
                    <div className="h-5 w-12 rounded bg-amber-400/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Crew Members Section Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400/50" />
              <div className="h-5 w-24 rounded bg-white/20" />
            </div>
            <div className="h-4 w-20 rounded bg-amber-400/20" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl p-5 border border-white/10 bg-black/50 backdrop-blur-xl flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-end mb-3">
                    <div className="h-4 w-10 rounded-full bg-white/10" />
                  </div>
                  <div className="h-6 w-32 rounded bg-white/20" />
                  <div className="space-y-1 mt-1">
                    <div className="h-3 w-24 rounded bg-white/10" />
                    <div className="h-3 w-28 rounded bg-amber-400/20" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="h-3 w-16 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Section / Ship's Log Skeleton */}
        <div className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Scroll className="w-4 h-4 text-amber-400/50" />
              <div className="h-5 w-32 rounded bg-white/20" />
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 w-12 rounded-lg bg-white/10" />
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-40 rounded bg-white/20" />
                    <div className="h-3 w-28 rounded bg-white/10" />
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <div className="h-4 w-16 rounded bg-emerald-400/20 ml-auto" />
                  <div className="h-2.5 w-12 rounded bg-white/10 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
