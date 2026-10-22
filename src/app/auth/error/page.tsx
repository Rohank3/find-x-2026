"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Anchor, ShieldAlert, Compass } from "@/components/icons";
import { motion } from "framer-motion";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [boarding, setBoarding] = useState(false);

  const handleGoogleLogin = () => {
    setBoarding(true);
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center"
      >
        {/* Amber top line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        {/* Shield Alert Avatar */}
        <div className="flex justify-center mb-4 relative">
          <div className="w-20 h-20 rounded-2xl border-2 border-amber-400 bg-black/70 flex items-center justify-center shadow-[0_0_24px_rgba(251,191,36,0.3)]">
            <ShieldAlert className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider mb-2">
          <Anchor className="w-3.5 h-3.5 text-amber-400" />
          <span>College Email Required</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black font-sans tracking-tight text-white mb-2">
          Unauthorized Account
        </h1>

        <p className="text-xs sm:text-sm font-sans text-white/80 leading-relaxed mb-5">
          {error === "Configuration"
            ? "Authentication configuration issue detected. Please notify an organizer."
            : "Please sign in using your official IIITL college email ID (@iiitl.ac.in) to board the ship. Personal accounts are not permitted."}
        </p>

        {/* Notice Info Box */}
        <div className="mb-6 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-left text-xs space-y-1.5">
          <p className="font-bold text-amber-300 font-sans">Required Email Format:</p>
          <ul className="text-white/60 space-y-1 list-disc pl-4 font-code text-[11px]">
            <li>Official Student Email: <span className="text-white font-bold">lcs2026xxx@iiitl.ac.in</span></li>
          </ul>
        </div>

        {/* Direct Login Button (Dark Mode) */}
        <button
          onClick={handleGoogleLogin}
          disabled={boarding}
          className="w-full flex items-center justify-center gap-3 bg-zinc-900/90 hover:bg-zinc-800 active:bg-zinc-950 text-white font-bold py-3.5 px-4 rounded-xl border border-white/20 hover:border-amber-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-all shadow-[0_4px_20px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(251,191,36,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:pointer-events-none cursor-pointer mb-3"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>{boarding ? "Signing in..." : "Continue with College Mail"}</span>
        </button>

        {/* Secondary Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-amber-300 transition-colors pt-2"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Return to Shore</span>
        </Link>
      </motion.div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-center animate-pulse">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 border border-white/10 mb-4" />
            <div className="h-6 w-32 mx-auto bg-white/10 rounded-full mb-3" />
            <div className="h-8 w-48 mx-auto bg-white/10 rounded mb-6" />
          </div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
