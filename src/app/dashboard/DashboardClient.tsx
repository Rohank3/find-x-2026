"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Skull,
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
  Trash2,
  Search,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { formatStudentBranch } from "@/lib/email";
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
  hintsEnabled?: boolean;
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

function formatEventTime(timestamp?: string | Date): string {
  if (!timestamp) return "Logged";
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "Logged";
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = (hours % 12 || 12).toString().padStart(2, "0");
  return `${formattedHours}:${minutes} ${ampm}`;
}

export default function DashboardClient({
  user,
  availableTeams,
  pointHistory,
  scoreSummary,
  hintsEnabled = false,
}: DashboardClientProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [avatarUrlOverride, setAvatarUrlOverride] = useState<string | null | undefined>(undefined);
  const [showDeleteAvatarModal, setShowDeleteAvatarModal] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [logFilter, setLogFilter] = useState<"ALL" | "SOLVE" | "HINT" | "TIDES">("ALL");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [capacityFilter, setCapacityFilter] = useState<"ALL" | "1" | "2">("ALL");

  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.length < 3 || teamName.length > 30) return;
    setCreateError(null);
    setActionPending("create");
    try {
      const result = await createTeamAction(teamName);
      if (result.success) {
        await updateSession().catch(() => null);
        router.refresh();
      } else {
        setCreateError(result.error || "Failed to create team.");
      }
    } catch {
      setCreateError("Failed to create team. Please try again.");
    } finally {
      setActionPending(null);
    }
  };

  const handleLeaveTeam = async () => {
    setLeaveError(null);
    setActionPending("leave");
    try {
      const result = await voluntaryLeaveTeamAction();
      if (result.success) {
        setShowLeaveModal(false);
        await updateSession().catch(() => null);
        router.refresh();
      } else {
        setLeaveError(result.error || "Failed to leave team.");
      }
    } catch {
      setLeaveError("Failed to leave team. Please try again.");
    } finally {
      setActionPending(null);
    }
  };

  const handleRandomName = () => {
    const pick = ANIME_SHIP_NAMES[Math.floor(Math.random() * ANIME_SHIP_NAMES.length)];
    setTeamName(pick);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/team/avatar", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.url) {
          setAvatarUrlOverride(data.url);
        }
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setAvatarError(data.error || "Failed to upload avatar.");
        setPreview(null);
      }
    } catch (error) {
      console.error("Avatar upload failed", error);
      setAvatarError("Network error uploading avatar.");
      setPreview(null);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAvatarDelete = async () => {
    setDeletingAvatar(true);
    setAvatarError(null);
    try {
      const res = await fetch("/api/team/avatar", {
        method: "DELETE",
      });
      if (res.ok) {
        setPreview(null);
        setAvatarUrlOverride(null);
        setShowDeleteAvatarModal(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setAvatarError(data.error || "Failed to delete avatar.");
      }
    } catch (error) {
      console.error("Avatar delete failed", error);
      setAvatarError("Network error deleting avatar.");
    } finally {
      setDeletingAvatar(false);
    }
  };

  const effectiveLogFilter = !hintsEnabled && logFilter === "HINT" ? "ALL" : logFilter;

  const displayPointHistory = hintsEnabled
    ? pointHistory
    : pointHistory.filter((entry) => entry.type !== "HINT_PENALTY");

  const filteredLog = displayPointHistory.filter((entry) => {
    if (effectiveLogFilter === "ALL") return true;
    if (effectiveLogFilter === "SOLVE") return entry.type === "SOLVE" || entry.amount > 0;
    if (effectiveLogFilter === "HINT") return entry.type === "HINT_PENALTY" || entry.amount < 0;
    if (effectiveLogFilter === "TIDES") return entry.type === "ORGANIZER_BONUS" || entry.type === "ORGANIZER_PENALTY";
    return true;
  });

  const currentScore = hintsEnabled
    ? scoreSummary.score
    : scoreSummary.totalGained + scoreSummary.totalAdjustments;

  // =========================================================================
  // STATE A: User HAS a Flagship (Clean Anime Pirate Hub)
  // =========================================================================
  if (user.team) {
    const { team } = user;
    const isRosterLocked = team.isFrozen || pointHistory.length > 0;
    const currentAvatar = preview || (avatarUrlOverride !== undefined ? avatarUrlOverride : team.avatarUrl);
    const hasAvatar = Boolean(currentAvatar);

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

          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* Left: Big Jolly Roger Avatar Crest */}
            <div className="relative shrink-0 flex flex-col items-center justify-center">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 aspect-square rounded-2xl overflow-hidden border-2 border-amber-400 bg-black/70 shadow-[0_0_25px_rgba(251,191,36,0.35)] flex items-center justify-center">
                {hasAvatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentAvatar || ""}
                    alt={team.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Skull className="w-14 h-14 sm:w-16 sm:h-16 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                )}

                {(uploading || deletingAvatar) && (
                  <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-1.5 z-20">
                    <Compass className="w-7 h-7 text-amber-400 animate-spin" />
                    <span className="text-[10px] text-amber-300 font-code font-bold uppercase tracking-wider">
                      {uploading ? "Updating..." : "Removing..."}
                    </span>
                  </div>
                )}
              </div>

              {/* Dedicated action buttons below avatar (clear, accessible on touch and all screens) */}
              {!uploading && !deletingAvatar && (
                <div className="flex items-center justify-center gap-2 mt-2.5 w-full max-w-[180px]">
                  <label
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 text-white text-[11px] font-bold font-code cursor-pointer transition shadow-sm"
                    title={hasAvatar ? "Change Flagship Crest" : "Upload Flagship Crest"}
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{hasAvatar ? "Change" : "Upload"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading || deletingAvatar}
                    />
                  </label>

                  {hasAvatar && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteAvatarModal(true)}
                      disabled={uploading || deletingAvatar}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 active:scale-95 border border-red-500/30 text-red-300 hover:text-white text-[11px] font-bold font-code transition shadow-sm disabled:opacity-50"
                      title="Remove Flagship Crest"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}

              {avatarError && (
                <p className="mt-1 text-[10px] text-red-400 font-code text-center max-w-[160px]">
                  {avatarError}
                </p>
              )}
            </div>

            {/* Right: Identity Header + Bounty */}
            <div className="flex-1 flex flex-col justify-center gap-4 min-w-0 w-full">
              {/* Row: Ship Name & Level + Fleet Bounty */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
                {/* Ship Titles & Level */}
                <div className="min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5 flex-wrap">
                    <span className="px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold uppercase tracking-wider">
                      {team.batchTier === "FIRST_YEAR" ? "Fresher '26" : "Senior"}
                    </span>
                    {isRosterLocked && (
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-amber-400" /> Roster Locked
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-sans tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] truncate max-w-full">
                    {team.name}
                  </h1>

                  <p className="mt-1 text-xs text-white/60 font-code">
                    {team.members.length}/3 Members
                  </p>
                </div>

                {/* Big Anime Bounty Badge */}
                <div className="flex flex-col items-center sm:items-end text-center sm:text-right shrink-0">
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-400/90 mb-0.5 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    Fleet Bounty
                  </span>
                  <div
                    className={cn(
                      "text-3xl sm:text-4xl md:text-5xl font-black font-sans",
                      currentScore < 0
                        ? "text-red-400 drop-shadow-[0_0_16px_rgba(248,113,113,0.6)]"
                        : "text-amber-400 drop-shadow-[0_0_16px_rgba(251,191,36,0.6)]"
                    )}
                  >
                    {currentScore < 0
                      ? `-฿ ${Math.abs(currentScore).toLocaleString()}`
                      : `฿ ${currentScore.toLocaleString()}`}
                  </div>
                  {!isRosterLocked && (
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
            </div>
          </div>
        </motion.div>

        {/* Crew Members */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-black font-sans uppercase tracking-wider text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Crew ({team.members.length}/3)
              </h2>
              {isRosterLocked && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" /> Roster Locked
                </span>
              )}
            </div>
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
                        {formatStudentBranch(member.branch, member.email)} • Batch &apos;{String(member.batchYear).slice(-2)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-code text-white/40">
                    <span>Member {idx + 1}</span>
                  </div>
                </div>
              );
            })}

            {/* Vacant / Locked Slots: If roster is locked, show sealed slot; if open, show invitation slot */}
            {Array.from({ length: 3 - team.members.length }).map((_, vacantIdx) =>
              isRosterLocked ? (
                <div
                  key={`locked-slot-${vacantIdx}`}
                  className="rounded-2xl p-5 border border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col items-center justify-center text-center min-h-[160px]"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mb-2">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-white/60">Slot Locked</div>
                  <p className="text-[11px] font-code text-white/40 mt-1 max-w-[140px]">
                    Roster sealed after hunt activity
                  </p>
                </div>
              ) : (
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
              )
            )}
          </div>
        </div>

        {/* Activity Section: Mutually exclusive lifecycle stages (Ship's Logbook OR Crew Requests) */}
        <div className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-6 shadow-2xl space-y-4">
          {isRosterLocked ? (
            /* STAGE B: Roster is locked / Team active in Hunt -> Show Ship's Log */
            <>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Scroll className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm sm:text-base font-black font-sans uppercase tracking-wider text-white">
                    Ship&apos;s Log ({displayPointHistory.length})
                  </h3>
                </div>

                <div className="flex items-center gap-1 text-xs font-code">
                  {(hintsEnabled
                    ? (["ALL", "SOLVE", "HINT", "TIDES"] as const)
                    : (["ALL", "SOLVE", "TIDES"] as const)
                  ).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setLogFilter(filter)}
                      className={cn(
                        "px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all",
                        effectiveLogFilter === filter
                          ? "bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                          : "text-white/40 hover:text-white"
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ship's Log Entries */}
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
                          <div className="text-[11px] font-code text-white/40" suppressHydrationWarning>
                            {entry.authorName ? `${entry.authorName} • ` : ""}
                            <span suppressHydrationWarning>{formatEventTime(entry.timestamp)}</span>
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
            </>
          ) : (
            /* STAGE A: Team is recruiting -> Show Crew Requests */
            <>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm sm:text-base font-black font-sans uppercase tracking-wider text-white">
                    Crew Requests ({team.joinRequests.length})
                  </h3>
                </div>
              </div>

              {/* Crew Requests List */}
              <div className="space-y-2">
                {team.joinRequests.length === 0 ? (
                  <div className="p-8 text-center text-white/40 font-code text-xs">
                    No pending crew requests right now. Share your ship name to recruit crewmates!
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
                          {formatStudentBranch(req.user.branch, req.user.email)} • {req.user.rollNumber || req.user.email.split("@")[0]}
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            setActionPending(req.id);
                            try {
                              const res = await acceptJoinRequestAction(req.id);
                              if (res.success) router.refresh();
                            } finally {
                              setActionPending(null);
                            }
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
                            try {
                              const res = await rejectJoinRequestAction(req.id);
                              if (res.success) router.refresh();
                            } finally {
                              setActionPending(null);
                            }
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
            </>
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

                {leaveError && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-code text-center">
                    {leaveError}
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      setShowLeaveModal(false);
                      setLeaveError(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs font-code transition-colors"
                  >
                    Stay on Board
                  </button>

                  <button
                    onClick={handleLeaveTeam}
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

        {/* Delete Flagship Crest Modal */}
        <AnimatePresence>
          {showDeleteAvatarModal && (
            <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-24 sm:pt-28 pb-12 overflow-y-auto bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-md w-full rounded-3xl bg-neutral-900 border border-red-500/40 shadow-2xl p-6 text-center space-y-4 my-2"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
                  <Trash2 className="w-6 h-6" />
                </div>

                <h3 className="text-2xl font-black font-sans text-white">
                  Remove Profile Picture?
                </h3>

                <p className="text-xs text-white/70 font-code leading-relaxed">
                  Are you sure you want to delete the flagship crest for <strong className="text-amber-400">{team.name}</strong>?
                  The default Jolly Roger pirate emblem will be restored on your dashboard and wanted posters.
                </p>

                {avatarError && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-code">
                    {avatarError}
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteAvatarModal(false);
                      setAvatarError(null);
                    }}
                    disabled={deletingAvatar}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs font-code transition-colors disabled:opacity-50"
                  >
                    Keep Crest
                  </button>

                  <button
                    type="button"
                    onClick={handleAvatarDelete}
                    disabled={deletingAvatar}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-code transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {deletingAvatar ? (
                      <>
                        <Compass className="w-4 h-4 animate-spin text-white" />
                        <span>Removing...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Remove Crest</span>
                      </>
                    )}
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
  const normalizedQuery = teamSearchQuery.trim().toLowerCase();
  const filteredAvailableTeams = availableTeams.filter((t) => {
    const matchesSearch =
      !normalizedQuery || t.name.toLowerCase().includes(normalizedQuery);
    const matchesCapacity =
      capacityFilter === "ALL" ||
      (capacityFilter === "1" && t.memberCount === 1) ||
      (capacityFilter === "2" && t.memberCount === 2);
    return matchesSearch && matchesCapacity;
  });
  const isFiltered = Boolean(normalizedQuery) || capacityFilter !== "ALL";

  const count1Member = availableTeams.filter((t) => t.memberCount === 1).length;
  const count2Members = availableTeams.filter((t) => t.memberCount === 2).length;

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
          <span>{formatStudentBranch(user.branch, user.email)}</span>
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

              {createError && (
                <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold font-code">
                  {createError}
                </div>
              )}

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
                        try {
                          const res = await cancelJoinRequestAction(req.id);
                          if (res.success) router.refresh();
                        } finally {
                          setActionPending(null);
                        }
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
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg font-black font-sans uppercase tracking-wider text-white flex items-center gap-2">
              <Anchor className="w-4 h-4 text-amber-400" />
              Teams Looking for Members
            </h2>
            <span className="text-xs font-code font-bold px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
              {isFiltered
                ? `${filteredAvailableTeams.length} of ${availableTeams.length}`
                : `${availableTeams.length}`}
            </span>
          </div>

          <span className="text-xs font-code text-amber-400 font-bold self-start sm:self-auto">
            {user.batchTier === "FIRST_YEAR" ? "Fresher '26 Tier" : "Senior Tier"}
          </span>
        </div>

        {/* Search & Capacity Filter Toolbar */}
        {availableTeams.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-amber-400/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={teamSearchQuery}
                onChange={(e) => setTeamSearchQuery(e.target.value)}
                placeholder="Search crew or ship name..."
                aria-label="Search teams looking for members"
                className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-9 py-2 font-sans text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
              />
              {teamSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTeamSearchQuery("")}
                  aria-label="Clear search query"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white active:scale-90 transition-all rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Capacity Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-code shrink-0">
              <button
                type="button"
                onClick={() => setCapacityFilter("ALL")}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer",
                  capacityFilter === "ALL"
                    ? "bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.35)]"
                    : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10"
                )}
              >
                All ({availableTeams.length})
              </button>
              <button
                type="button"
                onClick={() => setCapacityFilter("1")}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer",
                  capacityFilter === "1"
                    ? "bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.35)]"
                    : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10"
                )}
              >
                1/3 Crew ({count1Member})
              </button>
              <button
                type="button"
                onClick={() => setCapacityFilter("2")}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer",
                  capacityFilter === "2"
                    ? "bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.35)]"
                    : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10"
                )}
              >
                2/3 Crew ({count2Members})
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredAvailableTeams.map((t) => (
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

                <h3 className="font-black font-sans text-lg text-white truncate mb-3" title={t.name}>
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
                      try {
                        const res = await sendJoinRequestAction(t.id);
                        if (res.success) router.refresh();
                      } finally {
                        setActionPending(null);
                      }
                    }}
                    disabled={actionPending === t.id}
                    className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-black font-black uppercase text-xs tracking-wider transition-all shadow-[0_0_12px_rgba(251,191,36,0.4)] disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    {actionPending === t.id ? "Sending..." : "Join Crew"}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* No results for current search / filter query */}
          {filteredAvailableTeams.length === 0 && availableTeams.length > 0 && (
            <div className="col-span-full py-12 px-4 text-center bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Search className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-sans font-bold text-base">
                  No crews found matching &ldquo;{teamSearchQuery}&rdquo;
                </p>
                <p className="text-xs text-white/50 font-code">
                  Try checking your spelling or resetting your filters.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTeamSearchQuery("");
                  setCapacityFilter("ALL");
                }}
                className="mt-1 px-4 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 active:scale-95 text-amber-300 hover:text-amber-200 border border-amber-400/30 text-xs font-code font-bold transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Search</span>
              </button>
            </div>
          )}

          {/* Zero teams overall in this tier */}
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
