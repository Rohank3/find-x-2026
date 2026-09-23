"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * ThreeDTitle — heroic forged pirate gold title "FIND X".
 * - High-contrast cinematic backdrop plate muting sunset glare
 * - Deep obsidian chiseled bevel shadow & dark contour stroke
 * - Luminous forged gold metallic gradient with gleaming highlights
 * - Interactive cursor-following 3D perspective spring tilt
 * - Pirate badge overhead & IIITL coordinate tag
 */
export default function ThreeDTitle() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tilt spring physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 120, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 18 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-16, 16]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-col items-center justify-center py-4 [perspective:1000px]"
    >
      {/* 1. Cinematic Dark Radial Contrast Shield (Confined tightly behind text, no bleed down to button) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-2 bottom-6 -z-10 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(5,8,18,0.75)_0%,rgba(5,8,18,0.35)_55%,transparent_80%)]"
      />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative flex flex-col items-center text-center"
      >
        {/* Heroic Title: FIND X in High-Contrast Forged Gold */}
        <div className="relative select-none">
          {/* Deep Ambient Obsidian Shadow Layer */}
          <h1
            aria-hidden
            className="absolute inset-0 font-[family-name:var(--font-pirata-one)] text-7xl sm:text-8xl md:text-9xl leading-none tracking-[0.14em] text-[#0a0502] translate-y-2 translate-x-1.5 blur-[1px] select-none"
          >
            FIND X
          </h1>

          {/* Chiseled Bronze Core Shadow Layer */}
          <h1
            aria-hidden
            className="absolute inset-0 font-[family-name:var(--font-pirata-one)] text-7xl sm:text-8xl md:text-9xl leading-none tracking-[0.14em] text-[#3d1a08] translate-y-1 translate-x-0.5 select-none"
          >
            FIND X
          </h1>

          {/* Front High-Luminance Gold Title with Crisp Dark Outline */}
          <h1
            style={{ WebkitTextStroke: "1.5px rgba(20, 10, 4, 0.92)" }}
            className="relative font-[family-name:var(--font-pirata-one)] text-7xl sm:text-8xl md:text-9xl leading-none tracking-[0.14em] bg-gradient-to-b from-[#ffffff] via-[#fed7aa] via-25% via-[#fbbf24] via-60% to-[#b45309] bg-clip-text text-transparent drop-shadow-[0_2px_0_#78350f] drop-shadow-[0_6px_16px_rgba(0,0,0,0.95)] drop-shadow-[0_0_25px_rgba(0,0,0,0.8)]"
          >
            FIND X
          </h1>
        </div>

        {/* Coordinates Tag in Dark Pill Badge for Maximum Contrast */}
        <div className="mt-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 border border-amber-500/30 shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          <span className="text-amber-400 text-xs">◈</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            26° 50&apos; N • 80° 55&apos; E • IIIT LUCKNOW
          </span>
          <span className="text-amber-400 text-xs">◈</span>
        </div>
      </motion.div>
    </div>
  );
}
