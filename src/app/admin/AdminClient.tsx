"use client";

import React, { useCallback, useEffect, useState, useSyncExternalStore } from "react";

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
} from "@/components/icons";
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
} from "./actions";
import type { SubmissionsPageData } from "./actions";
import AdminTeamRosterModal, {
  type RosterTeam,
  type AdminTeamData,
} from "@/components/team/AdminTeamRosterModal";

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
    timeZoneName: "short",
  });
}

export const TAB_IDS = [
  "STATE",
  "SUBMISSIONS",
  "POINTS",
  "LOCKOUTS",
  "PUZZLES",
  "TICKETS",
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

  const [prevConfig, setPrevConfig] = useState(config);
  if (config !== prevConfig) {
    setPrevConfig(config);
    setStartTimeInput(toDatetimeLocalString(config?.startTime));
    setFreezeTimeInput(toDatetimeLocalString(config?.freezeTime));
    setEndTimeInput(toDatetimeLocalString(config?.endTime));
    setSavedStartTime(config?.startTime ?? null);
    setSavedFreezeTime(config?.freezeTime ? new Date(config.freezeTime).toISOString() : null);
    setSavedEndTime(config?.endTime ?? null);
  }

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
    updateCountdown();
    const id = setInterval(updateCountdown, 1000);
    return () => clearInterval(id);
  }, [activeCountdownTarget]);

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
  const [newPuzzleAssetUrl, setNewPuzzleAssetUrl] = useState("");
  const [newPuzzleAssetType, setNewPuzzleAssetType] = useState("image");
  const [newPuzzlePoints, setNewPuzzlePoints] = useState(100);
  const [newPuzzleAnswers, setNewPuzzleAnswers] = useState("");

  // Edit puzzle form state
  const [editingPuzzle, setEditingPuzzle] = useState<AdminPuzzle | null>(null);
  const [editOrder, setEditOrder] = useState<number>(1);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAssetUrl, setEditAssetUrl] = useState("");
  const [editAssetType, setEditAssetType] = useState("image");
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

  // Handle Save Landing Schedule
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("save-schedule");

    const res = await updateCompetitionScheduleAction({
      startTime: startTimeInput || null,
      freezeTime: freezeTimeInput || null,
      endTime: endTimeInput || null,
    });
    setLoadingAction(null);

    if (res.success) {
      setSavedStartTime(startTimeInput ? new Date(startTimeInput).toISOString() : null);
      setSavedFreezeTime(freezeTimeInput ? new Date(freezeTimeInput).toISOString() : null);
      setSavedEndTime(endTimeInput ? new Date(endTimeInput).toISOString() : null);
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
      assetUrl: newPuzzleAssetUrl.trim() || undefined,
      assetType: newPuzzleAssetType || undefined,
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
      const createdPuzzle: AdminPuzzle = {
        id: "puz-" + Date.now(),
        orderIndex: Number(newPuzzleOrder),
        title: newPuzzleTitle.trim(),
        description: newPuzzleDesc.trim(),
        assetUrl: newPuzzleAssetUrl.trim() || null,
        assetType: newPuzzleAssetType || null,
        basePoints: Number(newPuzzlePoints),
        acceptedAnswers: answersArray,
        hints: hintsArray.map((h, i) => ({ id: `hint-${Date.now()}-${i}`, ...h })),
        _count: { submissions: 0 },
      };
      setLocalPuzzles((prev) =>
        [...prev, createdPuzzle].sort((a, b) => a.orderIndex - b.orderIndex)
      );

      setShowPuzzleModal(false);
      setNewPuzzleTitle("");
      setNewPuzzleDesc("");
      setNewPuzzleAssetUrl("");
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
    setEditAssetUrl(p.assetUrl || "");
    setEditAssetType(p.assetType || "image");
    setEditPoints(p.basePoints);
    setEditAnswers(p.acceptedAnswers.join(", "));
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
      assetUrl: editAssetUrl.trim() || undefined,
      assetType: editAssetType || undefined,
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
                  assetUrl: editAssetUrl.trim() || null,
                  assetType: editAssetType || null,
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
    field: "showQuestionsSolved" | "showPointHistory" | "hideTeamNames" | "supportFeatureEnabled",
    val: boolean
  ) => {
    setLoadingAction(`toggle-${field}`);
    const res = await updateLeaderboardDisplaySettingsAction({
      showQuestionsSolved: field === "showQuestionsSolved" ? val : showQuestionsSolved,
      showPointHistory: field === "showPointHistory" ? val : showPointHistory,
      hideTeamNames: field === "hideTeamNames" ? val : hideTeamNames,
      supportFeatureEnabled: field === "supportFeatureEnabled" ? val : supportFeatureEnabled,
    });
    setLoadingAction(null);

    if (res.success) {
      if (field === "showQuestionsSolved") setShowQuestionsSolved(val);
      if (field === "showPointHistory") setShowPointHistory(val);
      if (field === "hideTeamNames") setHideTeamNames(val);
      if (field === "supportFeatureEnabled") setSupportFeatureEnabled(val);
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
          { id: "STATE", label: "Log Pose & Schedule", icon: Compass },
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
                <div className="space-y-3">
                  <div>
                    <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold tracking-wider">
                      Voyage Start (Set Sail)
                    </label>
                    <input
                      type="datetime-local"
                      value={startTimeInput}
                      onChange={(e) => setStartTimeInput(e.target.value)}
                      className="w-full bg-[#120a05] border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <span
                      suppressHydrationWarning
                      className="text-[10px] text-amber-200/50 mt-0.5 block font-code"
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
                      className="text-[10px] text-amber-200/50 mt-0.5 block font-code"
                    >
                      Active: <span suppressHydrationWarning>{mounted ? formatDateTimeDisplay(savedFreezeTime) : "Loading..."}</span>
                    </span>
                  </div>

                  <div>
                    <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold tracking-wider">
                      Voyage Concludes (Grand Line Closes)
                    </label>
                    <input
                      type="datetime-local"
                      value={endTimeInput}
                      onChange={(e) => setEndTimeInput(e.target.value)}
                      className="w-full bg-[#120a05] border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <span
                      suppressHydrationWarning
                      className="text-[10px] text-amber-200/50 mt-0.5 block font-code"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
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
                      {p.assetType && (
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-sky-300 font-mono text-[10px] uppercase">
                          {p.assetType}
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                        Artifact Asset Type
                      </label>
                      <select
                        value={newPuzzleAssetType}
                        onChange={(e) => setNewPuzzleAssetType(e.target.value)}
                        className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        <option value="image">Image (Poster / Map)</option>
                        <option value="audio">Audio (Dial / Song)</option>
                        <option value="pdf">PDF (Document / Log)</option>
                        <option value="video">Video (Snail Recording)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                        Artifact URL
                      </label>
                      <input
                        type="url"
                        value={newPuzzleAssetUrl}
                        onChange={(e) => setNewPuzzleAssetUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-code focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-amber-200/30"
                      />
                    </div>
                  </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                    Asset Type
                  </label>
                  <select
                    value={editAssetType}
                    onChange={(e) => setEditAssetType(e.target.value)}
                    className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="image">Image</option>
                    <option value="audio">Audio</option>
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className="text-amber-300/80 block mb-1 text-[10px] uppercase font-mono font-bold">
                    Asset URL
                  </label>
                  <input
                    type="url"
                    value={editAssetUrl}
                    onChange={(e) => setEditAssetUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#120a05] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-100 font-code focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

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
    </div>
  );
}
