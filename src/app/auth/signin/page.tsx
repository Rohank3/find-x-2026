"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { parseIIITLEmail } from "@/lib/email";
import { Shield, Check, AlertCircle, ArrowRight } from "lucide-react";

const isProduction = process.env.NODE_ENV === "production";

export default function SignInPage() {
  const router = useRouter();
  const [emailInput, setEmailInput] = useState("lcs2026001@iiitl.ac.in");
  const [nameInput, setNameInput] = useState("Rohan Verma");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const previewMeta = parseIIITLEmail(emailInput);
  const isOrganizer =
    emailInput.toLowerCase().startsWith("admin@") ||
    emailInput.toLowerCase().startsWith("organizer@");

  const handleDevSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await signIn("dev-mock-auth", {
        email: emailInput,
        name: nameInput,
        callbackUrl: "/dashboard",
        redirect: false,
      });

      setLoading(false);

      if (res?.error) {
        let clean = res.error;
        if (
          clean.includes("Can't reach database") ||
          clean.includes("database server") ||
          clean.includes("TURBOPACK") ||
          clean.includes("invocation in")
        ) {
          clean = "Database connection error. Please make sure the database is running.";
        }
        setErrorMsg(clean);
      } else if (res?.ok) {
        router.push("/dashboard");
      }
    } catch {
      setLoading(false);
      setErrorMsg("Authentication request failed. Please try again.");
    }
  };

  const handleQuickSelect = (email: string, name: string) => {
    setEmailInput(email);
    setNameInput(name);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black relative">
      {/* Background starfield */}
      <div className="absolute inset-0 stars-bg pointer-events-none" />

      {/* Tactical Authentication Terminal */}
      <div className="relative max-w-md w-full border border-white/20 bg-black/90 p-6 sm:p-8 backdrop-blur-md space-y-6 z-10">
        {/* Corner Frame Accents */}
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white pointer-events-none" />
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white pointer-events-none" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white pointer-events-none" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white pointer-events-none" />

        {/* Top Header */}
        <div className="border-b border-white/15 pb-4 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-white/50 tracking-widest uppercase">
            <span>STUDENT PORTAL</span>
            <span>IIIT LUCKNOW</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-wider">
            SIGN IN
          </h1>
          <p className="text-xs font-mono text-white/60">
            IIIT Lucknow Students & Organizers
          </p>
        </div>

        {/* Google OAuth Button */}
        <div>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="relative w-full py-3 px-4 bg-white text-black font-mono font-bold text-xs flex items-center justify-center space-x-2.5 transition hover:bg-zinc-100 border border-white group"
          >
            <span className="absolute -top-1 -left-1 w-1.5 h-1.5 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity" />
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>

        {/* Divider + demo profiles + dev sign-in form: development only */}
        {!isProduction && (
          <>
            <div className="flex items-center space-x-3 py-1">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-[9px] font-mono tracking-widest uppercase text-white/50">
                DEMO PROFILES
              </span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

        {/* Quick Presets */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => handleQuickSelect("lcs2026001@iiitl.ac.in", "Rohan Verma")}
            className="p-2 border border-white/20 hover:border-white bg-black text-white hover:bg-white/10 transition text-center text-[11px]"
          >
            &apos;26 Fresher
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect("lit2024012@iiitl.ac.in", "Vikram Singh")}
            className="p-2 border border-white/20 hover:border-white bg-black text-white hover:bg-white/10 transition text-center text-[11px]"
          >
            &apos;24 Senior
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect("admin@iiitl.ac.in", "Staff Organizer")}
            className="p-2 border border-white/20 hover:border-white bg-black text-amber-400 hover:bg-amber-400/10 transition text-center text-[11px]"
          >
            Organizer
          </button>
            </div>

        {/* Dev Sign-In Form (development only) */}
        <form onSubmit={handleDevSignIn} className="space-y-4 pt-1">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/60 block mb-1">
              Student Email
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="lcs2026001@iiitl.ac.in"
              required
              className="w-full bg-black border border-white/20 p-2.5 text-xs font-mono text-white focus:outline-none focus:border-white transition"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/60 block mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Rohan Verma"
              required
              className="w-full bg-black border border-white/20 p-2.5 text-xs font-mono text-white focus:outline-none focus:border-white transition"
            />
          </div>

          {/* Real-time regex metadata badge */}
          {previewMeta ? (
            <div className="p-3 border border-white/20 bg-white/5 text-xs font-mono text-white space-y-1">
              <div className="flex items-center space-x-1.5 text-white font-bold">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Verified Student Account</span>
              </div>
              <div className="text-[10px] text-white/60 flex flex-wrap gap-2 pt-1">
                <span>Branch: <strong className="text-white">{previewMeta.branch.toUpperCase()}</strong></span>
                <span>•</span>
                <span>Batch: <strong className="text-white">{previewMeta.batchYear}</strong></span>
                <span>•</span>
                <span>Roll: <strong className="text-white">{previewMeta.rollNumber}</strong></span>
                <span>•</span>
                <span>Track: <strong className="text-amber-400">
                  {previewMeta.isFirstYear ? "1st-Year ('26)" : "Senior Track"}
                </strong></span>
              </div>
            </div>
          ) : isOrganizer ? (
            <div className="p-3 border border-amber-500/40 bg-amber-500/10 text-xs font-mono text-amber-300 flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Organizer Account</span>
            </div>
          ) : (
            <div className="p-3 border border-white/20 bg-white/5 text-xs font-mono text-white/70 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-white/60 shrink-0" />
              <span>Enter your college email address</span>
            </div>
          )}

          {errorMsg && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 font-mono">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isProduction || loading || (!previewMeta && !isOrganizer)}
            className="relative w-full py-3 px-4 bg-white text-black font-mono font-bold text-xs border border-white hover:bg-transparent hover:text-white transition-all duration-200 disabled:opacity-40 flex items-center justify-center space-x-2 group"
          >
            <span className="absolute -top-1 -left-1 w-1.5 h-1.5 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity" />
            <span>{loading ? "Signing in..." : "Sign In"}</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
          </>
        )}
      </div>
    </div>
  );
}
