import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEffectiveSystemConfig } from '@/lib/competition';
import { BatchTier } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

const VALID_TIERS = ['FIRST_YEAR', 'SENIOR'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tierParam = searchParams.get('tier');

    if (tierParam && !(VALID_TIERS as readonly string[]).includes(tierParam)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be FIRST_YEAR or SENIOR.' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const isOrganizer = session?.user?.role === 'ORGANIZER';
    const config = await getEffectiveSystemConfig().catch(() => null);

    // If competition is UPCOMING, non-organizers receive empty timeline
    if (!isOrganizer && (config?.competitionState ?? 'UPCOMING') === 'UPCOMING') {
      return NextResponse.json({ teams: [] }, { headers: { 'Vary': 'Cookie' } });
    }

    const showPointHistory = config?.showPointHistory ?? true;
    if (!isOrganizer && !showPointHistory) {
      return NextResponse.json(
        { teams: [] },
        { headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' } }
      );
    }

    const isFrozen = config?.competitionState === 'FROZEN';
    const effectiveFreezeTime = config?.freezeTime ?? new Date();
    const freezeFilter = isFrozen && !isOrganizer ? effectiveFreezeTime : null;
    const hideTeamNames = !isOrganizer && (config?.hideTeamNames ?? false);

    const whereClause = tierParam ? { batchTier: tierParam as BatchTier } : {};

    // Get all teams
    const teams = await prisma.team.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        batchTier: true,
        submissions: {
          where: {
            isCorrect: true,
            ...(freezeFilter ? { createdAt: { lte: freezeFilter } } : {}),
          },
          select: {
            pointsAwarded: true,
            createdAt: true,
            puzzle: { select: { basePoints: true } },
          },
        },
        hintUnlocks: {
          where: freezeFilter ? { unlockedAt: { lte: freezeFilter } } : undefined,
          select: { unlockedAt: true, hint: { select: { penaltyPoints: true } } },
        },
        scoreAdjustments: {
          where: freezeFilter ? { createdAt: { lte: freezeFilter } } : undefined,
          select: { amount: true, createdAt: true },
        },
      },
    });

    const calculatedTeams = teams.map((team) => {
      const events: { timestamp: Date; amount: number }[] = [];

      team.submissions.forEach((sub) => {
        const solvePoints = sub.puzzle?.basePoints ?? sub.pointsAwarded;
        events.push({ timestamp: sub.createdAt, amount: solvePoints });
      });
      team.hintUnlocks.forEach((hu) => {
        events.push({ timestamp: hu.unlockedAt, amount: -hu.hint.penaltyPoints });
      });
      team.scoreAdjustments.forEach((adj) => {
        events.push({ timestamp: adj.createdAt, amount: adj.amount });
      });

      events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      let currentScore = 0;
      const dataPoints = events.map((event) => {
        currentScore += event.amount;
        return {
          timestamp: event.timestamp.toISOString(),
          score: currentScore,
        };
      });

      // Insert starting point if there are events
      if (dataPoints.length > 0) {
        const startPoint = {
          timestamp: new Date(new Date(dataPoints[0].timestamp).getTime() - 1000).toISOString(),
          score: 0,
        };
        dataPoints.unshift(startPoint);
      } else {
        dataPoints.push({ timestamp: new Date().toISOString(), score: 0 });
      }

      return {
        rawTeam: team,
        totalScore: currentScore,
        dataPoints,
      };
    });

    // Sort by totalScore desc first so anonymous ranks 1..N match score podium
    calculatedTeams.sort((a, b) => b.totalScore - a.totalScore);

    const topTeams = calculatedTeams.slice(0, 10).map((item, index) => {
      const rank = index + 1;
      const teamName = hideTeamNames ? `Team #${rank.toString().padStart(2, '0')}` : item.rawTeam.name;
      const teamId = hideTeamNames ? `anon-${rank}` : item.rawTeam.id;

      return {
        teamId,
        teamName,
        batchTier: item.rawTeam.batchTier,
        totalScore: item.totalScore,
        dataPoints: item.dataPoints,
      };
    });

    return NextResponse.json(
      { teams: topTeams },
      {
        headers: {
          'Cache-Control': isOrganizer
            ? 'private, no-cache, no-store'
            : 'public, s-maxage=60, stale-while-revalidate=120',
          'Vary': 'Cookie',
        },
      }
    );
  } catch (error) {
    console.error('Failed to generate timeline:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
