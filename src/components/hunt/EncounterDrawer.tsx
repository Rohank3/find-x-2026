"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Key, Lock, CheckCircle2 } from "lucide-react";

export interface LandmarkData {
  id: string;
  orderIndex: number;
  landmarkType: "haven" | "canal" | "pass" | "caldera" | "citadel" | "crypt" | "strait" | "sky_reef" | "abyss";
  title: string;
  region: string;
  description: string;
  bountyPoints: number;
  isSolved: boolean;
  isActive: boolean;
  isLocked: boolean;
  hints: Array<{
    id: string;
    orderIndex: number;
    penalty: number;
    isUnlocked: boolean;
    content?: string;
  }>;
}

interface EncounterDrawerProps {
  landmark: LandmarkData;
  onClose: () => void;
  onSubmitAnswer: (answer: string) => void;
  onUnlockHint?: (hintId: string) => void;
}

export default function EncounterDrawer({
  landmark,
  onClose,
  onSubmitAnswer,
  onUnlockHint,
}: EncounterDrawerProps) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    onSubmitAnswer(answer.trim());
  };

  const getBadgeColor = (type: LandmarkData["landmarkType"]) => {
    switch (type) {
      case "haven":
        return "bg-teal-900/80 text-teal-200 border-teal-600/50";
      case "canal":
        return "bg-blue-900/80 text-blue-200 border-blue-600/50";
      case "pass":
        return "bg-amber-900/80 text-amber-200 border-amber-600/50";
      case "caldera":
        return "bg-red-950/80 text-red-200 border-red-600/50";
      case "citadel":
        return "bg-indigo-950/80 text-indigo-200 border-indigo-600/50";
      case "crypt":
        return "bg-yellow-950/80 text-yellow-200 border-yellow-600/50";
      default:
        return "bg-stone-900/80 text-stone-200 border-stone-600/50";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#ecd8ad] border-4 border-[#4a2612] shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-6 sm:p-8 text-[#281307]"
        style={{
          backgroundImage: `url('/images/hunt/parchment_tile.jpg')`,
          backgroundSize: "cover",
        }}
      >
        {/* Top & Bottom Wooden Roller Spindle Accent Bars */}
        <div className="absolute -top-3.5 left-8 right-8 h-4 rounded-full bg-gradient-to-r from-[#32170a] via-[#5c2e15] to-[#32170a] border-2 border-[#160a04] shadow-md" />
        <div className="absolute -bottom-3.5 left-8 right-8 h-4 rounded-full bg-gradient-to-r from-[#32170a] via-[#5c2e15] to-[#32170a] border-2 border-[#160a04] shadow-md" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#3c1d0b] hover:bg-[#572b12] text-[#f7e6ce] transition-colors cursor-pointer shadow-md"
          title="Close Scroll"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Proclamation Banner */}
        <div className="text-center space-y-1.5 mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider border shadow-sm backdrop-blur-sm">
            <span className={`px-2 py-0.5 rounded-full border ${getBadgeColor(landmark.landmarkType)}`}>
              {landmark.landmarkType.toUpperCase().replace("_", " ")}
            </span>
            <span className="text-[#6d3c19]">•</span>
            <span className="text-[#3c1d0b] font-bold">{landmark.region}</span>
            <span className="text-[#6d3c19]">•</span>
            <span className="text-amber-800 font-bold">{landmark.bountyPoints} BOUNTY PTS</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#2f1507] tracking-wide">
            {landmark.title}
          </h2>
        </div>

        {/* Lore & Clue Dispatch Container */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#dfc594]/65 border-2 border-[#946237]/50 mb-5 font-serif text-sm sm:text-base leading-relaxed text-[#2a1306] shadow-inner">
          <p className="whitespace-pre-line">{landmark.description}</p>
        </div>

        {/* In-Game Logbook Clues & Hints */}
        {landmark.hints.length > 0 && (
          <div className="mb-5 p-4 rounded-2xl bg-[#361a0b]/90 border-2 border-[#633318] text-[#f9ebce] shadow-md">
            <div className="flex items-center justify-between border-b border-[#5a2e16] pb-2 mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" />
                Navigator&apos;s Clue Logs ({landmark.hints.length})
              </span>
              <span className="text-[10px] font-mono text-amber-400/70">
                In-Game Hint Archive
              </span>
            </div>

            <div className="space-y-2">
              {landmark.hints.map((hint, idx) => (
                <div
                  key={hint.id}
                  className="p-3 rounded-xl bg-[#221006]/90 border border-[#522912] text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-serif font-bold text-amber-200">
                      Clue #{idx + 1}
                    </span>
                    {hint.isUnlocked ? (
                      <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Unsealed
                      </span>
                    ) : (
                      <button
                        onClick={() => onUnlockHint && onUnlockHint(hint.id)}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-[#140803] font-serif font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow cursor-pointer transition-transform hover:scale-105"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Unseal (-{hint.penalty} PTS)</span>
                      </button>
                    )}
                  </div>
                  <p className="text-amber-100/90 font-serif leading-relaxed">
                    {hint.isUnlocked
                      ? hint.content
                      : "This clue is sealed in the navigator's journal. Unseal to reveal coordinates."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answer Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#432310]">
              Deciphered Coordinates / Password:
            </label>
            <span className="text-[10px] font-mono text-[#7a421d]">
              Submit bearing to unlock next route
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your deciphered solution..."
              className="flex-1 px-4 py-3 rounded-xl bg-[#fffaf0] border-2 border-[#6f3b1b] text-[#241207] placeholder-[#8c6143] font-mono text-sm focus:outline-none focus:border-amber-600 shadow-inner"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-600 text-white font-serif font-black tracking-wider uppercase text-xs sm:text-sm shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              Break Seal
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
