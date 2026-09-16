"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Terminal,
  Trophy,
  CheckCircle2,
  TrendingUp,
  AlertOctagon,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Compass,
} from "lucide-react";

export default function ElevatedInternalShell() {
  const [answerInput, setAnswerInput] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSimulatedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    if (answerInput.trim().toUpperCase() === "FOURIER" || answerInput.trim().toUpperCase() === "PRIME") {
      setStatusMessage("CRACK_SUCCESS: Starlight coordinate string decoded! +250 PTS");
    } else {
      setStatusMessage("HASH_MISMATCH: Invalid key string. Check celestial harmonic resonance.");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[hsl(0_0%_2%)] text-[hsl(45_40%_97%)] font-mono selection:bg-[hsl(45_68%_47%)] selection:text-[hsl(0_0%_2%)] overflow-hidden flex flex-col justify-between">
      {/* 1. ATMOSPHERIC DEPTH: Starlight Matrix & Celestial Gold Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-45"
        style={{
          backgroundImage:
            "radial-gradient(hsl(45 40% 97% / 0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 85% 60% at 50% 0%, #000 50%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 60% at 50% 0%, #000 50%, transparent 100%)",
        }}
      />
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[950px] h-[380px] bg-[hsl(45_68%_47%)] opacity-[0.045] blur-[150px] rounded-full z-0" />
      <div className="pointer-events-none fixed top-1/3 -right-24 w-[500px] h-[500px] bg-[hsl(44_63%_33%)] opacity-[0.025] blur-[180px] rounded-full z-0" />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Breadcrumb & Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[hsl(45_40%_97%/0.08)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] text-[hsl(45_40%_97%/0.5)] uppercase tracking-widest">
              <Link href="/" className="hover:text-[hsl(45_40%_97%)] transition">FIND X</Link>
              <span className="text-[hsl(45_40%_97%/0.2)]">/</span>
              <span>Theme System</span>
              <span className="text-[hsl(45_40%_97%/0.2)]">/</span>
              <span className="text-[hsl(45_68%_47%)]">THURAY Gold Void</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-[hsl(45_40%_97%)] flex items-center gap-3">
                Cryptic Operations Console
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 border border-[hsl(45_68%_47%/0.4)] text-[hsl(45_68%_47%)] bg-[hsl(45_68%_47%/0.1)] tracking-widest hidden sm:inline-block">
                THURAY_GOLD_VOID
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-[hsl(45_40%_97%/0.4)] uppercase tracking-widest">Active Squad</div>
              <div className="text-xs font-bold text-[hsl(45_40%_97%/0.85)]">IIITL_CIPHER_UNIT_04</div>
            </div>
            <div className="w-9 h-9 border border-[hsl(45_40%_97%/0.12)] bg-[hsl(45_40%_97%/0.03)] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[hsl(45_68%_47%)]" />
            </div>
          </div>
        </div>

        {/* 2. RECESSED BENTO METRIC BAR */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Bento Item 1 (Primary Highlight) */}
          <div className="relative border border-[hsl(45_68%_47%/0.35)] bg-[hsl(0_0%_4%)] p-4 shadow-[inset_0_1px_0_0_hsl(45_68%_47%/0.25)]">
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[hsl(45_68%_47%)]" />
            <div className="text-[10px] uppercase tracking-widest text-[hsl(45_40%_97%/0.6)] flex items-center justify-between">
              <span>Net Score</span>
              <Trophy className="w-3.5 h-3.5 text-[hsl(45_68%_47%)]" />
            </div>
            <div className="text-2xl font-black text-[hsl(45_68%_47%)] tracking-tight mt-1 drop-shadow-[0_0_14px_rgba(201,151,38,0.4)]">
              1,420 <span className="text-xs font-normal text-[hsl(45_68%_47%/0.6)]">PTS</span>
            </div>
            <div className="text-[10px] text-[hsl(45_40%_97%/0.4)] mt-1 flex items-center gap-1">
              <span className="text-[hsl(45_68%_47%)] font-bold">Rank #01</span> in Celestial Track
            </div>
          </div>

          {/* Bento Item 2 */}
          <div className="recessed-well p-4">
            <div className="text-[10px] uppercase tracking-widest text-[hsl(45_40%_97%/0.45)] flex items-center justify-between">
              <span>Solves</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-[hsl(45_40%_97%)] tracking-tight mt-1">
              +1,600 <span className="text-xs font-normal text-[hsl(45_40%_97%/0.4)]">PTS</span>
            </div>
            <div className="text-[10px] text-[hsl(45_40%_97%/0.4)] mt-1">8 of 12 Challenges Cleared</div>
          </div>

          {/* Bento Item 3 */}
          <div className="recessed-well p-4">
            <div className="text-[10px] uppercase tracking-widest text-[hsl(45_40%_97%/0.45)] flex items-center justify-between">
              <span>Hint Deductions</span>
              <AlertOctagon className="w-3.5 h-3.5 text-[hsl(0_84%_60%)]" />
            </div>
            <div className="text-2xl font-bold text-[hsl(0_84%_60%)] tracking-tight mt-1">
              -180 <span className="text-xs font-normal text-[hsl(0_84%_60%/0.6)]">PTS</span>
            </div>
            <div className="text-[10px] text-[hsl(45_40%_97%/0.4)] mt-1">3 Clues Unlocked</div>
          </div>

          {/* Bento Item 4 */}
          <div className="recessed-well p-4">
            <div className="text-[10px] uppercase tracking-widest text-[hsl(45_40%_97%/0.45)] flex items-center justify-between">
              <span>Velocity</span>
              <TrendingUp className="w-3.5 h-3.5 text-[hsl(45_68%_47%)]" />
            </div>
            <div className="text-2xl font-bold text-[hsl(45_40%_97%)] tracking-tight mt-1">
              38 <span className="text-xs font-normal text-[hsl(45_40%_97%/0.4)]">MIN/SOLVE</span>
            </div>
            <div className="text-[10px] text-[hsl(45_40%_97%/0.4)] mt-1 flex items-center gap-1">
              <span className="text-emerald-400">+14%</span> vs. Leader Average
            </div>
          </div>
        </div>

        {/* 3. MULTI-COLUMN TACTICAL LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Elevated Card: Progressive Challenge Workspace (2 Cols) */}
          <div className="lg:col-span-2 relative glass-panel p-6 space-y-6">
            {/* Technical Corner Brackets */}
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[hsl(45_68%_47%)]" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[hsl(45_40%_97%/0.4)]" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[hsl(45_40%_97%/0.08)] pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[hsl(45_68%_47%)] font-bold flex items-center gap-1.5">
                  <Terminal className="w-3 h-3" /> ACTIVE_CRYPT_PUZZLE
                </span>
                <h2 className="text-lg font-bold uppercase tracking-wider text-[hsl(45_40%_97%)] mt-0.5">
                  #09: The Echo Protocol
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-[hsl(45_40%_97%/0.4)]">Base Reward</span>
                <span className="text-sm font-bold text-[hsl(45_68%_47%)] font-mono px-2.5 py-0.5 border border-[hsl(45_68%_47%/0.3)] bg-[hsl(45_68%_47%/0.08)]">
                  +250 PTS
                </span>
              </div>
            </div>

            {/* Recessed Clue Viewport */}
            <div className="recessed-well p-5 space-y-3">
              <div className="flex items-center justify-between text-[10px] text-[hsl(45_40%_97%/0.5)] border-b border-[hsl(45_40%_97%/0.05)] pb-2">
                <span className="flex items-center gap-1.5 text-[hsl(45_40%_97%/0.8)]">
                  <Zap className="w-3.5 h-3.5 text-[hsl(45_68%_47%)]" /> ENCRYPTED_STATION_TRANSMISSION.LOG
                </span>
                <span>CHKSUM: 9A82F1</span>
              </div>
              <p className="text-xs sm:text-sm text-[hsl(45_40%_97%/0.9)] leading-relaxed font-mono">
                &quot;The oscillator ceased its broadcast at 0400 hours. Only the third harmonic survived the narrow-band filter bank.
                Translate the phase shift back to the prime key to unlock the coordinate string.&quot;
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-[hsl(45_40%_97%/0.4)]">TAGS:</span>
                <span className="text-[10px] px-1.5 py-0.5 border border-[hsl(45_40%_97%/0.08)] text-[hsl(45_40%_97%/0.7)] bg-[hsl(45_40%_97%/0.02)]">SIGNAL_ANALYSIS</span>
                <span className="text-[10px] px-1.5 py-0.5 border border-[hsl(45_40%_97%/0.08)] text-[hsl(45_40%_97%/0.7)] bg-[hsl(45_40%_97%/0.02)]">FOURIER_TRANSFORM</span>
              </div>
            </div>

            {/* Interactive Terminal Action Box */}
            <form onSubmit={handleSimulatedSubmit} className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-[hsl(45_40%_97%/0.6)] font-bold">
                  Direct Solution Decryption Terminal
                </span>
                <span className="text-[10px] text-[hsl(45_40%_97%/0.4)]">ATTEMPTS: 2/5</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[hsl(45_40%_97%/0.4)] font-bold select-none">
                    &gt;
                  </span>
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="ENTER_KEY_OR_PHRASE (try 'FOURIER')..."
                    className="w-full bg-[hsl(0_0%_1.8%)] border border-[hsl(45_40%_97%/0.12)] focus:border-[hsl(45_68%_47%)] pl-8 pr-4 py-3 text-xs sm:text-sm text-[hsl(45_40%_97%)] placeholder:text-[hsl(0_0%_40%)] font-mono outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.85)]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[hsl(45_68%_47%)] text-[hsl(0_0%_2%)] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[hsl(45_68%_47%/0.85)] transition-all flex items-center justify-center gap-2 shrink-0 group cursor-pointer shadow-[0_0_15px_-2px_rgba(201,151,38,0.5)]"
                >
                  <Zap className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Execute Solve</span>
                </button>
              </div>

              {statusMessage && (
                <div
                  className={`p-3 text-xs font-mono border ${
                    statusMessage.startsWith("CRACK_SUCCESS")
                      ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
                      : "border-[hsl(0_84%_60%/0.4)] bg-[hsl(0_84%_60%/0.1)] text-[hsl(0_84%_60%)]"
                  }`}
                >
                  {statusMessage}
                </div>
              )}
            </form>
          </div>

          {/* Secondary Card: Lateral Rail Activity Feed (1 Col) */}
          <div className="relative glass-panel p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[hsl(45_40%_97%/0.08)] pb-3">
                <span className="text-[10px] uppercase tracking-widest text-[hsl(45_40%_97%/0.6)] font-bold">
                  Score Ledger Feed
                </span>
                <span className="text-[10px] text-[hsl(45_40%_97%/0.4)] font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(45_68%_47%)] animate-pulse" />
                  LIVE
                </span>
              </div>

              {/* LATERAL ACCENT RAIL ROWS */}
              <div className="space-y-1.5">
                {/* Event Row 1: Correct Solve */}
                <div className="border-l-2 border-l-emerald-400 bg-[hsl(45_40%_97%/0.015)] hover:bg-[hsl(45_40%_97%/0.035)] p-2.5 transition flex items-center justify-between gap-2 border-b border-[hsl(45_40%_97%/0.03)]">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-[hsl(45_40%_97%/0.9)] truncate uppercase">
                      Puzzle #08 Cleared
                    </div>
                    <div className="text-[9px] text-[hsl(45_40%_97%/0.4)]">12m ago • by CipherLead</div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                    +200
                  </span>
                </div>

                {/* Event Row 2: Hint Penalty */}
                <div className="border-l-2 border-l-[hsl(0_84%_60%)] bg-[hsl(45_40%_97%/0.015)] hover:bg-[hsl(45_40%_97%/0.035)] p-2.5 transition flex items-center justify-between gap-2 border-b border-[hsl(45_40%_97%/0.03)]">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-[hsl(45_40%_97%/0.9)] truncate uppercase">
                      Hint Unlock (#09)
                    </div>
                    <div className="text-[9px] text-[hsl(45_40%_97%/0.4)]">45m ago • Penalty</div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[hsl(0_84%_60%)] shrink-0">
                    -50
                  </span>
                </div>

                {/* Event Row 3: Correct Solve */}
                <div className="border-l-2 border-l-emerald-400 bg-[hsl(45_40%_97%/0.015)] hover:bg-[hsl(45_40%_97%/0.035)] p-2.5 transition flex items-center justify-between gap-2 border-b border-[hsl(45_40%_97%/0.03)]">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-[hsl(45_40%_97%/0.9)] truncate uppercase">
                      Puzzle #07 Cleared
                    </div>
                    <div className="text-[9px] text-[hsl(45_40%_97%/0.4)]">2h ago • by EchoBot</div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                    +150
                  </span>
                </div>

                {/* Event Row 4: Score Adjustment */}
                <div className="border-l-2 border-l-[hsl(45_68%_47%)] bg-[hsl(45_68%_47%/0.04)] hover:bg-[hsl(45_68%_47%/0.08)] p-2.5 transition flex items-center justify-between gap-2 border-b border-[hsl(45_40%_97%/0.03)]">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-[hsl(45_40%_97%/0.9)] truncate uppercase">
                      Bonus Crypt Clear
                    </div>
                    <div className="text-[9px] text-[hsl(45_40%_97%/0.4)]">5h ago • Admin Verify</div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[hsl(45_68%_47%)] shrink-0">
                    +75
                  </span>
                </div>
              </div>
            </div>

            {/* Micro Navigation Link */}
            <div className="pt-3 border-t border-[hsl(45_40%_97%/0.05)]">
              <Link
                href="/leaderboard"
                className="text-[10px] text-[hsl(45_40%_97%/0.5)] hover:text-[hsl(45_68%_47%)] uppercase tracking-widest flex items-center justify-between group transition"
              >
                <span>Full Ledger &amp; Standings</span>
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>

        </div>

        {/* 4. DESIGN SYSTEM TOKENS ACCORDION */}
        <div className="border border-[hsl(45_40%_97%/0.08)] bg-[hsl(0_0%_1.5%)] p-4 text-xs space-y-2">
          <div className="flex items-center justify-between text-[hsl(45_40%_97%/0.7)] font-bold uppercase tracking-wider text-[10px]">
            <span className="flex items-center gap-1.5 text-[hsl(45_68%_47%)]">
              <Compass className="w-3.5 h-3.5" /> THURAY Gold Void Palette Active
            </span>
            <span className="text-[hsl(45_40%_97%/0.4)]">CELESTIAL HARMONICS</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] pt-1">
            <div className="p-2 border border-[hsl(45_40%_97%/0.05)] bg-[hsl(0_0%_2%)]">
              <span className="text-[hsl(45_40%_97%/0.4)] block text-[9px] uppercase">--background</span>
              <span className="text-[hsl(45_40%_97%)] font-bold">0 0% 2% (Obsidian)</span>
            </div>
            <div className="p-2 border border-[hsl(45_40%_97%/0.08)] bg-[hsl(0_0%_4%)]">
              <span className="text-[hsl(45_40%_97%/0.4)] block text-[9px] uppercase">--card</span>
              <span className="text-[hsl(45_40%_97%)] font-bold">0 0% 4% (Void Card)</span>
            </div>
            <div className="p-2 border border-[hsl(45_68%_47%/0.4)] bg-[hsl(45_68%_47%/0.08)]">
              <span className="text-[hsl(45_68%_47%/0.7)] block text-[9px] uppercase">--primary</span>
              <span className="text-[hsl(45_68%_47%)] font-bold">45 68% 47% (Gold)</span>
            </div>
            <div className="p-2 border border-[hsl(44_63%_33%/0.4)] bg-[hsl(44_63%_33%/0.08)]">
              <span className="text-[hsl(44_63%_33%/0.8)] block text-[9px] uppercase">--thread</span>
              <span className="text-[hsl(44_63%_33%)] font-bold">44 63% 33% (Bronze)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="relative z-20 border-t border-[hsl(45_40%_97%/0.08)] bg-[hsl(0_0%_2%/0.8)] backdrop-blur-sm mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs font-mono text-[hsl(45_40%_97%/0.5)]">
          <span>FIND X • THURAY Gold Void Edition</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[hsl(45_40%_97%)] transition">← Home</Link>
            <Link href="/leaderboard" className="text-[hsl(45_68%_47%)]">Leaderboard</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
