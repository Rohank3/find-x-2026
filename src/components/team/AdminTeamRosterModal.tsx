"use client";

import React, { useEffect, useState } from "react";
import { X, Users, Award, Calendar, Check, ShieldCheck } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";

export interface RosterMember {
  id?: string;
  name: string | null;
  email: string;
  branch?: string | null;
  batchYear?: number | null;
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
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [fetchedMembers, setFetchedMembers] = useState<RosterMember[] | null>(null);

  const needsFetch = Boolean((!team?.members || team.members.length === 0) && team?.id);
  const isLoading = needsFetch && fetchedMembers === null;

  // Derive loaded members directly during render:
  const loadedMembers =
    team?.members && team.members.length > 0
      ? team.members
      : fetchedMembers || [];

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // If team has an ID and members list is empty, fetch full details dynamically
  useEffect(() => {
    if (!isAdmin || !team?.id || (team.members && team.members.length > 0)) return;

    let isMounted = true;
    fetch(`/api/team/${team.id}/score-history`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted) {
          setFetchedMembers(data?.members || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFetchedMembers([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAdmin, team?.id, team?.members]);

  if (!team || !isAdmin) return null;

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 top-20 z-30 flex items-start justify-center p-3 sm:p-6 pt-4 sm:pt-6 pb-12 overflow-y-auto bg-black/40 backdrop-blur-xl"
      >
        {/* Backdrop Click Dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-transparent -z-10"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-[#fef3c7] border-4 border-[#2a1810] rounded-2xl parchment-bg text-[#2a1810] shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-5 sm:p-7 my-2 space-y-5"
        >
          {/* Wax-Seal Red Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 w-11 h-11 sm:w-12 sm:h-12 bg-[#dc2626] rounded-full flex items-center justify-center border-2 border-[#2a1810] shadow-lg text-[#fef3c7] hover:bg-red-700 transition-all z-20 cursor-pointer active:scale-95"
            aria-label="Close"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 border-b-2 border-[#2a1810]/20 pb-4">
            <div className="p-3 rounded-xl bg-[#2a1810] text-[#fde68a] border-2 border-[#b45309] shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-[family-name:var(--font-pirata-one)] text-3xl sm:text-4xl text-[#2a1810] leading-none tracking-wide">
                  {team.name}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#2a1810]/80 mt-1 font-mono">
                <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-400/40">
                  {team.batchTier || (team.isFirstYear ? "FIRST_YEAR" : "SENIOR")}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#b45309]" />
                  {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "Registered"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-red-800 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin View
                </span>
              </div>
            </div>
          </div>

          {/* Rank & Solves (if available) */}
          {(team.rank !== undefined || team.solvedCount !== undefined || team._count?.submissions !== undefined) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#fde68a]/50 rounded-xl border border-[#b45309]/30">
                <span className="text-[10px] text-[#2a1810]/70 uppercase tracking-widest font-bold block font-sans">
                  Current Rank
                </span>
                <span className="text-xl font-bold font-mono text-[#2a1810] flex items-center gap-1.5 mt-0.5">
                  <Award className="w-4 h-4 text-[#b45309]" />
                  {team.rank ? `#${team.rank}` : "Ranked"}
                </span>
              </div>
              <div className="p-3 bg-emerald-100/70 rounded-xl border border-emerald-600/30">
                <span className="text-[10px] text-emerald-900/70 uppercase tracking-widest font-bold block font-sans">
                  Total Solved
                </span>
                <span className="text-xl font-bold font-mono text-emerald-800 mt-0.5 block">
                  {team.solvedCount ?? team._count?.submissions ?? 0} Puzzles
                </span>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#2a1810]/80 uppercase tracking-wider font-bold">
              <span>Roster Sailors ({loadedMembers.length}/3)</span>
              {team.id && (
                <span className="font-mono text-[10px] text-[#2a1810]/50 normal-case">
                  ID: {team.id.slice(0, 8)}...
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="p-6 text-center text-xs text-[#2a1810]/60 space-y-2">
                <div className="w-5 h-5 rounded-full border-2 border-[#b45309] border-t-transparent animate-spin mx-auto" />
                <p>Loading member credentials...</p>
              </div>
            ) : loadedMembers.length === 0 ? (
              <div className="p-6 bg-[#fffbeb] border border-[#2a1810]/20 rounded-xl text-center text-xs text-[#2a1810]/60 italic">
                No members found for this team.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {loadedMembers.map((member, i) => (
                  <div
                    key={member.id || i}
                    className="p-3 bg-[#fffbeb] border-2 border-[#2a1810]/20 rounded-xl flex flex-col gap-1.5 shadow-sm hover:border-[#b45309] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-[#2a1810] font-sans">
                        {member.name || "Unnamed Pirate"}
                      </p>
                      {member.branch && (
                        <span className="px-2 py-0.5 rounded bg-[#fde68a] text-[#2a1810] uppercase font-mono font-bold text-[10px] border border-[#b45309]/30">
                          {member.branch} {member.batchYear ? `'${String(member.batchYear).slice(-2)}` : ""}
                        </span>
                      )}
                    </div>

                    {/* Email with copy button */}
                    <div className="flex items-center justify-between gap-2 bg-[#f5e6b8] px-2.5 py-1.5 rounded-lg border border-[#b45309]/20 font-mono text-xs">
                      <span className="text-[#2a1810] truncate font-medium select-all">
                        {member.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyEmail(member.email)}
                        className="text-[10px] font-bold text-amber-900 hover:text-red-700 uppercase tracking-wider shrink-0 transition"
                      >
                        {copiedEmail === member.email ? (
                          <span className="flex items-center text-emerald-800 font-bold">
                            <Check className="w-3.5 h-3.5 mr-0.5" /> Copied
                          </span>
                        ) : (
                          "Copy"
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl bg-[#2a1810] text-[#fde68a] hover:bg-[#3d2114] shadow-md transition-colors cursor-pointer"
            >
              Close Roster
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
