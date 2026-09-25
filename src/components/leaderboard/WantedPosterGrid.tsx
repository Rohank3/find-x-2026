"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { Skull, Award } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface TeamEntry {
  rank: number;
  teamId: string;
  teamName: string;
  batchTier: "FIRST_YEAR" | "SENIOR";
  isFirstYear: boolean;
  score: number;
  puzzlesSolved: number;
  lastSolveTime: string | Date | null;
}

interface WantedPosterGridProps {
  teams: TeamEntry[];
  onTeamClick?: (team: TeamEntry) => void;
  onViewTop5Graph?: () => void;
}

export default function WantedPosterGrid({
  teams,
  onTeamClick,
  onViewTop5Graph,
}: WantedPosterGridProps) {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  const top3 = teams.slice(0, 3);
  const next2 = teams.slice(3, 5);

  const getRankCrestColors = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-tr from-amber-500 to-yellow-300 text-[#1a0e07] border-yellow-200 shadow-[0_0_15px_rgba(245,158,11,0.6)]";
      case 2:
        return "bg-gradient-to-tr from-slate-400 to-slate-200 text-[#1a0e07] border-slate-100 shadow-[0_0_12px_rgba(203,213,225,0.5)]";
      case 3:
        return "bg-gradient-to-tr from-amber-800 to-amber-600 text-amber-100 border-amber-400 shadow-[0_0_12px_rgba(180,83,9,0.5)]";
      default:
        return "bg-gradient-to-tr from-stone-700 to-stone-500 text-stone-100 border-stone-400 shadow-md";
    }
  };

  const getPosterTilt = (rank: number) => {
    switch (rank) {
      case 1:
        return "md:rotate-0";
      case 2:
        return "md:-rotate-1.5";
      case 3:
        return "md:rotate-1.5";
      case 4:
        return "md:rotate-1";
      case 5:
        return "md:-rotate-1";
      default:
        return "";
    }
  };

  return (
    /* 1. Outer Dashboard Glassmorphic Frame */
    <div className="relative w-full max-w-6xl mx-auto rounded-3xl p-4 sm:p-6 md:p-8 bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden">
      {/* Subtle Ambient Light Shimmer */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      {/* Engraved Plaque Header & Quick Actions */}
      <div className="relative z-30 flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 sm:mb-8">
        <div className="px-6 sm:px-8 py-2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_16px_rgba(251,191,36,0.3)] flex items-center gap-2.5">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="font-sans font-black tracking-[0.2em] text-xs sm:text-sm uppercase text-amber-300">
            Wanted Board
          </span>
          <Award className="w-4 h-4 text-amber-400" />
        </div>

        {onViewTop5Graph && (
          <button
            type="button"
            onClick={onViewTop5Graph}
            className="px-4 py-1.5 rounded-full bg-black/60 hover:bg-amber-400 hover:text-black border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 group"
            title="View comparative score trajectory of top 5 fleet"
          >
            <span className="group-hover:scale-110 transition-transform">📊</span>
            <span>View Top 5 Graph</span>
          </button>
        )}
      </div>

      {/* 2. Inner Deck Notice Board */}
      <div className="relative z-10 w-full rounded-2xl p-4 sm:p-7 md:p-10 bg-black/40 border border-white/5 backdrop-blur-xl shadow-inner">
        {/* Forged Iron Board Studs along side margins */}
        <div className="absolute top-4 left-3 flex flex-col gap-16 pointer-events-none opacity-60 hidden sm:flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-stone-400 via-stone-700 to-black border border-stone-500/40 shadow-md"
            />
          ))}
        </div>
        <div className="absolute top-4 right-3 flex flex-col gap-16 pointer-events-none opacity-60 hidden sm:flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-stone-400 via-stone-700 to-black border border-stone-500/40 shadow-md"
            />
          ))}
        </div>

        {/* 3. The Pinned Wanted Posters Grid */}
        <motion.div
          className="flex flex-col gap-8 w-full items-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Top 3 Podium Row */}
          <div className="flex flex-col md:flex-row justify-center items-end gap-6 sm:gap-8 w-full">
            {top3.map((team) => (
              <motion.div
                key={team.teamId}
                variants={item}
                onClick={() => onTeamClick?.(team)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onTeamClick?.(team);
                  }
                }}
                className={cn(
                  "wanted-poster rounded-md p-4 sm:p-5 flex flex-col items-center relative transition-all duration-300 hover:rotate-0 hover:scale-105 hover:z-20 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 group",
                  getPosterTilt(team.rank),
                  team.rank === 1
                    ? "w-full sm:w-80 sm:h-[460px] z-10 md:-translate-y-4 shadow-[0_12px_35px_rgba(0,0,0,0.85)] border-4 border-[#3d2114]"
                    : "w-full sm:w-72 sm:h-[415px] shadow-[0_8px_25px_rgba(0,0,0,0.8)] border-4 border-[#3d2114]"
                )}
              >
                {/* Forged Iron Tack Pin */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-200 via-amber-700 to-black shadow-[0_2px_4px_rgba(0,0,0,0.85)] border border-amber-300/70" />
                </div>

                <h3 className="font-[family-name:var(--font-cinzel-decorative)] text-red-700 font-black text-base sm:text-lg uppercase tracking-wider mb-2 text-center drop-shadow-sm">
                  Dead or Alive
                </h3>

                <div className="w-full aspect-square border-2 border-[#2a1810] mb-3 flex items-center justify-center bg-[#e8d5a7] relative overflow-hidden shadow-inner group-hover:border-amber-700 transition-colors">
                  <Skull className="w-16 h-16 text-[#2a1810] opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] font-sans font-black uppercase tracking-widest text-[#2a1810] bg-[#fde68a]/90 px-2 py-1 rounded shadow-sm border border-[#b45309]/40">
                      Click for Graph
                    </span>
                  </div>
                </div>

                <h2 className="font-[family-name:var(--font-pirata-one)] text-[#2a1810] text-2xl sm:text-3xl text-center leading-tight mb-1 truncate w-full px-2">
                  {team.teamName}
                </h2>

                <div className="flex flex-wrap gap-2 justify-center mb-2">
                  <span className="bg-amber-500/20 text-[#2a1810] font-bold font-mono px-2.5 py-0.5 rounded text-xs border border-amber-600/40">
                    {team.batchTier === "FIRST_YEAR" ? "1st Year '26" : "Senior Fleet"}
                  </span>
                </div>

                <div className="mt-auto text-center w-full">
                  <p className="font-[family-name:var(--font-cinzel-decorative)] text-[#2a1810]/70 text-[11px] font-bold mb-0.5 uppercase tracking-widest">
                    Bounty
                  </p>
                  <p className="font-[family-name:var(--font-pirata-one)] text-[#2a1810] text-3xl sm:text-4xl leading-none">
                    ฿ {team.score.toLocaleString()}
                  </p>
                </div>

                {/* Rank Crest at Bottom */}
                <div
                  className={cn(
                    "absolute -bottom-6 flex items-center justify-center w-12 h-12 rounded-full border-4 border-[#2a1810] font-[family-name:var(--font-cinzel-decorative)] font-bold text-xl shadow-xl",
                    getRankCrestColors(team.rank)
                  )}
                >
                  {team.rank === 1 && <span className="absolute -top-3 text-sm">⭐</span>}
                  {team.rank}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Next 2 Ranks Row */}
          {next2.length > 0 && (
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 sm:gap-8 mt-4 md:mt-6">
              {next2.map((team) => (
                <motion.div
                  key={team.teamId}
                  variants={item}
                  onClick={() => onTeamClick?.(team)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onTeamClick?.(team);
                    }
                  }}
                  className={cn(
                    "wanted-poster rounded-md p-4 flex flex-col items-center relative transition-all duration-300 hover:rotate-0 hover:scale-105 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 group w-full sm:w-64 sm:h-[360px] shadow-[0_8px_20px_rgba(0,0,0,0.8)] border-4 border-[#3d2114]",
                    getPosterTilt(team.rank)
                  )}
                >
                  {/* Forged Iron Tack Pin */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-200 via-amber-700 to-black shadow-[0_2px_4px_rgba(0,0,0,0.85)] border border-amber-300/70" />
                  </div>

                  <h3 className="font-[family-name:var(--font-cinzel-decorative)] text-red-700 font-bold text-sm uppercase tracking-wider mb-2 text-center">
                    Dead or Alive
                  </h3>

                  <div className="w-full aspect-square border-2 border-[#2a1810] mb-3 flex items-center justify-center bg-[#e8d5a7] relative overflow-hidden shadow-inner group-hover:border-amber-700 transition-colors">
                    <Skull className="w-12 h-12 text-[#2a1810] opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[9px] font-sans font-black uppercase tracking-widest text-[#2a1810] bg-[#fde68a]/90 px-2 py-1 rounded shadow-sm border border-[#b45309]/40">
                        Click for Graph
                      </span>
                    </div>
                  </div>

                  <h2 className="font-[family-name:var(--font-pirata-one)] text-[#2a1810] text-xl sm:text-2xl text-center leading-tight mb-1 truncate w-full px-2">
                    {team.teamName}
                  </h2>

                  <div className="mt-auto text-center w-full">
                    <p className="font-[family-name:var(--font-pirata-one)] text-[#2a1810] text-2xl sm:text-3xl leading-none">
                      ฿ {team.score.toLocaleString()}
                    </p>
                  </div>

                  {/* Rank Crest at Bottom */}
                  <div
                    className={cn(
                      "absolute -bottom-5 flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#2a1810] font-[family-name:var(--font-cinzel-decorative)] font-bold text-lg shadow-md",
                      getRankCrestColors(team.rank)
                    )}
                  >
                    {team.rank}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
