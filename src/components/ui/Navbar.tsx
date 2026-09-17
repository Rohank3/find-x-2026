"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Terminal,
  Trophy,
  Users,
  Shield,
  LogOut,
  LogIn,
  Bell,
  Radio,
  Menu,
  X,
} from "lucide-react";

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

export default function Navbar({
  initialBroadcast = null,
  initialAnnouncements = [],
}: NavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  // Announcement and navigation state
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(initialAnnouncements);
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(initialBroadcast);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close mobile drawer and announcement popover on route change (in render to prevent cascading effects)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
    setIsAnnouncementOpen(false);
  }

  // Real-time announcement sync (SSE trigger + fallback polling)
  useEffect(() => {
    let isMounted = true;

    const checkUnread = (items: AnnouncementItem[]) => {
      try {
        const lastReadStr = localStorage.getItem("findx_last_read_announcement_time");
        const lastReadTime = lastReadStr ? Number(lastReadStr) : 0;
        return items.some((a) => new Date(a.createdAt).getTime() > lastReadTime);
      } catch {
        return items.length > 0;
      }
    };

    // Deferred one tick: unread derives from localStorage (an external
    // system), and synchronous setState inside the effect body would cascade
    // renders during commit (react-hooks/set-state-in-effect).
    const initialUnreadTimer = window.setTimeout(
      () => setHasUnread(checkUnread(initialAnnouncements)),
      0
    );

    const fetchAnnouncement = async () => {
      try {
        const res = await fetch("/api/announcement", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        const list = data.announcements || [];
        setAnnouncements(list);
        setBroadcastMessage(data.broadcastMessage || (list[0]?.message ?? null));
        setHasUnread(checkUnread(list));
      } catch (err) {
        console.error("[Navbar] Failed to fetch announcements:", err);
      }
    };

    fetchAnnouncement();

    // Connect to Server-Sent Events stream for instant trigger when admin publishes
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/announcements/stream");
      eventSource.addEventListener("update", () => {
        // Admin published or deleted announcement -> trigger fetch sequence immediately
        fetchAnnouncement();
      });
      eventSource.onerror = () => {
        // Silent fallback to polling if SSE drops
      };
    } catch {}

    // Fallback polling (15s) and on tab focus
    const interval = setInterval(fetchAnnouncement, 15000);
    window.addEventListener("focus", fetchAnnouncement);

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
      clearInterval(interval);
      clearTimeout(initialUnreadTimer);
      window.removeEventListener("focus", fetchAnnouncement);
    };
  }, [initialAnnouncements]);

  // Handle ESC key and click outside to close popover
  useEffect(() => {
    if (!isAnnouncementOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsAnnouncementOpen(false);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsAnnouncementOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isAnnouncementOpen]);

  const handleToggleAnnouncement = () => {
    const nextState = !isAnnouncementOpen;
    setIsAnnouncementOpen(nextState);
    if (nextState) {
      // Mark as seen and remove yellow dot immediately
      setHasUnread(false);
      try {
        localStorage.setItem(
          "findx_last_read_announcement_time",
          Date.now().toString()
        );
      } catch {}
    }
  };

  const navItems = [
    { label: "Hunt", href: "/hunt", icon: Terminal },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { label: "Team", href: "/dashboard", icon: Users },
  ];

  if (user?.role === "ORGANIZER") {
    navItems.push({ label: "Admin", href: "/admin", icon: Shield });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[hsl(45_40%_97%/0.08)] bg-[hsl(0_0%_2%/0.92)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 sm:gap-4 group">
          <div className="font-mono text-[hsl(45_40%_97%)] text-lg sm:text-xl font-bold tracking-widest italic transform -skew-x-12 group-hover:text-[hsl(45_68%_47%)] transition-colors">
            FIND<span className="text-[hsl(45_68%_47%)] font-normal">X</span>
          </div>
          <div className="h-3 sm:h-4 w-px bg-[hsl(45_40%_97%/0.2)] hidden sm:block" />
          <span className="text-[hsl(45_40%_97%/0.5)] text-[9px] sm:text-[10px] font-mono tracking-widest uppercase hidden sm:inline-block">
            IIIT LUCKNOW
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`px-3 py-1.5 text-xs font-mono tracking-wider transition border ${
                  isActive
                    ? "bg-[hsl(45_68%_47%)] text-[hsl(0_0%_2%)] font-bold border-[hsl(45_68%_47%)] shadow-[0_0_15px_-3px_rgba(201,151,38,0.4)]"
                    : "text-[hsl(45_40%_97%/0.65)] hover:text-[hsl(45_40%_97%)] border-transparent hover:border-[hsl(45_40%_97%/0.2)]"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Announcements & Auth */}
        <div className="flex items-center space-x-3">
          {/* Announcement Bell Popover */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={handleToggleAnnouncement}
              className={`relative p-2 border transition ${
                isAnnouncementOpen
                  ? "bg-[hsl(45_68%_47%)] text-[hsl(0_0%_2%)] border-[hsl(45_68%_47%)]"
                  : "border-[hsl(45_40%_97%/0.15)] text-[hsl(45_40%_97%/0.7)] hover:text-[hsl(45_40%_97%)] hover:border-[hsl(45_40%_97%/0.35)]"
              }`}
              title="Announcements"
              aria-label="Announcements"
            >
              <Bell className="h-3.5 w-3.5" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(45_68%_47%)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(45_68%_47%)]" />
                </span>
              )}
            </button>

            {/* Announcement Popover Modal */}
            {isAnnouncementOpen && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm glass-panel p-4 shadow-2xl z-50 text-left font-mono">
                {/* Corner Frame Accents */}
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[hsl(45_68%_47%)]" />
                <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-[hsl(45_68%_47%)]" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-[hsl(45_40%_97%/0.4)]" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[hsl(45_40%_97%/0.4)]" />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-[hsl(45_40%_97%/0.08)] pb-2.5 mb-3">
                  <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[hsl(45_40%_97%)] font-bold">
                    <Bell className="h-3.5 w-3.5 text-[hsl(45_68%_47%)]" />
                    <span>Announcements ({announcements.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAnnouncementOpen(false)}
                    className="text-[hsl(45_40%_97%/0.4)] hover:text-[hsl(45_40%_97%)] text-[11px] uppercase tracking-wider"
                  >
                    [ESC]
                  </button>
                </div>

                {/* Body */}
                {announcements && announcements.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {announcements.map((a) => (
                      <div
                        key={a.id}
                        className="border border-white/20 bg-white/[0.03] p-3.5 space-y-2 font-mono"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-widest font-black bg-amber-400 text-black">
                            LIVE NOTICE
                          </span>
                          <span className="text-white/40 tracking-wider">
                            {new Date(a.createdAt).toLocaleDateString()} at{" "}
                            {new Date(a.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-white/90 leading-relaxed font-mono whitespace-pre-wrap">
                          {a.message}
                        </p>
                      </div>
                    ))}
                    <div className="text-[10px] text-white/40 uppercase tracking-wider text-right pt-1">
                      IIIT Lucknow • Cryptic Hunt Ops
                    </div>
                  </div>
                ) : broadcastMessage ? (
                  <div className="space-y-3">
                    <div className="border border-white/20 bg-white/[0.03] p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-widest font-black bg-amber-400 text-black">
                          LIVE NOTICE
                        </span>
                        <span className="text-[10px] text-white/40 tracking-wider">
                          Organizer Desk
                        </span>
                      </div>
                      <p className="text-xs text-white/90 leading-relaxed font-mono whitespace-pre-wrap">
                        {broadcastMessage}
                      </p>
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider text-right">
                      IIIT Lucknow • Cryptic Hunt Ops
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <Radio className="h-6 w-6 text-white/30 mx-auto" />
                    <p className="text-xs text-white/70 font-bold uppercase tracking-wider">
                      No Active Announcements
                    </p>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      Broadcast notices, hints, and hunt alerts will appear here in real time.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Status / Auth */}
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="hidden sm:flex flex-col text-right font-mono text-xs">
                <div className="flex items-center space-x-1.5 justify-end">
                  <span className="text-white font-bold">{user.name || user.email}</span>
                  {user.isFirstYear ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/10 text-amber-400 border border-amber-500/40 font-bold">
                      &apos;26
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/10 text-white/70 border border-white/20">
                      {user.batchYear || "ORG"}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-white/50 uppercase tracking-widest">
                  {user.branch} • {user.rollNumber}
                </span>
              </div>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="hidden sm:flex p-1.5 border border-white/20 text-white/60 hover:text-white hover:border-white transition min-h-[36px] min-w-[36px] items-center justify-center"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="hidden sm:flex relative px-4 py-1.5 bg-transparent text-white font-mono text-xs border border-white hover:bg-white hover:text-black transition-all duration-200 group items-center space-x-1.5 min-h-[36px]"
            >
              <span className="hidden sm:block absolute -top-1 -left-1 w-1.5 h-1.5 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="hidden sm:block absolute -bottom-1 -right-1 w-1.5 h-1.5 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity" />
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Navigation Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 border border-[hsl(45_40%_97%/0.15)] text-[hsl(45_40%_97%/0.7)] hover:text-[hsl(45_40%_97%)] hover:border-[hsl(45_40%_97%/0.35)] transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4 text-[hsl(45_68%_47%)]" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[hsl(45_40%_97%/0.08)] bg-[hsl(0_0%_2%/0.98)] backdrop-blur-xl px-4 py-4 space-y-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-3 text-xs font-mono tracking-wider transition border min-h-[44px] ${
                    isActive
                      ? "bg-[hsl(45_68%_47%)] text-[hsl(0_0%_2%)] font-bold border-[hsl(45_68%_47%)] shadow-[0_0_15px_-3px_rgba(201,151,38,0.4)]"
                      : "text-[hsl(45_40%_97%/0.8)] hover:text-[hsl(45_40%_97%)] border-[hsl(45_40%_97%/0.08)] bg-white/[0.02]"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[hsl(0_0%_2%)]" : "text-[hsl(45_68%_47%)]"}`} />
                  <span className="font-bold">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile User Profile & Auth Section */}
          {user ? (
            <div className="pt-3 border-t border-[hsl(45_40%_97%/0.08)] flex items-center justify-between gap-3">
              <div className="flex flex-col text-left font-mono text-xs min-w-0 flex-1">
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-white font-bold truncate">{user.name || user.email}</span>
                  {user.isFirstYear ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 text-amber-400 border border-amber-500/40 font-bold shrink-0">
                      &apos;26
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 text-white/70 border border-white/20 shrink-0">
                      {user.batchYear || "ORG"}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5 truncate">
                  {user.branch} • {user.rollNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="px-3 py-2 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5 min-h-[44px] shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-[hsl(45_40%_97%/0.08)]">
              <Link
                href="/auth/signin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 px-4 bg-[hsl(45_68%_47%)] text-[hsl(0_0%_2%)] font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 min-h-[44px]"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
