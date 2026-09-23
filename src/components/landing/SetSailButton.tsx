"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, X, Anchor, ShieldCheck } from "lucide-react";
import { parseIIITLEmail } from "@/lib/email";

/**
 * SetSailButton — high-end forged pirate CTA button that opens an
 * authentic "Board the Ship" login modal with full sign-in options
 * (Google OAuth, one-click sailor presets, custom IIITL email).
 */

export default function SetSailButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const [boarding, setBoarding] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  const handleGoogleLogin = () => {
    setBoarding(true);
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleDevLogin = (presetEmail: string, presetName: string) => {
    setBoarding(true);
    signIn("dev-mock-auth", {
      email: presetEmail,
      name: presetName,
      callbackUrl: "/dashboard",
    });
  };

  const handleCustomDevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    setBoarding(true);
    signIn("dev-mock-auth", {
      email: customEmail,
      name: customName || "Adventurer",
      callbackUrl: "/dashboard",
    });
  };

  const parsed = customEmail ? parseIIITLEmail(customEmail) : null;

  return (
    <>
      {/* 1. Main SET SAIL CTA Button */}
      <motion.button
        onClick={() => setModalOpen(true)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="group relative inline-flex items-center gap-3.5 rounded-full border-2 border-[#d97706] bg-gradient-to-b from-[#2a1005] via-[#1a0803] to-[#0d0301] px-9 py-3.5 shadow-[0_4px_14px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(251,191,36,0.35),inset_0_-2px_4px_rgba(0,0,0,0.8)] transition-all duration-200 hover:border-[#fbbf24] hover:shadow-[0_6px_20px_rgba(0,0,0,0.9),0_0_12px_rgba(217,119,6,0.35),inset_0_1px_2px_rgba(255,245,200,0.5)] overflow-hidden"
        aria-label="Set Sail — Open Sign In Options"
      >
        {/* Shimmer sweep effect contained inside the button */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-400/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

        {/* Pirate Compass Icon */}
        <Compass className="h-6 w-6 text-[#fbbf24] transition-transform duration-500 group-hover:rotate-45 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />

        {/* Button Label */}
        <span className="font-[family-name:var(--font-pirata-one)] text-2xl sm:text-3xl tracking-[0.16em] uppercase text-[#fff4d1] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          Set Sail
        </span>

        {/* Small gold skull badge */}
        <span className="text-[#fbbf24] text-xs transition-transform group-hover:translate-x-1">
          ⚓
        </span>
      </motion.button>

      {/* 2. Interactive "Board the Ship" Login Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !boarding && setModalOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md rounded-2xl border-2 border-amber-400/60 bg-[#0c1424]/95 p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.35)] text-left"
            >
              {/* Gold Top Trim Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setModalOpen(false)}
                disabled={boarding}
                className="absolute top-4 right-4 text-amber-300/70 hover:text-amber-200 transition p-1"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/10">
                  <Anchor className="h-6 w-6 text-amber-400" />
                </div>
                <h2 className="font-[family-name:var(--font-pirata-one)] text-3xl sm:text-4xl text-amber-300 tracking-[0.1em] uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                  Board the Ship
                </h2>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-200/60 mt-1">
                  Choose your passage, sailor
                </p>
              </div>

              {/* Primary Option: Google Sign-In */}
              <button
                onClick={handleGoogleLogin}
                disabled={boarding}
                className="w-full flex items-center justify-center gap-3 rounded-xl bg-white hover:bg-amber-50 text-gray-900 font-semibold py-3 px-4 shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 mb-5"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>{boarding ? "Weighing Anchor…" : "Continue with Google"}</span>
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-amber-400/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0c1424] px-2 font-mono text-[10px] text-amber-300/60 tracking-[0.2em]">
                    Or sailor access
                  </span>
                </div>
              </div>

              {/* Fast Dev / Sailor Presets */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => handleDevLogin("lit2026001@iiitl.ac.in", "Fresher Sailor")}
                  disabled={boarding}
                  className="rounded-lg border border-amber-400/30 bg-amber-950/40 p-2 text-center text-xs font-mono text-amber-200 hover:bg-amber-900/50 hover:border-amber-400/60 transition disabled:opacity-60"
                >
                  Fresher &apos;26
                </button>
                <button
                  type="button"
                  onClick={() => handleDevLogin("lit2024001@iiitl.ac.in", "Senior Quartermaster")}
                  disabled={boarding}
                  className="rounded-lg border border-amber-400/30 bg-amber-950/40 p-2 text-center text-xs font-mono text-amber-200 hover:bg-amber-900/50 hover:border-amber-400/60 transition disabled:opacity-60"
                >
                  Senior &apos;24
                </button>
                <button
                  type="button"
                  onClick={() => handleDevLogin("admin@iiitl.ac.in", "The Commodore")}
                  disabled={boarding}
                  className="rounded-lg border border-amber-400/30 bg-amber-950/40 p-2 text-center text-xs font-mono text-amber-200 hover:bg-amber-900/50 hover:border-amber-400/60 transition disabled:opacity-60"
                >
                  Organizer
                </button>
              </div>

              {/* Custom Email Entry */}
              <form onSubmit={handleCustomDevSubmit} className="space-y-3">
                <div>
                  <input
                    type="email"
                    placeholder="College Email (lit2026000@iiitl.ac.in)"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    disabled={boarding}
                    className="w-full rounded-lg border border-amber-400/30 bg-[#060a12] px-3.5 py-2 text-xs font-mono text-amber-100 placeholder-amber-400/30 focus:border-amber-400 focus:outline-none"
                  />
                  {customEmail && (
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono">
                      {parsed ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Valid {parsed.branch.toUpperCase()} &apos;{parsed.batchYear} ({parsed.rollNumber})
                        </span>
                      ) : (
                        <span className="text-rose-400">Must be @iiitl.ac.in format</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Display Name (optional)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    disabled={boarding}
                    className="w-2/3 rounded-lg border border-amber-400/30 bg-[#060a12] px-3 py-2 text-xs font-mono text-amber-100 placeholder-amber-400/30 focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={boarding || !customEmail}
                    className="w-1/3 rounded-lg border border-amber-400/50 bg-gradient-to-r from-amber-600 to-amber-500 py-2 text-xs font-mono uppercase tracking-wider text-black font-semibold hover:brightness-110 transition disabled:opacity-50"
                  >
                    Enter
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
