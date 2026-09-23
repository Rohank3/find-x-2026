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
      <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-300/70">
        {label}
      </span>
      <div className="chron-live flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-[#1c1006]/85 px-3 py-2 backdrop-blur-md">
        {units.map((u, i) => (
          <div key={u.label} className="flex items-center gap-1.5">
            {i > 0 && <span className="pb-3 text-sm text-amber-500/60">·</span>}
            <div className="flex flex-col items-center">
              <div
                key={u.value}
                className="flip-digit relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-amber-600/50 bg-gradient-to-b from-[#f5deb0] via-[#e8c98a] to-[#caa05e] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-6px_10px_rgba(120,72,10,0.35)]"
              >
                <span className="font-mono text-lg font-bold text-[#2a1503] tabular-nums">
                  {u.value.toString().padStart(2, "0")}
                </span>
                <span className="absolute left-0 top-1/2 h-px w-full bg-[#8a5a10]/50" />
              </div>
              <span className="mt-1 font-mono text-[8px] tracking-[0.2em] text-amber-200/60">
                {u.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
