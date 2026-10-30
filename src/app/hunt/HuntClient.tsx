"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { AnimatePresence } from "framer-motion";
import { Compass } from "@/components/icons";
import Chronometer from "@/components/landing/Chronometer";
import RealmSlideMap from "@/components/hunt/RealmSlideMap";
import dynamic from "next/dynamic";
import StoneVaultFooter from "@/components/hunt/StoneVaultFooter";
import type { LandmarkData } from "@/components/hunt/UnrollingScrollModal";
import { PuzzleData } from "@/components/hunt/PuzzleDispatch";
import { submitPuzzleAnswerAction, unlockHintAction, SubmitResult } from "./actions";
import { CAMPAIGN_REALMS } from "@/lib/hunt/realmsRegistry";
import { Sparkles, Trophy } from "lucide-react";

const UnrollingScrollModal = dynamic(
  () => import("@/components/hunt/UnrollingScrollModal"),
  { ssr: false }
);

interface HuntClientProps {
  team: { id: string; name: string; isFrozen: boolean };
  puzzles: PuzzleData[];
  activeOrderIndex?: number;
  competitionState: string;
  supportFeatureEnabled: boolean;
  hintsEnabled?: boolean;
  initialSelectedId?: string | null;
  startTime?: string | null;
  onSubmitAnswer?: (puzzleId: string, answer: string) => Promise<SubmitResult>;
}

// Landmark types assigned cyclically across expedition milestones
const LANDMARK_TYPES: LandmarkData["landmarkType"][] = [
  "haven",
  "pass",
  "canal",
  "citadel",
  "crypt",
  "caldera",
  "crypt",
  "strait",
  "pass",
  "citadel",
  "sky_reef",
  "citadel",
  "abyss",
  "abyss",
  "abyss",
];

// Safe pre-warming helper for active & newly unlocked puzzles ONLY
function prewarmAsset(url?: string | null) {
  if (!url || typeof window === "undefined") return;
  const isImage =
    (/\.(jpe?g|png|webp|gif)$/i.test(url) || url.startsWith("/api/media/evidence-")) &&
    !url.endsWith(".pdf") &&
    !url.endsWith(".mp4") &&
    !url.endsWith(".webm");
  if (isImage) {
    const img = new Image();
    img.src = url;
  }
}

export default function HuntClient({
  team,
  puzzles: initialPuzzles,
  competitionState,
  hintsEnabled = false,
  initialSelectedId = null,
  startTime,
  onSubmitAnswer: customSubmitAnswer,
}: HuntClientProps) {
  const router = useRouter();
  const [puzzles, setPuzzles] = useState<PuzzleData[]>(initialPuzzles);
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string | null>(initialSelectedId);
  const [lockoutStatus, setLockoutStatus] = useState<{ isLocked: boolean; remainingSeconds: number } | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const [prevInitialPuzzles, setPrevInitialPuzzles] = useState(initialPuzzles);
  if (prevInitialPuzzles !== initialPuzzles) {
    setPrevInitialPuzzles(initialPuzzles);
    setPuzzles(initialPuzzles);
  }

  const isLockoutActive = Boolean(lockoutStatus?.isLocked && lockoutStatus.remainingSeconds > 0);

  useEffect(() => {
    if (!isLockoutActive) return;

    const timer = setInterval(() => {
      setLockoutStatus((prev) => {
        if (!prev) return null;
        if (prev.remainingSeconds <= 1) return null;
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLockoutActive]);

  const isAllCleared = puzzles.length > 0 && puzzles.every((p) => p.isSolved);
  const activePuzzle = puzzles.find((p) => p.isActive) || null;
  const activePuzzleAssetUrl = activePuzzle?.assets?.[0]?.url || activePuzzle?.assetUrl;

  // Progressive Pre-warming: Safely warm ONLY the active puzzle's primary asset in background.
  // Locked future puzzles have assets: [] and are never preloaded.
  useEffect(() => {
    if (activePuzzleAssetUrl) {
      prewarmAsset(activePuzzleAssetUrl);
    }
  }, [activePuzzleAssetUrl]);

  // Calculate team score from solved puzzles minus hint penalties
  const bountyPoints = puzzles.reduce((acc, p) => {
    if (!p.isSolved) return acc;
    const hintsPenalty = p.hints
      .filter((h) => h.isUnlocked)
      .reduce((sum, h) => sum + h.penaltyPoints, 0);
    return acc + Math.max(0, p.basePoints - hintsPenalty);
  }, 0);

  // Map real database puzzles to landmark presentation format
  const landmarks: LandmarkData[] = puzzles.map((p, idx) => {
    const match = p.id.match(/^realm-(\d+)-stage-(\d+)/);
    const realmId = p.realmId ?? (match ? parseInt(match[1], 10) : 1);
    const realmOrderIndex =
      p.realmOrderIndex ?? (match ? parseInt(match[2], 10) : p.orderIndex);
    const foundRealm = CAMPAIGN_REALMS.find((r) => r.id === realmId);
    return {
      id: p.id,
      orderIndex: p.orderIndex,
      realmId,
      realmOrderIndex,
      waypointKey: p.waypointKey,
      landmarkName: p.landmarkName || `Waypoint #${p.orderIndex}`,
      landmarkType: (LANDMARK_TYPES[idx % LANDMARK_TYPES.length] || "haven") as LandmarkData["landmarkType"],
      region: foundRealm
        ? `${foundRealm.title.split(":")[0]?.trim()} • ${foundRealm.subtitle.split("&")[0]?.trim()}`
        : "Uncharted Waters",
      title: p.title,
      description: p.description,
      bountyPoints: p.basePoints,
      isSolved: p.isSolved,
      isActive: p.isActive,
      isLocked: p.isLocked,
      assetUrl: p.assetUrl,
      assetType: p.assetType,
      assets: p.assets,
      hints: p.hints.map((h) => ({
        id: h.id,
        orderIndex: h.orderIndex,
        penalty: h.penaltyPoints,
        isUnlocked: h.isUnlocked,
        content: h.content,
      })),
    };
  });

  const selectedLandmark = landmarks.find((l) => l.id === selectedPuzzleId) || null;

  // Compute selected landmark's realm (1 to 7) dynamically
  const selectedRealmId = selectedLandmark?.realmId ?? 1;

  const handleSubmitAnswer = async (answer: string, targetPuzzleId?: string) => {
    const puzzleToSubmit = targetPuzzleId
      ? puzzles.find((p) => p.id === targetPuzzleId) || activePuzzle
      : activePuzzle;
    if (!puzzleToSubmit) return { success: false, error: "No active puzzle" };
    try {
      const result = customSubmitAnswer
        ? await customSubmitAnswer(puzzleToSubmit.id, answer)
        : await submitPuzzleAnswerAction(puzzleToSubmit.id, answer);

      if (result.success) {
        // Pre-warm newly unlocked next puzzle's evidence in the background during celebration
        if (result.nextPuzzleData) {
          const nextUrl = result.nextPuzzleData.assets?.[0]?.url || result.nextPuzzleData.assetUrl;
          if (nextUrl) {
            prewarmAsset(nextUrl);
          }
        }

        confetti({
          particleCount: 160,
          spread: 90,
          origin: { y: 0.6 },
          colors: ["#d4af37", "#f59e0b", "#fbbf24", "#dc2626"],
        });

        setPuzzles((prev) =>
          prev.map((p) => {
            if (p.id === puzzleToSubmit.id) return { ...p, isSolved: true, isActive: false };
            if (result.nextPuzzleData && p.id === result.nextPuzzleData.id) {
              return {
                ...p,
                ...result.nextPuzzleData,
                realmId: result.nextPuzzleData.realmId ?? p.realmId ?? 1,
                realmOrderIndex: result.nextPuzzleData.realmOrderIndex ?? p.realmOrderIndex ?? p.orderIndex,
                waypointKey: result.nextPuzzleData.waypointKey ?? p.waypointKey,
                landmarkName: result.nextPuzzleData.landmarkName ?? p.landmarkName,
              };
            }
            if (p.orderIndex === puzzleToSubmit.orderIndex + 1) {
              return { ...p, isActive: true, isLocked: false };
            }
            return p;
          })
        );
        setSelectedPuzzleId(null);
        setFeedbackNotice("🎉 Waypoint breached! The Log Pose aligns with the next uncharted coordinates.");
        setTimeout(() => setFeedbackNotice(null), 6000);
        if (!customSubmitAnswer) {
          router.refresh();
        }
      } else {
        if (result.lockedOut || result.remainingSeconds) {
          setLockoutStatus({ isLocked: true, remainingSeconds: result.remainingSeconds || 300 });
        }
        setFeedbackNotice(`❌ Bearing rejected: ${result.message || result.error || "Incorrect cipher."}`);
        setTimeout(() => setFeedbackNotice(null), 6000);
      }
      return result;
    } catch {
      setFeedbackNotice("❌ Network anomaly. Check connection and retry.");
      setTimeout(() => setFeedbackNotice(null), 6000);
      return { success: false, error: "Network anomaly. Check connection and retry." };
    }
  };

  const handleUnlockHint = async (hintId: string) => {
    try {
      const res = await unlockHintAction(hintId);
      if (res.success) {
        setPuzzles((prev) =>
          prev.map((p) => ({
            ...p,
            hints: p.hints.map((h) =>
              h.id === hintId
                ? {
                    ...h,
                    isUnlocked: true,
                    content: res.hintContent,
                    unlockedByName: res.unlockedByName || h.unlockedByName || "Crew Member",
                  }
                : h
            ),
          }))
        );
        router.refresh();
      }
    } catch {
      // Ignored
    }
  };

  if (competitionState === "UPCOMING") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="rounded-3xl bg-black/75 backdrop-blur-2xl border border-white/10 p-8 sm:p-12 shadow-2xl text-center space-y-6 max-w-lg w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            <Compass className="w-8 h-8 animate-spin-slow" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-black font-sans text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              The Voyage Awaits
            </h1>
            <p className="text-xs sm:text-sm text-white/60 font-code">
              The hunt hasn&apos;t started yet. Prepare your crew.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Chronometer
              targetDate={startTime ?? null}
              label="Hunt Commences In"
              competitionState="UPCOMING"
              autoSwitchOnZero={true}
              onExpire={() => router.refresh()}
            />
          </div>
        </div>
      </div>
    );
  }

  if (competitionState === "ENDED") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="rounded-3xl bg-black/75 backdrop-blur-2xl border border-white/10 p-10 sm:p-12 shadow-2xl text-center space-y-4 max-w-lg w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-sans text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            The Voyage is Over
          </h1>
          <p className="text-xs sm:text-sm text-white/60 font-code">
            The hunt is concluded. Consult the bounty board for final rankings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-between select-none min-h-[calc(100dvh-80px)] space-y-3 sm:space-y-4 pt-1 sm:pt-2">
      {/* MAIN HORIZONTAL CAMPAIGN MAP WORKSPACE */}
      <main className="w-full max-w-7xl mx-auto px-0 sm:px-2 md:px-6 flex flex-col justify-center space-y-2.5 sm:space-y-3">
        {/* Feedback Alert Notice */}
        {feedbackNotice && (
          <div className="p-2.5 sm:p-3 rounded-2xl bg-[#2e1509] border-2 border-amber-500/70 text-center font-serif text-xs sm:text-sm font-bold text-[#fdebd0] shadow-2xl animate-bounce">
            {feedbackNotice}
          </div>
        )}

        {/* Grand Voyage Conquered Proclamation Banner */}
        {isAllCleared && (
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#221107]/95 via-[#381c0c]/95 to-[#221107]/95 border-2 border-amber-400/80 text-center shadow-[0_0_25px_rgba(245,158,11,0.3)] space-y-1">
            <div className="flex items-center justify-center gap-2 text-yellow-300 font-serif font-black text-xs sm:text-base md:text-lg">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span>Grand Voyage Conquered!</span>
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300" />
            </div>
            <p className="text-[10px] sm:text-xs text-amber-200/80 font-mono">
              All campaign waypoints have been breached by your crew. Check the Bounty Board for final standings!
            </p>
          </div>
        )}

        {/* Angry Birds-Style Realm Slide Campaign Map */}
        <RealmSlideMap
          landmarks={landmarks}
          onSelectLandmark={(landmark) => setSelectedPuzzleId(landmark.id)}
          teamName={team.name}
          bountyPoints={bountyPoints}
        />
      </main>

      {/* BOTTOM CARVED STONE VAULT MECHANISM & LOCKOUT DOCK */}
      <StoneVaultFooter
        currentStageTitle={activePuzzle ? activePuzzle.title : "Expedition Cleared"}
        lockoutRemaining={lockoutStatus?.remainingSeconds || 0}
        onSubmitAnswer={handleSubmitAnswer}
        onOpenLogbook={() => (activePuzzle || puzzles[puzzles.length - 1]) && setSelectedPuzzleId((activePuzzle || puzzles[puzzles.length - 1]).id)}
        onOpenActiveEncounter={() => (activePuzzle || puzzles[puzzles.length - 1]) && setSelectedPuzzleId((activePuzzle || puzzles[puzzles.length - 1]).id)}
        hintsEnabled={hintsEnabled}
        isAllCleared={isAllCleared}
      />

      {/* UNROLLED PARCHMENT PROCLAMATION SCROLL MODAL */}
      <AnimatePresence>
        {selectedLandmark && (
          <UnrollingScrollModal
            landmark={selectedLandmark}
            realmId={selectedRealmId}
            onClose={() => setSelectedPuzzleId(null)}
            onSubmitAnswer={(ans) => handleSubmitAnswer(ans, selectedLandmark.id)}
            onUnlockHint={handleUnlockHint}
            lockoutRemaining={lockoutStatus?.remainingSeconds || 0}
            hintsEnabled={hintsEnabled}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
