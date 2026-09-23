import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLeaderboardData, type LeaderboardResult } from '@/lib/scoring';
import LeaderboardClient from './LeaderboardClient';
import { Anchor } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ORGANIZER';

  let data: LeaderboardResult | null = null;
  try {
    data = await getLeaderboardData(undefined, isAdmin);
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <div className="bg-voyage-ocean/50 border-2 border-voyage-crimson/50 p-8 rounded-lg max-w-md w-full text-center shadow-[0_0_30px_rgba(220,38,38,0.15)]">
          <Anchor className="w-16 h-16 text-voyage-crimson/80 mx-auto mb-6" />
          <h2 className="font-cinzel text-2xl text-amber-200 mb-4 uppercase">Signal Lost</h2>
          <p className="font-code text-amber-100/70 text-sm">
            The transponder snail has lost connection to the marine headquarters. Unable to fetch current bounties.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-amber-50 pt-24 pb-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/textures/parchment-noise.png')] opacity-5 pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-b from-voyage-ocean/20 to-transparent pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center">
        <div className="mb-12 text-center">
          <h1 className="font-pirata text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight mb-4 tracking-wide">
            Grand Line Bounties
          </h1>
          <p className="font-cinzel text-amber-400/80 text-lg md:text-xl tracking-widest uppercase">
            The Most Wanted Crews of the Grand Voyage
          </p>
          <div className="w-64 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mt-6" />
        </div>

        <LeaderboardClient initialData={data} />
      </div>
    </main>
  );
}
