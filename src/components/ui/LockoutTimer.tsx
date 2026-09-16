"use client";

import React, { useEffect, useState, useRef } from "react";
import { ShieldAlert, Clock } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface LockoutTimerProps {
  initialSeconds: number;
  onTimerExpired: () => void;
}

export default function LockoutTimer({ initialSeconds, onTimerExpired }: LockoutTimerProps) {
  // The parent remounts this component (via key) whenever a new cooldown
  // starts, so initialSeconds is only read at mount time — no prop-sync
  // effects needed.
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  // Latest-callback ref so the interval is created exactly once instead of
  // being torn down and recreated every second.
  const onExpiredRef = useRef(onTimerExpired);
  useEffect(() => {
    onExpiredRef.current = onTimerExpired;
  }, [onTimerExpired]);

  const reachedZero = secondsLeft <= 0;

  useEffect(() => {
    if (reachedZero) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [reachedZero]);

  // Notify the parent exactly once, when the countdown actually hits zero.
  useEffect(() => {
    if (secondsLeft === 0 && initialSeconds > 0) {
      onExpiredRef.current();
    }
  }, [secondsLeft, initialSeconds]);

  if (reachedZero) return null;

  return (
    <div className="relative border border-rose-500/50 bg-rose-950/20 p-4 my-4 font-mono">
      <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-rose-500" />
      <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-rose-500" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-rose-500" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-rose-500" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 text-rose-400">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              Submission Cooldown Active
            </div>
            <div className="text-[11px] text-white/70 tracking-wide mt-0.5">
              Too many incorrect attempts. Submissions are temporarily paused until the timer expires.
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 border border-rose-500/40 bg-black text-rose-400 text-xs font-bold uppercase tracking-widest self-start sm:self-auto">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatDuration(secondsLeft)} remaining</span>
        </div>
      </div>
    </div>
  );
}
