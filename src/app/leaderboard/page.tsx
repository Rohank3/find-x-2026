import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLeaderboardData, type LeaderboardResult } from "@/lib/scoring";
import LeaderboardClient from "./LeaderboardClient";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ORGANIZER";

  // getLeaderboardData deliberately logs-and-throws on DB failure (correct for
  // the API route's 500 contract), but letting that propagate here would 500
  // the whole public page. Degrade to an explicit error state instead —
  // the client's 10s poller self-heals the moment the database recovers.
  let data: LeaderboardResult | null = null;
  try {
    data = await getLeaderboardData(undefined, isAdmin);
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full flex-1 space-y-6 sm:space-y-8 font-mono text-white">
        <div className="relative border border-rose-500/30 bg-black/80 p-6 sm:p-10 backdrop-blur-md text-center space-y-3">
          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-rose-500/60" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-rose-500/60" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-rose-500/60" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-rose-500/60" />

          <h1 className="text-2xl font-black italic -skew-x-12 tracking-tight text-white uppercase">
            Leaderboard
          </h1>
          <div className="text-[10px] font-mono tracking-[0.3em] text-rose-400 uppercase">
            ∅ Signal Lost
          </div>
          <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
            Standings could not be retrieved right now. This page refreshes
            automatically — no action needed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full flex-1 space-y-6 sm:space-y-8 font-mono text-white">
      {/* Top Telemetry Header */}
      <div className="relative glass-panel p-4 sm:p-6">
        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white/60" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white/60" />
        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white/60" />
        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white/60" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-black italic -skew-x-12 tracking-tight text-white uppercase">
            Leaderboard
          </h1>
        </div>
      </div>

      <LeaderboardClient
        initialEntries={data.entries}
        isFrozen={data.isFrozen}
        initialTimelineData={data.timelineData}
        initialTopTeamNames={data.topTeamNames}
        showQuestionsSolved={data.showQuestionsSolved}
        showPointHistory={data.showPointHistory}
        hideTeamNames={data.hideTeamNames}
        isAdmin={isAdmin}
      />
    </div>
  );
}
