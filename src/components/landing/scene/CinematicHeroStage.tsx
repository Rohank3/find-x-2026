"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import OceanWaterFX from "./OceanWaterFX";
import AtmosphericFX from "./AtmosphericFX";

/**
 * CinematicHeroStage — high-production living 2.5D/3D depth stage:
 * - Master visual matching the epic anime pirate reference artwork
 * - Smooth cursor-following perspective parallax with spring physics
 * - Subtle continuous ocean swell breathing motion
 * - Living WebGL/Canvas ocean wave displacement & foam wakes
 * - Skull mountain glowing amber eyes, sunset god rays, cannon blasts & embers
 */
export default function CinematicHeroStage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse parallax motion values (normalized -1 to 1)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for natural weight and responsiveness
  const springX = useSpring(mouseX, { stiffness: 45, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 45, damping: 18 });

  // Transforms for multi-plane depth
  const moveX = useTransform(springX, [-1, 1], [-18, 18]);
  const moveY = useTransform(springY, [-1, 1], [-12, 12]);
  const rotateX = useTransform(springY, [-1, 1], [2.5, -2.5]);
  const rotateY = useTransform(springX, [-1, 1], [-3.5, 3.5]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = (e.clientY / innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#050b14] perspective-[1200px]"
    >
      {/* Parallax Container with Subtle Ocean Breathing Bob */}
      <motion.div
        animate={{
          y: [0, -6, 2, -4, 0],
          rotateZ: [0, 0.25, -0.2, 0.15, 0],
        }}
        transition={{
          duration: 9.0,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          x: moveX,
          y: moveY,
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="absolute -inset-6 sm:-inset-10 will-change-transform"
      >
        {/* 1. Master High-Resolution Epic Pirate Artwork */}
        <div className="relative h-full w-full select-none">
          <Image
            src="/images/hero-pirate-epic.jpg"
            alt="FIND X Pirate Odyssey Hero"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center scale-[1.08] filter contrast-[1.04] saturate-[1.08]"
          />
        </div>

        {/* 2. Living WebGL/Canvas Water Waves & Foaming Wake */}
        <OceanWaterFX />

        {/* 3. Atmospheric FX: Skull Beacon Eyes, God Rays, Cannon Blast & Embers */}
        <AtmosphericFX />
      </motion.div>

      {/* Cinematic Golden-Hour Rim Light & Edge Vignette */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(4,8,18,0.45)_85%,rgba(2,4,10,0.85)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#050b14] via-transparent to-black/35" />
    </div>
  );
}
