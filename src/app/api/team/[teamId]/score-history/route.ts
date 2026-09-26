import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isValidEntityId } from '@/lib/utils';
import { getEffectiveSystemConfig } from '@/lib/competition';
 
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await params;
    
    if (!isValidEntityId(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID format' }, { status: 400 });
    }

    const [team, config] = await Promise.all([
      prisma.team.findUnique({
        where: { id: teamId },
        select: {
          id: true,
          name: true,
          batchTier: true,
          members: {
            select: {
              id: true,
              name: true,
              email: true,
              branch: true,
              batchYear: true,
            },
          },
        },
      }),
      getEffectiveSystemConfig().catch(() => null)
    ]);

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const isOrganizer = session.user.role === 'ORGANIZER';
    const isTeammate = session.user.teamId === teamId;

    const hideTeamNames = config?.hideTeamNames ?? false;
    const showPointHistory = config?.showPointHistory ?? true;

    if (!isOrganizer && (config?.competitionState ?? 'UPCOMING') === 'UPCOMING') {
      if (!isTeammate) {
        return NextResponse.json(
          { error: 'Score history is not accessible before the competition begins.' },
          { status: 403, headers: { 'Vary': 'Cookie', 'Cache-Control': 'private, no-cache, no-store' } }
        );
      }
      return NextResponse.json(
        {
          teamId: team.id,
          teamName: team.name,
          batchTier: team.batchTier,
          totalScore: 0,
          totalGained: 0,
          totalPenalties: 0,
          totalAdjustments: 0,
          members: team.members,
          isOrganizer,
          pointHistory: [],
        },
        {
          headers: { 'Vary': 'Cookie', 'Cache-Control': 'private, no-cache, no-store' },
        }
      );
    }

    if (!isOrganizer && !isTeammate && !showPointHistory) {
      return NextResponse.json(
        { error: 'Public score breakdown is disabled by the administrator.' },
        { status: 403 }
      );
    }
    
    const teamName = (hideTeamNames && !isOrganizer && !isTeammate) ? `Team ${teamId.substring(0, 5)}` : team.name;

    const isFrozen = config?.competitionState === 'FROZEN';
    const effectiveFreezeTime = config?.freezeTime ?? new Date();
    const freezeFilter = isFrozen && !isOrganizer && !isTeammate ? effectiveFreezeTime : null;

    const [submissions, hintUnlocks, adjustments] = await Promise.all([
      prisma.submission.findMany({
        where: {
          teamId,
          isCorrect: true,
          ...(freezeFilter ? { createdAt: { lte: freezeFilter } } : {}),
        },
        select: {
          pointsAwarded: true,
          createdAt: true,
          puzzle: { select: { title: true, orderIndex: true, basePoints: true } },
        },
      }),
      prisma.teamHintUnlock.findMany({
        where: {
          teamId,
          ...(freezeFilter ? { unlockedAt: { lte: freezeFilter } } : {}),
        },
        select: {
          unlockedAt: true,
          unlockedBy: { select: { name: true } },
          hint: {
            select: {
              penaltyPoints: true,
              puzzle: { select: { title: true, orderIndex: true } },
            },
          },
        },
      }),
      prisma.scoreAdjustment.findMany({
        where: {
          teamId,
          ...(freezeFilter ? { createdAt: { lte: freezeFilter } } : {}),
        },
        select: {
          amount: true,
          reason: true,
          createdAt: true,
          createdBy: { select: { name: true } },
        },
      }),
    ]);

    let totalGained = 0;
    let totalPenalties = 0;
    let totalAdjustments = 0;

    interface ScoreEvent {
      type: 'SOLVE' | 'HINT_PENALTY' | 'BONUS' | 'PENALTY';
      amount: number;
      description: string;
      timestamp: Date;
    }

    const events: ScoreEvent[] = [];

    submissions.forEach(sub => {
      const puzzleTitle = (isOrganizer || isTeammate)
        ? sub.puzzle.title
        : `Puzzle #${sub.puzzle.orderIndex}`;
      const solvePoints = sub.puzzle?.basePoints ?? sub.pointsAwarded;
      events.push({
        type: 'SOLVE',
        amount: solvePoints,
        description: `Solved ${puzzleTitle}`,
        timestamp: sub.createdAt
      });
      totalGained += solvePoints;
    });

    hintUnlocks.forEach(hu => {
      const puzzleTitle = (isOrganizer || isTeammate)
        ? hu.hint.puzzle.title
        : `Puzzle #${hu.hint.puzzle.orderIndex}`;
      const memberName = (isOrganizer || isTeammate)
        ? (hu.unlockedBy?.name || 'Teammate')
        : 'Teammate';
      events.push({
        type: 'HINT_PENALTY',
        amount: -hu.hint.penaltyPoints,
        description: `Hint used for ${puzzleTitle} (by ${memberName})`,
        timestamp: hu.unlockedAt
      });
      totalPenalties += hu.hint.penaltyPoints;
    });

    adjustments.forEach(adj => {
      const canSeeDetails = isOrganizer || isTeammate;
      const creatorName = canSeeDetails
        ? (adj.createdBy?.name || 'Organizer')
        : 'Organizer';
      const description = canSeeDetails
        ? `${adj.reason} (by ${creatorName})`
        : (adj.amount >= 0 ? 'Bonus Points Awarded' : 'Score Penalty Imposed');

      events.push({
        type: adj.amount >= 0 ? 'BONUS' : 'PENALTY',
        amount: adj.amount,
        description,
        timestamp: adj.createdAt
      });
      totalAdjustments += adj.amount;
    });

    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let currentScore = 0;
    const pointHistory = events.map(event => {
      currentScore += event.amount;
      return {
        ...event,
        scoreAfter: currentScore
      };
    });

    const canSeePrivateDetails = isOrganizer || isTeammate;

    const members = canSeePrivateDetails
      ? team.members.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          branch: m.branch,
          batchYear: m.batchYear,
        }))
      : [];

    return NextResponse.json(
      {
        teamId: team.id,
        teamName,
        batchTier: team.batchTier,
        totalScore: currentScore,
        totalGained,
        totalPenalties,
        totalAdjustments,
        members,
        isOrganizer,
        pointHistory,
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store',
          'Vary': 'Cookie',
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch score history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
