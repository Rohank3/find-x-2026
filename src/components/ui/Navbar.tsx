"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  Trophy,
  Users,
  Shield,
  LogOut,
  LogIn,
  Menu,
  X,
  Bell,
  Anchor,
  Sparkles,
  Scroll,
} from "@/components/icons";
import { cn } from "@/lib/utils";
export interface AnnouncementItem {
  id: string;
  message: string;
  createdAt: string | Date;
  retentionDays?: number;
  expiresAt?: string | Date;
}

interface NavbarProps {
  initialBroadcast?: string | null;
  initialAnnouncements?: AnnouncementItem[];
}

const NAV_LINKS = [
  { href: "/hunt", label: "Hunt", icon: Map },
  { href: "/leaderboard", label: "Bounties", icon: Trophy },
  { href: "/dashboard", label: "Quarters", icon: Users },
];

export default function Navbar({
  initialAnnouncements = [],
}: NavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ORGANIZER";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [announcements, setAnnouncements] =
    useState<AnnouncementItem[]>(initialAnnouncements);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [lastReadTime, setLastReadTime] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("findx_last_read_announcement_time");
      if (stored) return parseInt(stored, 10);
    }
    return 0;
  });

  const unreadCount = announcements.filter(
    (a) => new Date(a.createdAt).getTime() > lastReadTime
  ).length;

  const markAllRead = useCallback(() => {
    const now = Date.now();
    setLastReadTime(now);
    localStorage.setItem("findx_last_read_announcement_time", String(now));
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/announcement");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("findx:announcements", { detail: data.announcements })
          );
        }
      }
    } catch {
      /* silent */
    }
  }, []);

  // SSE + fallback polling
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollTimer: NodeJS.Timeout | null = null;

    try {
      eventSource = new EventSource("/api/announcements/stream");
      eventSource.addEventListener("update", () => {
        fetchAnnouncements();
      });
      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        pollTimer = setInterval(fetchAnnouncements, 15000);
      };
    } catch {
      pollTimer = setInterval(fetchAnnouncements, 15000);
    }

    const onFocus = () => fetchAnnouncements();
    window.addEventListener("focus", onFocus);

    return () => {
      eventSource?.close();
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchAnnouncements]);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  const isLanding = pathname === "/";

  // Radical-minimal landing: the cinematic hero renders its own corner toggles,
  // so the global navbar is suppressed entirely on "/".
  if (isLanding) return null;

  return (
    <>
      {/* Transparent Floating Anime Pirate Navbar */}
      <nav
        className={cn(
          "sticky top-0 z-40 transition-colors duration-300",
          "bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-md"
        )}
      >
        <div className="w-full px-4 sm:px-8 lg:px-12 flex items-center justify-between h-20 relative">
          {/* Logo: Pushed to EXTREME LEFT */}
          <Link
            href="/"
            className="flex items-center gap-3 group select-none py-1 shrink-0"
          >
            {/* Bespoke Anime Pirate Crossed Cutlasses Emblem */}
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-red-600 p-[1.5px] shadow-[0_0_18px_rgba(245,158,11,0.45)] group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#0a0705] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-red-500/10" />
                
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 group-hover:rotate-12 transition-transform duration-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20L18 6" stroke="url(#bladeGrad1)" strokeWidth="2.5" />
                  <path d="M15 3l6 6-2 2-6-6 2-2z" fill="#fde047" stroke="#b45309" strokeWidth="0.8" />
                  <path d="M20 20L6 6" stroke="url(#bladeGrad2)" strokeWidth="2.5" />
                  <path d="M3 9l6-6 2 2-6 6-2-2z" fill="#fde047" stroke="#b45309" strokeWidth="0.8" />
                  <circle cx="12" cy="12" r="2.5" fill="#ef4444" stroke="#fde047" strokeWidth="1" />
                  <defs>
                    <linearGradient id="bladeGrad1" x1="0" y1="1" x2="1" y2="0">
                      <stop offset="0%" stopColor="#d97706" />
                      <stop offset="60%" stopColor="#fef08a" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                    <linearGradient id="bladeGrad2" x1="1" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#d97706" />
                      <stop offset="60%" stopColor="#fef08a" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Logo Typography */}
            <div className="flex flex-col">
              <div className="flex items-baseline tracking-tight">
                <span className="text-xl sm:text-2xl font-black font-sans tracking-[0.14em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  FIND
                </span>
                <span className="text-2xl sm:text-3xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-tr from-amber-400 via-yellow-300 to-red-500 ml-1.5 drop-shadow-[0_0_16px_rgba(245,158,11,0.9)] group-hover:drop-shadow-[0_0_22px_rgba(251,191,36,1)] transition-all">
                  X
                </span>
              </div>
            </div>
          </Link>

          {/* Centered Floating Nav Pills — Larger size with enhanced presence */}
          <div className="hidden md:flex items-center gap-2 p-1.5 rounded-full bg-black/60 backdrop-blur-2xl border border-white/15 shadow-2xl absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-5 py-2.5 rounded-full text-sm font-sans font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2.5",
                    isActive
                      ? "text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.65)] scale-[1.02]"
                      : "text-white/80 hover:text-white hover:bg-white/10 active:scale-95"
                  )}
                >
                  <Icon className={cn("h-4.5 w-4.5", isActive ? "text-black stroke-[2.5]" : "text-amber-400")} />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-sans font-black uppercase tracking-wider transition-all duration-200",
                  pathname === "/admin"
                    ? "bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.65)] scale-[1.02]"
                    : "text-red-400 hover:text-red-300 hover:bg-white/10 active:scale-95"
                )}
              >
                <Shield className="h-4.5 w-4.5" />
                <span>Admin</span>
              </Link>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Announcements Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowAnnouncements(!showAnnouncements);
                  if (!showAnnouncements) markAllRead();
                }}
                className="relative p-3 rounded-full text-white/90 hover:text-amber-300 hover:bg-white/10 transition-all border border-white/15 bg-black/50 backdrop-blur-xl shadow-lg active:scale-95"
                aria-label="Ship's Log Dispatches"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 border-2 border-black text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showAnnouncements && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-3 w-84 sm:w-96 max-h-96 overflow-y-auto rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/15 shadow-2xl z-50 divide-y divide-white/10 overflow-hidden"
                  >
                    <div className="p-4 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scroll className="h-4 w-4 text-amber-400" />
                        <h3 className="text-sm font-black text-white font-sans tracking-wide uppercase">
                          Announcements
                        </h3>
                      </div>
                      <span className="text-xs font-code text-white/50">
                        {announcements.length} records
                      </span>
                    </div>
                    {announcements.length === 0 ? (
                      <div className="p-8 text-center text-white/50 text-xs font-code flex flex-col items-center gap-2">
                        <Anchor className="h-8 w-8 text-amber-400/40 animate-pulse" />
                        <span>No announcements yet.</span>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {announcements.map((a) => (
                          <div key={a.id} className="p-4 hover:bg-white/[0.04] transition-colors">
                            <p className="text-sm text-white/90 leading-relaxed font-sans">{a.message}</p>
                            <p className="text-[11px] text-amber-400/70 font-code mt-1.5 flex items-center gap-1.5">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              {new Date(a.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Auth Button / Sailor Identity */}
            {session?.user ? (
              <div className="hidden md:flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/15 px-5 py-2 rounded-full shadow-lg">
                <div className="flex flex-col text-right leading-tight">
                  <span className="text-sm font-black text-white truncate max-w-[130px] font-sans">
                    {session.user.name || session.user.email?.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-amber-400 font-code tracking-wider uppercase font-bold">
                    {session.user.branch || "Sailor"} &apos;{String(session.user.batchYear || "").slice(-2)}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-1.5 rounded-full text-white/60 hover:text-red-400 hover:bg-white/10 transition-all active:scale-90"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="hidden md:flex items-center gap-2.5 px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.65)] hover:scale-105 active:scale-95 transition-all"
              >
                <LogIn className="h-4.5 w-4.5 stroke-[2.5]" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2.5 rounded-xl text-amber-300 hover:text-amber-200 hover:bg-white/10 border border-white/15 bg-black/60 backdrop-blur-md transition-all active:scale-95"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-white/10 bg-black/90 backdrop-blur-2xl"
            >
              <div className="px-4 py-5 space-y-2.5">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center justify-between px-5 py-3.5 rounded-2xl text-base font-bold transition-all touch-target border",
                        isActive
                          ? "bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.25)]"
                          : "text-white/80 hover:bg-white/10 border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-amber-400" />
                        <span className="font-sans font-bold">{link.label}</span>
                      </div>
                      {isActive && <Sparkles className="h-4 w-4 text-amber-300" />}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-base font-bold text-red-300 hover:bg-red-500/15 border border-red-500/30 touch-target"
                  >
                    <Shield className="h-5 w-5 text-red-400" />
                    <span className="font-sans font-bold">Admin Operations</span>
                  </Link>
                )}
                <div className="pt-3 border-t border-white/10">
                  {session?.user ? (
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-base font-bold text-red-300 hover:bg-red-500/15 border border-red-500/30 w-full touch-target transition-all"
                    >
                      <LogOut className="h-5 w-5 text-red-400" />
                      <span className="font-sans">Sign Out</span>
                    </button>
                  ) : (
                    <Link
                      href="/auth/signin"
                      className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl text-base font-black font-sans uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.6)] w-full touch-target transition-all"
                    >
                      <LogIn className="h-5 w-5 stroke-[2.5]" />
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Click-outside for announcements */}
      {showAnnouncements && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowAnnouncements(false)}
        />
      )}
    </>
  );
}
