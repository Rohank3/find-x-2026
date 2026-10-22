"use client";

import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
import {
  Lock,
  Send,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Edit3,
  Sliders,
  Search,
  CheckCircle2,
  Trash2,
  Megaphone,
  Clock,
  Anchor,
  Compass,
  Skull,
  Swords,
  Coins,
  Scroll,
  ShieldCheck,
  CloudFog,
  Map,
  Sparkles,
  Upload,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
  Users,
} from "@/components/icons";
import { useRouter } from "next/navigation";
import {
  updateCompetitionStateAction,
  updateCompetitionScheduleAction,
  createAnnouncementAction,
  deleteAnnouncementAction,
  unlockTeamLockoutAction,
  upsertPuzzleAction,
  swapPuzzleOrderAction,
  replyToSupportTicketAction,
  adjustTeamScoreAction,
  deleteScoreAdjustmentAction,
  updateLeaderboardDisplaySettingsAction,
  upsertHintAction,
  deleteHintAction,
  updateLockoutSettingsAction,
  getSubmissionsPageAction,
  getStorageStatusAction,
  migrateStorageToCloudAction,
  clearAllPuzzlesAction,
  clearAllTeamsAndUsersAction,
  resetEntireDatabaseAction,
} from "./actions";
import type { SubmissionsPageData } from "./actions";
import dynamic from "next/dynamic";
import type {
  RosterTeam,
  AdminTeamData,
} from "@/components/team/AdminTeamRosterModal";
import type { StagedEvidence } from "@/components/admin/EvidenceManager";

const AdminTeamRosterModal = dynamic(
  () => import("@/components/team/AdminTeamRosterModal"),
  { ssr: false }
);

const ExpeditionCurator = dynamic(
  () => import("@/components/admin/ExpeditionCurator"),
  {
    ssr: false,
    loading: () => (
      <div className="p-12 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center space-y-4 text-amber-400 font-mono text-sm">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span>Deploying Expedition Curator...</span>
      </div>
    ),
  }
);

const EvidenceManager = dynamic(
  () => import("@/components/admin/EvidenceManager"),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center space-x-3 text-amber-300 font-mono text-xs">
        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span>Synchronizing Evidence Vault...</span>
      </div>
    ),
  }
);

export interface AdminPuzzleAsset {
  id: string;
  title?: string | null;
  url: string;
  type: string;
  orderIndex?: number;
}

interface AdminHint {
  id: string;
  orderIndex: number;
  content: string;
  penaltyPoints: number;
  unlockDelayMinutes: number;
}

interface AdminPuzzle {
  id: string;
  orderIndex: number;
  title: string;
  description: string;
  assetUrl: string | null;
  assetType: string | null;
  assets?: AdminPuzzleAsset[];
  basePoints: number;
  acceptedAnswers: string[];
  hints: AdminHint[];
  _count?: { submissions: number };
}

interface AdminTicket {
  id: string;
  category: string;
  message: string;
  adminReply: string | null;
  status: string;
  team: { name: string };
  user: { name: string | null; email: string };
  puzzle: { orderIndex: number; title: string };
}

interface AdminScoreAdjustment {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date | string;
  teamId: string;
  team: { id: string; name: string } | null;
  createdBy: { id: string; name: string | null; email: string } | null;
}

interface AdminAnnouncement {
  id: string;
  message: string;
  retentionDays: number;
  createdAt: string;
  expiresAt: string;
}

export interface AdminConfig {
  id?: string;
  broadcastMessage: string | null;
  competitionState: string;
  startTime?: string | null;
  endTime?: string | null;
  freezeTime?: Date | string | null;
  leaderboardMode?: string;
  showQuestionsSolved?: boolean;
  showPointHistory?: boolean;
  hideTeamNames?: boolean;
  supportFeatureEnabled?: boolean;
  hintsEnabled?: boolean;
  neonKeepAliveEnabled?: boolean;
  activeWaypointKeys?: string[];
  lockoutMaxAttempts?: number;
  lockoutWindowMinutes?: number;
  lockoutDurationMinutes?: number;
  announcementRetentionDays?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

function toDatetimeLocalString(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateTimeDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return "Not scheduled";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

export const TAB_IDS = [
  "STATE",
  "EXPEDITION",
  "SUBMISSIONS",
  "POINTS",
  "LOCKOUTS",
  "PUZZLES",
  "TICKETS",
  "DATABASE",
] as const;
type AdminTab = (typeof TAB_IDS)[number];

interface AdminClientProps {
  config: AdminConfig | null;
  activeLockouts: Array<{ teamId: string; puzzleId: string; remainingSeconds: number }>;
  puzzles: AdminPuzzle[];
  tickets: AdminTicket[];
  teamNameMap: Record<string, string>;
  teams?: AdminTeamData[];
  scoreAdjustments?: AdminScoreAdjustment[];
  announcements?: AdminAnnouncement[];
}

export default function AdminClient({
  config,
  activeLockouts,
  puzzles,
  tickets,
  teamNameMap,
  teams = [],
  scoreAdjustments = [],
  announcements = [],
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("STATE");
  const [currentState, setCurrentState] = useState(config?.competitionState || "LIVE");

  // Timer schedule state (Start Time, Freeze Time, and End Time)
  const [startTimeInput, setStartTimeInput] = useState<string>(
    toDatetimeLocalString(config?.startTime)
  );
  const [freezeTimeInput, setFreezeTimeInput] = useState<string>(
    toDatetimeLocalString(config?.freezeTime)
  );
  const [endTimeInput, setEndTimeInput] = useState<string>(
    toDatetimeLocalString(config?.endTime)
  );
  const [savedStartTime, setSavedStartTime] = useState<string | null>(
    config?.startTime ?? null
  );
  const [savedFreezeTime, setSavedFreezeTime] = useState<string | null>(
    config?.freezeTime ? new Date(config.freezeTime).toISOString() : null
  );
  const [savedEndTime, setSavedEndTime] = useState<string | null>(
    config?.endTime ?? null
  );

  const mounted = useMounted();

  const [prevStartTime, setPrevStartTime] = useState(config?.startTime);
  const [prevFreezeTime, setPrevFreezeTime] = useState(config?.freezeTime);
  const [prevEndTime, setPrevEndTime] = useState(config?.endTime);
  const [prevCompState, setPrevCompState] = useState(config?.competitionState);

  if (
    config?.startTime !== prevStartTime ||
    config?.freezeTime !== prevFreezeTime ||
    config?.endTime !== prevEndTime ||
    config?.competitionState !== prevCompState
  ) {
    setPrevStartTime(config?.startTime);
    setPrevFreezeTime(config?.freezeTime);
    setPrevEndTime(config?.endTime);
    setPrevCompState(config?.competitionState);
    setStartTimeInput(toDatetimeLocalString(config?.startTime));
    setFreezeTimeInput(toDatetimeLocalString(config?.freezeTime));
    setEndTimeInput(toDatetimeLocalString(config?.endTime));
    setSavedStartTime(config?.startTime ?? null);
    setSavedFreezeTime(config?.freezeTime ? new Date(config.freezeTime).toISOString() : null);
    setSavedEndTime(config?.endTime ?? null);
    if (config?.competitionState) {
      setCurrentState(config.competitionState);
    }
  }

  // Detected browser timezone for unambiguous display
  const detectedTimeZone = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
      const now = new Date();
      const offsetMin = -now.getTimezoneOffset();
      const sign = offsetMin >= 0 ? "+" : "-";
      const absMin = Math.abs(offsetMin);
      const hrs = String(Math.floor(absMin / 60)).padStart(2, "0");
      const mins = String(absMin % 60).padStart(2, "0");
      return `${tz} (UTC${sign}${hrs}:${mins})`;
    } catch {
      return "Local Timezone";
    }
  }, []);

  // Quick preset handlers
  const setQuickStartTime = (preset: "today-4pm" | "today-6pm" | "plus-1h" | "plus-2h") => {
    const target = new Date();
    if (preset === "today-4pm") {
      target.setHours(16, 0, 0, 0);
    } else if (preset === "today-6pm") {
      target.setHours(18, 0, 0, 0);
    } else if (preset === "plus-1h") {
      target.setTime(target.getTime() + 1 * 60 * 60 * 1000);
      target.setSeconds(0, 0);
    } else if (preset === "plus-2h") {
      target.setTime(target.getTime() + 2 * 60 * 60 * 1000);
      target.setSeconds(0, 0);
    }
    setStartTimeInput(toDatetimeLocalString(target));
  };

  const setQuickEndTimeFromStart = (hoursAfterStart: number) => {
    const base = startTimeInput ? new Date(startTimeInput) : new Date();
    if (isNaN(base.getTime())) return;
    const target = new Date(base.getTime() + hoursAfterStart * 60 * 60 * 1000);
    setEndTimeInput(toDatetimeLocalString(target));
  };

  // Warning calculations
  const [isStartTimeInPast, setIsStartTimeInPast] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!startTimeInput) {
        setIsStartTimeInPast(false);
        return;
      }
      const d = new Date(startTimeInput);
      setIsStartTimeInPast(!isNaN(d.getTime()) && d.getTime() <= Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, [startTimeInput]);

  const isEndBeforeStart = useMemo(() => {
    if (!startTimeInput || !endTimeInput) return false;
    const s = new Date(startTimeInput).getTime();
    const e = new Date(endTimeInput).getTime();
    return !isNaN(s) && !isNaN(e) && e <= s;
  }, [startTimeInput, endTimeInput]);

  // Active countdown target for landing page based on currentState
  const activeCountdownTarget =
    currentState === "UPCOMING"
      ? savedStartTime
      : currentState === "LIVE" || currentState === "FROZEN"
      ? savedEndTime
      : null;

  const [previewRemaining, setPreviewRemaining] = useState({
    d: 0,
    h: 0,
    m: 0,
    s: 0,
    isPast: false,
    hasTarget: Boolean(activeCountdownTarget),
  });

  useEffect(() => {
    if (!activeCountdownTarget) return;
    const target = new Date(activeCountdownTarget).getTime();
    const updateCountdown = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setPreviewRemaining({ d: 0, h: 0, m: 0, s: 0, isPast: true, hasTarget: true });
        return;
      }
      setPreviewRemaining({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        isPast: false,
        hasTarget: true,
      });
    };
    const id = setInterval(updateCountdown, 1000);
    return () => clearInterval(id);
  }, [activeCountdownTarget]);

  const router = useRouter();

  // Purge confirmation modal state
  type PurgeActionType = "CLEAR_PUZZLES" | "CLEAR_TEAMS" | "RESET_DATABASE";
  const [purgeTarget, setPurgeTarget] = useState<PurgeActionType | null>(null);
  const [purgeConfirmationInput, setPurgeConfirmationInput] = useState<string>("");
  const [isPurging, setIsPurging] = useState<boolean>(false);

  const handleOpenPurgeModal = (target: PurgeActionType) => {
    setPurgeTarget(target);
    setPurgeConfirmationInput("");
  };

  const handleClosePurgeModal = () => {
    if (isPurging) return;
    setPurgeTarget(null);
    setPurgeConfirmationInput("");
  };

  const getExpectedPhrase = (target: PurgeActionType): string => {
    switch (target) {
      case "CLEAR_PUZZLES":
        return "CLEAR PUZZLES";
      case "CLEAR_TEAMS":
        return "CLEAR TEAMS";
      case "RESET_DATABASE":
        return "RESET DATABASE";
    }
  };

  const handleConfirmPurge = async () => {
    if (!purgeTarget) return;
    const expected = getExpectedPhrase(purgeTarget);
    if (purgeConfirmationInput.trim().toUpperCase() !== expected) return;

    setIsPurging(true);
    try {
      if (purgeTarget === "CLEAR_PUZZLES") {
        const res = await clearAllPuzzlesAction();
        if (res.success) {
          setLocalPuzzles([]);
          setSubsPage(null);
          setFeedback(`All ${res.count ?? 0} puzzles, clues, and expedition waypoint bindings cleared successfully.`);
          setPurgeTarget(null);
          setPurgeConfirmationInput("");
          router.refresh();
        } else {
          setFeedback(res.error || "Failed to clear all puzzles.");
        }
      } else if (purgeTarget === "CLEAR_TEAMS") {
        const res = await clearAllTeamsAndUsersAction();
        if (res.success) {
          setSubsPage(null);
          setFeedback(`Cleared ${res.teamsDeleted ?? 0} teams and ${res.usersDeleted ?? 0} student users. Organizer accounts preserved.`);
          setPurgeTarget(null);
          setPurgeConfirmationInput("");
          router.refresh();
        } else {
          setFeedback(res.error || "Failed to clear teams and users.");
        }
      } else if (purgeTarget === "RESET_DATABASE") {
        const res = await resetEntireDatabaseAction();
        if (res.success) {
          setLocalPuzzles([]);
          setLocalAnnouncements([]);
          setSubsPage(null);
          setCurrentState("UPCOMING");
          setStartTimeInput("");
          setFreezeTimeInput("");
          setEndTimeInput("");
          setSavedStartTime(null);
          setSavedFreezeTime(null);
          setSavedEndTime(null);
          setFeedback("Grand Line Factory Reset complete! Database and voyage restored to brand new state.");
          setPurgeTarget(null);
          setPurgeConfirmationInput("");
          router.refresh();
        } else {
          setFeedback(res.error || "Failed to reset entire database.");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during database operation.";
      setFeedback(msg);
    } finally {
      setIsPurging(false);
    }
  };

  const [ticketReplies, setTicketReplies] = useState<Record<string, string>>({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedRosterTeam, setSelectedRosterTeam] = useState<RosterTeam | AdminTeamData | null>(
    null
  );

  // Local state for puzzles and stacked announcements
  const [localPuzzles, setLocalPuzzles] = useState<AdminPuzzle[]>(puzzles);
  const [localAnnouncements, setLocalAnnouncements] =
    useState<AdminAnnouncement[]>(announcements);

  const [prevPuzzles, setPrevPuzzles] = useState(puzzles);
  if (puzzles !== prevPuzzles) {
    setPrevPuzzles(puzzles);
    setLocalPuzzles(puzzles);
  }

  const [prevAnnouncements, setPrevAnnouncements] = useState(announcements);
  if (announcements !== prevAnnouncements) {
    setPrevAnnouncements(announcements);
    setLocalAnnouncements(announcements);
  }

  const [newAnnouncementText, setNewAnnouncementText] = useState<string>("");
  const [newAnnouncementDays, setNewAnnouncementDays] = useState<number>(
    config?.announcementRetentionDays ?? 3
  );

  // Submissions filter state
  const [subFilterTeam, setSubFilterTeam] = useState<string>("ALL");
  const [subFilterPuzzle, setSubFilterPuzzle] = useState<string>("ALL");
  const [subFilterStatus, setSubFilterStatus] = useState<"ALL" | "CORRECT" | "INCORRECT">("ALL");
  const [subSearchQuery, setSubSearchQuery] = useState<string>("");
  const [debouncedSubSearch, setDebouncedSubSearch] = useState<string>("");
  const [subsPage, setSubsPage] = useState<SubmissionsPageData | null>(null);
  const [subsLoading, setSubsLoading] = useState(false);

  // Score adjustments & display state
  const [showQuestionsSolved, setShowQuestionsSolved] = useState<boolean>(
    config?.showQuestionsSolved ?? true
  );
  const [showPointHistory, setShowPointHistory] = useState<boolean>(
    config?.showPointHistory ?? true
  );
  const [hideTeamNames, setHideTeamNames] = useState<boolean>(config?.hideTeamNames ?? false);
  const [supportFeatureEnabled, setSupportFeatureEnabled] = useState<boolean>(
    config?.supportFeatureEnabled ?? true
  );
  const [hintsEnabled, setHintsEnabled] = useState<boolean>(config?.hintsEnabled ?? false);
  const [neonKeepAliveEnabled, setNeonKeepAliveEnabled] = useState<boolean>(
    config?.neonKeepAliveEnabled ?? false
  );
  const [adjustTeamId, setAdjustTeamId] = useState<string>(teams.length > 0 ? teams[0].id : "");
  const [adjustType, setAdjustType] = useState<"BONUS" | "PENALTY">("BONUS");
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [teamSearchQuery, setTeamSearchQuery] = useState<string>("");
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState<boolean>(false);

  // Add Hint modal state
  const [hintModalPuzzle, setHintModalPuzzle] = useState<AdminPuzzle | null>(null);
  const [newHintContent, setNewHintContent] = useState<string>("");
  const [newHintPenalty, setNewHintPenalty] = useState<number>(20);
  const [newHintDelay, setNewHintDelay] = useState<number>(15);

  // Evidence storage & Supabase migration state
  const [storageStatus, setStorageStatus] = useState<{
    isCloudConfigured: boolean;
    bucket?: string;
    publicBase?: string;
    dbMediaCount: number;
    totalDbBytes: number;
    cloudAssetsCount: number;
    dbAssetsCount: number;
  } | null>(null);
  const [isMigratingStorage, setIsMigratingStorage] = useState(false);
  const [storageMessage, setStorageMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const refreshStorageStatus = useCallback(async () => {
    try {
      const res = await getStorageStatusAction();
      if (res.success) {
        setStorageStatus({
          isCloudConfigured: res.isCloudConfigured,
          bucket: res.bucket,
          publicBase: res.publicBase,
          dbMediaCount: res.dbMediaCount,
          totalDbBytes: res.totalDbBytes,
          cloudAssetsCount: res.cloudAssetsCount,
          dbAssetsCount: res.dbAssetsCount,
        });
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (activeTab === "PUZZLES") {
      const timer = window.setTimeout(() => {
        refreshStorageStatus();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [activeTab, refreshStorageStatus]);

  const handleMigrateStorage = async () => {
    setIsMigratingStorage(true);
    setStorageMessage(null);
    try {
      const res = await migrateStorageToCloudAction();
      if (res.success) {
        setStorageMessage({
          type: "success",
          text: `Successfully transferred ${res.migratedCount} asset(s) (${Math.round(
            (res.totalFreedBytes || 0) / 1024
          )} KB) to Supabase Storage and reclaimed database memory!`,
        });
        await refreshStorageStatus();
      } else {
        setStorageMessage({
          type: "error",
          text: res.error || "Failed to migrate media to Supabase storage.",
        });
      }
    } catch (err: unknown) {
      setStorageMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Migration failed.",
      });
    } finally {
      setIsMigratingStorage(false);
    }
  };

  // Staged hints state for Add New Puzzle separate column
  const [stagedHints, setStagedHints] = useState<
    Array<{ id: string; content: string; penaltyPoints: number; unlockDelayMinutes: number }>
  >([]);
  const [stagedHintContent, setStagedHintContent] = useState("");
  const [stagedHintPenalty, setStagedHintPenalty] = useState(20);
  const [stagedHintDelay, setStagedHintDelay] = useState(15);

  // Lockout settings state
  const [lockoutMaxAttempts, setLockoutMaxAttempts] = useState<number>(
    config?.lockoutMaxAttempts ?? 5
  );
  const [lockoutWindowMinutes, setLockoutWindowMinutes] = useState<number>(
    config?.lockoutWindowMinutes ?? 2
  );
  const [lockoutDurationMinutes, setLockoutDurationMinutes] = useState<number>(
    config?.lockoutDurationMinutes ?? 5
  );

  // New puzzle form state
  const [showPuzzleModal, setShowPuzzleModal] = useState(false);
  const [newPuzzleOrder, setNewPuzzleOrder] = useState(puzzles.length + 1);
  const [newPuzzleTitle, setNewPuzzleTitle] = useState("");
  const [newPuzzleDesc, setNewPuzzleDesc] = useState("");
  const [newPuzzleAssets, setNewPuzzleAssets] = useState<StagedEvidence[]>([]);
  const [newPuzzlePoints, setNewPuzzlePoints] = useState(100);
  const [newPuzzleAnswers, setNewPuzzleAnswers] = useState("");

  // Edit puzzle form state
  const [editingPuzzle, setEditingPuzzle] = useState<AdminPuzzle | null>(null);
  const [editOrder, setEditOrder] = useState<number>(1);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPuzzleAssets, setEditPuzzleAssets] = useState<StagedEvidence[]>([]);
  const [editPoints, setEditPoints] = useState(100);
  const [editAnswers, setEditAnswers] = useState("");

  // Debounce the submissions search box
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSubSearch(subSearchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [subSearchQuery]);

  // Fetch one server-side page of submissions
  const loadSubsPage = useCallback(
    async (page: number) => {
      setSubsLoading(true);
      const res = await getSubmissionsPageAction({
        page,
        search: debouncedSubSearch || undefined,
        status: subFilterStatus,
        teamId: subFilterTeam === "ALL" ? undefined : subFilterTeam,
        puzzleId: subFilterPuzzle === "ALL" ? undefined : subFilterPuzzle,
      });
      setSubsLoading(false);

      if (res.success && res.data) {
        setSubsPage(res.data);
      } else {
        setFeedback(res.error || "Failed to load voyage submissions.");
      }
    },
    [debouncedSubSearch, subFilterStatus, subFilterTeam, subFilterPuzzle]
  );

  useEffect(() => {
    if (activeTab !== "SUBMISSIONS") return;
    const t = window.setTimeout(() => loadSubsPage(1), 0);
    return () => window.clearTimeout(t);
  }, [activeTab, subFilterTeam, subFilterPuzzle, subFilterStatus, debouncedSubSearch, loadSubsPage]);

  // Global Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPuzzleModal(false);
        setEditingPuzzle(null);
        setHintModalPuzzle(null);
        setIsTeamDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle Competition State Change
  const handleStateChange = async (state: "UPCOMING" | "LIVE" | "FROZEN" | "ENDED") => {
    setLoadingAction(`state-${state}`);
    const res = await updateCompetitionStateAction(state);
    setLoadingAction(null);

    if (res.success) {
      setCurrentState(state);
      setFeedback(`Voyage phase successfully set to ${state}.`);
    } else {
      setFeedback(res.error || "Failed to update voyage state.");
    }
  };

  // Helper to convert datetime-local input string into ISO string with browser's local timezone
  const toISOStringOrNull = (datetimeLocalVal: string): string | null => {
    if (!datetimeLocalVal || !datetimeLocalVal.trim()) return null;
    const date = new Date(datetimeLocalVal);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  };

  // Handle Save Landing Schedule
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("save-schedule");

    const payload = {
      startTime: toISOStringOrNull(startTimeInput),
      freezeTime: toISOStringOrNull(freezeTimeInput),
      endTime: toISOStringOrNull(endTimeInput),
    };

    const res = await updateCompetitionScheduleAction(payload);
    setLoadingAction(null);

    if (res.success) {
      setSavedStartTime(res.startTime ?? null);
      setSavedFreezeTime(res.freezeTime ?? null);
      setSavedEndTime(res.endTime ?? null);
      if (res.startTime) setStartTimeInput(toDatetimeLocalString(res.startTime));
      if (res.freezeTime) setFreezeTimeInput(toDatetimeLocalString(res.freezeTime));
      if (res.endTime) setEndTimeInput(toDatetimeLocalString(res.endTime));
      setFeedback("Grand Line chronometer schedule locked in.");
    } else {
      setFeedback(res.error || "Failed to save schedule.");
    }
  };

  // Handle Clear Landing Schedule
  const handleClearSchedule = async () => {
    setLoadingAction("clear-schedule");
    const res = await updateCompetitionScheduleAction({
      startTime: null,
      freezeTime: null,
      endTime: null,
    });
    setLoadingAction(null);

    if (res.success) {
      setStartTimeInput("");
      setFreezeTimeInput("");
      setEndTimeInput("");
      setSavedStartTime(null);
      setSavedFreezeTime(null);
      setSavedEndTime(null);
      setFeedback("Voyage schedule cleared.");
    } else {
      setFeedback(res.error || "Failed to clear schedule.");
    }
  };

  // Handle Stacked Announcement Creation
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;

    setLoadingAction("create-announcement");
    const res = await createAnnouncementAction({
      message: newAnnouncementText.trim(),
      retentionDays: newAnnouncementDays,
    });
    setLoadingAction(null);

    if (res.success && res.announcement) {
      setLocalAnnouncements((prev) => [
        {
          id: res.announcement!.id,
          message: res.announcement!.message,
          retentionDays: res.announcement!.retentionDays,
          createdAt: res.announcement!.createdAt,
          expiresAt: res.announcement!.expiresAt,
        },
        ...prev,
      ]);
      setNewAnnouncementText("");
      setFeedback("Imperial Transponder decree broadcasted across the fleet.");
    } else {
      setFeedback(res.error || "Failed to broadcast announcement.");
    }
  };

  // Handle Delete Stacked Announcement
  const handleDeleteAnnouncement = async (id: string) => {
    setLoadingAction(`delete-announcement-${id}`);
    const res = await deleteAnnouncementAction(id);
    setLoadingAction(null);

    if (res.success) {
      setLocalAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setFeedback("Decree retracted from transmission logs.");
    } else {
      setFeedback(res.error || "Failed to delete decree.");
    }
  };

  // Handle Unlock Lockout
  const handleUnlock = async (teamId: string, puzzleId: string) => {
    setLoadingAction(`unlock-${teamId}-${puzzleId}`);
    const res = await unlockTeamLockoutAction(teamId, puzzleId);
    setLoadingAction(null);

    if (res.success) {
      setFeedback("Crew pardoned and released from the brig.");
    } else {
      setFeedback(res.error || "Failed to unlock crew.");
    }
  };

  // Handle Create Puzzle
  const handleCreatePuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("create-puzzle");

    const answersArray = newPuzzleAnswers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const hintsArray = stagedHints.map((h, idx) => ({
      content: h.content,
      penaltyPoints: h.penaltyPoints,
      unlockDelayMinutes: h.unlockDelayMinutes,
      orderIndex: idx + 1,
    }));

    const res = await upsertPuzzleAction({
      orderIndex: Number(newPuzzleOrder),
      title: newPuzzleTitle.trim(),
      description: newPuzzleDesc.trim(),
      assets: newPuzzleAssets.map((a) => ({
        title: a.title.trim(),
        url: a.url.trim(),
        type: a.type,
      })),
      basePoints: Number(newPuzzlePoints),
      acceptedAnswers: answersArray,
      initialHints: hintsArray.map((h) => ({
        content: h.content,
        penaltyPoints: h.penaltyPoints,
        unlockDelayMinutes: h.unlockDelayMinutes,
      })),
    });
    setLoadingAction(null);

    if (res.success) {
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      const createdPuzzle: AdminPuzzle = {
        id: "puz-" + now,
        orderIndex: Number(newPuzzleOrder),
        title: newPuzzleTitle.trim(),
        description: newPuzzleDesc.trim(),
        assetUrl: newPuzzleAssets[0]?.url || null,
        assetType: newPuzzleAssets[0]?.type || null,
        assets: newPuzzleAssets.map((a, i) => ({
          id: a.id,
          title: a.title,
          url: a.url,
          type: a.type,
          orderIndex: i + 1,
        })),
        basePoints: Number(newPuzzlePoints),
        acceptedAnswers: answersArray,
        hints: hintsArray.map((h, i) => ({ id: `hint-${now}-${i}`, ...h })),
        _count: { submissions: 0 },
      };
      setLocalPuzzles((prev) =>
        [...prev, createdPuzzle].sort((a, b) => a.orderIndex - b.orderIndex)
      );

      setShowPuzzleModal(false);
      setNewPuzzleTitle("");
      setNewPuzzleDesc("");
      setNewPuzzleAssets([]);
      setNewPuzzleAnswers("");
      setStagedHints([]);
      setFeedback(`Island #${newPuzzleOrder} "${newPuzzleTitle}" successfully chartered.`);
    } else {
      setFeedback(res.error || "Failed to charter island.");
    }
  };

  // Open Edit Modal
  const openEditModal = (p: AdminPuzzle) => {
    setEditingPuzzle(p);
    setEditOrder(p.orderIndex);
    setEditTitle(p.title);
    setEditDesc(p.description);
    setEditPoints(p.basePoints);
    setEditAnswers(p.acceptedAnswers.join(", "));

    const initialAssets: StagedEvidence[] =
      p.assets && p.assets.length > 0
        ? p.assets.map((a, i) => ({
            id: a.id || `ev-init-${i}`,
            title: a.title || `Evidence #${i + 1}`,
            url: a.url,
            type: (a.type as "image" | "audio" | "pdf" | "video") || "image",
          }))
        : p.assetUrl
        ? [
            {
              id: `ev-legacy-${p.id}`,
              title: "Primary Evidence",
              url: p.assetUrl,
              type: (p.assetType as "image" | "audio" | "pdf" | "video") || "image",
            },
          ]
        : [];
    setEditPuzzleAssets(initialAssets);
  };

  // Handle Update Puzzle
  const handleUpdatePuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPuzzle) return;

    setLoadingAction("update-puzzle");
    const answersArray = editAnswers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await upsertPuzzleAction({
      id: editingPuzzle.id,
      orderIndex: Number(editOrder),
      title: editTitle.trim(),
      description: editDesc.trim(),
      assets: editPuzzleAssets.map((a) => ({
        title: a.title.trim(),
        url: a.url.trim(),
        type: a.type,
      })),
      basePoints: Number(editPoints),
      acceptedAnswers: answersArray,
    });
    setLoadingAction(null);

    if (res.success) {
      setLocalPuzzles((prev) =>
        prev
          .map((p) =>
            p.id === editingPuzzle.id
              ? {
                  ...p,
                  orderIndex: Number(editOrder),
                  title: editTitle.trim(),
                  description: editDesc.trim(),
                  assetUrl: editPuzzleAssets[0]?.url || null,
                  assetType: editPuzzleAssets[0]?.type || null,
                  assets: editPuzzleAssets.map((a, i) => ({
                    id: a.id,
                    title: a.title,
                    url: a.url,
                    type: a.type,
                    orderIndex: i + 1,
                  })),
                  basePoints: Number(editPoints),
                  acceptedAnswers: answersArray,
                }
              : p
          )
          .sort((a, b) => a.orderIndex - b.orderIndex)
      );

      setEditingPuzzle(null);
      setFeedback(`Island "${editTitle.trim()}" coordinates updated.`);
    } else {
      setFeedback(res.error || "Failed to update island coordinates.");
    }
  };

  // Handle Swap Puzzle Order
  const handleSwapOrder = async (puzzle: AdminPuzzle, direction: "UP" | "DOWN") => {
    setLoadingAction(`swap-${puzzle.id}-${direction}`);
    const res = await swapPuzzleOrderAction(puzzle.id, direction);
    setLoadingAction(null);

    if (res.success) {
      setLocalPuzzles((prev) => {
        const idx = prev.findIndex((p) => p.id === puzzle.id);
        if (idx === -1) return prev;
        const targetIdx = direction === "UP" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= prev.length) return prev;
        const copy = [...prev];
        const temp = copy[idx];
        copy[idx] = copy[targetIdx];
        copy[targetIdx] = temp;
        return copy.map((p, i) => ({ ...p, orderIndex: i + 1 }));
      });
      setFeedback(`Island order shifted ${direction.toLowerCase()}.`);
    } else {
      setFeedback(res.error || "Failed to swap island order.");
    }
  };

  // Handle Add Hint
  const handleSaveHint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hintModalPuzzle) return;

    setLoadingAction("save-hint");
    const nextOrder =
      hintModalPuzzle.hints && hintModalPuzzle.hints.length > 0
        ? Math.max(...hintModalPuzzle.hints.map((h) => h.orderIndex)) + 1
        : 1;

    const targetPuzzleId = hintModalPuzzle.id;
    const res = await upsertHintAction({
      puzzleId: targetPuzzleId,
      orderIndex: nextOrder,
      content: newHintContent.trim(),
      penaltyPoints: Number(newHintPenalty),
      unlockDelayMinutes: Number(newHintDelay),
    });
    setLoadingAction(null);

    if (res.success && res.hint) {
      const createdHint: AdminHint = res.hint;
      setLocalPuzzles((prev) =>
        prev.map((p) =>
          p.id === targetPuzzleId
            ? { ...p, hints: [...(p.hints || []), createdHint] }
            : p
        )
      );
      setHintModalPuzzle((prev) =>
        prev && prev.id === targetPuzzleId
          ? { ...prev, hints: [...(prev.hints || []), createdHint] }
          : prev
      );
      setNewHintContent("");
      setFeedback(`Clue #${createdHint.orderIndex} attached to "${hintModalPuzzle.title}".`);
    } else {
      setFeedback(res.error || "Failed to attach clue.");
    }
  };

  // Handle Delete Hint
  const handleDeleteHint = async (puzzleId: string, hintId: string) => {
    setLoadingAction(`delete-hint-${hintId}`);
    const res = await deleteHintAction(hintId);
    setLoadingAction(null);

    if (res.success) {
      setLocalPuzzles((prev) =>
        prev.map((p) =>
          p.id === puzzleId
            ? { ...p, hints: (p.hints || []).filter((h) => h.id !== hintId) }
            : p
        )
      );
      setHintModalPuzzle((prev) =>
        prev && prev.id === puzzleId
          ? { ...prev, hints: (prev.hints || []).filter((h) => h.id !== hintId) }
          : prev
      );
      setFeedback("Clue removed from expedition logs.");
    } else {
      setFeedback(res.error || "Failed to delete clue.");
    }
  };

  // Handle Reply Support Ticket
  const handleReplyTicket = async (ticketId: string) => {
    const reply = ticketReplies[ticketId];
    if (!reply || !reply.trim()) return;

    setLoadingAction(`reply-${ticketId}`);
    const res = await replyToSupportTicketAction(ticketId, reply.trim());
    setLoadingAction(null);

    if (res.success) {
      setFeedback("Transponder Snail response dispatched.");
      setTicketReplies((prev) => ({ ...prev, [ticketId]: "" }));
    } else {
      setFeedback(res.error || "Failed to dispatch snail transmission.");
    }
  };

  // Handle Manual Score Adjustment
  const handleAdjustScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTeamId) {
      setFeedback("Select a target pirate crew first.");
      return;
    }
    if (!adjustReason.trim()) {
      setFeedback("A captain's log reason is required for score adjustments.");
      return;
    }
    const finalAmount = adjustType === "BONUS" ? Math.abs(adjustAmount) : -Math.abs(adjustAmount);

    setLoadingAction("adjust-score");
    const res = await adjustTeamScoreAction({
      teamId: adjustTeamId,
      amount: finalAmount,
      reason: adjustReason.trim(),
    });
    setLoadingAction(null);

    if (res.success) {
      const selectedCrewName =
        teams.find((t) => t.id === adjustTeamId)?.name || adjustTeamId;
      setFeedback(
        `Bounty of ${finalAmount > 0 ? `+${finalAmount}` : finalAmount} ฿ applied to ${selectedCrewName}.`
      );
      setAdjustReason("");
    } else {
      setFeedback(res.error || "Failed to apply bounty adjustment.");
    }
  };

  // Handle Delete Score Adjustment
  const handleDeleteAdjustment = async (adjId: string) => {
    if (!confirm("Are you sure you want to revert this bounty adjustment?")) return;
    setLoadingAction(`delete-adj-${adjId}`);
    const res = await deleteScoreAdjustmentAction(adjId);
    setLoadingAction(null);

    if (res.success) {
      setFeedback("Bounty adjustment reverted in the ledger.");
    } else {
      setFeedback(res.error || "Failed to revert adjustment.");
    }
  };

  // Handle Toggle Leaderboard Display Settings
  const handleToggleDisplay = async (
    field:
      | "showQuestionsSolved"
      | "showPointHistory"
      | "hideTeamNames"
      | "supportFeatureEnabled"
      | "hintsEnabled"
      | "neonKeepAliveEnabled",
    val: boolean
  ) => {
    setLoadingAction(`toggle-${field}`);
    const res = await updateLeaderboardDisplaySettingsAction({
      showQuestionsSolved: field === "showQuestionsSolved" ? val : showQuestionsSolved,
      showPointHistory: field === "showPointHistory" ? val : showPointHistory,
      hideTeamNames: field === "hideTeamNames" ? val : hideTeamNames,
      supportFeatureEnabled: field === "supportFeatureEnabled" ? val : supportFeatureEnabled,
      hintsEnabled: field === "hintsEnabled" ? val : hintsEnabled,
      neonKeepAliveEnabled: field === "neonKeepAliveEnabled" ? val : neonKeepAliveEnabled,
    });
    setLoadingAction(null);

    if (res.success) {
      if (field === "showQuestionsSolved") setShowQuestionsSolved(val);
      if (field === "showPointHistory") setShowPointHistory(val);
      if (field === "hideTeamNames") setHideTeamNames(val);
      if (field === "supportFeatureEnabled") setSupportFeatureEnabled(val);
      if (field === "hintsEnabled") setHintsEnabled(val);
      if (field === "neonKeepAliveEnabled") setNeonKeepAliveEnabled(val);
      setFeedback("Fleet visibility governance settings updated.");
    } else {
      setFeedback(res.error || "Failed to update governance settings.");
    }
  };

  // Handle save lockout settings
  const handleSaveLockoutSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("lockout-settings");
    const res = await updateLockoutSettingsAction({
      lockoutMaxAttempts: Math.max(1, Number(lockoutMaxAttempts)),
      lockoutWindowMinutes: Math.max(1, Number(lockoutWindowMinutes)),
      lockoutDurationMinutes: Math.max(1, Number(lockoutDurationMinutes)),
    });
    setLoadingAction(null);
    if (res.success) {
      setFeedback("Marine Brig security protocols calibrated.");
    } else {
      setFeedback(res.error || "Failed to save security settings.");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans text-amber-50">
      {/* =========================================================================
          TOP ADMIRALTY COMMAND HEADER
          ========================================================================= */}
      <div className="royale-panel rounded-2xl p-5 sm:p-7 border-2 border-amber-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative overflow-hidden backdrop-blur-md">
        {/* Decorative corner brackets in antique brass */}
        <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
        <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
        <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
        <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

        {/* Faint nautical watermark */}
        <div className="absolute -right-6 -bottom-8 pointer-events-none opacity-10">
          <Compass className="w-48 h-48 text-amber-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-900/30 to-amber-950/40 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold uppercase tracking-widest shadow-sm">
              <Anchor className="h-3.5 w-3.5 text-amber-400" />
              <span>Grand Fleet Admiralty</span>
              <span className="text-amber-500">•</span>
              <span>IIIT Lucknow Command</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-pirata text-3xl sm:text-4xl lg:text-5xl royale-gold-text tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
                Fleet Admiral War Room
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono text-[10px] uppercase font-bold tracking-widest">
                Organizer High Command
              </span>
            </div>

            <p className="font-code text-xs sm:text-sm text-amber-200/70 tracking-wider flex items-center gap-2 flex-wrap">
              <span className="text-amber-300/90 font-semibold">Tactical Fleet Controls</span>
              <span>•</span>
              <span>Voyage Logbook</span>
              <span>•</span>
              <span>Island Matrix</span>
              <span>•</span>
              <span>Transponder Snails</span>
            </p>
          </div>

          {/* Real-time Voyage Status Pill */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div
              className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl border font-mono text-xs uppercase tracking-wider shadow-lg transition-all ${
                currentState === "LIVE"
                  ? "border-emerald-500/60 bg-emerald-950/60 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                  : currentState === "UPCOMING"
                  ? "border-amber-500/60 bg-amber-950/60 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                  : currentState === "FROZEN"
                  ? "border-sky-500/60 bg-sky-950/60 text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.25)]"
                  : "border-rose-500/60 bg-rose-950/60 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.25)]"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  currentState === "LIVE"
                    ? "bg-emerald-400 animate-pulse"
                    : currentState === "UPCOMING"
                    ? "bg-amber-400 animate-ping"
                    : currentState === "FROZEN"
                    ? "bg-sky-400"
                    : "bg-rose-500"
                }`}
              />
              <span className="font-bold">
                Voyage Status:{" "}
                <span className="underline decoration-current underline-offset-2">
                  {currentState}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          COMMAND TABS (NAUTICAL NAVIGATION SEALS)
          ========================================================================= */}
      <div className="flex items-center gap-2 border-b-2 border-amber-500/30 pb-3.5 overflow-x-auto scrollbar-none flex-nowrap -mx-1 px-1">
        {([
          { id: "STATE", label: "Log Pose & Schedule", icon: Clock },
          {
            id: "EXPEDITION",
            label: `Expedition Curator (${config?.activeWaypointKeys && config.activeWaypointKeys.length > 0 ? config.activeWaypointKeys.length : 15})`,
            icon: Compass,
          },
          {
            id: "SUBMISSIONS",
            label: `Voyage Submissions${subsPage ? ` (${subsPage.globalTotal})` : ""}`,
            icon: Scroll,
          },
          {
            id: "POINTS",
            label: `Bounty & Ledger (${scoreAdjustments.length})`,
            icon: Coins,
          },
          {
            id: "LOCKOUTS",
            label: `Marine Brig (${activeLockouts.length})`,
            icon: Lock,
          },
          {
            id: "PUZZLES",
            label: `Island Matrix (${puzzles.length})`,
            icon: Map,
          },
          {
            id: "TICKETS",
            label: `Transponder Snails (${tickets.filter((t) => t.status === "OPEN").length})`,
            icon: Megaphone,
          },
          {
            id: "DATABASE",
            label: "Purge & Reset",
            icon: Trash2,
          },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setFeedback(null);
              }}
              className={`shrink-0 flex items-center space-x-2 px-4 py-2.5 min-h-[44px] text-xs uppercase tracking-wider font-bold rounded-xl border transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                isActive
                  ? "bg-gradient-to-b from-amber-400/25 via-amber-900/35 to-[#1c130c] border-2 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.3)] transform -translate-y-0.5"
                  : "bg-[#160e08]/85 border-amber-900/40 text-amber-200/60 hover:border-amber-500/50 hover:text-amber-100 hover:bg-amber-950/30"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-amber-300" : "text-amber-400/70"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          IMPERIAL FEEDBACK NOTIFICATION
          ========================================================================= */}
      {feedback && (
        <div className="bg-gradient-to-r from-amber-950/70 via-[#22140a] to-amber-950/70 border-2 border-amber-400/60 rounded-xl p-4 text-xs font-mono uppercase tracking-wider text-amber-200 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.6)] animate-in fade-in duration-200">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="hover:text-white p-1 rounded-lg hover:bg-amber-500/20 text-amber-300/80 transition-colors"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: LOG POSE & VOYAGE SCHEDULE (STATE)
          ========================================================================= */}
      {activeTab === "STATE" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Voyage Lifecycle State Controls */}
          <div className="space-y-6">
            <div className="royale-panel rounded-2xl p-6 border-2 border-amber-500/30 space-y-5">
              <div className="border-b border-amber-500/20 pb-3">
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-amber-400" />
                  Voyage Lifecycle Governance
                </span>
                <h2 className="font-pirata text-2xl text-amber-200 tracking-wide mt-1">
                  Competition Voyage State
                </h2>
                <p className="text-xs text-amber-200/60 font-code mt-0.5">
                  Set manual high-command override or rely on the automated Grand Line chronometer.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  {
                    id: "UPCOMING",
                    label: "UPCOMING",
                    tagline: "Fleet Anchored",
                    desc: "Puzzles locked. Crews can assemble & register freely.",
                    icon: Anchor,
                  },
                  {
                    id: "LIVE",
                    label: "LIVE",
                    tagline: "Full Sail",
                    desc: "Hunt is active across Grand Line. Submissions open.",
                    icon: Swords,
                  },
                  {
                    id: "FROZEN",
                    label: "FROZEN",
                    tagline: "Sea Fog / Blind",
                    desc: "Leaderboard frozen. Crews submit into the mist.",
                    icon: CloudFog,
                  },
                  {
                    id: "ENDED",
                    label: "ENDED",
                    tagline: "Voyage Complete",
                    desc: "Competition concluded. All bounties finalized.",
                    icon: Skull,
                  },
                ] as const).map((s) => {
                  const StateIcon = s.icon;
                  const isSelected = currentState === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={loadingAction !== null}
                      onClick={() => handleStateChange(s.id)}
                      className={`p-4 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        isSelected
                          ? "border-2 border-amber-400 bg-gradient-to-br from-amber-500/25 via-amber-900/40 to-[#18110a] text-amber-100 shadow-[0_0_24px_rgba(245,158,11,0.25)] transform -translate-y-0.5"
                          : "border-amber-900/40 bg-[#140d07]/70 text-amber-200/60 hover:border-amber-500/40 hover:text-amber-100 hover:bg-amber-950/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <StateIcon className={`h-4 w-4 ${isSelected ? "text-amber-300" : "text-amber-400/60"}`} />
                          <span className="text-xs uppercase font-mono tracking-widest font-black">
                            {s.label}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-400 text-amber-950 uppercase">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-amber-300/90 mt-1.5 font-sans">
                        {s.tagline}
                      </div>
                      <div className="text-[10px] text-amber-200/60 mt-1 leading-relaxed font-code">
                        {s.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Auto-Switch Engine status */}
              <div className="pt-4 border-t border-amber-500/20 text-xs text-amber-200/60 space-y-1.5 font-code">
                <div className="flex items-center justify-between">
                  <span className="uppercase tracking-wider font-semibold text-amber-300">
                    Grand Line Auto-Switch Engine:
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Armed &amp; Active
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/50 leading-relaxed">
                  The voyage lifecycle auto-transitions according to the Chronometer below (UPCOMING → LIVE → FROZEN → ENDED) without manual organizer intervention.
                </p>
              </div>
            </div>

            {/* Lockout Security Settings */}
            <div className="royale-panel rounded-2xl p-6 border-2 border-amber-500/30 space-y-5">
              <div className="border-b border-amber-500/20 pb-3">
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                  Marine Brig Security Configuration
                </span>
                <h2 className="font-pirata text-2xl text-amber-200 tracking-wide mt-1">
                  Anti-Brute Force Calibration
                </h2>
                <p className="text-xs text-amber-200/60 font-code mt-0.5">
                  Adjust maximum failed guesses before crews are locked in the naval brig.
                </p>
              </div>

              <form onSubmit={handleSaveLockoutSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-amber-300/80 block mb-1 text-[10px] uppercase tracking-wider font-mono font-bold">
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={lockoutMaxAttempts}
                      onChange={(e) => setLockoutMaxAttempts(Number(e.target.value))}
                      required
                      className="w-full bg-[#120a05] border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-amber-300/80 block mb-1 text-[10px] uppercase tracking-wider font-mono font-bold">
                      Window (Mins)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={lockoutWindowMinutes}
                      onChange={(e) => setLockoutWindowMinutes(Number(e.target.value))}
                      required
                      className="w-full bg-[#120a05] border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-amber-300/80 block mb-1 text-[10px] uppercase tracking-wider font-mono font-bold">
                      Brig Lockout (Mins)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={lockoutDurationMinutes}
                      onChange={(e) => setLockoutDurationMinutes(Number(e.target.value))}
                      required
                      className="w-full bg-[#120a05] border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loadingAction === "lockout-settings"}
                    className="royale-gilded-btn px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {loadingAction === "lockout-settings" ? "Calibrating..." : "Calibrate Brig Protocols"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Column 2: Landing Page Chronometer & Schedule Controls */}
          <div className="space-y-6">
            <div className="royale-panel rounded-2xl p-6 border-2 border-amber-500/30 space-y-5">
              <div className="border-b border-amber-500/20 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold flex items-center space-x-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Grand Line Chronometer</span>
                  </span>
                  <h2 className="font-pirata text-2xl text-amber-200 tracking-wide mt-1">
                    Voyage Master Schedule
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-amber-300/80">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Admin Timezone: <strong className="text-amber-200">{mounted ? detectedTimeZone : "Loading..."}</strong></span>
                  </div>
                </div>
                {activeCountdownTarget && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    Target: {currentState === "UPCOMING" ? "Start" : "End"}
                  </span>
                )}
              </div>

              {/* Countdown Preview */}
              {mounted && activeCountdownTarget && (
                <div
                  suppressHydrationWarning
                  className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-[#18110a] to-amber-950/40 border border-amber-500/30 text-center space-y-2"
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300/80 font-bold">
                    Chronometer Readout ({currentState === "UPCOMING" ? "Until Sail" : "Until Finish"}):
                  </span>
                  <div
                    suppressHydrationWarning
                    className="flex items-center justify-center gap-2 sm:gap-3 font-mono"
                  >
                    <div className="bg-[#120a05] border border-amber-500/40 rounded-lg px-2.5 py-1.5 min-w-[50px]">
                      <div
                        suppressHydrationWarning
                        className="text-xl sm:text-2xl font-black text-amber-300"
                      >
                        {previewRemaining.d}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-amber-200/50">Days</div>
                    </div>
                    <span className="text-amber-400 font-black">:</span>
                    <div className="bg-[#120a05] border border-amber-500/40 rounded-lg px-2.5 py-1.5 min-w-[50px]">
                      <div
                        suppressHydrationWarning
                        className="text-xl sm:text-2xl font-black text-amber-300"
                      >
                        {String(previewRemaining.h).padStart(2, "0")}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-amber-200/50">Hours</div>
                    </div>
                    <span className="text-amber-400 font-black">:</span>
                    <div className="bg-[#120a05] border border-amber-500/40 rounded-lg px-2.5 py-1.5 min-w-[50px]">
                      <div
                        suppressHydrationWarning
                        className="text-xl sm:text-2xl font-black text-amber-300"
                      >
                        {String(previewRemaining.m).padStart(2, "0")}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-amber-200/50">Mins</div>
                    </div>
                    <span className="text-amber-400 font-black">:</span>
                    <div className="bg-[#120a05] border border-amber-500/40 rounded-lg px-2.5 py-1.5 min-w-[50px]">
                      <div
                        suppressHydrationWarning
                        className="text-xl sm:text-2xl font-black text-amber-300"
                      >
                        {String(previewRemaining.s).padStart(2, "0")}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-amber-200/50">Secs</div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveSchedule} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-amber-300/80 text-[10px] uppercase font-mono font-bold tracking-wider">
                        Voyage Start (Set Sail)
                      </label>
                      <span className="text-[9px] font-mono text-amber-400/60 uppercase">Local Time</span>
                    </div>

                    {/* Quick Presets for Start Time */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] uppercase font-mono text-amber-400/80 font-bold mr-1">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setQuickStartTime("today-4pm")}
                        className="px-2 py-0.5 rounded-md bg-amber-950/60 hover:bg-amber-800/40 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 hover:text-amber-100 transition-colors"
                      >
                        Today 4:00 PM
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickStartTime("today-6pm")}
                        className="px-2 py-0.5 rounded-md bg-amber-950/60 hover:bg-amber-800/40 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 hover:text-amber-100 transition-colors"
                      >
                        Today 6:00 PM
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickStartTime("plus-1h")}
                        className="px-2 py-0.5 rounded-md bg-amber-950/60 hover:bg-amber-800/40 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 hover:text-amber-100 transition-colors"
                      >
                        +1h from now
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickStartTime("plus-2h")}
                        className="px-2 py-0.5 rounded-md bg-amber-950/60 hover:bg-amber-800/40 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 hover:text-amber-100 transition-colors"
                      >
                        +2h from now
                      </button>
                    </div>

                    <input
                      type="datetime-local"
                      value={startTimeInput}
                      onChange={(e) => setStartTimeInput(e.target.value)}
                      className="w-full bg-[#120a05] border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />

                    {isStartTimeInPast && (
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/50 text-rose-200 text-[11px] font-mono mt-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div>
                            <strong className="text-rose-100">Warning: Selected start time is in the past!</strong>
                          </div>
                          <p className="text-[10px] text-rose-300/90 leading-relaxed">
                            If you typed &quot;4&quot;, your browser likely set <strong>04:00 AM</strong> instead of <strong>4:00 PM (16:00)</strong>. Saving a past time will cause the platform to immediately flip to <strong>LIVE</strong>.
                          </p>
                          <button
                            type="button"
                            onClick={() => setQuickStartTime("today-4pm")}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-900/60 hover:bg-rose-800/80 border border-rose-400/60 text-[10px] font-bold text-white transition-colors"
                          >
                            Fix: Switch to Today at 4:00 PM (16:00)
                          </button>
                        </div>
                      </div>
                    )}

                    <span
                      suppressHydrationWarning
                      className="text-[10px] text-amber-200/50 mt-1 block font-code"
                    >
                      Active: <span suppressHydrationWarning>{mounted ? formatDateTimeDisplay(savedStartTime) : "Loading..."}</span>
                    </span>
                  </div>

                  <div>
                    <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold tracking-wider">
                      Sea Fog Freeze Time (Bounties Frozen)
                    </label>
                    <input
                      type="datetime-local"
                      value={freezeTimeInput}
                      onChange={(e) => setFreezeTimeInput(e.target.value)}
                      className="w-full bg-[#120a05] border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <span
                      suppressHydrationWarning
                      className="text-[10px] text-amber-200/50 mt-1 block font-code"
                    >
                      Active: <span suppressHydrationWarning>{mounted ? formatDateTimeDisplay(savedFreezeTime) : "Loading..."}</span>
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-amber-300/80 text-[10px] uppercase font-mono font-bold tracking-wider">
                        Voyage Concludes (Grand Line Closes)
                      </label>
                      <span className="text-[9px] font-mono text-amber-400/60 uppercase">Local Time</span>
                    </div>

                    {/* Quick Duration Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] uppercase font-mono text-amber-400/80 font-bold mr-1">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setQuickEndTimeFromStart(2)}
                        className="px-2 py-0.5 rounded-md bg-amber-950/60 hover:bg-amber-800/40 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 hover:text-amber-100 transition-colors"
                      >
                        +2h after Start
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickEndTimeFromStart(3)}
                        className="px-2 py-0.5 rounded-md bg-amber-950/60 hover:bg-amber-800/40 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 hover:text-amber-100 transition-colors"
                      >
                        +3h after Start
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickEndTimeFromStart(4)}
                        className="px-2 py-0.5 rounded-md bg-amber-950/60 hover:bg-amber-800/40 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 hover:text-amber-100 transition-colors"
                      >
                        +4h after Start
                      </button>
                    </div>

                    <input
                      type="datetime-local"
                      value={endTimeInput}
                      onChange={(e) => setEndTimeInput(e.target.value)}
                      className="w-full bg-[#120a05] border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />

                    {isEndBeforeStart && (
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-950/50 border border-rose-500/50 text-rose-200 text-[11px] font-mono mt-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>End Time must be chronologically after Voyage Start time.</span>
                      </div>
                    )}

                    <span
                      suppressHydrationWarning
                      className="text-[10px] text-amber-200/50 mt-1 block font-code"
                    >
                      Active: <span suppressHydrationWarning>{mounted ? formatDateTimeDisplay(savedEndTime) : "Loading..."}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={loadingAction === "clear-schedule"}
                    onClick={handleClearSchedule}
                    className="px-4 py-2 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-950/40 text-xs font-mono uppercase font-bold tracking-wider transition-colors disabled:opacity-50"
                  >
                    {loadingAction === "clear-schedule" ? "Clearing..." : "Clear Timers"}
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAction === "save-schedule"}
                    className="royale-gilded-btn px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {loadingAction === "save-schedule" ? "Locking In..." : "Lock In Schedule"}
                  </button>
                </div>
              </form>
            </div>

            {/* Imperial Transponder Broadcasts */}
            <div className="royale-panel rounded-2xl p-6 border-2 border-amber-500/30 space-y-5">
              <div className="border-b border-amber-500/20 pb-3">
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold flex items-center space-x-1.5">
                  <Megaphone className="h-3.5 w-3.5 text-amber-400" />
                  <span>Transponder Snail Imperial Broadcasts</span>
                </span>
                <h2 className="font-pirata text-2xl text-amber-200 tracking-wide mt-1">
                  Fleet-Wide Communique
                </h2>
                <p className="text-xs text-amber-200/60 font-code mt-0.5">
                  Broadcast high-priority dispatches, hints, and emergency updates to all sailors.
                </p>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold tracking-wider">
                    Decree Text
                  </label>
                  <textarea
                    rows={3}
                    value={newAnnouncementText}
                    onChange={(e) => setNewAnnouncementText(e.target.value)}
                    placeholder="Enter message for all crews..."
                    required
                    className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-3 text-xs text-amber-100 font-code focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-amber-200/25"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-amber-300/80 uppercase font-bold">
                      Retention:
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={newAnnouncementDays}
                      onChange={(e) => setNewAnnouncementDays(Number(e.target.value))}
                      className="w-16 bg-[#120a05] border border-amber-500/30 rounded-lg p-1.5 text-xs text-amber-100 font-mono text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <span className="text-[10px] text-amber-200/60 font-code">Days</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loadingAction === "create-announcement" || !newAnnouncementText.trim()}
                    className="royale-gilded-btn px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Transmit Decree</span>
                  </button>
                </div>
              </form>

              {/* Active Announcements List */}
              {localAnnouncements.length > 0 && (
                <div className="pt-4 border-t border-amber-500/20 space-y-2.5">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
                    Active Transmissions ({localAnnouncements.length})
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {localAnnouncements.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 rounded-xl bg-[#140d07] border border-amber-500/30 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 min-w-0">
                          <p className="text-amber-100 font-code leading-relaxed break-words">
                            {a.message}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-amber-200/50 font-mono">
                            <span suppressHydrationWarning>
                              Posted: {mounted ? new Date(a.createdAt).toLocaleDateString() : ""}
                            </span>
                            <span>•</span>
                            <span suppressHydrationWarning>
                              Expires: {mounted ? new Date(a.expiresAt).toLocaleDateString() : ""}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={loadingAction === `delete-announcement-${a.id}`}
                          onClick={() => handleDeleteAnnouncement(a.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors shrink-0"
                          title="Retract Decree"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              DANGER ZONE: QUICK DATABASE ACTIONS (STATE TAB)
              ========================================================================= */}
          <div className="royale-panel rounded-2xl p-6 border-2 border-rose-500/40 bg-gradient-to-br from-[#1c0c08] via-[#120805] to-[#160a06] space-y-5 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/20 pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-rose-400 font-bold flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                  Fleet Governance &amp; Danger Zone
                </span>
                <h2 className="font-pirata text-2xl text-rose-200 tracking-wide mt-1">
                  Database Purge &amp; Factory Reset Controls
                </h2>
                <p className="text-xs text-rose-200/60 font-code mt-0.5">
                  Execute targeted table wipes or a complete platform factory reset. Requires typed verification phrase before execution.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("DATABASE");
                  setFeedback(null);
                }}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-950/40 text-[11px] font-mono uppercase font-bold tracking-wider transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                Open Full Reset Console →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Clear All Puzzles */}
              <div className="p-4 rounded-xl border border-amber-500/30 bg-[#140b07] flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Map className="h-4 w-4 text-amber-400" />
                      Clear All Puzzles
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {localPuzzles.length} Islands
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/60 font-code leading-relaxed">
                    Wipes all puzzles, hints, submissions, and unlocks. Clears expedition waypoint bindings and current puzzle markers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenPurgeModal("CLEAR_PUZZLES")}
                  className="w-full py-2 px-3 rounded-lg border border-amber-500/40 hover:bg-amber-500/15 text-amber-200 text-xs font-mono font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-98"
                >
                  Clear All Puzzles...
                </button>
              </div>

              {/* Option 2: Clear All Teams & Users */}
              <div className="p-4 rounded-xl border border-rose-500/30 bg-[#160b09] flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-rose-400" />
                      Clear Teams &amp; Users
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {teams.length} Crews
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-200/60 font-code leading-relaxed">
                    Wipes all pirate crews, student users, join requests, and scores. Preserves organizer logins.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenPurgeModal("CLEAR_TEAMS")}
                  className="w-full py-2 px-3 rounded-lg border border-rose-500/40 hover:bg-rose-500/15 text-rose-200 text-xs font-mono font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 active:scale-98"
                >
                  Clear Teams &amp; Users...
                </button>
              </div>

              {/* Option 3: Reset Entire Database */}
              <div className="p-4 rounded-xl border-2 border-rose-500/50 bg-gradient-to-b from-[#240c08] to-[#180905] flex flex-col justify-between space-y-4 shadow-lg">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-200 flex items-center gap-1.5">
                      <RotateCcw className="h-4 w-4 text-rose-400" />
                      Reset Entire DB
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-600/20 text-rose-300 border border-rose-500/40 font-black">
                      Factory Reset
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-200/70 font-code leading-relaxed">
                    Full day-zero platform reset: wipes all puzzles, teams, users, timers, and announcements.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenPurgeModal("RESET_DATABASE")}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 hover:from-rose-600 hover:to-amber-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-transform active:scale-95 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  Reset Entire Database...
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: EXPEDITION CURATOR (CAMPAIGN REALM WAYPOINTS)
          ========================================================================= */}
      {activeTab === "EXPEDITION" && (
        <div className="space-y-6">
          <ExpeditionCurator
            initialActiveKeys={config?.activeWaypointKeys}
            puzzles={localPuzzles}
          />
        </div>
      )}

      {/* =========================================================================
          TAB 2: VOYAGE SUBMISSIONS LOGBOOK (SUBMISSIONS)
          ========================================================================= */}
      {activeTab === "SUBMISSIONS" && (
        <div className="space-y-6">
          {/* KPI Cards: 4 Pirate Treasury Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="royale-card rounded-2xl p-5 border border-amber-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
                  Total Log Entries
                </span>
                <span className="font-pirata text-3xl sm:text-4xl text-amber-200 mt-0.5 block">
                  {subsPage?.globalTotal ?? "..."}
                </span>
                <span className="text-[10px] text-amber-200/50 font-code">
                  Across all chartered islands
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Coins className="h-6 w-6" />
              </div>
            </div>

            <div className="royale-card rounded-2xl p-5 border border-emerald-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold block">
                  Accepted Solves
                </span>
                <span className="font-pirata text-3xl sm:text-4xl text-emerald-400 mt-0.5 block">
                  {subsPage?.globalCorrect ?? "..."}
                </span>
                <span className="text-[10px] text-emerald-300/60 font-code">
                  Correct island discoveries
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Swords className="h-6 w-6" />
              </div>
            </div>

            <div className="royale-card rounded-2xl p-5 border border-rose-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-rose-400 font-bold block">
                  Repelled Guesses
                </span>
                <span className="font-pirata text-3xl sm:text-4xl text-rose-400 mt-0.5 block">
                  {subsPage ? subsPage.globalTotal - subsPage.globalCorrect : "..."}
                </span>
                <span className="text-[10px] text-rose-300/60 font-code">
                  Defeated attempts
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Skull className="h-6 w-6" />
              </div>
            </div>

            <div className="royale-card rounded-2xl p-5 border border-sky-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-sky-400 font-bold block">
                  Active Pirate Crews
                </span>
                <span className="font-pirata text-3xl sm:text-4xl text-sky-300 mt-0.5 block">
                  {teams.length}
                </span>
                <span className="text-[10px] text-sky-300/60 font-code">
                  Sailing on the Grand Line
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Anchor className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Filter Bar & Submissions Table */}
          <div className="royale-panel rounded-2xl p-6 border-2 border-amber-500/30 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                  <Scroll className="h-3.5 w-3.5 text-amber-400" />
                  Live Grand Line Telemetry
                </span>
                <h2 className="font-pirata text-2xl text-amber-200 tracking-wide mt-1">
                  Expedition Logbook
                </h2>
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-[#120a05] rounded-xl border border-amber-500/30 self-start md:self-auto">
                {(["ALL", "CORRECT", "INCORRECT"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSubFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                      subFilterStatus === st
                        ? st === "CORRECT"
                          ? "bg-emerald-500 text-black shadow-sm"
                          : st === "INCORRECT"
                          ? "bg-rose-500 text-black shadow-sm"
                          : "bg-amber-400 text-amber-950 shadow-sm"
                        : "text-amber-200/60 hover:text-amber-100 hover:bg-amber-950/40"
                    }`}
                  >
                    {st === "ALL" ? "All Entries" : st === "CORRECT" ? "Accepted" : "Repelled"}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Inputs Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 text-amber-400/60 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search crew, puzzle, or guess..."
                  value={subSearchQuery}
                  onChange={(e) => setSubSearchQuery(e.target.value)}
                  className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl pl-9 pr-8 py-2.5 text-xs text-amber-100 font-code focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-amber-200/30"
                />
                {subSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSubSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-amber-300/60 hover:text-white p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Island Filter */}
              <div>
                <select
                  value={subFilterPuzzle}
                  onChange={(e) => setSubFilterPuzzle(e.target.value)}
                  className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-code focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="ALL">All Islands</option>
                  {localPuzzles.map((p) => (
                    <option key={p.id} value={p.id}>
                      Island #{p.orderIndex}: {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Crew Filter */}
              <div>
                <select
                  value={subFilterTeam}
                  onChange={(e) => setSubFilterTeam(e.target.value)}
                  className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-code focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="ALL">All Pirate Crews</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table or Loading / Empty */}
            {subsLoading ? (
              <div className="p-12 text-center text-xs font-mono uppercase tracking-widest text-amber-300/60 animate-pulse flex flex-col items-center justify-center space-y-2">
                <Compass className="h-6 w-6 animate-spin text-amber-400" />
                <span>Scanning Grand Line Logbooks...</span>
              </div>
            ) : !subsPage || subsPage.rows.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono uppercase tracking-widest text-amber-200/40 border border-amber-500/15 rounded-xl bg-[#120a05]/60">
                No voyage entries match the active expedition filters.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-amber-500/30 bg-[#120a05]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-amber-500/25 bg-[#1c120a] font-mono text-[10px] text-amber-300/80 uppercase tracking-widest">
                        <th className="py-3 px-3.5">Time</th>
                        <th className="py-3 px-3.5">Pirate Crew</th>
                        <th className="py-3 px-3.5">Island Node</th>
                        <th className="py-3 px-3.5">Cipher Guess</th>
                        <th className="py-3 px-3.5">Result</th>
                        <th className="py-3 px-3.5 text-right">Bounty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-900/20 font-sans">
                      {subsPage.rows.map((s) => (
                        <tr key={s.id} className="hover:bg-amber-500/5 transition-colors">
                          <td suppressHydrationWarning className="py-3 px-3.5 text-amber-200/60 font-mono text-[11px] whitespace-nowrap">
                            {mounted
                              ? new Date(s.createdAt).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                  second: "2-digit",
                                })
                              : ""}
                          </td>
                          <td className="py-3 px-3.5">
                            {s.team?.name ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const teamName = s.team?.name;
                                  if (!teamName) return;
                                  const found = teams.find(
                                    (t) => t.name === teamName || t.id === s.team?.id
                                  );
                                  setSelectedRosterTeam(
                                    found || { id: s.team?.id, name: teamName, members: [] }
                                  );
                                }}
                                className="hover:text-amber-300 transition text-left cursor-pointer flex items-center space-x-1.5 group"
                                title="Inspect crew roster"
                              >
                                <span className="font-bold text-amber-100 uppercase tracking-wider group-hover:underline">
                                  {s.team?.name}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded border border-amber-400/30 text-amber-300/80 bg-amber-950/40 group-hover:border-amber-400 group-hover:text-amber-200 uppercase tracking-widest font-mono transition">
                                  Roster
                                </span>
                              </button>
                            ) : (
                              <span className="text-amber-200/40">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-amber-200/80 font-code">
                            #{s.puzzle?.orderIndex} {s.puzzle?.title}
                          </td>
                          <td className="py-3 px-3.5 font-mono text-amber-100 max-w-xs truncate">
                            <span className="bg-[#1a0f07] px-2 py-0.5 rounded border border-amber-500/20">
                              {s.attemptText}
                            </span>
                          </td>
                          <td className="py-3 px-3.5">
                            {s.isCorrect ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 font-mono font-bold text-[10px] uppercase tracking-wider">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Accepted</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-rose-400 bg-rose-950/40 border border-rose-500/40 font-mono font-bold text-[10px] uppercase tracking-wider">
                                <X className="h-3 w-3" />
                                <span>Repelled</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold">
                            {s.isCorrect ? (
                              <span className="text-emerald-400 font-black">
                                +{s.pointsAwarded} ฿
                              </span>
                            ) : (
                              <span className="text-amber-200/30">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs font-mono uppercase tracking-wider text-amber-200/60">
                  <span>
                    Page {subsPage.page} of {subsPage.totalPages} • {subsPage.total}{" "}
                    {subsPage.total === 1 ? "log entry" : "log entries"}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={subsPage.page <= 1}
                      onClick={() => loadSubsPage(subsPage.page - 1)}
                      className="px-3.5 py-1.5 rounded-lg border border-amber-500/30 hover:border-amber-400 hover:text-amber-200 bg-[#120a05] transition disabled:opacity-30"
                    >
                      ← Prev Page
                    </button>
                    <button
                      type="button"
                      disabled={subsPage.page >= subsPage.totalPages}
                      onClick={() => loadSubsPage(subsPage.page + 1)}
                      className="px-3.5 py-1.5 rounded-lg border border-amber-500/30 hover:border-amber-400 hover:text-amber-200 bg-[#120a05] transition disabled:opacity-30"
                    >
                      Next Page →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: BOUNTY & SCORE ADJUSTMENT LEDGER (POINTS)
          ========================================================================= */}
      {activeTab === "POINTS" && (
        <div className="space-y-6">
          {/* Public Standings Visibility Governance */}
          <div className="royale-panel rounded-2xl p-6 border-2 border-amber-500/30 space-y-4">
            <div className="border-b border-amber-500/20 pb-3">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-amber-400" />
                Fleet Public Visibility Governance
              </span>
              <h2 className="font-pirata text-2xl text-amber-200 tracking-wide mt-1">
                Leaderboard Public Display Settings
              </h2>
              <p className="text-xs text-amber-200/60 font-code mt-0.5">
                Configure what telemetry is broadcast to competitor crews and spectators on the live standings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {/* Toggle 1: Questions Solved */}
              <div className="rounded-xl border border-amber-500/30 bg-[#140d07] p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-100 uppercase tracking-wider">
                      Islands Solved Count
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 uppercase tracking-widest font-mono font-bold rounded-md border ${
                        showQuestionsSolved
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/30"
                          : "border-amber-900/40 text-amber-200/40 bg-amber-950/20"
                      }`}
                    >
                      {showQuestionsSolved ? "VISIBLE" : "HIDDEN"}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/60 mt-1.5 font-code leading-relaxed">
                    Displays the &quot;SOLVED&quot; count column on the public standings table.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loadingAction === "toggle-showQuestionsSolved"}
                  onClick={() => handleToggleDisplay("showQuestionsSolved", !showQuestionsSolved)}
                  className={`w-full py-2 rounded-lg border text-xs uppercase font-mono tracking-wider font-bold transition ${
                    showQuestionsSolved
                      ? "border-rose-500/40 text-rose-300 hover:bg-rose-950/40"
                      : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40"
                  }`}
                >
                  {showQuestionsSolved ? "Hide Solved Column" : "Show Solved Column"}
                </button>
              </div>

              {/* Toggle 2: Point History Breakdown */}
              <div className="rounded-xl border border-amber-500/30 bg-[#140d07] p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-100 uppercase tracking-wider">
                      Public Score Breakdown
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 uppercase tracking-widest font-mono font-bold rounded-md border ${
                        showPointHistory
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/30"
                          : "border-amber-900/40 text-amber-200/40 bg-amber-950/20"
                      }`}
                    >
                      {showPointHistory ? "ENABLED" : "RESTRICTED"}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/60 mt-1.5 font-code leading-relaxed">
                    Allows crews to inspect where competitors earned or lost bounty points.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loadingAction === "toggle-showPointHistory"}
                  onClick={() => handleToggleDisplay("showPointHistory", !showPointHistory)}
                  className={`w-full py-2 rounded-lg border text-xs uppercase font-mono tracking-wider font-bold transition ${
                    showPointHistory
                      ? "border-rose-500/40 text-rose-300 hover:bg-rose-950/40"
                      : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40"
                  }`}
                >
                  {showPointHistory ? "Restrict Breakdown" : "Allow Breakdown"}
                </button>
              </div>

              {/* Toggle 3: Leaderboard Team Names Anonymity */}
              <div className="rounded-xl border border-amber-500/30 bg-[#140d07] p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-100 uppercase tracking-wider">
                      Crew Names Anonymity
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 uppercase tracking-widest font-mono font-bold rounded-md border ${
                        hideTeamNames
                          ? "border-amber-500/40 text-amber-300 bg-amber-950/30"
                          : "border-emerald-500/40 text-emerald-400 bg-emerald-950/30"
                      }`}
                    >
                      {hideTeamNames ? "MASKED" : "REVEALED"}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/60 mt-1.5 font-code leading-relaxed">
                    Masks squad names as &apos;Crew #01&apos;, &apos;Crew #02&apos; for participants.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loadingAction === "toggle-hideTeamNames"}
                  onClick={() => handleToggleDisplay("hideTeamNames", !hideTeamNames)}
                  className={`w-full py-2 rounded-lg border text-xs uppercase font-mono tracking-wider font-bold transition ${
                    hideTeamNames
                      ? "border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40"
                      : "border-amber-500/40 text-amber-300 hover:bg-amber-950/40"
                  }`}
                >
                  {hideTeamNames ? "Reveal Real Names" : "Mask Crew Names"}
                </button>
              </div>

              {/* Toggle 4: Support Feature Desk */}
              <div className="rounded-xl border border-amber-500/30 bg-[#140d07] p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-100 uppercase tracking-wider">
                      Transponder Snail Desk
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 uppercase tracking-widest font-mono font-bold rounded-md border ${
                        supportFeatureEnabled
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/30"
                          : "border-rose-500/40 text-rose-300 bg-rose-950/30"
                      }`}
                    >
                      {supportFeatureEnabled ? "ONLINE" : "DISABLED"}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/60 mt-1.5 font-code leading-relaxed">
                    Permits in-app participant inquiries directly to High Command.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loadingAction === "toggle-supportFeatureEnabled"}
                  onClick={() =>
                    handleToggleDisplay("supportFeatureEnabled", !supportFeatureEnabled)
                  }
                  className={`w-full py-2 rounded-lg border text-xs uppercase font-mono tracking-wider font-bold transition ${
                    supportFeatureEnabled
                      ? "border-rose-500/40 text-rose-300 hover:bg-rose-950/40"
                      : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40"
                  }`}
                >
                  {supportFeatureEnabled ? "Turn Off Desk" : "Turn On Desk"}
                </button>
              </div>

              {/* Toggle 5: Captain's Logs & Hints System */}
              <div className="rounded-xl border border-amber-500/30 bg-[#140d07] p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-100 uppercase tracking-wider">
                      Captain&apos;s Logs &amp; Hints
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 uppercase tracking-widest font-mono font-bold rounded-md border ${
                        hintsEnabled
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/30"
                          : "border-rose-500/40 text-rose-300 bg-rose-950/30"
                      }`}
                    >
                      {hintsEnabled ? "ENABLED" : "DISABLED"}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/60 mt-1.5 font-code leading-relaxed">
                    Allows participant crews to view and unlock Captain&apos;s Log hints for puzzles.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loadingAction === "toggle-hintsEnabled"}
                  onClick={() =>
                    handleToggleDisplay("hintsEnabled", !hintsEnabled)
                  }
                  className={`w-full py-2 rounded-lg border text-xs uppercase font-mono tracking-wider font-bold transition ${
                    hintsEnabled
                      ? "border-rose-500/40 text-rose-300 hover:bg-rose-950/40"
                      : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40"
                  }`}
                >
                  {hintsEnabled ? "Disable Hints" : "Enable Hints"}
                </button>
              </div>

              {/* Toggle 6: Neon Database Keep-Alive */}
              <div className="rounded-xl border border-amber-500/30 bg-[#140d07] p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-100 uppercase tracking-wider">
                      Neon DB Keep-Alive
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 uppercase tracking-widest font-mono font-bold rounded-md border ${
                        neonKeepAliveEnabled
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/30"
                          : "border-amber-500/40 text-amber-300 bg-amber-950/30"
                      }`}
                    >
                      {neonKeepAliveEnabled ? "ACTIVE (HOT)" : "STANDBY (SLEEP)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/60 mt-1.5 font-code leading-relaxed">
                    Pings Neon compute to keep PostgreSQL awake and eliminate 3-5s cold starts. Enable during testing or live competition; disable when idle to conserve compute hours.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loadingAction === "toggle-neonKeepAliveEnabled"}
                  onClick={() =>
                    handleToggleDisplay("neonKeepAliveEnabled", !neonKeepAliveEnabled)
                  }
                  className={`w-full py-2 rounded-lg border text-xs uppercase font-mono tracking-wider font-bold transition ${
                    neonKeepAliveEnabled
                      ? "border-rose-500/40 text-rose-300 hover:bg-rose-950/40"
                      : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40"
                  }`}
                >
                  {neonKeepAliveEnabled ? "Put DB to Sleep" : "Keep DB Awake"}
                </button>
              </div>
            </div>
          </div>

          {/* Organizer Bounty Adjustment Station */}
          <div className="royale-panel rounded-2xl p-6 border-2 border-amber-500/30 space-y-5">
            <div className="border-b border-amber-500/20 pb-3">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                Admiralty Bounty Adjustments
              </span>
              <h2 className="font-pirata text-2xl text-amber-200 tracking-wide mt-1">
                Award Bounty Bonus or Impose Fine
              </h2>
              <p className="text-xs text-amber-200/60 font-code mt-0.5">
                Directly award bonus bounty or impose naval fines with a required captain&apos;s log entry.
              </p>
            </div>

            <form onSubmit={handleAdjustScore} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Team Selection */}
                <div className="relative">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-amber-300/80 mb-1 font-bold">
                    Target Pirate Crew *
                  </label>
                  {adjustTeamId && !isTeamDropdownOpen ? (
                    <div className="flex items-center justify-between w-full bg-[#120a05] border border-amber-400/60 rounded-xl p-2.5 text-xs text-amber-100">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="font-bold uppercase tracking-wider truncate">
                          {teams.find((t) => t.id === adjustTeamId)?.name ?? adjustTeamId}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const found = teams.find((t) => t.id === adjustTeamId);
                            if (found) setSelectedRosterTeam(found);
                          }}
                          className="text-[9px] px-2 py-0.5 rounded border border-amber-400/40 text-amber-300 bg-amber-950/30 hover:bg-amber-400 hover:text-black uppercase tracking-wider font-mono transition shrink-0"
                        >
                          Roster
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustTeamId("");
                          setTeamSearchQuery("");
                          setIsTeamDropdownOpen(true);
                        }}
                        className="text-amber-300/60 hover:text-amber-100 ml-2 uppercase text-[10px] font-mono tracking-wider shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Search crew name..."
                        value={teamSearchQuery}
                        onChange={(e) => {
                          setTeamSearchQuery(e.target.value);
                          setIsTeamDropdownOpen(true);
                        }}
                        onFocus={() => setIsTeamDropdownOpen(true)}
                        className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase placeholder:text-amber-200/30"
                      />
                      {isTeamDropdownOpen && (
                        <div className="absolute z-20 mt-1 w-full border border-amber-500/40 bg-[#160e08] rounded-xl max-h-48 overflow-y-auto divide-y divide-amber-900/20 shadow-2xl">
                          {teams
                            .filter((t) =>
                              t.name.toLowerCase().includes(teamSearchQuery.toLowerCase())
                            )
                            .map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setAdjustTeamId(t.id);
                                  setIsTeamDropdownOpen(false);
                                  setTeamSearchQuery("");
                                }}
                                className="w-full text-left px-3.5 py-2.5 text-xs text-amber-100 hover:bg-amber-400/10 hover:text-amber-300 uppercase tracking-wider transition"
                              >
                                {t.name}
                              </button>
                            ))}
                          {teams.filter((t) =>
                            t.name.toLowerCase().includes(teamSearchQuery.toLowerCase())
                          ).length === 0 && (
                            <div className="px-3.5 py-2.5 text-xs text-amber-200/40 uppercase tracking-wider">
                              No matching crews found
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Adjustment Mode */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-amber-300/80 mb-1 font-bold">
                    Action Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustType("BONUS")}
                      className={`p-2.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider transition ${
                        adjustType === "BONUS"
                          ? "border-emerald-500/60 bg-emerald-950/60 text-emerald-300 shadow-sm"
                          : "border-amber-900/40 bg-[#120a05] text-amber-200/50 hover:text-amber-200"
                      }`}
                    >
                      + Bonus ฿
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType("PENALTY")}
                      className={`p-2.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider transition ${
                        adjustType === "PENALTY"
                          ? "border-rose-500/60 bg-rose-950/60 text-rose-300 shadow-sm"
                          : "border-amber-900/40 bg-[#120a05] text-amber-200/50 hover:text-amber-200"
                      }`}
                    >
                      - Fine ฿
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-amber-300/80 mb-1 font-bold">
                    Bounty Delta (Points) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={1}
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(Math.max(1, Number(e.target.value)))}
                      required
                      className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <div className="flex items-center space-x-1 shrink-0">
                      {[25, 50, 100].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAdjustAmount(preset)}
                          className="px-2 py-2 rounded-lg border border-amber-500/30 bg-[#120a05] text-[10px] font-mono font-bold text-amber-300 hover:bg-amber-400/10 hover:border-amber-400 transition"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-amber-300/80 mb-1 font-bold">
                  Captain&apos;s Log Reason *
                </label>
                <textarea
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Official reason for bonus or fine (e.g. Early solve bonus, rule infraction)..."
                  required
                  className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-3 text-xs text-amber-100 font-code focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-amber-200/30"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loadingAction === "adjust-score" || !adjustTeamId || !adjustReason.trim()}
                  className="royale-gilded-btn px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {loadingAction === "adjust-score" ? "Executing..." : "Execute Bounty Transaction"}
                </button>
              </div>
            </form>
          </div>

          {/* Adjustments Audit Log Table */}
          {scoreAdjustments.length > 0 && (
            <div className="royale-panel rounded-2xl p-6 border-2 border-amber-500/30 space-y-4">
              <div className="border-b border-amber-500/20 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold">
                    Admiralty Audit Trail
                  </span>
                  <h3 className="font-pirata text-xl text-amber-200 tracking-wide mt-0.5">
                    Bounty Adjustments History ({scoreAdjustments.length})
                  </h3>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-amber-500/30 bg-[#120a05]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-amber-500/25 bg-[#1c120a] font-mono text-[10px] text-amber-300/80 uppercase tracking-widest">
                      <th className="py-3 px-3.5">Time</th>
                      <th className="py-3 px-3.5">Pirate Crew</th>
                      <th className="py-3 px-3.5">Bounty Shift</th>
                      <th className="py-3 px-3.5">Captain&apos;s Reason</th>
                      <th className="py-3 px-3.5">Officer Signature</th>
                      <th className="py-3 px-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/20 font-sans">
                    {scoreAdjustments.map((adj) => (
                      <tr key={adj.id} className="hover:bg-amber-500/5 transition-colors">
                        <td suppressHydrationWarning className="py-3 px-3.5 text-amber-200/60 font-mono text-[11px] whitespace-nowrap">
                          {mounted ? new Date(adj.createdAt).toLocaleString() : ""}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-amber-100 uppercase tracking-wider">
                          {adj.team?.name || adj.teamId}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold">
                          {adj.amount >= 0 ? (
                            <span className="text-emerald-400">+{adj.amount} ฿</span>
                          ) : (
                            <span className="text-rose-400">{adj.amount} ฿</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 font-code text-amber-200/80 max-w-sm break-words">
                          {adj.reason}
                        </td>
                        <td className="py-3 px-3.5 text-amber-200/60 font-mono text-[11px]">
                          {adj.createdBy?.name || adj.createdBy?.email || "High Command"}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <button
                            type="button"
                            disabled={loadingAction === `delete-adj-${adj.id}`}
                            onClick={() => handleDeleteAdjustment(adj.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Revert Bounty Adjustment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: ACTIVE LOCKOUTS MONITOR (LOCKOUTS)
          ========================================================================= */}
      {activeTab === "LOCKOUTS" && (
        <div className="royale-panel rounded-2xl p-6 border-2 border-amber-500/30 space-y-5">
          <div className="border-b border-amber-500/20 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                Naval Security Detention
              </span>
              <h2 className="font-pirata text-2xl text-amber-200 tracking-wide mt-1">
                Marine Brig Lockouts ({activeLockouts.length})
              </h2>
            </div>
            {activeLockouts.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold animate-pulse">
                {activeLockouts.length} Crews Confined
              </span>
            )}
          </div>

          {activeLockouts.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-pirata text-2xl text-amber-200 tracking-wide">
                The High Seas are Calm
              </h3>
              <p className="text-xs text-amber-200/60 font-code max-w-md mx-auto">
                No pirate crews are currently confined to the brig. All ships have access to submit coordinates.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-amber-500/30 bg-[#120a05]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-amber-500/25 bg-[#1c120a] font-mono text-[10px] text-amber-300/80 uppercase tracking-widest">
                    <th className="py-3 px-3.5">Detained Crew</th>
                    <th className="py-3 px-3.5">Confined Island</th>
                    <th className="py-3 px-3.5">Time Remaining</th>
                    <th className="py-3 px-3.5 text-right">Admiralty Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/20 font-sans">
                  {activeLockouts.map((l) => (
                    <tr key={`${l.teamId}-${l.puzzleId}`} className="hover:bg-amber-500/5 transition-colors">
                      <td className="py-3.5 px-3.5 font-bold text-amber-100 uppercase tracking-wider">
                        {teamNameMap[l.teamId] || l.teamId}
                      </td>
                      <td className="py-3.5 px-3.5 text-amber-200/80 font-code">
                        {localPuzzles.find((p) => p.id === l.puzzleId)?.title || l.puzzleId}
                      </td>
                      <td className="py-3.5 px-3.5 font-mono text-rose-400 font-bold">
                        <span className="flex items-center space-x-1.5">
                          <Clock className="h-3.5 w-3.5 animate-pulse" />
                          <span>{l.remainingSeconds}s remaining</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3.5 text-right">
                        <button
                          type="button"
                          disabled={loadingAction === `unlock-${l.teamId}-${l.puzzleId}`}
                          onClick={() => handleUnlock(l.teamId, l.puzzleId)}
                          className="px-3.5 py-1.5 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-400 hover:text-black font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                          {loadingAction === `unlock-${l.teamId}-${l.puzzleId}`
                            ? "Pardoning..."
                            : "Pardon Crew"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: ISLAND PUZZLES MATRIX (PUZZLES)
          ========================================================================= */}
      {activeTab === "PUZZLES" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                <Map className="h-3.5 w-3.5 text-amber-400" />
                Grand Line Island Matrix
              </span>
              <h2 className="font-pirata text-3xl text-amber-200 tracking-wide mt-0.5">
                Chartered Islands &amp; Clues ({localPuzzles.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewPuzzleOrder(localPuzzles.length + 1);
                setShowPuzzleModal(true);
              }}
              className="royale-gilded-btn px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Chart New Island</span>
            </button>
          </div>

          {/* Global Clue / Hint Feature Toggle Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-500/30 bg-[#140d07]/90 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                <Scroll className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-100 uppercase tracking-wide">
                    Captain&apos;s Logs &amp; Hints System:
                  </span>
                  <span
                    className={`text-[9px] px-2 py-0.5 uppercase tracking-widest font-mono font-bold rounded-md border ${
                      hintsEnabled
                        ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/40"
                        : "border-rose-500/40 text-rose-300 bg-rose-950/40"
                    }`}
                  >
                    {hintsEnabled ? "ACTIVE (VISIBLE TO TEAMS)" : "DISABLED (HIDDEN FROM TEAMS)"}
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/60 font-code mt-0.5">
                  {hintsEnabled
                    ? "Hints, Captain's Logs, and GP deductions are active on the treasure hunt map."
                    : "Hints are currently disabled. Crews will not see hint seals or penalties on the hunt map."}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={loadingAction === "toggle-hintsEnabled"}
              onClick={() => handleToggleDisplay("hintsEnabled", !hintsEnabled)}
              className={`px-4 py-2 rounded-xl border text-xs uppercase font-mono font-bold tracking-wider transition shrink-0 ${
                hintsEnabled
                  ? "border-rose-500/40 text-rose-300 hover:bg-rose-950/50"
                  : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/50"
              }`}
            >
              {hintsEnabled ? "Disable Hints Globally" : "Enable Hints Globally"}
            </button>
          </div>

          {/* Evidence Storage & Supabase Cloud CDN Status Card */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-[#120a05] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Compass className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-amber-100 uppercase tracking-wide">
                    Evidence Storage Engine:
                  </span>
                  {storageStatus?.isCloudConfigured ? (
                    <span className="text-[9px] px-2 py-0.5 uppercase tracking-widest font-mono font-bold rounded-md border border-emerald-500/40 text-emerald-300 bg-emerald-950/60">
                      Supabase S3 CDN Active
                    </span>
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 uppercase tracking-widest font-mono font-bold rounded-md border border-amber-500/40 text-amber-300 bg-amber-950/60">
                      PostgreSQL Database Fallback
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-amber-200/70 font-mono flex items-center gap-3 flex-wrap">
                  <span>
                    Cloud CDN Assets:{" "}
                    <strong className="text-emerald-400 font-bold">
                      {storageStatus?.cloudAssetsCount ?? 0}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Postgres DB Blobs:{" "}
                    <strong className="text-amber-400 font-bold">
                      {storageStatus?.dbMediaCount ?? 0}
                    </strong>{" "}
                    ({Math.round((storageStatus?.totalDbBytes ?? 0) / 1024)} KB)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              {storageStatus && storageStatus.dbMediaCount > 0 && (
                <button
                  type="button"
                  onClick={handleMigrateStorage}
                  disabled={isMigratingStorage || !storageStatus.isCloudConfigured}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-black shadow-md transition-transform active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                  title={
                    !storageStatus.isCloudConfigured
                      ? "Configure Supabase S3 env variables first"
                      : "Transfer database blobs to Supabase S3 and free Postgres memory"
                  }
                >
                  {isMigratingStorage ? (
                    <>
                      <Compass className="w-3.5 h-3.5 animate-spin" />
                      <span>Migrating to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Migrate DB Blobs to Supabase</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={refreshStorageStatus}
                className="p-2 rounded-lg border border-amber-500/30 text-amber-300 hover:text-amber-100 hover:bg-[#201209] text-xs font-mono cursor-pointer"
                title="Refresh Storage Status"
              >
                ↻
              </button>
            </div>
          </div>

          {storageMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 border ${
                storageMessage.type === "success"
                  ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                  : "bg-rose-950/60 border-rose-500/50 text-rose-300"
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{storageMessage.text}</span>
            </div>
          )}

          <div className="space-y-3">
            {localPuzzles.map((p, idx) => (
              <div
                key={p.id}
                className="royale-card rounded-2xl p-5 border-2 border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {/* Order Index Badge */}
                  <div className="flex flex-col items-center justify-center w-12 h-14 rounded-xl bg-gradient-to-b from-amber-500/20 to-amber-950/40 border border-amber-400/50 shrink-0 shadow-sm">
                    <span className="text-[9px] uppercase font-mono text-amber-400/80 font-bold">
                      Island
                    </span>
                    <span className="font-pirata text-2xl text-amber-200 font-bold leading-none mt-0.5">
                      #{p.orderIndex}
                    </span>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-pirata text-2xl text-amber-100 tracking-wide">
                        {p.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono text-[10px] font-bold">
                        {p.basePoints} ฿ Bounty
                      </span>
                      {((p.assets && p.assets.length > 0) || p.assetType) && (
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-sky-300 font-mono text-[10px] uppercase flex items-center gap-1">
                          {p.assets && p.assets.length > 1
                            ? `${p.assets.length} Dossiers (${p.assets.map((a) => a.type).slice(0, 3).join(", ")})`
                            : (p.assets?.[0]?.type || p.assetType)}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-amber-200/50">
                        ({p._count?.submissions ?? 0} attempts logged)
                      </span>
                    </div>

                    <p className="text-xs text-amber-200/70 font-code line-clamp-2 max-w-3xl leading-relaxed">
                      {p.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                        Accepted Keys:
                      </span>
                      {p.acceptedAnswers.map((ans, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-[#120a05] border border-amber-500/30 text-amber-200 font-mono text-[10px]"
                        >
                          {ans}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions & Reordering */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <div className="flex items-center border border-amber-500/30 rounded-lg overflow-hidden bg-[#120a05]">
                    <button
                      type="button"
                      disabled={idx === 0 || loadingAction !== null}
                      onClick={() => handleSwapOrder(p, "UP")}
                      className="p-2 text-amber-300 hover:bg-amber-500/20 disabled:opacity-20 transition"
                      title="Move Island Earlier"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === localPuzzles.length - 1 || loadingAction !== null}
                      onClick={() => handleSwapOrder(p, "DOWN")}
                      className="p-2 text-amber-300 hover:bg-amber-500/20 disabled:opacity-20 transition"
                      title="Move Island Later"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setHintModalPuzzle(p);
                      setNewHintContent("");
                    }}
                    className="px-3.5 py-2 rounded-xl border border-amber-500/40 text-amber-300 hover:bg-amber-950/40 font-mono text-xs uppercase font-bold tracking-wider transition flex items-center space-x-1.5"
                  >
                    <Scroll className="h-3.5 w-3.5" />
                    <span>Clues ({p.hints?.length ?? 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(p)}
                    className="px-3.5 py-2 rounded-xl border border-amber-400 bg-amber-400/10 text-amber-200 hover:bg-amber-400 hover:text-black font-mono text-xs uppercase font-bold tracking-wider transition flex items-center space-x-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Coordinates</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: TRANSPONDER SNAILS SUPPORT DESK (TICKETS)
          ========================================================================= */}
      {activeTab === "TICKETS" && (
        <div className="royale-panel rounded-2xl p-6 border-2 border-amber-500/30 space-y-5">
          <div className="border-b border-amber-500/20 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                <Megaphone className="h-3.5 w-3.5 text-amber-400" />
                Transponder Snail Desk (Den Den Mushi)
              </span>
              <h2 className="font-pirata text-2xl text-amber-200 tracking-wide mt-1">
                Participant Inquiries ({tickets.length})
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 font-mono text-xs font-bold">
              {tickets.filter((t) => t.status === "OPEN").length} Open Inquiries
            </span>
          </div>

          {tickets.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Megaphone className="w-12 h-12 text-amber-400/30 mx-auto" />
              <h3 className="font-pirata text-2xl text-amber-200 tracking-wide">
                No Transponder Snail Signals
              </h3>
              <p className="text-xs text-amber-200/60 font-code max-w-md mx-auto">
                No crews have submitted support tickets yet. Transmissions will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-amber-500/30 bg-[#140d07] p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-amber-100 uppercase tracking-wider text-sm">
                        {t.team.name}
                      </span>
                      <span className="text-amber-500">•</span>
                      <span className="text-xs font-code text-amber-200/70">
                        {t.user.name || t.user.email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-amber-300/80 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
                        Island #{t.puzzle.orderIndex}: {t.puzzle.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                          t.status === "OPEN"
                            ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                            : "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-amber-100 font-code leading-relaxed bg-[#100a05] p-3 rounded-xl border border-amber-900/30">
                    &quot;{t.message}&quot;
                  </p>

                  {t.adminReply && (
                    <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-xs space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                        High Command Dispatch Response:
                      </span>
                      <p className="text-amber-200/90 font-code leading-relaxed">{t.adminReply}</p>
                    </div>
                  )}

                  {t.status === "OPEN" && (
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type reply to transmit back to this crew..."
                        value={ticketReplies[t.id] || ""}
                        onChange={(e) =>
                          setTicketReplies((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                        className="flex-1 bg-[#100a05] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-100 font-code focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-amber-200/30"
                      />
                      <button
                        type="button"
                        disabled={loadingAction === `reply-${t.id}` || !ticketReplies[t.id]?.trim()}
                        onClick={() => handleReplyTicket(t.id)}
                        className="royale-gilded-btn px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 disabled:opacity-40 flex items-center space-x-1"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB: DATABASE PURGE & FACTORY RESET (DATABASE)
          ========================================================================= */}
      {activeTab === "DATABASE" && (
        <div className="space-y-6">
          {/* Top Panel Banner */}
          <div className="royale-panel rounded-2xl p-6 border-2 border-rose-500/40 bg-gradient-to-br from-[#200b08] via-[#140805] to-[#120704] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/20 pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-rose-400 font-bold flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                  High Admiralty Vault Protocol
                </span>
                <h2 className="font-pirata text-3xl text-rose-100 tracking-wide mt-1">
                  Database Purge &amp; Factory Reset Console
                </h2>
                <p className="text-xs text-rose-200/70 font-code mt-0.5 max-w-2xl">
                  Granular administrative tools to wipe specific database tables or perform an irreversible factory reset to start a fresh competition. Every destructive action requires verification phrase confirmation.
                </p>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold self-start sm:self-auto flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <span>Admiralty Level Authorized</span>
              </div>
            </div>

            {/* Platform Inventory KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400/80 block">
                  Chartered Islands
                </span>
                <span className="font-pirata text-2xl text-amber-200 block mt-0.5">
                  {localPuzzles.length}
                </span>
                <span className="text-[10px] text-amber-200/50 font-code">Puzzles in Matrix</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-sky-500/20">
                <span className="text-[10px] uppercase font-mono tracking-wider text-sky-400/80 block">
                  Pirate Crews
                </span>
                <span className="font-pirata text-2xl text-sky-200 block mt-0.5">
                  {teams.length}
                </span>
                <span className="text-[10px] text-sky-200/50 font-code">Registered Teams</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20">
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400/80 block">
                  Logged Solves
                </span>
                <span className="font-pirata text-2xl text-emerald-200 block mt-0.5">
                  {subsPage?.globalTotal ?? "..."}
                </span>
                <span className="text-[10px] text-emerald-200/50 font-code">All Submissions</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-purple-500/20">
                <span className="text-[10px] uppercase font-mono tracking-wider text-purple-400/80 block">
                  Transponder Signals
                </span>
                <span className="font-pirata text-2xl text-purple-200 block mt-0.5">
                  {tickets.length}
                </span>
                <span className="text-[10px] text-purple-200/50 font-code">Support Inquiries</span>
              </div>
            </div>
          </div>

          {/* Three Separate Options Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* OPTION 1: CLEAR ALL PUZZLES */}
            <div className="royale-panel rounded-2xl p-6 border-2 border-amber-500/30 bg-[#140b07] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Map className="h-5 w-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                    Option 1: Islands
                  </span>
                </div>

                <div>
                  <h3 className="font-pirata text-2xl text-amber-100 tracking-wide">
                    Clear All Puzzles
                  </h3>
                  <p className="text-xs text-amber-200/60 font-code mt-1 leading-relaxed">
                    Purges the entire puzzle ladder, all staged clues, hints, and attached media coordinates from the Grand Line archipelago.
                  </p>
                </div>

                <div className="space-y-2 text-xs font-code">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-400 block">
                    What this action executes:
                  </span>
                  <ul className="space-y-1.5 text-amber-200/70 text-[11px]">
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>Deletes all {localPuzzles.length} puzzles and titles</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>Deletes all hints and clue penalty configurations</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>Deletes all puzzle media assets and attachments</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>Deletes puzzle submissions and team unlock records</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Unlinks current puzzle pointers from all teams</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Teams and student accounts remain intact</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-amber-500/20 space-y-2">
                <button
                  type="button"
                  onClick={() => handleOpenPurgeModal("CLEAR_PUZZLES")}
                  className="w-full py-3 px-4 rounded-xl border-2 border-amber-500/50 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-98 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="h-4 w-4 text-amber-400" />
                  <span>Clear All Puzzles</span>
                </button>
                <span className="text-[10px] text-amber-200/40 font-mono text-center block">
                  Requires phrase: CLEAR PUZZLES
                </span>
              </div>
            </div>

            {/* OPTION 2: CLEAR ALL TEAMS & USERS */}
            <div className="royale-panel rounded-2xl p-6 border-2 border-rose-500/30 bg-[#160b09] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-400/10 border border-rose-400/30 text-rose-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                    Option 2: Fleet
                  </span>
                </div>

                <div>
                  <h3 className="font-pirata text-2xl text-rose-100 tracking-wide">
                    Clear All Teams &amp; Users
                  </h3>
                  <p className="text-xs text-rose-200/60 font-code mt-1 leading-relaxed">
                    Wipes all pirate crews, sailor rosters, student accounts, submissions, and penalty records. Organizers remain safe.
                  </p>
                </div>

                <div className="space-y-2 text-xs font-code">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-rose-400 block">
                    What this action executes:
                  </span>
                  <ul className="space-y-1.5 text-rose-200/70 text-[11px]">
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>Deletes all {teams.length} registered pirate teams</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>Deletes all student user accounts</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>Deletes all join requests and team invitations</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>Deletes all team score adjustments &amp; bounty bonuses</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>Wipes all active lockouts and leaderboard caches</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Preserves organizer accounts and admin credentials</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-rose-500/20 space-y-2">
                <button
                  type="button"
                  onClick={() => handleOpenPurgeModal("CLEAR_TEAMS")}
                  className="w-full py-3 px-4 rounded-xl border-2 border-rose-500/50 hover:border-rose-400 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 active:scale-98 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="h-4 w-4 text-rose-400" />
                  <span>Clear Teams &amp; Users</span>
                </button>
                <span className="text-[10px] text-rose-200/40 font-mono text-center block">
                  Requires phrase: CLEAR TEAMS
                </span>
              </div>
            </div>

            {/* OPTION 3: RESET ENTIRE DATABASE */}
            <div className="royale-panel rounded-2xl p-6 border-2 border-rose-500/60 bg-gradient-to-b from-[#250d09] via-[#1a0a06] to-[#120804] flex flex-col justify-between space-y-6 shadow-[0_0_40px_rgba(244,63,94,0.15)]">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-rose-500/30 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
                    <RotateCcw className="h-5 w-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-600/25 border border-rose-400/50 text-rose-200 font-mono text-[10px] font-black uppercase tracking-wider">
                    Option 3: Day Zero
                  </span>
                </div>

                <div>
                  <h3 className="font-pirata text-2xl text-rose-100 tracking-wide">
                    Reset Entire Database
                  </h3>
                  <p className="text-xs text-rose-200/70 font-code mt-1 leading-relaxed">
                    Complete platform factory reset as if this were a brand new installation. Returns FIND X to day zero with clean defaults.
                  </p>
                </div>

                <div className="space-y-2 text-xs font-code">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-rose-300 block">
                    What this action executes:
                  </span>
                  <ul className="space-y-1.5 text-rose-200/80 text-[11px]">
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>Wipes all puzzles, hints, assets, and media blobs</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>Wipes all teams, student accounts, and solve logs</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>Wipes support tickets, adjustments, and announcements</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Resets competition state to UPCOMING</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Clears all chronometer dates and broadcast alerts</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Preserves organizer user record in a clean state</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-rose-500/30 space-y-2">
                <button
                  type="button"
                  onClick={() => handleOpenPurgeModal("RESET_DATABASE")}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 hover:from-rose-600 hover:to-amber-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-[0_4px_20px_rgba(244,63,94,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset Entire Database</span>
                </button>
                <span className="text-[10px] text-rose-300/50 font-mono text-center block">
                  Requires phrase: RESET DATABASE
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CHART NEW ISLAND (ADD PUZZLE)
          ========================================================================= */}
      {showPuzzleModal && (
        <div
          onClick={() => setShowPuzzleModal(false)}
          className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 pb-12 overflow-y-auto bg-black/80 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="royale-panel rounded-2xl p-6 sm:p-7 border-2 border-amber-500/60 max-w-4xl w-full my-2 space-y-5 shadow-[0_25px_80px_rgba(0,0,0,0.95)] relative"
          >
            {/* Wax-Seal Red Close Button */}
            <button
              onClick={() => setShowPuzzleModal(false)}
              className="absolute -top-3.5 -right-3.5 w-11 h-11 bg-red-600 rounded-full flex items-center justify-center border-2 border-amber-950 shadow-lg text-amber-100 hover:bg-red-700 transition-all z-20 cursor-pointer active:scale-95"
              aria-label="Close"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="border-b border-amber-500/30 pb-3">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
                Grand Line Cartography
              </span>
              <h3 className="font-pirata text-3xl text-amber-200 tracking-wide mt-0.5">
                Chart New Grand Line Island
              </h3>
            </div>

            <form onSubmit={handleCreatePuzzle} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Core Details */}
                <div className="space-y-3.5">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300 font-bold block border-b border-amber-500/20 pb-1">
                    1. Island Coordinates &amp; Cipher
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                        Island Order #
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newPuzzleOrder}
                        onChange={(e) => setNewPuzzleOrder(Number(e.target.value))}
                        required
                        className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                        Base Bounty (฿)
                      </label>
                      <input
                        type="number"
                        value={newPuzzlePoints}
                        onChange={(e) => setNewPuzzlePoints(Number(e.target.value))}
                        required
                        className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                      Island Title
                    </label>
                    <input
                      type="text"
                      value={newPuzzleTitle}
                      onChange={(e) => setNewPuzzleTitle(e.target.value)}
                      placeholder="e.g. Drum Island or Reverse Mountain"
                      required
                      className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-sans focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-amber-200/30"
                    />
                  </div>

                  <div>
                    <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                      Island Lore &amp; Clues (Markdown)
                    </label>
                    <textarea
                      rows={4}
                      value={newPuzzleDesc}
                      onChange={(e) => setNewPuzzleDesc(e.target.value)}
                      placeholder="Enter the riddle, story, and puzzle coordinates..."
                      required
                      className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-3 text-xs text-amber-100 font-code focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-amber-200/30 leading-relaxed"
                    />
                  </div>

                  {/* Attached Evidence Dossier & Direct Upload */}
                  <EvidenceManager
                    evidenceList={newPuzzleAssets}
                    onChange={setNewPuzzleAssets}
                    disabled={loadingAction === "create-puzzle"}
                  />

                  <div>
                    <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                      Accepted Answers (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newPuzzleAnswers}
                      onChange={(e) => setNewPuzzleAnswers(e.target.value)}
                      placeholder="e.g. luffy, monkey d luffy, straw hat"
                      required
                      className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-amber-200/30"
                    />
                  </div>
                </div>

                {/* Column 2: Hints Staging */}
                <div className="space-y-3.5 bg-[#140d07] border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold flex items-center space-x-1.5">
                      <Scroll className="h-3.5 w-3.5 text-amber-400" />
                      <span>2. Attached Clues &amp; Hints</span>
                    </span>
                    <span className="text-[10px] text-amber-200/60 font-mono">
                      {stagedHints.length} staged
                    </span>
                  </div>

                  {stagedHints.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {stagedHints.map((sh, idx) => (
                        <div
                          key={sh.id}
                          className="p-2.5 rounded-lg border border-amber-500/20 bg-[#100a05] text-xs flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <span className="text-amber-100 font-bold block font-code">
                              Clue #{idx + 1}: {sh.content}
                            </span>
                            <span className="text-amber-200/50 text-[10px] font-mono">
                              Delay: {sh.unlockDelayMinutes}m • Fine: -{sh.penaltyPoints} ฿
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setStagedHints((prev) => prev.filter((item) => item.id !== sh.id))
                            }
                            className="p-1 text-rose-400 hover:text-rose-300"
                            title="Remove clue"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-amber-500/20 pt-3 space-y-2.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300 font-bold block">
                      + Stage a Clue
                    </span>

                    <div>
                      <label className="text-amber-200/60 block mb-1 text-[10px] uppercase font-mono">
                        Clue Text
                      </label>
                      <textarea
                        rows={2}
                        value={stagedHintContent}
                        onChange={(e) => setStagedHintContent(e.target.value)}
                        placeholder="Enter clue text..."
                        className="w-full bg-[#100a05] border border-amber-500/30 rounded-lg p-2 text-amber-100 font-code focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs placeholder:text-amber-200/25"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-amber-200/60 block mb-1 text-[10px] uppercase font-mono">
                          Penalty (-฿)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={stagedHintPenalty}
                          onChange={(e) => setStagedHintPenalty(Number(e.target.value))}
                          className="w-full bg-[#100a05] border border-amber-500/30 rounded-lg p-1.5 text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-amber-200/60 block mb-1 text-[10px] uppercase font-mono">
                          Delay (Minutes)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={stagedHintDelay}
                          onChange={(e) => setStagedHintDelay(Number(e.target.value))}
                          className="w-full bg-[#100a05] border border-amber-500/30 rounded-lg p-1.5 text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!stagedHintContent.trim()}
                      onClick={() => {
                        if (!stagedHintContent.trim()) return;
                        setStagedHints((prev) => [
                          ...prev,
                          {
                            id: "staged-" + Date.now(),
                            content: stagedHintContent.trim(),
                            penaltyPoints: Math.max(0, Number(stagedHintPenalty) || 20),
                            unlockDelayMinutes: Math.max(0, Number(stagedHintDelay) || 15),
                          },
                        ]);
                        setStagedHintContent("");
                      }}
                      className="w-full py-2 rounded-lg border border-amber-400/40 text-amber-300 hover:bg-amber-400/15 font-mono text-[10px] uppercase font-bold tracking-wider transition disabled:opacity-40 flex items-center justify-center space-x-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Stage Clue</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-500/30">
                <button
                  type="button"
                  onClick={() => setShowPuzzleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs uppercase font-mono tracking-wider text-amber-200/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === "create-puzzle"}
                  className="royale-gilded-btn px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {loadingAction === "create-puzzle" ? "Chartering..." : "Chart Island to Grand Line"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT ISLAND COORDINATES
          ========================================================================= */}
      {editingPuzzle && (
        <div
          onClick={() => setEditingPuzzle(null)}
          className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 pb-12 overflow-y-auto bg-black/80 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="royale-panel rounded-2xl p-6 sm:p-7 border-2 border-amber-500/60 max-w-xl w-full my-2 space-y-5 shadow-[0_25px_80px_rgba(0,0,0,0.95)] relative"
          >
            {/* Wax-Seal Red Close Button */}
            <button
              onClick={() => setEditingPuzzle(null)}
              className="absolute -top-3.5 -right-3.5 w-11 h-11 bg-red-600 rounded-full flex items-center justify-center border-2 border-amber-950 shadow-lg text-amber-100 hover:bg-red-700 transition-all z-20 cursor-pointer active:scale-95"
              aria-label="Close"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="border-b border-amber-500/30 pb-3">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
                Edit Island Coordinates
              </span>
              <h3 className="font-pirata text-3xl text-amber-200 tracking-wide mt-0.5">
                Island #{editingPuzzle.orderIndex}: {editingPuzzle.title}
              </h3>
            </div>

            <form onSubmit={handleUpdatePuzzle} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                    Order #
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editOrder}
                    onChange={(e) => setEditOrder(Number(e.target.value))}
                    required
                    className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                    Base Bounty (฿)
                  </label>
                  <input
                    type="number"
                    value={editPoints}
                    onChange={(e) => setEditPoints(Number(e.target.value))}
                    required
                    className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                  Island Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-sans focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                  Lore &amp; Description
                </label>
                <textarea
                  rows={4}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  required
                  className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-3 text-xs text-amber-100 font-code focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Attached Evidence Dossier & Direct Upload */}
              <EvidenceManager
                evidenceList={editPuzzleAssets}
                onChange={setEditPuzzleAssets}
                disabled={loadingAction === "update-puzzle"}
              />

              <div>
                <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                  Accepted Answers (comma-separated)
                </label>
                <input
                  type="text"
                  value={editAnswers}
                  onChange={(e) => setEditAnswers(e.target.value)}
                  required
                  className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-500/30">
                <button
                  type="button"
                  onClick={() => setEditingPuzzle(null)}
                  className="px-4 py-2 rounded-xl text-xs uppercase font-mono tracking-wider text-amber-200/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === "update-puzzle"}
                  className="royale-gilded-btn px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {loadingAction === "update-puzzle" ? "Saving..." : "Save Coordinates"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CLUES & HINTS MANAGEMENT
          ========================================================================= */}
      {hintModalPuzzle && (
        <div
          onClick={() => setHintModalPuzzle(null)}
          className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 pb-12 overflow-y-auto bg-black/80 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="royale-panel rounded-2xl p-6 sm:p-7 border-2 border-amber-500/60 max-w-lg w-full my-2 space-y-5 shadow-[0_25px_80px_rgba(0,0,0,0.95)] relative"
          >
            {/* Wax-Seal Red Close Button */}
            <button
              onClick={() => setHintModalPuzzle(null)}
              className="absolute -top-3.5 -right-3.5 w-11 h-11 bg-red-600 rounded-full flex items-center justify-center border-2 border-amber-950 shadow-lg text-amber-100 hover:bg-red-700 transition-all z-20 cursor-pointer active:scale-95"
              aria-label="Close"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="border-b border-amber-500/30 pb-3">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
                Expedition Clues &amp; Hints
              </span>
              <h3 className="font-pirata text-2xl text-amber-200 tracking-wide mt-0.5">
                Clues for #{hintModalPuzzle.orderIndex}: {hintModalPuzzle.title}
              </h3>
            </div>

            {/* List of Existing Hints */}
            {hintModalPuzzle.hints && hintModalPuzzle.hints.length > 0 && (
              <div className="space-y-2 border border-amber-500/30 bg-[#120a05] rounded-xl p-3.5 max-h-44 overflow-y-auto">
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300 font-bold block mb-1">
                  Active Clues ({hintModalPuzzle.hints.length})
                </span>
                {hintModalPuzzle.hints.map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded-lg border border-amber-500/20 bg-[#160d07] text-xs flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <span className="text-amber-100 font-bold block font-code">
                        Clue #{h.orderIndex}: {h.content}
                      </span>
                      <span className="text-amber-200/50 text-[10px] font-mono">
                        Available after: {h.unlockDelayMinutes}m • Fine: -{h.penaltyPoints} ฿
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={loadingAction === `delete-hint-${h.id}`}
                      onClick={() => handleDeleteHint(hintModalPuzzle.id, h.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 transition"
                      title="Delete clue"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Form to add a new hint */}
            <form onSubmit={handleSaveHint} className="space-y-3.5 text-xs">
              <div>
                <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                  Clue Text
                </label>
                <textarea
                  rows={3}
                  value={newHintContent}
                  onChange={(e) => setNewHintContent(e.target.value)}
                  placeholder="Enter hint text for participants..."
                  required
                  className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-3 text-xs text-amber-100 font-code focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-amber-200/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                    Penalty Fine (-฿)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newHintPenalty}
                    onChange={(e) => setNewHintPenalty(Number(e.target.value))}
                    required
                    className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                    Unlock Delay (Minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newHintDelay}
                    onChange={(e) => setNewHintDelay(Number(e.target.value))}
                    required
                    className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-500/30">
                <button
                  type="button"
                  onClick={() => setHintModalPuzzle(null)}
                  className="px-4 py-2 rounded-xl text-xs uppercase font-mono tracking-wider text-amber-200/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === "save-hint" || !newHintContent.trim()}
                  className="royale-gilded-btn px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {loadingAction === "save-hint" ? "Attaching..." : "Attach Clue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADMIN CREW ROSTER INSPECTION
          ========================================================================= */}
      {selectedRosterTeam && (
        <AdminTeamRosterModal
          team={selectedRosterTeam}
          onClose={() => setSelectedRosterTeam(null)}
          isAdmin={true}
        />
      )}

      {/* =========================================================================
          MODAL: HIGH ADMIRALTY PURGE & FACTORY RESET CONFIRMATION
          ========================================================================= */}
      {purgeTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="max-w-lg w-full bg-gradient-to-b from-[#220d09] via-[#160c07] to-[#120804] border-2 border-rose-500/60 rounded-2xl p-6 shadow-[0_0_50px_rgba(244,63,94,0.3)] space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-rose-500/20 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-rose-400 font-bold block">
                    High Admiralty Security Verification
                  </span>
                  <h3 className="font-pirata text-2xl text-rose-100 tracking-wide mt-0.5">
                    {purgeTarget === "CLEAR_PUZZLES" && "Purge Island Matrix"}
                    {purgeTarget === "CLEAR_TEAMS" && "Purge Fleet & Students"}
                    {purgeTarget === "RESET_DATABASE" && "Grand Line Factory Reset"}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClosePurgeModal}
                disabled={isPurging}
                className="text-amber-200/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Warning Content */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs font-code text-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-300 uppercase tracking-wider font-mono">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>Destructive &amp; Irreversible Operation</span>
                </div>
                {purgeTarget === "CLEAR_PUZZLES" && (
                  <p className="leading-relaxed text-rose-200/90 text-[11px]">
                    This will permanently delete all <strong>{localPuzzles.length} puzzle(s)</strong>, including all attached hints, clue penalties, media assets, submissions, and team unlock records. All team current puzzle pointers will be unlinked.
                  </p>
                )}
                {purgeTarget === "CLEAR_TEAMS" && (
                  <p className="leading-relaxed text-rose-200/90 text-[11px]">
                    This will permanently delete all <strong>{teams.length} pirate crew(s)</strong> and all registered student user accounts. All submissions, score adjustments, join requests, and support tickets will be wiped.
                    <span className="block mt-1 text-emerald-300 font-semibold font-mono text-[10px]">
                      Organizer accounts will be preserved so your current session remains active.
                    </span>
                  </p>
                )}
                {purgeTarget === "RESET_DATABASE" && (
                  <p className="leading-relaxed text-rose-200/90 text-[11px]">
                    This will completely reset the platform to day-zero. All puzzles, hints, media assets, teams, student accounts, submissions, tickets, announcements, and timer schedules will be completely wiped.
                    <span className="block mt-1 text-emerald-300 font-semibold font-mono text-[10px]">
                      Organizer credentials will be preserved with a clean state.
                    </span>
                  </p>
                )}
              </div>

              {/* Typed verification input */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-mono text-amber-200/80 block uppercase tracking-wider">
                  Type <span className="font-bold text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30 font-mono select-all">{getExpectedPhrase(purgeTarget)}</span> to authorize:
                </label>
                <input
                  type="text"
                  autoFocus
                  disabled={isPurging}
                  value={purgeConfirmationInput}
                  onChange={(e) => setPurgeConfirmationInput(e.target.value)}
                  placeholder={`Type "${getExpectedPhrase(purgeTarget)}" here`}
                  className="w-full bg-[#100805] border-2 border-rose-500/40 rounded-xl p-3 text-xs text-rose-100 font-mono focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder:text-rose-300/25 tracking-wider uppercase"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-500/20">
              <button
                type="button"
                onClick={handleClosePurgeModal}
                disabled={isPurging}
                className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-amber-200/70 font-mono text-xs uppercase font-bold tracking-wider transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurge}
                disabled={
                  isPurging ||
                  purgeConfirmationInput.trim().toUpperCase() !== getExpectedPhrase(purgeTarget)
                }
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 hover:from-rose-600 hover:to-amber-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg flex items-center space-x-2"
              >
                {isPurging ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    <span>Executing Purge...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>
                      {purgeTarget === "CLEAR_PUZZLES" && "Purge All Puzzles"}
                      {purgeTarget === "CLEAR_TEAMS" && "Purge Teams & Users"}
                      {purgeTarget === "RESET_DATABASE" && "Factory Reset Database"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
