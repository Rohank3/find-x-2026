"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Anchor, Trophy } from "@/components/icons";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { LeaderboardResult } from "@/lib/scoring";
import WantedPosterGrid, { type TeamEntry } from "@/components/leaderboard/WantedPosterGrid";
import FleetLedger from "@/components/leaderboard/FleetLedger";

const ScoreBreakdownModal = dynamic(
  () => import("@/components/leaderboard/ScoreBreakdownModal"),
  { ssr: false }
);

interface LeaderboardClientProps {
  initialData: LeaderboardResult;
  isAdmin?: boolean;
  userTeamId?: string | null;
  userTeamName?: string | null;
}

type TierFilter = "ALL" | "FIRST_YEAR" | "SENIOR";

export default function LeaderboardClient({
  initialData,
  isAdmin = false,
  userTeamId,
  userTeamName,
}: LeaderboardClientProps) {
  const [data, setData] = useState<LeaderboardResult>(initialData);
  const [activeTier, setActiveTier] = useState<TierFilter>("ALL");
  const [selectedModalTeam, setSelectedModalTeam] = useState<{
    teamId: string;
    teamName: string;
    rank: number;
    batchTier: "FIRST_YEAR" | "SENIOR";
  } | null>(null);

  // Silent background fetch: updates standings seamlessly without displaying loading blocks
  const fetchData = useCallback(async (tier: TierFilter) => {
    if (document.hidden) return; // Respect page visibility

    try {
      const params = new URLSearchParams();
      if (tier !== "ALL") params.set("tier", tier);
      if (isAdmin) params.set("admin", "true");
      const queryString = params.toString();
      const url = queryString ? `/api/leaderboard?${queryString}` : "/api/leaderboard";

      const res = await fetch(url);
      if (res.status === 304) {
        // Content unmodified (ETag matched)
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      // Quiet background failure handling
    }
  }, [isAdmin]);

  useEffect(() => {
    // Pause background polling while inspecting team score breakdown modal to prevent layout shifts
    if (selectedModalTeam) return;

    // Adaptive polling: 2 minutes for admins (prevents Vercel function churn on private uncached data),
    // 20 seconds for students (shielded by Vercel Edge CDN cache, preserves monthly quota)
    const isViewerAdmin = Boolean(isAdmin || data.isAdminViewer);
    const pollIntervalMs = isViewerAdmin ? 120000 : 20000;
    let timer: NodeJS.Timeout | null = null;

    const resetTimer = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        void fetchData(activeTier);
      }, pollIntervalMs);
    };

    resetTimer();

    const handleVisibilityChange = () => {
      if (!document.hidden && !selectedModalTeam) {
        void fetchData(activeTier);
        resetTimer(); // Reset the 120s countdown whenever the user switches back
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchData, activeTier, selectedModalTeam, data.isAdminViewer, isAdmin]);

  const top5 = (data.entries || []).slice(0, 5);
  const rest = (data.entries || []).slice(5);

  const myTeamEntry = userTeamId
    ? (data.entries || []).find((entry) => entry.teamId === userTeamId)
    : null;

  // Admins can always inspect team score history, even if public breakdown is disabled
  const isBreakdownEnabled = Boolean((data.showPointHistory ?? true) || data.isAdminViewer);
  const activeModalTeam = isBreakdownEnabled ? selectedModalTeam : null;

  const handleCloseModal = useCallback(() => {
    setSelectedModalTeam(null);
  }, []);

  const handlePosterClick = (team: TeamEntry) => {
    if (!isBreakdownEnabled) return;
    setSelectedModalTeam({
      teamId: team.teamId,
      teamName: team.teamName,
      rank: team.rank,
      batchTier: team.batchTier,
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {data.isFrozen && (
        <div className="w-full rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 p-4 flex items-center justify-center gap-3 backdrop-blur-md shadow-[0_0_20px_rgba(251,191,36,0.2)]">
          <Anchor className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="font-sans font-bold text-sm tracking-wider uppercase">
            Leaderboard frozen at freeze-time
          </span>
        </div>
      )}

      {/* Logged-In User's Crew Quick HUD Banner */}
      {myTeamEntry && (
        <div className="w-full rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 border border-amber-400/40 p-3 sm:p-4 backdrop-blur-xl shadow-[0_0_25px_rgba(251,191,36,0.15)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center font-sans font-black text-amber-300 text-lg sm:text-xl shadow-inner shrink-0">
              #{myTeamEntry.rank}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <span className="font-sans font-black text-white text-base sm:text-lg tracking-tight">
                  {userTeamName || myTeamEntry.teamName}
                </span>
                <span className="text-[10px] font-sans font-black uppercase tracking-wider bg-amber-400 text-black px-2 py-0.5 rounded-full shadow-sm">
                  ★ Your Crew
                </span>
                {userTeamName && myTeamEntry.teamName !== userTeamName && (
                  <span className="text-[11px] font-mono text-amber-300/90 bg-black/50 px-2 py-0.5 rounded border border-amber-400/30">
                    Public Disguise: {myTeamEntry.teamName}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-white/60 mt-0.5">
                {myTeamEntry.batchTier === "FIRST_YEAR" ? "1st Year '26 Fleet" : "Senior Fleet"}
                {data.showQuestionsSolved && ` • ${myTeamEntry.puzzlesSolved} Conquered Quests`}
              </p>
            </div>
          </div>
          <div className="sm:text-right shrink-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400/80 font-bold">Current Bounty</p>
            <p className="font-sans font-black text-xl sm:text-2xl text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">
              ฿ {myTeamEntry.score.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Sleek Floating Pill Tabs matching Dashboard */}
      <div className="flex items-center justify-center p-1.5 rounded-full bg-black/60 backdrop-blur-2xl border border-white/10 shadow-xl gap-2 mx-auto w-fit">
        {[
          { id: "ALL", label: "All Crews" },
          { id: "FIRST_YEAR", label: "Freshers ('26)" },
          { id: "SENIOR", label: "Senior Fleet" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              const newTier = tab.id as TierFilter;
              setActiveTier(newTier);
              fetchData(newTier);
            }}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95",
              activeTier === tab.id
                ? "bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.5)] scale-[1.02]"
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTier}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="space-y-10"
        >
          {top5.length > 0 ? (
            <section>
              <h2 className="sr-only">Most Wanted</h2>
              <WantedPosterGrid
                teams={top5}
                showQuestionsSolved={data.showQuestionsSolved ?? true}
                onTeamClick={isBreakdownEnabled ? handlePosterClick : undefined}
                isClickable={isBreakdownEnabled}
                userTeamId={userTeamId}
                userTeamName={userTeamName}
              />
            </section>
          ) : (
            <div className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-12 text-center text-white/50 font-code text-sm shadow-2xl flex flex-col items-center gap-3">
              <Trophy className="w-10 h-10 text-white/20" />
              <span>No scores recorded yet.</span>
            </div>
          )}

          {rest.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-black font-sans uppercase tracking-wider text-white flex items-center gap-2">
                  <Anchor className="w-4.5 h-4.5 text-amber-400" />
                  Leaderboard
                </h2>
              </div>
              <FleetLedger 
                teams={rest} 
                showQuestionsSolved={data.showQuestionsSolved ?? true} 
                showPointHistory={isBreakdownEnabled}
                userTeamId={userTeamId}
                userTeamName={userTeamName}
              />
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Unified Score Breakdown, Crew Roster & Trajectory Modal for Wanted Posters */}
      {activeModalTeam && (
        <ScoreBreakdownModal
          isOpen={!!activeModalTeam}
          onClose={handleCloseModal}
          teamId={activeModalTeam.teamId}
          teamName={activeModalTeam.teamName}
          teamRank={activeModalTeam.rank}
          batchTier={activeModalTeam.batchTier}
        />
      )}
    </div>
  );
}
