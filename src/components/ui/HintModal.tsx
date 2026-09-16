"use client";

import React, { useState } from "react";
import { AlertTriangle, Lock, Key, Clock } from "lucide-react";
import { unlockHintAction } from "@/app/hunt/actions";

interface HintModalProps {
  hint: {
    id: string;
    orderIndex: number;
    penaltyPoints: number;
    unlockDelayMinutes: number;
    content?: string;
    isUnlocked: boolean;
    unlockedByName?: string | null;
  };
  isPuzzleSolved?: boolean;
  onUnlocked: (hintId: string, content: string, penalty: number, unlockedByName: string) => void;
}

export default function HintModal({ hint, isPuzzleSolved, onUnlocked }: HintModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleConfirmUnlock = async () => {
    if (isPuzzleSolved) return;
    setLoading(true);
    setError(null);

    const result = await unlockHintAction(hint.id);
    setLoading(false);

    if (result.success && result.hintContent) {
      onUnlocked(
        hint.id,
        result.hintContent,
        result.penalty || hint.penaltyPoints,
        result.unlockedByName || "You"
      );
      setIsOpen(false);
    } else {
      setError(result.error || "Failed to unlock hint.");
    }
  };

  if (hint.isUnlocked) {
    return (
      <div className="relative border border-white/20 bg-white/[0.02] p-4 my-2 font-mono">
        <div className="flex items-center justify-between text-xs mb-2 border-b border-white/10 pb-2">
          <div className="flex items-center space-x-2 text-white">
            <Key className="h-3.5 w-3.5 text-white/80" />
            <span className="font-bold uppercase tracking-widest">Hint #{hint.orderIndex}</span>
          </div>
          <div className="text-white/50 text-[11px] tracking-wider">
            Penalty: <span className="text-rose-400 font-bold">-{hint.penaltyPoints} pts</span>
            {hint.unlockedByName && (
              <span className="ml-2 text-white/70">
                • Unlocked by: <span className="text-white font-bold">{hint.unlockedByName}</span>
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{hint.content}</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative border border-white/10 bg-black/60 p-3.5 flex items-center justify-between my-2 hover:border-white/30 transition font-mono">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 border border-white/15 bg-white/5 flex items-center justify-center text-white/50">
            <Lock className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              Hint #{hint.orderIndex} {isPuzzleSolved ? "(Solved)" : ""}
            </div>
            <div className="text-[11px] text-white/50 flex items-center space-x-2 tracking-wider mt-0.5">
              <span>Cost: <strong className="text-white/80">-{hint.penaltyPoints} pts</strong></span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Available after: {hint.unlockDelayMinutes}m</span>
              </span>
            </div>
          </div>
        </div>

        {isPuzzleSolved ? (
          <span
            className="px-3 py-1.5 border border-white/10 text-white/30 text-xs uppercase tracking-widest cursor-not-allowed select-none"
            title="Hints are disabled for already solved puzzles"
          >
            Solved
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="px-3.5 py-1.5 border border-white/30 hover:border-white hover:bg-white hover:text-black text-white text-xs uppercase tracking-widest transition"
          >
            Unlock Hint
          </button>
        )}
      </div>

      {/* 2-Step Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-mono">
          <div className="relative max-w-md w-full border border-white/30 bg-black p-6 space-y-4">
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white/80" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white/80" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white/80" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white/80" />

            <div className="flex items-center space-x-3 text-white border-b border-white/10 pb-3">
              <AlertTriangle className="h-5 w-5 text-white/70 shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Unlock Hint Confirmation
              </h3>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Unlocking will apply an irreversible penalty of{" "}
              <strong className="text-white font-bold">
                -{hint.penaltyPoints} points
              </strong>{" "}
              to your team&apos;s net score on this puzzle.
            </p>

            <div className="border border-white/10 bg-white/[0.02] p-3 text-[11px] text-white/50 tracking-wider">
              Note: This action will be visible to all members of your team.
            </div>

            {error && (
              <div className="text-xs text-rose-400 border border-rose-500/30 bg-rose-950/20 p-2.5">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-white/10">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs uppercase tracking-widest text-white/50 hover:text-white transition"
              >
                [ESC]
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmUnlock}
                className="px-4 py-2 border border-white bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/80 transition flex items-center space-x-1.5"
              >
                {loading ? (
                  <span>Unlocking...</span>
                ) : (
                  <>
                    <Key className="h-3 w-3" />
                    <span>Unlock Hint (-{hint.penaltyPoints} pts)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
