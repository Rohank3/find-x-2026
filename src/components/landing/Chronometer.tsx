"use client";

import { useEffect, useState, useRef, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { syncCompetitionStateAction } from "@/lib/competition";

/**
 * Chronometer — compact brass/parchment countdown to hunt launch.
 * Splits into DD · HH · MM · SS flip cells with a pulsing brass bezel.
 * Automatically triggers server-side state transition and router refresh when
 * reaching 0 for UPCOMING state.
 */

interface Props {
  targetDate: string | null;
  label?: string;
  isEnded?: boolean;
  className?: string;
  competitionState?: string;
  onExpire?: () => void;
  autoSwitchOnZero?: boolean;
}

const emptySubscribe = () => () => {};

function useCountdown(targetDate: string | null, onZeroReached?: () => void) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [left, setLeft] = useState({
    d: 0,
    h: 0,
    m: 0,
    s: 0,
    isZero: true,
  });

  const onZeroRef = useRef(onZeroReached);
  useEffect(() => {
    onZeroRef.current = onZeroReached;
  }, [onZeroReached]);

  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();
    hasTriggeredRef.current = false;

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setLeft({ d: 0, h: 0, m: 0, s: 0, isZero: true });
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          onZeroRef.current?.();
        }
        return;
      }
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        isZero: false,
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return { ...left, ready: isClient };
}

export default function Chronometer({
  targetDate,
  label = "Hunt Launches In",
  isEnded = false,
  className,
  competitionState,
  onExpire,
  autoSwitchOnZero = true,
}: Props) {
  const router = useRouter();
  const [justTransitioned, setJustTransitioned] = useState(false);

  const handleZero = useCallback(async () => {
    if (autoSwitchOnZero && competitionState === "UPCOMING") {
      setJustTransitioned(true);
      try {
        await syncCompetitionStateAction();
      } catch (err) {
        console.error("Failed to auto-transition state:", err);
      }
      router.refresh();
    }
    onExpire?.();
  }, [autoSwitchOnZero, competitionState, onExpire, router]);

  const { d, h, m, s, isZero, ready } = useCountdown(targetDate, handleZero);

  // During SSR and initial client hydration, render an identical static placeholder to prevent any time-tick hydration mismatch
  if (!ready) {
    return (
      <div
        className={cn("flex flex-col items-center gap-2 select-none", className)}
        aria-hidden="true"
      >
        <span className="font-[family-name:var(--font-bangers)] text-[11px] uppercase tracking-[0.35em] text-[#fddf28]">
          {label}
        </span>
        <div className="chron-live flex items-center gap-2 rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 backdrop-blur-2xl shadow-2xl">
          {["DAYS", "HRS", "MIN", "SEC"].map((lbl, i) => (
            <div key={lbl} className="flex items-center gap-2">
              {i > 0 && <span className="pb-3 text-sm text-white/30 font-bold">·</span>}
              <div className="flex flex-col items-center">
                <div className="flip-digit relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-b from-amber-400/15 via-black/80 to-black/90 shadow-[0_0_12px_rgba(251,191,36,0.25)]">
                  <span className="font-[family-name:var(--font-luckiest-guy)] text-xl sm:text-2xl text-[#fddf28] tabular-nums drop-shadow-[0_0_8px_rgba(253,223,40,0.5)]">
                    --
                  </span>
                  <span className="absolute left-0 top-1/2 h-[1px] w-full bg-white/10" />
                </div>
                <span className="mt-1 font-code text-[9px] font-bold tracking-[0.2em] text-white/50">
                  {lbl}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If no date is set and event is not marked ended, display a themed pending badge
  if (!targetDate && !isEnded) {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <span className="font-[family-name:var(--font-bangers)] text-[11px] uppercase tracking-[0.35em] text-[#fddf28]">
          Voyage Schedule
        </span>
        <div className="chron-live flex items-center gap-3 rounded-2xl border border-white/15 bg-black/60 px-5 py-2.5 backdrop-blur-2xl shadow-2xl">
          <span className="h-2 w-2 rounded-full bg-amber-400/60 animate-ping" />
          <span className="font-code text-xs sm:text-sm font-semibold tracking-widest text-white/80 uppercase">
            Awaiting Captain&apos;s Orders
          </span>
        </div>
      </div>
    );
  }

  const effectiveLabel = justTransitioned ? "The Hunt is Live!" : label;

  const units = [
    { label: "DAYS", value: isEnded || (justTransitioned && isZero) ? 0 : d },
    { label: "HRS", value: isEnded || (justTransitioned && isZero) ? 0 : h },
    { label: "MIN", value: isEnded || (justTransitioned && isZero) ? 0 : m },
    { label: "SEC", value: isEnded || (justTransitioned && isZero) ? 0 : s },
  ];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {justTransitioned ? (
        <span className="font-[family-name:var(--font-bangers)] text-xs uppercase tracking-[0.35em] text-emerald-400 animate-pulse flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {effectiveLabel}
        </span>
      ) : (
        <span className="font-[family-name:var(--font-bangers)] text-[11px] uppercase tracking-[0.35em] text-[#fddf28]">
          {effectiveLabel}
        </span>
      )}
      <div className="chron-live flex items-center gap-2 rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 backdrop-blur-2xl shadow-2xl">
        {units.map((u, i) => (
          <div key={u.label} className="flex items-center gap-2">
            {i > 0 && <span className="pb-3 text-sm text-white/30 font-bold">·</span>}
            <div className="flex flex-col items-center">
              <div className="flip-digit relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-b from-amber-400/15 via-black/80 to-black/90 shadow-[0_0_12px_rgba(251,191,36,0.25)]">
                <span
                  suppressHydrationWarning
                  className="font-[family-name:var(--font-luckiest-guy)] text-xl sm:text-2xl text-[#fddf28] tabular-nums drop-shadow-[0_0_8px_rgba(253,223,40,0.5)]"
                >
                  {u.value.toString().padStart(2, "0")}
                </span>
                <span className="absolute left-0 top-1/2 h-[1px] w-full bg-white/10" />
              </div>
              <span className="mt-1 font-code text-[9px] font-bold tracking-[0.2em] text-white/50">
                {u.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
