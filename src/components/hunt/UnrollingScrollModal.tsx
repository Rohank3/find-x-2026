"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Film,
} from "lucide-react";
import dynamic from "next/dynamic";

const ForensicImageViewer = dynamic(() => import("./ForensicImageViewer"), {
  ssr: false,
  loading: () => (
    <div className="h-48 rounded-xl bg-black/40 border border-[#542d17] animate-pulse flex items-center justify-center text-amber-300 font-mono text-xs">
      Loading Forensic Optics...
    </div>
  ),
});

const SecurePdfViewer = dynamic(() => import("./SecurePdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="h-48 rounded-xl bg-black/40 border border-[#542d17] animate-pulse flex items-center justify-center text-amber-300 font-mono text-xs">
      Loading Admiralty Manuscript...
    </div>
  ),
});

const AudioVisualizer = dynamic(() => import("./AudioVisualizer"), {
  ssr: false,
  loading: () => (
    <div className="h-32 rounded-xl bg-black/40 border border-[#542d17] animate-pulse flex items-center justify-center text-amber-300 font-mono text-xs">
      Initializing Sonar Frequencies...
    </div>
  ),
});

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
  assets?: Array<{
    id: string;
    title?: string | null;
    url: string;
    type: string;
  }>;
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
  const [selectedEvidenceIdx, setSelectedEvidenceIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const evidenceList =
    landmark.assets && landmark.assets.length > 0
      ? landmark.assets
      : landmark.assetUrl
      ? [
          {
            id: `legacy-${landmark.id}`,
            title: "Primary Evidence",
            url: landmark.assetUrl,
            type: (landmark.assetType || "image").toLowerCase(),
          },
        ]
      : [];
  const safeEvidenceIdx = Math.min(selectedEvidenceIdx, Math.max(0, evidenceList.length - 1));
  const currentEvidence = evidenceList[safeEvidenceIdx];

  const theme = REALM_THEMES[realmId] || REALM_THEMES[1];
  const isLockedOut = lockoutRemaining > 0;

  // Allow closing the unrolled proclamation modal using the Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Bring cursor into the text box on mount if active/unsolved
  useEffect(() => {
    if (!landmark.isSolved && !isLockedOut) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [landmark.id, landmark.isSolved, isLockedOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isLockedOut || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await onSubmitAnswer(answer.trim());
      if (res && res.success === false) {
        setSubmitError(res.message || res.error || "Incorrect cipher.");
        // Bring text cursor back to the text box and highlight text for correction
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
          }
        }, 50);
      }
    } catch {
      setSubmitError("Submission failed. Check connection and retry.");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
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
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative w-full max-w-3xl my-auto flex flex-col items-center origin-center select-none"
      >
        {/* TOP WOODEN CARVED ROLLER SPINDLE */}
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-30 w-full max-w-[96%] flex items-center justify-center -mb-2 sm:-mb-4 pointer-events-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hunt/scroll_roller_top.webp"
            alt="Scroll Header Spindle"
            className="w-full h-auto max-h-8 sm:max-h-16 md:max-h-20 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)]"
          />
        </motion.div>

        {/* UNROLLED PARCHMENT MANUSCRIPT BODY */}
        <div
          className="relative z-20 w-full rounded-2xl bg-[#f4e4c1] border-x-4 border-[#3e1f0e] shadow-[0_25px_60px_rgba(0,0,0,0.95)] px-3.5 py-5 sm:px-10 sm:py-9 text-[#241206] max-h-[82dvh] sm:max-h-[76vh] overflow-y-auto custom-scrollbar"
          style={{
            backgroundImage: `url('/images/hunt/parchment_tile.jpg')`,
            backgroundSize: "cover",
            boxShadow:
              "inset 0 0 45px rgba(60,25,8,0.35), 0 20px 50px rgba(0,0,0,0.9)",
          }}
        >
          {/* Close Wax Seal Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-40 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#321609] hover:bg-[#522510] text-[#ffedd5] border border-amber-600/50 transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-lg"
            title="Roll up scroll"
            aria-label="Close Scroll"
          >
            <X className="w-5 h-5" />
          </button>

          {/* REALM THEMATIC HERALDRY & WAX SEAL CREST */}
          <div className="flex flex-col items-center text-center space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
            <div className="relative group">
              {/* Embossed Realm Wax Medallion */}
              <div
                className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${theme.sealBg} border-2 sm:border-3 ${theme.sealBorder} ${theme.sealGlow} flex items-center justify-center p-1.5 sm:p-2 shadow-2xl relative transition-transform group-hover:scale-105`}
              >
                <div className="absolute inset-1 rounded-full border border-dashed border-amber-300/40 pointer-events-none" />
                <div className="transform scale-75 sm:scale-100 flex items-center justify-center">
                  {theme.sealIcon}
                </div>
              </div>
            </div>

            {/* Realm & Order Badge */}
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-[#2a1306]/85 border border-[#6b3515] text-[#fed7aa] shadow">
              <span className="text-[9px] sm:text-xs font-mono font-black uppercase tracking-widest text-[#fbbf24]">
                Waypoint #{landmark.orderIndex}
              </span>
              <span className="text-amber-500">•</span>
              <span className="text-[9px] sm:text-xs font-serif font-bold tracking-wide">
                {landmark.region}
              </span>
              <span className="text-amber-500">•</span>
              <span className="text-[9px] sm:text-xs font-mono font-bold text-amber-300">
                {landmark.bountyPoints} BOUNTY PTS
              </span>
            </div>

            {/* Landmark Title */}
            <h1 className="text-xl sm:text-3xl md:text-4xl font-black font-serif text-[#291206] tracking-wide drop-shadow-sm max-w-xl leading-tight">
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
          <div className="relative mb-4 sm:mb-6 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl bg-[#eeddbb]/85 border-2 border-[#9b683d]/60 shadow-[inset_0_2px_12px_rgba(80,35,10,0.18)]">
            <h3 className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-[#723b18] mb-1.5 sm:mb-2">
              Expedition Lore & Cryptic Dispatch
            </h3>
            <p className="font-serif text-sm sm:text-base md:text-lg leading-relaxed text-[#2c1507] whitespace-pre-line font-medium selection:bg-amber-800 selection:text-white">
              {landmark.description}
            </p>
          </div>

          {/* ATTACHED DISPATCH ASSETS (If present) */}
          {evidenceList.length > 0 && currentEvidence && (
            <div className="mb-6 p-4 rounded-2xl bg-[#30160a]/90 border-2 border-[#6f3b1b] text-amber-100 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  {currentEvidence.type.toLowerCase() === "audio" ? (
                    <Volume2 className="w-4 h-4 text-amber-400" />
                  ) : currentEvidence.type.toLowerCase() === "pdf" ? (
                    <FileText className="w-4 h-4 text-amber-400" />
                  ) : currentEvidence.type.toLowerCase() === "video" ? (
                    <Film className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                  )}
                  Evidence Dossier: {currentEvidence.title || currentEvidence.type.toUpperCase()}
                  {evidenceList.length > 1 && (
                    <span className="text-[10px] text-amber-400/80 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-600/40">
                      {safeEvidenceIdx + 1} / {evidenceList.length}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setViewAttachment((prev) => !prev)}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-serif font-black text-xs uppercase tracking-wider shadow cursor-pointer transition-transform hover:scale-105"
                >
                  {viewAttachment ? "Hide Evidence" : "Inspect Evidence"}
                </button>
              </div>

              {/* Multi-Evidence Switcher Tabs if > 1 */}
              {viewAttachment && evidenceList.length > 1 && (
                <div className="flex flex-wrap gap-1.5 pb-3 mb-2 border-b border-[#542d17]">
                  {evidenceList.map((ev, idx) => {
                    const isSelected = idx === safeEvidenceIdx;
                    return (
                      <button
                        key={ev.id || idx}
                        type="button"
                        onClick={() => setSelectedEvidenceIdx(idx)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-400 text-black shadow-sm"
                            : "bg-[#180e07] text-amber-300/80 hover:text-amber-100 border border-[#542d17]"
                        }`}
                      >
                        {ev.title || `Item #${idx + 1} (${ev.type.toUpperCase()})`}
                      </button>
                    );
                  })}
                </div>
              )}

              {viewAttachment && (
                <div className="pt-2">
                  {currentEvidence.type.toLowerCase().startsWith("image") && (
                    <ForensicImageViewer src={currentEvidence.url} alt={currentEvidence.title || landmark.title} />
                  )}
                  {currentEvidence.type.toLowerCase().includes("pdf") && (
                    <SecurePdfViewer src={currentEvidence.url} />
                  )}
                  {currentEvidence.type.toLowerCase().startsWith("audio") && (
                    <AudioVisualizer src={currentEvidence.url} />
                  )}
                  {currentEvidence.type.toLowerCase().startsWith("video") && (
                    <video controls className="w-full h-auto max-h-[500px] rounded-lg" src={currentEvidence.url} />
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

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  ref={inputRef}
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
                  className="flex-1 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-[#fffcf5] border-2 border-[#6f3b1b] text-[#241207] placeholder-[#8c6143] font-mono text-base sm:text-sm focus:outline-none focus:border-amber-600 shadow-inner disabled:opacity-50 min-h-[44px]"
                />
                <button
                  type="submit"
                  disabled={isLockedOut || !answer.trim() || isSubmitting}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-red-700 via-rose-700 to-red-800 hover:from-red-600 hover:to-rose-600 text-white font-serif font-black tracking-wider uppercase text-xs sm:text-sm shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed border border-rose-400/50 flex items-center justify-center gap-2 min-h-[44px]"
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
          className="relative z-30 w-full max-w-[96%] flex items-center justify-center -mt-2 sm:-mt-4 pointer-events-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hunt/scroll_roller_bottom.webp"
            alt="Scroll Footer Spindle"
            className="w-full h-auto max-h-8 sm:max-h-16 md:max-h-20 object-contain drop-shadow-[0_-8px_20px_rgba(0,0,0,0.9)]"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
