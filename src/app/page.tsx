import React from "react";
import Link from "next/link";
import { ArrowRight, Terminal, Users, Trophy } from "lucide-react"; // Background lives in the root layout (persistent across navigation).

export default async function HomePage() {
  return (
    <div className="relative flex-1 flex flex-col justify-between overflow-hidden">
      {/* Corner Frame Accents */}
      <div className="absolute top-2 left-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-l-2 border-[hsl(45_68%_47%/0.35)] z-20 pointer-events-none" />
      <div className="absolute top-2 right-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-r-2 border-[hsl(45_68%_47%/0.35)] z-20 pointer-events-none" />

      {/* Hero Content (Asymmetric Technical Editorial Layout) */}
      <div className="relative z-10 flex flex-1 items-center justify-end py-12 lg:py-0">
        {/* Bottom Corner Frame Accents framing the interactive viewport */}
        <div className="absolute bottom-2 left-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-l-2 border-[hsl(45_68%_47%/0.35)] z-20 pointer-events-none" />
        <div className="absolute bottom-2 right-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-r-2 border-[hsl(45_68%_47%/0.35)] z-20 pointer-events-none" />
        <div className="w-full lg:w-1/2 px-6 sm:px-10 lg:px-16 lg:pr-[8%]">
          <div className="max-w-xl relative lg:ml-auto">
            {/* Top decorative infinity line */}
            <div className="flex items-center gap-2 mb-3 opacity-60">
              <div className="w-8 h-px bg-[hsl(45_40%_97%)]" />
              <span className="text-[hsl(45_40%_97%)] text-[10px] font-mono tracking-wider">IIIT LUCKNOW</span>
              <div className="flex-1 h-px bg-[hsl(45_40%_97%)]" />
            </div>

            {/* Monumental Title */}
            <div className="relative">
              <div className="hidden lg:block absolute -right-4 top-0 bottom-0 w-1.5 dither-pattern opacity-50" />
              <h1
                className="text-4xl sm:text-6xl lg:text-7xl font-black text-[hsl(45_40%_97%)] mb-3 lg:mb-4 leading-tight font-mono tracking-wider whitespace-nowrap italic transform -skew-x-6"
                style={{ letterSpacing: "0.06em" }}
              >
                FIND <span className="text-[hsl(45_68%_47%)] font-normal">X</span>
              </h1>
            </div>

            {/* Decorative dot matrix array */}
            <div className="hidden lg:flex gap-1.5 mb-4 opacity-40">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="w-0.5 h-0.5 bg-white rounded-full" />
              ))}
            </div>

            {/* Narrative with light, fun tone */}
            <div className="relative">
              <p className="text-xs sm:text-sm lg:text-base text-gray-300 mb-6 leading-relaxed font-mono opacity-85">
                IIIT Lucknow&apos;s ultimate cryptic hunt. Team up with your batchmates, crack clever audio clues,
                decipher hidden visual secrets, and race your way to the top of the leaderboard!
              </p>
            </div>

            {/* Buttons with Technical Corner Ticks */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-1">
              <Link
                href="/hunt"
                className="relative px-6 py-3 bg-[hsl(45_68%_47%)] text-[hsl(0_0%_2%)] font-mono text-xs sm:text-sm font-bold border border-[hsl(45_68%_47%)] hover:bg-transparent hover:text-[hsl(45_68%_47%)] shadow-[0_0_20px_-4px_rgba(201,151,38,0.5)] transition-all duration-200 group flex items-center justify-center space-x-2"
              >
                <span className="hidden sm:block absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[hsl(45_68%_47%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="hidden sm:block absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[hsl(45_68%_47%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <Terminal className="h-4 w-4" />
                <span>Start Hunt</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/dashboard"
                className="relative px-6 py-3 bg-transparent text-[hsl(45_40%_97%)] font-mono text-xs sm:text-sm border border-[hsl(45_40%_97%/0.4)] hover:border-[hsl(45_68%_47%)] hover:text-[hsl(45_68%_47%)] transition-all duration-200 group flex items-center justify-center space-x-2"
              >
                <span className="hidden sm:block absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[hsl(45_68%_47%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="hidden sm:block absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[hsl(45_68%_47%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <Users className="h-4 w-4" />
                <span>My Team</span>
              </Link>

              <Link
                href="/leaderboard"
                className="relative px-5 py-3 bg-transparent text-[hsl(45_40%_97%/0.6)] font-mono text-xs sm:text-sm border border-[hsl(45_40%_97%/0.2)] hover:border-[hsl(45_68%_47%)] hover:text-[hsl(45_40%_97%)] transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Trophy className="h-4 w-4 text-[hsl(45_68%_47%)]" />
                <span>Leaderboard</span>
              </Link>
            </div>

            {/* Bottom notation */}
            <div className="hidden lg:flex items-center gap-2 mt-7 opacity-40">
              <span className="text-white text-[9px] font-mono">✦</span>
              <div className="flex-1 h-px bg-white" />
              <span className="text-white text-[9px] font-mono tracking-widest">
                IIIT LUCKNOW • FIND X
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-20 border-t border-[hsl(45_40%_97%/0.08)] bg-[hsl(0_0%_2%/0.8)] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs font-mono text-[hsl(45_40%_97%/0.6)]">
          <span>IIIT Lucknow</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[hsl(45_68%_47%)] animate-pulse" />
            <span>Live Competition</span>
          </div>
        </div>
      </div>
    </div>
  );
}
