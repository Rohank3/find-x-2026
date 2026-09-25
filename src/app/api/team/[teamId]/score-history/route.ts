import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isValidEntityId } from '@/lib/utils';
 
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
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
      prisma.systemConfig.findUnique({ where: { id: 'default' } })
    ]);

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Hide team name if config enabled and viewer is not organizer
    const isOrganizer = session.user.role === 'ORGANIZER';
    const hideTeamNames = config?.hideTeamNames ?? false;
    
    const teamName = (hideTeamNames && !isOrganizer) ? `Team ${teamId.substring(0, 5)}` : team.name;

    const [submissions, hintUnlocks, adjustments] = await Promise.all([
      prisma.submission.findMany({
        where: { teamId, isCorrect: true },
        select: { pointsAwarded: true, createdAt: true, puzzle: { select: { title: true } } }
      }),
      prisma.teamHintUnlock.findMany({
        where: { teamId },
        select: { unlockedAt: true, unlockedBy: { select: { name: true } }, hint: { select: { penaltyPoints: true, puzzle: { select: { title: true } } } } }
      }),
      prisma.scoreAdjustment.findMany({
        where: { teamId },
        select: { amount: true, reason: true, createdAt: true, createdBy: { select: { name: true } } }
      })
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
      events.push({
        type: 'SOLVE',
        amount: sub.pointsAwarded,
        description: `Solved ${sub.puzzle.title}`,
        timestamp: sub.createdAt
      });
      totalGained += sub.pointsAwarded;
    });

    hintUnlocks.forEach(hu => {
      events.push({
        type: 'HINT_PENALTY',
        amount: -hu.hint.penaltyPoints,
        description: `Hint used for ${hu.hint.puzzle.title} (by ${hu.unlockedBy?.name || 'Teammate'})`,
        timestamp: hu.unlockedAt
      });
      totalPenalties += hu.hint.penaltyPoints;
    });

    adjustments.forEach(adj => {
      events.push({
        type: adj.amount >= 0 ? 'BONUS' : 'PENALTY',
        amount: adj.amount,
        description: `${adj.reason} (by ${adj.createdBy.name})`,
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

    const isTeammate = session.user.teamId === teamId;
    const canSeePrivateDetails = isOrganizer || isTeammate;

    const members = team.members.map(m => ({
      id: m.id,
      name: m.name,
      email: canSeePrivateDetails ? m.email : null,
      branch: m.branch,
      batchYear: m.batchYear,
    }));

    return NextResponse.json({
      teamId: team.id,
      teamName,
      batchTier: team.batchTier,
      totalScore: currentScore,
      totalGained,
      totalPenalties,
      totalAdjustments,
      members,
      isOrganizer,
      pointHistory
    });
  } catch (error) {
    console.error('Failed to fetch score history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
