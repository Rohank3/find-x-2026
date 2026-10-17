"use client";

import React, { useState, useRef, useMemo } from "react";
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
  Scroll,
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
  // Dynamically filter realms to only those containing at least one waypoint in the active campaign ladder
  const activeCampaignRealms: RealmConfig[] = useMemo(() => {
    const realmIdsWithLandmarks = new Set(
      landmarks.map((l) => {
        const match = l.id.match(/^realm-(\d+)-stage-/);
        return l.realmId ?? (match ? parseInt(match[1], 10) : 1);
      })
    );
    const filtered = CAMPAIGN_REALMS.filter((r) => realmIdsWithLandmarks.has(r.id));
    return filtered.length > 0 ? filtered : CAMPAIGN_REALMS.slice(0, 1);
  }, [landmarks]);

  // Find which realm the active landmark is located in
  const isAllCleared = landmarks.length > 0 && landmarks.every((l) => l.isSolved);
  const activeLandmark = landmarks.find((l) => l.isActive);
  const lastSolvedLandmark = [...landmarks].reverse().find((l) => l.isSolved);
  const targetLandmark = activeLandmark || lastSolvedLandmark;
  const targetRealmIdx = activeCampaignRealms.findIndex(
    (r) =>
      r.id === targetLandmark?.realmId ||
      r.puzzles.some((p) => targetLandmark?.id === `realm-${r.id}-stage-${p.orderIndex}`)
  );
  const initialRealmIndex = targetRealmIdx !== -1 ? targetRealmIdx : 0;

  const [currentRealmIndex, setCurrentRealmIndex] = useState(initialRealmIndex);

  // Guard against any out-of-bounds index
  const safeRealmIndex = Math.min(
    Math.max(0, currentRealmIndex),
    activeCampaignRealms.length - 1
  );

  const [gateBlockedNotice, setGateBlockedNotice] = useState<string | null>(null);

  // Mobile selected waypoint state
  const [selectedMobileLandmarkId, setSelectedMobileLandmarkId] = useState<string | null>(
    activeLandmark?.id || landmarks[0]?.id || null
  );

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const currentRealm: RealmConfig =
    activeCampaignRealms[safeRealmIndex] || activeCampaignRealms[0];

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

  // Active or selected landmark in current realm for mobile/tablet HUD card
  const selectedOrActiveLandmark =
    currentRealmLadders.find((l) => l.id === selectedMobileLandmarkId) ||
    currentRealmLadders.find((l) => l.isActive) ||
    currentRealmLadders[0] ||
    null;

  const selectedLandmarkCoord = currentRealm.nodeCoords.find((c, idx) => {
    const p = currentRealm.puzzles[idx];
    return (
      p &&
      (p.orderIndex === selectedOrActiveLandmark?.realmOrderIndex ||
        `realm-${currentRealm.id}-stage-${p.orderIndex}` === selectedOrActiveLandmark?.id ||
        (selectedOrActiveLandmark?.waypointKey &&
          selectedOrActiveLandmark.waypointKey === `r${currentRealm.id}-p${p.orderIndex}`))
    );
  });

  const selectedLandmarkName =
    selectedOrActiveLandmark?.landmarkName ||
    selectedLandmarkCoord?.landmarkName ||
    `Waypoint #${selectedOrActiveLandmark?.orderIndex ?? 1}`;

  // Sync realm index when active landmark changes
  const [prevActiveId, setPrevActiveId] = useState(activeLandmark?.id);
  if (prevActiveId !== activeLandmark?.id) {
    setPrevActiveId(activeLandmark?.id);
    const target = activeLandmark || lastSolvedLandmark;
    const targetRealm = activeCampaignRealms.findIndex(
      (r) =>
        r.id === target?.realmId ||
        r.puzzles.some((p) => target?.id === `realm-${r.id}-stage-${p.orderIndex}`)
    );
    if (targetRealm !== -1) {
      setCurrentRealmIndex(targetRealm);
    }
  }

  const handlePrev = () => {
    if (safeRealmIndex > 0) {
      setCurrentRealmIndex((prev) => Math.max(0, prev - 1));
      setGateBlockedNotice(null);
    }
  };

  const handleNext = () => {
    if (safeRealmIndex >= activeCampaignRealms.length - 1) return;

    // Strict gating rule: Can only go forward if current realm is 100% conquered
    if (!allCurrentStagesSolved) {
      setGateBlockedNotice(
        `Veiled by Ancient Mists! Breach all waypoints in ${currentRealm.title} to chart forward.`
      );
      setTimeout(() => setGateBlockedNotice(null), 5000);
      return;
    }

    setCurrentRealmIndex((prev) => Math.min(prev + 1, activeCampaignRealms.length - 1));
    setGateBlockedNotice(null);
  };

  // Mobile Touch Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Horizontal swipe threshold (40px) and ensure horizontal intent
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const prevRealm = safeRealmIndex > 0 ? activeCampaignRealms[safeRealmIndex - 1] : null;
  const nextRealm =
    safeRealmIndex < activeCampaignRealms.length - 1
      ? activeCampaignRealms[safeRealmIndex + 1]
      : null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-[#3e2111] bg-[#120703] shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
      {/* 1. TOP REALM STRIP: CLEAN INTEGRATED TELEMETRY */}
      <div className="relative z-30 flex items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-b from-[#180b04]/95 via-[#120703]/90 to-transparent border-b border-[#522912] backdrop-blur-md">
        {/* Left: Chapter Title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider text-[#d4af37] bg-[#d4af37]/15 px-2.5 py-1 rounded-full border border-[#d4af37]/40 shadow-sm truncate">
            <span className="sm:hidden">Ch. {currentRealm.id}: {currentRealm.title.split(":")[1]?.trim() || currentRealm.title}</span>
            <span className="hidden sm:inline">{currentRealm.title}</span>
          </span>
          <span className="text-white/30 text-xs hidden sm:inline">•</span>
          <span className="text-xs font-serif font-bold text-amber-200/90 hidden md:inline truncate">
            {currentRealm.subtitle}
          </span>
        </div>

        {/* Center: Team & Score (Visible on all viewports) */}
        {teamName && (
          <div className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3 py-1 rounded-xl bg-[#201007]/90 border border-[#5a2e16] shadow-inner shrink-0">
            <span className="font-serif font-bold text-[11px] sm:text-xs text-[#fed7aa] tracking-wide hidden sm:inline">
              {teamName}
            </span>
            <span className="text-amber-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-1 font-mono font-bold text-[11px] sm:text-xs text-yellow-300">
              <Coins className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span>{bountyPoints.toLocaleString()} PTS</span>
            </div>
          </div>
        )}

        {/* Right: Realm Breached Count & Cleared Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="text-[9px] sm:text-[10px] font-mono text-amber-300 font-bold bg-[#291409] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-amber-600/40">
            {currentRealmLadders.filter((l) => l.isSolved).length}/{currentRealmLadders.length} Breached
          </span>
          {allCurrentStagesSolved && (
            <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 font-black flex items-center gap-1 bg-emerald-950/70 px-1.5 py-0.5 sm:px-2 rounded border border-emerald-600/50">
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="hidden xs:inline">Cleared</span>
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
            className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-gradient-to-r from-red-950/95 via-rose-900/95 to-red-950/95 border-2 border-red-500/80 text-amber-100 font-serif text-[11px] sm:text-xs font-bold shadow-2xl flex items-center gap-2 max-w-[90%]"
          >
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span className="leading-tight">{gateBlockedNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. THE 16:9 WIDESCREEN REALM SLIDE CANVAS */}
      <div
        className="relative w-full aspect-[16/9] min-h-[240px] sm:min-h-[460px] md:min-h-[580px] overflow-hidden select-none touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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

            {/* TERRAIN-CONFORMING EXPEDITION TRAILS */}
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
                const precedingLandmark = [...currentRealmLadders]
                  .filter((l) => getStageOrder(l) <= segment.fromIndex)
                  .pop();

                const isCleared = precedingLandmark ? precedingLandmark.isSolved : false;
                if (!isCleared) return null;

                const succeedingLandmark = currentRealmLadders.find(
                  (l) => getStageOrder(l) >= segment.toIndex
                );
                if (!succeedingLandmark) return null;

                return (
                  <g key={`trail-seg-${currentRealm.id}-${i}`}>
                    {/* Shadow Outline */}
                    <path
                      d={segment.d}
                      fill="none"
                      stroke="#0d0603"
                      strokeWidth="7"
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
                      strokeWidth="4"
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
                      strokeWidth="1.5"
                      strokeDasharray="4 18"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              })}
            </svg>

            {/* CHECKPOINT MILESTONE NODES */}
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
              const isExcluded = !landmark;
              if (isExcluded) return null;

              const isCleared = landmark?.isSolved;
              const isActive = landmark?.isActive;
              const isLocked = landmark ? landmark.isLocked : true;

              const isFinalMilestone = Boolean(
                isAllCleared &&
                  landmark &&
                  landmarks.length > 0 &&
                  landmark.orderIndex === landmarks[landmarks.length - 1]?.orderIndex
              );
              const showCrewBadge = Boolean(isActive || isFinalMilestone);

              // Boundary checks for edge clamping tooltips on mobile
              const isNearLeft = coord.x <= 25;
              const isNearRight = coord.x >= 75;
              const horizontalClampedAlign = isNearLeft
                ? "left-0"
                : isNearRight
                ? "right-0"
                : "left-1/2 -translate-x-1/2";

              const isSelected = Boolean(landmark && selectedOrActiveLandmark?.id === landmark.id);

              return (
                <div
                  key={`waypoint-${currentRealm.id}-${puzzle.orderIndex}`}
                  onClick={() => {
                    if (landmark) {
                      const isAlreadySelected = selectedOrActiveLandmark?.id === landmark.id;
                      setSelectedMobileLandmarkId(landmark.id);
                      if (!isLocked) {
                        const isDesktop =
                          typeof window !== "undefined" &&
                          window.matchMedia("(hover: hover)").matches;
                        if (isDesktop || isAlreadySelected) {
                          onSelectLandmark(landmark);
                        }
                      }
                    }
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group select-none min-w-[44px] min-h-[44px] justify-center ${
                    isExcluded
                      ? "cursor-default opacity-50"
                      : isLocked
                      ? "cursor-not-allowed opacity-85"
                      : "cursor-pointer"
                  }`}
                  style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                >
                  {/* Mobile & Tablet active selection beacon */}
                  {isSelected && (
                    <div className="lg:hidden absolute -inset-1.5 sm:-inset-2 rounded-2xl border-2 sm:border-3 border-yellow-400 shadow-[0_0_16px_rgba(251,191,36,0.85)] animate-pulse pointer-events-none" />
                  )}
                  {/* ANGRY BIRDS-STYLE CREW HOPPING PIN */}
                  {showCrewBadge && (
                    <motion.div
                      animate={{
                        y: [-10, 0, -10],
                        scale: [1.08, 1, 1.08],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.8,
                        ease: "easeInOut",
                      }}
                      className="absolute -top-11 sm:-top-16 z-30 flex flex-col items-center pointer-events-none"
                    >
                      {/* Stylized Pirate Captain Tricorn Badge */}
                      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#f59e0b] via-[#b45309] to-[#78350f] border-1.5 sm:border-2 border-yellow-300 shadow-[0_6px_18px_rgba(0,0,0,0.9),0_0_14px_#f59e0b] flex items-center justify-center p-1 sm:p-1.5 transform hover:scale-110 transition-transform">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="w-5 h-5 sm:w-7 sm:h-7 text-yellow-100 drop-shadow"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 13c1.5-2 4-3 6.5-3s5 1 6.5 3" />
                          <path d="M4 10.5l7.5-6.5 7.5 6.5" />
                          <circle cx="11.5" cy="15" r="3.5" fill="#fef08a" stroke="#854d0e" strokeWidth="1.5" />
                          <circle cx="10" cy="14.5" r="0.8" fill="#713f12" />
                          <path d="M12.5 13.5l1.5 2" stroke="#713f12" strokeWidth="1.5" />
                        </svg>
                      </div>
                      {/* Downward Pointer Triangle */}
                      <div className="w-0 h-0 border-l-[4px] sm:border-l-[6px] border-l-transparent border-r-[4px] sm:border-r-[6px] border-r-transparent border-t-[6px] sm:border-t-[8px] border-t-yellow-300 -mt-0.5" />
                      <span
                        className={`px-1.5 py-0.5 sm:px-2.5 rounded-full ${
                          isFinalMilestone
                            ? "bg-emerald-400 text-black font-black"
                            : "bg-amber-500 text-black font-black"
                        } text-[7px] sm:text-[9px] font-mono shadow mt-0.5 uppercase tracking-wider whitespace-nowrap`}
                      >
                        {isFinalMilestone ? "CONQUERED" : "CREW HERE"}
                      </span>
                    </motion.div>
                  )}

                  {/* 3D NODE ASSET RENDERING */}
                  {isExcluded ? (
                    <div className="relative w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center">
                      <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border border-dashed border-amber-600/50 bg-[#160a04]/80 flex items-center justify-center shadow-inner">
                        <Compass className="w-3.5 h-3.5 text-amber-500/60" />
                      </div>
                    </div>
                  ) : isCleared ? (
                    <div className="relative w-14 h-9 sm:w-24 sm:h-16 md:w-32 md:h-20 flex items-center justify-center group-hover:scale-110 active:scale-95 transition-transform">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/hunt/scroll_node_solved.webp"
                        alt={`Breached: ${landmark.title}`}
                        className="w-full h-full object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.7)]"
                      />
                    </div>
                  ) : isActive ? (
                    <div className="relative w-12 h-12 sm:w-18 sm:h-18 md:w-24 md:h-24 flex items-center justify-center group-hover:scale-110 active:scale-95 transition-transform">
                      <div className="absolute -inset-2 sm:-inset-3 rounded-full bg-amber-500/40 blur-md animate-pulse" />
                      <div className="relative w-10 h-10 sm:w-15 sm:h-15 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#3b1d0c] via-[#241005] to-[#120703] border-2 sm:border-3 border-yellow-300 shadow-[0_0_15px_rgba(251,191,36,0.6)] flex flex-col items-center justify-center p-0.5 sm:p-1 text-center">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300 animate-bounce" />
                        <span className="font-serif font-black text-[9px] sm:text-[11px] text-[#fff6df] leading-tight">
                          Level #{landmark.orderIndex}
                        </span>
                        <span className="text-[7px] sm:text-[8px] font-mono font-bold text-amber-300 hidden xs:inline">
                          {landmark.bountyPoints} PTS
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-14 h-9 sm:w-24 sm:h-16 md:w-32 md:h-20 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/hunt/scroll_node_locked.webp"
                        alt={`Locked: ${landmark.title}`}
                        className="w-full h-full object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)]"
                      />
                    </div>
                  )}

                  {/* CONFIGURABLE DIRECTIONAL TOOLTIP LABEL (HOVER-ONLY ON DESKTOP, NEVER BLOCKS ARTWORK OR TEXT) */}
                  <div
                    className={cn(
                      "hidden lg:flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl bg-[#140803]/95 border border-[#633318] text-center shadow-[0_10px_25px_rgba(0,0,0,0.9)] max-w-[180px] pointer-events-none transition-all duration-200 z-40",
                      "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto",
                      coord.titlePosition === "top" && `absolute bottom-full mb-2.5 ${horizontalClampedAlign}`,
                      (coord.titlePosition === "bottom" || !coord.titlePosition) && `absolute top-full mt-2.5 ${horizontalClampedAlign}`,
                      coord.titlePosition === "left" && "absolute right-full mr-3 top-1/2 -translate-y-1/2",
                      coord.titlePosition === "right" && "absolute left-full ml-3 top-1/2 -translate-y-1/2"
                    )}
                  >
                    <span className="text-[9px] font-mono uppercase text-[#e2a249] font-bold block truncate max-w-full">
                      {coord.landmarkName}
                    </span>
                    <span className="font-serif font-black text-xs text-[#fdf5e4] block truncate leading-tight max-w-full mt-0.5">
                      {isExcluded ? puzzle.title : landmark.title}
                    </span>
                    <div className="mt-1 flex items-center justify-center gap-1.5">
                      {isExcluded ? (
                        <span className="text-[9px] font-mono text-stone-500 font-bold block">
                          PASSED
                        </span>
                      ) : isCleared ? (
                        <span className="text-[9px] font-mono text-emerald-400 font-extrabold flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          BREACHED
                        </span>
                      ) : isActive ? (
                        <span className="text-[9px] font-mono text-amber-400 font-extrabold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-stone-400 font-bold flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          SEALED
                        </span>
                      )}
                      <span className="text-stone-600 text-[9px]">•</span>
                      <span className="text-[9px] font-mono font-bold text-yellow-300">
                        {landmark?.bountyPoints ?? 0} PTS
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* 4. HIGH-CONTRAST FLOATING NAVIGATION BUTTONS (POINTER-SAFE: NEVER INTERCEPTS WAYPOINT CLICKS) */}

        {/* LEFT NAV BUTTON */}
        {prevRealm && (
          <div className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-4 z-30 pointer-events-none">
            <button
              onClick={handlePrev}
              type="button"
              className="pointer-events-auto p-2 sm:p-3 rounded-full sm:rounded-2xl bg-gradient-to-r from-[#2a1307]/95 to-[#1a0a03]/95 border-2 border-amber-500/80 hover:border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(0,0,0,0.9),0_0_12px_rgba(245,158,11,0.35)] cursor-pointer flex items-center gap-2 group min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] justify-center transition-transform active:scale-90"
              title={`Return to ${prevRealm.title}`}
              aria-label="Previous Realm"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden lg:inline text-xs font-serif font-black pr-1 text-amber-100">
                {prevRealm.title.split(":")[0]?.trim()}
              </span>
            </button>
          </div>
        )}

        {/* RIGHT NAV BUTTON */}
        {nextRealm && allCurrentStagesSolved && (
          <div className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-4 z-30 pointer-events-none">
            <button
              onClick={handleNext}
              type="button"
              className="pointer-events-auto p-2 sm:p-3 rounded-full sm:rounded-2xl border-2 shadow-[0_0_20px_rgba(0,0,0,0.9)] cursor-pointer flex items-center gap-2 group min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] justify-center transition-transform active:scale-90 bg-gradient-to-l from-[#2a1307]/95 to-[#1a0a03]/95 border-emerald-500/80 text-emerald-200 hover:border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
              title={`Advance to ${nextRealm.title}`}
              aria-label="Next Realm"
            >
              <span className="hidden lg:inline text-xs font-serif font-black pl-1 text-amber-100">
                {nextRealm.title.split(":")[0]?.trim()}
              </span>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* 5. MOBILE & TABLET WAYPOINT HUD DOCK (CLEAN TOUCH EXCELLENCE) */}
      {selectedOrActiveLandmark && (
        <div className="lg:hidden px-3 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-[#140803] via-[#200e05] to-[#140803] border-t-2 border-[#522912] shadow-inner flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Status Icon Orb */}
            <div
              className={cn(
                "w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border shadow-inner transition-colors",
                selectedOrActiveLandmark.isSolved
                  ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300"
                  : selectedOrActiveLandmark.isActive
                  ? "bg-amber-950/80 border-amber-400/80 text-yellow-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                  : "bg-stone-950/80 border-stone-800 text-stone-500"
              )}
            >
              {selectedOrActiveLandmark.isSolved ? (
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              ) : selectedOrActiveLandmark.isActive ? (
                <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-spin-slow" />
              ) : (
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-stone-500" />
              )}
            </div>

            {/* Telemetry & Title */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] sm:text-xs font-mono font-black uppercase text-[#e2a249] tracking-wider truncate max-w-[140px] sm:max-w-[220px]">
                  {selectedLandmarkName}
                </span>
                <span className="text-amber-700/60 text-[10px]">•</span>
                <span
                  className={cn(
                    "text-[9px] sm:text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border",
                    selectedOrActiveLandmark.isSolved
                      ? "text-emerald-300 bg-emerald-950/60 border-emerald-600/40"
                      : selectedOrActiveLandmark.isActive
                      ? "text-amber-300 bg-amber-950/60 border-amber-500/50"
                      : "text-stone-400 bg-stone-900/60 border-stone-800"
                  )}
                >
                  {selectedOrActiveLandmark.isSolved
                    ? "Breached ✓"
                    : selectedOrActiveLandmark.isActive
                    ? `Level #${selectedOrActiveLandmark.orderIndex}`
                    : "Sealed 🔒"}
                </span>
                <span className="text-amber-700/60 text-[10px] hidden xs:inline">•</span>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-yellow-400 hidden xs:inline">
                  {selectedOrActiveLandmark.bountyPoints} PTS
                </span>
              </div>
              <p className="font-serif font-black text-xs sm:text-sm text-[#fed7aa] truncate leading-tight mt-0.5">
                {selectedOrActiveLandmark.title}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={() => {
              if (!selectedOrActiveLandmark.isLocked) {
                onSelectLandmark(selectedOrActiveLandmark);
              }
            }}
            disabled={selectedOrActiveLandmark.isLocked}
            className={cn(
              "shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-serif font-black tracking-wider uppercase transition-all shadow-md flex items-center gap-1.5 min-h-[44px] min-w-[90px] sm:min-w-[110px] justify-center",
              selectedOrActiveLandmark.isLocked
                ? "bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed opacity-60"
                : selectedOrActiveLandmark.isSolved
                ? "bg-emerald-900/80 hover:bg-emerald-800/90 text-emerald-100 border border-emerald-400/60 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95"
                : "bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-500 hover:to-yellow-500 border border-yellow-300/80 text-black active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.45)]"
            )}
          >
            {selectedOrActiveLandmark.isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Sealed</span>
              </>
            ) : selectedOrActiveLandmark.isSolved ? (
              <>
                <Scroll className="w-3.5 h-3.5 text-emerald-300" />
                <span>Review</span>
              </>
            ) : (
              <>
                <Scroll className="w-3.5 h-3.5 text-black" />
                <span>Solve</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
