"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import type { AnnouncementItem } from "@/components/ui/Navbar";

interface AnnouncementBannerProps {
  initialAnnouncements: AnnouncementItem[];
}

export default function AnnouncementBanner({ initialAnnouncements }: AnnouncementBannerProps) {
  const pathname = usePathname();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(initialAnnouncements);
  const [dismissedId, setDismissedId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("findx_dismissed_announcement");
    }
    return null;
  });

  // Listen for shared announcement updates from Navbar to avoid duplicate SSE connections
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<AnnouncementItem[]>;
      if (Array.isArray(customEvent.detail)) {
        setAnnouncements(customEvent.detail);
      }
    };

    window.addEventListener("findx:announcements", handleUpdate);
    return () => {
      window.removeEventListener("findx:announcements", handleUpdate);
    };
  }, []);

  const latestAnnouncement = announcements.length > 0 ? announcements[0] : null;
  const isLanding = pathname === "/";
  const isVisible = !isLanding && Boolean(latestAnnouncement && latestAnnouncement.id !== dismissedId);

  const handleDismiss = () => {
    if (latestAnnouncement) {
      setDismissedId(latestAnnouncement.id);
      localStorage.setItem("findx_dismissed_announcement", latestAnnouncement.id);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && latestAnnouncement && (
        <motion.div
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "relative z-50 w-full overflow-hidden",
            "bg-gradient-to-r from-amber-400/10 via-amber-400/5 to-amber-400/10",
            "border-b border-amber-400/30 shadow-2xl backdrop-blur-md"
          )}
        >
          {/* Subtle gold glow effect */}
          <div className="absolute inset-0 shadow-[0_0_15px_rgba(251,191,36,0.15)] pointer-events-none" />

          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 text-amber-400 bg-amber-400/10 p-2 rounded-full border border-amber-400/20">
                <Megaphone size={18} />
              </div>
              <div className="flex-1 truncate">
                <p className="font-sans font-bold text-amber-50 uppercase tracking-wider text-sm sm:text-base">
                  <span className="text-amber-400 mr-2">Broadside:</span>
                  {latestAnnouncement.message}
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-amber-400/70 hover:text-amber-400 hover:bg-amber-400/10 p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              aria-label="Dismiss announcement"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
