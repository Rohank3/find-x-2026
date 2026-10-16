"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Navigation } from "lucide-react";
import { LandmarkData } from "./EncounterDrawer";

interface HorizontalCampaignMapProps {
  landmarks: LandmarkData[];
  onSelectLandmark: (landmark: LandmarkData) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export default function HorizontalCampaignMap({
  landmarks,
  onSelectLandmark,
  scrollRef,
}: HorizontalCampaignMapProps) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const containerRef = scrollRef || localRef;

  const activeIndex = landmarks.findIndex((l) => l.isActive);

  // Progressive Horizon: only show cleared + active + 1 upcoming locked waypoint.
  // Everything beyond that is covered in dense sea fog, so players never know that 15 is the end!
  const visibleLandmarks = landmarks.slice(0, Math.max(3, activeIndex + 2));
  const totalMapWidth = Math.max(2600, visibleLandmarks.length * 360 + 750);

  // Calculate coordinates along a winding horizontal river/ocean voyage
  const coordinates = visibleLandmarks.map((_, idx) => {
    const x = 240 + idx * 360;
    // Sinuous undulating wave up and down across the terrain (240px to 420px vertically)
    const y = 330 + Math.sin(idx * 1.35) * 115;
    return { x, y };
  });

  // Smooth scroll wheel handling: horizontal wheel navigation
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        containerRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  // Auto-pan to active encounter on load
  useEffect(() => {
    if (containerRef.current && activeIndex !== -1) {
      const activeX = 240 + activeIndex * 360;
      containerRef.current.scrollTo({
        left: Math.max(0, activeX - 380),
        behavior: "smooth",
      });
    }
  }, [activeIndex, containerRef]);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border-4 border-[#3e2111] bg-[#140a05] shadow-[0_25px_60px_rgba(0,0,0,0.95)]">
      {/* Scroll Controls Pill Bar */}
      <div className="absolute top-4 left-6 z-30 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/80 border border-amber-600/50 text-xs font-mono text-amber-200 backdrop-blur-md shadow-xl pointer-events-none">
        <Navigation className="w-3.5 h-3.5 text-amber-400 rotate-90" />
        <span>Drag or Scroll Horizontally Across the Sea Chart</span>
      </div>

      {/* Main Panoramic Horizontal Scrollable Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        className="relative w-full h-[640px] sm:h-[680px] overflow-x-auto overflow-y-hidden select-none cursor-grab active:cursor-grabbing scrollbar-thin scrollbar-thumb-amber-700/60 scrollbar-track-[#1c0d06]"
      >
        {/* Panoramic Illustrated Campaign Map Canvas */}
        <div
          className="relative h-full"
          style={{
            width: `${totalMapWidth}px`,
            backgroundImage: `url('/images/hunt/fantasy_campaign_map.webp')`,
            backgroundRepeat: "repeat-x",
            backgroundSize: "auto 100%",
          }}
        >
          {/* Subtle Sepia Vignette & Edge Shadows */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#180b04]/30 via-transparent to-[#180b04]/40 pointer-events-none z-5" />
          <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(30,15,6,0.7)] pointer-events-none z-5" />

          {/* SVG Dotted Expedition Trail Connecting Waypoints */}
          <svg
            className="absolute inset-0 h-full pointer-events-none z-10"
            style={{ width: `${totalMapWidth}px` }}
          >
            <defs>
              <filter id="wakeCrimson" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {visibleLandmarks.map((landmark, idx) => {
              if (idx >= visibleLandmarks.length - 1) return null;
              const p1 = coordinates[idx];
              const p2 = coordinates[idx + 1];
              if (!p1 || !p2) return null;

              const dx = p2.x - p1.x;
              const cx1 = p1.x + dx * 0.5;
              const cy1 = p1.y;
              const cx2 = p2.x - dx * 0.5;
              const cy2 = p2.y;

              const pathD = `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;
              const isCleared = landmark.isSolved;
              const isActive = landmark.isActive;

              return (
                <g key={`trail-${landmark.id}`}>
                  {/* Antique Underlay Dotted Track (Tolkien/Pirate Map Style) */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#4a250e"
                    strokeWidth="4"
                    strokeDasharray="4 8"
                    strokeLinecap="round"
                    opacity="0.75"
                  />

                  {/* Midpoint Stepping Stone Circles */}
                  <circle
                    cx={(p1.x + p2.x) / 2}
                    cy={(p1.y + p2.y) / 2}
                    r="4"
                    fill="#361a0a"
                    stroke="#8a4b18"
                    strokeWidth="2"
                    opacity="0.8"
                  />

                  {/* Conquered Crimson Wake Trail */}
                  {isCleared && (
                    <motion.path
                      d={pathD}
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="3.5"
                      strokeDasharray="5 7"
                      strokeLinecap="round"
                      filter="url(#wakeCrimson)"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  )}

                  {/* Active Route Pulsing Shimmer */}
                  {isActive && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3.5"
                      strokeDasharray="4 6"
                      strokeLinecap="round"
                      className="animate-pulse"
                      opacity="0.95"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* =========================================================================
              WAYPOINT NODES ACROSS THE HORIZONTAL VOYAGE
             ========================================================================= */}
          {visibleLandmarks.map((landmark, idx) => {
            const coord = coordinates[idx] || { x: 240, y: 330 };
            const isSolved = landmark.isSolved;
            const isActive = landmark.isActive;

            // 1. ACTIVE BOSS ENCOUNTER CARD (Gilded Frame from image 2 & 1)
            if (isActive) {
              return (
                <div
                  key={landmark.id}
                  onClick={() => onSelectLandmark(landmark)}
                  className="absolute z-25 cursor-pointer group -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${coord.x}px`, top: `${coord.y}px` }}
                >
                  {/* Bobbing Player Caravel anchored above the card */}
                  <motion.div
                    animate={{ y: [-7, 7, -7], rotate: [-2, 2.5, -2] }}
                    transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
                    className="absolute -top-26 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30"
                  >
                    <div className="w-20 h-20 drop-shadow-[0_14px_22px_rgba(0,0,0,0.9)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/hunt/ship_player.png"
                        alt="Anchored Pirate Caravel"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="px-3 py-0.5 -mt-1.5 rounded-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border border-yellow-200 text-[#140803] text-[9px] font-mono font-black uppercase tracking-wider shadow-[0_0_15px_#fbbf24]">
                      ANCHORED ⚓
                    </div>
                  </motion.div>

                  {/* Flame / Energy Pulse */}
                  <div className="absolute -inset-4 rounded-3xl bg-amber-500/35 blur-xl animate-pulse" />

                  {/* Real 3D Gilded Boss Card Frame */}
                  <div className="relative w-56 sm:w-64 rounded-2xl bg-[#1a0a03] border-2 border-yellow-400/80 shadow-[0_25px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(251,191,36,0.5)] p-3 overflow-hidden group-hover:scale-105 transition-all duration-300">
                    {/* Gilded Baroque Frame Overlay */}
                    <div
                      className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-90"
                      style={{
                        backgroundImage: `url('/images/hunt/boss_encounter_card_frame.webp')`,
                      }}
                    />

                    {/* Header Tag */}
                    <div className="relative z-10 flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded bg-yellow-400 text-black font-black text-[9px] font-mono tracking-widest uppercase shadow">
                        {landmark.landmarkType.toUpperCase().replace("_", " ")}
                      </span>
                      <span className="text-amber-300 text-xs font-mono font-black drop-shadow">
                        {landmark.bountyPoints} PTS
                      </span>
                    </div>

                    {/* Stage Thumbnail Preview with Flame Backdrop */}
                    <div className="relative z-10 h-32 rounded-xl bg-gradient-to-t from-red-950 via-amber-900 to-yellow-600 overflow-hidden flex items-center justify-center border border-yellow-400/50 shadow-inner">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-300/40 via-red-600/30 to-black/85" />
                      
                      <div className="relative text-center px-3 z-10">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-200/90 block">
                          {landmark.region}
                        </span>
                        <h4 className="font-serif font-black text-sm text-[#fff7e6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-tight mt-0.5">
                          {landmark.title}
                        </h4>
                      </div>

                      {/* Bottom Keyhole Crest */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-yellow-500 border border-yellow-200 text-[#140803] text-[9px] font-black uppercase font-mono shadow-md">
                        ENCOUNTER ACTIVE
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="relative z-10 mt-3.5 w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-serif font-black text-xs uppercase tracking-wider text-center shadow-lg hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer">
                      <Sparkles className="w-3.5 h-3.5 fill-black" />
                      <span>Inspect Waypoint</span>
                    </div>
                  </div>
                </div>
              );
            }

            // 2. CONQUERED WAYPOINT (Real 3D Solved Scroll with Wax Stamp)
            if (isSolved) {
              return (
                <div
                  key={landmark.id}
                  onClick={() => onSelectLandmark(landmark)}
                  className="absolute z-20 cursor-pointer group -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                  style={{ left: `${coord.x}px`, top: `${coord.y}px` }}
                >
                  {/* Real 3D Unrolled Scroll with Emerald Wax Seal Stamp */}
                  <div className="relative w-36 h-22 sm:w-40 sm:h-24 flex items-center justify-center group-hover:scale-108 transition-transform">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/hunt/scroll_node_solved.webp"
                      alt={`Breached: ${landmark.title}`}
                      className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)]"
                    />
                  </div>

                  {/* Elegant Typography Label BENEATH the scroll */}
                  <div className="mt-1 px-3 py-1 rounded-xl bg-[#241107]/90 border border-[#6f3e1a] text-center shadow-lg max-w-[190px]">
                    <span className="text-[9px] font-mono uppercase text-[#e4a853] font-bold block truncate">
                      {landmark.landmarkType} • {landmark.bountyPoints} PTS
                    </span>
                    <span className="font-serif font-black text-xs text-[#fef5e7] block truncate leading-tight">
                      {landmark.title}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-extrabold flex items-center justify-center gap-1">
                      <span>BREACHED</span>
                      <span>✓</span>
                    </span>
                  </div>
                </div>
              );
            }

            // 3. LOCKED UNCHARTED WAYPOINT (Real 3D Iron Chains & Padlock Scroll)
            return (
              <div
                key={landmark.id}
                className="absolute z-20 cursor-not-allowed group -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-85"
                style={{ left: `${coord.x}px`, top: `${coord.y}px` }}
              >
                {/* Real 3D Iron Bound Padlock Scroll */}
                <div className="relative w-36 h-22 sm:w-40 sm:h-24 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/hunt/scroll_node_locked.webp"
                    alt={`Locked: ${landmark.title}`}
                    className="w-full h-full object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.65)]"
                  />
                </div>

                {/* Elegant Typography Label BENEATH the locked scroll */}
                <div className="mt-1 px-3 py-1 rounded-xl bg-[#1c0d05]/90 border border-[#522812] text-center shadow-lg max-w-[190px]">
                  <span className="text-[9px] font-mono uppercase text-amber-500/70 font-bold block">
                    SEALED WAYPOINT
                  </span>
                  <span className="font-serif font-black text-xs text-amber-200/80 block truncate leading-tight">
                    {landmark.title}
                  </span>
                </div>
              </div>
            );
          })}

          {/* =========================================================================
              PROGRESSIVE FOG OF WAR: "TERRA INCOGNITA"
              Conceals everything beyond the current horizon so participants never know 15 is the end!
             ========================================================================= */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-30 flex flex-col justify-center items-center"
            style={{
              left: `${coordinates[coordinates.length - 1]?.x ? coordinates[coordinates.length - 1].x + 200 : 1700}px`,
              right: 0,
            }}
          >
            {/* Billowing Cartographic Fog Wisps Overlay */}
            <div
              className="absolute inset-0 opacity-90"
              style={{
                backgroundImage: `url('/images/hunt/mystic_sea_fog.webp')`,
                backgroundRepeat: "repeat",
                backgroundSize: "cover",
                mixBlendMode: "screen",
              }}
            />

            {/* Fog Gradient Mask fading from transparent to opaque antique parchment */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2b170c]/90 to-[#180b05] backdrop-blur-[2px]" />

            {/* Ominous Antique Cartography Inscription */}
            <div className="relative z-10 max-w-md p-6 rounded-3xl bg-[#1e0e06]/95 border-2 border-[#5c3016] text-center shadow-2xl space-y-2">
              <div className="font-serif font-black text-2xl text-amber-200 tracking-widest uppercase">
                Terra Incognita
              </div>
              <p className="text-xs text-amber-100/80 font-serif italic leading-relaxed">
                &ldquo;Beyond this horizon lie uncharted currents and forgotten ruins. Break the current seal to chart the sea forward.&rdquo;
              </p>
              <div className="text-[10px] font-mono text-amber-400/60 uppercase tracking-widest">
                ~ The Sea of Shadows ~
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
