"use client";

import React, { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import LiveOceanHero from "@/components/landing/LiveOceanHero";

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
 * GlobalOceanBackground — renders the faded, blurred version of the landing page ocean scene
 * across the entire website on all routes except the landing page ("/").
 *
 * Preserves user-configured wave speed and Day/Evening atmosphere settings from the landing page.
 * Wave speed is dynamically accelerated by user scrolling and wheel gestures.
 */
export default function GlobalOceanBackground() {
  const pathname = usePathname();
  const lightingMode = useSyncExternalStore(
    subscribeLighting,
    getLightingSnapshot,
    getLightingServerSnapshot
  );

  // The landing page ("/") renders its own full interactive hero with foreground titles and controls.
  if (pathname === "/") {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* 1. Deep ocean base fill */}
      <div className="absolute inset-0 bg-[#070402]" />

      {/* 2. Faded and softly blurred Live Ocean Hero */}
      <div
        className="absolute -inset-6 filter blur-[6px] sm:blur-[7px] opacity-45 sm:opacity-50 transition-opacity duration-1000 will-change-transform"
        style={{ transform: "scale(1.04)" }}
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
          isBackground={true}
        />
      </div>

      {/* 3. Cinematic gradient vignette overlays for contrast and readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#100703]/80 via-[#100703]/25 to-[#100703]/55" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(8,4,2,0.7)_100%)]" />
    </div>
  );
}
