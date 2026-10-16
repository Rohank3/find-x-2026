"use client";

import React, { useState } from "react";
import { Sparkles, BookOpen, Key } from "lucide-react";

interface StoneVaultFooterProps {
  currentStageTitle: string;
  lockoutRemaining?: number; // seconds
  onSubmitAnswer: (answer: string) => void;
  onOpenLogbook: () => void;
  onOpenActiveEncounter: () => void;
}

export default function StoneVaultFooter({
  currentStageTitle,
  lockoutRemaining = 0,
  onSubmitAnswer,
  onOpenLogbook,
  onOpenActiveEncounter,
}: StoneVaultFooterProps) {
  const [answerInput, setAnswerInput] = useState("");

  const minutes = Math.floor(lockoutRemaining / 60);
  const seconds = lockoutRemaining % 60;
  const mStr = String(minutes).padStart(2, "0");
  const sStr = String(seconds).padStart(2, "0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    onSubmitAnswer(answerInput.trim());
    setAnswerInput("");
  };

  return (
    <footer className="relative z-30 w-full overflow-hidden border-t-4 border-[#3e2010] bg-[#0c0603] shadow-[0_-15px_35px_rgba(0,0,0,0.95)]">
      {/* Stone Vault Gate Graphic Underlay */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none bg-center bg-cover"
        style={{
          backgroundImage: `url('/images/hunt/vault_gate_mechanism.webp')`,
        }}
      />

      {/* Stone Vault Upper Ledge with Carved Runes */}
      <div className="relative z-10 w-full h-2 bg-gradient-to-r from-[#201007] via-[#522912] to-[#201007] border-b border-[#150a04]" />

      <div className="relative z-10 max-w-7xl mx-auto px-3 py-3 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Mechanical Rolling Tumbler Lockout Dials */}
        <div className="flex items-center gap-3">
          {/* Heavy Stone Gate Portcullis Thumbnail */}
          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#6f3b1b] shadow-inner shrink-0 bg-[#1a0c05] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hunt/vault_gate_mechanism.webp"
              alt="Stone Vault Gate"
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400/80 block">
              Lockout Tumblers
            </span>
            {/* Rolling Counter Dials */}
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-8 h-9 rounded-lg bg-gradient-to-b from-[#2a170c] via-[#482816] to-[#1a0c05] border-2 border-[#763d1a] flex items-center justify-center font-mono font-black text-lg text-amber-200 shadow-inner">
                {mStr[0]}
              </div>
              <div className="w-8 h-9 rounded-lg bg-gradient-to-b from-[#2a170c] via-[#482816] to-[#1a0c05] border-2 border-[#763d1a] flex items-center justify-center font-mono font-black text-lg text-amber-200 shadow-inner">
                {mStr[1]}
              </div>
              <span className="font-mono font-black text-amber-400 text-base animate-pulse px-0.5">:</span>
              <div className="w-8 h-9 rounded-lg bg-gradient-to-b from-[#2a170c] via-[#482816] to-[#1a0c05] border-2 border-[#763d1a] flex items-center justify-center font-mono font-black text-lg text-amber-200 shadow-inner">
                {sStr[0]}
              </div>
              <div className="w-8 h-9 rounded-lg bg-gradient-to-b from-[#2a170c] via-[#482816] to-[#1a0c05] border-2 border-[#763d1a] flex items-center justify-center font-mono font-black text-lg text-amber-200 shadow-inner">
                {sStr[1]}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Answer Submission Vault Input Slot */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 max-w-xl w-full flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder={`Submit bearing for ${currentStageTitle}...`}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#170b05] border-2 border-[#542a14] text-[#f7e6cd] placeholder-[#7d4824] font-mono text-sm focus:outline-none focus:border-amber-500 shadow-inner transition-colors"
            />
          </div>

          {/* Runic Ruby "Break Seal" Action Button */}
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-700 via-rose-600 to-red-800 border-2 border-rose-400/60 hover:border-rose-300 text-white font-serif font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(225,29,72,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-rose-200" />
            <span>Break Seal</span>
          </button>
        </form>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenActiveEncounter}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#231209] hover:bg-[#321a0d] border border-[#5a2e16] text-amber-200 text-xs font-serif font-bold transition-all cursor-pointer shadow"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Clue</span>
          </button>

          <button
            onClick={onOpenLogbook}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#231209] hover:bg-[#321a0d] border border-[#5a2e16] text-amber-200 text-xs font-serif font-bold transition-all cursor-pointer shadow"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Logbook</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
