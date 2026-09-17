"use client";

import React, { useEffect } from "react";
import { TeamLeaderboardEntry } from "@/lib/scoring";

interface TeamScoreBreakdownModalProps {
  team: TeamLeaderboardEntry | null;
  onClose: () => void;
}

export default function TeamScoreBreakdownModal({
  team,
  onClose,
}: TeamScoreBreakdownModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (team) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [team, onClose]);

  if (!team) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl border border-white/20 bg-zinc-950 p-4 sm:p-6 shadow-2xl text-white max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brutalist targeting corner ticks */}
        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400" />
        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400" />
        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3 sm:pb-4 shrink-0 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">
                RANK #{team.rank} • {team.batchTier === "FIRST_YEAR" ? "1ST YEAR" : "SENIOR"}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white mt-0.5">
              {team.teamName}
            </h2>
            <div className="text-[10px] sm:text-[11px] text-white/50 mt-0.5">
              Score Breakdown &amp; Audit Ledger
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-1.5 min-h-[36px] min-w-[36px] text-xs transition flex items-center justify-center"
            aria-label="Close modal"
          >
            [ESC]
          </button>
        </div>

        {/* KPI Score Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 shrink-0">
          <div className="border border-white/10 bg-white/5 p-2.5 text-center">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">Net Score</div>
            <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
              {team.score} pts
            </div>
          </div>
          <div className="border border-white/10 bg-white/5 p-2.5 text-center">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">Solves Gain</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
              +{team.totalGained} pts
            </div>
          </div>
          <div className="border border-white/10 bg-white/5 p-2.5 text-center">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">Hint Deductions</div>
            <div className="text-base font-bold text-rose-400 font-mono mt-0.5">
              -{team.totalPenalties} pts
            </div>
          </div>
          <div className="border border-white/10 bg-white/5 p-2.5 text-center">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">Adjustments</div>
            <div
              className={`text-base font-bold font-mono mt-0.5 ${
                team.totalAdjustments >= 0 ? "text-amber-300" : "text-rose-400"
              }`}
            >
              {team.totalAdjustments >= 0 ? `+${team.totalAdjustments}` : team.totalAdjustments} pts
            </div>
          </div>
        </div>

        {/* Scrollable Timeline Ledger */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
          <div className="text-[10px] text-white/40 uppercase tracking-widest border-b border-white/5 pb-1">
            Chronological Transaction History ({team.pointHistory.length} events)
          </div>

          {team.pointHistory.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-xs uppercase">
              No score events recorded yet for this squad
            </div>
          ) : (
            team.pointHistory.map((ev, idx) => {
              const isPositive = ev.amount > 0;
              const isPenalty = ev.amount < 0;

              return (
                <div
                  key={ev.id || idx}
                  className={`border p-3 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    ev.type === "SOLVE"
                      ? "border-emerald-500/20 bg-emerald-950/10"
                      : ev.type === "HINT_PENALTY"
                      ? "border-rose-500/20 bg-rose-950/10"
                      : isPositive
                      ? "border-amber-500/20 bg-amber-950/10"
                      : "border-red-500/20 bg-red-950/10"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 uppercase tracking-wider border font-bold ${
                          ev.type === "SOLVE"
                            ? "border-emerald-400/40 text-emerald-400 bg-emerald-500/10"
                            : ev.type === "HINT_PENALTY"
                            ? "border-rose-400/40 text-rose-400 bg-rose-500/10"
                            : isPositive
                            ? "border-amber-400/40 text-amber-400 bg-amber-500/10"
                            : "border-red-400/40 text-red-400 bg-red-500/10"
                        }`}
                      >
                        {ev.type === "SOLVE"
                          ? "SOLVE"
                          : ev.type === "HINT_PENALTY"
                          ? "HINT PENALTY"
                          : isPositive
                          ? "ORGANIZER BONUS"
                          : "ORGANIZER PENALTY"}
                      </span>
                      <span className="text-[10px] text-white/40">
                        {new Date(ev.timestamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-white mt-1 truncate">
                      {ev.title}
                    </div>

                    {ev.reason && (
                      <div className="text-[11px] text-white/70 mt-0.5 flex items-center space-x-1">
                        <span className="text-white/40">Reason:</span>
                        <span>{ev.reason}</span>
                        {ev.authorName && (
                          <span className="text-white/40 text-[10px]">
                            (by {ev.authorName})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                    <div
                      className={`text-sm font-bold font-mono ${
                        isPositive
                          ? "text-emerald-400"
                          : isPenalty
                          ? "text-rose-400"
                          : "text-white/60"
                      }`}
                    >
                      {isPositive ? `+${ev.amount}` : ev.amount} pts
                    </div>
                    <div className="text-[10px] text-white/40">
                      Score: {ev.scoreAfter} pts
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
