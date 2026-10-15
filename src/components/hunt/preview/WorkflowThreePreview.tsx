"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  CheckCircle2,
  X,
  ExternalLink,
  Coins,
  Gem,
  Clock,
  Shield,
} from "lucide-react";
import { WhatsAppIcon } from "./WhatsAppHintBanner";
import { PuzzleData } from "@/components/hunt/PuzzleDispatch";

interface WorkflowThreePreviewProps {
  puzzles: PuzzleData[];
  teamName: string;
}

export default function WorkflowThreePreview({
  puzzles,
  teamName,
}: WorkflowThreePreviewProps) {
  const [selectedPuzzle, setSelectedPuzzle] = useState<PuzzleData | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const activePuzzle = puzzles.find((p) => p.isActive) || puzzles[3];

  const handleOpenPuzzle = (puzzle: PuzzleData) => {
    if (puzzle.isLocked) return;
    setSelectedPuzzle(puzzle);
    setSubmitNotice(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    if (answerInput.trim().toLowerCase() === "laugh tale" || answerInput.trim().toLowerCase() === "poneglyph") {
      setSubmitNotice("✅ Ancient Seal Broken! Stage unlocked!");
    } else {
      setSubmitNotice("❌ The lock resists! Clue hint available in WhatsApp group.");
    }
  };

  return (
    <div className="w-full relative min-h-[920px] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#3c1e0e] bg-[#120a06] select-none flex flex-col justify-between">
      {/* 1. TOP STATUS BAR: Ornate Dark Bronze Filigree Currency & Beacon Header (Image 2 Top Bar) */}
      <header className="relative z-30 w-full bg-gradient-to-b from-[#1b0d06] via-[#150a04] to-[#120803] border-b-2 border-[#542d17] p-3 sm:p-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Team Crest Badge */}
          <div className="flex items-center gap-2.5">
            <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 border border-yellow-400/60 text-white font-serif font-black text-xs uppercase tracking-wider shadow">
              {teamName}
            </div>
            <span className="text-amber-400/40 text-xs">•</span>
            <div className="flex items-center gap-1.5 text-xs text-amber-200/80 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>02:44:19 REMAINING</span>
            </div>
          </div>

          {/* Center WhatsApp Live Hints Beacon */}
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border-2 border-emerald-500/60 hover:border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <div className="relative">
              <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-300">
              WhatsApp Broadcast: Live Hints Drop
            </span>
            <ExternalLink className="w-3 h-3 text-emerald-400" />
          </button>

          {/* Right Counters: Gold Coins & Rubies (from Image 2) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Coins */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#241308] border border-[#5c3016] text-amber-300 font-mono font-bold text-xs shadow-inner">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span>6,448</span>
              <span className="text-[9px] px-1 rounded bg-amber-500/20 text-yellow-300 ml-1">
                PTS
              </span>
            </div>

            {/* Hint Keys / Gems */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#241308] border border-[#5c3016] text-rose-300 font-mono font-bold text-xs shadow-inner">
              <Gem className="w-3.5 h-3.5 text-rose-400" />
              <span>58</span>
              <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300 ml-1">
                GEMS
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. MAIN SEPIA CAMPAIGN MAP CANVAS (Tolkien/Pirate etched parchment from Image 2)
         ========================================================================= */}
      <div className="relative flex-1 w-full overflow-hidden bg-[#e6ce9e]">
        {/* Parchment Base Background Texture */}
        <div
          className="absolute inset-0 bg-[#e3cb9b]"
          style={{
            backgroundImage: `url('/images/hunt/parchment_tile.jpg')`,
            backgroundSize: "cover",
            filter: "contrast(102%) brightness(96%)",
          }}
        />

        {/* Ink Etched Contour Grid / Mountains Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#6b2e11_1px,transparent_1px)] [background-size:28px_28px] opacity-15 pointer-events-none" />

        {/* Decorative Sketched Mountains & Realm Names (Image 2 style) */}
        <div className="absolute top-10 right-14 pointer-events-none opacity-30 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hunt/decor/ink_mountains.png"
            alt="Mountains"
            className="w-48 h-36 object-contain"
          />
          <div className="font-serif italic font-bold text-[#4a240f] text-sm text-center -mt-4">
            Pyrenus Ridge
          </div>
        </div>

        <div className="absolute bottom-20 left-12 pointer-events-none opacity-25 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hunt/decor/ink_island_palms.png"
            alt="Islands"
            className="w-40 h-32 object-contain"
          />
          <div className="font-serif italic font-bold text-[#4a240f] text-sm text-center -mt-2">
            Ivelate Straits
          </div>
        </div>

        {/* Top-Left Hanging Ribbon: Daily Challenge (from Image 2) */}
        <div className="absolute top-4 left-6 z-20 select-none">
          <div className="relative w-36 bg-gradient-to-b from-[#e3b879] to-[#c79a55] border-2 border-[#7a4821] rounded-b-xl shadow-xl p-2.5 text-center">
            {/* Red Wax Seal with Checkmark */}
            <div className="absolute -bottom-4 right-2 w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-950 border-2 border-yellow-200 flex items-center justify-center text-white shadow-lg">
              <span className="text-xs font-bold">✓</span>
            </div>
            <div className="font-serif font-black text-xs text-[#2b1406] uppercase tracking-wider">
              Daily Challenge
            </div>
            <div className="text-[10px] text-[#552709] font-mono font-bold mt-0.5">
              WhatsApp Quiz Done
            </div>
          </div>
        </div>

        {/* SVG Dotted Campaign Pathway connecting nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <path
            d="M 180 340 Q 300 200 450 240 T 740 320"
            fill="none"
            stroke="#632709"
            strokeWidth="4"
            strokeDasharray="9 7"
            strokeLinecap="round"
            opacity="0.75"
          />
        </svg>

        {/* Checkpoint Nodes along the Path */}
        {/* Node 1: Completed Scroll with Green Seal (Bottom Left) */}
        <div
          onClick={() => handleOpenPuzzle(puzzles[0])}
          className="absolute top-[310px] left-[130px] z-20 cursor-pointer group flex flex-col items-center"
        >
          {/* 3D Rolled Parchment Scroll with Lock Seal */}
          <div className="relative w-24 h-14 rounded-lg bg-[#d5ba8b] border-2 border-[#6f3e1a] shadow-[0_6px_14px_rgba(0,0,0,0.4)] flex items-center justify-center group-hover:scale-105 transition-transform">
            {/* Spindle ends */}
            <div className="absolute -left-2 inset-y-1 w-2.5 rounded-l bg-[#46220a] border border-[#231004]" />
            <div className="absolute -right-2 inset-y-1 w-2.5 rounded-r bg-[#46220a] border border-[#231004]" />

            <div className="text-center">
              <span className="font-serif font-bold text-xs text-[#3a1b08] block leading-tight">
                #1 Loguetown
              </span>
              <span className="text-[9px] font-mono text-emerald-800 font-bold">CONQUERED</span>
            </div>

            {/* Solved Wax Seal */}
            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-700 border-2 border-yellow-300 flex items-center justify-center text-white shadow-md">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Node 2: Completed Scroll (Center Top) */}
        <div
          onClick={() => handleOpenPuzzle(puzzles[1])}
          className="absolute top-[170px] left-[390px] z-20 cursor-pointer group flex flex-col items-center"
        >
          <div className="relative w-24 h-14 rounded-lg bg-[#d5ba8b] border-2 border-[#6f3e1a] shadow-[0_6px_14px_rgba(0,0,0,0.4)] flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="absolute -left-2 inset-y-1 w-2.5 rounded-l bg-[#46220a] border border-[#231004]" />
            <div className="absolute -right-2 inset-y-1 w-2.5 rounded-r bg-[#46220a] border border-[#231004]" />

            <div className="text-center">
              <span className="font-serif font-bold text-xs text-[#3a1b08] block leading-tight">
                #2 Mountain
              </span>
              <span className="text-[9px] font-mono text-emerald-800 font-bold">CONQUERED</span>
            </div>

            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-700 border-2 border-yellow-300 flex items-center justify-center text-white shadow-md">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* ACTIVE LEVEL: 3D GILDED BOSS / ENCOUNTER CARD (from Image 2 fire golem card!) */}
        <div
          onClick={() => handleOpenPuzzle(activePuzzle)}
          className="absolute top-[210px] left-[670px] z-25 cursor-pointer group flex flex-col items-center"
        >
          {/* Flame / Energy Pulse behind the card */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-t from-amber-600/50 via-yellow-400/40 to-transparent blur-md animate-pulse" />

          {/* Gilded 3D Boss Card Frame */}
          <div className="relative w-52 sm:w-56 rounded-2xl bg-gradient-to-b from-[#2e1507] via-[#1a0a03] to-[#261005] border-3 border-yellow-400 shadow-[0_15px_35px_rgba(0,0,0,0.9),0_0_25px_rgba(251,191,36,0.5)] p-3 overflow-hidden group-hover:scale-105 transition-all duration-300">
            {/* Card Header Tag */}
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded bg-yellow-400 text-black font-black text-[9px] font-mono tracking-widest uppercase">
                ACTIVE STAGE
              </span>
              <span className="text-amber-300 text-xs font-mono font-bold">
                {activePuzzle.basePoints} PTS
              </span>
            </div>

            {/* Stage Graphic Thumbnail */}
            <div className="relative h-28 rounded-xl bg-gradient-to-t from-red-950 via-amber-900 to-yellow-600 overflow-hidden flex items-center justify-center border border-yellow-400/50">
              {/* Flame overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-300/40 via-red-600/30 to-black/80" />
              {/* Active Caravel Ship Icon */}
              <div className="relative w-16 h-16 drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] animate-bounce">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/hunt/ship_player.png"
                  alt="Encounter Artwork"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Bottom Hanging Padlock Crest */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-yellow-500 border border-yellow-200 text-[#140803] text-[9px] font-black uppercase tracking-wider font-mono shadow-md">
                CLUE READY ⚓
              </div>
            </div>

            {/* Stage Title */}
            <div className="mt-3 text-center space-y-0.5">
              <h4 className="font-serif font-black text-sm text-[#fef2d6] tracking-wide truncate">
                {activePuzzle.title}
              </h4>
              <p className="text-[10px] text-amber-300/70 font-mono">
                Stage 4 of {puzzles.length}
              </p>
            </div>

            {/* Action Button */}
            <div className="mt-2.5 w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-serif font-black text-xs uppercase tracking-wider text-center shadow hover:brightness-110">
              Inspect Clue
            </div>
          </div>
        </div>

        {/* Node 4: Locked Scroll with Heavy Brass Padlock (Top Left) */}
        <div className="absolute top-[410px] left-[350px] z-20 cursor-not-allowed group flex flex-col items-center opacity-75">
          <div className="relative w-24 h-14 rounded-lg bg-[#bfa172] border-2 border-[#542d11] shadow-[0_6px_14px_rgba(0,0,0,0.3)] flex items-center justify-center">
            <div className="absolute -left-2 inset-y-1 w-2 rounded-l bg-[#3b1c07]" />
            <div className="absolute -right-2 inset-y-1 w-2 rounded-r bg-[#3b1c07]" />

            <div className="text-center">
              <span className="font-serif font-bold text-xs text-[#3a1b08]/80 block leading-tight">
                #5 Drum Rock
              </span>
              <span className="text-[9px] font-mono text-[#542d11] font-bold">LOCKED</span>
            </div>

            {/* Locked Padlock Badge */}
            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#351a09] border-2 border-amber-800 flex items-center justify-center text-amber-300 shadow">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. BOTTOM STONE VAULT & MECHANICAL ROLLING COUNTER (Image 2 Bottom Mechanism)
         ========================================================================= */}
      <footer className="relative z-30 w-full bg-[#120803] border-t-4 border-[#3c1e0e] shadow-[0_-15px_30px_rgba(0,0,0,0.9)]">
        {/* Carved Stone Battlement Frame */}
        <div className="max-w-5xl mx-auto p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Mechanical Tumbler Lockout / Time Counter (from Image 2 `48:31` dials) */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-400/80">
                Lockout / Penalty Dials
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {/* Dial 1 */}
                <div className="w-10 h-12 rounded-lg bg-gradient-to-b from-[#2a170c] via-[#4a2b18] to-[#1a0c05] border-2 border-[#783e1c] flex items-center justify-center text-xl font-mono font-black text-amber-200 shadow-inner">
                  0
                </div>
                <div className="w-10 h-12 rounded-lg bg-gradient-to-b from-[#2a170c] via-[#4a2b18] to-[#1a0c05] border-2 border-[#783e1c] flex items-center justify-center text-xl font-mono font-black text-amber-200 shadow-inner">
                  4
                </div>
                <span className="text-xl font-bold text-amber-400 font-mono">:</span>
                {/* Dial 2 */}
                <div className="w-10 h-12 rounded-lg bg-gradient-to-b from-[#2a170c] via-[#4a2b18] to-[#1a0c05] border-2 border-[#783e1c] flex items-center justify-center text-xl font-mono font-black text-amber-200 shadow-inner">
                  3
                </div>
                <div className="w-10 h-12 rounded-lg bg-gradient-to-b from-[#2a170c] via-[#4a2b18] to-[#1a0c05] border-2 border-[#783e1c] flex items-center justify-center text-xl font-mono font-black text-amber-200 shadow-inner">
                  1
                </div>
              </div>
            </div>

            {/* Heavy Carved Stone Vault Door Icon */}
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-[#261308] border-2 border-[#542d17] items-center justify-center text-amber-400 shadow-inner">
              <Shield className="w-6 h-6 text-amber-500" />
            </div>
          </div>

          {/* Quick Submit Answer Vault Slot (Image 2 Scatter Slot button) */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 max-w-md w-full flex items-center gap-2"
          >
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder="Submit answer to current stage..."
              className="flex-1 px-4 py-3 rounded-xl bg-[#1c0d05] border-2 border-[#522a14] text-amber-100 placeholder-amber-400/40 font-mono text-sm focus:outline-none focus:border-amber-500 shadow-inner"
            />
            {/* Glowing Red Gemstone Action Button (Scatter Slot style) */}
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-700 via-rose-600 to-red-800 border-2 border-rose-400/50 text-white font-serif font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(225,29,72,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              Vault Submit
            </button>
          </form>

          {/* WhatsApp HQ Quick Anchor */}
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 hover:border-emerald-400 text-emerald-200 text-xs font-bold transition-all hover:scale-105 cursor-pointer"
          >
            <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
            <span>Need Hint?</span>
          </button>
        </div>

        {submitNotice && (
          <div className="pb-3 text-center text-xs font-mono font-bold text-amber-300">
            {submitNotice}
          </div>
        )}
      </footer>

      {/* =========================================================================
          4. UNROLLING ENCOUNTER DRAWER / PARCHMENT SHEET (When Active Boss Card is Clicked)
         ========================================================================= */}
      <AnimatePresence>
        {selectedPuzzle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-xl rounded-2xl bg-[#e5cf9e] border-4 border-[#502812] shadow-2xl p-6 sm:p-8 text-[#281307]"
              style={{
                backgroundImage: `url('/images/hunt/parchment_tile.jpg')`,
                backgroundSize: "cover",
              }}
            >
              <button
                onClick={() => setSelectedPuzzle(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-[#41210f] text-[#f7e8ce] hover:bg-[#5b2f15]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1 mb-4">
                <div className="inline-block px-3 py-0.5 rounded-full bg-[#3d1e0c] text-amber-200 font-mono text-xs font-bold uppercase">
                  Stage Encounter #{selectedPuzzle.orderIndex} • {selectedPuzzle.basePoints} Points
                </div>
                <h3 className="text-2xl font-black font-serif text-[#2f1406]">
                  {selectedPuzzle.title}
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-[#dac08e]/70 border border-[#89572d]/40 mb-4 font-serif text-sm leading-relaxed text-[#2c1406]">
                <p>{selectedPuzzle.description}</p>
              </div>

              {/* WhatsApp Hint integration alert inside the card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0d281a] to-[#071910] border-2 border-emerald-500/50 text-emerald-100 flex items-center justify-between gap-3 mb-4 shadow">
                <div className="flex items-center gap-2.5">
                  <WhatsAppIcon className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono font-bold text-emerald-300 uppercase">
                      Hints Broadcast Station
                    </div>
                    <div className="text-xs text-white/90">
                      Game masters drop clues directly into the WhatsApp group!
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowWhatsAppModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs uppercase tracking-wider shrink-0 hover:scale-105"
                >
                  Join HQ
                </button>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setSelectedPuzzle(null)}
                  className="px-5 py-2 rounded-xl bg-[#3f1f0d] text-amber-100 font-serif font-bold text-xs uppercase"
                >
                  Close Scroll
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WHATSAPP GROUP MODAL */}
      <AnimatePresence>
        {showWhatsAppModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl bg-[#091b12] border-2 border-emerald-500/60 p-6 text-white shadow-2xl space-y-4"
            >
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <WhatsAppIcon className="w-8 h-8" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold font-serif text-white">
                  Official WhatsApp Clue HQ
                </h3>
                <p className="text-xs text-emerald-200/80 font-sans leading-relaxed">
                  Join the official crew WhatsApp group. Clues, emergency coordinates, and hints are broadcasted here by the game masters during the event.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-xs font-mono text-emerald-200 text-center">
                📡 <strong>Next Clue Drop:</strong> 15 minutes before the next stage unlock!
              </div>

              <a
                href="https://chat.whatsapp.com/example-treasure-hunt"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-black font-black font-sans text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                <WhatsAppIcon className="w-4 h-4 fill-black" />
                <span>Join Official WhatsApp Group</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
