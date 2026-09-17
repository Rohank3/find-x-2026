"use client";

import React, { useState } from "react";
import { Trophy, Medal, Users } from "lucide-react";
import { TeamLeaderboardEntry } from "@/lib/scoring";
import { formatTimestamp } from "@/lib/utils";
import TeamScoreBreakdownModal from "./TeamScoreBreakdownModal";
import AdminTeamRosterModal from "@/components/team/AdminTeamRosterModal";

interface LeaderboardTableProps {
  initialEntries: TeamLeaderboardEntry[];
  isFrozen: boolean;
  activeTier: "ALL" | "FIRST_YEAR" | "SENIOR";
  onTierChange: (tier: "ALL" | "FIRST_YEAR" | "SENIOR") => void;
  showQuestionsSolved?: boolean;
  showPointHistory?: boolean;
  hideTeamNames?: boolean;
  isAdmin?: boolean;
}

export default function LeaderboardTable({
  initialEntries,
  isFrozen,
  activeTier,
  onTierChange,
  showQuestionsSolved = true,
  showPointHistory = true,
  isAdmin = false,
}: LeaderboardTableProps) {
  const [selectedBreakdownTeam, setSelectedBreakdownTeam] = useState<TeamLeaderboardEntry | null>(null);
  const [selectedRosterTeam, setSelectedRosterTeam] = useState<TeamLeaderboardEntry | null>(null);

  // Compute total dynamic column count for empty state colSpan
  let colSpanCount = 4; // Rank, Team, Category, Score
  if (showQuestionsSolved) colSpanCount += 1;
  if (showPointHistory) colSpanCount += 1;
  colSpanCount += 1; // Last Solve

  return (
    <>
      <div className="relative glass-panel font-mono text-[hsl(45_40%_97%)] my-4">
        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[hsl(45_68%_47%)]" />
        <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-[hsl(45_40%_97%/0.4)]" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-[hsl(45_40%_97%/0.4)]" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[hsl(45_40%_97%/0.4)]" />

        {/* Tier Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-[hsl(45_40%_97%/0.08)] gap-3 bg-[hsl(0_0%_2%/0.7)]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onTierChange("FIRST_YEAR")}
              className={`px-3.5 py-2 text-xs uppercase tracking-wider border transition ${
                activeTier === "FIRST_YEAR"
                  ? "border-[hsl(45_68%_47%)] bg-[hsl(45_68%_47%)] text-[hsl(0_0%_2%)] font-bold shadow-[0_0_12px_-2px_rgba(201,151,38,0.4)]"
                  : "border-[hsl(45_40%_97%/0.12)] text-[hsl(45_40%_97%/0.6)] hover:border-[hsl(45_68%_47%/0.5)] hover:text-[hsl(45_40%_97%)]"
              }`}
            >
              1st-Year Track (Batch 2026)
            </button>
            <button
              type="button"
              onClick={() => onTierChange("SENIOR")}
              className={`px-3.5 py-2 text-xs uppercase tracking-wider border transition ${
                activeTier === "SENIOR"
                  ? "border-[hsl(45_68%_47%)] bg-[hsl(45_68%_47%)] text-[hsl(0_0%_2%)] font-bold shadow-[0_0_12px_-2px_rgba(201,151,38,0.4)]"
                  : "border-[hsl(45_40%_97%/0.12)] text-[hsl(45_40%_97%/0.6)] hover:border-[hsl(45_68%_47%/0.5)] hover:text-[hsl(45_40%_97%)]"
              }`}
            >
              Senior Track
            </button>
            <button
              type="button"
              onClick={() => onTierChange("ALL")}
              className={`px-3.5 py-2 text-xs uppercase tracking-wider border transition ${
                activeTier === "ALL"
                  ? "border-[hsl(45_68%_47%)] bg-[hsl(45_68%_47%)] text-[hsl(0_0%_2%)] font-bold shadow-[0_0_12px_-2px_rgba(201,151,38,0.4)]"
                  : "border-[hsl(45_40%_97%/0.12)] text-[hsl(45_40%_97%/0.6)] hover:border-[hsl(45_68%_47%/0.5)] hover:text-[hsl(45_40%_97%)]"
              }`}
            >
              Overall Standings
            </button>
          </div>

          {isFrozen && (
            <div className="flex items-center space-x-2 text-xs text-rose-400 border border-rose-500/40 bg-rose-950/20 px-3 py-1.5 uppercase tracking-widest">
              <span className="h-2 w-2 bg-rose-400 animate-pulse" />
              <span>Leaderboard Frozen • Final Scores Pending</span>
            </div>
          )}
        </div>

        {/* MOBILE ONLY: Responsive Leaderboard Cards */}
        <div className="md:hidden divide-y divide-white/[0.06]">
          {initialEntries.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 uppercase tracking-wider text-xs">
              No teams found
            </div>
          ) : (
            initialEntries.map((team) => {
              const isGold = team.rank === 1;
              const isSilver = team.rank === 2;
              const isBronze = team.rank === 3;

              return (
                <div
                  key={team.teamId}
                  className={`p-3.5 space-y-2.5 transition ${
                    isGold
                      ? "bg-amber-400/[0.04] border-l-2 border-l-amber-400"
                      : isSilver
                      ? "bg-white/[0.02] border-l-2 border-l-zinc-300"
                      : isBronze
                      ? "bg-white/[0.01] border-l-2 border-l-amber-700"
                      : ""
                  }`}
                >
                  {/* Top line: Rank, Category, and Score */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs">
                        {isGold && (
                          <span className="text-amber-400 flex items-center font-black">
                            <Trophy className="h-3.5 w-3.5 mr-1 text-amber-400" /> #01
                          </span>
                        )}
                        {isSilver && (
                          <span className="text-zinc-200 flex items-center font-black">
                            <Medal className="h-3.5 w-3.5 mr-1 text-zinc-300" /> #02
                          </span>
                        )}
                        {isBronze && (
                          <span className="text-amber-600 flex items-center font-black">
                            <Medal className="h-3.5 w-3.5 mr-1 text-amber-700" /> #03
                          </span>
                        )}
                        {!isGold && !isSilver && !isBronze && (
                          <span className="text-zinc-400 font-mono">#{team.rank.toString().padStart(2, "0")}</span>
                        )}
                      </span>

                      {team.isFirstYear ? (
                        <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider border border-amber-500/30 text-amber-300 bg-amber-500/10">
                          1st Year
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider border border-white/10 text-white/50">
                          Senior
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-black text-sm text-[hsl(45_68%_47%)] font-mono tracking-tight">
                        {team.score} pts
                      </span>
                    </div>
                  </div>

                  {/* Team Name and Members */}
                  <div>
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => setSelectedRosterTeam(team)}
                        className="text-left w-full group"
                      >
                        <span className="font-bold text-white uppercase tracking-wider text-xs group-hover:text-amber-400 transition block">
                          {team.teamName}
                        </span>
                        {team.members.length > 0 && (
                          <div className="text-[10px] text-white/40 flex items-center space-x-1 tracking-wide mt-0.5 truncate">
                            <Users className="h-3 w-3 text-amber-400/50 shrink-0" />
                            <span className="truncate">
                              {team.members.map((m) => m.name || (m.email ? m.email.split("@")[0] : "Student")).join(" • ")}
                            </span>
                          </div>
                        )}
                      </button>
                    ) : (
                      <span className="font-bold text-white uppercase tracking-wider text-xs block">
                        {team.teamName}
                      </span>
                    )}
                  </div>

                  {/* Bottom line: Solves, Last solve time, and Score Log button */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[10px] text-white/40">
                    <div className="flex items-center space-x-2">
                      {showQuestionsSolved && (
                        <span>
                          <strong className="text-white">{team.puzzlesSolved}</strong> Solved
                        </span>
                      )}
                      {team.lastSolveTime && (
                        <>
                          <span>•</span>
                          <span suppressHydrationWarning>{formatTimestamp(team.lastSolveTime)}</span>
                        </>
                      )}
                    </div>

                    {showPointHistory && (
                      <button
                        type="button"
                        onClick={() => setSelectedBreakdownTeam(team)}
                        className="px-2.5 py-1 text-[10px] uppercase tracking-wider border border-white/20 hover:border-amber-400 hover:text-amber-400 bg-white/5 transition min-h-[32px] flex items-center"
                      >
                        Score Log
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#060608] text-[10px] text-zinc-400 uppercase tracking-widest">
                <th className="py-3 px-4 w-20">Rank</th>
                <th className="py-3 px-4">Team / Members</th>
                <th className="py-3 px-4 w-32">Category</th>
                {showQuestionsSolved && (
                  <th className="py-3 px-4 w-24 text-center">Solves</th>
                )}
                {showPointHistory && (
                  <th className="py-3 px-4 w-28 text-center">Breakdown</th>
                )}
                <th className="py-3 px-4 w-36 text-right">Last Solve</th>
                <th className="py-3 px-4 w-28 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {initialEntries.length === 0 ? (
                <tr>
                  <td colSpan={colSpanCount} className="py-12 text-center text-zinc-500 uppercase tracking-wider">
                    No teams found
                  </td>
                </tr>
              ) : (
                initialEntries.map((team) => {
                  const isGold = team.rank === 1;
                  const isSilver = team.rank === 2;
                  const isBronze = team.rank === 3;

                  return (
                    <tr
                      key={team.teamId}
                      className={`hover:bg-white/[0.035] transition ${
                        isGold
                          ? "bg-amber-400/[0.03]"
                          : isSilver
                          ? "bg-white/[0.02]"
                          : isBronze
                          ? "bg-white/[0.01]"
                          : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold">
                        {isGold && <span className="text-amber-400 text-xs flex items-center"><Trophy className="h-3.5 w-3.5 mr-1 text-amber-400" /> #01</span>}
                        {isSilver && <span className="text-zinc-200 text-xs flex items-center"><Medal className="h-3.5 w-3.5 mr-1 text-zinc-400" /> #02</span>}
                        {isBronze && <span className="text-zinc-400 text-xs flex items-center"><Medal className="h-3.5 w-3.5 mr-1 text-amber-700" /> #03</span>}
                        {!isGold && !isSilver && !isBronze && (
                          <span className="text-zinc-500">#{team.rank.toString().padStart(2, "0")}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => setSelectedRosterTeam(team)}
                            className="text-left group cursor-pointer w-full focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 -m-1 p-1 rounded-sm"
                            title="Admin: Click team name to view member roster"
                          >
                            <span className="font-bold text-white uppercase tracking-wider text-xs group-hover:text-amber-400 transition block">
                              {team.teamName}
                            </span>
                            {team.members.length > 0 && (
                              <div className="text-[10px] text-white/40 group-hover:text-white/70 flex items-center space-x-1 tracking-wide transition mt-0.5">
                                <Users className="h-3 w-3 text-amber-400/50 shrink-0" />
                                <span>
                                  {team.members.map((m) => m.name || (m.email ? m.email.split("@")[0] : "Student")).join(" • ")}
                                </span>
                              </div>
                            )}
                          </button>
                        ) : (
                          <div>
                            <span className="font-bold text-white uppercase tracking-wider text-xs">
                              {team.teamName}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {team.isFirstYear ? (
                          <span className="inline-block px-2 py-0.5 text-[9px] uppercase tracking-wider border border-white/20 text-white/70">
                            1ST YEAR
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[9px] uppercase tracking-wider border border-white/10 text-white/40">
                            SENIOR
                          </span>
                        )}
                      </td>

                      {showQuestionsSolved && (
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 border border-white/10 bg-black text-white text-[11px]">
                            {team.puzzlesSolved}
                          </span>
                        </td>
                      )}

                      {showPointHistory && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedBreakdownTeam(team)}
                            className="px-2 py-0.5 text-[10px] uppercase tracking-wider border border-white/20 hover:border-amber-400 hover:text-amber-400 bg-white/5 transition"
                          >
                            Score Log
                          </button>
                        </td>
                      )}

                      <td className="py-3.5 px-4 text-right text-white/40 text-[11px] tracking-wider" suppressHydrationWarning>
                        {team.lastSolveTime ? formatTimestamp(team.lastSolveTime) : "—"}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-sm text-white tracking-tight">
                        {team.score} pts
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Point History & Score Breakdown Modal */}
      {selectedBreakdownTeam && (
        <TeamScoreBreakdownModal
          team={selectedBreakdownTeam}
          onClose={() => setSelectedBreakdownTeam(null)}
        />
      )}

      {/* Admin Team Members Inspection Modal */}
      {isAdmin && selectedRosterTeam && (
        <AdminTeamRosterModal
          team={selectedRosterTeam}
          onClose={() => setSelectedRosterTeam(null)}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}

