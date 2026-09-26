import React from "react";
import { Compass, Anchor } from "@/components/icons";

export default function LeaderboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col items-center">
      <div className="w-full max-w-6xl mx-auto space-y-8 animate-pulse">
        {/* Tier Filter Tabs Skeleton */}
        <div className="flex items-center justify-center p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-xl gap-2 mx-auto w-fit">
          <div className="h-8 w-24 rounded-full bg-amber-400/20" />
          <div className="h-8 w-28 rounded-full bg-white/5" />
          <div className="h-8 w-24 rounded-full bg-white/5" />
        </div>

        {/* Ambient Loading Banner */}
        <div className="w-full rounded-2xl bg-black/50 backdrop-blur-md border border-amber-400/20 p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

          <div className="relative mb-4 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.2)]">
              <Compass className="w-8 h-8 animate-spin [animation-duration:8s]" />
            </div>
            <Anchor className="w-5 h-5 text-amber-400/60 absolute -bottom-1 -right-1" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-sans text-amber-300 uppercase tracking-widest mb-1.5">
            Calibrating Fleet Standings
          </h2>
          <p className="font-code text-white/50 text-xs tracking-wider">
            Fetching bounty manifests & telemetry from the Grand Line...
          </p>

          {/* Skeleton Podium Cards Outline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-8 pt-6 border-t border-white/10">
            <div className="h-44 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center p-4 gap-2">
              <div className="w-12 h-12 rounded-full bg-white/10" />
              <div className="w-24 h-4 rounded bg-white/10" />
              <div className="w-16 h-5 rounded bg-amber-400/20" />
            </div>
            <div className="h-48 rounded-2xl bg-amber-400/[0.04] border border-amber-400/20 flex flex-col items-center justify-center p-4 gap-2 sm:-translate-y-2">
              <div className="w-14 h-14 rounded-full bg-amber-400/20" />
              <div className="w-28 h-5 rounded bg-amber-400/20" />
              <div className="w-20 h-6 rounded bg-amber-400/30" />
            </div>
            <div className="h-44 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center p-4 gap-2">
              <div className="w-12 h-12 rounded-full bg-white/10" />
              <div className="w-24 h-4 rounded bg-white/10" />
              <div className="w-16 h-5 rounded bg-amber-400/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
