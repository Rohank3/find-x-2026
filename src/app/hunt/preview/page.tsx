"use client";

import { useState, useEffect } from "react";
import HuntClient from "../HuntClient";
import { PuzzleData } from "@/components/hunt/PuzzleDispatch";
import { SubmitResult } from "../actions";
import { Key, X, Sparkles, Copy, Check, MapPin, Compass } from "lucide-react";
import {
  buildExpeditionLadder,
  CAMPAIGN_REALMS,
  getDefault15WaypointKeys,
  getAllWaypointKeys,
} from "@/lib/hunt/realmsRegistry";

// Comprehensive alias dictionary keyed by exact waypoint 'r{realmId}-p{stageIndex}'
const WAYPOINT_ALIASES: Record<string, string[]> = {
  // Realm 1: Coastal Haven
  "r1-p1": ["anchor", "mooring", "dock", "harbor"],
  "r1-p2": ["haven", "settlement", "village", "waystation"],
  "r1-p3": ["crossroads", "fork", "whisper", "verdant"],
  "r1-p4": ["sanctuary", "gate", "cloudreach", "mountain pass"],
  // Realm 2: Realms of Aethelia
  "r2-p1": ["starlight", "celestia", "star", "spires"],
  "r2-p2": ["estuary", "delta", "silverflow"],
  "r2-p3": ["sorcery", "morgana", "fortress", "occult"],
  "r2-p4": ["wyrmfire", "dragon", "breach", "wyrm"],
  // Realm 3: Sunken Canyon of Khemet
  "r3-p1": ["salt", "caravan", "tombs", "wayfarer"],
  "r3-p2": ["solaris", "arch", "akhen", "keystone"],
  "r3-p3": ["zenith", "ziggurat", "sun temple", "star altar"],
  "r3-p4": ["enigma", "sphinx", "riddle", "sentinel"],
  "r3-p5": ["mirage", "oasis", "dunes"],
  // Realm 4: Primeval Volcano & Fire Ridge
  "r4-p1": ["megalith", "portal", "trilithon", "runes"],
  "r4-p2": ["chasm", "volcanic", "ash", "smoldering", "bridge"],
  "r4-p3": ["totem", "sentinel", "guardian", "effigy"],
  "r4-p4": ["caldera", "pyre", "volcano", "summit"],
  // Realm 5: Frozen Rock Citadel & Blizzards
  "r5-p1": ["frostwood", "pine", "forest", "whispers"],
  "r5-p2": ["crevasse", "glacier", "arch", "ice arch"],
  "r5-p3": ["portcullis", "citadel", "fortress", "gate"],
  "r5-p4": ["blizzard", "keep", "summit", "throne"],
  // Realm 6: Sunken Aqueduct & Water Metropolis
  "r6-p1": ["beacon", "sea gate", "tide", "toll"],
  "r6-p2": ["corsair", "bazaar", "pearl", "ledger"],
  "r6-p3": ["sluice", "lockmaster", "floodgate", "bastion"],
  "r6-p4": ["sovereign", "citadel", "water citadel", "sanctum"],
  "r6-p5": ["aquifer", "waves", "cascade", "temple"],
  // Realm 7: Abyssal Rift & Void Horizon
  "r7-p1": ["anchor", "sorrow", "landing", "port sorrow"],
  "r7-p2": ["leviathan", "reef", "serpent", "outer currents"],
  "r7-p3": ["void", "monolith", "horizon", "runestone"],
  "r7-p4": ["maelstrom", "eye", "outer abyss", "whirlpool"],
  "r7-p5": ["singularity", "rift", "abyss", "find x"],
};

// Chapter styling theme badges for cheatsheet drawer
const CHAPTER_THEMES: Record<
  number,
  {
    badgeClass: string;
    borderClass: string;
    bgClass: string;
    accentClass: string;
  }
> = {
  1: {
    badgeClass: "text-emerald-400 bg-emerald-950/80 border-emerald-600/40",
    borderClass: "border-emerald-700/50",
    bgClass: "from-[#0a1e12] via-[#051109] to-[#020804]",
    accentClass: "text-emerald-300",
  },
  2: {
    badgeClass: "text-purple-400 bg-purple-950/80 border-purple-600/40",
    borderClass: "border-purple-700/50",
    bgClass: "from-[#1c0c2e] via-[#10061c] to-[#07020d]",
    accentClass: "text-purple-300",
  },
  3: {
    badgeClass: "text-amber-400 bg-amber-950/80 border-amber-600/40",
    borderClass: "border-amber-700/50",
    bgClass: "from-[#291705] via-[#190d02] to-[#0c0601]",
    accentClass: "text-amber-300",
  },
  4: {
    badgeClass: "text-red-400 bg-red-950/80 border-red-600/40",
    borderClass: "border-red-700/50",
    bgClass: "from-[#2a0b0b] via-[#1a0505] to-[#0d0202]",
    accentClass: "text-red-300",
  },
  5: {
    badgeClass: "text-cyan-400 bg-cyan-950/80 border-cyan-600/40",
    borderClass: "border-cyan-700/50",
    bgClass: "from-[#081e28] via-[#041117] to-[#02080b]",
    accentClass: "text-cyan-300",
  },
  6: {
    badgeClass: "text-sky-400 bg-sky-950/80 border-sky-600/40",
    borderClass: "border-sky-700/50",
    bgClass: "from-[#0a2133] via-[#05141f] to-[#020a10]",
    accentClass: "text-sky-300",
  },
  7: {
    badgeClass: "text-violet-400 bg-violet-950/80 border-violet-600/40",
    borderClass: "border-violet-700/50",
    bgClass: "from-[#1e0a2d] via-[#11051b] to-[#08020d]",
    accentClass: "text-violet-300",
  },
};

export default function HuntPreviewPage() {
  const [ladderMode, setLadderMode] = useState<"standard15" | "all31">("standard15");
  const [ladder, setLadder] = useState(() =>
    buildExpeditionLadder(getDefault15WaypointKeys())
  );
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Anti-brute-force lockout simulation state for organizers
  const [failedAttempts, setFailedAttempts] = useState<Record<string, number>>({});
  const [simulatedLockoutUntil, setSimulatedLockoutUntil] = useState<number | null>(null);
  const [remainingLockoutSeconds, setRemainingLockoutSeconds] = useState(0);

  useEffect(() => {
    if (!simulatedLockoutUntil) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((simulatedLockoutUntil - Date.now()) / 1000));
      setRemainingLockoutSeconds(remaining);
      if (remaining <= 0) {
        setSimulatedLockoutUntil(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [simulatedLockoutUntil]);

  // Toggle ladder mode between 15-puzzle tournament and full 31 campaign
  const handleToggleLadderMode = (mode: "standard15" | "all31") => {
    setLadderMode(mode);
    setLadder(
      mode === "standard15"
        ? buildExpeditionLadder(getDefault15WaypointKeys())
        : buildExpeditionLadder(getAllWaypointKeys())
    );
    setFailedAttempts({});
    setSimulatedLockoutUntil(null);
    setRemainingLockoutSeconds(0);
  };

  const handleCopyAnswer = (orderIndex: number, answerText: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(answerText);
      setCopiedIndex(orderIndex);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handlePreviewSubmit = async (
    puzzleId: string,
    answerText: string
  ): Promise<SubmitResult> => {
    // 1. Check if simulated lockout is currently active
    if (simulatedLockoutUntil && Date.now() < simulatedLockoutUntil) {
      const remainingSeconds = Math.ceil((simulatedLockoutUntil - Date.now()) / 1000);
      return {
        success: false,
        isCorrect: false,
        lockedOut: true,
        remainingSeconds,
        error: `Vault locked! Please wait ${remainingSeconds}s before attempting another cipher.`,
      };
    }

    const ladderPuzzle = ladder.find((p) => p.id === puzzleId);
    if (!ladderPuzzle)
      return { success: false, error: "Waypoint coordinates not recognized." };

    const cleanInput = answerText.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const primaryAns = ladderPuzzle.answer.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

    const aliases =
      WAYPOINT_ALIASES[ladderPuzzle.waypointKey] || [primaryAns];
    const isCorrect =
      cleanInput === primaryAns ||
      aliases.some(
        (alias) => alias.trim().toLowerCase().replace(/[^a-z0-9]/g, "") === cleanInput
      );

    if (isCorrect) {
      // Clear wrong attempts for this puzzle on success
      setFailedAttempts((prev) => {
        const next = { ...prev };
        delete next[puzzleId];
        return next;
      });

      const nextPuzzle = ladder.find(
        (p) => p.orderIndex === ladderPuzzle.orderIndex + 1
      );
      return {
        success: true,
        isCorrect: true,
        pointsAwarded: ladderPuzzle.bountyPoints,
        nextPuzzleData: nextPuzzle
          ? {
              ...nextPuzzle,
              isSolved: false,
              isActive: true,
              isLocked: false,
            }
          : null,
      };
    } else {
      // Record wrong attempt and check if lockout threshold (3 in preview) is breached
      const currentAttempts = (failedAttempts[puzzleId] || 0) + 1;
      setFailedAttempts((prev) => ({ ...prev, [puzzleId]: currentAttempts }));

      if (currentAttempts >= 3) {
        const lockoutSeconds = 30;
        setSimulatedLockoutUntil(Date.now() + lockoutSeconds * 1000);
        setRemainingLockoutSeconds(lockoutSeconds);
        return {
          success: false,
          isCorrect: false,
          lockedOut: true,
          remainingSeconds: lockoutSeconds,
          error: `Too many failed attempts (${currentAttempts}/3)! The vault tumblers have locked for ${lockoutSeconds} seconds.`,
        };
      }

      return {
        success: false,
        isCorrect: false,
        lockedOut: false,
        error: `Incorrect cipher! Attempt ${currentAttempts}/3 before brig lockout. Expected: "${ladderPuzzle.answer}"`,
      };
    }
  };

  return (
    <div className="relative w-full min-h-screen pb-16">
      {/* Interactive Hunt Experience */}
      <HuntClient
        key={ladderMode}
        team={{
          id: "crew-strawhat",
          name: "Straw Hat Pirates",
          isFrozen: false,
        }}
        puzzles={ladder as PuzzleData[]}
        activeOrderIndex={1}
        competitionState="LIVE"
        supportFeatureEnabled={true}
        hintsEnabled={true}
        onSubmitAnswer={handlePreviewSubmit}
      />

      {/* FLOATING TESTING TOOLBAR */}
      <div className="fixed bottom-24 right-4 z-50 flex items-center gap-2">
        {remainingLockoutSeconds > 0 && (
          <button
            onClick={() => {
              setSimulatedLockoutUntil(null);
              setRemainingLockoutSeconds(0);
            }}
            className="px-3.5 py-2.5 rounded-2xl bg-red-950/90 border-2 border-red-500 text-red-200 font-mono font-bold text-xs shadow-lg hover:bg-red-900 transition-all cursor-pointer"
            title="Clear Simulated Lockout"
          >
            Clear Lockout ({remainingLockoutSeconds}s)
          </button>
        )}

        <button
          onClick={() => setShowCheatsheet((prev) => !prev)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 border-2 border-yellow-300 text-white font-serif font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Key className="w-4 h-4 text-yellow-300" />
          <span>{showCheatsheet ? "Hide Answers" : `${ladder.length} Answers Cheatsheet`}</span>
        </button>
      </div>

      {/* CHEATSHEET MODAL DRAWER */}
      {showCheatsheet && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#140803]/98 border-l-4 border-amber-600/70 p-5 sm:p-6 shadow-2xl overflow-y-auto text-amber-100 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-amber-800/60 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h2 className="font-serif font-black text-lg text-amber-200">
                Organizer Expedition Sandbox
              </h2>
            </div>
            <button
              onClick={() => setShowCheatsheet(false)}
              className="p-1.5 rounded-full bg-amber-950 text-amber-300 hover:bg-amber-900 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Preset / Mode Controls */}
          <div className="p-3.5 rounded-2xl bg-[#200f07] border border-amber-600/40 space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold text-amber-300">
                Curated Ladder Mode
              </span>
              <span className="text-xs font-mono font-bold text-yellow-400">
                {ladder.length} Active Waypoints
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleToggleLadderMode("standard15")}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition cursor-pointer text-center ${
                  ladderMode === "standard15"
                    ? "bg-amber-500 border-yellow-300 text-black shadow-md"
                    : "bg-black/40 border-amber-800/60 text-amber-200 hover:bg-white/5"
                }`}
              >
                Standard 15 Puzzles
              </button>
              <button
                onClick={() => handleToggleLadderMode("all31")}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition cursor-pointer text-center ${
                  ladderMode === "all31"
                    ? "bg-amber-500 border-yellow-300 text-black shadow-md"
                    : "bg-black/40 border-amber-800/60 text-amber-200 hover:bg-white/5"
                }`}
              >
                All 31 Waypoints
              </button>
            </div>

            {/* Lockout Simulation Quick Trigger */}
            <div className="flex items-center justify-between pt-2 border-t border-amber-800/40 text-[11px] font-mono">
              <span className="text-amber-300/80">Lockout Testing:</span>
              <button
                onClick={() => {
                  const lockoutSeconds = 30;
                  setSimulatedLockoutUntil(Date.now() + lockoutSeconds * 1000);
                  setRemainingLockoutSeconds(lockoutSeconds);
                }}
                className="px-2.5 py-1 rounded-lg bg-red-950 hover:bg-red-900 border border-red-500/50 text-red-300 font-bold transition cursor-pointer"
              >
                Trigger 30s Lockout
              </button>
            </div>
          </div>

          <div className="space-y-1 mb-5">
            <p className="text-xs text-amber-200/80 font-serif leading-relaxed">
              Click any answer below to <strong>copy it instantly</strong>, then submit it via the bottom vault input or the unrolled scroll to illuminate the terrain paths and conquer each realm!
            </p>
            <p className="text-[11px] text-amber-400/90 font-mono flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Strict gating: Conquering all checkpoints in a realm unseals the slide forward.
            </p>
          </div>

          <div className="space-y-4">
            {CAMPAIGN_REALMS.map((realm) => {
              const theme = CHAPTER_THEMES[realm.id] || CHAPTER_THEMES[1];
              return (
                <div
                  key={`cheatsheet-realm-${realm.id}`}
                  className={`p-3.5 rounded-2xl bg-gradient-to-br ${theme.bgClass} border ${theme.borderClass} shadow-lg`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[10px] font-mono uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full border ${theme.badgeClass} shrink-0`}
                      >
                        {realm.title.split(":")[0]?.trim()}
                      </span>
                      <span className="text-xs font-serif font-bold text-amber-100 truncate">
                        {realm.title.split(":")[1]?.trim()}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400/70 shrink-0 font-bold">
                      {realm.puzzles.length} waypoints
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    {realm.puzzles.map((p) => {
                      // Lookup global ladder index
                      const globalPuzzle = ladder.find(
                        (lp) => lp.realmId === realm.id && lp.realmOrderIndex === p.orderIndex
                      );
                      const isSelected = Boolean(globalPuzzle);
                      const globalIdx = globalPuzzle ? globalPuzzle.orderIndex : null;
                      const isCopied = globalIdx !== null && copiedIndex === globalIdx;

                      return (
                        <div
                          key={`cs-p-${realm.id}-${p.orderIndex}`}
                          className={`flex justify-between items-center py-1 px-1.5 rounded-lg transition-colors border-b border-white/5 last:border-b-0 ${
                            isSelected ? "hover:bg-white/5" : "opacity-40 bg-black/20"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            {isSelected ? (
                              <span className="text-amber-400 font-bold shrink-0">
                                #{globalIdx}
                              </span>
                            ) : (
                              <span className="text-neutral-500 font-bold text-[10px] shrink-0">
                                [Pass-thru]
                              </span>
                            )}
                            <MapPin className="w-3 h-3 text-amber-500/60 shrink-0" />
                            <span className="text-amber-100/90 truncate text-[11px]">
                              {p.landmarkName}
                            </span>
                          </div>

                          <button
                            disabled={!isSelected}
                            onClick={() => globalIdx && handleCopyAnswer(globalIdx, p.answer)}
                            title={isSelected ? `Click to copy "${p.answer}"` : "Waypoint bypassed"}
                            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded font-bold text-[11px] border transition-all shrink-0 ${
                              !isSelected
                                ? "border-white/10 text-white/30 cursor-not-allowed"
                                : isCopied
                                ? "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)] cursor-pointer"
                                : "bg-black/60 hover:bg-black/90 border-amber-600/50 hover:border-yellow-400 text-yellow-300 cursor-pointer"
                            }`}
                          >
                            <span>{p.answer}</span>
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-200" />
                            ) : isSelected ? (
                              <Copy className="w-3 h-3 text-amber-400/70" />
                            ) : null}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
