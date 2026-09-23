"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Map,
  Trophy,
  Users,
  Shield,
  LogOut,
  LogIn,
  Menu,
  X,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DayEveningToggle from "@/components/landing/DayEveningToggle";

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
      if (Array.isArray(data.announcements)) setAnnouncements(data.announcements);
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
      {/* Main Navbar */}
      <nav
        className={cn(
          "sticky top-0 z-40 border-b transition-colors duration-300",
          isLanding
            ? "bg-[#120904]/75 backdrop-blur-xl border-amber-500/15"
            : "bg-[#120904]/90 backdrop-blur-xl border-amber-500/20"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
            >
              <div className="relative">
                <Compass className="h-7 w-7 text-amber-400 group-hover:text-amber-300 transition-colors" />
                <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xl font-[family-name:var(--font-pirata-one)] text-amber-400 group-hover:text-amber-300 transition-colors tracking-wide">
                FIND X
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-amber-500/15 text-amber-400 shadow-[inset_0_1px_0_rgba(251,191,36,0.2)]"
                        : "text-amber-100/70 hover:text-amber-200 hover:bg-amber-500/10"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    pathname === "/admin"
                      ? "bg-red-500/15 text-red-400"
                      : "text-red-400/70 hover:text-red-300 hover:bg-red-500/10"
                  )}
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Day / Evening atmosphere toggle */}
              <div className="hidden sm:flex items-center">
                <DayEveningToggle className="h-9 scale-90" />
              </div>

              {/* Announcements Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowAnnouncements(!showAnnouncements);
                    if (!showAnnouncements) markAllRead();
                  }}
                  className="relative p-2 rounded-lg text-amber-100/60 hover:text-amber-300 hover:bg-amber-500/10 transition-all"
                  aria-label="Announcements"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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
                      className="absolute right-0 top-full mt-2 w-80 max-h-80 overflow-y-auto rounded-xl bg-[#1a0e07] border border-amber-500/30 shadow-2xl shadow-black/80 z-50"
                    >
                      <div className="p-3 border-b border-amber-500/10">
                        <h3 className="text-sm font-bold text-amber-400 font-[family-name:var(--font-pirata-one)]">
                          Ship&apos;s Log
                        </h3>
                      </div>
                      {announcements.length === 0 ? (
                        <div className="p-4 text-center text-amber-100/40 text-sm">
                          No dispatches yet
                        </div>
                      ) : (
                        <div className="divide-y divide-amber-500/10">
                          {announcements.map((a) => (
                            <div key={a.id} className="p-3 text-sm text-amber-100/80">
                              <p>{a.message}</p>
                              <p className="text-xs text-amber-100/40 mt-1">
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

              {/* Auth Button */}
              {session?.user ? (
                <div className="hidden md:flex items-center gap-3">
                  <span className="text-sm text-amber-100/60 truncate max-w-[140px]">
                    {session.user.name || session.user.email}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden lg:inline">Leave</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-all border border-amber-500/20"
                >
                  <LogIn className="h-4 w-4" />
                  Join Crew
                </Link>
              )}

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-amber-100/60 hover:text-amber-300 hover:bg-amber-500/10 transition-all"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-amber-500/10 bg-[#120904]/95 backdrop-blur-xl"
            >
              <div className="px-4 py-4 space-y-1">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all touch-target",
                        isActive
                          ? "bg-amber-500/15 text-amber-400"
                          : "text-amber-100/70 hover:bg-amber-500/10"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400/70 hover:bg-red-500/10 touch-target"
                  >
                    <Shield className="h-5 w-5" />
                    Admin Ops
                  </Link>
                )}
                <div className="py-2.5 px-3 flex items-center justify-between rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <span className="text-xs font-medium text-amber-200/70 tracking-wide">Atmosphere</span>
                  <DayEveningToggle className="scale-90" />
                </div>
                <div className="pt-3 border-t border-amber-500/10">
                  {session?.user ? (
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400/80 hover:bg-red-500/10 w-full touch-target"
                    >
                      <LogOut className="h-5 w-5" />
                      Abandon Ship
                    </button>
                  ) : (
                    <Link
                      href="/auth/signin"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/10 touch-target"
                    >
                      <LogIn className="h-5 w-5" />
                      Join the Crew
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
