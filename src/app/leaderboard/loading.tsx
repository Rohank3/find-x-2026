import React from "react";
import Image from "next/image";
import { Anchor, Skull } from "@/components/icons";

export default function LeaderboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col items-center">
      <div className="w-full max-w-6xl mx-auto space-y-8 animate-pulse">
        {/* Sleek Floating Pill Tabs Matching Loaded UI */}
        <div className="flex items-center justify-center p-1.5 rounded-full bg-black/60 backdrop-blur-2xl border border-white/10 shadow-xl gap-2 mx-auto w-fit">
          <div className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.5)]">
            All Crews
          </div>
          <div className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider text-white/50">
            Freshers (&apos;26)
          </div>
          <div className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider text-white/50">
            Senior Fleet
          </div>
        </div>

        {/* Grand Line Wanted Board Container Skeleton */}
        <div
          className="relative w-full max-w-6xl mx-auto rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.95)] border-4 sm:border-8 border-[#26150a] overflow-hidden select-none"
          style={{
            backgroundImage: `linear-gradient(rgba(18, 9, 4, 0.42), rgba(18, 9, 4, 0.58)), url('/images/wanted/cracked_wood_board.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Heavy Weathered Timber Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/75 pointer-events-none z-0" />
          <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] pointer-events-none z-0" />

          {/* Forged Hardware Nails */}
          <div className="absolute top-3 left-4 w-5 h-5 pointer-events-none z-20 hidden sm:block">
            <Image src="/images/wanted/rusty_nail_head.png" alt="" width={20} height={20} className="w-full h-full object-contain" />
          </div>
          <div className="absolute top-3 right-4 w-5 h-5 pointer-events-none z-20 hidden sm:block">
            <Image src="/images/wanted/rusty_nail_head.png" alt="" width={20} height={20} className="w-full h-full object-contain" />
          </div>
          <div className="absolute bottom-3 left-4 w-5 h-5 pointer-events-none z-20 hidden sm:block">
            <Image src="/images/wanted/rusty_nail_head.png" alt="" width={20} height={20} className="w-full h-full object-contain" />
          </div>
          <div className="absolute bottom-3 right-4 w-5 h-5 pointer-events-none z-20 hidden sm:block">
            <Image src="/images/wanted/rusty_nail_head.png" alt="" width={20} height={20} className="w-full h-full object-contain" />
          </div>

          {/* Header Plaque */}
          <div className="relative z-20 flex flex-col items-center justify-center mb-8 sm:mb-12">
            <div className="relative px-8 sm:px-12 py-3 bg-[#1e1008] border-2 sm:border-4 border-[#523018] rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,200,120,0.15)] flex items-center gap-3 sm:gap-4">
              <Anchor className="w-5 h-5 text-amber-500/90 drop-shadow-sm" />
              <h2 className="font-[family-name:var(--font-pirata-one)] text-2xl sm:text-4xl text-[#edd29b] tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                Grand Line Wanted Board
              </h2>
              <Anchor className="w-5 h-5 text-amber-500/90 drop-shadow-sm" />
            </div>
            <p className="font-[family-name:var(--font-cinzel-decorative)] text-[10px] sm:text-xs font-black text-amber-200/80 tracking-[0.25em] uppercase mt-2 drop-shadow">
              Official Bounties Issued by the Admiralty
            </p>
          </div>

          {/* Wanted Posters Grid Skeleton */}
          <div className="relative z-10 flex flex-col gap-12 sm:gap-16 w-full items-center">
            {/* Top 3 Podium Row */}
            <div className="flex flex-col md:flex-row justify-center items-center md:items-end gap-8 sm:gap-10 w-full">
              {/* Rank 2 Skeleton */}
              <div className="relative rounded-sm drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] order-2 md:order-1 md:-rotate-2 w-[255px] sm:w-[280px] md:w-[290px] z-10">
                <div className="absolute top-5 sm:top-6 left-1/2 -translate-x-1/2 z-40 w-6 h-6 sm:w-7 sm:h-7 pointer-events-none drop-shadow-[0_3px_5px_rgba(0,0,0,0.9)]">
                  <Image src="/images/wanted/rusty_nail_head.png" alt="" width={28} height={28} className="w-full h-full object-contain" />
                </div>
                <div
                  className="w-full relative px-5 pt-8 pb-7 sm:px-6 sm:pt-9 sm:pb-8 flex flex-col items-center justify-between"
                  style={{
                    backgroundImage: `url('/images/wanted/poster_parchment_clean.png')`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <div className="relative z-20 w-full flex flex-col items-center pt-2 sm:pt-2.5">
                    <div className="w-[88%] h-auto drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                      <Image src="/images/wanted/ornate_wanted_banner_clean.png" alt="Wanted" width={280} height={90} className="w-full h-auto object-contain" />
                    </div>
                  </div>
                  <div className="relative z-20 w-[88%] aspect-square my-3 rounded-sm border-2 border-[#5a3a22]/60 bg-[#2d1c10]/15 flex items-center justify-center">
                    <Skull className="w-16 h-16 text-[#3a2010]/30" />
                  </div>
                  <div className="relative z-20 w-3/4 h-6 rounded bg-[#3a2010]/25 my-1" />
                  <div className="relative z-20 w-2/3 h-8 rounded bg-[#b45309]/30 my-2" />
                  <div className="relative z-20 w-1/2 h-3.5 rounded bg-[#3a2010]/20 mt-1 mb-2" />
                  <div className="absolute -bottom-4 sm:-bottom-5 left-1/2 -translate-x-1/2 z-30 w-36 sm:w-44 pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                    <Image src="/images/wanted/badges/plaque_rank_2.png" alt="Rank 2" width={284} height={86} className="w-full h-auto object-contain" />
                  </div>
                </div>
              </div>

              {/* Rank 1 Skeleton */}
              <div className="relative rounded-sm drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] order-1 md:order-2 md:rotate-0 w-[280px] sm:w-[305px] md:w-[320px] z-20 md:-translate-y-5">
                <div className="absolute top-5 sm:top-6 left-1/2 -translate-x-1/2 z-40 w-6 h-6 sm:w-7 sm:h-7 pointer-events-none drop-shadow-[0_3px_5px_rgba(0,0,0,0.9)]">
                  <Image src="/images/wanted/rusty_nail_head.png" alt="" width={28} height={28} className="w-full h-full object-contain" />
                </div>
                <div
                  className="w-full relative px-5 pt-8 pb-7 sm:px-6 sm:pt-9 sm:pb-8 flex flex-col items-center justify-between"
                  style={{
                    backgroundImage: `url('/images/wanted/poster_parchment_clean.png')`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <div className="relative z-20 w-full flex flex-col items-center pt-2 sm:pt-2.5">
                    <div className="w-[88%] h-auto drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                      <Image src="/images/wanted/ornate_wanted_banner_clean.png" alt="Wanted" width={280} height={90} className="w-full h-auto object-contain" />
                    </div>
                  </div>
                  <div className="relative z-20 w-[88%] aspect-square my-3 rounded-sm border-2 border-[#5a3a22]/60 bg-[#2d1c10]/15 flex items-center justify-center">
                    <Skull className="w-20 h-20 text-[#3a2010]/30" />
                  </div>
                  <div className="relative z-20 w-3/4 h-7 rounded bg-[#3a2010]/25 my-1" />
                  <div className="relative z-20 w-2/3 h-9 rounded bg-[#b45309]/30 my-2" />
                  <div className="relative z-20 w-1/2 h-4 rounded bg-[#3a2010]/20 mt-1 mb-2" />
                  <div className="absolute -bottom-4 sm:-bottom-5 left-1/2 -translate-x-1/2 z-30 w-36 sm:w-44 pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                    <Image src="/images/wanted/badges/plaque_rank_1.png" alt="Rank 1" width={284} height={86} className="w-full h-auto object-contain" />
                  </div>
                </div>
              </div>

              {/* Rank 3 Skeleton */}
              <div className="relative rounded-sm drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] order-3 md:order-3 md:rotate-2 w-[255px] sm:w-[280px] md:w-[290px] z-10">
                <div className="absolute top-5 sm:top-6 left-1/2 -translate-x-1/2 z-40 w-6 h-6 sm:w-7 sm:h-7 pointer-events-none drop-shadow-[0_3px_5px_rgba(0,0,0,0.9)]">
                  <Image src="/images/wanted/rusty_nail_head.png" alt="" width={28} height={28} className="w-full h-full object-contain" />
                </div>
                <div
                  className="w-full relative px-5 pt-8 pb-7 sm:px-6 sm:pt-9 sm:pb-8 flex flex-col items-center justify-between"
                  style={{
                    backgroundImage: `url('/images/wanted/poster_parchment_clean.png')`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <div className="relative z-20 w-full flex flex-col items-center pt-2 sm:pt-2.5">
                    <div className="w-[88%] h-auto drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                      <Image src="/images/wanted/ornate_wanted_banner_clean.png" alt="Wanted" width={280} height={90} className="w-full h-auto object-contain" />
                    </div>
                  </div>
                  <div className="relative z-20 w-[88%] aspect-square my-3 rounded-sm border-2 border-[#5a3a22]/60 bg-[#2d1c10]/15 flex items-center justify-center">
                    <Skull className="w-16 h-16 text-[#3a2010]/30" />
                  </div>
                  <div className="relative z-20 w-3/4 h-6 rounded bg-[#3a2010]/25 my-1" />
                  <div className="relative z-20 w-2/3 h-8 rounded bg-[#b45309]/30 my-2" />
                  <div className="relative z-20 w-1/2 h-3.5 rounded bg-[#3a2010]/20 mt-1 mb-2" />
                  <div className="absolute -bottom-4 sm:-bottom-5 left-1/2 -translate-x-1/2 z-30 w-36 sm:w-44 pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                    <Image src="/images/wanted/badges/plaque_rank_3.png" alt="Rank 3" width={284} height={86} className="w-full h-auto object-contain" />
                  </div>
                </div>
              </div>
            </div>

            {/* Next 2 Ranks Row (Rank 4 & 5) */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 sm:gap-10 mt-2 sm:mt-4 w-full">
              {/* Rank 4 Skeleton */}
              <div className="relative rounded-sm drop-shadow-[0_12px_25px_rgba(0,0,0,0.85)] md:rotate-1.5 w-[245px] sm:w-[270px] z-10">
                <div className="absolute top-4.5 sm:top-5 left-1/2 -translate-x-1/2 z-40 w-5 h-5 sm:w-6 sm:h-6 pointer-events-none drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)]">
                  <Image src="/images/wanted/rusty_nail_head.png" alt="" width={24} height={24} className="w-full h-full object-contain" />
                </div>
                <div
                  className="w-full relative px-5 pt-8 pb-7 sm:px-6 sm:pt-9 sm:pb-8 flex flex-col items-center justify-between"
                  style={{
                    backgroundImage: `url('/images/wanted/poster_parchment_clean.png')`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <div className="relative z-20 w-full flex flex-col items-center pt-2 sm:pt-2.5">
                    <div className="w-[88%] h-auto drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                      <Image src="/images/wanted/ornate_wanted_banner_clean.png" alt="Wanted" width={280} height={90} className="w-full h-auto object-contain" />
                    </div>
                  </div>
                  <div className="relative z-20 w-[88%] aspect-square my-3 rounded-sm border-2 border-[#5a3a22]/60 bg-[#2d1c10]/15 flex items-center justify-center">
                    <Skull className="w-14 h-14 text-[#3a2010]/30" />
                  </div>
                  <div className="relative z-20 w-3/4 h-5 rounded bg-[#3a2010]/25 my-1" />
                  <div className="relative z-20 w-2/3 h-7 rounded bg-[#b45309]/30 my-2" />
                  <div className="relative z-20 w-1/2 h-3 rounded bg-[#3a2010]/20 mt-1 mb-2" />
                  <div className="absolute -bottom-4 sm:-bottom-5 left-1/2 -translate-x-1/2 z-30 w-36 sm:w-44 pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                    <Image src="/images/wanted/badges/plaque_rank_4.png" alt="Rank 4" width={284} height={86} className="w-full h-auto object-contain" />
                  </div>
                </div>
              </div>

              {/* Rank 5 Skeleton */}
              <div className="relative rounded-sm drop-shadow-[0_12px_25px_rgba(0,0,0,0.85)] md:-rotate-1.5 w-[245px] sm:w-[270px] z-10">
                <div className="absolute top-4.5 sm:top-5 left-1/2 -translate-x-1/2 z-40 w-5 h-5 sm:w-6 sm:h-6 pointer-events-none drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)]">
                  <Image src="/images/wanted/rusty_nail_head.png" alt="" width={24} height={24} className="w-full h-full object-contain" />
                </div>
                <div
                  className="w-full relative px-5 pt-8 pb-7 sm:px-6 sm:pt-9 sm:pb-8 flex flex-col items-center justify-between"
                  style={{
                    backgroundImage: `url('/images/wanted/poster_parchment_clean.png')`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <div className="relative z-20 w-full flex flex-col items-center pt-2 sm:pt-2.5">
                    <div className="w-[88%] h-auto drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                      <Image src="/images/wanted/ornate_wanted_banner_clean.png" alt="Wanted" width={280} height={90} className="w-full h-auto object-contain" />
                    </div>
                  </div>
                  <div className="relative z-20 w-[88%] aspect-square my-3 rounded-sm border-2 border-[#5a3a22]/60 bg-[#2d1c10]/15 flex items-center justify-center">
                    <Skull className="w-14 h-14 text-[#3a2010]/30" />
                  </div>
                  <div className="relative z-20 w-3/4 h-5 rounded bg-[#3a2010]/25 my-1" />
                  <div className="relative z-20 w-2/3 h-7 rounded bg-[#b45309]/30 my-2" />
                  <div className="relative z-20 w-1/2 h-3 rounded bg-[#3a2010]/20 mt-1 mb-2" />
                  <div className="absolute -bottom-4 sm:-bottom-5 left-1/2 -translate-x-1/2 z-30 w-36 sm:w-44 pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                    <Image src="/images/wanted/badges/plaque_rank_5.png" alt="Rank 5" width={284} height={86} className="w-full h-auto object-contain" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FleetLedger Table Section Skeleton */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black font-sans uppercase tracking-wider text-white flex items-center gap-2">
              <Anchor className="w-4.5 h-4.5 text-amber-400" />
              Leaderboard
            </h2>
          </div>

          <div className="w-full max-w-6xl mx-auto flex flex-col gap-4">
            <div className="overflow-x-auto rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl p-2 sm:p-4">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="p-4 font-sans font-black text-white/60 text-xs uppercase tracking-wider text-center w-16">Rank</th>
                    <th className="p-4 font-sans font-black text-white/60 text-xs uppercase tracking-wider">Crew Name</th>
                    <th className="p-4 font-sans font-black text-white/60 text-xs uppercase tracking-wider">Fleet</th>
                    <th className="p-4 font-sans font-black text-white/60 text-xs uppercase tracking-wider text-right">Fleet Bounty</th>
                    <th className="p-4 font-sans font-black text-white/60 text-xs uppercase tracking-wider text-center">Solved</th>
                    <th className="p-4 font-sans font-black text-white/60 text-xs uppercase tracking-wider text-right pr-6">Last Plunder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {[6, 7, 8, 9, 10].map((rank) => (
                    <tr key={rank} className="p-4">
                      <td className="p-4 text-center">
                        <span className="font-code font-bold text-white/40 text-xs">#{rank}</span>
                      </td>
                      <td className="p-4">
                        <div className="h-4 w-36 rounded bg-white/20" />
                      </td>
                      <td className="p-4">
                        <div className="h-4 w-20 rounded bg-white/10" />
                      </td>
                      <td className="p-4 text-right">
                        <div className="h-5 w-24 rounded bg-amber-400/20 ml-auto" />
                      </td>
                      <td className="p-4 text-center">
                        <div className="h-4 w-8 rounded bg-white/15 mx-auto" />
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="h-3 w-16 rounded bg-white/10 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
