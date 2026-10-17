"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  Coins,
  Compass,
} from "lucide-react";
import { LandmarkData } from "./UnrollingScrollModal";
import { CAMPAIGN_REALMS, RealmConfig } from "@/lib/hunt/realmsRegistry";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface RealmSlideMapProps {
  landmarks: LandmarkData[];
  onSelectLandmark: (landmark: LandmarkData) => void;
  teamName?: string;
  bountyPoints?: number;
}

export default function RealmSlideMap({
  landmarks,
  onSelectLandmark,
  teamName,
  bountyPoints = 0,
}: RealmSlideMapProps) {
  // Find which realm the active landmark is located in
  const isAllCleared = landmarks.length > 0 && landmarks.every((l) => l.isSolved);
  const activeLandmark = landmarks.find((l) => l.isActive);
  const lastSolvedLandmark = [...landmarks].reverse().find((l) => l.isSolved);
  const targetLandmark = activeLandmark || lastSolvedLandmark;
  const initialRealmIndex = Math.max(
    0,
    CAMPAIGN_REALMS.findIndex(
      (r) =>
        r.id === targetLandmark?.realmId ||
        r.puzzles.some((p) => targetLandmark?.id === `realm-${r.id}-stage-${p.orderIndex}`)
    )
  );

  const [currentRealmIndex, setCurrentRealmIndex] = useState(
    initialRealmIndex !== -1 ? initialRealmIndex : 0
  );

  const [isLeftHovered, setIsLeftHovered] = useState(false);
  const [isRightHovered, setIsRightHovered] = useState(false);
  const [gateBlockedNotice, setGateBlockedNotice] = useState<string | null>(null);

  const currentRealm: RealmConfig = CAMPAIGN_REALMS[currentRealmIndex] || CAMPAIGN_REALMS[0];

  // Helper to reliably determine stage index within the realm
  const getStageOrder = (l: LandmarkData): number => {
    if (typeof l.realmOrderIndex === "number") return l.realmOrderIndex;
    const matchId = l.id.match(/-stage-(\d+)$/);
    if (matchId) return parseInt(matchId[1], 10);
    const matchKey = l.waypointKey?.match(/-p(\d+)$/);
    if (matchKey) return parseInt(matchKey[1], 10);
    return l.orderIndex;
  };

  // Active ladder landmarks present in the current realm
  const currentRealmLadders = landmarks.filter(
    (l) =>
      l.realmId === currentRealm.id ||
      l.id.startsWith(`realm-${currentRealm.id}-stage-`) ||
      (l.waypointKey && l.waypointKey.startsWith(`r${currentRealm.id}-`))
  );

  // Strict gating check: Are ALL active stages in the current realm solved?
  const allCurrentStagesSolved =
    currentRealmLadders.length > 0 && currentRealmLadders.every((l) => l.isSolved);

  // Sync realm index when active landmark changes
  const [prevActiveId, setPrevActiveId] = useState(activeLandmark?.id);
  if (prevActiveId !== activeLandmark?.id) {
    setPrevActiveId(activeLandmark?.id);
    const target = activeLandmark || lastSolvedLandmark;
    const targetRealm = CAMPAIGN_REALMS.findIndex(
      (r) =>
        r.id === target?.realmId ||
        r.puzzles.some((p) => target?.id === `realm-${r.id}-stage-${p.orderIndex}`)
    );
    if (targetRealm !== -1) {
      setCurrentRealmIndex(targetRealm);
    }
  }

  const handlePrev = () => {
    if (currentRealmIndex > 0) {
      setCurrentRealmIndex((prev) => prev - 1);
      setGateBlockedNotice(null);
    }
  };

  const handleNext = () => {
    if (currentRealmIndex >= CAMPAIGN_REALMS.length - 1) return;

    // Strict gating rule: Can only go forward if current realm is 100% conquered
    if (!allCurrentStagesSolved) {
      setGateBlockedNotice(
        `Veiled by Ancient Mists! Breach all waypoints in ${currentRealm.title} to chart forward.`
      );
      setTimeout(() => setGateBlockedNotice(null), 5000);
      return;
    }

    setCurrentRealmIndex((prev) => prev + 1);
    setGateBlockedNotice(null);
  };

  const prevRealm = currentRealmIndex > 0 ? CAMPAIGN_REALMS[currentRealmIndex - 1] : null;
  const nextRealm =
    currentRealmIndex < CAMPAIGN_REALMS.length - 1 ? CAMPAIGN_REALMS[currentRealmIndex + 1] : null;

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border-4 border-[#3e2111] bg-[#120703] shadow-[0_25px_60px_rgba(0,0,0,0.95)]">
      {/* 1. TOP REALM STRIP: CLEAN INTEGRATED TELEMETRY */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6 bg-gradient-to-b from-[#180b04]/95 via-[#120703]/90 to-transparent border-b border-[#522912] backdrop-blur-md">
        {/* Left: Chapter Title & Subtitle */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-widest text-[#d4af37] bg-[#d4af37]/15 px-3 py-1 rounded-full border border-[#d4af37]/40 shadow-sm">
            {currentRealm.title}
          </span>
          <span className="text-white/30 text-xs hidden sm:inline">•</span>
          <span className="text-xs font-serif font-bold text-amber-200/90 hidden md:inline">
            {currentRealm.subtitle}
          </span>
        </div>

        {/* Center: Team & Score */}
        {teamName && (
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1 rounded-xl bg-[#201007]/90 border border-[#5a2e16] shadow-inner">
            <span className="font-serif font-bold text-xs text-[#fed7aa] tracking-wide">
              {teamName}
            </span>
            <span className="text-amber-600">•</span>
            <div className="flex items-center gap-1 font-mono font-bold text-xs text-yellow-300">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span>{bountyPoints.toLocaleString()} PTS</span>
            </div>
          </div>
        )}

        {/* Right: Realm Breached Count & Cleared Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-amber-300 font-bold bg-[#291409] px-2.5 py-1 rounded-md border border-amber-600/40">
            {currentRealmLadders.filter((l) => l.isSolved).length} /{" "}
            {currentRealmLadders.length} Breached
          </span>
          {allCurrentStagesSolved && (
            <span className="text-[10px] font-mono text-emerald-400 font-black flex items-center gap-1 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-600/50">
              <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
            </span>
          )}
        </div>
      </div>

      {/* GATE BLOCKED WARNING BANNER */}
      <AnimatePresence>
        {gateBlockedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-gradient-to-r from-red-950/95 via-rose-900/95 to-red-950/95 border-2 border-red-500/80 text-amber-100 font-serif text-xs font-bold shadow-2xl flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{gateBlockedNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. THE 16:9 WIDESCREEN REALM SLIDE CANVAS */}
      <div
        className="relative w-full aspect-[16/9] min-h-[460px] sm:min-h-[580px] overflow-hidden select-none"
        onMouseLeave={() => {
          setIsLeftHovered(false);
          setIsRightHovered(false);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRealm.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute inset-0 overflow-hidden"
          >
            <Image
              src={currentRealm.image}
              alt={currentRealm.title}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              quality={85}
              className="object-cover object-center select-none pointer-events-none"
            />
            {/* Ambient Sepia Vignette & Edge Shadow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#140a05]/20 via-transparent to-[#140a05]/35 pointer-events-none z-5" />
            <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(15,7,3,0.7)] pointer-events-none z-5" />

            {/* TERRAIN-CONFORMING EXPEDITION TRAILS (Authored by subagents to hug roads/switchbacks/bridges) */}
            <svg
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            >
              <defs>
                <filter id="trailGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {currentRealm.pathSegments?.map((segment, i) => {
                // Find preceding active ladder landmark at or before fromIndex
                const precedingLandmark = [...currentRealmLadders]
                  .filter((l) => getStageOrder(l) <= segment.fromIndex)
                  .pop();

                const isCleared = precedingLandmark ? precedingLandmark.isSolved : false;

                // STRICT EXPEDITION RULE: Only draw trail once the starting node is breached!
                if (!isCleared) return null;

                // STOP TRAIL FLOW: If there are no active puzzles left on this map at or after toIndex,
                // do not draw the trail forward into omitted or non-existent waypoints!
                const succeedingLandmark = currentRealmLadders.find(
                  (l) => getStageOrder(l) >= segment.toIndex
                );
                if (!succeedingLandmark) return null;

                return (
                  <g key={`trail-seg-${currentRealm.id}-${i}`}>
                    {/* Shadow Outline for high-contrast visibility against map terrain */}
                    <path
                      d={segment.d}
                      fill="none"
                      stroke="#0d0603"
                      strokeWidth="7.5"
                      strokeDasharray="10 12"
                      strokeLinecap="round"
                      opacity="0.85"
                      vectorEffect="non-scaling-stroke"
                    />
                    {/* Conquered Crimson Trail */}
                    <path
                      d={segment.d}
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="4.5"
                      strokeDasharray="10 12"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      filter="url(#trailGlow)"
                    />
                    {/* Inner Golden Stitching */}
                    <path
                      d={segment.d}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2"
                      strokeDasharray="4 18"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              })}
            </svg>

            {/* CHECKPOINT MILESTONE NODES PLACED ON NATURAL MAP LANDMARKS */}
            {currentRealm.puzzles.map((puzzle, i) => {
              const landmark = landmarks.find(
                (l) =>
                  (l.realmId === currentRealm.id && l.realmOrderIndex === puzzle.orderIndex) ||
                  l.id === `realm-${currentRealm.id}-stage-${puzzle.orderIndex}` ||
                  (l.waypointKey && l.waypointKey === `r${currentRealm.id}-p${puzzle.orderIndex}`)
              );
              const coord = currentRealm.nodeCoords[i] || {
                x: puzzle.coord.x,
                y: puzzle.coord.y,
                landmarkName: puzzle.landmarkName,
                titlePosition: puzzle.titlePosition || "bottom",
              };
              const isExcluded = !landmark; // Bypassed waypoint
              // If waypoint is omitted by admin, do not render any marker or remains on map
              if (isExcluded) return null;

              const isCleared = landmark?.isSolved;
              const isActive = landmark?.isActive;
              const isLocked = landmark ? landmark.isLocked : true;

              // When all waypoints are conquered, only show the crew badge on the final milestone
              const isFinalMilestone = Boolean(
                isAllCleared &&
                  landmark &&
                  landmarks.length > 0 &&
                  landmark.orderIndex === landmarks[landmarks.length - 1]?.orderIndex
              );
              const showCrewBadge = Boolean(isActive || isFinalMilestone);

              return (
                <div
                  key={`waypoint-${currentRealm.id}-${puzzle.orderIndex}`}
                  onClick={() => {
                    if (landmark && !isLocked) onSelectLandmark(landmark);
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group select-none ${
                    isExcluded
                      ? "cursor-default opacity-50"
                      : isLocked
                      ? "cursor-not-allowed opacity-85"
                      : "cursor-pointer"
                  }`}
                  style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                >
                  {/* ANGRY BIRDS-STYLE ADVENTURER / CREW HOPPING PIN */}
                  {showCrewBadge && (
                    <motion.div
                      animate={{
                        y: [-14, 0, -14],
                        scale: [1.12, 1, 1.12],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.8,
                        ease: "easeInOut",
                      }}
                      className="absolute -top-16 z-30 flex flex-col items-center pointer-events-none"
                    >
                      {/* Stylized Pirate Captain Tricorn Badge */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f59e0b] via-[#b45309] to-[#78350f] border-2 border-yellow-300 shadow-[0_10px_25px_rgba(0,0,0,0.9),0_0_18px_#f59e0b] flex items-center justify-center p-1.5 transform hover:scale-110 transition-transform">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="w-7 h-7 text-yellow-100 drop-shadow"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {/* Captain Tricorn Hat */}
                          <path d="M3 13c1.5-2 4-3 6.5-3s5 1 6.5 3" />
                          <path d="M4 10.5l7.5-6.5 7.5 6.5" />
                          {/* Face with Eyepatch */}
                          <circle cx="11.5" cy="15" r="3.5" fill="#fef08a" stroke="#854d0e" strokeWidth="1.5" />
                          <circle cx="10" cy="14.5" r="0.8" fill="#713f12" />
                          <path d="M12.5 13.5l1.5 2" stroke="#713f12" strokeWidth="1.5" />
                        </svg>
                      </div>
                      {/* Downward Pointer Triangle */}
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-yellow-300 -mt-0.5" />
                      <span
                        className={`px-2.5 py-0.5 rounded-full ${
                          isFinalMilestone
                            ? "bg-emerald-400 text-black font-black"
                            : "bg-amber-500 text-black font-black"
                        } text-[9px] font-mono shadow mt-0.5 uppercase tracking-wider`}
                      >
                        {isFinalMilestone ? "CONQUERED" : "CREW HERE"}
                      </span>
                    </motion.div>
                  )}

                  {/* 3D NODE ASSET RENDERING */}
                  {isExcluded ? (
                    /* DORMANT / PASSED-THROUGH WAYPOINT MARKER */
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-dashed border-amber-600/50 bg-[#160a04]/80 flex items-center justify-center shadow-inner">
                        <Compass className="w-4 h-4 text-amber-500/60" />
                      </div>
                    </div>
                  ) : isCleared ? (
                    /* 3D Solved Scroll with Emerald Wax Seal */
                    <div className="relative w-28 h-18 sm:w-32 sm:h-20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/hunt/scroll_node_solved.webp"
                        alt={`Breached: ${landmark.title}`}
                        className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]"
                      />
                    </div>
                  ) : isActive ? (
                    /* 3D Active Checkpoint Medallion */
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {/* Pulsing Beacon Halo */}
                      <div className="absolute -inset-3 rounded-full bg-amber-500/40 blur-md animate-pulse" />
                      {/* Gilded Border Medallion */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#3b1d0c] via-[#241005] to-[#120703] border-3 border-yellow-300 shadow-[0_0_20px_rgba(251,191,36,0.6)] flex flex-col items-center justify-center p-1 text-center">
                        <Sparkles className="w-4 h-4 text-yellow-300 animate-bounce" />
                        <span className="font-serif font-black text-[11px] text-[#fff6df] leading-tight mt-0.5">
                          Level #{landmark.orderIndex}
                        </span>
                        <span className="text-[8px] font-mono font-bold text-amber-300">
                          {landmark.bountyPoints} PTS
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* 3D Iron-Chained Padlock Scroll */
                    <div className="relative w-28 h-18 sm:w-32 sm:h-20 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/hunt/scroll_node_locked.webp"
                        alt={`Locked: ${landmark.title}`}
                        className="w-full h-full object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.6)]"
                      />
                    </div>
                  )}

                  {/* CONFIGURABLE DIRECTIONAL TOOLTIP LABEL (NEVER BLOCKS WAYPOINT) */}
                  <div
                    className={cn(
                      "px-2.5 py-1 rounded-xl bg-[#1c0d05]/95 border border-[#633318] text-center shadow-2xl max-w-[140px] sm:max-w-[170px] pointer-events-none transition-all duration-200 z-30",
                      coord.titlePosition === "top" && "absolute bottom-full mb-2 left-1/2 -translate-x-1/2",
                      (coord.titlePosition === "bottom" || !coord.titlePosition) && "absolute top-full mt-2 left-1/2 -translate-x-1/2",
                      coord.titlePosition === "left" && "absolute right-full mr-3 top-1/2 -translate-y-1/2",
                      coord.titlePosition === "right" && "absolute left-full ml-3 top-1/2 -translate-y-1/2"
                    )}
                  >
                    <span className="text-[8px] sm:text-[9px] font-mono uppercase text-[#e2a249] font-bold block truncate">
                      {coord.landmarkName}
                    </span>
                    <span className="font-serif font-black text-xs text-[#fdf5e4] block truncate leading-tight">
                      {isExcluded ? puzzle.title : landmark.title}
                    </span>
                    {isExcluded ? (
                      <span className="text-[9px] font-mono text-stone-500 font-bold block">
                        PASSED THROUGH
                      </span>
                    ) : isCleared ? (
                      <span className="text-[9px] font-mono text-emerald-400 font-extrabold block">
                        BREACHED ✓
                      </span>
                    ) : isActive ? (
                      <span className="text-[9px] font-mono text-amber-400 font-extrabold flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        ACTIVE STAGE
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-stone-400 font-bold block">
                        SEALED 🔒
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* 3. DYNAMIC EDGE HOVER NAVIGATION ARROWS */}

        {/* LEFT EDGE HOVER ZONE & ARROW */}
        {prevRealm && (
          <div
            className="absolute top-0 bottom-0 left-0 w-20 sm:w-28 z-30 flex items-center pl-2 sm:pl-4 transition-all"
            onMouseEnter={() => setIsLeftHovered(true)}
            onMouseLeave={() => setIsLeftHovered(false)}
          >
            <motion.button
              onClick={handlePrev}
              animate={{
                opacity: isLeftHovered ? 1 : 0.35,
                x: isLeftHovered ? 0 : -8,
                scale: isLeftHovered ? 1.08 : 1,
              }}
              transition={{ duration: 0.25 }}
              className="relative p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#2a1307] to-[#1a0a03] border-2 border-amber-600/70 text-amber-200 shadow-[0_0_20px_rgba(0,0,0,0.8),0_0_12px_rgba(245,158,11,0.3)] hover:border-amber-400 cursor-pointer flex items-center gap-2 group"
              title={`Return to ${prevRealm.title}`}
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 group-hover:-translate-x-1 transition-transform" />
              {isLeftHovered && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hidden md:flex flex-col text-left whitespace-nowrap pr-2"
                >
                  <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                    Previous Realm
                  </span>
                  <span className="font-serif font-black text-xs text-amber-100">
                    {prevRealm.title.split(":")[1]?.trim() || prevRealm.title}
                  </span>
                </motion.div>
              )}
            </motion.button>
          </div>
        )}

        {/* RIGHT EDGE HOVER ZONE & ARROW */}
        {nextRealm && (
          <div
            className="absolute top-0 bottom-0 right-0 w-20 sm:w-28 z-30 flex items-center justify-end pr-2 sm:pr-4 transition-all"
            onMouseEnter={() => setIsRightHovered(true)}
            onMouseLeave={() => setIsRightHovered(false)}
          >
            <motion.button
              onClick={handleNext}
              animate={{
                opacity: isRightHovered ? 1 : 0.35,
                x: isRightHovered ? 0 : 8,
                scale: isRightHovered ? 1.08 : 1,
              }}
              transition={{ duration: 0.25 }}
              className={`relative p-2.5 sm:p-3.5 rounded-2xl border-2 shadow-[0_0_20px_rgba(0,0,0,0.8)] cursor-pointer flex items-center gap-2 group ${
                allCurrentStagesSolved
                  ? "bg-gradient-to-l from-[#2a1307] to-[#1a0a03] border-emerald-500/80 text-emerald-200 hover:border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                  : "bg-gradient-to-l from-[#1f0e06] to-[#100703] border-amber-800/60 text-stone-400"
              }`}
              title={
                allCurrentStagesSolved
                  ? `Advance to ${nextRealm.title}`
                  : `Locked: Breach all waypoints in ${currentRealm.title} first`
              }
            >
              {isRightHovered && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hidden md:flex flex-col text-right whitespace-nowrap pl-2"
                >
                  <span
                    className={`text-[9px] font-mono uppercase tracking-widest font-bold ${
                      allCurrentStagesSolved ? "text-emerald-400" : "text-amber-500/80"
                    }`}
                  >
                    {allCurrentStagesSolved ? "Advance Realm" : "Veiled by Mist"}
                  </span>
                  <span className="font-serif font-black text-xs text-amber-100">
                    {allCurrentStagesSolved
                      ? nextRealm.title.split(":")[1]?.trim() || nextRealm.title
                      : "Waypoints Incomplete"}
                  </span>
                </motion.div>
              )}

              {allCurrentStagesSolved ? (
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              ) : (
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500/80" />
              )}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
