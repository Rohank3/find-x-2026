"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import {
  Compass,
  CloudFog,
  Sparkles,
  Navigation,
} from "lucide-react";
import IslandNode, { type PuzzleNode } from "./IslandNode";
import MapCanvasDecorations from "./MapCanvasDecorations";

interface TreasureMapProps {
  puzzles: PuzzleNode[];
  onNodeClick: (puzzleId: string) => void;
}

/**
 * Calculates smooth harmonic vertical S-curve coordinates for N checkpoints.
 * Keeps nodes safely within 28% - 72% horizontal range for zero clipping.
 * Level 1 starts below the header cartouche (topPadding = 370px).
 * Final level is crowned dead-center (50%).
 */
function calculateWindingCoordinates(count: number, stepHeight: number = 175) {
  const topPadding = 370;
  const bottomPadding = 340;
  const totalHeight = Math.max(900, topPadding + count * stepHeight + bottomPadding);

  const positions: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < count; i++) {
    // Smooth sinusoidal wave alternating left and right, with final level centered
    let x: number;
    if (i === 0) {
      x = 50; // Loguetown: Departure Harbor centered
    } else if (i === count - 1) {
      x = 50; // Raftel: Climax Legendary Treasure centered
    } else {
      x = Number((50 + Math.sin(i * 1.18) * 21).toFixed(2));
    }
    const y = topPadding + i * stepHeight;

    positions.push({ x, y });
  }

  return { positions, totalHeight };
}

/**
 * Generates smooth cubic Bézier S-curve connecting two waypoints.
 */
function generateBezierCurve(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): string {
  const dy = p2.y - p1.y;
  const cy1 = p1.y + dy * 0.5;
  const cy2 = p2.y - dy * 0.5;

  return `M ${p1.x} ${p1.y} C ${p1.x} ${cy1.toFixed(1)}, ${p2.x} ${cy2.toFixed(1)}, ${p2.x} ${p2.y}`;
}

export default function TreasureMap({
  puzzles,
  onNodeClick,
}: TreasureMapProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const stepHeight = 175;
  const { positions, totalHeight } = calculateWindingCoordinates(
    puzzles.length,
    stepHeight
  );

  const solvedCount = puzzles.filter((p) => p.isSolved).length;
  const activePuzzle = puzzles.find((p) => p.isActive);

  // Sea fog percentage calculation
  const unchartedCount = Math.max(0, puzzles.length - (solvedCount + (activePuzzle ? 1 : 0)));
  const fogPercentage =
    puzzles.length > 0
      ? Math.round((unchartedCount / puzzles.length) * 100)
      : 0;

  // Jump to active level node smoothly
  const scrollToActive = () => {
    if (!activePuzzle) return;
    const nodeEl = document.getElementById(`island-node-${activePuzzle.id}`);
    if (nodeEl) {
      nodeEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      {/* Expedition HUD Header Controls */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-[#1c0f08]/95 via-[#2a170e]/95 to-[#1c0f08]/95 border border-amber-500/30 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="text-xs font-mono tracking-widest text-amber-400/80 uppercase">
              GRAND LINE EXPEDITION
            </div>
            <div className="font-[family-name:var(--font-pirata-one)] text-2xl text-amber-200 flex items-center gap-2">
              <span>
                {solvedCount} OF {puzzles.length} ISLANDS CONQUERED
              </span>
              {solvedCount === puzzles.length && puzzles.length > 0 && (
                <span className="text-emerald-400 text-sm font-mono font-bold">
                  ★ ONE PIECE CLAIMED!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sea Fog Telemetry */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#140a04] border border-amber-500/30 text-xs font-mono text-amber-300">
          <CloudFog className="w-4 h-4 text-slate-300 animate-pulse" />
          <span>SEA FOG:</span>
          <span className="font-bold text-amber-400">
            {fogPercentage}% UNCHARTED
          </span>
        </div>

        {/* Quick-Jump to Ship Anchorage */}
        {activePuzzle && (
          <button
            onClick={scrollToActive}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600/30 to-amber-500/20 hover:from-amber-600/40 hover:to-amber-500/30 border border-amber-400/40 text-amber-300 font-mono text-xs transition-all active:scale-95 shadow-md"
            title="Scroll to Active Ship"
          >
            <Navigation className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>Sail to Lvl #{activePuzzle.orderIndex}</span>
          </button>
        )}
      </div>

      {/* Main Vertical Parchment Scroll Frame */}
      <div
        ref={scrollContainerRef}
        className="relative w-full max-w-4xl flex flex-col items-center py-2 sm:py-4"
      >
        <div className="relative w-full flex flex-col items-center">
          {/* Top Wooden Spindle Roller Cap */}
          <div className="w-full relative z-30 pointer-events-none select-none -mb-8 sm:-mb-14">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hunt/scroll_roller_top.png"
              alt="Antique Parchment Top Spindle"
              className="w-full h-auto drop-shadow-[0_15px_25px_rgba(0,0,0,0.9)]"
            />
          </div>

          {/* Scalable Repeating Parchment Scroll Body */}
          <div
            className="w-[74%] sm:w-[73.5%] relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.9),inset_0_0_60px_rgba(42,24,16,0.4)] overflow-hidden"
            style={{
              backgroundImage: `url('/images/hunt/parchment_tile.jpg')`,
              backgroundRepeat: "repeat-y",
              backgroundSize: "100% auto",
              minHeight: `${totalHeight}px`,
            }}
          >
            {/* Left & Right Torn Deckle Edge Overlays */}
            <div
              className="absolute inset-y-0 left-0 w-4 sm:w-6 pointer-events-none z-20 opacity-75"
              style={{
                backgroundImage: `url('/images/hunt/deckle_edge_left.png')`,
                backgroundRepeat: "repeat-y",
                backgroundSize: "contain",
              }}
            />
            <div
              className="absolute inset-y-0 right-0 w-4 sm:w-6 pointer-events-none z-20 opacity-75"
              style={{
                backgroundImage: `url('/images/hunt/deckle_edge_right.png')`,
                backgroundRepeat: "repeat-y",
                backgroundSize: "contain",
              }}
            />

            {/* Left & Right Vignettes for Paper Depth */}
            <div className="absolute inset-y-0 left-0 w-5 sm:w-10 bg-gradient-to-r from-[#201007]/50 via-[#201007]/20 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-y-0 right-0 w-5 sm:w-10 bg-gradient-to-l from-[#201007]/50 via-[#201007]/20 to-transparent pointer-events-none z-10" />

            {/* Subtle Cartographic Grid Lines Watermark */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,53,15,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,53,15,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

            {/* Custom Canvas Embellishments (Blood stains, contours, map markings) */}
            <MapCanvasDecorations totalHeight={totalHeight} />

            {/* Decorative Header Cartouche: Grand Line Log Pose Compass Rose */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none z-10 opacity-95">
              <div className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/hunt/decor_compass.png"
                  alt="Grand Line Log Pose Compass"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="font-[family-name:var(--font-pirata-one)] text-2xl sm:text-3xl text-[#3a1a08] tracking-widest mt-1 text-center drop-shadow-sm">
                THE GRAND LINE
              </div>
              <div className="text-[10px] sm:text-xs font-mono font-bold text-[#78350f] tracking-widest uppercase">
                ~ Voyage to Raftel ~
              </div>
            </div>

            {/* SVG Winding Serpentine Nautical Route */}
            <svg
              viewBox={`0 0 100 ${totalHeight}`}
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            >
              <defs>
                {/* Crimson Wake Glow Filter */}
                <filter id="wakeGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Dynamic Curves Connecting Checkpoints */}
              {puzzles.map((p, idx) => {
                if (idx >= puzzles.length - 1) return null;

                const p1 = positions[idx];
                const p2 = positions[idx + 1];
                if (!p1 || !p2) return null;

                const pathD = generateBezierCurve(p1, p2);
                const isSegmentConquered = p.isSolved;
                const isSegmentActive = p.isActive;

                return (
                  <g key={`trail-group-${p.id}`}>
                    {/* Antique Underlay Rope Track */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#78350f"
                      strokeWidth="5"
                      strokeDasharray="9 7"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      opacity="0.8"
                    />

                    {/* Conquered Crimson Wake Trail */}
                    {isSegmentConquered && (
                      <motion.path
                        d={pathD}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="3.5"
                        strokeDasharray="5 5"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        filter="url(#wakeGlow)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    )}

                    {/* Active Route Shimmer Trail */}
                    {isSegmentActive && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        className="animate-pulse"
                        opacity="0.85"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Checkpoint Nodes along the Winding Path */}
            {puzzles.map((puzzle, idx) => {
              const pos = positions[idx] || { x: 50, y: 370 };
              const isLastNode = idx === puzzles.length - 1;

              return (
                <IslandNode
                  key={puzzle.id}
                  puzzle={puzzle}
                  position={pos}
                  isLastNode={isLastNode}
                  onClick={() => onNodeClick(puzzle.id)}
                />
              );
            })}

            {/* Decorative Footer Cartouche: Vintage Sea King Monster Engraving */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-[85%] max-w-[340px] pointer-events-none select-none z-10 opacity-85"
              style={{ top: `${totalHeight - 230}px` }}
            >
              <div className="p-2 bg-[#fef3c7]/60 rounded-lg border-2 border-[#78350f]/40 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/hunt/decor_sea_monster.png"
                  alt="Antique Sea King Monster Cartouche"
                  className="w-full h-auto object-contain rounded"
                />
              </div>
            </div>
          </div>

          {/* Bottom Wooden Spindle Roller Cap */}
          <div className="w-full relative z-30 pointer-events-none select-none -mt-8 sm:-mt-14">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hunt/scroll_roller_bottom.png"
              alt="Antique Parchment Bottom Spindle"
              className="w-full h-auto drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)]"
            />
          </div>
        </div>
      </div>

      {/* Map Legend & Instructions */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-amber-200/75 px-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            Conquered Island
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            Current Anchorage (Going Merry)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            Locked Sea
          </span>
          <span className="flex items-center gap-1.5 text-red-400 font-bold">
            <span className="w-3 h-0.5 border-b-2 border-dashed border-red-500" />
            Chartered Wake Trail
          </span>
        </div>
        <div className="flex items-center gap-1 text-amber-400 font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          Sail forward by conquering each riddle on the Grand Line!
        </div>
      </div>
    </div>
  );
}
