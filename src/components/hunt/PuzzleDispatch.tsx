"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Lock,
  Anchor,
  AlertCircle,
  FileText,
  Stamp,
  Coins,
  Megaphone,
  Unlock,
  CheckCircle2,
} from "@/components/icons";
import HintConfirmModal from "./HintConfirmModal";
import SupportModal from "./SupportModal";
import ForensicImageViewer from "./ForensicImageViewer";
import SecurePdfViewer from "./SecurePdfViewer";
import AudioVisualizer from "./AudioVisualizer";
import { createSupportTicketAction } from "@/app/hunt/actions";
import { cn } from "@/lib/utils";

export interface SubmitResult {
  success: boolean;
  message?: string;
  lockoutDuration?: number;
  nextPuzzleData?: PuzzleData | null;
}

export interface HintData {
  id: string;
  orderIndex: number;
  penaltyPoints: number;
  unlockDelayMinutes: number;
  isUnlocked: boolean;
  content?: string;
  unlockedByName?: string | null;
  availableAt?: number;
}

export interface PuzzleData {
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
  hints: HintData[];
  attemptsCount: number;
}

interface PuzzleDispatchProps {
  puzzle: PuzzleData;
  onClose: () => void;
  onSubmitAnswer: (puzzleId: string, answer: string) => Promise<SubmitResult>;
  onUnlockHint: (hintId: string) => Promise<{ success: boolean; hintContent?: string; penalty?: number; unlockedByName?: string; error?: string }>;
  lockoutStatus: { isLocked: boolean; remainingSeconds: number } | null;
  competitionState?: string;
  supportEnabled?: boolean;
}

export default function PuzzleDispatch({
  puzzle,
  onClose,
  onSubmitAnswer,
  onUnlockHint,
  lockoutStatus,
  supportEnabled,
}: PuzzleDispatchProps) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockingHint, setUnlockingHint] = useState<string | null>(null);
  const [confirmHint, setConfirmHint] = useState<HintData | null>(null);
  const [showSupport, setShowSupport] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());
  const activeConfirmHint = puzzle.isSolved ? null : confirmHint;

  useEffect(() => {
    const hasPendingHint = puzzle.hints.some((h) => !h.isUnlocked && h.availableAt && h.availableAt > Date.now());
    if (!hasPendingHint) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [puzzle.hints]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (confirmHint) {
          setConfirmHint(null);
        } else if (showSupport) {
          setShowSupport(false);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmHint, showSupport, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || submitting || lockoutStatus?.isLocked) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await onSubmitAnswer(puzzle.id, answer.trim());
      if (!res.success) {
        setError(res.message || "Incorrect answer, matey.");
      }
    } catch {
      setError("Failed to submit. The seas are rough today.");
    } finally {
      setSubmitting(false);
      setAnswer("");
    }
  };

  const handleUnlockHint = async (hintId: string) => {
    if (unlockingHint || puzzle.isSolved) return;
    setUnlockingHint(hintId);
    try {
      const res = await onUnlockHint(hintId);
      if (!res.success) {
        setError(res.error || "Failed to unlock log.");
      }
    } catch {
      setError("Error unlocking log.");
    } finally {
      setUnlockingHint(null);
      setConfirmHint(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 top-20 z-30 flex items-start justify-center p-3 sm:p-6 pt-4 sm:pt-6 pb-12 bg-black/40 backdrop-blur-xl overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.92, y: 25 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-[#fef3c7] border-4 border-[#2a1810] shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-5 sm:p-8 rounded-2xl parchment-bg text-[#2a1810] my-4"
      >
        {/* Wax-Seal Red Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 w-11 h-11 sm:w-12 sm:h-12 bg-[#dc2626] rounded-full flex items-center justify-center border-2 border-[#2a1810] shadow-lg text-[#fef3c7] hover:bg-red-700 transition-all z-20 cursor-pointer active:scale-95"
          title="Seal (Close)"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-[#2a1810]/10 text-[#78350f] border border-[#2a1810]/20 text-xs font-bold uppercase tracking-wider font-sans">
                Island #{puzzle.orderIndex}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-800/15 border border-emerald-700/30 text-emerald-800 text-xs font-bold uppercase tracking-wider font-code">
                <Coins className="w-3.5 h-3.5" />
                +{puzzle.basePoints} GP Bounty
              </span>
            </div>

            {supportEnabled && (
              <button
                onClick={() => setShowSupport(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2a1810] hover:bg-[#3a2216] border border-[#b45309]/60 text-xs font-bold uppercase tracking-wider text-amber-300 transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Signal Flare</span>
              </button>
            )}
          </div>

          <h2 className="font-[family-name:var(--font-pirata-one)] text-3xl sm:text-5xl text-[#2a1810] tracking-wide mt-1 drop-shadow-sm border-b-2 border-[#2a1810]/20 pb-2">
            {puzzle.title}
          </h2>
        </div>

        {puzzle.isLocked ? (
          <div className="rounded-2xl bg-[#fde68a]/40 border-2 border-[#b45309]/30 p-8 text-center space-y-4 my-4">
            <div className="w-16 h-16 rounded-2xl bg-[#2a1810]/10 border border-[#2a1810]/20 flex items-center justify-center mx-auto text-[#78350f]">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-pirata-one)] text-2xl sm:text-3xl text-[#2a1810]">
                Uncharted Waters
              </h3>
              <p className="mt-1 font-code text-xs sm:text-sm text-[#78350f] max-w-md mx-auto">
                This island remains shrouded in thick sea fog. Solve the preceding islands to navigate here and reveal its secrets.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Riddle Description */}
            <div className="rounded-xl bg-[#fde68a]/60 border-2 border-[#b45309]/20 p-4 sm:p-5 font-code text-sm sm:text-base leading-relaxed text-[#2a1810] shadow-inner whitespace-pre-line">
              {puzzle.description}
            </div>

            {/* Media Asset Preview */}
            {puzzle.assetUrl && (
              <div className="w-full bg-[#180e07] rounded-xl overflow-hidden border-2 border-[#2a1810] flex items-center justify-center min-h-[200px] shadow-md">
                {puzzle.assetType?.startsWith("image") ? (
                  <ForensicImageViewer src={puzzle.assetUrl} alt="Puzzle Asset" />
                ) : puzzle.assetType?.startsWith("audio") ? (
                  <AudioVisualizer src={puzzle.assetUrl} />
                ) : puzzle.assetType?.startsWith("video") ? (
                  <video controls className="w-full h-auto max-h-[500px]" src={puzzle.assetUrl} />
                ) : puzzle.assetType?.includes("pdf") ? (
                  <SecurePdfViewer src={puzzle.assetUrl} />
                ) : (
                  <div className="p-8 text-amber-400 font-code text-xs">Unsupported asset format</div>
                )}
              </div>
            )}

            {/* Captain's Logs & Hints */}
            {puzzle.hints.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-[family-name:var(--font-cinzel-decorative)] font-bold text-base sm:text-lg text-[#2a1810] flex items-center gap-2 border-b-2 border-[#2a1810]/20 pb-2">
                  <FileText className="w-5 h-5 text-[#b45309]" />
                  Captain&apos;s Logs
                </h3>
                {puzzle.hints.map((hint, idx) => (
                  <div
                    key={hint.id}
                    className="rounded-xl border-2 border-[#2a1810]/20 bg-[#fde68a]/50 p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-bold text-xs uppercase text-[#2a1810] flex items-center gap-1.5">
                        <Stamp className="w-4 h-4 text-[#dc2626]" /> Log #{idx + 1}
                      </span>
                      {!hint.isUnlocked && (
                        <span
                          className={cn(
                            "text-xs font-bold font-code px-2 py-0.5 rounded border",
                            puzzle.isSolved
                              ? "text-stone-500 bg-stone-200/60 border-stone-400/40"
                              : "text-red-700 bg-red-100/80 border-red-300"
                          )}
                        >
                          -{hint.penaltyPoints} GP Toll
                        </span>
                      )}
                    </div>

                    {hint.isUnlocked ? (
                      <div className="space-y-2.5">
                        <div className="font-code text-sm p-3.5 rounded-lg bg-[#fef3c7] border-2 border-[#f59e0b]/40 text-[#2a1810] leading-relaxed shadow-inner">
                          {hint.content}
                        </div>
                        
                        {/* Prominent Unlocker Attribution */}
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-[#b45309]/25 text-[#78350f]">
                          <span className="inline-flex items-center gap-1.5 font-sans font-bold">
                            <Unlock className="w-4 h-4 text-amber-600 stroke-[2.5]" />
                            <span>
                              Unlocked by:{" "}
                              <strong className="text-[#1a0e07] text-sm underline decoration-amber-500 underline-offset-2 font-black">
                                {hint.unlockedByName || "Crew Member"}
                              </strong>
                            </span>
                          </span>
                          <span className="font-code text-xs text-red-700 font-bold bg-red-100/90 px-2 py-0.5 rounded border border-red-300">
                            -{hint.penaltyPoints} GP Toll
                          </span>
                        </div>
                      </div>
                    ) : (() => {
                      if (puzzle.isSolved) {
                        return (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2.5 rounded-xl bg-[#2a1810]/40 border-2 border-stone-600/30 text-stone-500 font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed shadow-inner"
                          >
                            <Lock className="w-4 h-4 text-stone-500" /> Break Seal (Puzzle Solved)
                          </button>
                        );
                      }

                      const isDelayed = Boolean(hint.availableAt && now < hint.availableAt);
                      const remainingSeconds = isDelayed && hint.availableAt ? Math.max(1, Math.ceil((hint.availableAt - now) / 1000)) : 0;
                      const timeRemainingStr = remainingSeconds < 60 ? `${remainingSeconds}s` : `${Math.ceil(remainingSeconds / 60)}m`;

                      return isDelayed ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 rounded-xl bg-[#2a1810]/60 border-2 border-stone-600/40 text-stone-400 font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed shadow-inner"
                        >
                          <Lock className="w-4 h-4 text-stone-500" /> Sealed (Unlocks in {timeRemainingStr})
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmHint(hint)}
                          disabled={unlockingHint === hint.id}
                          className="w-full py-2.5 rounded-xl bg-[#2a1810] hover:bg-[#3a2216] border-2 border-[#b45309]/50 text-[#f59e0b] font-sans font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 cursor-pointer shadow-md"
                        >
                          <Lock className="w-4 h-4 text-[#f59e0b]" /> Break Seal
                        </button>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}

            {/* Answer Submission Box or Solved Banner */}
            {puzzle.isSolved ? (
              <div className="p-5 sm:p-6 rounded-xl bg-emerald-950/15 border-2 border-emerald-700/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-700 shrink-0">
                    <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-sans font-black text-emerald-950 text-sm uppercase tracking-wider">
                      Island Claimed
                    </h4>
                    <p className="font-code text-xs text-emerald-800">
                      Your crew has deciphered this mystery and claimed the bounty.
                    </p>
                  </div>
                </div>
                <span className="font-code font-black text-emerald-800 text-sm whitespace-nowrap">
                  +{puzzle.basePoints} GP
                </span>
              </div>
            ) : (
              <div className="relative p-5 sm:p-6 rounded-xl bg-[#1a0e07] border-4 border-[#2a1810] shadow-2xl">
                {lockoutStatus?.isLocked && (
                  <div className="absolute inset-0 z-10 bg-[#1a0e07]/95 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center text-[#f59e0b] p-4">
                    <Lock className="w-10 h-10 mb-2 text-[#f59e0b]" />
                    <span className="font-code text-3xl font-black tracking-widest">{lockoutStatus.remainingSeconds}s</span>
                    <span className="text-xs uppercase tracking-wider mt-1 text-white/70 font-code font-bold">
                      Combination Locked
                    </span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex gap-2.5">
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Enter combination..."
                    className="flex-1 bg-[#120804] text-[#f59e0b] font-code font-bold text-sm sm:text-base px-4 py-3 rounded-lg border-2 border-[#f59e0b]/50 focus:border-[#f59e0b] focus:outline-none placeholder:text-amber-800/60 uppercase tracking-wider"
                    disabled={submitting || Boolean(lockoutStatus?.isLocked)}
                  />
                  <button
                    type="submit"
                    disabled={submitting || Boolean(lockoutStatus?.isLocked) || !answer.trim()}
                    className="bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120804] px-6 py-3 font-sans font-black uppercase tracking-wider text-sm rounded-lg transition-all shadow-[0_0_14px_rgba(245,158,11,0.5)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 border-2 border-[#f59e0b] cursor-pointer"
                  >
                    {submitting ? <Anchor className="w-5 h-5 animate-spin" /> : <Anchor className="w-5 h-5 stroke-[2.5]" />}
                    <span>Submit</span>
                  </button>
                </form>
                {error && (
                  <div className="mt-2.5 text-red-400 text-xs flex items-center gap-1.5 font-code">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Confirmation & Support Dialogs */}
      {activeConfirmHint && (
        <HintConfirmModal
          hint={activeConfirmHint}
          onConfirm={() => handleUnlockHint(activeConfirmHint.id)}
          onCancel={() => setConfirmHint(null)}
          isUnlocking={unlockingHint === activeConfirmHint.id}
        />
      )}

      {showSupport && (
        <SupportModal
          puzzleId={puzzle.id}
          puzzleTitle={puzzle.title}
          onClose={() => setShowSupport(false)}
          onSubmit={createSupportTicketAction}
        />
      )}
    </motion.div>
  );
}
