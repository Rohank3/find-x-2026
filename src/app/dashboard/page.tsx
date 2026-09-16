import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeLedger, type LedgerEvent } from "@/lib/ledger";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  // Fetch fresh user record with team, members, and requests
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      team: {
        include: {
          members: {
            select: { id: true, name: true, email: true, branch: true, batchYear: true, rollNumber: true },
          },
          joinRequests: {
            include: {
              user: {
                select: { id: true, name: true, email: true, branch: true, batchYear: true, rollNumber: true, batchTier: true },
              },
            },
          },
          submissions: {
            where: { isCorrect: true },
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
          },
          hintUnlocks: {
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
          },
          scoreAdjustments: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      joinRequests: {
        include: {
          team: {
            select: { id: true, name: true, batchTier: true, isFrozen: true, _count: { select: { members: true } } },
          },
        },
      },
    },
  });

  if (!user) redirect("/auth/signin");

  // If user has no team, fetch available teams of same batch tier for broadcasting
  let availableTeams: Array<{
    id: string;
    name: string;
    batchTier: string;
    isFrozen: boolean;
    memberCount: number;
    hasRequested: boolean;
    requestId?: string;
  }> = [];

  if (!user.teamId) {
    const teams = await prisma.team.findMany({
      where: {
        batchTier: user.batchTier,
        isFrozen: false,
      },
      include: {
        _count: { select: { members: true } },
        joinRequests: {
          where: { userId },
          select: { id: true },
        },
      },
    });

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

  // Team point history & score summary — shared ledger implementation
  // (src/lib/ledger.ts), also used by the leaderboard scorer. Kept behavior-
  // identical: hint authors fall back to the unlocker's email prefix here.
  let pointHistory: LedgerEvent[] = [];
  let scoreSummary = {
    score: 0,
    totalGained: 0,
    totalPenalties: 0,
    totalAdjustments: 0,
  };

  if (user.team) {
    const ledger = computeLedger(user.team, {
      resolveHintAuthor: (actor) => actor?.name || actor?.email?.split("@")[0] || "Teammate",
    });
    pointHistory = ledger.pointHistory;
    scoreSummary = ledger.summary;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      <DashboardClient
        user={user}
        availableTeams={availableTeams}
        pointHistory={pointHistory}
        scoreSummary={scoreSummary}
      />
    </div>
  );
}
