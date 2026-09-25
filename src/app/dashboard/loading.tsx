"use client";

import { Anchor } from "@/components/icons";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Flagship Header Skeleton */}
      <div className="h-52 rounded-2xl border border-[#d4af37]/35 bg-gradient-to-br from-[#24170f]/95 via-[#1a100a]/95 to-[#100a06]/98 p-8 flex items-center gap-6">
        <div className="w-28 h-28 rounded-2xl border-2 border-[#d4af37]/45 bg-[#1a110a] flex items-center justify-center">
          <Anchor className="w-10 h-10 text-[#d4af37]/30" />
        </div>
        <div className="space-y-3 flex-1">
          <div className="w-48 h-6 rounded-full bg-[#d4af37]/20" />
          <div className="w-72 h-10 rounded-lg bg-[#d4af37]/25" />
          <div className="w-96 h-4 rounded bg-[#f4e4be]/15" />
        </div>
      </div>

      {/* 4 Plunder Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl border border-[#d4af37]/25 bg-[#18110a]/80 p-5 flex flex-col justify-between"
          >
            <div className="w-24 h-3 rounded bg-[#f4e4be]/20" />
            <div className="w-32 h-8 rounded bg-[#d4af37]/25" />
            <div className="w-40 h-2.5 rounded bg-[#f4e4be]/10" />
          </div>
        ))}
      </div>

      {/* 2-Column Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-8 w-48 rounded bg-[#d4af37]/25" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-xl border-2 border-[#b45309]/30 bg-[#fdf5e2]/20 p-5 space-y-3"
              >
                <div className="w-24 h-4 rounded bg-[#b45309]/20" />
                <div className="w-32 h-6 rounded bg-[#24140b]/30" />
                <div className="w-28 h-3 rounded bg-[#5a3818]/20" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-8 w-40 rounded bg-[#d4af37]/25" />
          <div className="h-44 rounded-xl border border-[#d4af37]/20 bg-[#18110a]/70" />
        </div>
      </div>
    </div>
  );
}
