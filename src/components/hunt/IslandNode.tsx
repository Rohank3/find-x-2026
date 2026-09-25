"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Lock, Sparkles, Trophy } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface PuzzleNode {
  id: string;
  orderIndex: number;
  title: string;
  isSolved: boolean;
  isActive: boolean;
  isLocked: boolean;
  basePoints?: number;
}

interface IslandNodeProps {
  puzzle: PuzzleNode;
  position: { x: number; y: number };
  isLastNode?: boolean;
  onClick: () => void;
}

export default function IslandNode({
  puzzle,
  position,
  isLastNode = false,
  onClick,
}: IslandNodeProps) {
  const { isSolved, isActive, isLocked, orderIndex, title, basePoints = 100 } = puzzle;

  // Determine asset based on level state
  let tokenSrc = "/images/hunt/node_locked.png";
  if (isLastNode && (isSolved || isActive)) {
    tokenSrc = "/images/hunt/node_treasure.png";
  } else if (isSolved) {
    tokenSrc = "/images/hunt/node_solved.png";
  } else if (isActive) {
    tokenSrc = "/images/hunt/node_active.png";
  }

  return (
    <div
      id={`island-node-${puzzle.id}`}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
      style={{ left: `${position.x}%`, top: `${position.y}px` }}
    >
      <motion.div
        className={cn(
          "relative group flex flex-col items-center justify-center select-none",
          isLocked ? "cursor-not-allowed" : "cursor-pointer"
        )}
        whileHover={!isLocked ? { scale: 1.08 } : { scale: 1.02 }}
        whileTap={!isLocked ? { scale: 0.96 } : {}}
        onClick={!isLocked ? onClick : undefined}
      >
        {/* Bobbing Player Ship Token above the Active Level */}
        {isActive && (
          <motion.div
            animate={{
              y: [-6, 6, -6],
              rotate: [-2, 2.5, -2],
            }}
            transition={{
              repeat: Infinity,
              duration: 3.2,
              ease: "easeInOut",
            }}
            className="absolute -top-24 sm:-top-28 flex flex-col items-center z-40 pointer-events-none select-none"
          >
            {/* Going Merry Pirate Caravel Token */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_12px_18px_rgba(0,0,0,0.85)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hunt/ship_player.png"
                alt="Going Merry Pirate Caravel"
                className="w-full h-full object-contain"
              />
            </div>
            {/* Active Anchorage Ribbon */}
            <div className="px-2.5 py-0.5 -mt-1.5 rounded-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border border-yellow-200 text-[#140803] text-[9px] sm:text-[10px] font-black uppercase tracking-wider font-mono shadow-[0_0_15px_#fbbf24] flex items-center gap-1">
              <span>ANCHORED</span>
              <span>⚓</span>
            </div>
          </motion.div>
        )}

        {/* Outer Glow Halos */}
        {isActive && (
          <div className="absolute -inset-3 sm:-inset-4 rounded-full bg-gradient-to-r from-amber-500/40 via-yellow-400/50 to-amber-500/40 blur-md animate-pulse pointer-events-none" />
        )}
        {isSolved && (
          <div className="absolute -inset-2 rounded-full bg-emerald-500/25 blur-sm pointer-events-none" />
        )}

        {/* Real Graphical Checkpoint Medallion Token */}
        <div
          className={cn(
            "relative flex items-center justify-center transition-all duration-300",
            isLastNode
              ? "w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
              : "w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tokenSrc}
            alt={`Level ${orderIndex}: ${title}`}
            className={cn(
              "w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)] transition-transform duration-200",
              isLocked && "opacity-75 grayscale-[20%] contrast-110",
              isActive && "filter drop-shadow-[0_0_20px_#f59e0b]",
              isSolved && "filter drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]"
            )}
          />

          {/* Solved Conquered Mini Seal */}
          {isSolved && (
            <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-1 border-2 border-yellow-300 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-100" />
            </div>
          )}

          {/* Locked Padlock Mini Seal */}
          {isLocked && (
            <div className="absolute -bottom-1 -right-1 bg-[#221208] text-amber-200/70 rounded-full p-1 border border-amber-900/60 shadow">
              <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          )}

          {/* Final Level Trophy Seal */}
          {isLastNode && isSolved && (
            <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-[#140803] rounded-full p-1.5 border border-yellow-200 shadow-lg animate-bounce">
              <Trophy className="w-4 h-4 text-[#140803]" />
            </div>
          )}

          {/* Level Order Badge */}
          <div
            className={cn(
              "absolute -top-1 -left-1 sm:-top-2 sm:-left-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] sm:text-xs font-black flex items-center justify-center font-mono border shadow-md",
              isSolved
                ? "bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-yellow-300 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                : isActive
                ? "bg-gradient-to-br from-amber-500 to-yellow-400 text-[#140803] border-yellow-100 shadow-[0_0_12px_#fbbf24]"
                : "bg-[#25150c] text-amber-200/50 border-amber-900/70"
            )}
          >
            {orderIndex}
          </div>
        </div>

        {/* Level Banner Ribbon */}
        <div
          className={cn(
            "mt-1.5 px-2.5 py-0.5 rounded text-[10px] sm:text-xs font-bold font-mono tracking-wider whitespace-nowrap shadow-lg border transition-all",
            isSolved &&
              "bg-[#201007]/95 text-amber-300 border-amber-500/50 shadow-[0_2px_10px_rgba(0,0,0,0.5)]",
            isActive &&
              "bg-gradient-to-r from-[#2e1406] via-[#3a1a09] to-[#2e1406] text-amber-300 border-amber-400 ring-2 ring-amber-400/50 font-black",
            isLocked && "bg-[#180e08]/90 text-amber-200/40 border-amber-950/40"
          )}
        >
          {isLastNode
            ? "★ FINAL ISLAND ★"
            : isActive
            ? "⚡ CURRENT"
            : isSolved
            ? `✓ SOLVED #${orderIndex}`
            : `🔒 LVL ${orderIndex}`}
        </div>

        {/* Interactive Hover Parchment Tooltip */}
        <div className="absolute top-full mt-2.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
          <div className="w-48 sm:w-56 p-3 rounded-lg bg-[#fef3c7] border-2 border-[#3d2010] text-[#2a1810] shadow-[0_12px_30px_rgba(0,0,0,0.75)] relative">
            {/* Arrow */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[#3d2010]" />

            <div className="flex items-center justify-between border-b border-[#3d2010]/20 pb-1 mb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#78350f]">
              <span>Waypoint #{orderIndex}</span>
              <span className="text-amber-800">+{basePoints} PTS</span>
            </div>

            <h4 className="font-[family-name:var(--font-pirata-one)] text-lg leading-tight text-[#2a1810] truncate">
              {isLocked ? "Locked" : title}
            </h4>

            <div className="mt-2 pt-1.5 border-t border-[#3d2010]/15 flex items-center justify-between text-[10px] font-mono font-bold">
              {isSolved && (
                <span className="text-emerald-800 flex items-center gap-1">
                  ✓ Solved
                </span>
              )}
              {isActive && (
                <span className="text-amber-800 flex items-center gap-1 font-black animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  Click to Solve →
                </span>
              )}
              {isLocked && (
                <span className="text-amber-900/60 flex items-center gap-1">
                  🔒 Solve previous first
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
