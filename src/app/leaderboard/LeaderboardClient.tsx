"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Anchor, Trophy, RotateCcw } from "@/components/icons";
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
}

type TierFilter = "ALL" | "FIRST_YEAR" | "SENIOR";

export default function LeaderboardClient({ initialData }: LeaderboardClientProps) {
  const [data, setData] = useState<LeaderboardResult>(initialData);
  const [activeTier, setActiveTier] = useState<TierFilter>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedModalTeam, setSelectedModalTeam] = useState<{
    teamId: string;
    teamName: string;
    rank: number;
    batchTier: "FIRST_YEAR" | "SENIOR";
  } | null>(null);

  const fetchData = useCallback(async (tier: TierFilter) => {
    if (document.hidden) return; // Respect page visibility

    try {
      setIsRefreshing(true);
      const url = tier === "ALL" ? "/api/leaderboard" : `/api/leaderboard?tier=${tier}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Polling error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !selectedModalTeam) {
        fetchData(activeTier);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Pause polling while inspecting a team's score manifest to prevent unexpected re-renders/layout shifts
    if (selectedModalTeam) {
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }

    // Poll leaderboard every 2 minutes (120,000ms)
    const interval = setInterval(() => fetchData(activeTier), 120000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [fetchData, activeTier, selectedModalTeam]);

  const top5 = (data.entries || []).slice(0, 5);
  const rest = (data.entries || []).slice(5);

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

      {/* Sleek Floating Pill Tabs matching Dashboard + Manual Refresh Button */}
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
              "px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
              activeTier === tab.id
                ? "bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.5)] scale-[1.02]"
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            {tab.label}
          </button>
        ))}

        <div className="w-[1px] h-5 bg-white/20 mx-0.5" />

        <button
          onClick={() => fetchData(activeTier)}
          disabled={isRefreshing}
          className="px-3.5 py-2 rounded-full text-xs font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Refresh Standings Now"
        >
          <RotateCcw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
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
                {isRefreshing && (
                  <span className="text-xs text-amber-400 font-code animate-pulse flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Refreshing...
                  </span>
                )}
              </div>
              <FleetLedger 
                teams={rest} 
                showQuestionsSolved={data.showQuestionsSolved ?? true} 
                showPointHistory={isBreakdownEnabled}
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
