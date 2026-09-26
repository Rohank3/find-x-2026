"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * ThreeDTitle — heroic One Piece–styled "FIND X" title.
 * - Uses "Luckiest Guy" font — the closest Google Font to the iconic One Piece
 *   logo's bouncy, hand-painted, chunky lettering style
 * - Authentic Straw Hat Gold metallic gradient (#FDDF28 → #D4AF37 → #85580C)
 * - Manga-style outward contour stroke using paint-order technique
 * - Deep cel-shaded chiseled shadow stack (hard offset, not soft blur)
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
      {/* 1. Cinematic Soft Contrast Shield (Softened to avoid boxy smudge artifact while giving subtle legibility) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-4 bottom-8 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(5,8,18,0.45)_0%,rgba(5,8,18,0.15)_60%,transparent_85%)] blur-lg"
      />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative flex flex-col items-center text-center"
      >
        {/* Heroic Title: FIND X in One Piece Straw Hat Gold */}
        <div className="relative select-none">
          {/* Layer 1: Deep Ambient Obsidian Shadow — furthest back offset */}
          <h1
            aria-hidden
            className="absolute inset-0 font-[family-name:var(--font-luckiest-guy)] text-6xl sm:text-8xl md:text-9xl leading-none tracking-[0.12em] text-[#0a0502] translate-y-2.5 translate-x-2 blur-[2px] select-none"
          >
            FIND X
          </h1>

          {/* Layer 2: Chiseled Bronze Core Shadow — stepped cel-shaded depth */}
          <h1
            aria-hidden
            className="absolute inset-0 font-[family-name:var(--font-luckiest-guy)] text-6xl sm:text-8xl md:text-9xl leading-none tracking-[0.12em] text-[#3d1a08] translate-y-1.5 translate-x-1 select-none"
          >
            FIND X
          </h1>

          {/* Layer 3: Dark Contour Manga Outline — outward stroke using paint-order */}
          <h1
            aria-hidden
            style={{ WebkitTextStroke: "6px #120904", paintOrder: "stroke fill" }}
            className="absolute inset-0 font-[family-name:var(--font-luckiest-guy)] text-6xl sm:text-8xl md:text-9xl leading-none tracking-[0.12em] text-[#120904] select-none"
          >
            FIND X
          </h1>

          {/* Layer 4: Front High-Luminance Straw Hat Gold Gradient Title */}
          <h1
            className="relative font-[family-name:var(--font-luckiest-guy)] text-6xl sm:text-8xl md:text-9xl leading-none tracking-[0.12em] bg-gradient-to-b from-[#ffffff] via-[#fddf28] via-30% via-[#d4af37] via-65% to-[#85580c] bg-clip-text text-transparent drop-shadow-[0_2px_0_#78350f] drop-shadow-[0_6px_16px_rgba(0,0,0,0.95)] drop-shadow-[0_0_25px_rgba(0,0,0,0.8)]"
          >
            FIND X
          </h1>
        </div>

        {/* Subtitle: "THE GRAND VOYAGE" in Bangers (shonen action manga font) */}
        <div className="mt-1 sm:mt-2 select-none">
          <span
            className="font-[family-name:var(--font-bangers)] text-lg sm:text-xl md:text-2xl uppercase tracking-[0.35em] bg-gradient-to-r from-[#fef08a] via-[#fddf28] to-[#fef08a] bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
          >
            The Grand Voyage
          </span>
        </div>

        {/* Coordinates Tag in Dark Pill Badge for Maximum Contrast */}
        <div className="mt-3 flex items-center gap-1.5 sm:gap-2 rounded-full bg-black/70 px-2.5 sm:px-3.5 py-1 border border-amber-500/30 shadow-[0_2px_8px_rgba(0,0,0,0.8)] max-w-[92vw]">
          <span className="text-[#fddf28] text-[10px] sm:text-xs">◈</span>
          <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.14em] sm:tracking-[0.25em] text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] whitespace-nowrap">
            26° 50&apos; N • 80° 55&apos; E • IIIT LUCKNOW
          </span>
          <span className="text-[#fddf28] text-[10px] sm:text-xs">◈</span>
        </div>
      </motion.div>
    </div>
  );
}
