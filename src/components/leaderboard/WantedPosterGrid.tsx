"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { Skull, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamEntry {
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
}

/**
 * CornerFiligree
 * Ornate brass filigree corner bracket for the royal polished wood frame.
 */
function RoyalCornerBracket({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-9 h-9 pointer-events-none text-amber-400 select-none ${className}`}
      aria-hidden="true"
    >
      <path
        d="M 3 41 V 14 C 3 7.925 7.925 3 14 3 H 41"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
      />
      <path
        d="M 7 33 V 16 C 7 11.029 11.029 7 16 7 H 33"
        stroke="#b45309"
        strokeWidth="1.2"
        strokeDasharray="2 3"
      />
      <circle cx="6" cy="6" r="2.5" fill="#fef08a" stroke="#78350f" strokeWidth="0.75" />
      <circle cx="16" cy="6" r="1.5" fill="#f59e0b" />
      <circle cx="6" cy="16" r="1.5" fill="#f59e0b" />
    </svg>
  );
}

export default function WantedPosterGrid({ teams }: WantedPosterGridProps) {
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
    /* 1. Outer Royal Polished Wood Notice Board Frame */
    <div className="relative w-full max-w-6xl mx-auto rounded-3xl p-3 sm:p-6 md:p-8 bg-gradient-to-b from-[#3d1a0e] via-[#2a1209] to-[#1a0904] border-[7px] border-[#4e2213] shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_2px_4px_rgba(255,255,255,0.22),inset_0_-6px_12px_rgba(0,0,0,0.95)]">
      {/* Royal Polished Wood Sheen Highlights */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none rounded-3xl" />

      {/* Royal Gold Filigree Trim Inlay */}
      <div className="absolute inset-1.5 sm:inset-2.5 rounded-[1.25rem] border border-amber-500/40 pointer-events-none z-20 shadow-[0_0_12px_rgba(245,158,11,0.2)]" />

      {/* Four Antique Brass Corner Brackets on the Royal Frame */}
      <div className="absolute top-2 left-2 z-30">
        <RoyalCornerBracket />
      </div>
      <div className="absolute top-2 right-2 z-30 -scale-x-100">
        <RoyalCornerBracket />
      </div>
      <div className="absolute bottom-2 left-2 z-30 -scale-y-100">
        <RoyalCornerBracket />
      </div>
      <div className="absolute bottom-2 right-2 z-30 -scale-x-100 -scale-y-100">
        <RoyalCornerBracket />
      </div>

      {/* Engraved Brass Plaque Header */}
      <div className="relative z-30 flex justify-center mb-6 sm:mb-8">
        <div className="px-6 sm:px-10 py-2 sm:py-2.5 rounded-md bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 border-2 border-amber-300/80 shadow-[0_4px_15px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.5)] flex items-center gap-3">
          {/* Left Brass Rivet */}
          <div className="w-2.5 h-2.5 rounded-full bg-amber-900 border border-amber-200 shadow-inner" />
          <div className="flex items-center gap-2 text-[#1a0e07] font-[family-name:var(--font-cinzel-decorative)] font-black tracking-[0.25em] text-xs sm:text-sm uppercase">
            <Award className="w-4 h-4 text-[#1a0e07]" />
            <span>Grand Line Most Wanted Board</span>
            <Award className="w-4 h-4 text-[#1a0e07]" />
          </div>
          {/* Right Brass Rivet */}
          <div className="w-2.5 h-2.5 rounded-full bg-amber-900 border border-amber-200 shadow-inner" />
        </div>
      </div>

      {/* 2. Inner Weathered Wooden Plank Notice Board */}
      <div
        className="relative z-10 w-full rounded-2xl p-4 sm:p-7 md:p-10 shadow-[inset_0_8px_32px_rgba(0,0,0,0.95),0_2px_4px_rgba(255,255,255,0.06)] border-2 border-black/80"
        style={{
          backgroundColor: "#160b06",
          backgroundImage: `
            /* Deep horizontal weathered wood planks (86px high) with shadow crevices */
            repeating-linear-gradient(
              0deg,
              #150904 0px,
              #1c0d06 26px,
              #261309 56px,
              #170b05 84px,
              #0d0502 85px,
              #060201 86px
            ),
            /* Fine vertical wood grain striations */
            repeating-linear-gradient(
              90deg,
              rgba(217, 119, 6, 0.025) 0px,
              rgba(217, 119, 6, 0.025) 2px,
              transparent 2px,
              transparent 7px
            )
          `,
        }}
      >
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
                className={cn(
                  "wanted-poster rounded-md p-4 sm:p-5 flex flex-col items-center relative transition-all duration-300 hover:rotate-0 hover:scale-105 hover:z-20 cursor-pointer",
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

                <div className="w-full aspect-square border-2 border-[#2a1810] mb-3 flex items-center justify-center bg-[#e8d5a7] relative overflow-hidden shadow-inner">
                  <Skull className="w-16 h-16 text-[#2a1810] opacity-50" />
                </div>

                <h2 className="font-[family-name:var(--font-pirata-one)] text-[#2a1810] text-2xl sm:text-3xl text-center leading-tight mb-2 truncate w-full px-2">
                  {team.teamName}
                </h2>

                <div className="flex flex-wrap gap-2 justify-center mb-3">
                  <span className="bg-amber-500/20 text-[#2a1810] font-bold font-mono px-2.5 py-0.5 rounded text-xs border border-amber-600/40">
                    {team.batchTier === "FIRST_YEAR" ? "1st Year '26" : "Senior Fleet"}
                  </span>
                </div>

                <div className="mt-auto text-center w-full">
                  <p className="font-[family-name:var(--font-cinzel-decorative)] text-[#2a1810]/70 text-[11px] font-bold mb-0.5 uppercase tracking-widest">
                    Bounty
                  </p>
                  <p className="font-[family-name:var(--font-pirata-one)] text-[#2a1810] text-3xl sm:text-4xl">
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
                  className={cn(
                    "wanted-poster rounded-md p-4 flex flex-col items-center relative transition-all duration-300 hover:rotate-0 hover:scale-105 cursor-pointer w-full sm:w-64 sm:h-[360px] shadow-[0_8px_20px_rgba(0,0,0,0.8)] border-4 border-[#3d2114]",
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

                  <div className="w-full aspect-square border-2 border-[#2a1810] mb-3 flex items-center justify-center bg-[#e8d5a7] relative overflow-hidden shadow-inner">
                    <Skull className="w-12 h-12 text-[#2a1810] opacity-50" />
                  </div>

                  <h2 className="font-[family-name:var(--font-pirata-one)] text-[#2a1810] text-xl sm:text-2xl text-center leading-tight mb-2 truncate w-full px-2">
                    {team.teamName}
                  </h2>

                  <div className="mt-auto text-center w-full">
                    <p className="font-[family-name:var(--font-pirata-one)] text-[#2a1810] text-2xl sm:text-3xl">
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
