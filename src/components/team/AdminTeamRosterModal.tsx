"use client";

import React, { useEffect } from "react";
import { X, Users, ShieldAlert, Award, Calendar } from "lucide-react";

export interface RosterMember {
  id?: string;
  name: string | null;
  email: string;
  branch?: string;
  batchYear?: number;
}

export interface RosterTeam {
  id?: string;
  name: string;
  batchTier?: string;
  isFirstYear?: boolean;
  members: RosterMember[];
  createdAt?: string | Date;
  rank?: number;
  solvedCount?: number;
  _count?: {
    submissions?: number;
  };
}

export type AdminTeamData = RosterTeam & { id: string; name: string };

interface AdminTeamRosterModalProps {
  team: RosterTeam | null;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function AdminTeamRosterModal({
  team,
  onClose,
  isAdmin = false,
}: AdminTeamRosterModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!team || !isAdmin) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#140a04] border border-amber-500/30 rounded-xl shadow-2xl p-6 text-white font-mono">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">{team.name}</h2>
            <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
              <span className="text-amber-400 font-semibold">{team.batchTier || "STANDARD"}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "Active"}
              </span>
            </div>
          </div>
        </div>

        {team.rank !== undefined && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
              <span className="text-[10px] text-white/40 uppercase tracking-widest block">Rank</span>
              <span className="text-lg font-bold text-amber-400 flex items-center gap-1.5 mt-0.5">
                <Award className="w-4 h-4 text-amber-400" />
                #{team.rank}
              </span>
            </div>
            <div className="p-3 bg-black/40 rounded-lg border border-white/5">
              <span className="text-[10px] text-white/40 uppercase tracking-widest block">Solved</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
                {team.solvedCount ?? team._count?.submissions ?? 0} Puzzles
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/40 uppercase tracking-wider mb-2">
            <span>Roster Members ({team.members.length}/3)</span>
            <span className="flex items-center gap-1 text-amber-400/80 text-[10px]">
              <ShieldAlert className="w-3 h-3" />
              Verified Telemetry
            </span>
          </div>

          {team.members.map((member, i) => (
            <div
              key={member.id || i}
              className="p-3 bg-black/30 border border-white/5 rounded-lg flex items-center justify-between hover:border-white/10 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-white">{member.name || "Anonymous Member"}</p>
                <p className="text-xs text-white/40">{member.email}</p>
              </div>
              <div className="text-right text-xs">
                {member.branch && (
                  <span className="px-2 py-0.5 rounded bg-white/5 text-amber-300 uppercase font-semibold">
                    {member.branch} {member.batchYear ? `'${String(member.batchYear).slice(-2)}` : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
