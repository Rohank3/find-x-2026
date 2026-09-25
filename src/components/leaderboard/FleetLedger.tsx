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
}

export default function FleetLedger({ teams, showQuestionsSolved }: FleetLedgerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTeam, setSelectedTeam] = useState<{ teamId: string; teamName: string; rank: number; batchTier: 'FIRST_YEAR' | 'SENIOR' } | null>(null);
  const TEAMS_PER_PAGE = 20;

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
              {showQuestionsSolved && (
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
                  className="p-4 font-sans font-bold text-white text-base tracking-tight truncate max-w-[220px] cursor-pointer hover:text-amber-400 hover:underline transition-colors"
                  onClick={() => setSelectedTeam({ teamId: team.teamId, teamName: team.teamName, rank: team.rank, batchTier: team.batchTier })}
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
                <td className="p-4 font-sans font-black text-amber-400 text-xl text-right whitespace-nowrap drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
                  ฿ {team.score.toLocaleString()}
                </td>
                {showQuestionsSolved && (
                  <td className="p-4 text-center font-code font-bold text-emerald-400 text-sm">
                    {team.puzzlesSolved}
                  </td>
                )}
                <td className="p-4 text-right font-code text-white/50 text-xs">
                  {team.lastSolveTime ? new Date(team.lastSolveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
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

      <ScoreBreakdownModal 
        isOpen={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        teamId={selectedTeam?.teamId || ''}
        teamName={selectedTeam?.teamName || ''}
        teamRank={selectedTeam?.rank || 0}
        batchTier={selectedTeam?.batchTier || 'FIRST_YEAR'}
      />
    </div>
  );
}
