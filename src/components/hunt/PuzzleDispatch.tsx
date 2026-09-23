"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Lock, Anchor, AlertCircle, FileText, Stamp } from "lucide-react";

export interface SubmitResult {
  success: boolean;
  message?: string;
  lockoutDuration?: number;
}

export interface HintData {
  id: string;
  orderIndex: number;
  penaltyPoints: number;
  unlockDelayMinutes: number;
  isUnlocked: boolean;
  content?: string;
  unlockedByName?: string | null;
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
  onUnlockHint: (hintId: string) => Promise<{ success: boolean; hintContent?: string; penalty?: number; error?: string }>;
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
}: PuzzleDispatchProps) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockingHint, setUnlockingHint] = useState<string | null>(null);

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
    if (unlockingHint) return;
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
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#120804]/85 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="relative w-full max-w-3xl bg-[#fef3c7] border-4 border-[#2a1810] shadow-2xl p-6 md:p-8 parchment-bg"
      >
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 w-12 h-12 bg-[#dc2626] rounded-full flex items-center justify-center border-2 border-[#2a1810] shadow-md text-[#fef3c7] hover:bg-red-700 transition-colors z-10"
          title="Seal (Close)"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="font-pirata text-4xl text-[#2a1810] border-b-2 border-[#2a1810]/20 pb-2 inline-block px-8">
            {puzzle.title}
          </h2>
        </div>

        <div className="space-y-6 text-[#2a1810]">
          <div className="font-code text-lg leading-relaxed bg-[#fde68a]/60 p-4 border border-amber-500/20">
            {puzzle.description}
          </div>

          {puzzle.assetUrl && (
            <div className="w-full bg-[#180e07] overflow-hidden border-2 border-[#2a1810] flex items-center justify-center min-h-[200px]">
              {puzzle.assetType?.startsWith('image') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={puzzle.assetUrl} alt="Puzzle Asset" className="w-full h-auto object-contain max-h-[500px]" />
              ) : puzzle.assetType?.startsWith('audio') ? (
                <audio controls className="w-full max-w-md my-8" src={puzzle.assetUrl} />
              ) : puzzle.assetType?.startsWith('video') ? (
                <video controls className="w-full h-auto max-h-[500px]" src={puzzle.assetUrl} />
              ) : puzzle.assetType?.includes('pdf') ? (
                <iframe src={puzzle.assetUrl} className="w-full h-[500px] border-none bg-white" />
              ) : (
                <div className="p-8 text-amber-500 font-code">Unsupported asset format</div>
              )}
            </div>
          )}

          {puzzle.hints.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-cinzel font-bold text-xl text-[#2a1810] flex items-center gap-2 border-b border-[#2a1810]/20 pb-1">
                <FileText className="w-6 h-6" /> Captain&apos;s Logs
              </h3>
              {puzzle.hints.map((hint, idx) => (
                <div key={hint.id} className="border border-[#2a1810]/30 bg-[#fde68a]/40 p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold flex items-center gap-2">
                      <Stamp className="w-5 h-5 text-[#dc2626]" /> Log #{idx + 1}
                    </span>
                    {!hint.isUnlocked && (
                      <span className="text-sm text-[#dc2626] font-bold">-{hint.penaltyPoints} pts</span>
                    )}
                  </div>
                  {hint.isUnlocked ? (
                    <div className="font-code text-sm p-3 bg-[#fef3c7] border border-[#f59e0b]/30">
                      {hint.content}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUnlockHint(hint.id)}
                      disabled={unlockingHint === hint.id}
                      className="w-full py-2 bg-[#2a1810] text-[#f59e0b] font-bold hover:bg-[#2a1810]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" /> Break Seal
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="relative mt-8 p-6 bg-[#1a0e07] border-4 border-[#2a1810] shadow-inner">
            {lockoutStatus?.isLocked && (
              <div className="absolute inset-0 z-10 bg-[#1a0e07]/95 backdrop-blur-sm flex flex-col items-center justify-center text-[#f59e0b]">
                <Lock className="w-12 h-12 mb-3 text-[#f59e0b]" />
                <span className="font-code text-3xl font-bold tracking-widest">{lockoutStatus.remainingSeconds}s</span>
                <span className="text-sm uppercase tracking-wide mt-2 font-cinzel">Combination Locked</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter combination..."
                className="flex-1 bg-[#120804] text-[#f59e0b] font-code text-[16px] px-4 py-3 border-2 border-[#f59e0b]/50 focus:border-[#f59e0b] focus:outline-none focus:ring-1 focus:ring-[#f59e0b] transition-all placeholder:text-amber-800/50 uppercase"
                disabled={submitting || !!lockoutStatus?.isLocked}
              />
              <button
                type="submit"
                disabled={submitting || !!lockoutStatus?.isLocked || !answer.trim()}
                className="bg-[#f59e0b] hover:bg-[#fbbf24] text-[#120804] px-6 py-3 font-bold transition-colors disabled:opacity-50 flex items-center justify-center border-2 border-[#f59e0b]"
              >
                {submitting ? <Anchor className="w-6 h-6 animate-spin" /> : <Anchor className="w-6 h-6" />}
              </button>
            </form>
            {error && (
              <div className="mt-3 text-red-400 text-sm flex items-center gap-2 font-code">
                <AlertCircle className="w-5 h-5" /> {error}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
