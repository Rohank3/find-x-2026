import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import {
  getTeamDashboardData,
  getAvailableTeams,
} from "@/lib/dashboardCache";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getCachedSession();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;
  let targetTeamId = session.user.teamId ?? null;

  // Fast single-field check if session cookie had no teamId but user was recently added
  if (!targetTeamId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });
    targetTeamId = dbUser?.teamId ?? null;
  }

  // =========================================================================
  // SCENARIO 1: User belongs to a Team (Flagship Command Deck)
  // Single-query consolidated fetch via Prisma relation joins + 3-tier cache
  // =========================================================================
  if (targetTeamId) {
    const teamData = await getTeamDashboardData(targetTeamId);

    if (teamData) {
      const userWithTeam = {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? session.user.email?.split("@")[0] ?? "Pirate",
        branch: session.user.branch,
        batchYear: session.user.batchYear,
        rollNumber: session.user.rollNumber,
        batchTier: session.user.batchTier,
        isFirstYear: session.user.isFirstYear,
        teamId: targetTeamId,
        team: teamData.team,
        joinRequests: [], // In-team members do not render outgoing join requests
      };

      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
          <DashboardClient
            user={userWithTeam}
            availableTeams={[]}
            pointHistory={teamData.pointHistory}
            scoreSummary={teamData.scoreSummary}
          />
        </div>
      );
    }

    // Edge case: targetTeamId in session was deleted/disbanded, fall through to recruitment deck
    targetTeamId = null;
  }

  // =========================================================================
  // SCENARIO 2: User has NO Team (Recruitment Deck)
  // Parallel fetch: user's outgoing requests + batch-tier cached open teams
  // =========================================================================
  const [userJoinRequests, openTeams] = await Promise.all([
    prisma.joinRequest.findMany({
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
      orderBy: { createdAt: "desc" },
    }),
    getAvailableTeams(session.user.batchTier),
  ]);

  const requestedMap = new Map(userJoinRequests.map((r) => [r.teamId, r.id]));

  const availableTeams = openTeams
    .filter((t) => t._count.members < 3)
    .map((t) => ({
      id: t.id,
      name: t.name,
      batchTier: t.batchTier,
      isFrozen: t.isFrozen,
      memberCount: t._count.members,
      hasRequested: requestedMap.has(t.id),
      requestId: requestedMap.get(t.id),
    }));

  const userWithTeam = {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? session.user.email?.split("@")[0] ?? "Pirate",
    branch: session.user.branch,
    batchYear: session.user.batchYear,
    rollNumber: session.user.rollNumber,
    batchTier: session.user.batchTier,
    isFirstYear: session.user.isFirstYear,
    teamId: null,
    team: null,
    joinRequests: userJoinRequests,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      <DashboardClient
        user={userWithTeam}
        availableTeams={availableTeams}
        pointHistory={[]}
        scoreSummary={{
          score: 0,
          totalGained: 0,
          totalPenalties: 0,
          totalAdjustments: 0,
        }}
      />
    </div>
  );
}
