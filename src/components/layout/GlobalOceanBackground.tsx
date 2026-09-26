"use client";

import React, { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import LiveOceanHero from "@/components/landing/LiveOceanHero";
import { cn } from "@/lib/utils";

function subscribeLighting(callback: () => void) {
  window.addEventListener("findx:lighting", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("findx:lighting", callback);
    window.removeEventListener("storage", callback);
  };
}

function getLightingSnapshot(): 0 | 1 | 2 {
  try {
    const saved = localStorage.getItem("findx_lighting_mode");
    if (saved === "1" || saved === "2") return parseInt(saved, 10) as 1 | 2;
    return 0;
  } catch {
    return 0;
  }
}

function getLightingServerSnapshot(): 0 | 1 | 2 {
  return 0;
}

/**
 * GlobalOceanBackground — persistently mounted across all routes in RootLayout.
 * Powers the dynamic ocean wave shaders and sailing pirate ship everywhere.
 *
 * Never unmounts during route changes:
 * - On "/": Full opacity (100%), foreground pirate ship and gulls sailing.
 * - On interior routes ("/dashboard", etc.): Calibrated ambient opacity (45-55%),
 *   ship is smoothly omitted, and deep antique timber vignettes protect card readability.
 */
export default function GlobalOceanBackground() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  const lightingMode = useSyncExternalStore(
    subscribeLighting,
    getLightingSnapshot,
    getLightingServerSnapshot
  );

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-0 overflow-hidden select-none",
        isLanding ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      {/* 1. Deep pirate timber base fill */}
      <div className="absolute inset-0 bg-[#0c0805]" />

      {/* 2. Persistent Live Ocean Hero with interactive wave shaders & sailing ship */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700",
          isLanding
            ? "opacity-100"
            : "opacity-45 sm:opacity-55"
        )}
      >
        <LiveOceanHero
          className="w-full h-full"
          bgSrc="/assets/bg_seamless.png"
          shipSrc="/assets/ship_cutout.png"
          posterSrc="/assets/bg_seamless.png"
          initialWaveStrength={1.0}
          initialSpeed={1.0}
          initialLightingMode={lightingMode}
          showControls={false}
          isBackground={!isLanding}
        />
      </div>

      {/* 3. Warm antique timber vignette overlays for card legibility while keeping the anime sea vivid */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700 bg-gradient-to-t from-[#0c0805]/92 via-[#140d08]/25 to-[#1c120a]/40",
          isLanding ? "opacity-35" : "opacity-100"
        )}
      />
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(12,8,5,0.75)_100%)]",
          isLanding ? "opacity-25" : "opacity-100"
        )}
      />
    </div>
  );
}
