"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Chronometer — compact brass/parchment countdown to hunt launch.
 * Splits into DD · HH · MM · SS flip cells with a pulsing brass bezel.
 */

interface Props {
  targetDate: string | null;
  label?: string;
  className?: string;
}

function useCountdown(targetDate: string | null) {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0, ready: false });

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setLeft({ d: 0, h: 0, m: 0, s: 0, ready: true });
        return;
      }
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        ready: true,
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return left;
}

export default function Chronometer({ targetDate, label = "Hunt Launches In", className }: Props) {
  const { d, h, m, s, ready } = useCountdown(targetDate);

  if (!targetDate || !ready) return null;

  const units = [
    { label: "DAYS", value: d },
    { label: "HRS", value: h },
    { label: "MIN", value: m },
    { label: "SEC", value: s },
  ];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <span className="font-code text-[10px] font-bold uppercase tracking-[0.35em] text-amber-400/90">
        {label}
      </span>
      <div className="chron-live flex items-center gap-2 rounded-2xl border border-white/15 bg-black/60 px-4 py-2.5 backdrop-blur-2xl shadow-2xl">
        {units.map((u, i) => (
          <div key={u.label} className="flex items-center gap-2">
            {i > 0 && <span className="pb-3 text-sm text-white/30 font-bold">·</span>}
            <div className="flex flex-col items-center">
              <div
                key={u.value}
                className="flip-digit relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-b from-amber-400/15 via-black/80 to-black/90 shadow-[0_0_12px_rgba(251,191,36,0.25)]"
              >
                <span className="font-sans font-black text-xl sm:text-2xl text-amber-400 tabular-nums drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
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
