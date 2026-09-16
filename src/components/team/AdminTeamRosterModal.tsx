"use client";

import React, { useEffect } from "react";
import { Users, Mail, GraduationCap, Calendar, ShieldCheck, X } from "lucide-react";

export interface RosterMember {
  id?: string;
  name: string | null;
  email: string;
  branch?: string;
  batchYear?: number;
}

export interface RosterTeam {
  id?: string;
  teamId?: string;
  name?: string;
  teamName?: string;
  isFirstYear?: boolean;
  batchTier?: "FIRST_YEAR" | "SENIOR" | string;
  score?: number;
  puzzlesSolved?: number;
  rank?: number;
  leaderId?: string | null;
  members: RosterMember[];
  createdAt?: Date | string;
  _count?: {
    submissions?: number;
  };
}

export type AdminTeamData = RosterTeam & {
  id: string;
  name: string;
};

interface AdminTeamRosterModalProps {
  team: RosterTeam | null;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function AdminTeamRosterModal({ team, onClose, isAdmin = false }: AdminTeamRosterModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (team && isAdmin) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [team, onClose, isAdmin]);

  if (!team || !isAdmin) return null;

  const displayName = team.teamName || team.name || "Squad Details";
  const isFirstYear = team.isFirstYear ?? team.batchTier === "FIRST_YEAR";
  const memberList = team.members || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-mono"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-xl border border-white/20 bg-zinc-950 p-6 shadow-2xl text-white max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="roster-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brutalist targeting corner ticks */}
        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400" />
        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400" />
        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase flex items-center">
                <ShieldCheck className="h-3.5 w-3.5 mr-1 text-amber-400 inline" />
                ADMIN TELEMETRY • {isFirstYear ? "1ST YEAR TRACK" : "SENIOR TRACK"}
              </span>
              {team.rank && (
                <span className="text-[10px] px-1.5 py-0.2 border border-white/20 text-white/70 bg-white/5">
                  RANK #{team.rank}
                </span>
              )}
            </div>
            <h2 id="roster-modal-title" className="text-lg font-bold uppercase tracking-wider text-white mt-1">
              {displayName}
            </h2>
            <div className="text-[11px] text-white/50 mt-0.5 flex items-center space-x-2">
              <span>{memberList.length} Registered Member{memberList.length === 1 ? "" : "s"}</span>
              {typeof team.score === "number" && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">{team.score} pts</span>
                </>
              )}
              {typeof team.puzzlesSolved === "number" && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400">{team.puzzlesSolved} solved</span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close roster modal"
            className="text-white/40 hover:text-white border border-white/10 hover:border-white/30 px-2 py-1 text-xs transition flex items-center space-x-1"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">[ESC]</span>
          </button>
        </div>

        {/* Member Roster List */}
        <div className="flex-1 overflow-y-auto pr-1 my-4 space-y-3">
          <div className="text-[10px] text-white/40 uppercase tracking-widest border-b border-white/5 pb-1 flex items-center justify-between">
            <span>Squad Roster</span>
            <span className="text-amber-400/80">Authorized Admin View</span>
          </div>

          {memberList.length === 0 ? (
            <div className="text-center py-10 text-white/30 text-xs uppercase border border-dashed border-white/10">
              No registered squad members found for this team.
            </div>
          ) : (
            memberList.map((m, idx) => {
              const isLeader = team.leaderId ? m.id === team.leaderId : idx === 0;
              const initials = (m.name || m.email || "U")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0].toUpperCase())
                .join("");

              return (
                <div
                  key={m.id || m.email || idx}
                  className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-3 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-3 min-w-0">
                      {/* Avatar initials badge */}
                      <div className="h-9 w-9 border border-amber-400/30 bg-amber-950/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="font-bold text-white text-xs tracking-wide truncate">
                            {m.name || "Student Participant"}
                          </span>
                          {isLeader && (
                            <span className="text-[9px] px-1.5 py-0.2 border border-amber-400/40 text-amber-400 bg-amber-400/10 uppercase tracking-wider font-semibold">
                              Squad Leader
                            </span>
                          )}
                        </div>

                        {/* Email */}
                        <div className="text-[11px] text-white/60 flex items-center space-x-1.5 mt-1 truncate">
                          <Mail className="h-3 w-3 text-white/40 shrink-0" />
                          <span className="font-mono text-zinc-300">{m.email}</span>
                        </div>

                        {/* Academic Metadata */}
                        <div className="flex items-center space-x-3 text-[10px] text-white/40 mt-1.5 flex-wrap">
                          {m.branch && (
                            <span className="flex items-center space-x-1 border border-white/10 px-1.5 py-0.5 bg-black/40">
                              <GraduationCap className="h-3 w-3 text-white/30" />
                              <span className="uppercase">{m.branch}</span>
                            </span>
                          )}
                          {m.batchYear && (
                            <span className="flex items-center space-x-1 border border-white/10 px-1.5 py-0.5 bg-black/40">
                              <Calendar className="h-3 w-3 text-white/30" />
                              <span>Batch {m.batchYear}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Note */}
        <div className="border-t border-white/10 pt-3 text-[10px] text-white/40 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5">
            <Users className="h-3 w-3 text-amber-400/70" />
            <span>CONFIDENTIAL IIITL STUDENT ROSTER</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs transition border border-white/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
