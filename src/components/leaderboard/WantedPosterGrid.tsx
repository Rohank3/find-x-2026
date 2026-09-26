"use client";

import React from "react";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { Anchor } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface TeamEntry {
  rank: number;
  teamId: string;
  teamName: string;
  avatarUrl?: string | null;
  batchTier: "FIRST_YEAR" | "SENIOR";
  isFirstYear: boolean;
  score: number;
  puzzlesSolved: number;
  lastSolveTime: string | Date | null;
}

interface WantedPosterGridProps {
  teams: TeamEntry[];
  showQuestionsSolved?: boolean;
  onTeamClick?: (team: TeamEntry) => void;
  isClickable?: boolean;
}



function getTeamInitials(name: string): string {
  if (!name) return "?";
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  if (!cleaned) return name.slice(0, 2).toUpperCase();
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (/^\d+$/.test(parts[1])) {
    return (parts[0][0] + parts[1]).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function WantedPosterGrid({
  teams,
  showQuestionsSolved = true,
  onTeamClick,
  isClickable = true,
}: WantedPosterGridProps) {
  const canClick = isClickable && Boolean(onTeamClick);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  };

  const top3 = teams.slice(0, 3);
  const next2 = teams.slice(3, 5);

  const getPosterTilt = (rank: number) => {
    switch (rank) {
      case 1:
        return "md:rotate-0";
      case 2:
        return "md:-rotate-2";
      case 3:
        return "md:rotate-2";
      case 4:
        return "md:rotate-1.5";
      case 5:
        return "md:-rotate-1.5";
      default:
        return "";
    }
  };

  const getOrderClasses = (rank: number) => {
    switch (rank) {
      case 1:
        return "order-1 md:order-2"; // Top on mobile, center on desktop
      case 2:
        return "order-2 md:order-1"; // Second on mobile, left on desktop
      case 3:
        return "order-3 md:order-3"; // Third on mobile, right on desktop
      default:
        return "";
    }
  };

  return (
    /* Outer Notice Board Container: Authentic Cracked Wooden Plank Board */
    <div
      className="relative w-full max-w-6xl mx-auto rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.95)] border-4 sm:border-8 border-[#26150a] overflow-hidden select-none"
      style={{
        backgroundImage: `linear-gradient(rgba(18, 9, 4, 0.42), rgba(18, 9, 4, 0.58)), url('/images/wanted/cracked_wood_board.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Heavy Weathered Timber Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/75 pointer-events-none z-0" />
      <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] pointer-events-none z-0" />

      {/* Forged Hardware Nails along the Timber Frame Edge */}
      <div className="absolute top-3 left-4 w-5 h-5 pointer-events-none z-20 hidden sm:block">
        <Image src="/images/wanted/rusty_nail_head.png" alt="Nail" width={20} height={20} className="w-full h-full object-contain" />
      </div>
      <div className="absolute top-3 right-4 w-5 h-5 pointer-events-none z-20 hidden sm:block">
        <Image src="/images/wanted/rusty_nail_head.png" alt="Nail" width={20} height={20} className="w-full h-full object-contain" />
      </div>
      <div className="absolute bottom-3 left-4 w-5 h-5 pointer-events-none z-20 hidden sm:block">
        <Image src="/images/wanted/rusty_nail_head.png" alt="Nail" width={20} height={20} className="w-full h-full object-contain" />
      </div>
      <div className="absolute bottom-3 right-4 w-5 h-5 pointer-events-none z-20 hidden sm:block">
        <Image src="/images/wanted/rusty_nail_head.png" alt="Nail" width={20} height={20} className="w-full h-full object-contain" />
      </div>

      {/* Environmental Depth: Real Weathered Notices Pinned in the Background */}
      {/* 1. Vintage Enamel Rules Sign pinned in top-left */}
      <div className="absolute top-4 left-4 sm:left-7 w-20 sm:w-28 opacity-40 pointer-events-none z-0 -rotate-3 hidden md:block drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)]">
        <Image
          src="/images/wanted/ephemera/vintage_rules_sign.png"
          alt="Vintage Notice"
          width={110}
          height={75}
          className="w-full h-auto"
        />
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3">
          <Image src="/images/wanted/rusty_iron_tack.png" alt="Tack" width={12} height={12} />
        </div>
      </div>

      {/* 2. Old Wells Fargo Bounty Notice pinned bottom-left with circular nail */}
      <div className="absolute -bottom-6 left-6 w-24 sm:w-32 opacity-35 pointer-events-none z-0 rotate-6 hidden lg:block drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]">
        <Image
          src="/images/wanted/ephemera/notice_wells_fargo.png"
          alt="Vintage Wells Fargo Notice"
          width={128}
          height={170}
          className="w-full h-auto"
        />
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5">
          <Image src="/images/wanted/rusty_nail_head.png" alt="Nail" width={14} height={14} />
        </div>
      </div>

      {/* 3. Old Wyatt Earp Bounty Notice pinned top-right with circular nail */}
      <div className="absolute top-6 right-6 w-24 sm:w-32 opacity-35 pointer-events-none z-0 rotate-3 hidden lg:block drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]">
        <Image
          src="/images/wanted/ephemera/notice_wyatt_earp.png"
          alt="Vintage Wyatt Earp Notice"
          width={128}
          height={170}
          className="w-full h-auto"
        />
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5">
          <Image src="/images/wanted/rusty_nail_head.png" alt="Nail" width={14} height={14} />
        </div>
      </div>

      {/* 4. Subtle Blood Splatter Accent from hunt assets */}
      <div className="absolute bottom-10 right-12 w-28 sm:w-36 opacity-25 pointer-events-none z-0 hidden md:block">
        <Image
          src="/images/hunt/decor/mark_blood_splat_1.png"
          alt="Weathering"
          width={150}
          height={150}
          className="w-full h-auto"
        />
      </div>

      {/* Header Plaque: Carved Antique Brass & Timber Plaque */}
      <div className="relative z-20 flex flex-col items-center justify-center mb-8 sm:mb-12">
        <div className="relative px-8 sm:px-12 py-3 bg-[#1e1008] border-2 sm:border-4 border-[#523018] rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,200,120,0.15)] flex items-center gap-3 sm:gap-4">
          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none">
            <Image src="/images/wanted/rusty_nail_head.png" alt="Nail" width={20} height={20} />
          </div>
          <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none">
            <Image src="/images/wanted/rusty_nail_head.png" alt="Nail" width={20} height={20} />
          </div>

          <Anchor className="w-5 h-5 text-amber-500/90 drop-shadow-sm" />
          <h2 className="font-[family-name:var(--font-pirata-one)] text-2xl sm:text-4xl text-[#edd29b] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            Grand Line Wanted Board
          </h2>
          <Anchor className="w-5 h-5 text-amber-500/90 drop-shadow-sm" />
        </div>
        <p className="font-[family-name:var(--font-cinzel-decorative)] text-[10px] sm:text-xs font-black text-amber-200/80 tracking-[0.25em] uppercase mt-2 drop-shadow">
          Official Bounties Issued by the Admiralty
        </p>
      </div>

      {/* The Pinned Wanted Posters Grid */}
      <motion.div
        className="relative z-10 flex flex-col gap-12 sm:gap-16 w-full items-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Top 3 Podium Row */}
        <div className="flex flex-col md:flex-row justify-center items-center md:items-end gap-8 sm:gap-10 w-full">
          {top3.map((team) => {
            const isRank1 = team.rank === 1;

            return (
              <motion.div
                key={team.teamId}
                variants={item}
                onClick={canClick ? () => onTeamClick?.(team) : undefined}
                role={canClick ? "button" : undefined}
                tabIndex={canClick ? 0 : undefined}
                aria-label={
                  canClick
                    ? `View stats for Rank ${team.rank} team ${team.teamName}`
                    : `Rank ${team.rank} team ${team.teamName}`
                }
                onKeyDown={
                  canClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onTeamClick?.(team);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "relative group transition-all duration-300 rounded-sm drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]",
                  canClick && "cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400",
                  getOrderClasses(team.rank),
                  getPosterTilt(team.rank),
                  canClick && "hover:rotate-0 hover:scale-105 hover:z-30",
                  isRank1
                    ? "w-[280px] sm:w-[305px] md:w-[320px] z-20 md:-translate-y-5"
                    : "w-[255px] sm:w-[280px] md:w-[290px] z-10"
                )}
              >
                {/* 1. Real Circular Rusty Nail Head Physically Driven Into Paper (Leaves Visible Paper Margin Above) */}
                <div className="absolute top-5 sm:top-6 left-1/2 -translate-x-1/2 z-40 w-6 h-6 sm:w-7 sm:h-7 pointer-events-none drop-shadow-[0_3px_5px_rgba(0,0,0,0.9)]">
                  <Image
                    src="/images/wanted/rusty_nail_head.png"
                    alt="Forged Circular Iron Nail"
                    width={28}
                    height={28}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* 2. Authentic Torn Parchment Card Container */}
                <div
                  className="w-full relative px-5 pt-8 pb-7 sm:px-6 sm:pt-9 sm:pb-8 flex flex-col items-center justify-between"
                  style={{
                    backgroundImage: `url('/images/wanted/poster_parchment_clean.png')`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  {/* Paper Fold Crease Overlay */}
                  <div
                    className="absolute inset-4 pointer-events-none opacity-35 mix-blend-multiply z-10"
                    style={{
                      backgroundImage: `url('/images/wanted/paper_fold_crease.png')`,
                      backgroundSize: "cover",
                    }}
                  />

                  {/* Corner Filigrees in 4 Inner Corners */}
                  <div className="absolute top-6 left-4 w-7 h-7 pointer-events-none opacity-80 z-10">
                    <Image src="/images/wanted/ornate_corner_filigree_clean.png" alt="" width={28} height={28} />
                  </div>
                  <div className="absolute top-6 right-4 w-7 h-7 pointer-events-none opacity-80 z-10 rotate-90">
                    <Image src="/images/wanted/ornate_corner_filigree_clean.png" alt="" width={28} height={28} />
                  </div>
                  <div className="absolute bottom-5 left-4 w-7 h-7 pointer-events-none opacity-80 z-10 -rotate-90">
                    <Image src="/images/wanted/ornate_corner_filigree_clean.png" alt="" width={28} height={28} />
                  </div>
                  <div className="absolute bottom-5 right-4 w-7 h-7 pointer-events-none opacity-80 z-10 rotate-180">
                    <Image src="/images/wanted/ornate_corner_filigree_clean.png" alt="" width={28} height={28} />
                  </div>

                  {/* 3. Ornate Victorian Engraved Header Banner */}
                  <div className="relative z-20 w-full flex flex-col items-center pt-2 sm:pt-2.5">
                    <div className="w-[88%] h-auto drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                      <Image
                        src="/images/wanted/ornate_wanted_banner_clean.png"
                        alt="Wanted Dead or Alive"
                        width={280}
                        height={90}
                        className="w-full h-auto object-contain"
                        priority={isRank1}
                      />
                    </div>
                  </div>

                  {/* 4. Center Outlaw Portrait / Team Profile Box */}
                  <div className="relative z-20 w-[80%] aspect-square my-2.5 sm:my-3 border-2 sm:border-3 border-[#30160a] bg-[#231208] shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),0_3px_8px_rgba(0,0,0,0.4)] overflow-hidden group-hover:border-[#6d3919] transition-colors">
                    {team.avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={team.avatarUrl}
                        alt={`Profile picture of ${team.teamName}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e0f06] relative overflow-hidden group-hover:bg-[#251308] transition-colors p-3">
                        {/* Subtle Background Nautical Compass */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
                          <Image
                            src="/images/hunt/decor/ink_compass_rose.png"
                            alt=""
                            width={140}
                            height={140}
                            className="w-28 h-28 object-contain"
                          />
                        </div>

                        {/* Team Monogram Crest */}
                        <div className="relative z-10 w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-[#b8860b]/60 bg-gradient-to-b from-[#3a1d0d] to-[#140803] flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,215,0,0.2)]">
                          <span className="font-[family-name:var(--font-pirata-one)] text-2xl sm:text-3xl font-black text-[#edd29b] tracking-wider drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                            {getTeamInitials(team.teamName)}
                          </span>
                        </div>

                        <span className="relative z-10 font-[family-name:var(--font-cinzel-decorative)] text-[#a37946] text-[8px] sm:text-[9px] font-black uppercase tracking-widest mt-2">
                          Flag Unset
                        </span>
                      </div>
                    )}

                    {/* Hover Ribbon Overlay */}
                    {canClick && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                        <span className="font-[family-name:var(--font-cinzel-decorative)] text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#241209] bg-[#f2dfb1] px-3 py-1 rounded shadow-lg border border-[#854d24]">
                          View Stats
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 5. Outlaw Name */}
                  <div className="relative z-20 w-full text-center px-1">
                    <h3 className="font-[family-name:var(--font-pirata-one)] text-[#180a04] text-2xl sm:text-3xl font-black leading-tight truncate drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
                      {team.teamName}
                    </h3>
                  </div>

                  {/* 6. Batch / Fleet Division Tag */}
                  <div className="relative z-20 my-1 flex justify-center">
                    <span className="font-mono font-bold text-[10px] sm:text-xs uppercase tracking-wider text-[#3d1e0d] border-t border-b border-[#3d1e0d]/40 px-2 py-0.5">
                      {team.batchTier === "FIRST_YEAR" ? "1st Year '26" : "Senior Fleet"}
                    </span>
                  </div>

                  {/* 7. Bounty Reward Section */}
                  <div className="relative z-20 w-full text-center pb-2">
                    <p className="font-[family-name:var(--font-cinzel-decorative)] text-[#3d1e0d] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">
                      Bounty Reward
                    </p>
                    <p className="font-[family-name:var(--font-pirata-one)] text-[#8b1800] text-3xl sm:text-4xl font-black leading-none tracking-wide drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)] mt-0.5">
                      ฿ {team.score.toLocaleString()}
                    </p>
                    {showQuestionsSolved && (
                      <p className="text-[9px] sm:text-[10px] font-mono text-[#522710] font-semibold mt-0.5">
                        {team.puzzlesSolved} Conquered Quests
                      </p>
                    )}
                  </div>

                  {/* 8. Official Red Wax Seal Firmly Pressed onto Rank 1 Paper Margin */}
                  {isRank1 && (
                    <div className="absolute bottom-3 right-2 w-14 sm:w-16 h-14 sm:h-16 z-30 pointer-events-none drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]">
                      <Image
                        src="/images/wanted/ephemera/wax_seal_clean.png"
                        alt="Official Admiralty Seal"
                        width={64}
                        height={64}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* 9. Authentic Engraved Metal Docket Plaque replacing modern badges */}
                  <div className="absolute -bottom-4 sm:-bottom-5 left-1/2 -translate-x-1/2 z-30 w-36 sm:w-44 pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] transition-transform group-hover:scale-105">
                    <Image
                      src={`/images/wanted/badges/plaque_rank_${team.rank}.png`}
                      alt={`Rank ${team.rank} Plaque`}
                      width={284}
                      height={86}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Next 2 Ranks Row (Rank 4 and Rank 5) */}
        {next2.length > 0 && (
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 sm:gap-10 mt-2 sm:mt-4 w-full">
            {next2.map((team) => {
              return (
                <motion.div
                  key={team.teamId}
                  variants={item}
                  onClick={canClick ? () => onTeamClick?.(team) : undefined}
                  role={canClick ? "button" : undefined}
                  tabIndex={canClick ? 0 : undefined}
                  aria-label={
                    canClick
                      ? `View stats for Rank ${team.rank} team ${team.teamName}`
                      : `Rank ${team.rank} team ${team.teamName}`
                  }
                  onKeyDown={
                    canClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onTeamClick?.(team);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "relative group transition-all duration-300 rounded-sm w-[245px] sm:w-[270px] z-10 drop-shadow-[0_12px_25px_rgba(0,0,0,0.85)]",
                    canClick && "cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400",
                    getPosterTilt(team.rank),
                    canClick && "hover:rotate-0 hover:scale-105 hover:z-20"
                  )}
                >
                  {/* Real Circular Rusty Nail Head with Visible Paper Margin Above */}
                  <div className="absolute top-4.5 sm:top-5 left-1/2 -translate-x-1/2 z-40 w-5 h-5 sm:w-6 sm:h-6 pointer-events-none drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)]">
                    <Image
                      src="/images/wanted/rusty_nail_head.png"
                      alt="Forged Circular Iron Nail"
                      width={24}
                      height={24}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Authentic Torn Parchment Card */}
                  <div
                    className="w-full relative px-4 pt-7 pb-6 sm:px-5 sm:pt-8 sm:pb-7 flex flex-col items-center justify-between"
                    style={{
                      backgroundImage: `url('/images/wanted/poster_parchment_clean.png')`,
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    {/* Paper Fold Crease Overlay */}
                    <div
                      className="absolute inset-3 pointer-events-none opacity-30 mix-blend-multiply z-10"
                      style={{
                        backgroundImage: `url('/images/wanted/paper_fold_crease.png')`,
                        backgroundSize: "cover",
                      }}
                    />

                    {/* Corner Filigrees */}
                    <div className="absolute top-5 left-3.5 w-6 h-6 pointer-events-none opacity-75 z-10">
                      <Image src="/images/wanted/ornate_corner_filigree_clean.png" alt="" width={24} height={24} />
                    </div>
                    <div className="absolute top-5 right-3.5 w-6 h-6 pointer-events-none opacity-75 z-10 rotate-90">
                      <Image src="/images/wanted/ornate_corner_filigree_clean.png" alt="" width={24} height={24} />
                    </div>
                    <div className="absolute bottom-4 left-3.5 w-6 h-6 pointer-events-none opacity-75 z-10 -rotate-90">
                      <Image src="/images/wanted/ornate_corner_filigree_clean.png" alt="" width={24} height={24} />
                    </div>
                    <div className="absolute bottom-4 right-3.5 w-6 h-6 pointer-events-none opacity-75 z-10 rotate-180">
                      <Image src="/images/wanted/ornate_corner_filigree_clean.png" alt="" width={24} height={24} />
                    </div>

                    {/* Ornate Engraved Banner */}
                    <div className="relative z-20 w-full flex flex-col items-center pt-1">
                      <div className="w-[85%] h-auto">
                        <Image
                          src="/images/wanted/ornate_wanted_banner_clean.png"
                          alt="Wanted Dead or Alive"
                          width={240}
                          height={80}
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    </div>

                    {/* Outlaw Portrait / Team Profile Box */}
                    <div className="relative z-20 w-[78%] aspect-square my-2 border-2 border-[#30160a] bg-[#231208] shadow-[inset_0_2px_5px_rgba(0,0,0,0.8),0_2px_6px_rgba(0,0,0,0.4)] overflow-hidden group-hover:border-[#6d3919] transition-colors">
                      {team.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={team.avatarUrl}
                          alt={`Profile picture of ${team.teamName}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e0f06] relative overflow-hidden group-hover:bg-[#251308] transition-colors p-2">
                          <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
                            <Image
                              src="/images/hunt/decor/ink_compass_rose.png"
                              alt=""
                              width={120}
                              height={120}
                              className="w-24 h-24 object-contain"
                            />
                          </div>
                          <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#b8860b]/60 bg-gradient-to-b from-[#3a1d0d] to-[#140803] flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                            <span className="font-[family-name:var(--font-pirata-one)] text-xl sm:text-2xl font-black text-[#edd29b] tracking-wider drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                              {getTeamInitials(team.teamName)}
                            </span>
                          </div>
                          <span className="relative z-10 font-[family-name:var(--font-cinzel-decorative)] text-[#a37946] text-[7px] sm:text-[8px] font-black uppercase tracking-widest mt-1.5">
                            Flag Unset
                          </span>
                        </div>
                      )}
                      {canClick && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                          <span className="font-[family-name:var(--font-cinzel-decorative)] text-[9px] font-black uppercase tracking-widest text-[#241209] bg-[#f2dfb1] px-2.5 py-0.5 rounded shadow border border-[#854d24]">
                            View Stats
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Outlaw Name */}
                    <div className="relative z-20 w-full text-center px-1">
                      <h3 className="font-[family-name:var(--font-pirata-one)] text-[#180a04] text-xl sm:text-2xl font-black leading-tight truncate drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
                        {team.teamName}
                      </h3>
                    </div>

                    {/* Batch Tier */}
                    <div className="relative z-20 my-0.5 flex justify-center">
                      <span className="font-mono font-bold text-[9px] sm:text-[10px] uppercase tracking-wider text-[#3d1e0d] border-t border-b border-[#3d1e0d]/30 px-2 py-0.5">
                        {team.batchTier === "FIRST_YEAR" ? "1st Year '26" : "Senior Fleet"}
                      </span>
                    </div>

                    {/* Bounty Reward */}
                    <div className="relative z-20 w-full text-center pb-2">
                      <p className="font-[family-name:var(--font-cinzel-decorative)] text-[#3d1e0d] text-[9px] font-black uppercase tracking-[0.2em]">
                        Bounty Reward
                      </p>
                      <p className="font-[family-name:var(--font-pirata-one)] text-[#8b1800] text-2xl sm:text-3xl font-black leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)] mt-0.5">
                        ฿ {team.score.toLocaleString()}
                      </p>
                      {showQuestionsSolved && (
                        <p className="text-[8px] sm:text-[9px] font-mono text-[#522710] font-semibold mt-0.5">
                          {team.puzzlesSolved} Conquered Quests
                        </p>
                      )}
                    </div>

                    {/* Authentic Engraved Metal Docket Plaque */}
                    <div className="absolute -bottom-3.5 sm:-bottom-4 left-1/2 -translate-x-1/2 z-30 w-32 sm:w-36 pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] transition-transform group-hover:scale-105">
                      <Image
                        src={`/images/wanted/badges/plaque_rank_${team.rank}.png`}
                        alt={`Rank ${team.rank} Plaque`}
                        width={284}
                        height={86}
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
