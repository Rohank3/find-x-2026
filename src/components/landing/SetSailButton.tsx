"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, X, Anchor, ShieldCheck } from "@/components/icons";
import { parseIIITLEmail } from "@/lib/email";

/**
 * SetSailButton — high-end gilded pirate CTA button that opens an
 * authentic "Board the Ship" login modal with full sign-in options
 * styled in the same sleek dark & gold theme as the dashboard.
 * If already authenticated, provides instant entry to the dashboard.
 */

interface SetSailButtonProps {
  competitionState?: string;
}

export default function SetSailButton({ competitionState = "UPCOMING" }: SetSailButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const isLoggedIn = !!session?.user;
  const isLive = competitionState === "LIVE" || competitionState === "FROZEN";

  const [modalOpen, setModalOpen] = useState(false);
  const [boarding, setBoarding] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  const handleCtaClick = () => {
    if (isLoggedIn) {
      if (isLive) {
        router.push("/hunt");
      } else {
        router.push("/dashboard");
      }
    } else {
      setModalOpen(true);
    }
  };

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
      {/* 1. Main SET SAIL / RETURN TO DECK Heroic Anime Pirate CTA Button */}
      <motion.button
        onClick={handleCtaClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        className="group relative inline-flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-[#d4af37] bg-gradient-to-b from-[#2e1509] via-[#1a0b04] to-[#0c0502] px-6 sm:px-12 py-2.5 sm:py-4 shadow-[0_12px_36px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.45),inset_0_1px_2px_rgba(255,243,191,0.6),inset_0_-3px_6px_rgba(0,0,0,0.9)] hover:border-[#fde047] hover:shadow-[0_16px_50px_rgba(0,0,0,0.95),0_0_45px_rgba(251,191,36,0.75),inset_0_1px_3px_rgba(255,255,255,0.7)] transition-all duration-300 overflow-hidden cursor-pointer select-none"
        aria-label={isLoggedIn ? "Return to Deck — Enter Dashboard" : "Set Sail — Open Sign In Options"}
      >
        {/* Ornate Inset Hairline Filigree Frame */}
        <div className="absolute inset-1 sm:inset-1.5 rounded-[12px] sm:rounded-[20px] border border-amber-400/30 pointer-events-none group-hover:border-amber-300/50 transition-colors" />

        {/* Shimmer sweep effect */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-300/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

        {/* Top Mini Anime Caption */}
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-[family-name:var(--font-bangers)] tracking-[0.3em] uppercase text-amber-400/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] mb-0.5">
          <span className="text-[#fddf28]">✦</span>
          <span>{isLoggedIn ? `CAPTAIN ${session.user.name?.split(" ")[0]?.toUpperCase() || "ABOARD"}` : "WEIGH ANCHOR"}</span>
          <span className="text-[#fddf28]">✦</span>
        </div>

        {/* Core Row: Pirate Medallion + Chiseled Pirata One Typography + Gilded Anchor Badge */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          {/* Anime Pirate Compass Medallion */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#d4af37]/35 via-[#2b1408] to-[#0d0502] border border-[#d4af37]/70 flex items-center justify-center shadow-[0_0_16px_rgba(212,175,55,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] group-hover:scale-110 transition-transform duration-300 shrink-0">
            <Compass className="h-6 w-6 text-[#fde047] group-hover:rotate-45 transition-transform duration-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
          </div>

          {/* Heroic One Piece Logo-Style Text */}
          <span className="font-[family-name:var(--font-luckiest-guy)] text-3xl sm:text-4xl md:text-5xl tracking-[0.12em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#fddf28] via-35% via-[#d4af37] via-70% to-[#85580c] drop-shadow-[0_2px_0_#78350f] drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] drop-shadow-[0_0_20px_rgba(253,223,40,0.4)]">
            {isLoggedIn ? (isLive ? "Enter The Hunt" : "Return to Deck") : "Set Sail"}
          </span>

          {/* Right Anchor Badge */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)] group-hover:scale-110 group-hover:text-amber-200 transition-all shrink-0">
            <Anchor className="h-4 w-4 sm:h-4.5 sm:w-4.5 stroke-[2.5]" />
          </div>
        </div>
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
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl border border-white/15 bg-black/90 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.95)] text-center overflow-hidden"
            >
              {/* Gold Top Trim Line */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setModalOpen(false)}
                disabled={boarding}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition flex items-center justify-center border border-white/15"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-amber-400 bg-black/70 shadow-[0_0_20px_rgba(251,191,36,0.35)]">
                  <Anchor className="h-7 w-7 text-amber-400" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <span>Sign In</span>
                </div>
                <h2 className="font-[family-name:var(--font-luckiest-guy)] text-3xl sm:text-4xl uppercase tracking-wider bg-gradient-to-b from-[#ffffff] via-[#fddf28] via-40% to-[#d4af37] bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                  Board the Ship
                </h2>
                <p className="font-sans text-xs text-white/70 font-medium mt-1">
                  Sign in to join the hunt
                </p>
              </div>

              {/* Primary Option: Google Sign-In */}
              <button
                onClick={handleGoogleLogin}
                disabled={boarding}
                className="w-full flex items-center justify-center gap-3 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold py-3.5 px-4 shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 mb-6 text-sm cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>{boarding ? "Signing in..." : "Continue with Google"}</span>
              </button>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-black/90 px-3 font-sans font-bold text-[10px] text-amber-400/80 tracking-wider">
                    Or Dev Access
                  </span>
                </div>
              </div>

              {/* Fast Dev / Sailor Presets */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => handleDevLogin("lit2026001@iiitl.ac.in", "Fresher Sailor")}
                  disabled={boarding}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-center text-xs font-sans font-bold text-white hover:border-amber-400/50 hover:bg-amber-400/10 transition disabled:opacity-60 cursor-pointer"
                >
                  Fresher &apos;26
                </button>
                <button
                  type="button"
                  onClick={() => handleDevLogin("lit2024001@iiitl.ac.in", "Senior Quartermaster")}
                  disabled={boarding}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-center text-xs font-sans font-bold text-white hover:border-amber-400/50 hover:bg-amber-400/10 transition disabled:opacity-60 cursor-pointer"
                >
                  Senior &apos;24
                </button>
                <button
                  type="button"
                  onClick={() => handleDevLogin("admin@iiitl.ac.in", "The Commodore")}
                  disabled={boarding}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-center text-xs font-sans font-bold text-white hover:border-amber-400/50 hover:bg-amber-400/10 transition disabled:opacity-60 cursor-pointer"
                >
                  Organizer
                </button>
              </div>

              {/* Custom Email Entry */}
              <form onSubmit={handleCustomDevSubmit} className="space-y-3 text-left">
                <div>
                  <input
                    type="email"
                    placeholder="College Email (lit2026000@iiitl.ac.in)"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    disabled={boarding}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 font-sans font-bold text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 text-sm"
                  />
                  {customEmail && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-sans">
                      {parsed ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <ShieldCheck className="h-3 w-3" /> Valid: {parsed.branch.toUpperCase()} &apos;{parsed.batchYear} ({parsed.rollNumber})
                        </span>
                      ) : (
                        <span className="text-red-400">Must be @iiitl.ac.in format</span>
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
                    className="w-2/3 bg-black/60 border border-white/20 rounded-xl px-4 py-3 font-sans font-bold text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={boarding || !customEmail}
                    className="w-1/3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-black font-sans font-black uppercase tracking-wider py-3 text-xs shadow-[0_0_14px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none cursor-pointer"
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
