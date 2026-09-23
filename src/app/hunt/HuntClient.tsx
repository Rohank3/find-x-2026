"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence } from "framer-motion";
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
      return { success: false, message: "Lost at sea. Try again." };
    }
  };

  const handleUnlockHint = async (hintId: string) => {
    try {
      const res = await unlockHintAction(hintId);
      if (res.success) {
        setPuzzles(prev => prev.map(p => ({
          ...p,
          hints: p.hints.map(h => h.id === hintId ? { ...h, isUnlocked: true, content: res.hintContent } : h)
        })));
        return res;
      }
      return { success: false, error: res.error };
    } catch {
      return { success: false, error: "Communications down." };
    }
  };

  if (competitionState === "UPCOMING") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center space-y-6 bg-[#1a0e07]/90 p-12 border-2 border-amber-500/30 rounded-lg backdrop-blur-md">
          <h1 className="text-6xl font-pirata text-amber-500">The Voyage Awaits</h1>
          <p className="text-2xl font-cinzel text-amber-200/80">The seas are calm... for now.</p>
        </div>
      </div>
    );
  }

  if (competitionState === "ENDED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center space-y-6 bg-[#1a0e07]/90 p-12 border-2 border-amber-500/30 rounded-lg backdrop-blur-md">
          <h1 className="text-6xl font-pirata text-amber-500">The Voyage is Over</h1>
          <p className="text-2xl font-cinzel text-amber-200/80">The treasures have been claimed.</p>
        </div>
      </div>
    );
  }

  const selectedPuzzle = puzzles.find(p => p.id === selectedPuzzleId);

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 overflow-x-hidden relative">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none mix-blend-overlay" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-8 flex justify-between items-end border-b-2 border-amber-500/30 pb-4">
          <div>
            <h1 className="text-5xl font-pirata text-amber-500 tracking-wide drop-shadow-md">The Grand Voyage</h1>
            <p className="text-amber-200/60 font-code text-sm tracking-widest mt-2 uppercase">
              CREW: <span className="text-amber-400 font-bold">{team.name}</span>
            </p>
          </div>
        </header>

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
    </div>
  );
}
