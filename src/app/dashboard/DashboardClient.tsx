"use client";

import React, { useState } from "react";
import {
  UserPlus,
  LogOut,
  Check,
  X,
  AlertTriangle,
  Lock,
  Send,
  Trash2,
  ChevronRight,
} from "lucide-react";
import {
  createTeamAction,
  sendJoinRequestAction,
  acceptJoinRequestAction,
  rejectJoinRequestAction,
  cancelJoinRequestAction,
  voluntaryLeaveTeamAction,
} from "./actions";
import type { LedgerEvent } from "@/lib/ledger";

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  branch: string;
  batchYear: number;
  rollNumber: string;
}

interface IncomingJoinRequest {
  id: string;
  user: {
    name: string | null;
    email: string;
    branch: string;
    batchYear: number;
    rollNumber: string;
  };
}

interface DashboardTeam {
  id: string;
  name: string;
  isFrozen: boolean;
  members: TeamMember[];
  joinRequests: IncomingJoinRequest[];
}

interface DashboardUser {
  id: string;
  name: string | null;
  email: string;
  branch: string;
  batchYear: number;
  rollNumber: string;
  batchTier: "FIRST_YEAR" | "SENIOR";
  teamId: string | null;
  team: DashboardTeam | null;
  joinRequests: Array<{ id: string; team?: { id: string; name: string } | null }>;
}

interface DashboardClientProps {
  user: DashboardUser;
  availableTeams: Array<{
    id: string;
    name: string;
    batchTier: string;
    isFrozen: boolean;
    memberCount: number;
    hasRequested: boolean;
    requestId?: string;
  }>;
  pointHistory?: LedgerEvent[];
  scoreSummary?: {
    score: number;
    totalGained: number;
    totalPenalties: number;
    totalAdjustments: number;
  };
}

export default function DashboardClient({
  user,
  availableTeams,
  pointHistory = [],
  scoreSummary = { score: 0, totalGained: 0, totalPenalties: 0, totalAdjustments: 0 },
}: DashboardClientProps) {
  const [newTeamName, setNewTeamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const team = user.team;
  const isFirstYear = user.batchTier === "FIRST_YEAR";

  // Handle Team Creation
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await createTeamAction(newTeamName);
    setIsCreating(false);

    if (res.success) {
      setSuccessMsg("Team created successfully.");
      setNewTeamName("");
    } else {
      setErrorMsg(res.error || "Failed to create team.");
    }
  };

  // Handle Join Request broadcast
  const handleSendRequest = async (teamId: string) => {
    setActionLoading(`send-${teamId}`);
    setErrorMsg(null);
    const res = await sendJoinRequestAction(teamId);
    setActionLoading(null);

    if (res.success) {
      setSuccessMsg("Join request sent.");
    } else {
      setErrorMsg(res.error || "Failed to send join request.");
    }
  };

  // Handle Request Accept
  const handleAcceptRequest = async (reqId: string) => {
    setActionLoading(`accept-${reqId}`);
    setErrorMsg(null);
    const res = await acceptJoinRequestAction(reqId);
    setActionLoading(null);

    if (res.success) {
      setSuccessMsg("Member accepted into team.");
    } else {
      setErrorMsg(res.error || "Failed to accept member.");
    }
  };

  // Handle Request Reject
  const handleRejectRequest = async (reqId: string) => {
    setActionLoading(`reject-${reqId}`);
    setErrorMsg(null);
    const res = await rejectJoinRequestAction(reqId);
    setActionLoading(null);

    if (res.success) {
      setSuccessMsg("Request rejected.");
    } else {
      setErrorMsg(res.error || "Failed to reject request.");
    }
  };

  // Handle Cancel Request
  const handleCancelRequest = async (reqId: string) => {
    setActionLoading(`cancel-${reqId}`);
    setErrorMsg(null);
    const res = await cancelJoinRequestAction(reqId);
    setActionLoading(null);

    if (res.success) {
      setSuccessMsg("Request cancelled.");
    } else {
      setErrorMsg(res.error || "Failed to cancel request.");
    }
  };

  // Handle Voluntary Leave
  const handleVoluntaryLeave = async () => {
    setActionLoading("leave");
    setErrorMsg(null);
    const res = await voluntaryLeaveTeamAction();
    setActionLoading(null);
    setShowLeaveModal(false);

    if (res.success) {
      setSuccessMsg("You have left the team.");
    } else {
      setErrorMsg(res.error || "Failed to leave team.");
    }
  };

  return (
    <div className="space-y-8 font-mono text-white">
      {/* Top Header */}
      <div className="relative border border-white/10 bg-black/80 p-4 sm:p-6 backdrop-blur-md">
        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white/60" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white/60" />
        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white/60" />
        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white/60" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-white/60">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
              <span>Team Dashboard</span>
              <span>•</span>
              <span>IIIT Lucknow</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black italic -skew-x-12 tracking-tight text-white uppercase break-words">
              {user.name} <span className="text-white/40 text-xs sm:text-base font-normal block sm:inline mt-0.5 sm:mt-0">({user.branch.toUpperCase()} • Roll: {user.rollNumber})</span>
            </h1>
            <p className="text-xs text-white/60 tracking-wider">
              Email: {user.email} • Track: {isFirstYear ? "1st-Year Track (2026)" : `Senior Track (${user.batchYear})`}
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {isFirstYear ? (
              <div className="px-4 py-2 border border-white/30 bg-white/5 text-xs font-mono uppercase tracking-widest">
                1st-Year Track
              </div>
            ) : (
              <div className="px-4 py-2 border border-white/30 bg-white/5 text-xs font-mono uppercase tracking-widest">
                Senior Track ({user.batchYear})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="border border-rose-500/50 bg-rose-950/20 p-4 text-xs font-mono text-rose-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span className="tracking-wide">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="border border-emerald-500/50 bg-emerald-950/20 p-4 text-xs font-mono text-emerald-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="tracking-wide">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* VIEW A: USER HAS A TEAM */}
      {team ? (
        <div className="space-y-6">
          <div className="relative glass-panel p-4 sm:p-6 space-y-5 sm:space-y-6">
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white/60" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white/60" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-white/40">
                  Team Name
                </span>
                <h2 className="text-2xl sm:text-3xl font-black italic -skew-x-12 tracking-tight text-white uppercase break-words">
                  {team.name}
                </h2>
              </div>

              {/* Roster Freeze Status */}
              <div>
                {team.isFrozen ? (
                  <div className="flex items-center space-x-2 px-3.5 py-1.5 border border-white/40 bg-white/10 text-white text-xs uppercase tracking-wider">
                    <Lock className="h-3.5 w-3.5" />
                    <span>LOCKED</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 px-3.5 py-1.5 border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 text-xs uppercase tracking-wider">
                    <span className="h-2 w-2 bg-emerald-400 animate-pulse" />
                    <span>OPEN</span>
                  </div>
                )}
              </div>
            </div>

            {/* Squad Members Matrix (1-3 Members) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs uppercase tracking-widest text-white/70 font-bold">
                  Team Members ({team.members.length} / 3)
                </h3>
                <span className="text-[11px] text-white/30">Same batch only</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {team.members.map((member, idx) => (
                  <div
                    key={member.id}
                    className="relative p-5 border border-white/[0.08] bg-[#0c0c10]/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:border-white/20 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400">
                        Member #{idx + 1}
                      </div>
                      <div className="px-2 py-0.5 border border-white/[0.1] bg-white/[0.03] text-[10px] uppercase tracking-widest text-zinc-300">
                        {member.branch.toUpperCase()}
                      </div>
                    </div>

                    <div>
                      <div className="text-base font-bold tracking-tight text-white truncate">
                        {member.name || member.email.split("@")[0]}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        {member.email}
                      </div>
                    </div>

                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest pt-1 border-t border-white/[0.04]">
                      Roll: {member.rollNumber} • Batch: {member.batchYear}
                    </div>
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: 3 - team.members.length }).map((_, i) => (
                  <div
                    key={i}
                    className="p-5 border border-dashed border-white/[0.08] bg-black/40 flex flex-col items-center justify-center text-center text-zinc-500 py-8 hover:border-white/20 transition-colors space-y-2"
                  >
                    <UserPlus className="h-5 w-5 text-zinc-600" />
                    <span className="text-xs uppercase tracking-widest text-zinc-400">Open Slot</span>
                    <span className="text-[10px] text-zinc-600">Waiting for member</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Voluntary Leave Section */}
            <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-white/50 tracking-wide">
                {team.isFrozen ? (
                  <span>🔒 Team roster is locked permanently after solving the first puzzle.</span>
                ) : (
                  <span>Team roster can be changed before solving the first puzzle.</span>
                )}
              </div>

              {!team.isFrozen && (
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(true)}
                  className="px-4 py-2 border border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-black text-xs uppercase tracking-widest transition flex items-center justify-center space-x-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Leave Team</span>
                </button>
              )}
            </div>
          </div>

          {/* Team Point History & Score Timeline */}
          <div className="relative glass-panel p-4 sm:p-6 space-y-5 sm:space-y-6">
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[hsl(45_68%_47%)]" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[hsl(45_68%_47%)]" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[hsl(45_40%_97%/0.08)] pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[hsl(45_68%_47%)] font-bold">
                  Score Ledger &amp; Progression
                </span>
                <h3 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[hsl(45_40%_97%)] mt-0.5">
                  Point History &amp; Timeline
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-[hsl(45_40%_97%/0.5)] uppercase tracking-widest">
                  Net Team Score:
                </span>
                <span className="text-xl font-black font-mono text-[hsl(45_68%_47%)] drop-shadow-[0_0_12px_rgba(201,151,38,0.4)]">
                  {scoreSummary.score} pts
                </span>
              </div>
            </div>

            {/* KPI Summary Bento Cards - THURAY Gold Void */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="relative border border-[hsl(45_68%_47%/0.35)] bg-[hsl(0_0%_4%)] p-3 sm:p-4 shadow-[inset_0_1px_0_0_hsl(45_68%_47%/0.25)]">
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[hsl(45_68%_47%)]" />
                <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[hsl(45_40%_97%/0.6)]">Total Score</div>
                <div className="text-lg sm:text-xl font-black text-[hsl(45_68%_47%)] font-mono mt-1">
                  {scoreSummary.score} <span className="text-xs font-normal text-[hsl(45_68%_47%/0.6)]">pts</span>
                </div>
              </div>
              <div className="recessed-well p-3 sm:p-4">
                <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[hsl(45_40%_97%/0.45)]">Base Solves</div>
                <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono mt-1">
                  +{scoreSummary.totalGained} <span className="text-xs font-normal text-[hsl(45_40%_97%/0.4)]">pts</span>
                </div>
              </div>
              <div className="recessed-well p-3 sm:p-4">
                <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[hsl(45_40%_97%/0.45)]">Hint Deductions</div>
                <div className="text-lg sm:text-xl font-bold text-[hsl(0_84%_60%)] font-mono mt-1">
                  -{scoreSummary.totalPenalties} <span className="text-xs font-normal text-[hsl(0_84%_60%/0.6)]">pts</span>
                </div>
              </div>
              <div className="recessed-well p-3 sm:p-4">
                <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[hsl(45_40%_97%/0.45)]">Adjustments</div>
                <div
                  className={`text-lg sm:text-xl font-bold font-mono mt-1 ${
                    scoreSummary.totalAdjustments >= 0 ? "text-[hsl(45_68%_47%)]" : "text-[hsl(0_84%_60%)]"
                  }`}
                >
                  {scoreSummary.totalAdjustments >= 0 ? `+${scoreSummary.totalAdjustments}` : scoreSummary.totalAdjustments} <span className="text-xs font-normal text-[hsl(45_40%_97%/0.4)]">pts</span>
                </div>
              </div>
            </div>

            {/* Chronological Timeline List */}
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-widest text-[hsl(45_40%_97%/0.7)] font-bold border-b border-[hsl(45_40%_97%/0.08)] pb-2">
                Chronological Transactions ({pointHistory.length})
              </div>

              {pointHistory.length === 0 ? (
                <div className="text-xs text-[hsl(45_40%_97%/0.3)] py-8 text-center tracking-wider">
                  No score transactions recorded yet. Start solving puzzles in the Hunt ladder!
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {pointHistory.map((ev, idx) => {
                    const isPositive = ev.amount > 0;
                    const isPenalty = ev.amount < 0;

                    return (
                      <div
                        key={ev.id || idx}
                        className={`p-3.5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[hsl(45_40%_97%/0.04)] ${
                          ev.type === "SOLVE"
                            ? "border-l-2 border-l-emerald-500 bg-[hsl(45_40%_97%/0.015)] hover:bg-[hsl(45_40%_97%/0.035)]"
                            : ev.type === "HINT_PENALTY"
                            ? "border-l-2 border-l-[hsl(0_84%_60%)] bg-[hsl(45_40%_97%/0.015)] hover:bg-[hsl(45_40%_97%/0.035)]"
                            : isPositive
                            ? "border-l-2 border-l-[hsl(45_68%_47%)] bg-[hsl(45_68%_47%/0.04)] hover:bg-[hsl(45_68%_47%/0.07)]"
                            : "border-l-2 border-l-[hsl(0_84%_60%)] bg-[hsl(45_40%_97%/0.015)] hover:bg-[hsl(45_40%_97%/0.035)]"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[9px] px-2 py-0.5 uppercase tracking-wider border font-bold ${
                                ev.type === "SOLVE"
                                  ? "border-emerald-400/50 text-emerald-400 bg-emerald-500/10"
                                  : ev.type === "HINT_PENALTY"
                                  ? "border-rose-400/50 text-rose-400 bg-rose-500/10"
                                  : isPositive
                                  ? "border-amber-400/50 text-amber-400 bg-amber-500/10"
                                  : "border-red-400/50 text-red-400 bg-red-500/10"
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

                          <div className="text-sm font-semibold text-white mt-1">
                            {ev.title}
                          </div>

                          {ev.reason && (
                            <div className="text-xs text-white/70 mt-0.5">
                              <span className="text-white/40">Reason:</span> {ev.reason}{" "}
                              {ev.authorName && (
                                <span className="text-white/40 text-[11px]">
                                  (by {ev.authorName})
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                          <div
                            className={`text-base font-bold font-mono ${
                              isPositive
                                ? "text-emerald-400"
                                : isPenalty
                                ? "text-rose-400"
                                : "text-white/60"
                            }`}
                          >
                            {isPositive ? `+${ev.amount}` : ev.amount} pts
                          </div>
                          <div className="text-[11px] text-white/40 font-mono">
                            Running Score: {ev.scoreAfter} pts
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Incoming Join Requests */}
          {!team.isFrozen && team.members.length < 3 && (
            <div className="relative glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xs uppercase tracking-widest text-white/70 flex items-center space-x-2">
                  <UserPlus className="h-3.5 w-3.5 text-white/60" />
                  <span>Incoming Join Requests ({team.joinRequests.length})</span>
                </h3>
              </div>

              {team.joinRequests.length === 0 ? (
                <div className="text-xs text-white/30 py-6 text-center tracking-wider">
                  No pending join requests
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {team.joinRequests.map((req) => (
                    <div key={req.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-white tracking-wide">
                          {req.user.name || req.user.email}
                        </div>
                        <div className="text-xs text-white/50 tracking-wider">
                          {req.user.email} • {req.user.branch.toUpperCase()} • BATCH {req.user.batchYear} • ROLL #{req.user.rollNumber}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          disabled={actionLoading !== null}
                          onClick={() => handleAcceptRequest(req.id)}
                          className="px-3 py-1.5 border border-white/40 hover:bg-white hover:text-black text-white text-xs uppercase tracking-widest transition flex items-center space-x-1.5"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading !== null}
                          onClick={() => handleRejectRequest(req.id)}
                          className="px-3 py-1.5 border border-white/10 hover:border-rose-500 hover:text-rose-400 text-white/50 text-xs uppercase tracking-widest transition"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* VIEW B: USER HAS NO TEAM */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Squad */}
          <div className="relative glass-panel p-6 space-y-6">
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white/60" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white/60" />

            <div>
              <span className="text-[10px] uppercase tracking-widest text-white/40">Create a Team</span>
              <h2 className="text-xl font-black italic -skew-x-12 tracking-tight text-white uppercase mt-1">
                Create Team
              </h2>
              <p className="text-xs text-white/60 tracking-wider mt-1">
                Create your team in the{" "}
                <strong className="text-white">
                  {isFirstYear ? "1st-Year Division (Batch 2026)" : `Senior Division (${user.batchYear})`}
                </strong>
                .
              </p>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-white/50 block mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Team Cipher"
                  minLength={3}
                  maxLength={30}
                  required
                  className="w-full bg-black border border-white/20 p-3.5 text-xs text-white tracking-wider focus:outline-none focus:border-white transition placeholder:text-white/20"
                />
              </div>

              <div className="text-[11px] text-white/40 tracking-wider">
                1–3 members • Batch {user.batchYear} only
              </div>

              <button
                type="submit"
                disabled={isCreating || !newTeamName.trim()}
                className="w-full py-3 px-4 border border-white/30 hover:border-white hover:bg-white hover:text-black text-white uppercase tracking-widest text-xs font-bold transition disabled:opacity-30 flex items-center justify-center space-x-2"
              >
                <span>{isCreating ? "Creating..." : "Create Team"}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Broadcast Join Requests */}
          <div className="space-y-6">
            <div className="relative glass-panel p-6 space-y-4">
              <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white/60" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white/60" />

              <div>
                <span className="text-[10px] uppercase tracking-widest text-white/40">Available Teams</span>
                <h2 className="text-xl font-black italic -skew-x-12 tracking-tight text-white uppercase mt-1">
                  Join a Team
                </h2>
                <p className="text-xs text-white/60 tracking-wider mt-1">
                  Send a join request to an open team. You will automatically join once accepted.
                </p>
              </div>

              {availableTeams.length === 0 ? (
                <div className="text-xs text-white/30 py-8 text-center tracking-wider">
                  No teams currently recruiting in your batch
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-80 overflow-y-auto pr-1">
                  {availableTeams.map((t) => (
                    <div key={t.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                      <div>
                        <div className="text-xs font-bold text-white uppercase tracking-wider">{t.name}</div>
                        <div className="text-[10px] text-white/50 tracking-wider">
                          {t.memberCount}/3 members • {t.batchTier === "FIRST_YEAR" ? "1st-Year" : "Senior"}
                        </div>
                      </div>

                      {t.hasRequested ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-white/70 uppercase tracking-widest">Pending</span>
                          {t.requestId && (
                            <button
                              type="button"
                              onClick={() => handleCancelRequest(t.requestId!)}
                              className="text-white/40 hover:text-rose-400 p-2 min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Cancel request"
                              aria-label="Cancel join request"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={actionLoading !== null}
                          onClick={() => handleSendRequest(t.id)}
                          className="px-3.5 py-2 min-h-[38px] w-full sm:w-auto border border-white/20 hover:border-white hover:bg-white hover:text-black text-white text-xs uppercase tracking-widest transition flex items-center justify-center space-x-1.5"
                        >
                          <Send className="h-3 w-3" />
                          <span>Request to Join</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Sent Requests */}
            {user.joinRequests && user.joinRequests.length > 0 && (
              <div className="border border-white/10 bg-black/60 p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
                  Sent Requests ({user.joinRequests.length})
                </div>
                <div className="divide-y divide-white/5 text-xs">
                  {user.joinRequests.map((r) => (
                    <div key={r.id} className="py-2.5 flex items-center justify-between">
                      <span className="text-white/80 uppercase tracking-wider">{r.team?.name}</span>
                      <button
                        type="button"
                        onClick={() => handleCancelRequest(r.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voluntary Leave Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-md w-full border border-rose-500/40 bg-black p-6 space-y-4">
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-rose-500" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-rose-500" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-rose-500" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-rose-500" />

            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h3 className="text-base font-bold uppercase tracking-wider text-white">
                Leave Team Confirmation
              </h3>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Are you sure you want to leave <strong className="text-white">{team?.name}</strong>?
              If you are the last remaining member, the team will be permanently deleted.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 text-xs uppercase tracking-widest text-white/50 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading === "leave"}
                onClick={handleVoluntaryLeave}
                className="px-4 py-2 border border-rose-500 bg-rose-500 text-black text-xs font-bold uppercase tracking-widest hover:bg-rose-400 transition"
              >
                {actionLoading === "leave" ? "Leaving..." : "Leave Team"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
