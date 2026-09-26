"use client";

import React, { useState } from 'react';
import { Compass, ArrowLeft, ArrowRight } from "@/components/icons";
import { cn } from '@/lib/utils';
import ScoreBreakdownModal from '@/components/leaderboard/ScoreBreakdownModal';

interface TeamEntry {
  rank: number;
  teamId: string;
  teamName: string;
  batchTier: 'FIRST_YEAR' | 'SENIOR';
  isFirstYear: boolean;
  score: number;
  puzzlesSolved: number;
  lastSolveTime: string | Date | null;
}

interface FleetLedgerProps {
  teams: TeamEntry[];
  showQuestionsSolved: boolean;
  showPointHistory?: boolean;
  isClickable?: boolean;
}

function formatSolveTime(time: string | Date | null): string {
  if (!time) return '-';
  const d = new Date(time);
  if (isNaN(d.getTime())) return '-';
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
  return `${formattedHours}:${minutes} ${ampm}`;
}

export default function FleetLedger({
  teams,
  showQuestionsSolved,
  showPointHistory = true,
  isClickable: propIsClickable,
}: FleetLedgerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTeam, setSelectedTeam] = useState<{ teamId: string; teamName: string; rank: number; batchTier: 'FIRST_YEAR' | 'SENIOR' } | null>(null);
  const isClickable = propIsClickable !== undefined ? propIsClickable : showPointHistory;
  const activeTeam = isClickable ? selectedTeam : null;

  const TEAMS_PER_PAGE = 20;

  // Hide the Solved column if the flag is off OR if every team has 0 solves (backend zeroed them out)
  const hasAnySolves = teams.some((t) => t.puzzlesSolved > 0);
  const showSolvedColumn = showQuestionsSolved && hasAnySolves;

  const totalPages = Math.max(1, Math.ceil(teams.length / TEAMS_PER_PAGE));
  const startIndex = (currentPage - 1) * TEAMS_PER_PAGE;
  const currentTeams = teams.slice(startIndex, startIndex + TEAMS_PER_PAGE);

  if (teams.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl text-center space-y-3">
        <Compass className="w-12 h-12 text-white/20 animate-spin-slow mb-2" />
        <p className="font-sans font-bold text-base text-white/70 uppercase tracking-wider">No teams to display.</p>
        <p className="font-code text-xs text-white/40">Scores will appear here once teams start solving.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-4">
      <div className="overflow-x-auto rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl p-2 sm:p-4">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="p-4 font-sans font-black text-white/60 text-xs uppercase tracking-wider text-center w-16">Rank</th>
              <th className="p-4 font-sans font-black text-white/60 text-xs uppercase tracking-wider">Crew Name</th>
              <th className="p-4 font-sans font-black text-white/60 text-xs uppercase tracking-wider">Fleet</th>
              <th className="p-4 font-sans font-black text-white/60 text-xs uppercase tracking-wider text-right">Fleet Bounty</th>
              {showSolvedColumn && (
                <th className="p-4 font-sans font-black text-white/60 text-xs uppercase tracking-wider text-center">Solved</th>
              )}
              <th className="p-4 font-sans font-black text-white/60 text-xs uppercase tracking-wider text-right">Last Solve</th>
            </tr>
          </thead>
          <tbody>
            {currentTeams.map((team, idx) => (
              <tr 
                key={team.teamId} 
                className={cn(
                  "border-b border-white/5 hover:bg-white/[0.04] transition-colors",
                  idx % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent"
                )}
              >
                <td className="p-4 font-sans font-black text-white text-center text-lg">{team.rank}</td>
                <td 
                  className={cn(
                    "p-4 font-sans font-bold text-white text-base tracking-tight truncate max-w-[220px] transition-colors",
                    isClickable
                      ? "cursor-pointer hover:text-amber-400 hover:underline focus:outline-none focus-visible:text-amber-400 active:text-amber-300"
                      : "cursor-default select-none"
                  )}
                  onClick={
                    isClickable
                      ? () => setSelectedTeam({ teamId: team.teamId, teamName: team.teamName, rank: team.rank, batchTier: team.batchTier })
                      : undefined
                  }
                  role={isClickable ? "button" : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  aria-label={isClickable ? `View score breakdown for ${team.teamName}` : undefined}
                  onKeyDown={
                    isClickable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedTeam({ teamId: team.teamId, teamName: team.teamName, rank: team.rank, batchTier: team.batchTier });
                          }
                        }
                      : undefined
                  }
                >
                  {team.teamName}
                </td>
                <td className="p-4">
                  {team.batchTier === 'FIRST_YEAR' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                      Fresher &apos;26
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-[10px] font-bold uppercase tracking-wider">
                      Senior Fleet
                    </span>
                  )}
                </td>
                <td className={cn(
                  "p-4 font-sans font-black text-xl text-right whitespace-nowrap",
                  team.score < 0
                    ? "text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.5)]"
                    : "text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                )}>
                  {team.score < 0 ? `-฿ ${Math.abs(team.score).toLocaleString()}` : `฿ ${team.score.toLocaleString()}`}
                </td>
                {showSolvedColumn && (
                  <td className="p-4 text-center font-code font-bold text-emerald-400 text-sm">
                    {team.puzzlesSolved}
                  </td>
                )}
                <td className="p-4 text-right font-code text-white/50 text-xs" suppressHydrationWarning>
                  {formatSolveTime(team.lastSolveTime)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-xl">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 font-sans font-bold text-xs uppercase tracking-wider text-white hover:text-amber-300 hover:bg-white/10 disabled:opacity-30 disabled:hover:text-white disabled:hover:bg-transparent transition-all rounded-xl border border-white/10 bg-white/[0.03]"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>
          
          <span className="font-code text-xs font-bold text-white/70">
            Page <strong className="text-amber-400">{currentPage}</strong> of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 font-sans font-bold text-xs uppercase tracking-wider text-white hover:text-amber-300 hover:bg-white/10 disabled:opacity-30 disabled:hover:text-white disabled:hover:bg-transparent transition-all rounded-xl border border-white/10 bg-white/[0.03]"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTeam && (
        <ScoreBreakdownModal 
          isOpen={!!activeTeam}
          onClose={() => setSelectedTeam(null)}
          teamId={activeTeam.teamId}
          teamName={activeTeam.teamName}
          teamRank={activeTeam.rank}
          batchTier={activeTeam.batchTier}
        />
      )}
    </div>
  );
}
