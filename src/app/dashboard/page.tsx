import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeLedger, type LedgerEvent } from "@/lib/ledger";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

interface FullTeam {
  id: string;
  name: string;
  avatarUrl: string | null;
  batchTier: string;
  isFrozen: boolean;
  createdAt: Date;
  members: Array<{
    id: string;
    name: string | null;
    email: string;
    branch: string;
    batchYear: number;
    rollNumber: string;
  }>;
  joinRequests: Array<{
    id: string;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string;
      branch: string;
      batchYear: number;
      rollNumber: string;
      batchTier: string;
    };
  }>;
  submissions: Array<{
    id: string;
    createdAt: Date;
    pointsAwarded: number;
    puzzle: {
      id: string;
      orderIndex: number;
      title: string;
      basePoints: number;
    } | null;
  }>;
  hintUnlocks: Array<{
    id: string;
    unlockedAt: Date;
    hint: {
      id: string;
      orderIndex: number;
      penaltyPoints: number;
      puzzle: {
        orderIndex: number;
        title: string;
      } | null;
    } | null;
    unlockedBy: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  }>;
  scoreAdjustments: Array<{
    id: string;
    amount: number;
    reason: string;
    createdAt: Date;
    createdBy: {
      id: string;
      name: string | null;
    } | null;
  }>;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;
  const sessionTeamId = session.user.teamId;

  // Single-stage parallel fetch:
  // Instead of 19 sequential nested round-trips over TLS, dispatch all user and team
  // queries concurrently in a single Promise.all batch.
  const userPromise = prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      branch: true,
      batchYear: true,
      rollNumber: true,
      batchTier: true,
      isFirstYear: true,
      role: true,
      teamId: true,
    },
  });

  const userJoinRequestsPromise = prisma.joinRequest.findMany({
    where: { userId },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          batchTier: true,
          isFrozen: true,
          avatarUrl: true,
          _count: { select: { members: true } },
        },
      },
    },
  });

  let fullTeam: FullTeam | null = null;
  let availableTeams: Array<{
    id: string;
    name: string;
    batchTier: string;
    isFrozen: boolean;
    memberCount: number;
    hasRequested: boolean;
    requestId?: string;
  }> = [];

  // Determine team queries if user has a teamId in session
  const targetTeamId = sessionTeamId;

  if (targetTeamId) {
    const [
      user,
      userJoinRequests,
      teamRecord,
      members,
      teamJoinRequests,
      submissions,
      hintUnlocks,
      scoreAdjustments,
    ] = await Promise.all([
      userPromise,
      userJoinRequestsPromise,
      prisma.team.findUnique({
        where: { id: targetTeamId },
        select: {
          id: true,
          name: true,
          batchTier: true,
          isFrozen: true,
          avatarUrl: true,
          createdAt: true,
        },
      }),
      prisma.user.findMany({
        where: { teamId: targetTeamId },
        select: {
          id: true,
          name: true,
          email: true,
          branch: true,
          batchYear: true,
          rollNumber: true,
        },
      }),
      prisma.joinRequest.findMany({
        where: { teamId: targetTeamId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              branch: true,
              batchYear: true,
              rollNumber: true,
              batchTier: true,
            },
          },
        },
      }),
      prisma.submission.findMany({
        where: { teamId: targetTeamId, isCorrect: true },
        include: {
          puzzle: {
            select: {
              id: true,
              orderIndex: true,
              title: true,
              basePoints: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.teamHintUnlock.findMany({
        where: { teamId: targetTeamId },
        include: {
          hint: {
            select: {
              id: true,
              orderIndex: true,
              penaltyPoints: true,
              puzzle: {
                select: {
                  orderIndex: true,
                  title: true,
                },
              },
            },
          },
          unlockedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { unlockedAt: "asc" },
      }),
      prisma.scoreAdjustment.findMany({
        where: { teamId: targetTeamId },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (!user) redirect("/auth/signin");

    // If the database user's teamId matches targetTeamId
    if (user.teamId === targetTeamId && teamRecord) {
      fullTeam = {
        ...teamRecord,
        members,
        joinRequests: teamJoinRequests,
        submissions,
        hintUnlocks,
        scoreAdjustments,
      };
    } else if (user.teamId && user.teamId !== targetTeamId) {
      // Rare edge case: session cookie had stale teamId, fetch real team
      const fallbackTeam = await prisma.team.findUnique({
        where: { id: user.teamId },
        include: {
          members: { select: { id: true, name: true, email: true, branch: true, batchYear: true, rollNumber: true } },
          joinRequests: { include: { user: { select: { id: true, name: true, email: true, branch: true, batchYear: true, rollNumber: true, batchTier: true } } } },
          submissions: { where: { isCorrect: true }, include: { puzzle: { select: { id: true, orderIndex: true, title: true, basePoints: true } } }, orderBy: { createdAt: "asc" } },
          hintUnlocks: { include: { hint: { select: { id: true, orderIndex: true, penaltyPoints: true, puzzle: { select: { orderIndex: true, title: true } } } }, unlockedBy: { select: { id: true, name: true, email: true } } }, orderBy: { unlockedAt: "asc" } },
          scoreAdjustments: { include: { createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
        },
      });
      fullTeam = fallbackTeam;
    }

    // Assemble the complete user object
    const userWithTeam = {
      ...user,
      team: fullTeam,
      joinRequests: userJoinRequests,
    };

    let pointHistory: LedgerEvent[] = [];
    let scoreSummary = {
      score: 0,
      totalGained: 0,
      totalPenalties: 0,
      totalAdjustments: 0,
    };

    if (fullTeam) {
      const ledger = computeLedger(fullTeam, {
        resolveHintAuthor: (actor) => actor?.name || actor?.email?.split("@")[0] || "Teammate",
      });
      pointHistory = ledger.pointHistory;
      scoreSummary = ledger.summary;
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <DashboardClient
          user={userWithTeam}
          availableTeams={[]}
          pointHistory={pointHistory}
          scoreSummary={scoreSummary}
        />
      </div>
    );
  }

  // User has no team in session
  const [user, userJoinRequests, teams] = await Promise.all([
    userPromise,
    userJoinRequestsPromise,
    prisma.team.findMany({
      where: {
        batchTier: session.user.batchTier,
        isFrozen: false,
      },
      take: 24,
      include: {
        _count: { select: { members: true } },
        joinRequests: {
          where: { userId },
          select: { id: true },
        },
      },
    }),
  ]);

  if (!user) redirect("/auth/signin");

  if (user.teamId) {
    // Rare edge case: user joined a team on another device, fetch team
    const fallbackTeam = await prisma.team.findUnique({
      where: { id: user.teamId },
      include: {
        members: { select: { id: true, name: true, email: true, branch: true, batchYear: true, rollNumber: true } },
        joinRequests: { include: { user: { select: { id: true, name: true, email: true, branch: true, batchYear: true, rollNumber: true, batchTier: true } } } },
        submissions: { where: { isCorrect: true }, include: { puzzle: { select: { id: true, orderIndex: true, title: true, basePoints: true } } }, orderBy: { createdAt: "asc" } },
        hintUnlocks: { include: { hint: { select: { id: true, orderIndex: true, penaltyPoints: true, puzzle: { select: { orderIndex: true, title: true } } } }, unlockedBy: { select: { id: true, name: true, email: true } } }, orderBy: { unlockedAt: "asc" } },
        scoreAdjustments: { include: { createdBy: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      },
    });
    fullTeam = fallbackTeam;
  } else {
    availableTeams = teams
      .filter((t) => t._count.members < 3)
      .map((t) => ({
        id: t.id,
        name: t.name,
        batchTier: t.batchTier,
        isFrozen: t.isFrozen,
        memberCount: t._count.members,
        hasRequested: t.joinRequests.length > 0,
        requestId: t.joinRequests[0]?.id,
      }));
  }

  const userWithTeam = {
    ...user,
    team: fullTeam,
    joinRequests: userJoinRequests,
  };

  let pointHistory: LedgerEvent[] = [];
  let scoreSummary = {
    score: 0,
    totalGained: 0,
    totalPenalties: 0,
    totalAdjustments: 0,
  };

  if (fullTeam) {
    const ledger = computeLedger(fullTeam, {
      resolveHintAuthor: (actor) => actor?.name || actor?.email?.split("@")[0] || "Teammate",
    });
    pointHistory = ledger.pointHistory;
    scoreSummary = ledger.summary;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      <DashboardClient
        user={userWithTeam}
        availableTeams={availableTeams}
        pointHistory={pointHistory}
        scoreSummary={scoreSummary}
      />
    </div>
  );
}
