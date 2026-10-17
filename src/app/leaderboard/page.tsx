import React from 'react';
import { getCachedSession } from '@/lib/auth';
import { getLeaderboardData, type LeaderboardResult } from '@/lib/scoring';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import LeaderboardClient from './LeaderboardClient';
import { Anchor } from "@/components/icons";

export const revalidate = 120;

const teamNameCache = new Map<string, string>();

export default async function LeaderboardPage() {
  const session = await getCachedSession();
  const isAdmin = session?.user?.role === 'ORGANIZER';
  const userTeamId = session?.user?.teamId ?? null;

  let userTeamName: string | null = null;
  let data: LeaderboardResult | null = null;

  const teamPromise = (async () => {
    if (!userTeamId) return null;
    if (teamNameCache.has(userTeamId)) {
      return teamNameCache.get(userTeamId)!;
    }
    try {
      const cached = await redis.get(`team:name:${userTeamId}`);
      if (cached) {
        teamNameCache.set(userTeamId, cached);
        return cached;
      }
    } catch {
      // fallback
    }
    const team = await prisma.team.findUnique({
      where: { id: userTeamId },
      select: { name: true },
    }).catch(() => null);
    if (team?.name) {
      teamNameCache.set(userTeamId, team.name);
      try {
        void redis.set(`team:name:${userTeamId}`, team.name, "EX", 86400 * 7).catch(() => undefined);
      } catch {
        // ignore
      }
    }
    return team?.name ?? null;
  })();

  const leaderboardPromise = getLeaderboardData(undefined, isAdmin).catch((error) => {
    console.error("Leaderboard fetch error:", error);
    return null;
  });

  const [resolvedTeamName, resolvedData] = await Promise.all([
    teamPromise,
    leaderboardPromise,
  ]);

  userTeamName = resolvedTeamName;
  data = resolvedData;

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 flex items-center justify-center">
        <div className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-8 sm:p-10 shadow-2xl max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
            <Anchor className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black font-sans text-white mb-2 uppercase tracking-wide">Signal Lost</h2>
          <p className="font-code text-white/60 text-xs leading-relaxed">
            The transponder snail has lost connection to the fleet headquarters. Unable to fetch current bounties.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col items-center">
      {/* High-priority asset preload for the Wanted Poster torn parchment */}
      <link
        rel="preload"
        href="/images/wanted/poster_parchment_clean.webp"
        as="image"
        type="image/webp"
      />
      <LeaderboardClient
        initialData={data}
        isAdmin={isAdmin}
        userTeamId={userTeamId}
        userTeamName={userTeamName}
      />
    </div>
  );
}
