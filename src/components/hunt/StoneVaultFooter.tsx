"use client";

import React, { useState, useRef } from "react";
import { Sparkles, BookOpen, Key, CheckCircle2 } from "lucide-react";

interface StoneVaultFooterProps {
  currentStageTitle: string;
  lockoutRemaining?: number; // seconds
  onSubmitAnswer: (answer: string) => Promise<unknown> | void;
  onOpenLogbook: () => void;
  onOpenActiveEncounter: () => void;
  hintsEnabled?: boolean;
  isAllCleared?: boolean;
}

export default function StoneVaultFooter({
  currentStageTitle,
  lockoutRemaining = 0,
  onSubmitAnswer,
  onOpenLogbook,
  onOpenActiveEncounter,
  hintsEnabled = false,
  isAllCleared = false,
}: StoneVaultFooterProps) {
  const [answerInput, setAnswerInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLockedOut = lockoutRemaining > 0;
  const minutes = Math.floor(lockoutRemaining / 60);
  const seconds = lockoutRemaining % 60;
  const mStr = String(minutes).padStart(2, "0");
  const sStr = String(seconds).padStart(2, "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim() || isLockedOut || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmitAnswer(answerInput.trim());
      setAnswerInput("");
    } catch {
      // Handled upstream
    } finally {
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <footer className="relative z-30 w-full overflow-hidden border-t-2 sm:border-t-4 border-[#3e2010] bg-[#0c0603] shadow-[0_-15px_35px_rgba(0,0,0,0.95)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* Stone Vault Gate Graphic Underlay */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none bg-center bg-cover"
        style={{
          backgroundImage: `url('/images/hunt/vault_gate_mechanism.webp')`,
        }}
      />

      {/* Stone Vault Upper Ledge with Carved Runes */}
      <div className="relative z-10 w-full h-1.5 sm:h-2 bg-gradient-to-r from-[#201007] via-[#522912] to-[#201007] border-b border-[#150a04]" />

      <div className="relative z-10 max-w-7xl mx-auto px-2.5 py-2.5 sm:px-6 sm:py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-4">
        {/* DESKTOP TUMBLERS / MOBILE LOCKOUT STATUS */}
        {isLockedOut ? (
          <div className="flex items-center justify-between md:justify-start gap-3 p-2 rounded-xl bg-red-950/40 border border-red-500/50">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-red-500/60 shadow-inner shrink-0 bg-[#1a0c05] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/hunt/vault_gate_mechanism.webp"
                  alt="Stone Vault Gate"
                  className="w-full h-full object-cover filter brightness-75 sepia hue-rotate-[320deg]"
                />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400 block animate-pulse">
                  Tumblers Jammed
                </span>
                {/* Rolling Counter Dials */}
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-7 h-8 rounded-lg bg-gradient-to-b from-[#3a0d0d] via-[#5a1616] to-[#2a0808] border border-red-500/80 flex items-center justify-center font-mono font-black text-base text-red-200 shadow-inner">
                    {mStr[0]}
                  </div>
                  <div className="w-7 h-8 rounded-lg bg-gradient-to-b from-[#3a0d0d] via-[#5a1616] to-[#2a0808] border border-red-500/80 flex items-center justify-center font-mono font-black text-base text-red-200 shadow-inner">
                    {mStr[1]}
                  </div>
                  <span className="font-mono font-black text-red-400 text-sm animate-pulse px-0.5">:</span>
                  <div className="w-7 h-8 rounded-lg bg-gradient-to-b from-[#3a0d0d] via-[#5a1616] to-[#2a0808] border border-red-500/80 flex items-center justify-center font-mono font-black text-base text-red-200 shadow-inner">
                    {sStr[0]}
                  </div>
                  <div className="w-7 h-8 rounded-lg bg-gradient-to-b from-[#3a0d0d] via-[#5a1616] to-[#2a0808] border border-red-500/80 flex items-center justify-center font-mono font-black text-base text-red-200 shadow-inner">
                    {sStr[1]}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Clue / Logbook Buttons alongside Lockout */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              {hintsEnabled && (
                <button
                  type="button"
                  onClick={onOpenActiveEncounter}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#231209] hover:bg-[#321a0d] border border-[#5a2e16] text-amber-200 text-xs font-serif font-bold transition-all cursor-pointer shadow min-h-[40px]"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Clue</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenLogbook}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#231209] hover:bg-[#321a0d] border border-[#5a2e16] text-amber-200 text-xs font-serif font-bold transition-all cursor-pointer shadow min-h-[40px]"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Logbook</span>
              </button>
            </div>
          </div>
        ) : (
          /* When NOT locked out, show full dials on desktop; on mobile, show compact stage title + quick actions bar */
          <>
            {/* Desktop Tumbler Display */}
            <div className="hidden md:flex items-center gap-3">
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
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-8 h-9 rounded-lg bg-gradient-to-b from-[#2a170c] via-[#482816] to-[#1a0c05] border-2 border-[#763d1a] flex items-center justify-center font-mono font-black text-lg text-amber-200 shadow-inner">
                    0
                  </div>
                  <div className="w-8 h-9 rounded-lg bg-gradient-to-b from-[#2a170c] via-[#482816] to-[#1a0c05] border-2 border-[#763d1a] flex items-center justify-center font-mono font-black text-lg text-amber-200 shadow-inner">
                    0
                  </div>
                  <span className="font-mono font-black text-amber-400/50 text-base px-0.5">:</span>
                  <div className="w-8 h-9 rounded-lg bg-gradient-to-b from-[#2a170c] via-[#482816] to-[#1a0c05] border-2 border-[#763d1a] flex items-center justify-center font-mono font-black text-lg text-amber-200 shadow-inner">
                    0
                  </div>
                  <div className="w-8 h-9 rounded-lg bg-gradient-to-b from-[#2a170c] via-[#482816] to-[#1a0c05] border-2 border-[#763d1a] flex items-center justify-center font-mono font-black text-lg text-amber-200 shadow-inner">
                    0
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Header Row: Active stage chip + Clue/Logbook buttons */}
            <div className="flex md:hidden items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-xs font-serif font-black text-amber-200 truncate">
                  {currentStageTitle}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {hintsEnabled && (
                  <button
                    type="button"
                    onClick={onOpenActiveEncounter}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#231209] hover:bg-[#321a0d] border border-[#5a2e16] text-amber-200 text-xs font-serif font-bold transition-all cursor-pointer shadow min-h-[38px]"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clue</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenLogbook}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#231209] hover:bg-[#321a0d] border border-[#5a2e16] text-amber-200 text-xs font-serif font-bold transition-all cursor-pointer shadow min-h-[38px]"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Logbook</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Center: Answer Submission Vault Input Slot OR Conquered Plate */}
        {isAllCleared ? (
          <div className="flex-1 max-w-xl w-full py-2.5 px-4 sm:px-5 rounded-2xl bg-gradient-to-r from-[#170b05] via-[#241308] to-[#170b05] border-2 border-emerald-500/50 flex items-center justify-center gap-2.5 shadow-inner">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-serif font-black text-xs sm:text-sm text-emerald-200 tracking-wider uppercase text-center">
              Expedition Conquered • All Waypoints Breached
            </span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 max-w-xl w-full flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                disabled={isLockedOut || isSubmitting}
                placeholder={
                  isLockedOut
                    ? "Lockout active. Await tumblers..."
                    : isSubmitting
                    ? "Transmitting cipher..."
                    : `Submit bearing for ${currentStageTitle}...`
                }
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#170b05] border-2 border-[#542a14] text-[#f7e6cd] placeholder-[#7d4824] font-mono text-base sm:text-sm focus:outline-none focus:border-amber-500 shadow-inner transition-colors disabled:opacity-50 min-h-[44px]"
              />
            </div>

            {/* Runic Ruby "Break Seal" Action Button */}
            <button
              type="submit"
              disabled={isLockedOut || !answerInput.trim() || isSubmitting}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-700 via-rose-600 to-red-800 border-2 border-rose-400/60 hover:border-rose-300 text-white font-serif font-black text-xs sm:text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(225,29,72,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 text-rose-200 animate-spin shrink-0" />
                  <span className="hidden xs:inline">Breaking...</span>
                  <span className="xs:hidden">...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-rose-200 shrink-0" />
                  <span>Break Seal</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Right: Quick Action Controls (Desktop Only) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {hintsEnabled && (
            <button
              type="button"
              onClick={onOpenActiveEncounter}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#231209] hover:bg-[#321a0d] border border-[#5a2e16] text-amber-200 text-xs font-serif font-bold transition-all cursor-pointer shadow min-h-[44px]"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Clue</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenLogbook}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#231209] hover:bg-[#321a0d] border border-[#5a2e16] text-amber-200 text-xs font-serif font-bold transition-all cursor-pointer shadow min-h-[44px]"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Logbook</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
