"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Skull,
  Swords,
  X,
  Upload,
  Check,
  Coins,
  Anchor,
  Dice5,
  UserPlus,
  Crown,
  Scroll,
  LogOut,
  Users,
  Lock,
  ArrowRight,
} from "@/components/icons";
import { cn } from "@/lib/utils";
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

interface JoinRequestUser {
  id: string;
  name: string | null;
  email: string;
  branch: string;
  batchYear: number;
  rollNumber: string;
  batchTier: string;
}

interface IncomingJoinRequest {
  id: string;
  user: JoinRequestUser;
  createdAt: Date;
}

interface OutgoingJoinRequest {
  id: string;
  team: {
    id: string;
    name: string;
    batchTier: string;
    isFrozen: boolean;
    _count: { members: number };
  };
  createdAt: Date;
}

interface AvailableTeam {
  id: string;
  name: string;
  batchTier: string;
  isFrozen: boolean;
  memberCount: number;
  hasRequested: boolean;
  requestId?: string;
}

interface DashboardUser {
  id: string;
  email: string;
  name: string | null;
  branch: string;
  batchYear: number;
  rollNumber: string;
  batchTier: string;
  isFirstYear: boolean;
  teamId: string | null;
  team: {
    id: string;
    name: string;
    batchTier: string;
    isFrozen: boolean;
    avatarUrl: string | null;
    members: TeamMember[];
    joinRequests: IncomingJoinRequest[];
  } | null;
  joinRequests: OutgoingJoinRequest[];
}

interface DashboardClientProps {
  user: DashboardUser;
  availableTeams: AvailableTeam[];
  pointHistory: LedgerEvent[];
  scoreSummary: {
    score: number;
    totalGained: number;
    totalPenalties: number;
    totalAdjustments: number;
  };
}

const ANIME_SHIP_NAMES = [
  "Going Merry",
  "Thousand Sunny",
  "Red Hair Corsair",
  "Queen Anne's Revenge",
  "The Black Pearl",
  "Moby Dick",
  "Polar Tang",
  "Victoria Punk",
  "Dreadnought Saber",
  "Strike Dragon",
];

export default function DashboardClient({
  user,
  availableTeams,
  pointHistory,
  scoreSummary,
}: DashboardClientProps) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"log" | "requests">("log");
  const [logFilter, setLogFilter] = useState<"ALL" | "SOLVE" | "HINT" | "TIDES">("ALL");

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.length < 3 || teamName.length > 30) return;
    setActionPending("create");
    const result = await createTeamAction(teamName);
    setActionPending(null);
    if (result.success) {
      router.refresh();
    }
  };

  const handleRandomName = () => {
    const pick = ANIME_SHIP_NAMES[Math.floor(Math.random() * ANIME_SHIP_NAMES.length)];
    setTeamName(pick);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/team/avatar", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Avatar upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const filteredLog = pointHistory.filter((entry) => {
    if (logFilter === "ALL") return true;
    if (logFilter === "SOLVE") return entry.type === "SOLVE" || entry.amount > 0;
    if (logFilter === "HINT") return entry.type === "HINT_PENALTY" || entry.amount < 0;
    if (logFilter === "TIDES") return entry.type === "ORGANIZER_BONUS" || entry.type === "ORGANIZER_PENALTY";
    return true;
  });

  // =========================================================================
  // STATE A: User HAS a Flagship (Clean Anime Pirate Hub)
  // =========================================================================
  if (user.team) {
    const { team } = user;

    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Unified Anime Flagship Command Banner (Integrated Bounty + Stats) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden"
        >
          {/* Subtle Ambient Light Shimmer */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

          {/* Top Section: Jolly Roger + Ship Name + Huge Bounty Counter */}
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            {/* Left: Crest & Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Jolly Roger Flag Avatar */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black/70 shadow-[0_0_20px_rgba(251,191,36,0.35)] flex items-center justify-center">
                  {preview || team.avatarUrl ? (
                    <img src={preview || team.avatarUrl || ""} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <Skull className="w-10 h-10 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                      <Compass className="w-6 h-6 text-amber-400 animate-spin" />
                    </div>
                  )}
                </div>

                <label
                  className="absolute inset-0 rounded-2xl bg-black/75 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  title="Upload Flagship Crest"
                >
                  <Upload className="w-5 h-5 text-amber-400 mb-0.5" />
                  <span className="text-[10px] text-white font-black uppercase tracking-wider">Change Avatar</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>

              {/* Ship Titles & Level */}
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                  <span className="px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold uppercase tracking-wider">
                    {team.batchTier === "FIRST_YEAR" ? "Fresher '26" : "Senior"}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black font-sans tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                  {team.name}
                </h1>

                <p className="mt-1 text-xs text-white/60 font-code">
                  {team.members.length}/3 Members
                </p>
              </div>
            </div>

            {/* Right: Big Anime Bounty Badge */}
            <div className="flex flex-col items-center md:items-end text-center md:text-right shrink-0">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400/90 mb-0.5 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                Fleet Bounty
              </span>
              <div className="text-3xl sm:text-5xl font-black font-sans text-amber-400 drop-shadow-[0_0_16px_rgba(251,191,36,0.6)]">
                ฿ {scoreSummary.score.toLocaleString()}
              </div>
              {!team.isFrozen && (
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="mt-2 text-xs text-red-400/70 hover:text-red-300 transition-colors flex items-center gap-1.5 font-code"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Abandon Ship</span>
                </button>
              )}
            </div>
          </div>

          {/* Integrated Quick-Stats Strip (Streamlined & Clean) */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Swords className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 truncate">Points Earned</div>
                <div className="text-lg font-black text-emerald-400 font-sans">+{scoreSummary.totalGained}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Skull className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 truncate">Penalties</div>
                <div className="text-lg font-black text-red-400 font-sans">-{scoreSummary.totalPenalties}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 truncate">Adjustments</div>
                <div className="text-lg font-black text-amber-400 font-sans">
                  {scoreSummary.totalAdjustments >= 0 ? "+" : ""}{scoreSummary.totalAdjustments}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Crew Members */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black font-sans uppercase tracking-wider text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Crew ({team.members.length}/3)
            </h2>
            <Link
              href="/hunt"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Go to Hunt</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {team.members.map((member, idx) => {
              const isCurrentUser = member.id === user.id;

              return (
                <div
                  key={member.id}
                  className={cn(
                    "rounded-2xl p-5 border backdrop-blur-xl relative overflow-hidden transition-all flex flex-col justify-between",
                    isCurrentUser
                      ? "bg-black/75 border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                      : "bg-black/50 border-white/10 hover:border-white/20"
                  )}
                >
                  <div>
                    {/* You Chip */}
                    {isCurrentUser && (
                      <div className="flex items-center justify-end mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black px-2 py-0.5 rounded-full">
                          You
                        </span>
                      </div>
                    )}

                    {/* Member Name */}
                    <div className="text-xl font-black text-white font-sans truncate">
                      {member.name || "Member"}
                    </div>

                    {/* Member Metadata */}
                    <div className="mt-1 text-xs font-code text-white/60">
                      <div>{member.rollNumber || member.email.split("@")[0]}</div>
                      <div className="text-[11px] text-amber-400/80 uppercase mt-0.5">
                        {member.branch} • Batch &apos;{String(member.batchYear).slice(-2)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-code text-white/40">
                    <span>Member {idx + 1}</span>
                  </div>
                </div>
              );
            })}

            {/* Empty Slots */}
            {Array.from({ length: 3 - team.members.length }).map((_, vacantIdx) => (
              <div
                key={`vacant-${vacantIdx}`}
                className="rounded-2xl p-5 border-2 border-dashed border-white/15 bg-black/30 backdrop-blur-md flex flex-col items-center justify-center text-center min-h-[160px]"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 mb-2">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-white">Open Slot</div>
                <p className="text-[11px] font-code text-white/50 mt-1 max-w-[140px]">
                  Invite batchmates to fill this spot!
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabbed Activity Section: Ship's Logbook & Parley Petitions */}
        <div className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-6 shadow-2xl space-y-4">
          {/* Tab Header Switcher */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("log")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                  activeTab === "log"
                    ? "bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                    : "text-white/60 hover:text-white"
                )}
              >
                <Scroll className="w-3.5 h-3.5" />
                <span>Ship&apos;s Log ({pointHistory.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("requests")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                  activeTab === "requests"
                    ? "bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                    : "text-white/60 hover:text-white"
                )}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Crew Requests ({team.joinRequests.length})</span>
              </button>
            </div>

            {activeTab === "log" && (
              <div className="hidden sm:flex items-center gap-1 text-xs font-code">
                {(["ALL", "SOLVE", "HINT", "TIDES"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLogFilter(filter)}
                    className={cn(
                      "px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all",
                      logFilter === filter
                        ? "bg-white/20 text-white"
                        : "text-white/40 hover:text-white"
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tab 1: Ship's Log */}
          {activeTab === "log" && (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredLog.map((entry, idx) => {
                const isGain = entry.amount >= 0;
                return (
                  <div
                    key={entry.id || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                          isGain ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        )}
                      >
                        {isGain ? <Coins className="w-3.5 h-3.5" /> : <Skull className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate font-sans">
                          {entry.title || entry.reason || "Event"}
                        </div>
                        <div className="text-[11px] font-code text-white/40">
                          {entry.authorName ? `${entry.authorName} • ` : ""}
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Logged"}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <div className={cn("text-sm font-black font-sans", isGain ? "text-emerald-400" : "text-red-400")}>
                        {isGain ? "+" : ""}
                        {entry.amount} GP
                      </div>
                      {typeof entry.scoreAfter === "number" && (
                        <div className="text-[10px] font-code text-white/40">
                          Total: {entry.scoreAfter}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredLog.length === 0 && (
                <div className="py-10 text-center text-white/40 font-code text-xs">
                  No log entries yet.
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Crew Requests */}
          {activeTab === "requests" && (
            <div className="space-y-2">
              {team.isFrozen ? (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center text-xs font-code text-white/50">
                  <Lock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  Roster locked. No new members can join.
                </div>
              ) : team.joinRequests.length === 0 ? (
                <div className="p-8 text-center text-white/40 font-code text-xs">
                  No pending crew requests right now.
                </div>
              ) : (
                team.joinRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-white text-sm font-sans">
                        {req.user.name || "Member"}
                      </div>
                      <div className="text-[11px] text-white/50 font-code">
                        {req.user.branch} • {req.user.rollNumber || req.user.email.split("@")[0]}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={async () => {
                          setActionPending(req.id);
                          await acceptJoinRequestAction(req.id);
                          setActionPending(null);
                          router.refresh();
                        }}
                        disabled={actionPending === req.id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-code flex items-center gap-1 transition-all disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Welcome</span>
                      </button>

                      <button
                        onClick={async () => {
                          setActionPending(req.id);
                          await rejectJoinRequestAction(req.id);
                          setActionPending(null);
                          router.refresh();
                        }}
                        disabled={actionPending === req.id}
                        className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all disabled:opacity-50"
                        title="Decline"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Abandon Ship Modal */}
        <AnimatePresence>
          {showLeaveModal && (
            <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-24 sm:pt-28 pb-12 overflow-y-auto bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-md w-full rounded-3xl bg-neutral-900 border border-red-500/40 shadow-2xl p-6 text-center space-y-4 my-2"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
                  <Skull className="w-6 h-6" />
                </div>

                <h3 className="text-2xl font-black font-sans text-white">
                  Abandon the Ship?
                </h3>

                <p className="text-xs text-white/70 font-code leading-relaxed">
                  Are you sure you want to disembark from <strong className="text-amber-400">{team.name}</strong>?
                  If all sailors leave, this vessel will be deleted.
                </p>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setShowLeaveModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs font-code transition-colors"
                  >
                    Stay on Board
                  </button>

                  <button
                    onClick={async () => {
                      setActionPending("leave");
                      await voluntaryLeaveTeamAction();
                      setShowLeaveModal(false);
                      setActionPending(null);
                      router.refresh();
                    }}
                    disabled={actionPending === "leave"}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-code transition-colors disabled:opacity-50"
                  >
                    {actionPending === "leave" ? "Leaving..." : "Abandon Ship"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // =========================================================================
  // STATE B: User HAS NO Flagship (Fun Anime Pirate Recruitment Screen)
  // =========================================================================
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Fun Anime Welcome Card */}
      <div className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl text-center space-y-3 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
          <Anchor className="w-3.5 h-3.5 text-amber-400" />
          <span>Team Formation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black font-sans tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          Form Your Crew!
        </h1>

        <p className="text-xs sm:text-sm text-white/70 font-code max-w-lg mx-auto">
          Name your ship and recruit your crew, or request to join an existing team.
        </p>

        {/* Sailor Identity Tag */}
        <div className="inline-flex items-center gap-2 pt-1 text-xs font-code text-white/50">
          <span>Signed in: <strong className="text-white">{user.name || user.email.split("@")[0]}</strong></span>
          <span>•</span>
          <span className="text-amber-400">{user.batchTier === "FIRST_YEAR" ? "Fresher '26" : "Senior Fleet"}</span>
          <span>•</span>
          <span>{user.branch}</span>
        </div>
      </div>

      {/* 2-Column: Commission Ship vs Petitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Commission Flagship */}
        <div className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black font-sans uppercase tracking-wider text-white flex items-center gap-2">
                <Crown className="w-4.5 h-4.5 text-amber-400" />
                Commission Ship
              </h2>
            </div>

            <p className="text-xs font-code text-white/60 mb-4">
              Pick a name for your ship and start the hunt.
            </p>

            <form onSubmit={handleCreateTeam} className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white/80">Ship Name</label>
                  <button
                    type="button"
                    onClick={handleRandomName}
                    className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <Dice5 className="w-3.5 h-3.5" />
                    <span>Random Idea</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Going Merry, Thousand Sunny..."
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 font-sans font-bold text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 text-sm"
                  minLength={3}
                  maxLength={30}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={actionPending === "create" || teamName.length < 3}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-black font-black uppercase tracking-wider text-sm shadow-[0_0_16px_rgba(251,191,36,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Anchor className="w-4 h-4 stroke-[2.5]" />
                <span>{actionPending === "create" ? "Building..." : "Set Sail & Form Crew"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Card 2: Petitions in Flight */}
        <div className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black font-sans uppercase tracking-wider text-white flex items-center gap-2">
                <Scroll className="w-4.5 h-4.5 text-amber-400" />
                Requests in Flight
              </h2>
              <span className="text-xs font-bold text-amber-400">
                {user.joinRequests.length} Sent
              </span>
            </div>

            <p className="text-xs font-code text-white/60 mb-4">
              Join requests you have sent. You can cancel anytime.
            </p>

            {user.joinRequests.length === 0 ? (
              <div className="py-8 text-center text-white/40 font-code text-xs flex flex-col items-center gap-2">
                <Compass className="w-8 h-8 text-white/20" />
                <span>No active requests. Request to join a team below!</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {user.joinRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white font-sans">
                        {req.team.name}
                      </div>
                      <div className="text-[11px] text-white/50 font-code">
                        {req.team._count.members}/3 Crew
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        setActionPending(req.id);
                        await cancelJoinRequestAction(req.id);
                        setActionPending(null);
                        router.refresh();
                      }}
                      disabled={actionPending === req.id}
                      className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold font-code text-xs transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Fleet Ships */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-black font-sans uppercase tracking-wider text-white flex items-center gap-2">
            <Anchor className="w-4 h-4 text-amber-400" />
            Teams Looking for Members ({availableTeams.length})
          </h2>
          <span className="text-xs font-code text-amber-400 font-bold">
            {user.batchTier === "FIRST_YEAR" ? "Fresher '26 Tier" : "Senior Tier"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableTeams.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-code text-white/50 mb-1.5">
                  <span className="text-[10px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full font-bold">
                    {t.memberCount}/3 Crew
                  </span>
                  <span>{t.batchTier === "FIRST_YEAR" ? "Fresher" : "Senior"}</span>
                </div>

                <h3 className="font-black font-sans text-lg text-white truncate mb-3">
                  {t.name}
                </h3>
              </div>

              <div>
                {t.hasRequested ? (
                  <button
                    disabled
                    className="w-full py-2 rounded-xl bg-white/10 text-white/40 font-code text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Requested</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      setActionPending(t.id);
                      await sendJoinRequestAction(t.id);
                      setActionPending(null);
                      router.refresh();
                    }}
                    disabled={actionPending === t.id}
                    className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black uppercase text-xs tracking-wider transition-all shadow-[0_0_12px_rgba(251,191,36,0.4)] disabled:opacity-50"
                  >
                    {actionPending === t.id ? "Sending..." : "Join Crew"}
                  </button>
                )}
              </div>
            </div>
          ))}

          {availableTeams.length === 0 && (
            <div className="col-span-full py-10 text-center text-white/40 font-code text-xs bg-black/30 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
              <Anchor className="w-8 h-8 text-white/20" />
              <span>No teams currently looking for members in your tier. Create your own team above!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
