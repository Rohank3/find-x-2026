"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Lock,
  CheckCircle2,
  X,
  Sparkles,
  ExternalLink,
  Shield,
  Key,
  Trophy,
} from "lucide-react";
import { WhatsAppIcon } from "./WhatsAppHintBanner";
import { PuzzleData } from "@/components/hunt/PuzzleDispatch";

interface WorkflowOnePreviewProps {
  puzzles: PuzzleData[];
  teamName: string;
}

export default function WorkflowOnePreview({
  puzzles,
  teamName,
}: WorkflowOnePreviewProps) {
  const [selectedPuzzle, setSelectedPuzzle] = useState<PuzzleData | null>(null);
  const [activeTab, setActiveTab] = useState<"map" | "whatsapp" | "crew" | "log">("map");
  const [userAnswer, setUserAnswer] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Active puzzle is the first non-solved puzzle
  const activePuzzle = puzzles.find((p) => p.isActive) || puzzles[3];

  const handleIslandClick = (puzzle: PuzzleData) => {
    if (puzzle.isLocked) return;
    setSelectedPuzzle(puzzle);
    setFeedbackMessage(null);
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;
    if (userAnswer.trim().toLowerCase() === "laugh tale" || userAnswer.trim().toLowerCase() === "poneglyph") {
      setFeedbackMessage("🎉 Correct! The Log Pose aligns with the next uncharted coordinates!");
    } else {
      setFeedbackMessage("❌ Incorrect bearing. Check the clues or check the WhatsApp group for hints!");
    }
  };

  return (
    <div className="w-full relative min-h-[900px] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#3a2012] bg-[#140b07] select-none">
      {/* 1. TABLETOP BACKGROUND: Weathered dark pirate captain's chart table */}
      <div
        className="absolute inset-0 bg-[#160d08] opacity-95 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(68, 36, 17, 0.4) 0%, rgba(13, 7, 4, 0.95) 100%), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: "100% 100%, 30px 30px, 30px 30px",
        }}
      />

      {/* Creeping vines & ambient corner foliage overlay */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-emerald-950/40 via-amber-950/20 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-gradient-to-tr from-amber-950/40 to-transparent pointer-events-none z-10" />

      {/* =========================================================================
          2. TOP HEADER HUD: Team Crest & Astrolabe Navigation
         ========================================================================= */}
      <header className="relative z-30 flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6 bg-gradient-to-b from-[#1b0e07]/90 via-[#160b06]/80 to-transparent border-b border-[#442211]/50 backdrop-blur-sm">
        {/* Left Team Plaque */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-900/40 border-2 border-amber-400/50 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <Compass className="w-7 h-7 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                Captain&apos;s War Room
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-xs font-mono text-emerald-400 font-bold">ONLINE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-serif text-[#fdf5e2] tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {teamName}
            </h1>
          </div>
        </div>

        {/* Center WhatsApp Live Dispatch Beacon */}
        <button
          onClick={() => setShowWhatsAppModal(true)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#092215]/90 border-2 border-emerald-500/50 hover:border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer group"
        >
          <div className="relative">
            <WhatsAppIcon className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300" />
            </span>
          </div>
          <div className="text-left">
            <div className="text-[10px] font-mono font-black uppercase tracking-wider text-emerald-300">
              WhatsApp Clue Channel
            </div>
            <div className="text-[11px] font-bold text-white group-hover:text-emerald-100 flex items-center gap-1">
              <span>Hints dropping live</span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </div>
          </div>
        </button>

        {/* Top-Right Astrolabe / Celestial Gear Widget */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[10px] font-mono text-amber-300/70 uppercase tracking-widest">
              Log Pose Bearing
            </span>
            <span className="text-sm font-black text-amber-200 font-mono">
              34° N • GRAND LINE
            </span>
          </div>

          {/* Steampunk / Brass Astrolabe Multi-Gear Assembly */}
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center">
            {/* Outer Cog Rim */}
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-amber-600/70 animate-spin-slow opacity-75 shadow-[0_0_15px_rgba(217,119,6,0.3)]" />
            {/* Middle Celestial Ring (Reverse spin) */}
            <div
              className="absolute inset-1.5 rounded-full border-2 border-amber-400/80 opacity-90"
              style={{ animation: "spin 18s linear infinite reverse" }}
            />
            {/* Core Astrolabe Medallion */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-700 via-amber-900 to-[#1e0e06] border-2 border-yellow-300 flex items-center justify-center text-amber-200 shadow-inner">
              <span className="text-xs font-black font-mono">NNE</span>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          3. MAIN DESK WORKSPACE: Left Ribbons, Center Pinned Map, Right Vitals
         ========================================================================= */}
      <div className="relative z-20 flex flex-col lg:flex-row items-stretch p-4 sm:p-6 gap-6 max-w-7xl mx-auto">
        {/* LEFT HUD: Carved Stone / Parchment Action Ribbons */}
        <div className="w-full lg:w-56 flex flex-row lg:flex-col gap-2.5 shrink-0 overflow-x-auto pb-2 lg:pb-0">
          <button
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left font-serif text-sm font-bold tracking-wide cursor-pointer ${
              activeTab === "map"
                ? "bg-gradient-to-r from-amber-700/80 to-[#3b1d0e] border-amber-400/80 text-amber-100 shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                : "bg-[#221208]/80 border-[#4a2713]/60 text-amber-300/70 hover:bg-[#2e190b] hover:text-amber-200"
            }`}
          >
            <Compass className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="whitespace-nowrap">Nautical Map</span>
          </button>

          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-950/70 to-[#0e271a] border border-emerald-500/50 hover:border-emerald-400 text-emerald-200 transition-all text-left font-serif text-sm font-bold tracking-wide shadow-md hover:scale-[1.02] cursor-pointer"
          >
            <WhatsAppIcon className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="whitespace-nowrap">
              <span className="block leading-tight">WhatsApp HQ</span>
              <span className="text-[10px] font-mono text-emerald-400 font-normal">Hints & Alerts</span>
            </div>
          </button>

          <button
            onClick={() => handleIslandClick(activePuzzle)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#221208]/80 border border-[#4a2713]/60 hover:bg-[#2e190b] text-amber-200/90 transition-all text-left font-serif text-sm font-bold tracking-wide cursor-pointer"
          >
            <Key className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="whitespace-nowrap">Current Clue #{activePuzzle.orderIndex}</span>
          </button>

          <div className="mt-auto hidden lg:block p-3.5 rounded-2xl bg-[#1b0d06]/90 border border-amber-900/40 text-center">
            <div className="text-[10px] font-mono uppercase text-amber-400/70 tracking-wider">
              Expedition Progress
            </div>
            <div className="text-xl font-black text-amber-200 font-serif mt-1">
              3 / 12 Conquered
            </div>
            <div className="w-full bg-[#351a0c] h-2 rounded-full mt-2 overflow-hidden border border-amber-900/60">
              <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full w-1/4 rounded-full" />
            </div>
          </div>
        </div>

        {/* CENTER: PINNED PARCHMENT MAP */}
        <div className="relative flex-1 min-h-[580px] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_0_60px_rgba(30,15,8,0.5)] border-4 border-[#3a1d0d]">
          {/* Parchment Base Texture */}
          <div
            className="absolute inset-0 bg-[#e8d2a2]"
            style={{
              backgroundImage: `url('/images/hunt/parchment_tile.jpg')`,
              backgroundSize: "cover",
              filter: "contrast(105%) brightness(98%)",
            }}
          />

          {/* Antique Vignette & Deckle Border Shadow */}
          <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(40,20,10,0.7)] pointer-events-none z-10" />

          {/* 4 Corner Heavy Rusty Iron Tacks pinning the map to the desk */}
          <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-gradient-to-br from-[#774422] to-[#221105] border-2 border-[#1a0a03] shadow-[0_4px_8px_rgba(0,0,0,0.8)] z-30" />
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-[#774422] to-[#221105] border-2 border-[#1a0a03] shadow-[0_4px_8px_rgba(0,0,0,0.8)] z-30" />
          <div className="absolute bottom-3 left-3 w-6 h-6 rounded-full bg-gradient-to-br from-[#774422] to-[#221105] border-2 border-[#1a0a03] shadow-[0_4px_8px_rgba(0,0,0,0.8)] z-30" />
          <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-[#774422] to-[#221105] border-2 border-[#1a0a03] shadow-[0_4px_8px_rgba(0,0,0,0.8)] z-30" />

          {/* Ocean waves / cartographic contour lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#7c2d12_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          {/* Decorative Sea Monster & Compass Inks */}
          <div className="absolute top-6 left-8 pointer-events-none opacity-40 select-none z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hunt/decor/ink_compass_rose.png"
              alt="Compass Rose"
              className="w-24 h-24 object-contain"
            />
          </div>

          <div className="absolute bottom-10 right-8 pointer-events-none opacity-30 select-none z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hunt/decor/ink_sea_serpent.png"
              alt="Sea Serpent"
              className="w-36 h-28 object-contain"
            />
          </div>

          {/* Title Cartouche */}
          <div className="absolute top-6 right-8 text-right z-20 pointer-events-none select-none">
            <h2 className="font-serif font-black text-2xl text-[#3b1c09] tracking-widest drop-shadow-sm">
              THE GRAND LINE
            </h2>
            <p className="font-mono text-[10px] text-[#78350f] font-bold uppercase tracking-wider">
              Charted by {teamName}
            </p>
          </div>

          {/* SVG Dotted Route Lines across Islands */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-15">
            <path
              d="M 120 180 Q 250 140 380 230 T 640 280 T 450 460"
              fill="none"
              stroke="#7c2d12"
              strokeWidth="4"
              strokeDasharray="8 6"
              strokeLinecap="round"
              opacity="0.65"
            />
          </svg>

          {/* Island Checkpoints on the map */}
          {/* Island 1: Loguetown (Solved) */}
          <div
            onClick={() => handleIslandClick(puzzles[0])}
            className="absolute top-[140px] left-[100px] z-20 cursor-pointer group flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-900/30 border-2 border-emerald-700 flex items-center justify-center p-1 group-hover:scale-110 transition-transform shadow-lg bg-[#dfc596]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hunt/node_solved.png"
                alt="Loguetown"
                className="w-full h-full object-contain"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-700 rounded-full p-0.5 border border-yellow-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <span className="mt-1 px-2 py-0.5 rounded bg-[#3c1d0a]/90 text-[#f5e6ca] text-[10px] font-serif font-bold border border-[#783e18]">
              #1 Loguetown
            </span>
          </div>

          {/* Island 2: Reverse Mountain (Solved) */}
          <div
            onClick={() => handleIslandClick(puzzles[1])}
            className="absolute top-[180px] left-[340px] z-20 cursor-pointer group flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-900/30 border-2 border-emerald-700 flex items-center justify-center p-1 group-hover:scale-110 transition-transform shadow-lg bg-[#dfc596]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hunt/node_solved.png"
                alt="Reverse Mountain"
                className="w-full h-full object-contain"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-700 rounded-full p-0.5 border border-yellow-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <span className="mt-1 px-2 py-0.5 rounded bg-[#3c1d0a]/90 text-[#f5e6ca] text-[10px] font-serif font-bold border border-[#783e18]">
              #2 Mountain
            </span>
          </div>

          {/* Island 4: Little Garden (ACTIVE - Player Anchored!) */}
          <div
            onClick={() => handleIslandClick(activePuzzle)}
            className="absolute top-[240px] left-[580px] z-25 cursor-pointer group flex flex-col items-center"
          >
            {/* Bobbing Player Ship on active island */}
            <motion.div
              animate={{ y: [-5, 5, -5], rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute -top-16 flex flex-col items-center pointer-events-none"
            >
              <div className="w-14 h-14 drop-shadow-[0_8px_12px_rgba(0,0,0,0.7)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/hunt/ship_player.png"
                  alt="Player Ship"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[9px] font-mono shadow-[0_0_10px_#f59e0b]">
                ANCHORED ⚓
              </span>
            </motion.div>

            {/* Glowing Active Ring */}
            <div className="absolute -inset-3 rounded-full bg-amber-500/30 blur-md animate-pulse" />

            <div className="relative w-18 h-18 rounded-full bg-gradient-to-br from-amber-600 to-amber-900 border-3 border-yellow-300 flex items-center justify-center p-2 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.6)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hunt/node_active.png"
                alt="Active Island"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="mt-1 px-2.5 py-1 rounded bg-[#b45309] text-white text-[11px] font-serif font-black shadow-md border border-yellow-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-300 animate-spin" />
              #4 Little Garden
            </span>
          </div>

          {/* Island 5: Drum Rock (Locked Scroll) */}
          <div
            onClick={() => handleIslandClick(puzzles[4])}
            className="absolute top-[410px] left-[410px] z-20 cursor-not-allowed group flex flex-col items-center opacity-85"
          >
            <div className="w-14 h-14 rounded-full bg-[#52331c]/50 border-2 border-[#7c4424] flex items-center justify-center p-1.5 shadow-md bg-[#cbb284]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hunt/node_locked.png"
                alt="Locked Island"
                className="w-full h-full object-contain grayscale-[30%]"
              />
              <div className="absolute -bottom-1 -right-1 bg-[#2b170c] rounded-full p-0.5 border border-amber-900">
                <Lock className="w-3.5 h-3.5 text-amber-300/80" />
              </div>
            </div>
            <span className="mt-1 px-2 py-0.5 rounded bg-[#2e160a]/90 text-amber-200/60 text-[10px] font-serif font-bold">
              #5 Drum Rock (Locked)
            </span>
          </div>

          {/* Hint Overlay Alert Box on Map */}
          <div className="absolute bottom-4 left-6 z-20 max-w-sm p-3 rounded-2xl bg-[#261308]/95 border-2 border-amber-500/50 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Captain&apos;s Dispatch:</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-100/80 leading-snug">
              Click on anchored island <strong>#4 Little Garden</strong> to inspect clues, or check the WhatsApp group where hints are dropping!
            </p>
          </div>
        </div>

        {/* RIGHT HUD: Crew Vitals & WhatsApp Feed (from Image 1 right widgets) */}
        <div className="w-full lg:w-64 flex flex-col gap-4 shrink-0">
          {/* Crew Status Box */}
          <div className="p-4 rounded-2xl bg-[#1b0e07]/90 border-2 border-[#452414] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#442211] pb-2 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400/90 font-bold">
                Crew Vitals
              </span>
              <span className="text-xs text-emerald-400 font-mono font-bold">2 Active</span>
            </div>

            {/* Companion Card 1 */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#29150b]/80 border border-[#522a15] mb-2.5">
              <div className="w-10 h-10 rounded-full bg-amber-600/30 border border-amber-400/50 flex items-center justify-center font-serif font-bold text-amber-200">
                CP
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs font-bold text-amber-100">
                  <span className="truncate">Captain (You)</span>
                  <span className="text-[10px] text-emerald-400">On Clue #4</span>
                </div>
                <div className="w-full bg-[#150a04] h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full w-full rounded-full" />
                </div>
              </div>
            </div>

            {/* Companion Card 2 */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#29150b]/80 border border-[#522a15]">
              <div className="w-10 h-10 rounded-full bg-amber-600/30 border border-amber-400/50 flex items-center justify-center font-serif font-bold text-amber-200">
                NV
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs font-bold text-amber-100">
                  <span className="truncate">Navigator</span>
                  <span className="text-[10px] text-amber-400">Deciphering</span>
                </div>
                <div className="w-full bg-[#150a04] h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-amber-400 h-full w-4/5 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Dedicated Live Station (Image 1 style interactive gadget) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c2619] via-[#091b12] to-[#0e2c1c] border-2 border-emerald-500/50 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <WhatsAppIcon className="w-5 h-5 text-emerald-400" />
              <span className="font-serif font-bold text-xs text-white">
                WhatsApp Dispatch
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80 leading-relaxed mb-3">
              Hints & announcements are dropped periodically in our official WhatsApp crew group.
            </p>
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-black text-xs uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Join WhatsApp Group</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. BOTTOM DOCK BAR: Ornate Medallion Action Shelf (Image 1 Bottom Dock)
         ========================================================================= */}
      <div className="relative z-30 w-full flex justify-center py-4 bg-gradient-to-t from-[#110804] via-[#1a0e07] to-transparent border-t border-[#3a1d0d]">
        <div className="flex items-center gap-3 sm:gap-6 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#29150b] via-[#3a1e10] to-[#29150b] border-2 border-amber-600/60 shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
          {/* Dock Button 1: WhatsApp HQ */}
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="flex flex-col items-center gap-1 group cursor-pointer"
            title="WhatsApp Group Hints"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-b from-emerald-500 to-teal-800 border-2 border-emerald-300 flex items-center justify-center text-white shadow-[0_0_12px_rgba(16,185,129,0.5)] group-hover:scale-110 transition-transform">
              <WhatsAppIcon className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-mono uppercase text-emerald-300 font-bold">Hints HQ</span>
          </button>

          {/* Dock Button 2: Current Clue */}
          <button
            onClick={() => handleIslandClick(activePuzzle)}
            className="flex flex-col items-center gap-1 group cursor-pointer"
            title="Open Active Clue"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-b from-amber-600 to-[#42210e] border-2 border-yellow-400 flex items-center justify-center text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.4)] group-hover:scale-110 transition-transform">
              <Key className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-mono uppercase text-amber-300 font-bold">Clue #4</span>
          </button>

          {/* Dock Button 3: Logbook */}
          <button
            onClick={() => handleIslandClick(puzzles[0])}
            className="flex flex-col items-center gap-1 group cursor-pointer"
            title="Expedition Logbook"
          >
            <div className="w-12 h-12 rounded-full bg-[#27140a] border-2 border-amber-700/60 flex items-center justify-center text-amber-300/80 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-mono uppercase text-amber-400/60">Logbook</span>
          </button>

          {/* Dock Button 4: Booty / Points */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-[#27140a] border-2 border-amber-700/60 flex items-center justify-center text-amber-300/80">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-[9px] font-mono uppercase text-amber-400/60">6,448 PTS</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. HORIZONTAL PARCHMENT PROCLAMATION SCROLL MODAL (Image 1 Center Banner)
         ========================================================================= */}
      <AnimatePresence>
        {selectedPuzzle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[#ebd5a7] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] border-4 border-[#522912] p-6 sm:p-8 text-[#2e170a]"
              style={{
                backgroundImage: `url('/images/hunt/parchment_tile.jpg')`,
                backgroundSize: "cover",
              }}
            >
              {/* Top Wooden Spindle Bar */}
              <div className="absolute -top-4 left-6 right-6 h-5 rounded-full bg-gradient-to-r from-[#3b1c0b] via-[#633519] to-[#3b1c0b] border-2 border-[#1c0c04] shadow-md" />
              {/* Bottom Wooden Spindle Bar */}
              <div className="absolute -bottom-4 left-6 right-6 h-5 rounded-full bg-gradient-to-r from-[#3b1c0b] via-[#633519] to-[#3b1c0b] border-2 border-[#1c0c04] shadow-md" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedPuzzle(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-[#422210] hover:bg-[#5e3118] text-[#fbebd0] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Cartouche */}
              <div className="text-center space-y-1 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#4b2611] text-[#f8ecd5] text-xs font-mono font-bold uppercase tracking-wider">
                  <span>Island Level #{selectedPuzzle.orderIndex}</span>
                  <span>•</span>
                  <span>{selectedPuzzle.basePoints} Points</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black font-serif text-[#321607] tracking-wide">
                  {selectedPuzzle.title}
                </h3>
              </div>

              {/* Puzzle Clue Body */}
              <div className="p-4 rounded-xl bg-[#ddc493]/60 border border-[#9b683d]/40 mb-4 font-serif text-sm sm:text-base leading-relaxed text-[#2c1507]">
                <p>{selectedPuzzle.description}</p>
              </div>

              {/* WHATSAPP HINT DISPATCH CALLOUT INSIDE THE CLUE */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0c2b1d] to-[#071d13] border-2 border-emerald-500/60 text-white mb-5 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <WhatsAppIcon className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                      Looking for clues or stuck?
                    </div>
                    <div className="text-xs text-emerald-100 font-sans">
                      Hints for this island are broadcasted in the WhatsApp crew group!
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowWhatsAppModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider shrink-0 transition-transform hover:scale-105 cursor-pointer"
                >
                  Join HQ
                </button>
              </div>

              {/* Answer Submission Form */}
              <form onSubmit={handleAnswerSubmit} className="space-y-3">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#492714]">
                  Enter Cipher Answer:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your deciphered coordinates..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#fff8eb] border-2 border-[#6a391a] text-[#221006] placeholder-[#8d674b] font-mono text-sm focus:outline-none focus:border-amber-600 shadow-inner"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-serif font-black tracking-wider uppercase text-sm shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Submit
                  </button>
                </div>
              </form>

              {/* Feedback toast */}
              {feedbackMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-2.5 rounded-lg bg-[#2e170a] text-[#fdebd0] text-xs font-mono text-center font-bold"
                >
                  {feedbackMessage}
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WHATSAPP MODAL POPUP */}
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
