"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence } from "framer-motion";
import { Compass } from "@/components/icons";
import TreasureMap from "@/components/hunt/TreasureMap";
import PuzzleDispatch, { PuzzleData } from "@/components/hunt/PuzzleDispatch";
import { submitPuzzleAnswerAction, unlockHintAction } from "./actions";

interface HuntClientProps {
  team: { id: string; name: string; isFrozen: boolean };
  puzzles: PuzzleData[];
  activeOrderIndex?: number;
  competitionState: string;
  supportFeatureEnabled: boolean;
  initialSelectedId?: string | null;
}

export default function HuntClient({
  team,
  puzzles: initialPuzzles,
  competitionState,
  supportFeatureEnabled,
  initialSelectedId = null,
}: HuntClientProps) {
  const [puzzles, setPuzzles] = useState<PuzzleData[]>(initialPuzzles);
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string | null>(initialSelectedId);
  const [lockoutStatus, setLockoutStatus] = useState<{ isLocked: boolean; remainingSeconds: number } | null>(null);

  useEffect(() => {
    if (!lockoutStatus?.isLocked || lockoutStatus.remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockoutStatus(prev => {
        if (!prev) return null;
        if (prev.remainingSeconds <= 1) return null;
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutStatus?.isLocked]);

  const handleNodeClick = (puzzleId: string) => {
    setSelectedPuzzleId(puzzleId);
  };

  const handleCloseModal = () => {
    setSelectedPuzzleId(null);
  };

  const handleSubmitAnswer = async (puzzleId: string, answer: string) => {
    try {
      const result = await submitPuzzleAnswerAction(puzzleId, answer);
      if (result.success) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#fef3c7', '#dc2626']
        });
        
        setPuzzles(prev => prev.map(p => {
          if (p.id === puzzleId) return { ...p, isSolved: true, isActive: false };
          if (p.orderIndex === (prev.find(x => x.id === puzzleId)?.orderIndex || 0) + 1) {
            return { ...p, isActive: true, isLocked: false };
          }
          return p;
        }));
        setSelectedPuzzleId(null);
        return { success: true };
      } else {
        if (result.lockedOut || result.remainingSeconds) {
          setLockoutStatus({ isLocked: true, remainingSeconds: result.remainingSeconds || 300 });
        }
        return { success: false, message: result.message || result.error };
      }
    } catch {
      return { success: false, message: "Something went wrong. Try again." };
    }
  };

  const handleUnlockHint = async (hintId: string) => {
    try {
      const res = await unlockHintAction(hintId);
      if (res.success) {
        setPuzzles(prev => prev.map(p => ({
          ...p,
          hints: p.hints.map(h => h.id === hintId ? {
            ...h,
            isUnlocked: true,
            content: res.hintContent,
            unlockedByName: res.unlockedByName || h.unlockedByName || "Crew Member",
          } : h)
        })));
        return res;
      }
      return { success: false, error: res.error };
    } catch {
      return { success: false, error: "Something went wrong." };
    }
  };

  if (competitionState === "UPCOMING") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-10 sm:p-12 shadow-2xl text-center space-y-4 max-w-lg w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            <Compass className="w-8 h-8 animate-spin-slow" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-sans text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            The Voyage Awaits
          </h1>
          <p className="text-xs sm:text-sm text-white/60 font-code">
            The hunt hasn&apos;t started yet. Prepare your crew.
          </p>
        </div>
      </div>
    );
  }

  if (competitionState === "ENDED") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-10 sm:p-12 shadow-2xl text-center space-y-4 max-w-lg w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-sans text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            The Voyage is Over
          </h1>
          <p className="text-xs sm:text-sm text-white/60 font-code">
            The hunt is over. Check the leaderboard for final standings.
          </p>
        </div>
      </div>
    );
  }

  const selectedPuzzle = puzzles.find(p => p.id === selectedPuzzleId);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Unified Anime Flagship Command Banner */}
      <div className="relative rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold uppercase tracking-wider">
                Active Hunt
              </span>
              <span className="text-white/30 text-xs">•</span>
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                Live
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-sans tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              Treasure Map
            </h1>

            <p className="mt-1 text-xs text-white/60 font-code">
              Team: <strong className="text-amber-400 font-bold">{team.name}</strong>
            </p>
          </div>
        </div>
      </div>

      <main className="w-full">
        <TreasureMap puzzles={puzzles} onNodeClick={handleNodeClick} />
      </main>

      <AnimatePresence>
        {selectedPuzzle && (
          <PuzzleDispatch
            puzzle={selectedPuzzle}
            onClose={handleCloseModal}
            onSubmitAnswer={handleSubmitAnswer}
            onUnlockHint={handleUnlockHint}
            lockoutStatus={lockoutStatus}
            competitionState={competitionState}
            supportEnabled={supportFeatureEnabled}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
