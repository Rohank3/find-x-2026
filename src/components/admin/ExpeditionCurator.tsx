"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Save,
  Check,
  RefreshCw,
  Sliders,
  Award,
  Edit3,
  X,
} from "lucide-react";
import {
  CAMPAIGN_REALMS,
  RealmConfig,
  getAllWaypointKeys,
  getDefault15WaypointKeys,
  buildExpeditionLadder,
} from "@/lib/hunt/realmsRegistry";
import {
  updateActiveWaypointsAction,
  updatePuzzleTitleAction,
  syncWaypointTitlesToPuzzlesAction,
} from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export interface CuratorPuzzle {
  id: string;
  orderIndex: number;
  title: string;
}

interface ExpeditionCuratorProps {
  initialActiveKeys?: string[];
  puzzles?: CuratorPuzzle[];
}

export default function ExpeditionCurator({
  initialActiveKeys,
  puzzles,
}: ExpeditionCuratorProps) {
  // If no keys configured, default to standard 15 or all keys
  const defaultKeys =
    initialActiveKeys && initialActiveKeys.length > 0
      ? initialActiveKeys
      : getDefault15WaypointKeys();

  const [activeKeys, setActiveKeys] = useState<string[]>(defaultKeys);
  const [currentRealmIndex, setCurrentRealmIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Puzzle Title Customization State
  const [editingOrderIndex, setEditingOrderIndex] = useState<number | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);
  const [isSyncingLore, setIsSyncingLore] = useState(false);

  const [puzzleTitleMap, setPuzzleTitleMap] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    if (puzzles) {
      for (const p of puzzles) {
        map[p.orderIndex] = p.title;
      }
    }
    return map;
  });

  const currentRealm: RealmConfig =
    CAMPAIGN_REALMS[currentRealmIndex] || CAMPAIGN_REALMS[0];

  const totalPossible = getAllWaypointKeys().length;
  const currentTotalSelected = activeKeys.length;

  // Toggle a single waypoint
  const toggleWaypoint = (key: string) => {
    setActiveKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Toggle all in current realm
  const toggleCurrentRealmAll = (enable: boolean) => {
    const realmKeys = currentRealm.puzzles.map(
      (p) => `r${currentRealm.id}-p${p.orderIndex}`
    );
    if (enable) {
      setActiveKeys((prev) => Array.from(new Set([...prev, ...realmKeys])));
    } else {
      setActiveKeys((prev) => prev.filter((k) => !realmKeys.includes(k)));
    }
  };

  // Apply Presets
  const applyPreset15 = () => {
    setActiveKeys(getDefault15WaypointKeys());
  };

  const applyPresetAll = () => {
    setActiveKeys(getAllWaypointKeys());
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await updateActiveWaypointsAction(activeKeys);
      if (res.success) {
        setSaveStatus(
          `Success! Saved ${activeKeys.length} active waypoints across the campaign.`
        );
        setTimeout(() => setSaveStatus(null), 5000);
      } else {
        setSaveStatus(`Failed to save: ${res.error || "Unknown error"}`);
      }
    } catch {
      setSaveStatus("Failed to save due to network or server exception.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditTitle = (e: React.MouseEvent, orderIndex: number, currentTitle: string) => {
    e.stopPropagation();
    setEditingOrderIndex(orderIndex);
    setEditTitleInput(currentTitle);
  };

  const handleSaveTitle = async (e: React.MouseEvent, orderIndex: number) => {
    e.stopPropagation();
    if (!editTitleInput.trim()) return;
    setIsUpdatingTitle(true);
    try {
      const dbPuzzle = puzzles?.find((p) => p.orderIndex === orderIndex);
      if (dbPuzzle) {
        const res = await updatePuzzleTitleAction(dbPuzzle.id, editTitleInput.trim());
        if (res.success) {
          setPuzzleTitleMap((prev) => ({ ...prev, [orderIndex]: editTitleInput.trim() }));
          setEditingOrderIndex(null);
          setSaveStatus(`Puzzle #${orderIndex} renamed to "${editTitleInput.trim()}"`);
          setTimeout(() => setSaveStatus(null), 4000);
        } else {
          setSaveStatus(`Failed to update title: ${res.error}`);
        }
      } else {
        setPuzzleTitleMap((prev) => ({ ...prev, [orderIndex]: editTitleInput.trim() }));
        setEditingOrderIndex(null);
      }
    } catch {
      setSaveStatus("Failed to update puzzle title.");
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const handleSyncLoreTitles = async () => {
    setIsSyncingLore(true);
    setSaveStatus(null);
    try {
      const res = await syncWaypointTitlesToPuzzlesAction();
      if (res.success) {
        const ladder = buildExpeditionLadder(activeKeys);
        const nextMap = { ...puzzleTitleMap };
        for (const item of ladder) {
          nextMap[item.orderIndex] = item.title;
        }
        setPuzzleTitleMap(nextMap);
        setSaveStatus(
          `Success! Synchronized map lore names into ${res.updatedCount ?? 0} database puzzles.`
        );
        setTimeout(() => setSaveStatus(null), 5000);
      } else {
        setSaveStatus(`Failed to sync titles: ${res.error}`);
      }
    } catch {
      setSaveStatus("Exception occurred while syncing lore titles.");
    } finally {
      setIsSyncingLore(false);
    }
  };

  // Calculate global ladder index for active waypoints
  const getGlobalLadderOrder = (key: string) => {
    let order = 1;
    for (const r of CAMPAIGN_REALMS) {
      for (const p of r.puzzles) {
        const k = `r${r.id}-p${p.orderIndex}`;
        if (activeKeys.includes(k)) {
          if (k === key) return order;
          order++;
        }
      }
    }
    return null;
  };

  const currentRealmActiveCount = currentRealm.puzzles.filter((p) =>
    activeKeys.includes(`r${currentRealm.id}-p${p.orderIndex}`)
  ).length;

  return (
    <div className="space-y-6 select-none">
      {/* 1. MASTER EXPEDITION CONTROL COMMAND BAR */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#1c0d05] via-[#2d160a] to-[#1c0d05] border-2 border-amber-600/50 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/40">
                Campaign Map Curator
              </span>
              <span className="text-amber-500">•</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Active Ladder: {currentTotalSelected} Puzzles
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-black text-amber-100 tracking-wide mt-1">
              Interactive Realm Waypoints Curator
            </h2>
            <p className="text-xs text-amber-200/70 font-serif max-w-2xl mt-0.5">
              Click any waypoint directly on the map or in the list below to toggle it in the competition. Unselected waypoints will be bypassed seamlessly — once the preceding puzzle is solved, the next selected puzzle unlocks directly!
            </p>
          </div>

          {/* Save Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 border-2 border-yellow-300 text-white font-serif font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin text-yellow-300" />
              ) : (
                <Save className="w-4 h-4 text-yellow-300" />
              )}
              <span>{isSaving ? "Saving..." : "Save Expedition Ladder"}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Notice */}
        {saveStatus && (
          <div
            className={cn(
              "p-3 rounded-2xl text-center font-serif text-xs font-bold border-2 shadow-lg animate-bounce",
              saveStatus.startsWith("Success")
                ? "bg-emerald-950/90 border-emerald-500 text-emerald-100"
                : "bg-red-950/90 border-red-500 text-red-100"
            )}
          >
            {saveStatus}
          </div>
        )}

        {/* Quick Presets & Realm Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-800/40">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-amber-300/80 mr-1">
              Presets:
            </span>
            <button
              onClick={applyPreset15}
              className="px-3 py-1 rounded-xl bg-[#261208] hover:bg-[#381a0b] border border-amber-600/50 text-amber-200 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Standard 15 Puzzles</span>
            </button>
            <button
              onClick={applyPresetAll}
              className="px-3 py-1 rounded-xl bg-[#261208] hover:bg-[#381a0b] border border-amber-600/50 text-amber-200 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>All 31 Waypoints</span>
            </button>
            <button
              onClick={handleSyncLoreTitles}
              disabled={isSyncingLore}
              className="px-3 py-1 rounded-xl bg-[#261208] hover:bg-[#381a0b] border border-amber-600/50 text-amber-200 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Sync atmospheric map lore titles into the database puzzles"
            >
              {isSyncingLore ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-yellow-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              )}
              <span>Sync Lore Names to Database</span>
            </button>
            <button
              onClick={() => toggleCurrentRealmAll(true)}
              className="px-3 py-1 rounded-xl bg-[#261208] hover:bg-[#381a0b] border border-amber-600/50 text-amber-200 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5 text-sky-400" />
              <span>Select All in Chapter {currentRealm.id}</span>
            </button>
            <button
              onClick={() => toggleCurrentRealmAll(false)}
              className="px-3 py-1 rounded-xl bg-[#261208] hover:bg-[#381a0b] border border-amber-600/50 text-rose-300 text-xs font-mono font-bold transition cursor-pointer shadow-sm"
            >
              <span>Clear Chapter {currentRealm.id}</span>
            </button>
          </div>

          <div className="text-xs font-mono font-bold text-amber-200/90">
            Total Selected:{" "}
            <span className="text-yellow-300 text-sm font-black">
              {currentTotalSelected}
            </span>{" "}
            / {totalPossible}
          </div>
        </div>
      </div>

      {/* 2. REALM SLIDE MAP CURATION CANVAS */}
      <div className="relative w-full overflow-hidden rounded-3xl border-4 border-[#3e2111] bg-[#120703] shadow-2xl">
        {/* Header Ribbon with Chapter Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 bg-[#1a0c05] border-b border-[#522912]">
          {/* Chapter Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {CAMPAIGN_REALMS.map((r, idx) => {
              const rActiveCount = r.puzzles.filter((p) =>
                activeKeys.includes(`r${r.id}-p${p.orderIndex}`)
              ).length;
              const isCurrent = idx === currentRealmIndex;

              return (
                <button
                  key={`tab-r-${r.id}`}
                  onClick={() => setCurrentRealmIndex(idx)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border",
                    isCurrent
                      ? "bg-amber-600 text-white border-yellow-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105"
                      : "bg-[#251208] text-amber-200/70 border-amber-800/40 hover:bg-[#32180b] hover:text-amber-100"
                  )}
                >
                  <span>Ch. {r.id}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded text-[10px]",
                      rActiveCount > 0
                        ? "bg-black/40 text-yellow-300"
                        : "bg-black/60 text-stone-500"
                    )}
                  >
                    {rActiveCount}/{r.puzzles.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setCurrentRealmIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentRealmIndex === 0}
              className="p-1.5 rounded-xl bg-[#291307] hover:bg-[#3b1d0c] disabled:opacity-40 text-amber-200 border border-amber-700/50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-amber-300">
              {currentRealmIndex + 1} / {CAMPAIGN_REALMS.length}
            </span>
            <button
              onClick={() =>
                setCurrentRealmIndex((prev) =>
                  Math.min(CAMPAIGN_REALMS.length - 1, prev + 1)
                )
              }
              disabled={currentRealmIndex === CAMPAIGN_REALMS.length - 1}
              className="p-1.5 rounded-xl bg-[#291307] hover:bg-[#3b1d0c] disabled:opacity-40 text-amber-200 border border-amber-700/50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 16:9 Widescreen Map Canvas with Interactive Waypoint Rings */}
        <div className="relative w-full aspect-[16/9] min-h-[460px] sm:min-h-[580px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRealm.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${currentRealm.image}')` }}
            >
              {/* Vignette */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#140a05]/20 via-transparent to-[#140a05]/35 pointer-events-none" />

              {/* Terrain SVG Trails */}
              <svg
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
              >
                {currentRealm.pathSegments?.map((segment, i) => (
                  <g key={`curator-seg-${currentRealm.id}-${i}`}>
                    <path
                      d={segment.d}
                      fill="none"
                      stroke="#0d0603"
                      strokeWidth="6"
                      strokeDasharray="8 10"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                    <path
                      d={segment.d}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray="4 14"
                      strokeLinecap="round"
                    />
                  </g>
                ))}
              </svg>

              {/* Interactive Curated Waypoint Nodes */}
              {currentRealm.puzzles.map((puzzle, i) => {
                const waypointKey = `r${currentRealm.id}-p${puzzle.orderIndex}`;
                const isSelected = activeKeys.includes(waypointKey);
                const ladderOrder = getGlobalLadderOrder(waypointKey);
                const coord = currentRealm.nodeCoords[i] || {
                  x: puzzle.coord.x,
                  y: puzzle.coord.y,
                  landmarkName: puzzle.landmarkName,
                  titlePosition: puzzle.titlePosition || "bottom",
                };

                return (
                  <div
                    key={`curator-node-${waypointKey}`}
                    onClick={() => toggleWaypoint(waypointKey)}
                    className={cn(
                      "absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group cursor-pointer transition-transform hover:scale-110",
                      isSelected ? "scale-100" : "scale-90 opacity-60"
                    )}
                    style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                  >
                    {/* Active State Halo */}
                    {isSelected && (
                      <div className="absolute -inset-3 rounded-full bg-emerald-500/30 blur-md animate-pulse" />
                    )}

                    {/* Checkpoint Badge Indicator */}
                    <div
                      className={cn(
                        "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center p-1 text-center border-3 transition-all shadow-xl",
                        isSelected
                          ? "bg-gradient-to-br from-[#12381f] via-[#0b2413] to-[#041109] border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.7)]"
                          : "bg-gradient-to-br from-[#261a14] via-[#1a110c] to-[#0e0906] border-stone-600/70"
                      )}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="font-serif font-black text-xs text-emerald-200 mt-0.5">
                            Level #{ladderOrder}
                          </span>
                          <span className="text-[8px] font-mono text-emerald-300 font-bold">
                            ACTIVE
                          </span>
                        </>
                      ) : (
                        <>
                          <Compass className="w-5 h-5 text-stone-500" />
                          <span className="font-serif font-bold text-[10px] text-stone-400 mt-0.5">
                            Bypassed
                          </span>
                        </>
                      )}
                    </div>

                    {/* Tooltip Label */}
                    <div
                      className={cn(
                        "px-2.5 py-1 rounded-xl bg-[#1c0d05]/95 border text-center shadow-2xl max-w-[140px] pointer-events-none transition-all z-30",
                        isSelected
                          ? "border-emerald-600/70 text-emerald-100"
                          : "border-stone-700/60 text-stone-400",
                        coord.titlePosition === "top" &&
                          "absolute bottom-full mb-2 left-1/2 -translate-x-1/2",
                        (coord.titlePosition === "bottom" ||
                          !coord.titlePosition) &&
                          "absolute top-full mt-2 left-1/2 -translate-x-1/2",
                        coord.titlePosition === "left" &&
                          "absolute right-full mr-3 top-1/2 -translate-y-1/2",
                        coord.titlePosition === "right" &&
                          "absolute left-full ml-3 top-1/2 -translate-y-1/2"
                      )}
                    >
                      <span className="text-[8px] font-mono uppercase font-bold block truncate text-[#e2a249]">
                        {coord.landmarkName}
                      </span>
                      <span className="font-serif font-black text-xs block truncate leading-tight">
                        {ladderOrder && puzzleTitleMap[ladderOrder]
                          ? puzzleTitleMap[ladderOrder]
                          : puzzle.title}
                      </span>
                      <span
                        className={cn(
                          "text-[8px] font-mono font-bold block mt-0.5",
                          isSelected ? "text-emerald-400" : "text-stone-500"
                        )}
                      >
                        {isSelected
                          ? `INCLUDED (ANS: ${puzzle.answer})`
                          : "CLICK TO ACTIVATE"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 3. CURRENT CHAPTER WAYPOINTS CHECKLIST */}
      <div className="p-5 rounded-3xl bg-[#180b04]/95 border-2 border-amber-700/50 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-amber-800/40 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-black text-lg text-amber-200">
              {currentRealm.title} — Waypoints Breakdown
            </h3>
          </div>
          <span className="text-xs font-mono text-amber-400/80 font-bold">
            {currentRealmActiveCount} of {currentRealm.puzzles.length} Active in
            this Chapter
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentRealm.puzzles.map((puzzle) => {
            const waypointKey = `r${currentRealm.id}-p${puzzle.orderIndex}`;
            const isSelected = activeKeys.includes(waypointKey);
            const ladderOrder = getGlobalLadderOrder(waypointKey);

            return (
              <div
                key={`curator-card-${waypointKey}`}
                onClick={() => toggleWaypoint(waypointKey)}
                className={cn(
                  "p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-md",
                  isSelected
                    ? "bg-gradient-to-r from-emerald-950/80 to-[#122e1b]/80 border-emerald-500/80 text-emerald-100"
                    : "bg-[#201007]/80 hover:bg-[#2b160a] border-amber-800/40 text-amber-200/70"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 border",
                      isSelected
                        ? "bg-emerald-600 border-emerald-300 text-white shadow"
                        : "bg-black/50 border-stone-700 text-stone-500"
                    )}
                  >
                    {isSelected ? `#${ladderOrder}` : "OFF"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase font-bold text-amber-400 truncate">
                        {puzzle.landmarkName}
                      </span>
                      <span className="text-[10px] font-mono text-yellow-300 font-bold bg-black/40 px-1.5 py-0.2 rounded">
                        Ans: {puzzle.answer}
                      </span>
                    </div>

                    {editingOrderIndex === ladderOrder ? (
                      <div
                        className="flex items-center gap-1.5 mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitleInput}
                          onChange={(e) => setEditTitleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && ladderOrder) {
                              handleSaveTitle(e as unknown as React.MouseEvent, ladderOrder);
                            } else if (e.key === "Escape") {
                              setEditingOrderIndex(null);
                            }
                          }}
                          className="bg-[#100703] border border-amber-400 text-amber-100 text-xs px-2 py-1 rounded font-serif font-bold focus:outline-none focus:ring-1 focus:ring-amber-300 w-full"
                          placeholder="Custom puzzle name..."
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={(e) => ladderOrder && handleSaveTitle(e, ladderOrder)}
                          disabled={isUpdatingTitle}
                          className="p-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white shrink-0 cursor-pointer"
                          title="Save Name"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingOrderIndex(null);
                          }}
                          className="p-1 rounded bg-stone-700 hover:bg-stone-600 text-white shrink-0 cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group/title mt-0.5">
                        <h4 className="font-serif font-bold text-sm truncate text-[#fff5e6]">
                          {ladderOrder && puzzleTitleMap[ladderOrder]
                            ? puzzleTitleMap[ladderOrder]
                            : puzzle.title}
                        </h4>
                        {isSelected && ladderOrder && (
                          <button
                            type="button"
                            onClick={(e) =>
                              handleStartEditTitle(
                                e,
                                ladderOrder,
                                puzzleTitleMap[ladderOrder] || puzzle.title
                              )
                            }
                            className="opacity-0 group-hover/title:opacity-100 p-1 text-amber-400 hover:text-yellow-300 transition shrink-0 cursor-pointer"
                            title="Rename this puzzle"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider",
                      isSelected
                        ? "bg-emerald-900 border-emerald-500 text-emerald-200"
                        : "bg-stone-900 border-stone-700 text-stone-500"
                    )}
                  >
                    {isSelected ? "Active" : "Bypassed"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
