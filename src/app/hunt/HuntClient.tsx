"use client";

import React, { useState, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Terminal,
  CheckCircle2,
  Lock,
  Send,
  Clock,
  Key,
} from "lucide-react";
import { submitPuzzleAnswerAction } from "./actions";
import SoundwaveCanvas from "@/components/3d/SoundwaveCanvas";
import SilhouetteViewer from "@/components/ui/SilhouetteViewer";
import PdfViewer from "@/components/ui/PdfViewer";
import HintModal from "@/components/ui/HintModal";
import LockoutTimer from "@/components/ui/LockoutTimer";
import SupportModal from "@/components/ui/SupportModal";

interface SanitizedHint {
  id: string;
  orderIndex: number;
  penaltyPoints: number;
  unlockDelayMinutes: number;
  isUnlocked: boolean;
  content?: string;
  unlockedByName?: string | null;
}

interface SanitizedPuzzle {
  id: string;
  orderIndex: number;
  title: string;
  description: string;
  assetUrl: string | null;
  assetType: string | null;
  basePoints: number;
  isSolved: boolean;
  isActive: boolean;
  isLocked: boolean;
  hints: SanitizedHint[];
  attemptsCount: number;
}

interface HuntClientProps {
  team: {
    name: string;
    batchTier: string;
  };
  puzzles: SanitizedPuzzle[];
  activeOrderIndex: number;
  competitionState: string;
  supportFeatureEnabled?: boolean;
}

export default function HuntClient({
  team,
  puzzles,
  activeOrderIndex,
  competitionState,
  supportFeatureEnabled = true,
}: HuntClientProps) {
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number>(
    Math.min(activeOrderIndex, puzzles.length)
  );
  const [answerInput, setAnswerInput] = useState("");
  const answerInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "lockout";
    message: string;
  } | null>(null);

  // Lockout state per puzzle
  const [lockouts, setLockouts] = useState<Record<string, number>>({});

  // Local hints state to reflect newly unlocked hints instantly
  const [localPuzzles, setLocalPuzzles] = useState<SanitizedPuzzle[]>(puzzles);

  const currentPuzzle =
    localPuzzles.find((p) => p.orderIndex === selectedOrderIndex) || localPuzzles[0];

  const currentLockoutSec = currentPuzzle ? lockouts[currentPuzzle.id] || 0 : 0;

  // Calculate Net Points for the selected puzzle
  const hintPenalties = currentPuzzle
    ? currentPuzzle.hints
        .filter((h) => h.isUnlocked)
        .reduce((acc, h) => acc + h.penaltyPoints, 0)
    : 0;

  const currentNetPoints = currentPuzzle
    ? Math.max(0, currentPuzzle.basePoints - hintPenalties)
    : 0;

  // Handle Answer Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPuzzle || submitting || currentLockoutSec > 0) return;

    setSubmitting(true);
    setFeedback(null);

    const res = await submitPuzzleAnswerAction(currentPuzzle.id, answerInput);
    setSubmitting(false);

    if (res.lockedOut && res.remainingSeconds) {
      setLockouts((prev) => ({ ...prev, [currentPuzzle.id]: res.remainingSeconds! }));
      setFeedback({
        type: "lockout",
        message: res.error || "Too many failed attempts. Submissions temporarily paused.",
      });
    } else if (res.isCorrect) {
      // Only celebrate a fresh solve — the server also answers success for an
      // "already solved by your team" duplicate submission.
      if (res.message && !res.message.includes("already solved")) {
        confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ffffff", "#a1a1aa", "#52525b", "#10b981"],
      });

      }

      setFeedback({
        type: "success",
        message: res.message || "Correct answer! Puzzle solved.",
      });
      setAnswerInput("");

      // Update local state to mark solved and advance dynamically to first unsolved puzzle
      setLocalPuzzles((prev) => {
        const updated = prev.map((p) =>
          p.id === currentPuzzle.id ? { ...p, isSolved: true } : p
        );

        const solvedIds = new Set(
          updated.filter((p) => p.isSolved).map((p) => p.id)
        );

        const sortedPuzzles = updated.slice().sort((a, b) => a.orderIndex - b.orderIndex);
        const nextUnsolved = sortedPuzzles.find((p) => !solvedIds.has(p.id));

        return updated.map((p) => {
          const isSolved = solvedIds.has(p.id);
          const allPrecedingSolved = updated
            .filter((other) => other.orderIndex < p.orderIndex)
            .every((other) => solvedIds.has(other.id));

          const isActive = nextUnsolved ? p.id === nextUnsolved.id : isSolved;
          const isLocked = !isSolved && !allPrecedingSolved;

          return {
            ...p,
            isSolved,
            isActive,
            isLocked,
          };
        });
      });

      // Auto advance to first remaining unsolved puzzle
      const remainingUnsolved = localPuzzles
        .filter((p) => p.id !== currentPuzzle.id && !p.isSolved)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      if (remainingUnsolved.length > 0) {
        setSelectedOrderIndex(remainingUnsolved[0].orderIndex);
      }
    } else {
      setFeedback({
        type: "error",
        message: res.message || res.error || "Incorrect answer. Try again!",
      });
      // Refocus input so user can type immediately
      setTimeout(() => answerInputRef.current?.focus(), 50);
    }
  };

  // Handle Hint Unlock update
  const handleHintUnlocked = (
    hintId: string,
    content: string,
    penalty: number,
    unlockedByName: string
  ) => {
    setLocalPuzzles((prev) =>
      prev.map((p) => {
        if (p.id === currentPuzzle?.id) {
          return {
            ...p,
            hints: p.hints.map((h) =>
              h.id === hintId
                ? { ...h, isUnlocked: true, content, penaltyPoints: penalty, unlockedByName }
                : h
            ),
          };
        }
        return p;
      })
    );
  };

  if (competitionState === "UPCOMING") {
    return (
      <div className="relative border border-white/20 bg-black p-12 text-center max-w-2xl mx-auto my-12 font-mono">
        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white/60" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white/60" />
        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white/60" />
        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white/60" />

        <Clock className="h-10 w-10 text-white mx-auto animate-pulse mb-3" />
        <h2 className="text-xl font-black italic -skew-x-12 tracking-tight text-white uppercase">
          Hunt Starting Soon
        </h2>
        <p className="text-xs text-white/60 tracking-wider mt-2">
          The competition has not started yet. Make sure your team is ready in the dashboard before the hunt begins.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 font-mono text-white">
      {/* LEFT: Progressive Puzzle Ladder */}
      <div className="lg:col-span-1 space-y-4">
        <div className="relative glass-panel p-4">
          <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white/60" />
          <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white/60" />

          <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
              Puzzles
            </span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
              {localPuzzles.filter((p) => p.isSolved).length} / {localPuzzles.length} Solved
            </span>
          </div>

          <div className="space-y-2">
            {localPuzzles.map((p) => {
              const isSelected = p.orderIndex === selectedOrderIndex;

              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={p.isLocked}
                  onClick={() => {
                    setSelectedOrderIndex(p.orderIndex);
                    setFeedback(null);
                  }}
                  className={`w-full p-3 border text-left transition flex items-center justify-between text-xs ${
                    isSelected
                      ? "border-[hsl(45_68%_47%)] bg-[hsl(45_68%_47%)] text-[hsl(0_0%_2%)] font-bold shadow-[0_0_16px_-3px_rgba(201,151,38,0.45)]"
                      : p.isSolved
                      ? "border-[hsl(45_40%_97%/0.08)] bg-[hsl(45_40%_97%/0.02)] text-[hsl(45_40%_97%/0.8)] hover:border-[hsl(45_40%_97%/0.2)]"
                      : p.isLocked
                      ? "border-[hsl(45_40%_97%/0.03)] bg-transparent text-[hsl(0_0%_30%)] cursor-not-allowed"
                      : "border-[hsl(45_68%_47%/0.35)] bg-[hsl(0_0%_4%)] text-[hsl(45_68%_47%)] hover:border-[hsl(45_68%_47%)]"
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {p.isSolved ? (
                      <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-[hsl(0_0%_2%)]" : "text-emerald-400"}`} />
                    ) : p.isLocked ? (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-[hsl(0_0%_30%)]" />
                    ) : (
                      <Terminal className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-[hsl(0_0%_2%)]" : "text-[hsl(45_68%_47%)] animate-pulse"}`} />
                    )}
                    <span className="truncate uppercase tracking-wider">
                      #{p.orderIndex} {p.title}
                    </span>
                  </div>

                  <span className={`text-[10px] shrink-0 ml-2 tracking-widest ${isSelected ? "text-[hsl(0_0%_2%)]" : "text-[hsl(45_40%_97%/0.4)]"}`}>
                    +{p.basePoints} pts
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Team Widget */}
        <div className="glass-panel p-4 space-y-1.5 text-xs">
          <div className="text-[10px] text-[hsl(45_40%_97%/0.4)] uppercase tracking-widest">Team</div>
          <div className="font-bold text-[hsl(45_40%_97%)] uppercase tracking-wider text-sm">{team.name}</div>
          <div className="text-[10px] text-[hsl(45_40%_97%/0.6)] tracking-wider">
            {team.batchTier === "FIRST_YEAR" ? "1st-Year Track" : "Senior Track"}
          </div>
        </div>
      </div>

      {/* RIGHT: Active Crypt Workspace */}
      <div className="lg:col-span-3 space-y-6">
        {currentPuzzle && (
          <div className="relative glass-panel p-6 sm:p-8 space-y-6">
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[hsl(45_68%_47%)]" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[hsl(45_40%_97%/0.4)]" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[hsl(45_40%_97%/0.4)]" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[hsl(45_40%_97%/0.4)]" />

            {/* Puzzle Header & Points */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[hsl(45_40%_97%/0.08)] pb-5">
              <div>
                <div className="flex items-center space-x-2 text-xs text-[hsl(45_40%_97%/0.5)] mb-1">
                  <span>Puzzle #{currentPuzzle.orderIndex}</span>
                  {currentPuzzle.isSolved && (
                    <span className="px-2 py-0.5 border border-emerald-500/40 bg-emerald-950/20 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                      SOLVED
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black italic -skew-x-12 uppercase tracking-tight text-[hsl(45_40%_97%)]">
                  {currentPuzzle.title}
                </h1>
              </div>

              {/* Point Telemetry */}
              <div className="flex items-center space-x-3">
                <div className="p-3 border border-[hsl(45_68%_47%/0.35)] bg-[hsl(0_0%_4%)] shadow-[inset_0_1px_0_0_hsl(45_68%_47%/0.25)] text-right">
                  <div className="text-[10px] text-[hsl(45_40%_97%/0.5)] uppercase tracking-widest">Net Value</div>
                  <div className="text-lg font-black text-[hsl(45_68%_47%)] tracking-tight font-mono">+{currentNetPoints} PTS</div>
                </div>
                <div className="p-3 recessed-well text-right">
                  <div className="text-[10px] text-[hsl(45_40%_97%/0.4)] uppercase tracking-widest">Base / Penalty</div>
                  <div className="text-xs text-[hsl(45_40%_97%/0.7)] font-mono">
                    {currentPuzzle.basePoints} /{" "}
                    <span className="text-[hsl(0_84%_60%)]">-{hintPenalties}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Narrative & Clues Viewport */}
            <div className="border border-white/[0.05] bg-[#060608] p-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap font-mono tracking-wide">
              {currentPuzzle.description}
            </div>

            {/* Multimedia Asset Viewers */}
            {currentPuzzle.assetUrl && (
              <div>
                {currentPuzzle.assetType === "audio" && (
                  <SoundwaveCanvas audioUrl={currentPuzzle.assetUrl} title={currentPuzzle.title} />
                )}

                {currentPuzzle.assetType === "image" && (
                  <SilhouetteViewer imageUrl={currentPuzzle.assetUrl} altText={currentPuzzle.title} />
                )}

                {currentPuzzle.assetType === "pdf" && (
                  <PdfViewer pdfUrl={currentPuzzle.assetUrl} title={currentPuzzle.title} />
                )}

                {currentPuzzle.assetType === "video" && (
                  <div className="border border-white/20 overflow-hidden my-4 bg-black">
                    <video src={currentPuzzle.assetUrl} controls className="w-full max-h-96 bg-black" />
                  </div>
                )}
              </div>
            )}

            {/* Timed Hints Section */}
            {currentPuzzle.hints && currentPuzzle.hints.length > 0 && (
              <div className="border-t border-white/10 pt-5">
                <div className="text-xs uppercase tracking-widest text-white/70 mb-3 flex items-center space-x-2">
                  <Key className="h-3.5 w-3.5 text-white/70" />
                  <span>Hints ({currentPuzzle.hints.length})</span>
                </div>

                <div className="space-y-2">
                  {currentPuzzle.hints.map((hint) => (
                    <HintModal
                      key={hint.id}
                      hint={hint}
                      isPuzzleSolved={currentPuzzle.isSolved}
                      onUnlocked={handleHintUnlocked}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Active Lockout Timer (remounts per puzzle so each cooldown starts fresh) */}
            {currentLockoutSec > 0 && (
              <LockoutTimer
                key={currentPuzzle.id}
                initialSeconds={currentLockoutSec}
                onTimerExpired={() => {
                  setLockouts((prev) => ({ ...prev, [currentPuzzle.id]: 0 }));
                  setFeedback(null);
                }}
              />
            )}

            {/* Submission Terminal */}
            <div className="border-t border-white/10 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest text-white/60 flex items-center space-x-1.5">
                  <Terminal className="h-3.5 w-3.5 text-white/80" />
                  <span>Submit Answer</span>
                </div>
                {supportFeatureEnabled && (
                  <SupportModal puzzleId={currentPuzzle.id} puzzleTitle={currentPuzzle.title} />
                )}
              </div>

              {currentPuzzle.isSolved ? (
                <div className="p-4 border border-white/30 bg-white/[0.02] text-white text-xs flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  <span className="uppercase tracking-wider">Puzzle solved! Proceed to next challenge.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative flex items-center">
                    <input
                      ref={answerInputRef}
                      type="text"
                      value={answerInput}
                      disabled={submitting || currentLockoutSec > 0}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="ENTER_DECRYPTED_ANSWER..."
                      className="w-full bg-[hsl(0_0%_1.8%)] border border-[hsl(45_40%_97%/0.12)] focus:border-[hsl(45_68%_47%)] py-3.5 pl-4 pr-36 text-xs text-[hsl(45_40%_97%)] placeholder:text-[hsl(0_0%_40%)] focus:outline-none transition disabled:opacity-30 uppercase tracking-widest shadow-[inset_0_2px_4px_rgba(0,0,0,0.85)]"
                    />

                    <button
                      type="submit"
                      disabled={submitting || !answerInput.trim() || currentLockoutSec > 0}
                      className="absolute right-2 px-4 py-2 bg-[hsl(45_68%_47%)] border border-[hsl(45_68%_47%)] hover:bg-transparent hover:text-[hsl(45_68%_47%)] text-[hsl(0_0%_2%)] text-xs uppercase tracking-widest font-bold transition disabled:opacity-30 flex items-center space-x-1.5 shadow-[0_0_12px_-2px_rgba(201,151,38,0.5)]"
                    >
                      <Send className="h-3 w-3" />
                      <span>{submitting ? "Checking..." : "Submit"}</span>
                    </button>
                  </div>

                  {/* Dynamic Submission Feedback */}
                  {feedback && (
                    <div
                      className={`p-3 text-xs border uppercase tracking-wider ${
                        feedback.type === "success"
                          ? "border-emerald-500/50 bg-emerald-950/20 text-emerald-300"
                          : feedback.type === "lockout"
                          ? "border-rose-500/50 bg-rose-950/20 text-rose-300"
                          : "border-white/30 bg-white/5 text-white"
                      }`}
                    >
                      {feedback.message}
                    </div>
                  )}

                  <div className="text-[10px] text-white/40 uppercase tracking-wider">
                    Answers are case-insensitive. Spaces and special characters are ignored.
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
