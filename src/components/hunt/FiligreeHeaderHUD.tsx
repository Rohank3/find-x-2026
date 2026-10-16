"use client";

import React from "react";
import { Clock, Coins, Compass, Sparkles, Navigation } from "lucide-react";

interface FiligreeHeaderHUDProps {
  teamName: string;
  clearedCount: number;
  currentLandmarkName: string;
  bountyPoints?: number;
  timeRemaining?: string;
  onJumpToActive?: () => void;
}

export default function FiligreeHeaderHUD({
  teamName,
  clearedCount,
  currentLandmarkName,
  bountyPoints = 0,
  timeRemaining = "02:44:19",
  onJumpToActive,
}: FiligreeHeaderHUDProps) {
  return (
    <header className="relative z-30 w-full overflow-hidden border-b-2 border-[#4d2813] bg-[#120703] px-3 py-2 sm:px-6 shadow-[0_12px_32px_rgba(0,0,0,0.95)]">
      {/* Ornate Ebony Wood & Filigree Banner Texture Underlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none bg-center bg-cover"
        style={{
          backgroundImage: `url('/images/hunt/top_header_banner.webp')`,
        }}
      />

      {/* Gold Trim Underline Accent */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#d4af37]/80 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        {/* Left: Crew Telemetry & Conquered Count (No "of 15" spoiler!) */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#8a4b18] via-[#52290d] to-[#1e0c03] border-2 border-[#d4af37] flex items-center justify-center text-amber-300 shadow-[0_0_18px_rgba(212,175,55,0.35)] shrink-0">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6 animate-spin-slow text-[#fde047]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest text-[#d4af37] bg-[#d4af37]/15 px-2 py-0.5 rounded border border-[#d4af37]/40">
                Active Voyage
              </span>
              <span className="text-white/30 text-xs">•</span>
              <span className="text-emerald-400 text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                Bearing Aligned
              </span>
            </div>

            <div className="flex items-baseline gap-2.5 mt-0.5">
              <h1 className="text-base sm:text-xl font-black font-serif text-[#fff7e6] tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate max-w-[200px] sm:max-w-xs">
                {teamName}
              </h1>
              <span className="text-xs font-mono text-amber-300/90 font-bold whitespace-nowrap">
                — {clearedCount} Breached
              </span>
            </div>
          </div>
        </div>

        {/* Center: Current Clue & Helm Navigation */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-[#1e0e06]/90 border border-[#6f3b1b] shadow-inner">
          <div className="text-left">
            <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400/80 block">
              Current Encounter:
            </span>
            <span className="text-xs font-serif font-black text-[#fdf5e2] flex items-center gap-1.5 truncate max-w-xs">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              {currentLandmarkName}
            </span>
          </div>

          {onJumpToActive && (
            <button
              onClick={onJumpToActive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-[#140803] font-serif font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Pan map to active pin"
            >
              <Navigation className="w-3.5 h-3.5 fill-[#140803]" />
              <span>Helm</span>
            </button>
          )}
        </div>

        {/* Right: Bounty Points & Timer */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Total Bounty Score */}
          <div className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#221006] border border-[#6a3618] text-amber-300 font-mono font-bold text-xs shadow-inner">
            <Coins className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-xs sm:text-sm font-black">{bountyPoints.toLocaleString()}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-yellow-300 font-serif">
              BOUNTY
            </span>
          </div>

          {/* High Tide Timer */}
          <div className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#180b04] border border-amber-900/70 text-amber-200 font-mono text-xs shadow-inner">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold tracking-wider">{timeRemaining}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
