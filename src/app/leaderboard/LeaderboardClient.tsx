"use client";

import React, { useState, useEffect } from "react";
import { TeamLeaderboardEntry, TimelineDataPoint } from "@/lib/scoring";
import TimelineChart from "@/components/leaderboard/TimelineChart";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { RefreshCw } from "lucide-react";

interface LeaderboardClientProps {
  initialEntries: TeamLeaderboardEntry[];
  isFrozen: boolean;
  initialTimelineData: TimelineDataPoint[];
  initialTopTeamNames: string[];
  showQuestionsSolved?: boolean;
  showPointHistory?: boolean;
  hideTeamNames?: boolean;
  isAdmin?: boolean;
}

export default function LeaderboardClient({
  initialEntries,
  isFrozen,
  initialTimelineData,
  initialTopTeamNames,
  showQuestionsSolved: initialShowQuestionsSolved = true,
  showPointHistory: initialShowPointHistory = true,
  hideTeamNames: initialHideTeamNames = false,
  isAdmin = false,
}: LeaderboardClientProps) {
  const [activeTier, setActiveTier] = useState<"ALL" | "FIRST_YEAR" | "SENIOR">("ALL");
  const [entries, setEntries] = useState<TeamLeaderboardEntry[]>(initialEntries);
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>(initialTimelineData);
  const [topTeamNames, setTopTeamNames] = useState<string[]>(initialTopTeamNames);
  const [showQuestionsSolved, setShowQuestionsSolved] = useState<boolean>(initialShowQuestionsSolved);
  const [showPointHistory, setShowPointHistory] = useState<boolean>(initialShowPointHistory);
  const [hideTeamNames, setHideTeamNames] = useState<boolean>(initialHideTeamNames);
  // Spinner only for explicit refreshes (tier changes); background polls swap
  // data in place so the 10s cycle does not flicker the header icon.
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter entries according to active tier
  const filteredEntries = entries.filter((e) => {
    if (activeTier === "FIRST_YEAR") return e.isFirstYear;
    if (activeTier === "SENIOR") return !e.isFirstYear;
    return true;
  });

  // Re-rank filtered view
  const reRankedEntries = filteredEntries.map((e, index) => ({
    ...e,
    rank: index + 1,
  }));

  // Fetch data for a specific tier
  const fetchTierData = async (
    tier: "ALL" | "FIRST_YEAR" | "SENIOR",
    opts: { manual?: boolean } = {}
  ) => {
    try {
      if (opts.manual) setIsRefreshing(true);
      const param = tier === "ALL" ? "" : `?tier=${tier}`;
      const res = await fetch(`/api/leaderboard${param}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        setTimelineData(data.timelineData);
        setTopTeamNames(data.topTeamNames);
        if (typeof data.showQuestionsSolved === "boolean") {
          setShowQuestionsSolved(data.showQuestionsSolved);
        }
        if (typeof data.showPointHistory === "boolean") {
          setShowPointHistory(data.showPointHistory);
        }
        if (typeof data.hideTeamNames === "boolean") {
          setHideTeamNames(data.hideTeamNames);
        }
      }
    } catch (err) {
      console.error("[Leaderboard poll error]", err);
    } finally {
      if (opts.manual) setIsRefreshing(false);
    }
  };

  const handleTierChange = (tier: "ALL" | "FIRST_YEAR" | "SENIOR") => {
    setActiveTier(tier);
    fetchTierData(tier, { manual: true });
  };

  // Smart polling every 10 seconds — paused while the tab is hidden so the
  // browser does not queue useless fetches for a page nobody can see.
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) fetchTierData(activeTier);
    }, 10000);

    const handleVisibility = () => {
      if (!document.hidden) {
        // Refresh immediately when the tab becomes visible again.
        fetchTierData(activeTier);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [activeTier]);

  return (
    <div className="space-y-6">
      {/* Admin Telemetry Indicator when team names are masked for participants */}
      {isAdmin && hideTeamNames && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border border-amber-500/40 bg-amber-950/25 p-3.5 text-xs text-amber-300 font-mono gap-2">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-bold tracking-wider uppercase">
              Admin View Active • Squad names visible to you (masked for participants &amp; public viewers)
            </span>
          </div>
          <span className="text-[10px] text-amber-400/70 uppercase tracking-widest">
            Privacy: Ranks &amp; Points Only
          </span>
        </div>
      )}

      {/* Top Timeline Colored Line Graph with Track Selection */}
      <TimelineChart
        data={timelineData}
        topTeamNames={topTeamNames}
        activeTier={activeTier}
        onTierChange={handleTierChange}
      />

      {/* Podium Table */}
      <LeaderboardTable
        initialEntries={reRankedEntries}
        isFrozen={isFrozen}
        activeTier={activeTier}
        onTierChange={handleTierChange}
        showQuestionsSolved={showQuestionsSolved}
        showPointHistory={showPointHistory}
        hideTeamNames={hideTeamNames}
        isAdmin={isAdmin}
      />

      <div className="flex items-center justify-end text-[11px] font-mono text-slate-500 space-x-2">
        <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
        <span>Updates automatically every 10 seconds.</span>
      </div>
    </div>
  );
}
