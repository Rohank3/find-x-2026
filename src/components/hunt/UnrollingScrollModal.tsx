"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Key,
  Lock,
  CheckCircle2,
  Sparkles,
  Anchor,
  Sun,
  Snowflake,
  Eye,
  FileText,
  Volume2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import ForensicImageViewer from "./ForensicImageViewer";
import SecurePdfViewer from "./SecurePdfViewer";
import AudioVisualizer from "./AudioVisualizer";

export interface LandmarkData {
  id: string;
  orderIndex: number;
  landmarkType:
    | "haven"
    | "canal"
    | "pass"
    | "caldera"
    | "citadel"
    | "crypt"
    | "strait"
    | "sky_reef"
    | "abyss";
  title: string;
  region: string;
  description: string;
  bountyPoints: number;
  isSolved: boolean;
  isActive: boolean;
  isLocked: boolean;
  assetUrl?: string | null;
  assetType?: string | null;
  hints: Array<{
    id: string;
    orderIndex: number;
    penalty: number;
    isUnlocked: boolean;
    content?: string;
  }>;
  realmId?: number;
  realmOrderIndex?: number;
  waypointKey?: string;
  landmarkName?: string;
}

export interface ModalSubmitResult {
  success?: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

interface UnrollingScrollModalProps {
  landmark: LandmarkData;
  realmId?: number; // 1 to 7
  onClose: () => void;
  onSubmitAnswer: (answer: string) => Promise<ModalSubmitResult | void> | void;
  onUnlockHint?: (hintId: string) => void;
  lockoutRemaining?: number;
  hintsEnabled?: boolean;
}

// Realm Thematic Config for all 7 campaign realms
const REALM_THEMES: Record<
  number,
  {
    name: string;
    sealBorder: string;
    sealBg: string;
    sealGlow: string;
    sealIcon: React.ReactNode;
    bannerGradient: string;
    primaryAccent: string;
    borderTrim: string;
  }
> = {
  1: {
    name: "Chapter I: Coastal Haven",
    sealBorder: "border-[#d4af37]",
    sealBg: "from-[#0d3b36] via-[#092622] to-[#041412]",
    sealGlow: "shadow-[0_0_25px_rgba(20,184,166,0.5)]",
    sealIcon: <Anchor className="w-8 h-8 text-amber-300 drop-shadow" />,
    bannerGradient: "from-teal-950/80 via-emerald-900/60 to-teal-950/80",
    primaryAccent: "text-teal-300",
    borderTrim: "border-teal-700/60",
  },
  2: {
    name: "Chapter II: Realms of Aethelia",
    sealBorder: "border-yellow-400",
    sealBg: "from-[#2e1d05] via-[#1a0f02] to-[#0d0701]",
    sealGlow: "shadow-[0_0_25px_rgba(234,179,8,0.5)]",
    sealIcon: <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />,
    bannerGradient: "from-amber-950/80 via-yellow-950/60 to-amber-950/80",
    primaryAccent: "text-yellow-300",
    borderTrim: "border-yellow-700/60",
  },
  3: {
    name: "Chapter III: Sunken Canyon of Khemet",
    sealBorder: "border-amber-500",
    sealBg: "from-[#522507] via-[#3a1804] to-[#1c0b02]",
    sealGlow: "shadow-[0_0_25px_rgba(245,158,11,0.5)]",
    sealIcon: <Sun className="w-8 h-8 text-yellow-300 animate-pulse" />,
    bannerGradient: "from-amber-950/80 via-orange-950/60 to-amber-950/80",
    primaryAccent: "text-amber-300",
    borderTrim: "border-amber-700/60",
  },
  4: {
    name: "Chapter IV: Primeval Volcano & Fire Ridge",
    sealBorder: "border-red-500",
    sealBg: "from-[#450a0a] via-[#2a0606] to-[#120202]",
    sealGlow: "shadow-[0_0_25px_rgba(239,68,68,0.5)]",
    sealIcon: <Sparkles className="w-8 h-8 text-rose-400 animate-pulse" />,
    bannerGradient: "from-red-950/80 via-rose-950/60 to-red-950/80",
    primaryAccent: "text-rose-300",
    borderTrim: "border-red-700/60",
  },
  5: {
    name: "Chapter V: Frozen Rock Citadel",
    sealBorder: "border-cyan-300",
    sealBg: "from-[#0a273b] via-[#061824] to-[#030d14]",
    sealGlow: "shadow-[0_0_25px_rgba(56,189,248,0.5)]",
    sealIcon: <Snowflake className="w-8 h-8 text-cyan-200 animate-pulse" />,
    bannerGradient: "from-sky-950/80 via-cyan-950/60 to-sky-950/80",
    primaryAccent: "text-cyan-300",
    borderTrim: "border-cyan-700/60",
  },
  6: {
    name: "Chapter VI: Sunken Aqueduct & Water Metropolis",
    sealBorder: "border-blue-400",
    sealBg: "from-[#082f49] via-[#041c2c] to-[#020d14]",
    sealGlow: "shadow-[0_0_25px_rgba(14,165,233,0.5)]",
    sealIcon: <Anchor className="w-8 h-8 text-sky-300 drop-shadow" />,
    bannerGradient: "from-blue-950/80 via-sky-950/60 to-blue-950/80",
    primaryAccent: "text-sky-300",
    borderTrim: "border-sky-700/60",
  },
  7: {
    name: "Chapter VII: The Abyssal Rift & Void Horizon",
    sealBorder: "border-purple-400",
    sealBg: "from-[#2e0854] via-[#1c0436] to-[#0d011c]",
    sealGlow: "shadow-[0_0_30px_rgba(168,85,247,0.6)]",
    sealIcon: <Eye className="w-8 h-8 text-purple-200 animate-bounce" />,
    bannerGradient: "from-purple-950/80 via-indigo-950/60 to-purple-950/80",
    primaryAccent: "text-purple-300",
    borderTrim: "border-purple-700/60",
  },
};

export default function UnrollingScrollModal({
  landmark,
  realmId = 1,
  onClose,
  onSubmitAnswer,
  onUnlockHint,
  lockoutRemaining = 0,
  hintsEnabled = false,
}: UnrollingScrollModalProps) {
  const [answer, setAnswer] = useState("");
  const [viewAttachment, setViewAttachment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const theme = REALM_THEMES[realmId] || REALM_THEMES[1];
  const isLockedOut = lockoutRemaining > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isLockedOut || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await onSubmitAnswer(answer.trim());
      if (res && res.success === false) {
        setSubmitError(res.message || res.error || "Incorrect cipher.");
      }
    } catch {
      setSubmitError("Submission failed. Check connection and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Background Dimmer Dismiss */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* MECHANICAL VERTICAL SCROLL UNROLLING CONTAINER */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0.05 }}
        animate={{ opacity: 1, scaleY: 1 }}
        exit={{ opacity: 0, scaleY: 0.05 }}
        transition={{
          duration: 0.55,
          ease: [0.16, 1, 0.3, 1], // Smooth physics-based unrolling curve
        }}
        className="relative w-full max-w-3xl my-auto flex flex-col items-center origin-center select-none"
      >
        {/* TOP WOODEN CARVED ROLLER SPINDLE */}
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-30 w-full max-w-[96%] flex items-center justify-center -mb-3 sm:-mb-4 pointer-events-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hunt/scroll_roller_top.webp"
            alt="Scroll Header Spindle"
            className="w-full h-auto max-h-16 sm:max-h-20 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)]"
          />
        </motion.div>

        {/* UNROLLED PARCHMENT MANUSCRIPT BODY */}
        <div
          className="relative z-20 w-full rounded-2xl bg-[#f4e4c1] border-x-4 border-[#3e1f0e] shadow-[0_25px_60px_rgba(0,0,0,0.95)] px-4 py-6 sm:px-10 sm:py-9 text-[#241206] max-h-[75vh] overflow-y-auto custom-scrollbar"
          style={{
            backgroundImage: `url('/images/hunt/parchment_tile.jpg')`,
            backgroundSize: "cover",
            boxShadow:
              "inset 0 0 45px rgba(60,25,8,0.35), 0 20px 50px rgba(0,0,0,0.9)",
          }}
        >
          {/* Close Wax Seal Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-40 p-2 sm:p-2.5 rounded-full bg-[#321609] hover:bg-[#522510] text-[#ffedd5] border border-amber-600/50 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
            title="Roll up scroll"
          >
            <X className="w-5 h-5" />
          </button>

          {/* REALM THEMATIC HERALDRY & WAX SEAL CREST */}
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <div className="relative group">
              {/* Embossed Realm Wax Medallion */}
              <div
                className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${theme.sealBg} border-3 ${theme.sealBorder} ${theme.sealGlow} flex items-center justify-center p-2 shadow-2xl relative transition-transform group-hover:scale-105`}
              >
                {/* Outer Filigree Ring */}
                <div className="absolute inset-1 rounded-full border border-dashed border-amber-300/40 pointer-events-none" />
                {theme.sealIcon}
              </div>
            </div>

            {/* Realm & Order Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2a1306]/85 border border-[#6b3515] text-[#fed7aa] shadow">
              <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-widest text-[#fbbf24]">
                Waypoint #{landmark.orderIndex}
              </span>
              <span className="text-amber-500">•</span>
              <span className="text-[10px] sm:text-xs font-serif font-bold tracking-wide">
                {landmark.region}
              </span>
              <span className="text-amber-500">•</span>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-300">
                {landmark.bountyPoints} BOUNTY PTS
              </span>
            </div>

            {/* Landmark Title */}
            <h1 className="text-2xl sm:text-4xl font-black font-serif text-[#291206] tracking-wide drop-shadow-sm max-w-xl">
              {landmark.title}
            </h1>

            {/* Status Stamp */}
            {landmark.isSolved ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/80 text-emerald-100 font-mono text-xs font-bold shadow">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Breached & Conquered
              </div>
            ) : landmark.isActive ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-800/80 border border-amber-500/80 text-amber-100 font-mono text-xs font-bold shadow">
                <Sparkles className="w-4 h-4 text-yellow-300 animate-spin-slow" />
                Active Voyage Expedition
              </div>
            ) : null}
          </div>

          {/* LORE & CLUE PROCLAMATION CONTAINER */}
          <div className="relative mb-6 p-5 sm:p-6 rounded-2xl bg-[#eeddbb]/85 border-2 border-[#9b683d]/60 shadow-[inset_0_2px_12px_rgba(80,35,10,0.18)]">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#723b18] mb-2">
              Expedition Lore & Cryptic Dispatch
            </h3>
            <p className="font-serif text-base sm:text-lg leading-relaxed text-[#2c1507] whitespace-pre-line font-medium selection:bg-amber-800 selection:text-white">
              {landmark.description}
            </p>
          </div>

          {/* ATTACHED DISPATCH ASSET (If present) */}
          {landmark.assetUrl && (
            <div className="mb-6 p-4 rounded-2xl bg-[#30160a]/90 border-2 border-[#6f3b1b] text-amber-100 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  {landmark.assetType === "AUDIO" ? (
                    <Volume2 className="w-4 h-4 text-amber-400" />
                  ) : landmark.assetType === "PDF" ? (
                    <FileText className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                  )}
                  Evidence Dossier: {landmark.assetType || "FILE"}
                </span>
                <button
                  onClick={() => setViewAttachment((prev) => !prev)}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-serif font-black text-xs uppercase tracking-wider shadow cursor-pointer transition-transform hover:scale-105"
                >
                  {viewAttachment ? "Hide Evidence" : "Inspect Evidence"}
                </button>
              </div>

              {viewAttachment && (
                <div className="pt-2 border-t border-[#542d17]">
                  {landmark.assetType === "IMAGE" && (
                    <ForensicImageViewer src={landmark.assetUrl} alt={landmark.title} />
                  )}
                  {landmark.assetType === "PDF" && (
                    <SecurePdfViewer src={landmark.assetUrl} />
                  )}
                  {landmark.assetType === "AUDIO" && (
                    <AudioVisualizer src={landmark.assetUrl} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* IN-GAME NAVIGATOR LOGBOOK (CLUES & HINTS - CONDITIONED ON hintsEnabled) */}
          {hintsEnabled && landmark.hints.length > 0 && (
            <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#281308]/95 border-2 border-[#6a3517] text-[#ffedd5] shadow-xl">
              <div className="flex items-center justify-between border-b border-[#522912] pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span className="font-serif font-black text-sm text-[#fef3c7] tracking-wide">
                    Navigator&apos;s Field Logs
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400/80 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-600/40">
                  {landmark.hints.filter((h) => h.isUnlocked).length} / {landmark.hints.length} Unsealed
                </span>
              </div>

              <div className="space-y-2.5">
                {landmark.hints.map((hint, idx) => (
                  <div
                    key={hint.id}
                    className="p-3.5 rounded-xl bg-[#1c0c05] border border-[#4d2611] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-amber-300 text-xs">
                        Clue #{idx + 1}
                      </span>
                      {hint.isUnlocked ? (
                        <span className="text-emerald-400 font-mono font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Deciphered
                        </span>
                      ) : (
                        <button
                          onClick={() => onUnlockHint && onUnlockHint(hint.id)}
                          className="px-3 py-1 rounded bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-serif font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow cursor-pointer transition-transform hover:scale-105 active:scale-95"
                        >
                          <Lock className="w-3 h-3 text-black" />
                          <span>Unseal (-{hint.penalty} PTS)</span>
                        </button>
                      )}
                    </div>
                    <p className="text-amber-100/90 font-serif text-xs sm:text-sm leading-relaxed">
                      {hint.isUnlocked
                        ? hint.content
                        : "Veiled in cryptic cipher. Unsealing will deduce penalty from your total bounty."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANSWER SUBMISSION SECTION (Only if active or unsolved) */}
          {!landmark.isSolved && (
            <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t-2 border-[#b08051]/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-black uppercase tracking-wider text-[#3d1e0c]">
                  Deciphered Bearing / Solution:
                </label>
                {isLockedOut ? (
                  <span className="text-[11px] font-mono text-red-700 font-extrabold animate-pulse">
                    Tumblers Jammed: {lockoutRemaining}s
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-[#6c3917]">
                    Exact match required
                  </span>
                )}
              </div>

              {submitError && (
                <div className="px-3.5 py-2 rounded-xl bg-red-950/90 border border-red-500/70 text-red-200 font-mono text-xs flex items-center gap-2 shadow">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    if (submitError) setSubmitError(null);
                  }}
                  disabled={isLockedOut || isSubmitting}
                  placeholder={
                    isLockedOut
                      ? "Lockout active. Await tumblers..."
                      : isSubmitting
                      ? "Transmitting cipher..."
                      : "Enter deciphered secret..."
                  }
                  className="flex-1 px-4 py-3 rounded-xl bg-[#fffcf5] border-2 border-[#6f3b1b] text-[#241207] placeholder-[#8c6143] font-mono text-sm focus:outline-none focus:border-amber-600 shadow-inner disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLockedOut || !answer.trim() || isSubmitting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-700 via-rose-700 to-red-800 hover:from-red-600 hover:to-rose-600 text-white font-serif font-black tracking-wider uppercase text-xs sm:text-sm shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed border border-rose-400/50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-rose-200" />
                      <span>Breaking Seal...</span>
                    </>
                  ) : (
                    <span>Break Seal</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* BOTTOM WOODEN CARVED ROLLER SPINDLE */}
        <motion.div
          initial={{ y: -80 }}
          animate={{ y: 0 }}
          exit={{ y: -80 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-30 w-full max-w-[96%] flex items-center justify-center -mt-3 sm:-mt-4 pointer-events-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hunt/scroll_roller_bottom.webp"
            alt="Scroll Footer Spindle"
            className="w-full h-auto max-h-16 sm:max-h-20 object-contain drop-shadow-[0_-8px_20px_rgba(0,0,0,0.9)]"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
