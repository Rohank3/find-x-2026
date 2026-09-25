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
      {/* 1. Deep pirate timber base fill with crisp anime ocean backdrop */}
      <div className="absolute inset-0 bg-[#0c0805]" />
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-55"
        style={{ backgroundImage: "url('/assets/bg_seamless.png')" }}
      />

      {/* 2. Ambient Live Ocean Hero with interactive wave shaders */}
      <div
        className="absolute inset-0 opacity-45 sm:opacity-55 transition-opacity duration-1000"
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

      {/* 3. Warm antique timber vignette overlays for card legibility while keeping the anime sea vivid */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0805]/92 via-[#140d08]/25 to-[#1c120a]/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(12,8,5,0.75)_100%)]" />
    </div>
  );
}
