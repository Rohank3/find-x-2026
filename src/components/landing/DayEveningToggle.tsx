"use client";

import { useSyncExternalStore } from "react";
import { Sun, Sunset } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface DayEveningToggleProps {
  className?: string;
  initialMode?: 0 | 1;
  onChange?: (mode: 0 | 1) => void;
}

function subscribeLighting(callback: () => void) {
  window.addEventListener("findx:lighting", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("findx:lighting", callback);
    window.removeEventListener("storage", callback);
  };
}

function getLightingSnapshot(): 0 | 1 {
  try {
    return localStorage.getItem("findx_lighting_mode") === "1" ? 1 : 0;
  } catch {
    return 0;
  }
}

function getLightingServerSnapshot(): 0 | 1 {
  return 0;
}

/**
 * DayEveningToggle — pirate-themed atmosphere toggle placed in the header near AudioAmbientToggle.
 * Allows switching between Day (☀️) and Evening (🌅).
 * Automatically broadcasts the change via CustomEvent and persists in localStorage.
 */
export default function DayEveningToggle({
  className,
  onChange,
}: DayEveningToggleProps) {
  const mode = useSyncExternalStore(
    subscribeLighting,
    getLightingSnapshot,
    getLightingServerSnapshot
  );

  const handleSelect = (nextMode: 0 | 1) => {
    try {
      localStorage.setItem("findx_lighting_mode", nextMode.toString());
      window.dispatchEvent(
        new CustomEvent("findx:lighting", { detail: nextMode })
      );
    } catch {
      // ignore
    }
    onChange?.(nextMode);
  };

  return (
    <div
      role="group"
      aria-label="Ocean Atmosphere Lighting"
      className={cn(
        "flex h-11 items-center rounded-full border border-white/15 bg-black/60 p-1.5 backdrop-blur-2xl transition-all shadow-xl",
        className
      )}
    >
      <button
        type="button"
        onClick={() => handleSelect(0)}
        aria-label="Set Day Lighting"
        className={cn(
          "flex h-8 items-center gap-1.5 px-3.5 rounded-full text-xs font-sans font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer",
          mode === 0
            ? "bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.6)]"
            : "text-white/60 hover:text-white hover:bg-white/10"
        )}
      >
        <Sun className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Day</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect(1)}
        aria-label="Set Evening Lighting"
        className={cn(
          "flex h-8 items-center gap-1.5 px-3.5 rounded-full text-xs font-sans font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer",
          mode === 1
            ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-[0_0_12px_rgba(251,191,36,0.6)]"
            : "text-white/60 hover:text-white hover:bg-white/10"
        )}
      >
        <Sunset className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Evening</span>
      </button>
    </div>
  );
}
