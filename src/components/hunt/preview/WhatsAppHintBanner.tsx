"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, X, Sparkles } from "lucide-react";

interface WhatsAppHintBannerProps {
  inviteLink?: string;
  latestHintText?: string;
  variant?: "floating" | "banner" | "compact";
}

export const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413Z" />
  </svg>
);

export default function WhatsAppHintBanner({
  inviteLink = "https://chat.whatsapp.com/example-treasure-hunt",
  latestHintText = "Island #4: The giant's duel resets on the strike of midnight. Look at the coordinates near the smoking volcano!",
  variant = "floating",
}: WhatsAppHintBannerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showToast, setShowToast] = useState(false);

  const handleCopyOrOpen = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xl border border-emerald-400/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Open WhatsApp Clue Dispatch"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-200" />
        </span>
        <WhatsAppIcon className="w-4 h-4" />
        <span>WhatsApp Hints (Live)</span>
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
            <WhatsAppIcon className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="font-bold text-white uppercase tracking-wider text-[10px] block">
              Official Clue Dispatch
            </span>
            <span className="text-white/70 truncate block text-[11px]">
              Hints dropping live in WhatsApp group!
            </span>
          </div>
        </div>

        <a
          href={inviteLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] uppercase tracking-wider shrink-0 transition-all hover:scale-105"
        >
          <span>Join HQ</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="w-full relative z-40">
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0d2218]/95 via-[#081810]/95 to-[#0b291d]/95 border-2 border-emerald-500/40 p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-xl overflow-hidden">
        {/* Top Gold & Emerald Trim Accent */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left Icon + Broadcast Text */}
          <div className="flex items-start gap-3.5">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] shrink-0 border border-emerald-300/40">
              <WhatsAppIcon className="w-6 h-6 fill-white" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-300 border-2 border-[#0d2218]" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 font-mono bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30">
                  Crew WhatsApp Transponder
                </span>
                <span className="text-white/40 text-xs">•</span>
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 font-mono">
                  <Sparkles className="w-3 h-3" /> Live Hint Drop Zone
                </span>
              </div>

              <p className="mt-1 text-xs sm:text-sm text-emerald-100/90 font-sans font-medium leading-relaxed">
                <strong className="text-amber-300 font-bold">Latest Clue: </strong>
                &ldquo;{latestHintText}&rdquo;
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
            <a
              href={inviteLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCopyOrOpen}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-black font-sans font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(52,211,153,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <WhatsAppIcon className="w-4 h-4 fill-black" />
              <span>Join Crew Group</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title="Minimize WhatsApp banner"
              aria-label="Minimize banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Copy Notification Toast */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 text-[11px] text-emerald-300 font-mono bg-emerald-950/70 p-2 rounded-lg border border-emerald-500/30 text-center"
            >
              Opening WhatsApp group! Make sure your notifications are enabled to catch real-time hints.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
