"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Shield,
  Radio,
  Lock,
  Unlock,
  Terminal,
  MessageSquare,
  Send,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Edit3,
  Sliders,
  ListFilter,
  Search,
  CheckCircle2,
  Trash2,
  Megaphone,
  Clock,
} from "lucide-react";
import {
  updateCompetitionStateAction,
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
import SearchableSelect from "@/components/ui/SearchableSelect";
import AdminTeamRosterModal, { type RosterTeam, type AdminTeamData } from "@/components/team/AdminTeamRosterModal";

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

interface AdminConfig {
  broadcastMessage: string | null;
  competitionState: string;
  showQuestionsSolved?: boolean;
  showPointHistory?: boolean;
  hideTeamNames?: boolean;
  supportFeatureEnabled?: boolean;
  lockoutMaxAttempts?: number;
  lockoutWindowMinutes?: number;
  lockoutDurationMinutes?: number;
  announcementRetentionDays?: number;
}

export const TAB_IDS = ["STATE", "SUBMISSIONS", "POINTS", "LOCKOUTS", "PUZZLES", "TICKETS"] as const;
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
  const [ticketReplies, setTicketReplies] = useState<Record<string, string>>({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedRosterTeam, setSelectedRosterTeam] = useState<RosterTeam | AdminTeamData | null>(null);

  // Local state for puzzles and stacked announcements
  const [localPuzzles, setLocalPuzzles] = useState<AdminPuzzle[]>(puzzles);
  const [localAnnouncements, setLocalAnnouncements] = useState<AdminAnnouncement[]>(announcements);

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
  // Publish-form retention: starts at 3, then the last-published value
  // (persisted server-side) becomes the default on the next load.
  const [newAnnouncementDays, setNewAnnouncementDays] = useState<number>(
    config?.announcementRetentionDays ?? 3
  );

  // Submissions filter state — filters and search are executed server-side
  // (see getSubmissionsPageAction); the client only holds the current page.
  const [subFilterTeam, setSubFilterTeam] = useState<string>("ALL");
  const [subFilterPuzzle, setSubFilterPuzzle] = useState<string>("ALL");
  const [subFilterStatus, setSubFilterStatus] = useState<"ALL" | "CORRECT" | "INCORRECT">("ALL");
  const [subSearchQuery, setSubSearchQuery] = useState<string>("");
  const [debouncedSubSearch, setDebouncedSubSearch] = useState<string>("");
  const [subsPage, setSubsPage] = useState<SubmissionsPageData | null>(null);
  const [subsLoading, setSubsLoading] = useState(false);

  // Score adjustments & display state
  const [showQuestionsSolved, setShowQuestionsSolved] = useState<boolean>(config?.showQuestionsSolved ?? true);
  const [showPointHistory, setShowPointHistory] = useState<boolean>(config?.showPointHistory ?? true);
  const [hideTeamNames, setHideTeamNames] = useState<boolean>(config?.hideTeamNames ?? false);
  const [supportFeatureEnabled, setSupportFeatureEnabled] = useState<boolean>(config?.supportFeatureEnabled ?? true);
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

  // Lockout settings state — seeded from config
  const [lockoutMaxAttempts, setLockoutMaxAttempts] = useState<number>(config?.lockoutMaxAttempts ?? 5);
  const [lockoutWindowMinutes, setLockoutWindowMinutes] = useState<number>(config?.lockoutWindowMinutes ?? 2);
  const [lockoutDurationMinutes, setLockoutDurationMinutes] = useState<number>(config?.lockoutDurationMinutes ?? 5);

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

  // Debounce the submissions search box so typing does not fire a query per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSubSearch(subSearchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [subSearchQuery]);

  // Fetch one server-side page of submissions (50 rows) with DB-level filters.
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
        setFeedback(res.error || "Failed to load submissions.");
      }
    },
    [debouncedSubSearch, subFilterStatus, subFilterTeam, subFilterPuzzle]
  );

  // (Re)load page 1 whenever the tab is opened or any filter changes.
  // Deferred one tick: loadSubsPage calls setState synchronously in the effect
  // body (setSubsLoading), which cascades renders during commit
  // (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (activeTab !== "SUBMISSIONS") return;
    const t = window.setTimeout(() => loadSubsPage(1), 0);
    return () => window.clearTimeout(t);
  }, [activeTab, subFilterTeam, subFilterPuzzle, subFilterStatus, debouncedSubSearch, loadSubsPage]);

  // Global Escape key listener to dismiss any open modal.
  // Declared after every setter above — the original placement referenced
  // state before it was declared (a latent stale-closure bug).
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
      setFeedback(`Competition state updated to: ${state}`);
    }
  };

  // Handle Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;

    setLoadingAction("create-announcement");
    const chosenDays = Math.max(1, Number(newAnnouncementDays) || 3);
    const res = await createAnnouncementAction({
      message: newAnnouncementText.trim(),
      retentionDays: chosenDays,
    });
    setLoadingAction(null);

    const created = res.announcement;
    if (res.success) {
      setFeedback("Announcement published.");
      setNewAnnouncementText("");
      // Keep the last-published value as the new default for the form.
      setNewAnnouncementDays(chosenDays);
      if (created) {
        setLocalAnnouncements((prev) => [created, ...prev]);
      }
    } else {
      setFeedback(res.error || "Failed to publish announcement.");
    }
  };

  // Handle Delete Announcement
  const handleDeleteAnnouncement = async (id: string) => {
    // Optimistically remove from local state immediately
    setLocalAnnouncements((prev) => prev.filter((a) => a.id !== id));
    setLoadingAction(`delete-announcement-${id}`);
    const res = await deleteAnnouncementAction(id);
    setLoadingAction(null);

    if (res.success) {
      setFeedback("Announcement deleted.");
    } else {
      setFeedback(res.error || "Failed to delete announcement.");
    }
  };

  // Handle Manual Team Unlock
  const handleUnlockTeam = async (teamId: string, puzzleId: string) => {
    setLoadingAction(`unlock-${teamId}`);
    const res = await unlockTeamLockoutAction(teamId, puzzleId);
    setLoadingAction(null);

    if (res.success) {
      setFeedback("Team unlocked. Access restored.");
    }
  };

  // Handle Support Ticket Reply
  const handleReplyTicket = async (ticketId: string) => {
    const reply = ticketReplies[ticketId];
    if (!reply) return;

    setLoadingAction(`reply-${ticketId}`);
    const res = await replyToSupportTicketAction(ticketId, reply);
    setLoadingAction(null);

    if (res.success) {
      setFeedback("Reply sent to team.");
    }
  };

  // Handle Create Puzzle
  const handleCreatePuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("create-puzzle");

    const answersArray = newPuzzleAnswers
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const initialHintsData = stagedHints.map((h) => ({
      content: h.content,
      penaltyPoints: h.penaltyPoints,
      unlockDelayMinutes: h.unlockDelayMinutes,
    }));

    const res = await upsertPuzzleAction({
      orderIndex: Number(newPuzzleOrder),
      title: newPuzzleTitle,
      description: newPuzzleDesc,
      assetUrl: newPuzzleAssetUrl || undefined,
      assetType: newPuzzleAssetType,
      basePoints: Number(newPuzzlePoints),
      acceptedAnswers: answersArray,
      initialHints: initialHintsData,
    });

    setLoadingAction(null);

    if (res.success) {
      setShowPuzzleModal(false);
      // Reset form
      setNewPuzzleTitle("");
      setNewPuzzleDesc("");
      setNewPuzzleAssetUrl("");
      setNewPuzzleAnswers("");
      setStagedHints([]);
      setStagedHintContent("");
      setFeedback("New puzzle created with configured hints.");
    } else {
      setFeedback(res.error || "Failed to create puzzle");
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
    setEditAnswers(p.acceptedAnswers ? p.acceptedAnswers.join(", ") : "");
  };

  // Handle Save Edit Puzzle
  const handleSaveEditPuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPuzzle) return;
    setLoadingAction("save-edit-puzzle");

    const answersArray = editAnswers
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const res = await upsertPuzzleAction({
      id: editingPuzzle.id,
      orderIndex: Number(editOrder),
      title: editTitle,
      description: editDesc,
      assetUrl: editAssetUrl || undefined,
      assetType: editAssetType,
      basePoints: Number(editPoints),
      acceptedAnswers: answersArray,
    });

    setLoadingAction(null);

    if (res.success) {
      setEditingPuzzle(null);
      setFeedback("Puzzle updated successfully.");
    } else {
      setFeedback(res.error || "Failed to update puzzle");
    }
  };

  // Handle Swap Order (Move Up / Down)
  const handleSwapOrder = async (puzzleId: string, direction: "UP" | "DOWN") => {
    setLoadingAction(`swap-${puzzleId}`);
    const res = await swapPuzzleOrderAction(puzzleId, direction);
    setLoadingAction(null);

    if (res.success) {
      setFeedback(`Puzzle moved ${direction.toLowerCase()}.`);
    } else {
      setFeedback(res.error || "Failed to swap order");
    }
  };

  // Handle manual score adjustment
  const handleAdjustScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTeamId) {
      setFeedback("Please select a target team.");
      return;
    }
    const reasonTrimmed = adjustReason.trim();
    if (reasonTrimmed.length < 3) {
      setFeedback("A mandatory reason (at least 3 characters) is required.");
      return;
    }
    const finalAmount = adjustType === "BONUS" ? Math.abs(Number(adjustAmount)) : -Math.abs(Number(adjustAmount));
    if (isNaN(finalAmount) || finalAmount === 0) {
      setFeedback("Please specify a non-zero point value.");
      return;
    }

    setLoadingAction("adjust-score");
    const res = await adjustTeamScoreAction({
      teamId: adjustTeamId,
      amount: finalAmount,
      reason: reasonTrimmed,
    });
    setLoadingAction(null);

    if (res.success) {
      setFeedback(`Score adjustment of ${finalAmount > 0 ? `+${finalAmount}` : finalAmount} pts applied successfully.`);
      setAdjustReason("");
    } else {
      setFeedback(res.error || "Failed to apply score adjustment.");
    }
  };

  // Handle delete score adjustment
  const handleDeleteAdjustment = async (id: string) => {
    setLoadingAction(`del-adj-${id}`);
    const res = await deleteScoreAdjustmentAction(id);
    setLoadingAction(null);

    if (res.success) {
      setFeedback("Score adjustment revoked.");
    } else {
      setFeedback(res.error || "Failed to revoke adjustment.");
    }
  };

  // Handle Leaderboard and System feature display toggle
  const handleToggleDisplay = async (
    field: "showQuestionsSolved" | "showPointHistory" | "hideTeamNames" | "supportFeatureEnabled",
    value: boolean
  ) => {
    setLoadingAction(`toggle-${field}`);
    const res = await updateLeaderboardDisplaySettingsAction({ [field]: value });
    setLoadingAction(null);

    if (res.success) {
      if (field === "showQuestionsSolved") setShowQuestionsSolved(value);
      if (field === "showPointHistory") setShowPointHistory(value);
      if (field === "hideTeamNames") setHideTeamNames(value);
      if (field === "supportFeatureEnabled") setSupportFeatureEnabled(value);
      setFeedback(`Setting updated: ${field} is now ${value ? "enabled" : "disabled"}.`);
    } else {
      setFeedback(res.error || "Failed to update setting.");
    }
  };

  // Handle Save Hint for Puzzle
  const handleSaveHint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hintModalPuzzle) return;
    const contentTrimmed = newHintContent.trim();
    if (!contentTrimmed) {
      setFeedback("Please enter the hint content.");
      return;
    }

    setLoadingAction("save-hint");
    const targetPuzzleId = hintModalPuzzle.id;
    const res = await upsertHintAction({
      puzzleId: targetPuzzleId,
      content: contentTrimmed,
      penaltyPoints: Math.max(0, Number(newHintPenalty)),
      unlockDelayMinutes: Math.max(0, Number(newHintDelay)),
    });
    setLoadingAction(null);

    if (res.success && res.hints) {
      const updatedHints = res.hints;

      setLocalPuzzles((prev) =>
        prev.map((p) =>
          p.id === targetPuzzleId ? { ...p, hints: updatedHints } : p
        )
      );

      setHintModalPuzzle((prev) =>
        prev && prev.id === targetPuzzleId ? { ...prev, hints: updatedHints } : prev
      );

      const orderMsg = res.hint ? `Hint #${res.hint.orderIndex}` : "Hint";
      setFeedback(`${orderMsg} deployed to "${hintModalPuzzle.title}".`);
      setNewHintContent("");
    } else {
      setFeedback(res.error || "Failed to add hint.");
    }
  };

  // Handle Delete Hint
  const handleDeleteHint = async (puzzleId: string, hintId: string, force = false) => {
    setLoadingAction(`delete-hint-${hintId}`);
    const res = await deleteHintAction(hintId, { force });
    setLoadingAction(null);

    if (res.success && res.hints) {
      setFeedback("Hint removed successfully.");
      const updatedHints = res.hints;

      setLocalPuzzles((prev) =>
        prev.map((p) => (p.id === puzzleId ? { ...p, hints: updatedHints } : p))
      );

      setHintModalPuzzle((prev) =>
        prev && prev.id === puzzleId ? { ...prev, hints: updatedHints } : prev
      );
    } else {
      // If error is a safety guard warning about unlocked teams, offer confirmation to force delete
      if (res.error?.includes("team(s) have unlocked this hint") && !force) {
        if (
          window.confirm(
            res.error + "\n\nDo you want to FORCE delete this hint anyway? This will wipe the deduction from affected teams."
          )
        ) {
          await handleDeleteHint(puzzleId, hintId, true);
          return;
        }
      }
      setFeedback(res.error || "Failed to delete hint.");
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
      setFeedback("Lockout settings saved.");
    } else {
      setFeedback(res.error || "Failed to save lockout settings.");
    }
  };

  return (
    <div className="space-y-6 font-mono text-white">
      {/* Top Header */}
      <div className="relative border border-white/10 bg-black/80 p-6 backdrop-blur-md">
        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white/60" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white/60" />
        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white/60" />
        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white/60" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-white/60">
              <Shield className="h-4 w-4 text-white/70" />
              <span>Organizer Dashboard</span>
              <span>•</span>
              <span>IIIT Lucknow</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black italic -skew-x-12 tracking-tight text-white uppercase">
              Organizer Dashboard
            </h1>
            <p className="text-xs text-white/60 tracking-wider">
              Event Controls • Teams • Puzzles • Support
            </p>
          </div>

          <div className="flex items-center space-x-2 border border-white/20 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-wider">
            <span className="h-2 w-2 bg-emerald-400 animate-pulse" />
            <span>Status: {currentState}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        {([
          { id: "STATE", label: "Status & Broadcast", icon: Radio },
          { id: "SUBMISSIONS", label: `Submissions${subsPage ? ` (${subsPage.globalTotal})` : ""}`, icon: ListFilter },
          { id: "POINTS", label: `Points & Display (${scoreAdjustments.length})`, icon: Sliders },
          { id: "LOCKOUTS", label: `Lockouts (${activeLockouts.length})`, icon: Lock },
          { id: "PUZZLES", label: `Puzzles (${puzzles.length})`, icon: Terminal },
          { id: "TICKETS", label: `Support (${tickets.filter((t) => t.status === "OPEN").length})`, icon: MessageSquare },
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
              className={`flex items-center space-x-2 px-4 py-2 text-xs uppercase tracking-wider border transition ${
                isActive
                  ? "border-white bg-white text-black font-bold"
                  : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className="border border-white/30 bg-white/5 p-3.5 text-xs uppercase tracking-wider flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="hover:text-white/60 p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* TAB 1: STATE & BROADCAST */}
      {activeTab === "STATE" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Competition State Controls */}
          <div className="relative border border-white/10 bg-black/70 p-6 space-y-4">
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white/60" />
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white/60" />

            <div>
              <span className="text-[10px] uppercase tracking-widest text-white/40">Competition Lifecycle</span>
              <h2 className="text-lg font-bold uppercase tracking-wider text-white mt-0.5">
                Competition State
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {([
                { id: "UPCOMING", label: "UPCOMING", desc: "Puzzles locked; team registration open" },
                { id: "LIVE", label: "LIVE", desc: "Hunt active and open for submissions" },
                { id: "FROZEN", label: "FROZEN", desc: "Leaderboard frozen; submissions still open" },
                { id: "ENDED", label: "ENDED", desc: "Competition concluded; standings final" },
              ] as const).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={loadingAction !== null}
                  onClick={() => handleStateChange(s.id)}
                  className={`p-4 border text-left transition ${
                    currentState === s.id
                      ? "border-white bg-white text-black font-bold"
                      : "border-white/10 bg-black text-white/60 hover:border-white/30 hover:text-white"
                  }`}
                >
                  <div className="text-xs uppercase tracking-widest font-bold">{s.label}</div>
                  <div className={`text-[10px] tracking-wide mt-1 ${currentState === s.id ? "text-black/70" : "text-white/40"}`}>
                    {s.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Announcements & Broadcast Notices Manager */}
          <div className="relative border border-white/10 bg-black/70 p-6 space-y-6 lg:col-span-2">
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-amber-400/80" />
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-amber-400/80" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold flex items-center space-x-1.5">
                  <Megaphone className="h-3.5 w-3.5" />
                  <span>Announcements System</span>
                </span>
                <h2 className="text-lg font-bold uppercase tracking-wider text-white mt-0.5">
                  Live Notices & Broadcasts
                </h2>
              </div>

              {/* Current default — updates to the last value used at publish time */}
              <div className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-amber-400" />
                <span>Default expiry: {newAnnouncementDays} day{newAnnouncementDays === 1 ? "" : "s"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Create New Announcement */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold block">
                  Publish Announcement
                </span>
                <form onSubmit={handleCreateAnnouncement} className="space-y-3">
                  <textarea
                    rows={4}
                    value={newAnnouncementText}
                    onChange={(e) => setNewAnnouncementText(e.target.value)}
                    placeholder="Enter announcement text for teams (e.g., Hint 2 released for Puzzle #3)..."
                    required
                    className="w-full bg-black border border-white/20 p-3 text-xs text-white focus:outline-none focus:border-white transition placeholder:text-white/20 font-mono"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/50">
                        Self-Delete After:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={newAnnouncementDays}
                        onChange={(e) =>
                          setNewAnnouncementDays(Math.max(1, Number(e.target.value)))
                        }
                        className="w-16 bg-black border border-white/20 p-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-white"
                      />
                      <span className="text-[10px] text-white/40">days</span>
                    </div>

                    <button
                      type="submit"
                      disabled={loadingAction === "create-announcement" || !newAnnouncementText.trim()}
                      className="px-4 py-2 border border-white bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-white/80 transition flex items-center justify-center space-x-1.5"
                    >
                      <Megaphone className="h-3.5 w-3.5" />
                      <span>
                        {loadingAction === "create-announcement" ? "Publishing..." : "Publish"}
                      </span>
                    </button>
                  </div>
                  <div className="text-[10px] text-white/40 leading-relaxed">
                    Note: Newly added announcements stack on top. The last-used expiry becomes the default.
                  </div>
                </form>
              </div>

              {/* Right: Stacked Announcements Feed with Delete */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">
                    Active Announcements Stack ({localAnnouncements.length})
                  </span>
                  <span className="text-[10px] text-white/40 tracking-wider">
                    Newest on Top
                  </span>
                </div>

                {localAnnouncements.length === 0 ? (
                  <div className="p-8 border border-white/10 bg-white/[0.02] text-center space-y-1 text-xs text-white/40">
                    <Radio className="h-5 w-5 mx-auto text-white/20" />
                    <div>No active announcements published.</div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {localAnnouncements.map((a) => (
                      <div
                        key={a.id}
                        className="relative border border-white/15 bg-black p-3.5 space-y-2 hover:border-white/30 transition font-mono"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center space-x-2">
                            <span className="px-1.5 py-0.5 bg-amber-400 text-black font-bold uppercase tracking-widest">
                              LIVE
                            </span>
                            <span className="text-white/40">
                              {new Date(a.createdAt).toLocaleDateString()} at{" "}
                              {new Date(a.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={loadingAction === `delete-announcement-${a.id}`}
                            onClick={() => handleDeleteAnnouncement(a.id)}
                            className="text-white/40 hover:text-rose-400 p-1 transition flex items-center space-x-1"
                            title="Delete announcement"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="text-[9px] uppercase">Delete</span>
                          </button>
                        </div>

                        <p className="text-xs text-white/90 whitespace-pre-wrap leading-relaxed">
                          {a.message}
                        </p>

                        <div className="text-[9px] text-white/40 flex items-center justify-between pt-1 border-t border-white/5">
                          <span>
                            Retention: {a.retentionDays} {a.retentionDays === 1 ? "day" : "days"}
                          </span>
                          <span>
                            Self-deletes: {new Date(a.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lockout Settings Panel */}
          <div className="relative border border-white/10 bg-black/70 p-6 space-y-4 lg:col-span-2">
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-rose-500/60" />
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-rose-500/60" />
            <div>
              <span className="text-[10px] uppercase tracking-widest text-rose-400 font-bold">Anti-Brute-Force</span>
              <h2 className="text-lg font-bold uppercase tracking-wider text-white mt-0.5">Lockout Configuration</h2>
              <p className="text-xs text-white/50 tracking-wider mt-1">
                X wrong attempts within Y minutes triggers a Z-minute lockout.
              </p>
            </div>
            <form onSubmit={handleSaveLockoutSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">Max Wrong Attempts (X)</label>
                  <input type="number" min={1} max={50} value={lockoutMaxAttempts}
                    onChange={(e) => setLockoutMaxAttempts(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-black border border-white/20 p-2.5 text-xs text-white focus:outline-none focus:border-rose-400 font-mono"
                  />
                  <div className="text-[10px] text-white/30 mt-1">Wrong attempts before lockout triggers</div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">Counting Window — Y mins</label>
                  <input type="number" min={1} max={60} value={lockoutWindowMinutes}
                    onChange={(e) => setLockoutWindowMinutes(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-black border border-white/20 p-2.5 text-xs text-white focus:outline-none focus:border-rose-400 font-mono"
                  />
                  <div className="text-[10px] text-white/30 mt-1">Sliding window for attempt counting</div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">Lockout Duration — Z mins</label>
                  <input type="number" min={1} max={120} value={lockoutDurationMinutes}
                    onChange={(e) => setLockoutDurationMinutes(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-black border border-white/20 p-2.5 text-xs text-white focus:outline-none focus:border-rose-400 font-mono"
                  />
                  <div className="text-[10px] text-white/30 mt-1">How long team is blocked after lockout</div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-white/40 font-mono">
                  Rule:{" "}
                  <span className="text-rose-400 font-bold">{lockoutMaxAttempts}x wrong</span>
                  {" "}in{" "}
                  <span className="text-amber-400 font-bold">{lockoutWindowMinutes}m</span>
                  {" "}→ locked for{" "}
                  <span className="text-rose-400 font-bold">{lockoutDurationMinutes}m</span>
                </div>
                <button type="submit" disabled={loadingAction === "lockout-settings"}
                  className="px-5 py-2.5 border border-rose-400 bg-rose-400 text-black uppercase tracking-widest text-xs font-black hover:bg-rose-300 transition"
                >
                  {loadingAction === "lockout-settings" ? "Saving..." : "Save Lockout Rules"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* TAB: SUBMISSIONS — server-paginated (50/page) with DB-level global search */}
      {activeTab === "SUBMISSIONS" && (
        <div className="space-y-6">
          {/* KPI Cards (computed over the full dataset server-side) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Submissions", value: subsPage ? subsPage.globalTotal : "…", color: "text-white" },
              { label: "Correct Solves", value: subsPage ? subsPage.globalCorrect : "…", color: "text-emerald-400" },
              {
                label: "Incorrect Attempts",
                value: subsPage ? subsPage.globalTotal - subsPage.globalCorrect : "…",
                color: "text-rose-400",
              },
              {
                label: "Solve Rate",
                value: subsPage
                  ? `${subsPage.globalTotal > 0 ? Math.round((subsPage.globalCorrect / subsPage.globalTotal) * 100) : 0}%`
                  : "…",
                color: "text-amber-400",
              },
            ].map((kpi) => (
              <div key={kpi.label} className="relative border border-white/10 bg-black/70 p-4">
                <div className="absolute -top-1 -left-1 w-1.5 h-1.5 border-t-2 border-l-2 border-white/40" />
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 border-t-2 border-r-2 border-white/40" />
                <div className={`text-2xl font-black font-mono ${kpi.color}`}>{kpi.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Filters — applied at the database level */}
          <div className="relative border border-white/10 bg-black/70 p-4">
            <div className="absolute -top-1 -left-1 w-1.5 h-1.5 border-t-2 border-l-2 border-white/40" />
            <div className="absolute -top-1 -right-1 w-1.5 h-1.5 border-t-2 border-r-2 border-white/40" />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Team filter */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Team</label>
                <SearchableSelect
                  value={subFilterTeam === "ALL" ? "" : subFilterTeam}
                  onChange={(v) => setSubFilterTeam(v || "ALL")}
                  options={teams.map((t) => ({ value: t.id, label: t.name }))}
                  placeholder="All Teams"
                />
              </div>
              {/* Puzzle filter */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Puzzle</label>
                <SearchableSelect
                  value={subFilterPuzzle === "ALL" ? "" : subFilterPuzzle}
                  onChange={(v) => setSubFilterPuzzle(v || "ALL")}
                  options={puzzles.map((p) => ({ value: p.id, label: `#${p.orderIndex} ${p.title}` }))}
                  placeholder="All Puzzles"
                />
              </div>
              {/* Status filter */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Status</label>
                <div className="flex border border-white/20 divide-x divide-white/20">
                  {(["ALL", "CORRECT", "INCORRECT"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubFilterStatus(s)}
                      className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider font-bold transition ${
                        subFilterStatus === s ? "bg-white text-black" : "text-white/40 hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {/* Search — global across attempt text, team name, puzzle title */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Search (Global)</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30" />
                  <input
                    type="text"
                    placeholder="e.g. fibonacci"
                    value={subSearchQuery}
                    onChange={(e) => setSubSearchQuery(e.target.value)}
                    className="w-full bg-black border border-white/20 pl-6 pr-2 py-2 text-xs text-white focus:outline-none focus:border-white placeholder:text-white/20"
                  />
                </div>
              </div>
            </div>
            <div className="text-[10px] text-white/30 tracking-wider mt-2">
              Search &amp; filters run server-side across the full dataset • 50 rows per page
            </div>
          </div>

          {/* Table */}
          <div className="relative border border-white/10 bg-black/70 p-6 space-y-3">
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white/60" />
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white/60" />
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-white/40">Live Feed</span>
                <h2 className="text-lg font-bold uppercase tracking-wider text-white mt-0.5">
                  Submissions ({subsPage ? subsPage.total : "…"})
                </h2>
              </div>
              {(subFilterTeam !== "ALL" || subFilterPuzzle !== "ALL" || subFilterStatus !== "ALL" || subSearchQuery) && (
                <button
                  type="button"
                  onClick={() => { setSubFilterTeam("ALL"); setSubFilterPuzzle("ALL"); setSubFilterStatus("ALL"); setSubSearchQuery(""); }}
                  className="text-[10px] uppercase tracking-wider text-white/40 hover:text-white border border-white/10 px-2 py-1 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {subsLoading ? (
              <div className="p-8 text-center text-xs text-white/40 uppercase tracking-wider animate-pulse">
                Loading submissions…
              </div>
            ) : !subsPage || subsPage.rows.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/30 uppercase tracking-wider">
                No submissions match the selected filters.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] text-white/40 uppercase tracking-widest">
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Team</th>
                        <th className="py-2.5 px-3">Puzzle</th>
                        <th className="py-2.5 px-3">Attempt</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {subsPage.rows.map((s) => (
                        <tr key={s.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3 px-3 text-white/40 text-[11px] font-mono whitespace-nowrap">
                            {new Date(s.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </td>
                          <td className="py-3 px-3 font-bold text-white uppercase tracking-wider">
                            {s.team?.name ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const teamName = s.team?.name;
                                  if (!teamName) return;
                                  const found = teams.find((t) => t.name === teamName);
                                  setSelectedRosterTeam(found || { name: teamName, members: [] });
                                }}
                                className="hover:text-amber-400 transition text-left cursor-pointer flex items-center space-x-1.5 group"
                                title="Click to inspect team roster"
                              >
                                <span>{s.team?.name}</span>
                                <span className="text-[8px] px-1 py-0.2 border border-white/10 text-white/40 group-hover:border-amber-400/40 group-hover:text-amber-300 uppercase tracking-widest font-normal transition">
                                  roster
                                </span>
                                {s.team?.batchTier && (
                                  <span className="ml-1 text-[9px] text-white/40 border border-white/20 px-1.5 py-0.5 normal-case font-normal">
                                    {s.team.batchTier}
                                  </span>
                                )}
                              </button>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-3 px-3 text-white/70">
                            #{s.puzzle?.orderIndex} {s.puzzle?.title}
                          </td>
                          <td className="py-3 px-3 font-mono text-white/80 max-w-xs truncate">
                            {s.attemptText}
                          </td>
                          <td className="py-3 px-3">
                            {s.isCorrect ? (
                              <span className="flex items-center space-x-1 text-emerald-400 font-bold text-[10px] uppercase tracking-widest">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Correct</span>
                              </span>
                            ) : (
                              <span className="text-rose-400 font-bold text-[10px] uppercase tracking-widest">✗ Wrong</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            {s.isCorrect ? (
                              <span className="text-emerald-400">+{s.pointsAwarded}</span>
                            ) : (
                              <span className="text-white/30">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[10px] uppercase tracking-wider text-white/40">
                  <span>
                    Page {subsPage.page} of {subsPage.totalPages} • {subsPage.total}{" "}
                    {subsPage.total === 1 ? "match" : "matches"}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={subsPage.page <= 1}
                      onClick={() => loadSubsPage(subsPage.page - 1)}
                      className="px-3 py-1.5 border border-white/20 hover:border-white hover:text-white transition disabled:opacity-30 disabled:hover:border-white/20"
                    >
                      ← Prev
                    </button>
                    <button
                      type="button"
                      disabled={subsPage.page >= subsPage.totalPages}
                      onClick={() => loadSubsPage(subsPage.page + 1)}
                      className="px-3 py-1.5 border border-white/20 hover:border-white hover:text-white transition disabled:opacity-30 disabled:hover:border-white/20"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB: SCORE ADJUSTMENTS & LEADERBOARD DISPLAY SETTINGS */}
      {activeTab === "POINTS" && (
        <div className="space-y-6">
          {/* Leaderboard Visibility Toggles */}
          <div className="relative border border-white/10 bg-black/70 p-6 space-y-4">
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white/60" />
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white/60" />

            <div>
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Visibility Governance</span>
              <h2 className="text-lg font-bold uppercase tracking-wider text-white mt-0.5">
                Leaderboard Public Display Settings
              </h2>
              <p className="text-xs text-white/50 tracking-wider mt-1">
                Configure what information is visible to other teams and spectators on the live leaderboard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Toggle 1: Questions Solved */}
              <div className="border border-white/15 bg-white/[0.02] p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Questions Solved Count
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 uppercase tracking-widest font-bold border ${showQuestionsSolved ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/20" : "border-white/20 text-white/40"}`}>
                      {showQuestionsSolved ? "ENABLED" : "HIDDEN"}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">
                    Displays the &quot;SOLVED&quot; count column on the public standings table.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loadingAction === "toggle-showQuestionsSolved"}
                  onClick={() => handleToggleDisplay("showQuestionsSolved", !showQuestionsSolved)}
                  className={`w-full py-2 border text-xs uppercase tracking-wider font-bold transition ${
                    showQuestionsSolved
                      ? "border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-black"
                      : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                  }`}
                >
                  {showQuestionsSolved ? "Hide Solved Column" : "Show Solved Column"}
                </button>
              </div>

              {/* Toggle 2: Point History Breakdown */}
              <div className="border border-white/15 bg-white/[0.02] p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Public Score Breakdown
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 uppercase tracking-widest font-bold border ${showPointHistory ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/20" : "border-white/20 text-white/40"}`}>
                      {showPointHistory ? "ENABLED" : "HIDDEN"}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">
                    Allows other teams to inspect where a team gained or lost points (solves, hints, adjustments).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loadingAction === "toggle-showPointHistory"}
                  onClick={() => handleToggleDisplay("showPointHistory", !showPointHistory)}
                  className={`w-full py-2 border text-xs uppercase tracking-wider font-bold transition ${
                    showPointHistory
                      ? "border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-black"
                      : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                  }`}
                >
                  {showPointHistory ? "Hide Breakdown Option" : "Allow Public Breakdown"}
                </button>
              </div>

              {/* Toggle 3: Leaderboard Team Names Anonymity */}
              <div className="border border-white/15 bg-white/[0.02] p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Leaderboard Team Names
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 uppercase tracking-widest font-bold border ${hideTeamNames ? "border-amber-500/40 text-amber-400 bg-amber-950/20" : "border-emerald-500/40 text-emerald-400 bg-emerald-950/20"}`}>
                      {hideTeamNames ? "MASKED" : "VISIBLE"}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">
                    Hides squad names and member details on participant leaderboards (&apos;Team #01&apos;, &apos;Team #02&apos; with points only). Admins still see real names.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loadingAction === "toggle-hideTeamNames"}
                  onClick={() => handleToggleDisplay("hideTeamNames", !hideTeamNames)}
                  className={`w-full py-2 border text-xs uppercase tracking-wider font-bold transition ${
                    hideTeamNames
                      ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                      : "border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black"
                  }`}
                >
                  {hideTeamNames ? "Reveal Real Team Names" : "Hide Team Names"}
                </button>
              </div>

              {/* Toggle 4: Support Feature Desk */}
              <div className="border border-white/15 bg-white/[0.02] p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Support Desk Feature
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 uppercase tracking-widest font-bold border ${
                        supportFeatureEnabled
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/20"
                          : "border-rose-500/40 text-rose-400 bg-rose-950/20"
                      }`}
                    >
                      {supportFeatureEnabled ? "ONLINE" : "DISABLED"}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">
                    Enables or disables participant in-app support ticket submission on the hunt page.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loadingAction === "toggle-supportFeatureEnabled"}
                  onClick={() => handleToggleDisplay("supportFeatureEnabled", !supportFeatureEnabled)}
                  className={`w-full py-2 border text-xs uppercase tracking-wider font-bold transition ${
                    supportFeatureEnabled
                      ? "border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-black"
                      : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                  }`}
                >
                  {supportFeatureEnabled ? "Turn Off Support" : "Turn On Support"}
                </button>
              </div>
            </div>
          </div>

          {/* Organizer Score Adjustment Form */}
          <div className="relative border border-white/10 bg-black/70 p-6 space-y-4">
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-amber-400" />
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-amber-400" />

            <div>
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Manual Score Adjustment</span>
              <h2 className="text-lg font-bold uppercase tracking-wider text-white mt-0.5">
                Award Bonus or Impose Penalty
              </h2>
              <p className="text-xs text-white/50 tracking-wider mt-1">
                Directly add bonus points or deduct penalties from any squad with a mandatory transparency reason.
              </p>
            </div>

            <form onSubmit={handleAdjustScore} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Team Selection */}
                <div className="relative">
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">
                    Target Squad *
                  </label>
                  {adjustTeamId && !isTeamDropdownOpen ? (
                    <div className="flex items-center justify-between w-full bg-black border border-amber-400/60 p-2.5 text-xs text-white">
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
                          className="text-[9px] px-2 py-0.5 border border-amber-400/40 text-amber-400 bg-amber-950/20 hover:bg-amber-400 hover:text-black uppercase tracking-wider transition shrink-0"
                        >
                          Inspect Roster
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setAdjustTeamId(""); setTeamSearchQuery(""); setIsTeamDropdownOpen(true); }}
                        className="text-white/40 hover:text-white ml-2 uppercase text-[10px] tracking-wider shrink-0"
                      >
                        change
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search team..."
                        value={teamSearchQuery}
                        onChange={(e) => { setTeamSearchQuery(e.target.value); setIsTeamDropdownOpen(true); }}
                        onFocus={() => setIsTeamDropdownOpen(true)}
                        className="w-full bg-black border border-white/20 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-white/20 uppercase"
                      />
                      {isTeamDropdownOpen && (
                        <div className="absolute z-20 mt-0.5 w-full border border-white/20 bg-black max-h-48 overflow-y-auto divide-y divide-white/5">
                          {teams
                            .filter((t) => t.name.toLowerCase().includes(teamSearchQuery.toLowerCase()))
                            .map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => { setAdjustTeamId(t.id); setIsTeamDropdownOpen(false); setTeamSearchQuery(""); }}
                                className="w-full text-left px-3 py-2 text-xs text-white hover:bg-amber-400/10 hover:text-amber-300 uppercase tracking-wider transition"
                              >
                                {t.name}
                              </button>
                            ))}
                          {teams.filter((t) => t.name.toLowerCase().includes(teamSearchQuery.toLowerCase())).length === 0 && (
                            <div className="px-3 py-2 text-xs text-white/30 uppercase tracking-wider">No teams found</div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Adjustment Mode Toggle */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">
                    Adjustment Type *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAdjustType("BONUS")}
                      className={`py-2 text-xs uppercase tracking-wider font-bold border transition ${
                        adjustType === "BONUS"
                          ? "border-emerald-500 bg-emerald-950/40 text-emerald-300"
                          : "border-white/15 text-white/50 hover:border-white/30"
                      }`}
                    >
                      + Bonus
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType("PENALTY")}
                      className={`py-2 text-xs uppercase tracking-wider font-bold border transition ${
                        adjustType === "PENALTY"
                          ? "border-rose-500 bg-rose-950/40 text-rose-300"
                          : "border-white/15 text-white/50 hover:border-white/30"
                      }`}
                    >
                      - Penalty
                    </button>
                  </div>
                </div>

                {/* Points Amount */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">
                    Points Amount *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-black border border-white/20 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              {/* Mandatory Reason */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                    Mandatory Reason / Justification *
                  </label>
                  <span className="text-[10px] text-white/40">
                    Visible to team and on public breakdown
                  </span>
                </div>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g., Solved first blood riddle before countdown, or Code plagiarism violation"
                  className="w-full bg-black border border-white/20 p-3 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-white/20"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-white/40 font-mono">
                  Net Impact:{" "}
                  <span className={adjustType === "BONUS" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    {adjustType === "BONUS" ? `+${adjustAmount}` : `-${adjustAmount}`} points
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loadingAction === "adjust-score"}
                  className="px-6 py-2.5 border border-amber-400 bg-amber-400 text-black uppercase tracking-widest text-xs font-black hover:bg-amber-300 transition"
                >
                  {loadingAction === "adjust-score" ? "Executing..." : "Apply Score Adjustment"}
                </button>
              </div>
            </form>
          </div>

          {/* Adjustment Audit Log */}
          <div className="relative border border-white/10 bg-black/70 p-6 space-y-4">
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white/60" />
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white/60" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-white/40">Audit Trail</span>
                <h2 className="text-lg font-bold uppercase tracking-wider text-white mt-0.5">
                  Score Adjustments Log ({scoreAdjustments.length})
                </h2>
              </div>
            </div>

            {scoreAdjustments.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/30 uppercase tracking-wider">
                No manual score adjustments recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-black text-[10px] text-white/40 uppercase tracking-widest">
                      <th className="py-2.5 px-3">Team</th>
                      <th className="py-2.5 px-3">Adjustment</th>
                      <th className="py-2.5 px-3">Reason</th>
                      <th className="py-2.5 px-3">Organizer</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {scoreAdjustments.map((adj) => {
                      const isBonus = adj.amount > 0;
                      return (
                        <tr key={adj.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3 px-3 font-bold text-white uppercase tracking-wider">
                            <button
                              type="button"
                              onClick={() => {
                                const found = teams.find((t) => t.id === adj.teamId || t.name === (adj.team?.name || teamNameMap[adj.teamId]));
                                setSelectedRosterTeam(found || { name: adj.team?.name || teamNameMap[adj.teamId] || adj.teamId, members: [] });
                              }}
                              className="hover:text-amber-400 transition text-left cursor-pointer flex items-center space-x-1.5 group"
                              title="Click to view squad members"
                            >
                              <span>{adj.team?.name || teamNameMap[adj.teamId] || adj.teamId}</span>
                              <span className="text-[8px] px-1 py-0.2 border border-white/10 text-white/40 group-hover:border-amber-400/40 group-hover:text-amber-300 uppercase tracking-widest font-normal transition">
                                roster
                              </span>
                            </button>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 text-[10px] border ${
                                isBonus
                                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/20"
                                  : "border-rose-500/40 text-rose-400 bg-rose-950/20"
                              }`}
                            >
                              {isBonus ? `+${adj.amount}` : adj.amount} pts
                            </span>
                          </td>
                          <td className="py-3 px-3 text-white/80 max-w-xs truncate">
                            {adj.reason}
                          </td>
                          <td className="py-3 px-3 text-white/50 text-[11px]">
                            {adj.createdBy?.name || "Organizer"}
                          </td>
                          <td className="py-3 px-3 text-white/40 text-[11px]">
                            {new Date(adj.createdAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              disabled={loadingAction === `del-adj-${adj.id}`}
                              onClick={() => handleDeleteAdjustment(adj.id)}
                              className="px-2 py-1 text-[10px] uppercase tracking-wider border border-white/10 hover:border-rose-500 hover:text-rose-400 text-white/40 transition"
                            >
                              [ REVOKE ]
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Registered Squads Directory */}
          <div className="relative border border-white/10 bg-black/70 p-6 space-y-4">
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-amber-400/60" />
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-amber-400/60" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Admin Squad Telemetry</span>
                <h2 className="text-lg font-bold uppercase tracking-wider text-white mt-0.5">
                  Registered Squads ({teams.length})
                </h2>
              </div>
              <span className="text-[11px] text-white/40">
                Click any squad to inspect full student roster
              </span>
            </div>

            {teams.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/30 uppercase tracking-wider">
                No teams registered yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedRosterTeam(t)}
                    className="text-left border border-white/10 bg-white/[0.02] hover:border-amber-400/60 hover:bg-amber-400/[0.05] p-3 transition group flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-white text-xs uppercase tracking-wider group-hover:text-amber-400 transition">
                        {t.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 border border-white/20 text-white/60 uppercase">
                        {t.isFirstYear ? "1st Year" : "Senior"}
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] text-white/50 flex items-center justify-between">
                      <span>{t.members?.length ?? 0} Members</span>
                      <span className="text-amber-400 group-hover:underline text-[9px] uppercase tracking-wider">
                        Inspect Roster →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE LOCKOUTS MONITOR */}
      {activeTab === "LOCKOUTS" && (
        <div className="relative border border-white/10 bg-black/70 p-6 space-y-4">
          <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white/60" />
          <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white/60" />

          <div>
            <span className="text-[10px] uppercase tracking-widest text-white/40">Rate Limiting</span>
            <h2 className="text-lg font-bold uppercase tracking-wider text-white mt-0.5">
              Active Team Lockouts ({activeLockouts.length})
            </h2>
            <p className="text-xs text-white/50 tracking-wider mt-1">
              Teams temporarily locked out due to repeated incorrect attempts. Manual unlock available.
            </p>
          </div>

          {activeLockouts.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/30 uppercase tracking-wider">
              No active team lockouts
            </div>
          ) : (
            <div className="divide-y divide-white/5 text-xs">
              {activeLockouts.map((lockout) => (
                <div key={`${lockout.teamId}-${lockout.puzzleId}`} className="py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        const found = teams.find((t) => t.id === lockout.teamId || t.name === (teamNameMap[lockout.teamId] || lockout.teamId));
                        setSelectedRosterTeam(found || { name: teamNameMap[lockout.teamId] || lockout.teamId, members: [] });
                      }}
                      className="font-bold text-white uppercase tracking-wider hover:text-amber-400 transition text-left cursor-pointer flex items-center space-x-1.5 group"
                      title="Click to view squad members"
                    >
                      <span>{teamNameMap[lockout.teamId] || lockout.teamId}</span>
                      <span className="text-[8px] px-1 py-0.2 border border-white/10 text-white/40 group-hover:border-amber-400/40 group-hover:text-amber-300 uppercase tracking-widest font-normal transition">
                        roster
                      </span>
                    </button>
                    <div className="text-[10px] text-white/50 tracking-wider">
                      Puzzle ID: {lockout.puzzleId} •{" "}
                      <span className="text-rose-400 font-bold">{lockout.remainingSeconds}s remaining</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUnlockTeam(lockout.teamId, lockout.puzzleId)}
                    className="px-3 py-1.5 border border-white/30 hover:border-white hover:bg-white hover:text-black text-white text-xs uppercase tracking-widest transition flex items-center space-x-1.5"
                  >
                    <Unlock className="h-3 w-3" />
                    <span>Unlock Team</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PUZZLES & HINTS MANAGEMENT */}
      {activeTab === "PUZZLES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-white/60 font-bold">
              Puzzles ({puzzles.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowPuzzleModal(true)}
              className="px-3.5 py-1.5 border border-white/40 hover:border-white hover:bg-white hover:text-black text-white uppercase tracking-widest text-xs font-bold transition flex items-center space-x-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add New Puzzle</span>
            </button>
          </div>

          <div className="space-y-4">
            {localPuzzles.map((p, index) => (
              <div key={p.id} className="relative border border-white/10 bg-black/70 p-6 space-y-3 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-0.5 border border-white/20 bg-white/5 text-white text-xs font-bold uppercase tracking-wider">
                      #{p.orderIndex}
                    </span>
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider">{p.title}</h3>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-xs text-white/50 tracking-wider">
                      Points: <strong className="text-white">+{p.basePoints} pts</strong> • Submissions: {p._count?.submissions ?? 0}
                    </div>

                    {/* Order Controls (Move Up / Down) */}
                    <div className="flex items-center border border-white/20 divide-x divide-white/20">
                      <button
                        type="button"
                        disabled={loadingAction?.startsWith("swap-") || index === 0}
                        onClick={() => handleSwapOrder(p.id, "UP")}
                        className="px-2 py-1 text-xs text-white hover:bg-white hover:text-black transition disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-white"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={loadingAction?.startsWith("swap-") || index === localPuzzles.length - 1}
                        onClick={() => handleSwapOrder(p.id, "DOWN")}
                        className="px-2 py-1 text-xs text-white hover:bg-white hover:text-black transition disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-white"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(p)}
                      className="px-2.5 py-1 text-xs border border-white/30 hover:border-white hover:bg-white hover:text-black transition flex items-center space-x-1"
                      title="Edit puzzle"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs text-white/60 tracking-wider">
                  <span className="text-white/30">Media Asset:</span> {p.assetType ? `${p.assetType.toUpperCase()} • ${p.assetUrl}` : "None"}
                </div>

                <div className="text-xs text-white/60 tracking-wider">
                  <span className="text-white/30">Accepted Answers:</span>{" "}
                  <span className="text-white font-mono">{Array.isArray(p.acceptedAnswers) ? p.acceptedAnswers.join(", ") : p.acceptedAnswers}</span>
                </div>

                {/* Hints for this puzzle */}
                <div className="border-t border-white/5 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest flex items-center space-x-2">
                      <span className="font-bold text-white/70">Hints ({(p.hints || []).length})</span>
                      <span className="text-white/30">• Timed deduction clues</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setHintModalPuzzle(p);
                        setNewHintContent("");
                        setNewHintPenalty(20);
                        setNewHintDelay(15);
                      }}
                      className="px-2.5 py-1 border border-white/30 hover:border-white hover:bg-white hover:text-black text-white text-[10px] uppercase tracking-widest transition flex items-center space-x-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Hint</span>
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {(!p.hints || p.hints.length === 0) ? (
                      <div className="text-[10px] text-white/30 italic p-2 border border-dashed border-white/10">
                        No hints configured yet. Click &quot;Add Hint&quot; to configure.
                      </div>
                    ) : (
                      p.hints.map((h) => (
                        <div key={h.id} className="p-2.5 border border-white/5 bg-black text-xs flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-white/80 font-bold block">
                              Hint #{h.orderIndex}: {h.content}
                            </span>
                            <span className="text-white/40 text-[10px]">
                              Unlock Delay: {h.unlockDelayMinutes}m • Deduction: -{h.penaltyPoints} pts
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 shrink-0">
                            <span className="text-rose-400 font-bold text-xs">-{h.penaltyPoints} pts</span>
                            <button
                              type="button"
                              disabled={loadingAction === `delete-hint-${h.id}`}
                              onClick={() => handleDeleteHint(p.id, h.id)}
                              className="p-1 text-white/30 hover:text-rose-400 transition"
                              title="Delete hint"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SUPPORT DESK TICKETING */}
      {activeTab === "TICKETS" && (
        <div className="relative border border-white/10 bg-black/70 p-6 space-y-4">
          <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white/60" />
          <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white/60" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-white/40">Team Inquiries &amp; Live Desk</span>
              <h2 className="text-lg font-bold uppercase tracking-wider text-white mt-0.5">
                Support Tickets ({tickets.length})
              </h2>
            </div>

            {/* Support Desk Master Switch */}
            <div className="flex items-center space-x-3 bg-white/[0.03] border border-white/15 p-2 px-3">
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase tracking-widest text-white/50">
                  Support Desk Feature
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${
                    supportFeatureEnabled ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {supportFeatureEnabled ? "ONLINE / ACTIVE" : "OFFLINE / DISABLED"}
                </span>
              </div>
              <button
                type="button"
                disabled={loadingAction === "toggle-supportFeatureEnabled"}
                onClick={() => handleToggleDisplay("supportFeatureEnabled", !supportFeatureEnabled)}
                className={`px-3 py-1.5 border text-xs uppercase tracking-wider font-bold transition ${
                  supportFeatureEnabled
                    ? "border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-black"
                    : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                }`}
              >
                {supportFeatureEnabled ? "Turn Off Support" : "Turn On Support"}
              </button>
            </div>
          </div>

          {tickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/30 uppercase tracking-wider">
              No support tickets logged
            </div>
          ) : (
            <div className="divide-y divide-white/5 space-y-4">
              {tickets.map((t) => (
                <div key={t.id} className="pt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 border border-white/20 text-[9px] uppercase tracking-wider text-white/80">
                        {t.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const found = teams.find((team) => team.name === t.team.name);
                          setSelectedRosterTeam(found || { name: t.team.name, members: t.user ? [{ id: t.user.email, name: t.user.name, email: t.user.email }] : [] });
                        }}
                        className="font-bold text-white uppercase tracking-wider hover:text-amber-400 transition text-left cursor-pointer flex items-center space-x-1.5 group"
                        title="Click to view squad members"
                      >
                        <span>{t.team.name}</span>
                        <span className="text-[8px] px-1 py-0.2 border border-white/10 text-white/40 group-hover:border-amber-400/40 group-hover:text-amber-300 uppercase tracking-widest font-normal transition">
                          roster
                        </span>
                      </button>
                      <span className="text-white/40">on Puzzle #{t.puzzle.orderIndex}</span>
                    </div>

                    <span className={`text-[10px] uppercase tracking-widest font-bold ${t.status === "OPEN" ? "text-white" : "text-white/40"}`}>
                      {t.status}
                    </span>
                  </div>

                  <p className="text-white/70 bg-black p-3 border border-white/10 tracking-wide text-xs">
                    {t.message}
                  </p>

                  {t.adminReply ? (
                    <div className="p-2.5 border border-white/20 bg-white/[0.02] text-white/80 text-xs">
                      <strong>Admin Reply:</strong> {t.adminReply}
                    </div>
                  ) : (
                    <div className="flex items-start space-x-2 pt-1">
                      <textarea
                        rows={2}
                        placeholder="Type reply… (Enter to send, Shift+Enter for new line)"
                        value={ticketReplies[t.id] || ""}
                        onChange={(e) =>
                          setTicketReplies((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if ((ticketReplies[t.id] || "").trim()) handleReplyTicket(t.id);
                          }
                        }}
                        className="flex-1 bg-black border border-white/20 p-2 text-xs text-white tracking-wider focus:outline-none focus:border-white placeholder:text-white/20 resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleReplyTicket(t.id)}
                        className="px-3 py-2 border border-white/30 hover:border-white hover:bg-white hover:text-black text-white uppercase tracking-widest text-xs font-bold transition flex items-center space-x-1 shrink-0"
                      >
                        <Send className="h-3 w-3" />
                        <span>Reply</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deploy Puzzle Modal */}
      {showPuzzleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-4xl w-full border border-white/30 bg-black p-6 space-y-4 font-mono">
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white/80" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white/80" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white/80" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white/80" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">
                Add New Puzzle
              </h3>
              <button
                type="button"
                onClick={() => setShowPuzzleModal(false)}
                className="text-white/40 hover:text-white text-xs uppercase"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreatePuzzle} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Core Puzzle Information */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold block border-b border-white/10 pb-1">
                    1. Puzzle Details
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/50 block mb-1 uppercase tracking-wider text-[10px]">
                        Puzzle Order #
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newPuzzleOrder}
                        onChange={(e) => setNewPuzzleOrder(Number(e.target.value))}
                        required
                        className="w-full bg-black border border-white/20 p-2 text-white uppercase focus:border-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/50 block mb-1 uppercase tracking-wider text-[10px]">
                        Base Points
                      </label>
                      <input
                        type="number"
                        value={newPuzzlePoints}
                        onChange={(e) => setNewPuzzlePoints(Number(e.target.value))}
                        required
                        className="w-full bg-black border border-white/20 p-2 text-white uppercase focus:border-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-white/50 block mb-1 uppercase tracking-wider text-[10px]">
                      Puzzle Title
                    </label>
                    <input
                      type="text"
                      value={newPuzzleTitle}
                      onChange={(e) => setNewPuzzleTitle(e.target.value)}
                      placeholder="e.g. The Enigma Code"
                      required
                      className="w-full bg-black border border-white/20 p-2 text-white uppercase focus:border-white focus:outline-none placeholder:text-white/20"
                    />
                  </div>

                  <div>
                    <label className="text-white/50 block mb-1 uppercase tracking-wider text-[10px]">
                      Description / Clues (Markdown)
                    </label>
                    <textarea
                      rows={4}
                      value={newPuzzleDesc}
                      onChange={(e) => setNewPuzzleDesc(e.target.value)}
                      placeholder="Enter puzzle clues and story (do not put hints here)..."
                      required
                      className="w-full bg-black border border-white/20 p-2 text-white focus:border-white focus:outline-none placeholder:text-white/20 uppercase tracking-wide"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/50 block mb-1 uppercase tracking-wider text-[10px]">
                        Asset Type
                      </label>
                      <select
                        value={newPuzzleAssetType}
                        onChange={(e) => setNewPuzzleAssetType(e.target.value)}
                        className="w-full bg-black border border-white/20 p-2 text-white uppercase focus:border-white focus:outline-none"
                      >
                        <option value="image">Image</option>
                        <option value="audio">Audio</option>
                        <option value="pdf">PDF</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-white/50 block mb-1 uppercase tracking-wider text-[10px]">
                        Asset URL
                      </label>
                      <input
                        type="url"
                        value={newPuzzleAssetUrl}
                        onChange={(e) => setNewPuzzleAssetUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-black border border-white/20 p-2 text-white focus:border-white focus:outline-none placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-white/50 block mb-1 uppercase tracking-wider text-[10px]">
                      Accepted Answers (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newPuzzleAnswers}
                      onChange={(e) => setNewPuzzleAnswers(e.target.value)}
                      placeholder="e.g. alan turing, turing"
                      required
                      className="w-full bg-black border border-white/20 p-2 text-white uppercase focus:border-white focus:outline-none placeholder:text-white/20"
                    />
                  </div>
                </div>

                {/* Column 2: Dedicated Hints Column */}
                <div className="space-y-3 bg-white/[0.02] border border-white/10 p-3.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1">
                    <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold flex items-center space-x-1.5">
                      <span>2. Hints Column (Dedicated)</span>
                    </span>
                    <span className="text-[10px] text-white/40">
                      {stagedHints.length} {stagedHints.length === 1 ? "hint" : "hints"} staged
                    </span>
                  </div>

                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Hints are kept separate from the description so they can be unlocked with point deductions and delays.
                  </p>

                  {/* List of staged hints */}
                  {stagedHints.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {stagedHints.map((sh, idx) => (
                        <div
                          key={sh.id}
                          className="p-2 border border-white/10 bg-black text-xs flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <span className="text-white/80 font-bold block">
                              Hint #{idx + 1}: {sh.content}
                            </span>
                            <span className="text-white/40 text-[10px]">
                              Unlock Delay: {sh.unlockDelayMinutes}m • Deduction: -{sh.penaltyPoints} pts
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setStagedHints((prev) => prev.filter((item) => item.id !== sh.id))
                            }
                            className="p-1 text-white/30 hover:text-rose-400 transition"
                            title="Remove hint"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Staging input for adding a hint */}
                  <div className="border-t border-white/10 pt-3 space-y-2.5">
                    <span className="text-[10px] uppercase tracking-wider text-white/60 font-bold block">
                      + Stage a New Hint
                    </span>

                    <div>
                      <label className="text-white/40 block mb-1 text-[10px] uppercase">
                        Hint Clue Text
                      </label>
                      <textarea
                        rows={2}
                        value={stagedHintContent}
                        onChange={(e) => setStagedHintContent(e.target.value)}
                        placeholder="Enter clue text for this hint..."
                        className="w-full bg-black border border-white/20 p-2 text-white focus:border-white focus:outline-none placeholder:text-white/20 uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/40 block mb-1 text-[10px] uppercase">
                          Penalty (-pts)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={stagedHintPenalty}
                          onChange={(e) => setStagedHintPenalty(Number(e.target.value))}
                          className="w-full bg-black border border-white/20 p-1.5 text-white font-mono focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-white/40 block mb-1 text-[10px] uppercase">
                          Delay (minutes)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={stagedHintDelay}
                          onChange={(e) => setStagedHintDelay(Number(e.target.value))}
                          className="w-full bg-black border border-white/20 p-1.5 text-white font-mono focus:border-white focus:outline-none"
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
                      className="w-full py-1.5 border border-white/30 hover:border-white hover:bg-white/10 text-white text-[10px] uppercase tracking-widest font-bold transition disabled:opacity-30 flex items-center justify-center space-x-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Hint to Staging</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPuzzleModal(false)}
                  className="px-4 py-2 text-xs uppercase tracking-widest text-white/50 hover:text-white"
                >
                  [ESC]
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === "create-puzzle"}
                  className="px-4 py-2 border border-white bg-white text-black font-bold uppercase tracking-widest hover:bg-white/80 transition"
                >
                  Create Puzzle &amp; Hints
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Puzzle & Ladder Order Modal */}
      {editingPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-xl w-full border border-white/30 bg-black p-6 space-y-4">
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white/80" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white/80" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white/80" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white/80" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">
                Edit Puzzle
              </h3>
              <button
                type="button"
                onClick={() => setEditingPuzzle(null)}
                className="text-white/40 hover:text-white text-xs uppercase"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveEditPuzzle} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 block mb-1 uppercase tracking-wider text-[10px]">
                    Puzzle Order #
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editOrder}
                    onChange={(e) => setEditOrder(Number(e.target.value))}
                    required
                    className="w-full bg-black border border-white/20 p-2 text-white uppercase focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-white/50 block mb-1 uppercase tracking-wider text-[10px]">
                    Base Points
                  </label>
                  <input
                    type="number"
                    value={editPoints}
                    onChange={(e) => setEditPoints(Number(e.target.value))}
                    required
                    className="w-full bg-black border border-white/20 p-2 text-white uppercase focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/50 block mb-1 uppercase tracking-wider text-[10px]">
                  Puzzle Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full bg-black border border-white/20 p-2 text-white uppercase focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-white/50 block mb-1 uppercase tracking-wider text-[10px]">
                  Description / Clues (Markdown)
                </label>
                <textarea
                  rows={4}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  required
                  className="w-full bg-black border border-white/20 p-2 text-white focus:border-white focus:outline-none uppercase tracking-wide"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 block mb-1 uppercase tracking-wider text-[10px]">
                    Asset Type
                  </label>
                  <select
                    value={editAssetType}
                    onChange={(e) => setEditAssetType(e.target.value)}
                    className="w-full bg-black border border-white/20 p-2 text-white uppercase focus:border-white focus:outline-none"
                  >
                    <option value="image">Image</option>
                    <option value="audio">Audio</option>
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/50 block mb-1 uppercase tracking-wider text-[10px]">
                    Asset URL
                  </label>
                  <input
                    type="url"
                    value={editAssetUrl}
                    onChange={(e) => setEditAssetUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-black border border-white/20 p-2 text-white focus:border-white focus:outline-none placeholder:text-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/50 block mb-1 uppercase tracking-wider text-[10px]">
                  Accepted Answers (comma-separated)
                </label>
                <input
                  type="text"
                  value={editAnswers}
                  onChange={(e) => setEditAnswers(e.target.value)}
                  required
                  className="w-full bg-black border border-white/20 p-2 text-white uppercase focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingPuzzle(null)}
                  className="px-4 py-2 text-xs uppercase tracking-widest text-white/50 hover:text-white"
                >
                  [ESC]
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === "save-edit-puzzle"}
                  className="px-4 py-2 border border-white bg-white text-black font-bold uppercase tracking-widest hover:bg-white/80 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Hint Modal (Dedicated Hints Window) */}
      {hintModalPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-lg w-full border border-white/30 bg-black p-6 space-y-4 font-mono">
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400/80" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400/80" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400/80" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400/80" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
                  Dedicated Hints Column
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white mt-0.5">
                  Hints for #{hintModalPuzzle.orderIndex} {hintModalPuzzle.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHintModalPuzzle(null)}
                className="text-white/40 hover:text-white text-xs uppercase"
              >
                Close
              </button>
            </div>

            {/* List of existing hints */}
            {hintModalPuzzle.hints && hintModalPuzzle.hints.length > 0 && (
              <div className="space-y-2 border border-white/10 bg-white/[0.02] p-3 max-h-40 overflow-y-auto">
                <span className="text-[10px] uppercase tracking-widest text-white/50 block mb-1">
                  Active Hints ({hintModalPuzzle.hints.length})
                </span>
                {hintModalPuzzle.hints.map((h) => (
                  <div
                    key={h.id}
                    className="p-2 border border-white/5 bg-black text-xs flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <span className="text-white/80 font-bold block">
                        Hint #{h.orderIndex}: {h.content}
                      </span>
                      <span className="text-white/40 text-[10px]">
                        Available after: {h.unlockDelayMinutes}m • Deduction: -{h.penaltyPoints} pts
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={loadingAction === `delete-hint-${h.id}`}
                      onClick={() => handleDeleteHint(hintModalPuzzle.id, h.id)}
                      className="p-1 text-white/30 hover:text-rose-400 transition"
                      title="Delete hint"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Form to add a new hint */}
            <form onSubmit={handleSaveHint} className="space-y-3 text-xs">
              <div>
                <label className="text-white/60 block mb-1 uppercase tracking-wider text-[10px]">
                  Hint Content
                </label>
                <textarea
                  rows={3}
                  value={newHintContent}
                  onChange={(e) => setNewHintContent(e.target.value)}
                  placeholder="Enter hint text for teams..."
                  required
                  className="w-full bg-black border border-white/20 p-2.5 text-white focus:border-white focus:outline-none placeholder:text-white/20 uppercase tracking-wide font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 block mb-1 uppercase tracking-wider text-[10px]">
                    Penalty Deduction (pts)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newHintPenalty}
                    onChange={(e) => setNewHintPenalty(Number(e.target.value))}
                    required
                    className="w-full bg-black border border-white/20 p-2 text-white font-mono focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-white/60 block mb-1 uppercase tracking-wider text-[10px]">
                    Unlock Delay (Minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newHintDelay}
                    onChange={(e) => setNewHintDelay(Number(e.target.value))}
                    required
                    className="w-full bg-black border border-white/20 p-2 text-white font-mono focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setHintModalPuzzle(null)}
                  className="px-4 py-2 text-xs uppercase tracking-widest text-white/50 hover:text-white"
                >
                  [ESC]
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === "save-hint" || !newHintContent.trim()}
                  className="px-4 py-2 border border-white bg-white text-black font-bold uppercase tracking-widest hover:bg-white/80 transition"
                >
                  {loadingAction === "save-hint" ? "Deploying..." : "Deploy Hint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Team Members Inspection Modal */}
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
