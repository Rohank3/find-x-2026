"use client";

import React, { useState } from 'react';
import { Compass, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const TEAMS_PER_PAGE = 20;

  const totalPages = Math.max(1, Math.ceil(teams.length / TEAMS_PER_PAGE));
  const startIndex = (currentPage - 1) * TEAMS_PER_PAGE;
  const currentTeams = teams.slice(startIndex, startIndex + TEAMS_PER_PAGE);

  if (teams.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center border-2 border-amber-500/30 bg-voyage-ocean/50 backdrop-blur-sm rounded-lg text-amber-200">
        <Compass className="w-16 h-16 opacity-50 mb-4 animate-pulse text-amber-400" />
        <p className="font-cinzel text-xl text-amber-400/80">No crews have ventured this far...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border-2 border-amber-500/50 bg-voyage-abyss shadow-[0_0_20px_rgba(245,158,11,0.1)]">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-voyage-ocean border-b-2 border-amber-500/50">
              <th className="p-4 font-cinzel text-amber-400 text-center w-16">Rank</th>
              <th className="p-4 font-cinzel text-amber-400">Crew Name</th>
              <th className="p-4 font-cinzel text-amber-400">Category</th>
              <th className="p-4 font-cinzel text-amber-400 text-right">Bounty</th>
              {showQuestionsSolved && (
                <th className="p-4 font-cinzel text-amber-400 text-center">Islands Conquered</th>
              )}
              <th className="p-4 font-cinzel text-amber-400 text-right">Last Charted</th>
            </tr>
          </thead>
          <tbody>
            {currentTeams.map((team, idx) => (
              <tr 
                key={team.teamId} 
                className={cn(
                  "border-b border-amber-500/20 hover:bg-voyage-ocean/30 transition-colors",
                  idx % 2 === 0 ? "bg-white/5" : "bg-transparent"
                )}
              >
                <td className="p-4 font-cinzel font-bold text-amber-100 text-center text-lg">{team.rank}</td>
                <td className="p-4 font-pirata text-amber-100 text-xl tracking-wide truncate max-w-[200px]">{team.teamName}</td>
                <td className="p-4">
                  {team.batchTier === 'FIRST_YEAR' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded bg-amber-500/20 border border-amber-500/50 text-amber-400 text-xs font-bold uppercase tracking-wider">
                      Fresher
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded bg-slate-500/20 border border-slate-500/50 text-slate-300 text-xs font-bold uppercase tracking-wider">
                      Senior
                    </span>
                  )}
                </td>
                <td className="p-4 font-pirata text-amber-400 text-2xl text-right whitespace-nowrap">
                  ฿ {team.score.toLocaleString()}
                </td>
                {showQuestionsSolved && (
                  <td className="p-4 text-center font-code text-amber-100/70">{team.puzzlesSolved}</td>
                )}
                <td className="p-4 text-right font-code text-amber-100/50 text-sm">
                  {team.lastSolveTime ? new Date(team.lastSolveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-4 py-3 bg-voyage-ocean/40 border border-amber-500/30 rounded-md">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 font-cinzel text-amber-400 hover:text-amber-300 disabled:opacity-50 disabled:hover:text-amber-400 transition-colors rope-border border border-amber-500/50 rounded bg-voyage-abyss"
          >
            <ArrowLeft className="w-4 h-4" /> Previous Voyage
          </button>
          
          <span className="font-cinzel text-amber-400 font-bold">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 font-cinzel text-amber-400 hover:text-amber-300 disabled:opacity-50 disabled:hover:text-amber-400 transition-colors rope-border border border-amber-500/50 rounded bg-voyage-abyss"
          >
            Next Voyage <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
