import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BatchTier } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');

    const whereClause = (tier === 'FIRST_YEAR' || tier === 'SENIOR') 
      ? { batchTier: tier as BatchTier } 
      : {};

    // Get all teams
    const teams = await prisma.team.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        batchTier: true,
        submissions: {
          where: { isCorrect: true },
          select: { pointsAwarded: true, createdAt: true }
        },
        hintUnlocks: {
          select: { unlockedAt: true, hint: { select: { penaltyPoints: true } } }
        },
        scoreAdjustments: {
          select: { amount: true, createdAt: true }
        }
      }
    });

    const timelineTeams = teams.map(team => {
      const events: { timestamp: Date, amount: number }[] = [];
      
      team.submissions.forEach(sub => {
        events.push({ timestamp: sub.createdAt, amount: sub.pointsAwarded });
      });
      team.hintUnlocks.forEach(hu => {
        events.push({ timestamp: hu.unlockedAt, amount: -hu.hint.penaltyPoints });
      });
      team.scoreAdjustments.forEach(adj => {
        events.push({ timestamp: adj.createdAt, amount: adj.amount });
      });

      events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      let currentScore = 0;
      const dataPoints = events.map(event => {
        currentScore += event.amount;
        return {
          timestamp: event.timestamp.toISOString(),
          score: currentScore
        };
      });

      // Insert starting point if there are events
      if (dataPoints.length > 0) {
        // Start 1 second before first event
        const startPoint = {
           timestamp: new Date(new Date(dataPoints[0].timestamp).getTime() - 1000).toISOString(),
           score: 0
        };
        dataPoints.unshift(startPoint);
      } else {
        dataPoints.push({ timestamp: new Date().toISOString(), score: 0 });
      }

      return {
        teamId: team.id,
        teamName: team.name,
        batchTier: team.batchTier,
        totalScore: currentScore,
        dataPoints
      };
    });

    // Sort by totalScore desc and take top 10
    timelineTeams.sort((a, b) => b.totalScore - a.totalScore);
    const topTeams = timelineTeams.slice(0, 10);

    return NextResponse.json(
      { teams: topTeams },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Failed to generate timeline:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
